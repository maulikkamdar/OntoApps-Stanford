from flask import Flask, Blueprint, render_template, json, request
import networkx as nx
import pandas as pd
import numpy as np
import re, os, sys, math, time, urllib, csv
from utils import MatrixIO, FileUtils, merge, str_nan_checker
from copy import deepcopy
import scipy.stats as stats
import gtbtokenize
from userProfile import User
from palettable.colorbrewer.sequential import YlOrRd_9

vision = Blueprint('vision', __name__, template_folder='templates')
#color_palette = "YlOrRd_9"
#['#FFFFCC', '#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026']
color_palette = YlOrRd_9.hex_colors
app = Flask(__name__)
mfio = MatrixIO()
onto_folder = "static/data/vision/proc_onto_files_3/"
stats_folder = "static/data/vision/proc_fctest_files/"
ontoStructsFileLoc = "static/data/vision/proc_struct_files/"
data_folder = "static/data/vision/"
allowed_ontos = pd.read_csv(data_folder + "allowed_ontos.tsv", header=None, sep="\t")
allowed_ontos.columns = ["acronym", "name"]
allowed_ontos = allowed_ontos.set_index("acronym")
allowed_ontos = allowed_ontos.to_dict(orient="index")
for k in allowed_ontos: allowed_ontos[k] = {"acronym": k, "name": allowed_ontos[k]["name"] + " [ " + k + " ]"} #change this when you get description

fu = FileUtils()
user_dict = {}
REST_URL = "http://data.bioontology.org"
API_KEY = "5b7f7e20-015c-496f-ade9-ca341345cef7"
resourceRest = REST_URL + "/resource_index/resources/PM/search?classes" 

# move this to user profiles
stat_value=-2 
min_alpha=0.8
min_size=6 
max_size=20
def_size=10
min_cat_size = 5
VOLC_THRES = 1
WC_THRES = 1000
UNMAPPED_IDF_CONST = 4
def_color = '#FEB24C' #'#800026'
shapes = ["octagon", "circle", "square", "triangle", "inv_triangle", "diamond", "pentagon", "ellipse",
          "cross", "ang_cross", "circle_cross", "circle_x", "square_cross", "square_x", "diamond_cross", "diamond_x", 
          "star", "square_circle", "diamond_circle", "illuminati", "hallows", "asterisk"]
dtype = ["ui", "api"]
ctype_tot = ["total_ips", "unfound_reqs"]
ctype_un = ["unique_ips", "unfound_ips"]
years = ["2013", "2014", "2015", "2016"]
sigma_size_cols = []

for m in dtype:
    for k in years:
        sigma_size_cols.append("unique_ips_" + m + "_" + k)

all_uids = ["_ui" + "_" + k for k in years]
all_aids = ["_api" + "_" + k for k in years]
fc_test_sample = ("api_2015", "ui_2015")
idfs = {}


quantiles = {
    "In-linking annotations": u'in_links', 
    "Out-linking annotations": u'out_links', 
    "Parent classes": u'dir_parents', 
    "Child classes": u'dir_children', 
    "Minimum depth": u'min_depth', 
    "Sibling classes": u'siblings', 
    "Maximum depth": u'max_depth', 
    "Reusing Ontologies": u'is_reused', 
    "CUI Co-occurrence": u'cui_cooccur', 
    "IRI Co-occurrence": u'reuse_cooccur'
    }
label_list = {
    "total_ips_ui": "Total IP requests (UI)",
    "unique_ips_ui": "Unique IP requests (UI)",
    "total_ips_api": "Total IP requests (API)",
    "unique_ips_api": "Unique IP requests (API)",
    "reuse_count": "Number of Reusing Ontologies",
    "cui_share": "Number of CUI-sharing Ontologies",
    "reuse_share": "Number of IRI-sharing Ontologies"
}

def read_onto_files(onto):
    ontoG = nx.read_gpickle(onto_folder + onto + ".gpickle")
    onto_stats = pd.read_csv(onto_folder + onto + ".tsv", sep = "\t")
    return ontoG, onto_stats

def get_min_label(x):
    print "this seems " + x
    lparts = str(x).split(":-:")
    print x, len(lparts)
    label = lparts[np.argmin([len(k) for k in lparts])]
    print label
    if len(label) > 0: return label
    else: return lparts[0]

