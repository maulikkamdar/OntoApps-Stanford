from flask import Flask, Blueprint, render_template, json, request

prism = Blueprint('prism', __name__, template_folder='templates')
app = Flask(__name__)

@prism.route("/prism")
def prism_main():
    return render_template('prism/index.html')

@prism.route("/prism/about")
def prism_about():
    return render_template('prism/about.html')