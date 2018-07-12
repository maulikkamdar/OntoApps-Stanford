from flask import Flask, Blueprint, render_template, json, request
import networkx as nx
import pandas as pd
from utils import MatrixIO, FileUtils
import re, sys, os, time

first_cap_re = re.compile('(.)([A-Z][a-z]+)')
all_cap_re = re.compile('([a-z0-9])([A-Z])')

def parse_camel_case(name):
    s1 = first_cap_re.sub(r'\1_\2', name)
    return all_cap_re.sub(r'\1_\2', s1).lower()

def parse_uri_token(token):
    prop = parse_camel_case(token)
    pparts = re.split("[-_]", prop)
    name = " ".join([x.title() for x in pparts])
    return name

def parseURI(uri):
    nparts = re.split("[#:/]", uri)
    name = parse_uri_token(nparts[len(nparts)-1])
    return name

reveald2 = Blueprint('reveald2', __name__, template_folder='templates')
app = Flask(__name__)

classDiag = nx.read_gpickle("static/data/reveald2/ref_classDiag_touse.gpickle")
#print len(classDiag.nodes()), len(classDiag.edges())
mfio = MatrixIO()
best_grid_layout = mfio.load_matrix("static/data/reveald2/best_grid_layout_to_use.dat")
dset_ord = mfio.load_matrix("static/data/reveald2/dsets_group_pos.mat")

for dset in best_grid_layout:
    for node in best_grid_layout[dset]["nodes"]:
        best_grid_layout[dset]["nodes"][node]["refL1"] = parseURI(node)

#----- reveald2 get functions source code goes here
@reveald2.route("/reveald2/get_dset_groups")
def get_dset_groups():
    return json.dumps(dset_ord)

@reveald2.route("/reveald2/get_dset_graph", methods=['POST'])
def get_dsetgraph():
    dset = request.form['dset']
    return json.dumps(best_grid_layout[dset])

@reveald2.route("/reveald2")
def reveald2_main():
    return render_template('reveald2/index.html')

@reveald2.route("/reveald2/explorer")
def reveald2_explorer():
    return render_template('reveald2/explorer.html')

@reveald2.route("/reveald2/mapper")
def reveald2_mapper():
    return render_template('reveald2/mapper.html')

@reveald2.route("/reveald2/querier")
def reveald2_querier():
    return render_template('reveald2/querier.html')