def _check_non_zero(x, thr=0):
    if x[0] < thr and x[1] < thr: return False
    else: return True

def gen_label_from_G(ontoG, node_id):
    node_info = ontoG.node[node_id]
    all_labels = merge([node_info["altLabel"], node_info["prefLabel"], node_info["label"], node_info["title"]])
    return list(set(all_labels))

def get_path_subG(G, source, target):
    pathSubG = nx.DiGraph()
    for g in nx.all_simple_paths(G, source, target):
        for k in range(len(g)-1):
            pathSubG.add_edge(g[k], g[k+1])
    return pathSubG

def weighted_jaccard(unnorm_col1, unnorm_col2):
    a1 = float(np.max(unnorm_col1))
    a2 = float(np.max(unnorm_col2))
    if a1==0 or a2==0: return 0
    col1 = unnorm_col1/a1
    col2 = unnorm_col2/a2
    min_arr = np.min([col1, col2], axis=0)
    max_arr = np.max([col1, col2], axis=0)
    wjc = np.sum(min_arr)/np.sum(max_arr)
    return wjc


def visualize_enriched_terms(stats_name, onto_df, color_col=False, fold_name="proc_term_files_2/"):
    prev, curr = gen_prev_cur_terms(stats_name, fold_name=fold_name)
    if not color_col: color_col = "max_depth"
    year_p = stats_name.split("_")
    years = year_p[len(year_p)-1].split("-")
    dtype = year_p[len(year_p)-2]
    un_term_cols = ["unique_ips_" + dtype + "_" + k for k in years]
    un_term_dfs = np.log2(onto_df[un_term_cols])
    opac_max = np.max(np.max(un_term_dfs))
    opac_dfs = min_alpha + (1-min_alpha)*un_term_dfs/opac_max
    _sel_df = pd.concat([onto_df[["index", color_col]], opac_dfs], axis=1)
    _sel_dict = _sel_df.set_index("index").to_dict(orient="index")
    prev = pd.concat([prev, prev["term_id"].apply(lambda x: _sel_dict[x][color_col]).to_frame(name="color"), 
                      prev["term_id"].apply(lambda x: _sel_dict[x]["unique_ips_" + dtype + "_" + years[0]]).to_frame(name="opacity")], axis=1)
    curr = pd.concat([curr, curr["term_id"].apply(lambda x: _sel_dict[x][color_col]).to_frame(name="color"), 
                      curr["term_id"].apply(lambda x: _sel_dict[x]["unique_ips_" + dtype + "_" + years[1]]).to_frame(name="opacity")], axis=1)
    return prev.to_dict(orient="index"), curr.to_dict(orient="index")

def visualize_enriched_words(stats_name, onto_df, fold_name="proc_term_files_2/"):
    def gen_word_list(term_dict):
        word_list = {}
        max_ip_count = 0
        for k in term_dict:
            term_ptrs = gtbtokenize.tokenize(term_dict[k]["label"]).split()
            for word in term_ptrs: 
                if not word in word_list:
                    word_list[word] = {"terms": set([]), "mags": [], "magnitude": 0, "color": 0, "unique_ips": 0, "opacity": min_alpha, "label": word}
                    if word.lower() in idfs: word_list[word]["idf"] = idfs[word.lower()]["IDF"]
                    else: word_list[word]["idf"] = UNMAPPED_IDF_CONST
                word_list[word]["terms"].add(term_dict[k]["term_id"])
                word_list[word]["mags"].append(term_dict[k]["magnitude"])
                word_list[word]["unique_ips"] += term_dict[k]["unique_ips"]
                if word_list[word]["unique_ips"] > max_ip_count: max_ip_count = word_list[word]["unique_ips"]
        #print len(word_list)
        for k in word_list:
            word_list[k]["magnitude"] = np.log2(np.median(word_list[k]["mags"])*word_list[k]["idf"])
            word_list[k]["color"] = len(word_list[k]["terms"])
            word_list[k]["opacity"] = min_alpha + (1-min_alpha)*np.log2(word_list[word]["unique_ips"])/np.log2(max_ip_count)
            word_list[k]["terms"] = list(word_list[k]["terms"])
        word_df = pd.DataFrame.from_dict(word_list, orient="index")
        word_df = word_df.sort_values("magnitude", ascending=False)
        sel_word_list = word_df[0:WC_THRES]
        return word_list

    year_p = stats_name.split("_")
    years = year_p[len(year_p)-1].split("-")
    dtype = year_p[len(year_p)-2]
    un_term_cols = ["unique_ips_" + dtype + "_" + k for k in years]
    un_term_dfs = onto_df[un_term_cols]
    _sel_df = pd.concat([onto_df["index"], un_term_dfs], axis=1)
    _sel_dict = _sel_df.set_index("index").to_dict(orient="index")
    prev, curr = gen_prev_cur_terms(stats_name, reduced_tab=False, fold_name=fold_name)
    prev = pd.concat([prev, prev["term_id"].apply(lambda x: _sel_dict[x]["unique_ips_" + dtype + "_" + years[0]]).to_frame(name="unique_ips")], axis=1)
    curr = pd.concat([curr, curr["term_id"].apply(lambda x: _sel_dict[x]["unique_ips_" + dtype + "_" + years[1]]).to_frame(name="unique_ips")], axis=1)
    prev_dict = prev.to_dict(orient="index")
    curr_dict = curr.to_dict(orient="index")
    prev_word_list = gen_word_list(prev_dict)
    curr_word_list = gen_word_list(curr_dict)
    return prev_word_list, curr_word_list

