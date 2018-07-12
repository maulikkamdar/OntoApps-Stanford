from flask import Flask, Blueprint, render_template, json, request
from utils import FileUtils
import os, time, json

bionic = Blueprint('bionic', __name__, template_folder='templates')

fu = FileUtils()
onto_names = {}
with open("static/data/ontologyDescriptions.json") as f:
    ontoD = json.load(f)["results"]["bindings"]
    for k in ontoD:
        onto_names[k["acr"]["value"]] = k["name"]["value"]

def convert_bytes(num):
    for x in ['bytes', 'KB', 'MB', 'GB', 'TB']:
        if num < 1024.0:
            return "%3.1f %s" % (num, x)
        num /= 1024.0

def get_files_all_tsv(folder, dtype="stats"):
    fileset = fu.get_reqd_fileset(folder + "tsv/", lambda x: False if "tsv" in x else True)
    ap = []
    #print fileset
    for k in sorted(fileset):
        #t = time.ctime(os.path.getmtime(folder + k))
        s = convert_bytes(os.stat(folder + "tsv/" + k).st_size)
        rdf_file = folder + "rdf/" + k.split(".")[0] + ".hdt" if dtype == "stats" else folder + "rdf/" + k.split(".")[0] + "_seq.hdt"
        rdf_file_path = ""
        try:
            s_rdf = convert_bytes(os.stat(rdf_file).st_size)
            rdf_file_path = rdf_file
        except:
            s_rdf = 0
        kparts = k.split("_")
        onto_name = "_".join(kparts[0:len(kparts)-1]) if dtype == "stats" else "_".join(kparts[0:len(kparts)-1]) + "  (" + kparts[len(kparts)-1].split(".")[0].upper() + ")"
        onto_id = onto_name
        onto_name = onto_names[onto_name] if onto_name in onto_names else onto_name
        ap.append({"filename": k, "filepath": folder + "tsv/" + k, "size": s, "onto_name": onto_name, "onto_id": onto_id, "rdf_file_path": rdf_file_path, "rdf_size": s_rdf})
    return ap

@bionic.route("/bionic")
def bionic_def():
    return render_template("bionic/index.html")

@bionic.route("/bionic/statsdsets")
def statsdset():
    return json.dumps(get_files_all_tsv("static/data/bionic/statsdsets", dtype="stats"))

@bionic.route("/bionic/seqsdsets")
def seqdset():
    return json.dumps(get_files_all_tsv("static/data/bionic/seqsdsets", dtype="seqs"))

@bionic.route("/bionic/datasets")
def datasets():
    return render_template("bionic/datasets.html")

@bionic.route("/bionic/license")
def license():
    return render_template("bionic/license.html")
