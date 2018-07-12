from flask import Flask, render_template, json, request
import networkx as nx
from networkx.readwrite import json_graph
import re, math, rdflib
import logging
from SPARQLWrapper import SPARQLWrapper, JSON

# @TODO divide this file into separate applications using FLASK blueprints

app = Flask(__name__)
nodeList = {}
termStrList = {}
reducedGraph = "static/data/reducedGraph.gpickle"
phlegra_graph = "static/data/actualG_mm.gpickle"
allTerms = "static/data/combCompositeTerms.tsv"
heuristicMappings = "static/data/heurCompositeTerms.tsv"
ontologyDescriptionFile = "static/data/ontologyDescriptions.json"
phlegra_entity_file = "static/data/entities_ids.json"
pageLength = 25

drug_dict = {}
adr_dict = {}
ent_dict = {}
url_dict = {"drugs": {"drugbank": "http://www.drugbank.ca/drugs/", "kegg": "http://www.genome.jp/dbget-bin/www_bget?dr:", "pharmgkb": "https://www.pharmgkb.org/chemical/"}, "genes": {"pharmgkb": "https://www.pharmgkb.org/gene/", "uniprot": "http://www.uniprot.org/uniprot/", "kegg": "http://www.kegg.jp/dbget-bin/www_bget?hsa:", "hgnc": "http://www.genenames.org/cgi-bin/gene_symbol_report?hgnc_id="}, "paths": {"kegg": "http://www.kegg.jp/kegg-bin/show_pathway?map="}, "dises": {"mesh": "http://www.nlm.nih.gov/cgi/mesh/2011/MB_cgi?field=uid&term="}}
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

def process_term_label(titleSet):
	conj_title = []
	for name in titleSet:
		term = name[1:-4] if name[len(name)-3:] == "@en" else name[1:-1]
		term = re.sub("[\(\[].*?[\)\]]", "", term).strip()
		conj_title.extend(term.split(";"))
	proc_title = set([x.strip() for x in conj_title])
	return list(proc_title)

def initiate_phlegra():
	PG = nx.read_gpickle(phlegra_graph)
	print "Read Graph"
	for node in PG.nodes():
		if PG.node[node]["type"] == "drugs":
			proc_title = process_term_label(PG.node[node]["title"])
			term = "; ".join(list(set([x.title() for x in proc_title])))
			drug_dict[term] = node
		if PG.node[node]["type"] == "dises":
			#proc_title = process_term_label(PG.node[node]["title"])
			proc_title = PG.node[node]["title"]
			term = "; ".join(list(set([x.title() for x in proc_title])))
			adr_dict[term] = node
	print "Read " + str(len(drug_dict)) + " Drugs"
	print "Read " + str(len(adr_dict)) + " Reactions"
	with open(phlegra_entity_file) as f:
		entities = json.load(f)
		print "read entity identifier list"
	return PG, entities

#PG, ent_dict = initiate_phlegra()

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


def search_phlegdict(term, mydict):
	output = []
	for key, value in mydict.iteritems():   # iter on both keys and values
		if term.lower() in key.lower():
			output.append({"id": value, "name": key})
		if len(output) > 10:
			break
	return output

cancerGraphFile = "static/data/tcga-pubmed/tcgaCancerGraphs.json"
sparqlConfigFile = "static/data/tcga-pubmed/sparqlConfig.json"

def initiate_tcgapubmed():
	with open(sparqlConfigFile) as f:
		sparqlConfig = json.load(f)
	with open(cancerGraphFile) as f:
		cancerGraphs = json.load(f)
	return sparqlConfig, cancerGraphs

#sparqlConfig, cancerGraphs = initiate_tcgapubmed()

@app.route("/")
def main():
	return render_template('about.html')

@app.route("/about")
def about():
	return render_template('about.html')

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
#	_termStr = termString
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
#	_termStr = termString
#	_degree = degree
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

#----- phlegra source code goes here
@app.route("/phlegra")
def phlegra():
	return render_template('phlegra/index.html')

@app.route("/phlegra/about")
def phlegra_about():
	return render_template('phlegra/about.html')

@app.route("/phlegra/get-drugs", methods=['GET'])
def phlegra_drugs():
	_termStr = request.args.get('q')
	output = search_phlegdict(_termStr, drug_dict)
	return json.dumps(output)

@app.route("/phlegra/get-adrs", methods=['GET'])
def phlegra_adrs():
	_termStr = request.args.get('q')
	output = search_phlegdict(_termStr, adr_dict)
	return json.dumps(output)