def gen_prev_cur_terms(stats_name, reduced_tab=True, fold_name="proc_term_files_2/"):
    print "oompa loompa"
    term_stat_df = pd.read_csv(fold_name + stats_name + ".tsv", sep="\t")
    term_imp_df = term_stat_df[term_stat_df[stats_name + "_fdr_pval"] <= 0.05]
    mag = np.log2(term_imp_df[stats_name + "_odd"])
    term_table = pd.concat([term_imp_df[["index", "all_labels", stats_name + "_odd"]], 
                            np.abs(mag).to_frame(name="magnitude"), (mag/np.abs(mag)).to_frame(name="direction")], axis=1)
    term_table = term_table[term_table["all_labels"].apply(lambda x: not str_nan_checker(x))]
    if reduced_tab: term_table = term_table.sort_values("magnitude", ascending=False)[0:WC_THRES]
    else: term_table = term_table.sort_values("magnitude", ascending=False)
    term_table.columns = ["term_id", "label", "odd", "magnitude", "direction"]
    prev = term_table[term_table["direction"] == 1]
    curr = term_table[term_table["direction"] == -1]
    return prev, curr

def gen_color_mapper_func(max_val, min_val):
    color_mapper = {}
    divisor = (max_val-min_val)/float(len(color_palette))
    for k in range(len(color_palette)): color_mapper[min_val+k*divisor] = color_palette[k]
    return color_mapper, divisor

def gen_category_mapper(agg_df, cat_type, lab_df):
    def _get_label(x):
        xp = x.split(":-:")
        if len(xp) == 1: return lab_df.loc[x]["all_labels"]
        else: return ":-:".join([lab_df.loc[k]["all_labels"] for k in xp])
    cat_df = agg_df[[cat_type, "total_nodes"]].groupby(cat_type).count().sort_values("total_nodes", ascending=False)
    cat_df = cat_df[cat_df["total_nodes"] > min_cat_size]
    cat_df = cat_df[0:len(shapes)-2]
    cat_df = cat_df.reset_index()
    cat_df = cat_df[cat_df[cat_type].apply(lambda x: True if x!="MCN" else False)]
    cat_df = cat_df.reset_index()
    #print cat_df
    del cat_df["index"]
    cat_df = pd.concat([cat_df, pd.Series(shapes[1:cat_df.shape[0]+1]).to_frame(name="assig_shape")], axis=1)
    cat_df = pd.concat([cat_df, cat_df[cat_type].apply(lambda x: get_min_label(_get_label(x))).to_frame(name="label")], axis=1)
    #print cat_df, cat_type
    cat_df = cat_df.set_index(cat_type)
    cat_dict = cat_df.to_dict(orient="index")
    return cat_dict

