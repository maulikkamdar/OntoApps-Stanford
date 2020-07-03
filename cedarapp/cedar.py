from flask import Flask, Blueprint, render_template, json, request
import re
import math
import hashlib
import time
import random
import string
import numpy as np
import pandas as pd

cedar = Blueprint('cedar', __name__, template_folder='templates')
app = Flask(__name__)
user_dict = {}


def _user(ip, time_info):
    un_id = ip + ":-:" + str(time_info)
    user_id = "user_" + hashlib.sha1(un_id).hexdigest()
    return user_id


srcfolder = "static/data/cedar/"
output_folder = srcfolder + "userdata/"
questions = pd.read_csv(srcfolder + "questions-table.csv", sep=",")
h1q = questions[questions["hypothesis"] == "H1"]
h1q.columns = ["qid", "qtext", "qtype"]
h1q = h1q.to_dict(orient="index")
res1 = h1q.values()
h2q = questions[questions["hypothesis"] == "H2"]
h2q.columns = ["qid", "qtext", "qtype"]
h2q = h2q.to_dict(orient="index")
res2 = h2q.values()
strN = 6
maxH1 = 1
maxH2 = 1

options = pd.read_csv(srcfolder + "options-table.csv", sep=",")
options.columns = ["qid", "optid", "label", "ontology", "acr", "source"]


def get_options(qid):
    opt = options[options["qid"] == qid]
    opt = opt[["optid", "label", "ontology", "acr"]]
    opt = opt.to_dict(orient="index")
    return opt.values()


def print_refined():
    for k in opt1:
        print (k["text"])
        print ("------------")
        for m in k["options"]:
            print ("---", m["optid"], m["label"], m["ontology"])
    for k in opt2:
        print (k["text"])
        print ("------------")
        for m in k["options"]:
            print ("---", m["optid"], m["label"], m["ontology"])


opt1 = []
for k in res1:
    kiq = {}
    kiq["qid"] = k["qid"]
    kiq["text"] = k["qtext"]
    ap = list(get_options(k["qid"]))
    kiq["options"] = list(
        np.array(ap)[np.random.choice(len(ap), len(ap), replace=False)])
    opt1.append(kiq)


opt2 = []
for k in res2:
    kiq = {}
    kiq["qid"] = k["qid"]
    kiq["text"] = k["qtext"]
    ap = list(get_options(k["qid"]))
    kiq["options"] = list(
        np.array(ap)[np.random.choice(len(ap), len(ap), replace=False)])
    opt2.append(kiq)

# print_refined()


# ----- cedar source code goes here
@cedar.route("/create_user")
def create_user():
    ip = request.args.get('ip')
    time_info = time.time()
    user = _user(ip, time_info)
    user_dict[user] = {"time": time_info, "ip": ip, "user": user}
    return json.dumps({"user_id": user})


@cedar.route("/check_user")
def check_user():
    ip = request.args.get('ip')
    user_id = request.args.get("user")
    if not user_id in user_dict:
        time_info = time.time()
        user = _user(ip, time_info)
        user_dict[user] = {"time": time_info, "ip": ip, "user": user}
        return json.dumps({"user_id": user, "to_set": 1})
    else:
        return json.dumps({"user_id": user_id, "to_set": 0})


@cedar.route("/cedar")
def cedar_main():
    return render_template('cedar/index.html')


@cedar.route("/cedar/h1")
def cedar_h1():
    return render_template('cedar/h1.html')


@cedar.route("/cedar/h2")
def cedar_h2():
    return render_template('cedar/h2.html')


@cedar.route("/cedar/thankyou")
def cedar_thanks():
    return render_template('cedar/thankyou.html')


@cedar.route("/cedar/h1questions")
def cedar_h1questions():
    output = list(np.array(opt1)[np.random.choice(
        len(opt1), maxH1, replace=False)])
    return json.dumps(output)


@cedar.route("/cedar/h2questions")
def cedar_h2questions():
    output = list(np.array(opt2)[np.random.choice(
        len(opt2), maxH2, replace=False)])
    return json.dumps(output)


@cedar.route("/cedar/h1submit", methods=['POST'])
def cedar_h1submit():
    print request.form
    _user = request.form['user_id']
    rows = {}
    for k in request.form:
        if k == "user_id":
            continue
        qid = k.split("_")[0][1:]
        optid = k.split("_")[1][1:]
        val = request.form[k]
        rows[k] = {"qid": qid, "optid": optid, "user": _user, "value": val}
    if len(rows) < maxH1*10:
        return json.dumps({"success": 0})
    output = pd.DataFrame.from_dict(rows, orient="index")
    output = output[["qid", "optid", "value", "user"]]
    output = output.reset_index()
    rn = ''.join(random.choice(string.ascii_uppercase + string.digits)
                 for _ in range(strN))
    fname = output_folder + "response_h1_" + _user + "_" + rn + ".tsv"
    output.to_csv(fname, sep="\t", index=None)
    return json.dumps({"success": 1})


@cedar.route("/cedar/h2submit", methods=['POST'])
def cedar_h2submit():
    print request.form
    _user = request.form['user_id']
    rows = {}
    for k in request.form:
        if k == "user_id":
            continue
        qid = k.split("_")[0][1:]
        optid = k.split("_")[1][1:]
        val = request.form[k]
        rows[k] = {"qid": qid, "optid": optid, "user": _user, "value": val}
    if len(rows) < maxH2*5:
        return json.dumps({"success": 0})
    output = pd.DataFrame.from_dict(rows, orient="index")
    output = output[["qid", "optid", "value", "user"]]
    output = output.reset_index()
    rn = ''.join(random.choice(string.ascii_uppercase + string.digits)
                 for _ in range(strN))
    fname = output_folder + "response_h2_" + _user + "_" + rn + ".tsv"
    output.to_csv(fname, sep="\t", index=None)
    return json.dumps({"success": 1})
