
import pandas as pd

df = df[df.media!='Unknown']
df = df[df.media!='nan']
df = df[df.media!='NaN']
df = df.dropna(subset=['media'])

print(len(df))
df =  df.drop(['collection_origins', 'original_id_in_collection',
           'pixel_counts', 'dimensions', 'publisher', 'distributable_url'], axis=1)

df = df.dropna(subset=['artist_last_name', 'artist_first_name', 'date', 'artist_full_name', 'century', 'image_url', 'style'])
df = df[df['date']!='Unknown']
df = df[df['date']!='unknown']
df = df[df['date']!='nan']
for h in ['artist_last_name', 'artist_first_name', 'artist_full_name', 'image_url', 'style']:
    df = df[~df[h].str.contains('nknown') & ~df[h].str.contains('nan')]
print(len(df))
df.to_csv('omni.csv')