@app.route("/phlegra/search", methods=['POST'])
def phlegra_search():
	def get_node_info(node):
		print node
		phy_node = subG.node[node]
		phy_names = process_term_label(phy_node["title"])
		print phy_names
		name = min(phy_names, key=len) if len(phy_names) > 0 else node
		prname = name[0:10] + "..." if len(name) > 10 else name
		print prname
		blockC = curLayout[phy_node["type"]] if "type" in phy_node else 0
		blockH = int(blockC/interval)
		curLayout[phy_node["type"]] += 1
		xVal = curPos[phy_node["type"]] + blockH*blockX
		yVal = (blockC - blockH*interval)*blockY
		#print xVal, yVal
		ids = ent_dict[phy_node["type"]]["identifers"][node]
		prov_content = ""
		for prov in url_dict[phy_node["type"]]:
			for prov_id in ids[prov]:
				if prov == "pharmgkb" and phy_node["type"] == "drugs" and prov_id[0:2] != "PA":
					continue
				if prov == "kegg" and phy_node["type"] == "genes":
					prov_parts = prov_id.split("_")
					prov_id = prov_parts[len(prov_parts)-1]
				prov_content += "<b>" + prov.title() + "</b>: <a href='" +  url_dict[phy_node["type"]][prov] + prov_id + "' target='_blank'>" + prov_id + "</a><br>"
		if phy_node["type"] == "drugs":
			shape = "rectangle"
			color = "#F5A45D"
		elif phy_node["type"] == "genes":
			shape = "ellipse"
			color = "#86B342"
		elif phy_node["type"] == "paths":
			shape = "triangle"
			color = "#6FB1FC"
		elif phy_node["type"] == "dises":
			shape = "octagon"
			color = "#ad1a66"
		else:
			shape = "hexagon"
			color = "#ad1a66"
		hsize = math.log10(phy_node["hsize"])*10 if phy_node["hsize"] > 10 else 10
		vsize = math.log10(phy_node["vsize"])*10 if phy_node["vsize"] > 10 else 10
		return {"data": {"id": node, "label": prname, "shape": shape, "hsize": hsize, "vsize": vsize, "color": color}, "position": {"x": xVal, "y": yVal}, "content": {"name": name, "type": phy_node["type"].title(), "prov": prov_content}}
		#return {"id": node, "name": name, "source": list(set(phy_node["source"])), "type": phy_node["type"], "hsize": phy_node["hsize"], "vsize": phy_node["vsize"]}
	
	_drugs = request.form["drugs"].split(",")
	_adrs = request.form["adrs"].split(",")
	print _drugs, _adrs
	_scwidth = int(request.form["scwidth"])
	_scheight = int(request.form["scheight"])
	startX = 50
	startY = 50
	blockX = 100.0
	blockY = 100.0

	output = {"nodes": [], "edges": []}
	if len(_drugs) == 0 or len(_adrs) == 0:
		return json.dumps(output)
	subG = nx.DiGraph()
	drug_genes = set([])
	path_set_gene = set([])
	path_set_adr = set([])
	for drug in _drugs:
		print drug
		subG.add_node(drug, PG.node[drug], hsize=len(PG.in_edges(drug)), vsize=len(PG[drug]))
		for target in PG[drug]:
			print target
			edge_info = PG[drug][target]
			subG.add_node(target, PG.node[target], hsize=len(PG.in_edges(target)), vsize=len(PG[target]))
			subG.add_edge(drug, target, edge_info)
			drug_genes.add(target)
		for edge in PG.in_edges(drug):
			reg = edge[0]
			edge_info = PG[reg][drug]
			subG.add_node(reg, PG.node[reg], hsize=len(PG.in_edges(reg)), vsize=len(PG[reg]))
			subG.add_edge(reg, drug, edge_info)
			drug_genes.add(reg)
	for gene in drug_genes:
		for path in PG[gene]:
			if PG.node[path]["type"] != "paths":
				continue
			print path
			edge_info = PG[gene][path]
			subG.add_node(path, PG.node[path], hsize=len(PG.in_edges(path)), vsize=len(PG[path]))
			subG.add_edge(gene, path, edge_info)
			path_set_gene.add(path)
	for adr in _adrs:
		subG.add_node(adr, PG.node[adr], hsize=len(PG.in_edges(adr)), vsize=len(PG.in_edges(adr)))
		for edge in PG.in_edges(adr):
			if edge[0][0:4] == 'dise':
				continue
			path = edge[0]
			print path
			edge_info = PG[path][adr]
			subG.add_node(path, PG.node[path], hsize=len(PG.in_edges(path)), vsize=len(PG[path]))
			subG.add_edge(path, adr, edge_info)
			path_set_adr.add(path)
	common_path_set = path_set_adr & path_set_gene
	print common_path_set
	#for path_a in path_set:
	#	gene_seta = set([x[0] for x in PG.in_edges(path_a)])
	#	for path_b in path_set:
	#		gene_setb = set([x[0] for x in PG.in_edges(path_b)])
	#		common_gene_set = gene_seta & gene_setb
	#		if len(common_gene_set) > 0:
	#			subG.add_edge(path_a, path_b, type="path_common_genes", source=["kegg"], thick=len(common_gene_set))
	for node in subG.nodes():
		if subG.node[node]["type"] == "paths" and node not in common_path_set:
			subG.remove_node(node)
	for node in subG.nodes():
		if subG.node[node]["type"] == "genes" and len(subG[node]) == 0:
			subG.remove_node(node)

	total_nodes = {"drugs": 0, "genes": 0, "dises": 0, "paths": 0}
	for node in subG.nodes():
		total_nodes[subG.node[node]["type"]] += 1
	max_count = max(total_nodes.values())
	max_xrange = int(_scwidth/(3.0*100))
	interval = _scheight/blockY
	while (interval*max_xrange) < max_count:
		interval += 1
	curPos = {"drugs": startX, "genes": startX + _scwidth/6.0, "paths": startX + _scwidth/2.0, "dises": startX + _scwidth*5.0/6.0}
	curLayout = {"drugs": 0, "genes": 0, "dises": 0, "paths": 0}

	for node in subG.nodes():
		subG.node[node]["loc"] = len(output["nodes"])
		output["nodes"].append(get_node_info(node))
	for edge in subG.edges():
		edge_info = subG[edge[0]][edge[1]]
		thickness = math.log10(edge_info["thick"])*10 if "thick" in edge_info else 10
		if edge_info["type"] == "enzyme" or edge_info["type"] == "transporter":
			color = "#0000FF"
			output["nodes"][subG.node[edge[0]]["loc"]]["data"]["shape"] = "diamond"
		else:
			color = "#000000"
		output["edges"].append({"data": {"source": edge[0], "target": edge[1], "thickness": thickness, "color": color}, "content": {"name": "<b>" + output["nodes"][subG.node[edge[0]]["loc"]]["content"]["name"] + "</b> <i>" + edge_info["type"] + " </i><b>" + output["nodes"][subG.node[edge[1]]["loc"]]["content"]["name"] + "</b>"  , "prov": ", ".join([x.title() for x in set(edge_info["source"])])}})
		#output["edges"].append({"source": edge[0], "target": edge[1], "type": edge_info["type"], "prov": list(set(edge_info["source"])), "thick": thickness})
	return json.dumps(output)


