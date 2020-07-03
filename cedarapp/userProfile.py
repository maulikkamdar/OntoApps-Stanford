import networkx as nx
import pandas as pd
import hashlib
import re
import math
import json
import time
from utils import str_nan_checker, merge
import numpy as np


class User(object):
    def __init__(self, ip, time_info):
        un_id = ip + ":-:" + str(time_info)
        self.user_id = "user_" + hashlib.sha1(un_id).hexdigest()
