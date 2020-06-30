from flask import Flask, Blueprint, render_template, json, request
from utils import FileUtils
import os, time, json
import rdflib

ebolakb = Blueprint('ebolakb', __name__, template_folder='templates')
app = Flask(__name__)

ebola_data_folder = "static/data/ebolakb/"

a = time.time()
g = rdflib.Graph()
g.parse(ebola_data_folder + "ebola_main.ttl", format="turtle")
print (len(g), "Triples found, ", time.time()-a, " Time taken")

def execute_sparql(sparql_q, _id=None):
    res_array = []
    with open(ebola_data_folder + "queries/" + sparql_q + ".sparql") as f: 
        query = f.read()
    if _id:
        print (_id)
        query = query.replace("ID", _id)
    print (query)
    qres = g.query(query)

    for row in qres:
        nr = []
        for m in row:
            if m: nr.append(m.n3())
            else: nr.append("")
        res_array.append(nr)
    return res_array, query

@ebolakb.route("/ebolakb")
def ebolakb_dashboard():
    return render_template('ebolakb/index.html')

@ebolakb.route("/ebolakb/about")
def ebolakb_about():
    return render_template('ebolakb/about.html')

@ebolakb.route("/ebolakb/howto")
def ebolakb_howto():
    return render_template('ebolakb/howto.html')

@ebolakb.route("/ebolakb/getdata")
def ebolakb_getdata():
    dataType = request.args.get('dataType', '')
    _id = request.args.get('id', None)
    try:
        res_array, query = execute_sparql(dataType, _id) if _id else execute_sparql(dataType)
        resp = {"query": query, "results": res_array, "error": ""}
    except:
        resp = {"query": "", "results": "", "error": "Execution error - " + dataType}
    return json.dumps(resp)
