import os
import sys
import math
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import json
import re
import requests

from geotext import GeoText

df = pd.read_csv('output.csv')

first_names = df.artist_first_name
last_names = df.artist_last_name

wiki = pd.read_csv('wikipedia_locations.csv')

for i, name in last_names.iteritems():
    print(name, i)
    this_df= wiki[wiki['artist'].str.contains(name.split()[-1])]
    this_df= this_df[this_df['artist'].str.contains(name.split()[0])]
    first_name = first_names[i]
    this_df= this_df[this_df['artist'].str.contains(first_name.split()[0])]

    print(name)
    print(this_df)