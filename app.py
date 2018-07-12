from flask import Flask, render_template, json, request
import networkx as nx
from networkx.readwrite import json_graph
import re, math, rdflib
import logging
from SPARQLWrapper import SPARQLWrapper, JSON

from ontoreuseapp.ontoreuse import ontoreuse
from visionapp.vision import vision
from bionicapp.bionic import bionic
from phlegraapp.phlegra import phlegra
from m3app.m3crnn import m3crnn
from presenceapp.presence import presence
from prismapp.prism import prism
from genomesnipapp.genomesnip import genomesnip
from reveald2app.reveald2 import reveald2
from lslodminerapp.lslodminer import lslodminer
from revealdapp.reveald import reveald

app = Flask(__name__)
app.register_blueprint(ontoreuse)
app.register_blueprint(vision)
app.register_blueprint(bionic)
app.register_blueprint(m3crnn)
app.register_blueprint(phlegra)
app.register_blueprint(presence)
app.register_blueprint(prism)
app.register_blueprint(genomesnip)
app.register_blueprint(reveald)
app.register_blueprint(reveald2)
app.register_blueprint(lslodminer)


#--------------------------------
@app.route("/")
def main():
    return render_template('about.html')

@app.route("/about")
def about():
    return render_template('about.html')

@app.route("/header")
def header():
	return render_template('header.html')

@app.route("/ebolakb")
def ebolakb():
	return render_template('ebolakb/about.html')

@app.route("/ebolakb/about")
def ebolakb_about():
	return render_template('ebolakb/about.html')

if __name__ == "__main__":
	app.run(host="0.0.0.0", port=8080)



