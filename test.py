from geotext import GeoText


places = GeoText(' in Holland, USA, where he would also die.')
p = places.country_mentions
print(list(p))
print(len(p))
# "London"

# print(GeoText('New York, Texas, and also China').country_mentions)
# OrderedDict([(u'US', 2), (u'CN', 1)])

