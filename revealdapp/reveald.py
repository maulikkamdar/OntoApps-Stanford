from flask import Flask, Blueprint, render_template, json, request
import networkx as nx
import re

reveald = Blueprint('reveald', __name__, template_folder='templates')
app = Flask(__name__)

@reveald.route("/reveald")
def reveald_main():
    return render_template('reveald/index.html')

@reveald.route("/reveald/about")
def reveald_about():
    return render_template('reveald/about.html')