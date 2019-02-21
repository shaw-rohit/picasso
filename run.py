

import os
import sys
import math
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import json
import requests


artists = pd.read_csv('wikiart_artists.csv')


params = {}
params['accessCode'] = 'dedcf3c6ed1c464eApi'
params['secretCode'] = ' 99da489db0e166ad'
base = 'http://www.wikiart.org/en/'
tail = '?json=2'


# dict_keys(['relatedArtistsIds', 'OriginalArtistName', 'gender', 'story', 'biography', 'activeYearsCompletion', 'activeYearsStart', 'series', 'themes', 'periodsOfWork', 'contentId', 'artistName', 'url', 'lastNameFirst', 'birthDay', 'deathDay', 'birthDayAsString', 'deathDayAsString', 'image', 'wikipediaUrl', 'dictonaries'])
ex = 0
em = 0
su = 0



data =[]
A = []
for artist in artists.artist:
    for i in range(100):
        try:
            response = requests.get(base+artist+tail, params=params, timeout=10*60)
            response = json.loads(response.text)
            pw = response['periodsOfWork']
            data.append(pw)
            A.append(artist)
            su+=1
            break;
        except:
            pass

print('not specified: ', em)
print('succes:', su/float(len(artists)))

df = pd.DataFrame({'periodsOfWork':data, 'artist': A})
df.to_csv('periodsOfWork_2.csv')
    