def gen_chart_props(agg_df, log_scale=False, xlabel="Total IP Requests (UI)", ylabel="Total IP Requests (API)"):
    print "generating chart properties"
    xmax = np.ceil(np.max(agg_df["x"]))
    ymax = np.ceil(np.max(agg_df["y"]))
    xmin = np.floor(np.min(agg_df["x"]))
    ymin = np.floor(np.min(agg_df["y"]))
    print xmax, ymax, xmin, ymin, log_scale
    tick_size = 10
    xticks = []
    xticklabels = []
    yticks = []
    yticklabels = []
    if log_scale:
        xc = xmin
        yc = ymin
        while True:
            if xc >= xmax: break
            xticks.append(xc)
            xticklabels.append(int(np.power(2, xc)))
            xc += 2
        while True:
            if yc >= ymax: break
            yticks.append(yc)
            yticklabels.append(int(np.power(2, yc)))
            yc += 2
    else: 
        xsize = int((xmax-xmin)/tick_size)
        ysize = int((ymax-ymin)/tick_size)
        xsize = xsize if xsize > 0 else 1
        ysize = ysize if ysize > 0 else 1
        xc = xmin
        yc = ymin
        while True:
            if xc >= xmax: break
            xticks.append(xc)
            xticklabels.append(int(xc))
            xc += xsize
        while True:
            if yc >= ymax: break
            yticks.append(yc)
            yticklabels.append(int(yc))
            yc += ysize
    chart_props = {"xlims": {"xmin": xmin, "xmax": xmax}, 
                    "ylims": {"ymin": ymin, "ymax": ymax},
                    "xticks": xticks, "yticks": yticks,
                    "xticklabels": xticklabels, "yticklabels": yticklabels,
                    "xaxislabel": xlabel, "yaxislabel": ylabel}
    #print chart_props
    return chart_props

def gen_range_value(max_thr, min_thr, max_val, min_val, val):
    return min_thr + (max_thr-min_thr)*(val-min_val)/float(max_val-min_val)

