from flask import Flask, render_template, json, request
import networkx as nx
from networkx.readwrite import json_graph
import re, math, rdflib
import logging
from SPARQLWrapper import SPARQLWrapper, JSON


nodeList = {}
termStrList = {}
reducedGraph = "static/data/reducedGraph.gpickle"
allTerms = "static/data/combCompositeTerms.tsv"
heuristicMappings = "static/data/heurCompositeTerms.tsv"
ontologyDescriptionFile = "static/data/ontologyDescriptions.json"
pageLength = 25

#--- string retrieval funcitons 

stopWords = set([
    "a", "also", "although", "am", "an", "and", "are",
    "as", "at", "back", "be", "became", "because", "become",
    "becomes", "becoming", "been", "being", "bill", "both",
    "bottom", "but", "by", "call", "can", "con",
    "could", "de", "do", "done", "eg", "etc", "even", "ever", 
    "find", "for", "found", "from", "get", "give", "go",
    "had", "has", "have", "he", "her", "here", "hers", "herself", "him", "himself", "his",
    "how", "however", "if", "in", "inc", 
    "into", "is", "it", "its", "itself", "keep", "may", "me", "mine", "my", "myself", "name", "namely", "of", "onto", "our",
    "ours", "ourselves", "please", "put", "should", "show", "such", "take", "that", "the", "their", "them",
    "themselves", "these", "they", "this", "those", "though",
    "thru", "to", "us", "via", "was", "we", "were", "what", "whatever", "when",
    "whence", "whenever", "where", "whereafter", "whereas", "whereby",
    "wherein", "whereupon", "wherever", "whether", "which", "whither",
    "who", "whoever", "whom", "whose", "why", "will", "would", "yet", "you", "your", "yours", "yourself", "yourselves"])


ontoStructsFileLoc = "static/data/structFile.tsv"
ontoBPStructsFileLoc = "static/data/all_onto_struct_file.tsv"
finalVizFileobo = "static/data/vizFile.tsv"
finalVizFileumls = "static/data/vizFile2.tsv"
ontoStructs = {}
ontologyMetadata = {}

def readOntologyMetadata(): 
    with open(ontologyDescriptionFile) as data_file:    
        ontologyDescriptions = json.load(data_file)
        bindings = ontologyDescriptions["results"]["bindings"]
        for k in range(len(bindings)):
            ontologyMetadata[bindings[k]["acr"]["value"]] = {"name": bindings[k]["name"]["value"], "descriptors": bindings[k]["desc"]["value"]}

def normalize(word):
    word = word.replace('\n', ' ').lower()
    word = re.sub('[^0-9a-zA-Z]+', " ", word)
    vec1 = re.split("\\s+", word)
    vec1 = [x for x in vec1 if x not in stopWords]
    return vec1

def almostAssocTerms(word):
    maxSim = 0.0
    currentMax = None
    wordParts = word.strip().split()
    for term in termStrList:
        termParts = term.split()
        union = list(set(wordParts) | set(termParts))
        if len(union) > 0:
            sim = float(len(list(set(wordParts) & set(termParts))))/len(union)
            if sim >= maxSim:
                maxSim = sim
                currentMax = term
    return (termStrList[term][0].split(":-::-:"), termStrList[term][1].split(":-::-:")) #modify this

def getIrisTypes(_termStr):
    normalizedVector = normalize(_termStr)
    normalizedWord = " ".join(sorted(normalizedVector)).lower().strip()
    if normalizedWord in termStrList:
        iris = termStrList[normalizedWord][0].split(":-::-:")
        termTypes = termStrList[normalizedWord][1].split(":-::-:")
    else:
        (iris, termTypes) = almostAssocTerms(normalizedWord)
    return (iris, termTypes)

def checkTermType(_termStr):
    if _termStr[0:4] == "http":
        _termType = "iri"
        if nodeList.get(_termStr):
            compositeTerm = compositeMappings[nodeList[_termStr]].strip().split("\t")
            labels = compositeTerm[2].strip().split(":-:") if len(compositeTerm) > 2 else []
            #print labels
            iris = []
            termTypes = []
            for k in range(len(labels)):
                (singIris, singTypes) = getIrisTypes(labels[k])
                iris.extend(singIris)
                termTypes.extend(singTypes)
        else: # No node found with matching IRI
            return ([], [])
    else:
        _termType = "string"
        (iris, termTypes) = getIrisTypes(_termStr)
    return (iris, termTypes)

