from flask import Flask, Blueprint, render_template, json, request
import networkx as nx
import re


genomesnip = Blueprint('genomesnip', __name__, template_folder='templates')
app = Flask(__name__)

edges = {}
communities = {}
G = None
nodeIdentifers = {}
nodeNames = {}
nodeList = open("static/data/genomesnip/allregions_rownames.txt")
nodeLines = nodeList.readlines()
nodeList.close()
count = 0

for k in range(len(nodeLines)):
    nodeIdentifers[str(count)] = nodeLines[k].strip()
    nodeNames[nodeLines[k].strip()] = str(count)
    count = count + 1

def genEdges(iterNo):
    global edges
    edges = {}
    edgeList = open("static/data/genomesnip/edges/combined_edges" + iterNo + ".txt")
    edgeLines = edgeList.readlines()
    edgeList.close()
    for k in range(len(edgeLines)):
        edgeParams = edgeLines[k].strip().split("\t")
        if nodeNames[edgeParams[1]] in edges:
            edges[nodeNames[edgeParams[1]]]["edges"].append({"id": nodeNames[edgeParams[0]], "wt": int(edgeParams[2])})
        else:
            edges[nodeNames[edgeParams[1]]] = {"edges": [{"id": nodeNames[edgeParams[0]], "wt": int(edgeParams[2])}], "community": 0}
        if nodeNames[edgeParams[0]] in edges:
            edges[nodeNames[edgeParams[0]]]["edges"].append({"id": nodeNames[edgeParams[1]], "wt": int(edgeParams[2])})
        else:
            edges[nodeNames[edgeParams[0]]] = {"edges": [{"id": nodeNames[edgeParams[1]], "wt": int(edgeParams[2])}], "community": 0}
    print "read edge list"

def genCommunitiesNetwork(iterNo):
    global G
    G = nx.read_gpickle("static/data/genomesnip/communities/results2" + iterNo + "_community.gpickle")
    output = [{"id": node, "nodes": G.node[node]["enhProms"], "length": len(G.node[node]["enhProms"])} for node in G.nodes() if len(G.node[node]["enhProms"]) > 1]
    return sorted(output, reverse=True, key=lambda k: k['length']) 

def getNodeList():
    nodes = []
    for community in G.nodes():
        for x in G.node[community]["enhProms"]:
            nodes.append({"id": x, "name": nodeIdentifers[x]})
            edges[x]["community"] = community
    return nodes

genEdges("_orig")
communityNetwork = genCommunitiesNetwork("_orig")
nodeIds = getNodeList()
currentRound = "_orig"
    
@genomesnip.route("/genomesnip")
def genomesnip_main():
    global currentRound
    global communityNetwork
    global nodeIds
    if currentRound != "_orig":
        print "here"
        genEdges("_orig")
        communityNetwork = genCommunitiesNetwork("_orig")
        nodeIds = getNodeList()
        currentRound = "_orig"
    return render_template('genomesnip/index.html')

@genomesnip.route("/genomesnip-update", methods=['GET'])
def update():
    global communityNetwork
    global nodeIds
    global currentRound
    iteration = request.args.get('iter')
    print iteration
    genEdges(str(iteration))
    communityNetwork = genCommunitiesNetwork(str(iteration))
    nodeIds = getNodeList()
    currentRound = iteration
    return render_template('genomesnip/index.html')

@genomesnip.route('/genomesnip/communities', methods=['GET'])
def getCommunities():
    #iteration = request.args.get('iter')
    output = communityNetwork
    #if int(iteration) > -1:
    #   output = genCommunitiesNetwork(iteration)
    return json.dumps(output)

@genomesnip.route('/genomesnip/nodes', methods=['GET'])
def getNodes():
    output = nodeIds
    return json.dumps(output)

@genomesnip.route('/genomesnip/regRegionCom', methods=['GET'])
def getRegRegionCom():
    regRegion = request.args.get('id')
    if regRegion in edges: 
        regEdges = edges[regRegion]["edges"]
        regCom = [edges[regRegion]["community"]]
        for k in range(len(regEdges)):
            if not edges[regEdges[k]["id"]]["community"] in regCom:
                regCom.append(edges[regEdges[k]["id"]]["community"])
        result = {"communities": regCom, "edges": regEdges}
        return json.dumps(result)
    else:
        return json.dumps({"edges": [], "communities": []})

@genomesnip.route('/genomesnip/regRegionEdge', methods=['GET'])
def getRegRegionEdge():
    regRegion = request.args.get('id')
    edgeSet = {}
    if regRegion in edges: 
        regEdges = edges[regRegion]["edges"]
        edgeSet[edges[regRegion]["community"]] = []
        for k in range(len(regEdges)):
            if not edges[regEdges[k]["id"]]["community"] in edgeSet:
                edgeSet[edges[regEdges[k]["id"]]["community"]] = [regEdges[k]]
            else:
                edgeSet[edges[regRegion]["community"]].append(regEdges[k])
        return json.dumps(edgeSet)
    else:
        return json.dumps({})

@genomesnip.route("/genomesnip/about")
def genomesnip_about():
    return render_template('genomesnip/about.html')