def gen_2dscatter_points(count_df, lab_df, col1, col2, color_col=False, size_col=False, shape_col=False, log_scale=False, xlabel="Total IP Requests (UI)", ylabel="Total IP Requests (API)", plot_type="2d_scatter"):
    print "generating scatter points"
    def _gen_label(x):
        if x["total_nodes"] > 1: return str(x["total_nodes"]) + " classes present"
        return lab_df.loc[x["index"]]["all_labels"] 
    def _gen_alpha(x, max_bunch):
        if x == 1: return min_alpha
        alpha = gen_range_value(1, min_alpha, max_bunch, 1, np.log2(x)) 
        return alpha
    def _gen_color(x, min_color_val, divisor, color_mapper):
        if not color_col: return def_color
        color_val = np.mean(lab_df.loc[x["index"].split(":^:"), color_col]) if x["total_nodes"] > 1 else lab_df.loc[x["index"], color_col]
        color = color_mapper[min_color_val + (len(color_palette)-1)*divisor]
        for k in range(len(color_palette)):
            if color_val < min_color_val + k*divisor:
                color = color_mapper[min_color_val + (k-1)*divisor]
                break
        return color
    def _gen_size(x, min_size_val, max_size_val):
        if not size_col: return def_size
        size_val = np.mean(lab_df.loc[x["index"].split(":^:"), size_col]) if x["total_nodes"] > 1 else lab_df.loc[x["index"], size_col]
        size = gen_range_value(max_size, min_size, max_size_val, min_size_val, size_val)
        return size
    def _gen_category(x, cat_type):
        if x["total_nodes"] > 1: return "MCN"
        return lab_df.loc[x["index"]][cat_type]
    def _gen_shape(x, cat_dict):
        if x in cat_dict: return cat_dict[x]["assig_shape"]
        elif x=="MCN": return shapes[0]
        else: return shapes[len(shapes)-1]
    if log_scale: 
        sc_df = pd.concat([count_df["index"], np.log2(count_df[col1]), np.log2(count_df[col2])], axis=1)
        sc_df.loc[np.isinf(sc_df[col1]), col1] = stat_value
        sc_df.loc[np.isinf(sc_df[col2]), col2] = stat_value
    else: sc_df = count_df[["index", col1, col2]]
    agg_sc_df = sc_df.groupby([col1, col2]).aggregate(":^:".join)
    agg_sc_df = agg_sc_df.reset_index()
    agg_sc_df = pd.concat([agg_sc_df, agg_sc_df["index"].apply(lambda x: len(x.split(":^:"))).to_frame(name="total_nodes")], axis=1)
    max_bunch = np.log2(np.max(agg_sc_df["total_nodes"]))
    min_size_val = np.min(lab_df[size_col]) if size_col else 0
    max_size_val = np.max(lab_df[size_col]) if size_col else 0
    min_color_val = np.min(lab_df[color_col]) if color_col else 0
    max_color_val = np.max(lab_df[color_col]) if color_col else 0
    if color_col: color_mapper, divisor = gen_color_mapper_func(max_color_val, min_color_val)
    else: 
        color_mapper = {}
        divisor = 1
    agg_sc_df = pd.concat([agg_sc_df, 
                           agg_sc_df[["index", "total_nodes"]].apply(_gen_label, axis=1).to_frame(name="label"),
                           agg_sc_df["total_nodes"].apply(lambda x: _gen_alpha(x, max_bunch)).to_frame(name="alpha"),
                           agg_sc_df[["index", "total_nodes"]].apply(lambda x: _gen_size(x, min_size_val, max_size_val), axis=1).to_frame(name="size"),
                           agg_sc_df[["index", "total_nodes"]].apply(lambda x: _gen_color(x, min_color_val, divisor, color_mapper), axis=1).to_frame(name="color"),
                           agg_sc_df[["index", "total_nodes"]].apply(lambda x: _gen_category(x, "cat_0d"), axis=1).to_frame(name="cat_0d"), 
                           agg_sc_df[["index", "total_nodes"]].apply(lambda x: _gen_category(x, "cat_1d"), axis=1).to_frame(name="cat_1d"), 
                           agg_sc_df[["index", "total_nodes"]].apply(lambda x: _gen_category(x, "cat_2d"), axis=1).to_frame(name="cat_2d")], axis=1)
    agg_sc_df.columns = ["x", "y", "index", "total_nodes", "label", "alpha", "size", "color", "cat_0d", "cat_1d", "cat_2d"]
    #print agg_sc_df.head()
    chart_props = gen_chart_props(agg_sc_df, log_scale=log_scale, xlabel=xlabel, ylabel=ylabel)
    if shape_col:
        category_mapper = gen_category_mapper(agg_sc_df, shape_col, lab_df) 
        agg_sc_df = pd.concat([agg_sc_df, agg_sc_df[shape_col].apply(lambda x: _gen_shape(x, category_mapper)).to_frame(name="shape")], axis=1)
        #print agg_sc_df.head()
        category_mapper["MCN"] = {"assig_shape": "octagon", "label": "Multiple classes"}
        category_mapper["ACN"] = {"assig_shape": "asterisk", "label": "Unknown category"}
    else:
        category_mapper = {}
        agg_sc_df = pd.concat([agg_sc_df, pd.Series(["circle" for x in range(agg_sc_df.shape[0])]).to_frame(name="shape")], axis=1)
    agg_sc_df = agg_sc_df.to_dict(orient = "index")
    return agg_sc_df, color_mapper, chart_props, category_mapper

#--------------------------------

@vision.route("/create_user")
def create_user():
    ip = request.args.get('ip')
    time_info = time.time()
    user = User(ip, time_info, quantiles, sigma_size_cols)
    user.set_onto_name("GO")
    user_dict[user.user_id] = {"time": time_info, "ip": ip, "user": user}
    return json.dumps({"user_id": user.user_id, "onto_name": user.onto_name})

@vision.route("/check_user")
def check_user():
    ip = request.args.get('ip')
    user_id = request.args.get("user")
    if not user_id in user_dict:
        time_info = time.time()
        user = User(ip, time_info, quantiles, sigma_size_cols)
        user.set_onto_name("GO")
        user_dict[user.user_id] = {"time": time_info, "ip": ip, "user": user}
        return json.dumps({"user_id": user.user_id, "onto_name": user.onto_name, "to_set": 1})
    else:
        return json.dumps({"user_id": user_id, "onto_name": user_dict[user_id]["user"].onto_name, "to_set": 0})


@vision.route("/set_ontology")
def set_ontology():
    user_id = request.args.get("user_id")
    onto_name = request.args.get("onto_name")
    print user_id, onto_name
    user = user_dict[user_id]["user"]
    print user
    user.set_onto_name(onto_name)
    return json.dumps({"onto_name": user_dict[user_id]["user"].onto_name})