def initiate_main():
    SG = nx.read_gpickle(reducedGraph)
    print "Read Graph"
    compositeFile = open(allTerms)
    compositeMappings = compositeFile.readlines()
    compositeFile.close()
    ##mappedFile using Heuristics
    heurFile = open(heuristicMappings)
    heurMappings = heurFile.readlines()
    heurFile.close()
    for k in range(len(compositeMappings)):
        if k == 0: 
            continue
        #print k
        compositeParams = compositeMappings[k].strip().split("\t")
        nodeList[compositeParams[0]] = k
    print "Completed reading composite information"

    for k in range(len(heurMappings)):
        if k == 0:
            continue
        heurParams = heurMappings[k].strip().split("\t")
        termStrList[heurParams[0]] = (heurParams[1], heurParams[3])

    print "Read all classes information and heuristic mappings"
    readOntologyMetadata()
    print "Read Ontology Metadata"
    return SG, compositeMappings

#SG, compositeMappings = initiate_main()

def genLogGraph(vizFileName):
    vizFile = open(vizFileName)
    vizLines = vizFile.readlines()
    vizFile.close()
    ontoStructsFile = open(ontoStructsFileLoc)
    ontoStructsLines = ontoStructsFile.readlines()
    ontoStructsFile.close()
    jsonStruct = {}
    for k in range(len(ontoStructsLines)):
        ontoStructParams = ontoStructsLines[k].strip().split("\t")
        #print json.loads(ontoStructParams[1].replace("'", "\""))
        ontoStructs[ontoStructParams[0]] = {"noStructs": json.loads(ontoStructParams[2].replace("'", "\"")), "noSingles": json.loads(ontoStructParams[1].replace("'", "\""))}
    #print len(ontoStructs)
    for k in range(len(vizLines)):
        vizParams = vizLines[k].strip().split("\t") 
        print vizParams
        jsonStruct[vizParams[0]] = {"sessions": int(vizParams[1]), "singles": int(vizParams[2]), "structs": int(vizParams[3]), "total": int(vizParams[4]), "maxDepth": int(vizParams[5]), "noStructs": ontoStructs[vizParams[0]]["noStructs"], "noSingles": ontoStructs[vizParams[0]]["noSingles"]}
    return jsonStruct

def genBPGraph():
    ontoStructsFile = open(ontoBPStructsFileLoc)
    ontoStructsLines = ontoStructsFile.readlines()
    ontoStructsFile.close()
    ontoStructs = {}
    for k in range(len(ontoStructsLines)):
        if k > 7: break
        ontoStructParams = ontoStructsLines[k].strip().split("\t")
        ontoStructs[k] = {"noStructs": json.loads(ontoStructParams[2].replace("'", "\"")), "onto": ontoStructParams[0], "noSingles": json.loads(ontoStructParams[1].replace("'", "\""))}
    #print len(ontoStructs)
    return ontoStructs


def genBPGraph2():
    ontoStructsFile = open(ontoBPStructsFileLoc)
    ontoStructsLines = ontoStructsFile.readlines()
    ontoStructsFile.close()
    ontoStructs = {}
    for k in range(len(ontoStructsLines)):
        if k < 6: continue
        ontoStructParams = ontoStructsLines[k].strip().split("\t")
        ontoStructs[k] = {"noStructs": json.loads(ontoStructParams[2].replace("'", "\"")), "onto": ontoStructParams[0], "noSingles": json.loads(ontoStructParams[1].replace("'", "\""))}
    #print len(ontoStructs)
    return ontoStructs

@app.route("/ontoreuse")
def sim():
    return render_template('ontoreuse/index.html')

@app.route("/ontoreuse/about")
def ontoreuse_about():
    return render_template('ontoreuse/about.html')

@app.route("/ontoreuse/reuseViz")
def reuseViz():
    return render_template('ontoreuse/reuseViz.html')

@app.route("/ontoreuse/overlapViz")
def overlapViz():
    return render_template('ontoreuse/overlapViz.html')

@app.route("/ontoreuse/data")
def data():
    return render_template('ontoreuse/data.html')

@app.route("/ontoreuse/bplogs")
def bplogs():
    return render_template('ontoreuse/bplogs.html')

@app.route('/ontoreuse/logStatsObo', methods=['GET'])
def logStatsObo():
    output = genLogGraph(finalVizFileobo)
    return json.dumps(output)

@app.route('/ontoreuse/logStatsUmls', methods=['GET'])
def logStatsUmls():
    output = genLogGraph(finalVizFileumls)
    return json.dumps(output)

@app.route('/ontoreuse/logStatsBP', methods=['GET'])
def logStatsBP():
    output = genBPGraph()
    return json.dumps(output)

@app.route('/ontoreuse/logStatsBP2', methods=['GET'])
def logStatsBP2():
    output = genBPGraph2()
    return json.dumps(output)

@app.route('/ontoreuse/similarTerms', methods=['POST'])
def similarTerms():
    _termStr = request.form['termString']
