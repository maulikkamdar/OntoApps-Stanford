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

lslodminer = Blueprint('lslodminer', __name__, template_folder='templates')
app = Flask(__name__)


#----- reveald2 get functions source code goes here

@lslodminer.route("/lslodminer")
def lslodminer_main():
    return render_template('lslodminer/index.html')

@lslodminer.route("/lslodminer/about")
def lslodminer_explorer():
    return render_template('lslodminer/about.html')