@vision.route("/scatter-plot")
def scatter_plot():
    return render_template('vision/scatter.html')

@vision.route("/volcano-plot")
def volcano_plot():
    return render_template('vision/volcano.html')

@vision.route("/time-plot")
def time_plot():
    return render_template('vision/time.html')

@vision.route("/landscape-plot")
def landscape_plot():
    return render_template('vision/landscape.html')

@vision.route("/bug-plot")
def bug_plot():
    return render_template('vision/bug.html')

@vision.route('/get_onto_info', methods=['POST'])
def getOntoInfo():
    _termStr = request.form['int_onto']
    _type = request.form['type'] #count, #path

@vision.route("/get_onto_list")
def get_onto_list():
    return json.dumps(allowed_ontos.values())

@vision.route("/get_quantiles")
def get_quantiles():
    return json.dumps(quantiles)

@vision.route("/get_depth_range")
def get_depth_range():
    _user = request.args.get('user_id')
    snomed_df = user_dict[_user]["user"].onto_df
    return json.dumps({"maxd": np.max(snomed_df["max_depth"]), "mind": np.min(snomed_df["max_depth"])})

@vision.route('/class_info')
def class_info():
    term_ids = request.args.get('class_id')
    _user = request.args.get('user_id')
    ontoG = user_dict[_user]["user"].ontoG
    terms = term_id.split(":^:")
    term_dict = {}
    for term in terms:
        label = "\n ". join(gen_label_from_G(ontoG, term))
        pr_label = ""
        description = ""
        for node in ontoG[term]:
            pr_label1 = gen_label_from_G(ontoG, node)
            pr_label += pr_label1[0] + " [" + node + "]" + "\n" if len(pr_label1) > 0 else node + "\n"
        term_info = {"label": label, "parents": pr_label, "term_id": term, "description": description}
        term_dict[term] = term_info
    return json.dumps(term_dict)

@vision.route("/gen_2d_scatter", methods=['POST'])
def gen_2d_scatter():
    def check_in_range(x):
        if x < _d0 or x > _d1: return False
        else: return True

    print request.form
    _user = request.form['user_id']
    onto_name = user_dict[_user]["user"].onto_name
    snomed_df = user_dict[_user]["user"].onto_df
    lab_df = user_dict[_user]["user"].lab_df

    _xaxis = request.form['scatter_xaxis']
    _yaxis = request.form['scatter_yaxis']
    _color = request.form["scatter_color"] if request.form["scatter_color"]!="None" else False
    _size = request.form["scatter_size"] if request.form["scatter_size"]!="None" else False
    _log = True if "scatter_log" in request.form else False
    _spman = True if "spearmanr" in request.form else False
    _wjac = True if "weighted_jaccard" in request.form else False
    _d0 = int(request.form["dthval_0_in"])
    _d1 = int(request.form["dthval_1_in"])
    req_un_uis = []
    req_tot_uis = []
    req_un_apis = []
    req_tot_apis = []
    for k in all_uids:
        if "scatter" + k in request.form: 
            req_tot_uis.append("total_ips" + k)
            req_un_uis.append("unique_ips" + k)
    for k in all_aids:
        if "scatter" + k in request.form:
            req_tot_apis.append("total_ips" + k)
            req_un_apis.append("unique_ips" + k)
    if len(req_tot_uis) == 0: req_tot_uis = ["total_ips_ui_2015"]
    if len(req_un_uis) == 0: req_un_uis = ["unique_ips_ui_2015"]
    if len(req_tot_apis) == 0: req_tot_apis = ["total_ips_api_2015"]
    if len(req_un_apis) == 0: req_un_apis = ["unique_ips_api_2015"]
    data_df = pd.concat([snomed_df["index"], np.sum(snomed_df[req_tot_uis], axis=1).to_frame(name="total_ips_ui"), 
                     np.sum(snomed_df[req_tot_apis], axis=1).to_frame(name="total_ips_api"), 
                     np.sum(snomed_df[req_un_uis], axis=1).to_frame(name="unique_ips_ui"), 
                     np.sum(snomed_df[req_un_apis], axis=1).to_frame(name="unique_ips_api"), 
                     snomed_df["is_reused"].to_frame(name="reuse_count"), snomed_df["cui_cooccur"].to_frame(name="cui_share"), 
                     snomed_df["reuse_cooccur"].to_frame(name="reuse_share")], axis=1)
    if _color: data_df = pd.concat([data_df, snomed_df[_color]], axis=1)
    if _size: data_df = pd.concat([data_df, snomed_df[_size]], axis=1)
    print _color, _size, _log, _xaxis, _yaxis
    #print data_df.head()
    data_df = data_df[snomed_df["max_depth"].apply(check_in_range)]
    add_features = []
    if _spman:
        spc = stats.spearmanr(data_df[_xaxis], data_df[_yaxis])
        print spc
        spc_text = "Spearman Correlation: " + str(np.round(spc[0], 6)) #+ "\nP-value: " + str(np.round(spc[1], 10)) # change this to include E representations
        add_features.append({"text": spc_text, "type": "spearman"})
    if _wjac:
        wjac = weighted_jaccard(data_df[_xaxis], data_df[_yaxis])
        add_features.append({"text": "Weighted Jaccard Similarity: " + str(np.round(wjac, 6)), "type": "weighted_jaccard"})
    agg_sc_df, color_mapper, chart_props, category_mapper = gen_2dscatter_points(data_df, lab_df, _xaxis, _yaxis, color_col= _color, size_col= _size, shape_col="cat_1d", log_scale= _log, xlabel=label_list[_xaxis], ylabel=label_list[_yaxis])
    #print json.dumps({"points": agg_sc_df.values(), "color_mapper": color_mapper, "category_mapper": category_mapper, "chart_props": chart_props})
    return json.dumps({"points": agg_sc_df.values(), "color_mapper": color_mapper, "category_mapper": category_mapper, "chart_props": chart_props, "added_features": add_features})

