from flask import Flask, Blueprint, render_template, json, request

tcga = Blueprint('tcga', __name__, template_folder='templates')
app = Flask(__name__)

cancerGraphFile = "static/data/tcga-pubmed/tcgaCancerGraphs.json"
sparqlConfigFile = "static/data/tcga-pubmed/sparqlConfig.json"

def initiate_tcgapubmed():
    with open(sparqlConfigFile) as f:
        sparqlConfig = json.load(f)
    with open(cancerGraphFile) as f:
        cancerGraphs = json.load(f)
    return sparqlConfig, cancerGraphs

#sparqlConfig, cancerGraphs = initiate_tcgapubmed()

#--------------------------------
# TCGA Pubmed application goes here
@tcga.route("/tcga-pubmed")
def tcgapubmed():
    return render_template('tcga-pubmed/index.html')

@tcga.route("/tcga-pubmed/about")
def tcgapubmed_about():
    return render_template('tcga-pubmed/about.html')

@tcga.route("/tcga-pubmed/makeRequest", methods=['GET'])
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

@tcga.route("/tcga-pubmed/getGraphs")
def tcgapubmed_cancerGraphs():
    ''' Instead of letting the client to directly query the graphs'''
    return json.dumps(cancerGraphs)