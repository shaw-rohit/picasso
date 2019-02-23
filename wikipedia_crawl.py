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

from bs4 import BeautifulSoup

r1 = '>Origin</th><td>(.*?)</td>'
r2 = '>Born</th><td>(.*?)</td>'
r3 = 'class="birthplace(.*?)</div>'
r4 = 'born in [^.]*\.'

good = 0
bad = 0

urls = pd.read_csv('wikipediaUrl.csv').iloc[:100]
cities_list = []
countries_list = []
artists = []

for i, page in urls.iterrows():
    url = page.wikipediaUrl
    artist = page.artist
    results = []
    option2 = False
    page = requests.get(url)
    soup = BeautifulSoup(page.text, 'html.parser')

    # first round:
    result = re.search(r1, str(soup).lower())
    if result:
        results.append(result.group().replace('>Origin</th><td>', ''))
    result = re.search(r2, str(soup))
    if result:
        results.append(result.group().replace('>Born</th><td>', ''))
    result = re.search(r3, str(soup))
    if result:
        results.append(result.group().replace('class="birthplace', ''))
        result = re.search(r4, str(soup))
    result = re.search(r4, str(soup))
    if result:
        results.append(result.group().replace('born in', ''))
    if results:
        good+=1
        results = [re.sub("<(.*?)>", "", r.replace('style="display:inline">', "").replace(' ', ',')) for r in results]
        results = [GeoText(r) for r in results]
        cities = set([ c for r in results for c in r.cities])
        countries = set([ c for r in results for c in r.country_mentions ])
        if countries or cities:
            artists.append(artist)
            countries_list.append(countries)
            cities_list.append(cities)
    else:
        bad+=1


print(good, bad)

df = pd.DataFrame({'artist': artists, 'city': cities_list, 'country':countries_list})
df.to_csv('wikipedia_locations.csv')
