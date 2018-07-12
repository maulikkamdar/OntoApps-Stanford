from flask import Flask, Blueprint, render_template, json, request
import networkx as nx
from networkx.readwrite import json_graph
import re, math

phlegra = Blueprint('phlegra', __name__, template_folder='templates')
app = Flask(__name__)

phlegra_graph = "static/data/reduced-digraph-faers.gpickle"
phlegra_entity_file = "static/data/entities_ids.json"
drug_dict = {}
adr_dict = {}
ent_dict = {}
url_dict = {"drugs": {"drugbank": "http://www.drugbank.ca/drugs/", "kegg": "http://www.genome.jp/dbget-bin/www_bget?dr:", "pharmgkb": "https://www.pharmgkb.org/chemical/"}, "genes": {"pharmgkb": "https://www.pharmgkb.org/gene/", "uniprot": "http://www.uniprot.org/uniprot/", "kegg": "http://www.kegg.jp/dbget-bin/www_bget?hsa:", "hgnc": "http://www.genenames.org/cgi-bin/gene_symbol_report?hgnc_id="}, "paths": {"kegg": "http://www.kegg.jp/kegg-bin/show_pathway?map="}, "dises": {"mesh": "http://www.nlm.nih.gov/cgi/mesh/2011/MB_cgi?field=uid&term="}}


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

PG, ent_dict = initiate_phlegra()
#print ent_dict["dises"]["identifers"]

def search_phlegdict(term, mydict):
    output = []
    for key, value in mydict.iteritems():   # iter on both keys and values
        if term.lower() in key.lower():
            output.append({"id": value, "name": key})
        if len(output) > 10:
            break
    return output

#----- phlegra source code goes here
@phlegra.route("/phlegra")
def phlegra_main():
    return render_template('phlegra/index.html')

@phlegra.route("/phlegra/about")
def phlegra_about():
    return render_template('phlegra/about.html')

@phlegra.route("/phlegra/get-drugs", methods=['GET'])
def phlegra_drugs():
    _termStr = request.args.get('q')
    output = search_phlegdict(_termStr, drug_dict)
    return json.dumps(output)

@phlegra.route("/phlegra/get-adrs", methods=['GET'])
def phlegra_adrs():
    _termStr = request.args.get('q')
    output = search_phlegdict(_termStr, adr_dict)
    return json.dumps(output)

@phlegra.route("/phlegra/search", methods=['POST'])
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
        print phy_node
        xVal = curPos[phy_node["type"]] + blockH*blockX
        yVal = (blockC - blockH*interval)*blockY
        #print xVal, yVal
        print node
        print node in ent_dict[phy_node["type"]]["identifers"]
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
        print hsize, vsize
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
        #print drug
        subG.add_node(drug, PG.node[drug], hsize=len(PG.in_edges(drug)), vsize=len(PG[drug]))
        for target in PG[drug]:
            #print target
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
            #print path
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
            #sprint path
            edge_info = PG[path][adr]
            subG.add_node(path, PG.node[path], hsize=len(PG.in_edges(path)), vsize=len(PG[path]))
            subG.add_edge(path, adr, edge_info)
            path_set_adr.add(path)
    common_path_set = path_set_adr & path_set_gene
    print common_path_set
    #for path_a in path_set:
    #   gene_seta = set([x[0] for x in PG.in_edges(path_a)])
    #   for path_b in path_set:
    #       gene_setb = set([x[0] for x in PG.in_edges(path_b)])
    #       common_gene_set = gene_seta & gene_setb
    #       if len(common_gene_set) > 0:
    #           subG.add_edge(path_a, path_b, type="path_common_genes", source=["kegg"], thick=len(common_gene_set))
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

    print len(subG.nodes())
    for node in subG.nodes():
        subG.node[node]["loc"] = len(output["nodes"])
        output["nodes"].append(get_node_info(node))
    print len(subG.edges())
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
    print output
    return json.dumps(output)