#def similarTerms(termString):
#   _termStr = termString
    (iris, termTypes) = checkTermType(_termStr)
    currentList = {}
    for k in range(len(iris)):
        currentType = "A" + termTypes[k]
        currentList[nodeList[iris[k]]] = {"degree": 1, "type": currentType, "compositeMappings": compositeMappings[nodeList[iris[k]]]} 
        for node in SG[nodeList[iris[k]]]:
            nodeInfo = SG[nodeList[iris[k]]][node]
            nodeType = currentType + nodeInfo["type"]
            if node not in currentList:
                currentList[node] = {"type": nodeType, "content": nodeInfo["content"], "degree": 2, "compositeMappings": compositeMappings[node]}
            elif nodeType < currentList[node]["type"] and currentList[node]["degree"] > 1:
                    currentList[node]["type"] = nodeType
                    currentList[node]["content"] = nodeInfo["content"]
    output = {}
    for node in currentList:
        identifer = str(currentList[node]["degree"]) + currentList[node]["type"]
        compositeParams = currentList[node]["compositeMappings"].strip().split("\t")
        if identifer in output: 
            output[identifer].append({"index" : node, "compositeParams": compositeParams})
        else:
            output[identifer] = [{"index" : node, "compositeParams": compositeParams}]
    return json.dumps(output)
    #return output

@app.route('/ontoreuse/similarTermsGraph', methods=['POST'])
def similarTermsGraph():
    _termStr = request.form['termString']
    _degree = int(request.form['degree'])
#def similarTermsGraph(termString, degree):
#   _termStr = termString
#   _degree = degree
    (iris, termTypes) = checkTermType(_termStr)
    redG = nx.Graph()
    redG.add_node(0, type="search", completed=1, label=_termStr, size=20, descriptors="Searched Term: " + _termStr, name=_termStr)
    layerCount = 1
    graphOntologies = {}
    for k in range(len(iris)):
        currentType = "A" + termTypes[k]
        nodeInfo = compositeMappings[nodeList[iris[k]]].strip().split("\t")
        ontologies = nodeInfo[1].split(":-:")
        for onto in ontologies:
            if not onto in graphOntologies:
                graphOntologies[onto] = [nodeList[iris[k]]]
            else:
                graphOntologies[onto].append(nodeList[iris[k]])
        nodeParams = nodeInfo[2].split(":-:")
        redG.add_node(nodeList[iris[k]], type="iri", completed=0, label=iris[k], size=5, name=nodeParams[0], descriptors="<b>IRI: </b>" + iris[k]+"<br><b>Other Labels: </b>" + ", ".join(nodeParams) + "<br><b>Ontologies :</b>" + ", ".join(ontologies))
        redG.add_edge(0, nodeList[iris[k]], type=currentType, width=2)
    #logging.info("generated a list of " + str(len(iris)))
    while True:
        if layerCount >= _degree:
            break
        else:
            #logging.info("On Layer" + str(layerCount))
            layerCount = layerCount + 1
        compG = nx.Graph()
        for n,d in redG.nodes_iter(data=True):
            if d['completed'] == 1:
                continue
            for node in SG[n]:
                if not redG.has_node(node):
                    nodeInfo = compositeMappings[node].strip().split("\t")
                    ontologies = nodeInfo[1].split(":-:")
                    for onto in ontologies:
                        if not onto in graphOntologies:
                            graphOntologies[onto] = [node]
                        else:
                            graphOntologies[onto].append(node)
                    nodeParams = nodeInfo[2].split(":-:")
                    compG.add_node(node, type="iri", completed=0, label=nodeInfo[0], size=5, name=nodeParams[0], descriptors="<b>IRI: </b>" + nodeInfo[0]+"<br><b>Other Labels: </b>" + ", ".join(nodeParams) + "<br><b>Ontologies :</b>" + ", ".join(ontologies))
                compG.add_edge(n, node, type=SG[n][node]["type"], width=1)
            redG.node[n]["completed"] = 1
        redG.add_nodes_from(compG.nodes(data=True))
        redG.add_edges_from(compG.edges(data=True))
        
    for onto in graphOntologies:
        if onto in ontologyMetadata:
            descriptors = ontologyMetadata[onto]["descriptors"]
            name = ontologyMetadata[onto]["name"]
        else:
            descriptors = ""
            name = onto
        redG.add_node(onto, label=onto, size=10, type="onto", descriptors=descriptors, name=name)
        for node in graphOntologies[onto]:
            redG.add_edge(onto, node, type="O", width=2)
    d = json_graph.node_link_data(redG)
    #path = "static/overlapGraphs/" + str(time.time()) + "_" + _termStr + "_" + str(_degree) + ".gexf"
    #nx.write_gexf(redG, path)
    return json.dumps(d)

#similarTermsGraph("cardiac", 2)