#--------------------------------
# TCGA Pubmed application goes here
@app.route("/tcga-pubmed")
def tcgapubmed():
	return render_template('tcga-pubmed/index.html')

@app.route("/tcga-pubmed/about")
def tcgapubmed_about():
	return render_template('tcga-pubmed/about.html')

@app.route("/tcga-pubmed/makeRequest", methods=['GET'])
def tcgapubmed_sparqlQueries():
	# include other get param handling like patient, chromosome, graph, endpoint etc.
	_dataset = request.args.get('dataset')
	query = "".join(sparqlConfig[_dataset]["query"])
	endpoint = sparqlConfig[_dataset]["endpoint"]
	sparql = SPARQLWrapper(endpoint)
	sparql.setQuery(query)
	sparql.setReturnFormat(JSON)
	results = sparql.query().convert()
	return json.dumps(results)

@app.route("/tcga-pubmed/getGraphs")
def tcgapubmed_cancerGraphs():
	''' Instead of letting the client to directly query the graphs'''
	return json.dumps(cancerGraphs)

#--------------------------------
@app.route("/header")
def header():
	return render_template('header.html')

@app.route("/genomesnip")
def genomesnip():
	return render_template('genomesnip/about.html')

@app.route("/genomesnip/about")
def genomesnip_about():
	return render_template('genomesnip/about.html')

@app.route("/reveald")
def reveald():
	return render_template('reveald/about.html')

@app.route("/reveald/about")
def reveald_about():
	return render_template('reveald/about.html')

@app.route("/prism")
def prism():
	return render_template('prism/about.html')

@app.route("/prism/about")
def prism_about():
	return render_template('prism/about.html')

@app.route("/ebolakb")
def ebolakb():
	return render_template('ebolakb/about.html')

@app.route("/ebolakb/about")
def ebolakb_about():
	return render_template('ebolakb/about.html')

if __name__ == "__main__":
	app.run(host="0.0.0.0", port=8080)