@vision.route("/gen_2d_volcano", methods=['POST'])
def gen_2d_volcano():
    def check_in_range(x):
        if x[0] not in stats_dict: return False
        if x[1] < _d0 or x[1] > _d1: return False
        else: return True

    print request.form
    _user = request.form['user_id']
    onto_name = user_dict[_user]["user"].onto_name
    snomed_df = user_dict[_user]["user"].onto_df
    lab_df = user_dict[_user]["user"].lab_df

    _d0 = int(request.form["dthval_0_in"])
    _d1 = int(request.form["dthval_1_in"])
    _color = request.form["scatter_color"] if request.form["scatter_color"]!="None" else False
    _size = request.form["scatter_size"] if request.form["scatter_size"]!="None" else False
    _fctest = request.form["fctest"]
    _fctesttype = request.form["fctesttype"]
    stats_name = "_term_stats_" + onto_name + "_" + _fctesttype + "_" + _fctest
    print stats_name, _color, _size
    stats_df = mfio.load_matrix(stats_folder + stats_name + ".dat")
    #print stats_df.head()
    cols = stats_df.columns
    stats_dict = stats_df.to_dict(orient="index")
    data_df = snomed_df[["index", "all_labels"]]
    if _color: data_df = pd.concat([data_df, snomed_df[_color]], axis=1)
    if _size: data_df = pd.concat([data_df, snomed_df[_size]], axis=1)
    #data_df = data_df[snomed_df["index"].apply(lambda x: True if x in stats_dict else False)]
    data_df = data_df[snomed_df[["index", "max_depth"]].apply(check_in_range, axis=1)]
    data_df = data_df.set_index("index")
    data_df = pd.concat([data_df, stats_df], axis=1)
    del data_df["all_labels"]
    print data_df.columns, data_df.shape

    #stats_df, stats_name = prepare_stats_df(snomed_df, fc_test_sample, onto_name="GO", color_col="siblings", size_col="min_depth")
    stats_df = pd.concat([data_df, np.log2(data_df[stats_name + "_odd"]).to_frame(name=stats_name + "_logodds"), 
                      -np.log10(data_df[stats_name + "_p"]).to_frame(name=stats_name + "_logp"), 
                      -np.log10(data_df[stats_name + "_fdr_pval"]).to_frame(name=stats_name + "_logfdr")], axis=1)
    stats_df.loc[np.isinf(stats_df[stats_name +"_logfdr"]), stats_name + "_logfdr"] = np.ceil(np.max(stats_df[~np.isinf(stats_df[stats_name + "_logfdr"])][stats_name + "_logfdr"]))
    stats_df.loc[np.isinf(stats_df[stats_name + "_logp"]), stats_name + "_logp"] = np.ceil(np.max(stats_df[~np.isinf(stats_df[stats_name + "_logp"])][stats_name + "_logp"]))
    stats_df = stats_df.reset_index()
    agg_sc_df, color_mapper, chart_props, category_mapper = gen_2dscatter_points(stats_df, lab_df, stats_name+"_logodds", stats_name+"_logfdr", color_col=_color, size_col=_size, shape_col="cat_1d", log_scale=False, xlabel="Log 2 Odds Ratio between UI and API requests - 2015", ylabel="Log 10 FDR-adjusted P-values")
    return json.dumps({"points": agg_sc_df.values(), "color_mapper": color_mapper, "category_mapper": category_mapper, "chart_props": chart_props})

