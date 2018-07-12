import networkx as nx
import pandas as pd
import hashlib
import re, math, json, time
from utils import str_nan_checker, merge
import numpy as np

class User(object):
    def __init__(self, ip, time_info, quantiles, sigma_size_cols):
        un_id = ip + ":-:" + str(time_info)
        self.user_id = "user_" + hashlib.sha1(un_id).hexdigest()
        self.onto_name = "GO"
        self.quantiles = quantiles
        self.sigma_size_cols = sigma_size_cols
        self.onto_folder = "static/data/vision/proc_onto_files_3/"
        self.graph_folder = "static/data/vision/ontologies_3/"


    def set_onto_name(self, onto_name):
        self.onto_name = onto_name
        self.ontoG = nx.read_gpickle(self.graph_folder +  self.onto_name + ".gpickle")
        self.root_node = self.onto_name + ":Thing"
        self.onto_df = pd.read_csv(self.onto_folder + "/_count_" + self.onto_name + "_stats.tsv", sep="\t")
        self.lab_df = pd.concat([self.onto_df[["index", "all_labels", "cat_0d", "cat_1d", "cat_2d"]], np.log2(self.onto_df[self.quantiles.values()]+1), 
            np.sum(self.onto_df[self.sigma_size_cols], axis=1).to_frame(name="tot_unique_ips")], axis=1)
        self.lab_df = self.lab_df.set_index("index")
        self.lab_df.loc[self.lab_df["all_labels"].apply(str_nan_checker), "all_labels"] = self.lab_df.loc[self.lab_df["all_labels"].apply(str_nan_checker)].index
        self.lab_df.loc[self.lab_df["cat_0d"].apply(str_nan_checker), "cat_0d"] = self.lab_df.loc[self.lab_df["cat_0d"].apply(str_nan_checker)].index
        self.lab_df.loc[self.lab_df["cat_1d"].apply(str_nan_checker), "cat_1d"] = self.lab_df.loc[self.lab_df["cat_1d"].apply(str_nan_checker)].index
        self.lab_df.loc[self.lab_df["cat_2d"].apply(str_nan_checker), "cat_2d"] = self.lab_df.loc[self.lab_df["cat_2d"].apply(str_nan_checker)].index
        print self.lab_df.shape
        

