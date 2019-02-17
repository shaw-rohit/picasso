from SPARQLWrapper import SPARQLWrapper, JSON
import pandas as pd

# You will need to install pandas and sparqlWrapper

# opens csv file and adds 2 fields which will be added by dbpedia
df = pd.read_csv("sample.csv")
# df = df.head(50)
df["dbp_name"] = "N/A"
df["dbp_birthplace"] = "N/A"

for index, row in df.iterrows():

  # Remove weird signs in name
  new = row['artist_full_name'].replace("'", "")
  new = new.replace("-", r"\'")
  new = new.replace(",", "")
  new = new.replace(".", "")
  new = new.replace("?", "")
  new = new.replace("&", "n")
  new = new.title()
  new = new.lstrip()
  new = new.replace(" ", " AND ")

  # Query will look for persons and, if available, look for the drawing and printmaking tags
  # otherwise, it will filter in the abstract. Finally, it will return only 1 result
  sparql = SPARQLWrapper("https://dbpedia.org/sparql")
  sparql.setQuery('''
  PREFIX owl: <http://www.w3.org/2002/07/owl#>
  PREFIX dbr: <http://dbpedia.org/resource/>
  PREFIX db: <http://dbpedia.org/>
  PREFIX dbpprop: <http://dbpedia.org/property/>
  PREFIX dbpp: <http://dbpedia.org/property/>
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX dbo: <http://dbpedia.org/ontology/>
  PREFIX dbp: <http://dbpedia.org/resource/>
  PREFIX  dbpedia-owl:  <http://dbpedia.org/ontology/>
  PREFIX  bif:  <bif:>
  SELECT DISTINCT ?s ?label ?sameAs ?birthPlaceLabel WHERE {
        ?s rdfs:label ?label;
            rdf:type  dbo:Person.
#  			  dbr:Printmaking ?field.
        ?label bif:contains "''' + new + '''" . 
        ?s dbo:abstract ?abstract.
    ?s dbo:birthPlace ?birthPlace.
    ?birthPlace rdfs:label ?birthPlaceLabel.
#  			?s dbo:field ?field.
    optional {?s dbo:field <http://dbpedia.org/resource/Printmaking>}
    optional {?s dbo:field <http://dbpedia.org/resource/Drawing>}
    ?s owl:sameAs ?sameAs. 
#  			FILTER regex(?sameAs, "wikidata").
    FILTER (regex(?abstract, "paint") || regex(?abstract, "drawing")  || regex(?abstract, "photography")  || regex(?abstract, "art")  || regex(?abstract, "historical")  || regex(?abstract, "historian")  || regex(?abstract, "paintings")  || regex(?abstract, "artwork")  || regex(?abstract, "modern")  || regex(?abstract, "computer") || regex(?abstract, "cubic") || regex(?abstract, "graphiti") || regex(?abstract, "patterns") || regex(?abstract, "sculpture")).
    FILTER (lang(?label) = 'en'). 
    FILTER (lang(?abstract) = 'en').
    FILTER (lang(?birthPlaceLabel) = 'en')
    }
  LIMIT 1
      ''')

  sparql.setReturnFormat(JSON)
  try: 
    results = sparql.query().convert()
  except:
    pass
  
  # Add the new name and birthplace for the query
  for result in results["results"]["bindings"]:
    print ("Name: "  + result["label"]["value"] + "  birthplace: " + result["birthPlaceLabel"]["value"])
    df["dbp_name"] = result["label"]["value"]
    df["dbp_birthplace"] = result["birthPlaceLabel"]["value"]

# Remove all N/A tags for keeping only the records which had a valid sparql result
df = df[df['dbp_name'] != 'N/A']
df.to_csv("output.csv")


# Works via wikipedia, but is very slow

#       # sparql = SPARQLWrapper("https://query.wikidata.org/sparql")
#       # sparql.setQuery('''
#       # SELECT 
#       #   ?item ?itemLabel 
#       #   ?sex ?sexLabel
#       #   ?placeOfBirth ?placeOfBirthLabel
#       # WHERE {
#       #   ?item wdt:P106 wd:Q1028181.
#       #   ?item wdt:P21 ?sex.
#       #   ?item wdt:P19 ?placeOfBirth.
#       #   ?item rdfs:label ?itemLabel . 
#       #    filter contains(?itemLabel, "Picasso").
#       #   SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
#       # }
#       # LIMIT 1
#       # ''')