@vision.route("/gen_2d_time", methods=['POST'])
def gen_2d_time():
    print request.form
    _user = request.form['user_id']
    onto_name = user_dict[_user]["user"].onto_name
    snomed_df = user_dict[_user]["user"].onto_df
    lab_df = user_dict[_user]["user"].lab_df
    stats_name = "_term_stats_total_" + onto_name + "_" + request.form["fctest"]
    _viztype = request.form["viztype"]
    #stats_name = wc_test_sample
    _fctesttype = request.form["fctesttype"]
    if _fctesttype == "total": fold_name = "static/data/vision/proc_term_files_2/"
    else: fold_name = "static/data/vision/proc_term_files/" 
    if _viztype == "classes": prev, curr = visualize_enriched_terms(stats_name, snomed_df, fold_name=fold_name)
    else: prev, curr = visualize_enriched_words(stats_name, snomed_df, fold_name=fold_name)
    return json.dumps({"prev": prev.values(), "curr": curr.values()})

@vision.route("/gen_sigma_graph", methods=["POST"])
def gen_sigma_graph():
    terms = request.form["term_list"].split(":^:")
    _user = request.form["user_id"]
    ontoG = user_dict[_user]["user"].ontoG
    root_node = user_dict[_user]["user"].root_node
    lab_df = user_dict[_user]["user"].lab_df
    sG = nx.DiGraph()
    for term in terms:
        if not ontoG.has_node(term): continue
        subG = get_path_subG(ontoG, term, root_node)
        sG.add_edges_from(subG.edges())
    nodeList = []
    edgeList = []
    for node in sG.nodes():
        color = "#ff0000" if node in terms else "#0000ff"
        node_info = lab_df.loc[node]
        name = node_info["all_labels"].replace(":-:", "<br>")
        size = node_info["tot_unique_ips"]
        nodeList.append({"index": node, "name": name, "size": size, "color": color})
    for edge in sG.edges():
        edgeList.append({"source": edge[0], "target": edge[1], "weight": 1})
    return json.dumps({"nodes": nodeList, "edges": edgeList})

@vision.route("/gen_bugs", methods=["POST"])
def gen_bug_plot():
    _user = request.form["user_id"]
    onto_name = user_dict[_user]["user"].onto_name
    ontoStructsFile = open(ontoStructsFileLoc + "struct_" + onto_name + ".tsv")
    ontoStructsLines = ontoStructsFile.readlines()
    ontoStructsFile.close()
    ontoStructs = {}
    for k in range(len(ontoStructsLines)):
        ontoStructParams = ontoStructsLines[k].strip().split("\t")
        print ontoStructParams[0]
        ontoStructs[k] = {"noStructs": json.loads(ontoStructParams[2].replace("'", "\"")), "onto": ontoStructParams[0], "noSingles": json.loads(ontoStructParams[1].replace("'", "\""))}
    return json.dumps(ontoStructs)

@vision.route("/vision/overall")
def overallViz():
    return render_template('vision/overall.html')

@vision.route("/vision/about")
def about():
    return render_template('vision/about.html')

@vision.route("/vision/cooccur_data")
def cooccur_data():
    with open("static/data/vision/cooccur/2013_output.json") as f:
        cooccur = json.load(f)
    return json.dumps(cooccur)

@vision.route("/vision")
def ontoViz():
    return render_template('vision/index.html')