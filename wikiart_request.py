
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import os
import sys
import math
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

import requests

params = {}
params['accessCode'] = 
params['secretCode'] = 
base = 'http://www.wikiart.org/en/'
tail = '?json=2'

artist = 'pieter-bruegel-the-elder'


response = requests.get(base+artist+tail, params=params, timeout=5*60)

print(response.text)

