from flask import Flask, Blueprint, render_template, json, request

presence = Blueprint('presence', __name__, template_folder='templates')
app = Flask(__name__)

#----- phlegra source code goes here
@presence.route("/presence")
def presence_main():
    return render_template('presence/index.html')

@presence.route("/presence/annotator")
def presence_annotator():
    return render_template('presence/annotator.html')