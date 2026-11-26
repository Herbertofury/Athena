"""Generate a rights-aware, text-only artist catalog from the reviewed source."""
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"feature-foundry/source/src/data/artist-worlds-v4.0.1.json"
DEST=ROOT/"engineering/apps/atlas-lab/ui/foundry-artist-index.json"
PIN="474f3e14c57539e86afb9d9352674e9ee4d4b652c9a9e7cab961f8e651f8b920"
PROVENANCE="https://github.com/Herbertofury/Athena/blob/7d335a740ea92a66674bf4412c48f5e03faf6e9f/feature-foundry/source/src/data/artist-worlds-v4.0.1.json"
EXPECTED={"artists":5,"worlds":10,"districts":20,"weather":20,"timeflow":20,"interactions":25,"music_routes":21}

def require(cond,msg):
    if not cond:raise ValueError(msg)

def atom(value,limit=180):
    require(isinstance(value,str) and 0<len(value)<=limit and all(ord(c)>=32 and ord(c)!=127 for c in value),"Malformed public label")
    require(not re.search(r"https?://|file:|[A-Z]:\\|<script",value,re.I),"Unexpected URL, path or markup in public label")
    return value

def key(value):
    require(isinstance(value,str) and re.fullmatch(r"[a-z0-9.-]{1,100}",value),"Bad authority ID")
    return value

def generate(source=SOURCE):
    raw=source.read_bytes().replace(b"\r\n",b"\n")
    require(hashlib.sha256(raw).hexdigest()==PIN,"Unreviewed artist authority bytes")
    data=json.loads(raw)
    require(all(isinstance(data.get(k),list) and len(data[k])==v for k,v in EXPECTED.items()),"Artist corpus inventory differs")
    artists={}
    for r in data["artists"]:
        k=key(r["artist_id"])
        require(k.startswith("artist.") and k not in artists,"Duplicate artist identity")
        artists[k]={"id":k,"name":atom(r["display_name"]),"family":atom(r["theme_family"]),"rights_note":atom(r["rights_release_gate"]),
                    "worlds":[],"districts":[],"weather":[],"timeflow":[],"interactions":[],"recorded_music_routes":0}
    maps=(
           ("worlds","world_id","world_name","variant","world."),
           ("districts","district_id","district",None,"district."),
           ("weather","weather_id","weather_state","intensity","weather."),
           ("timeflow","timeflow_id","phase",None,"time."),
    )
    ids=set(artists)
    for group,id_field,label_field,extra_field,prefix in maps:
        for row in data[group]:
            parent=key(row["artist_id"]);k=key(row[id_field])
            require(k.startswith(prefix) and k not in ids and parent in artists,"Duplicate or orphaned artist-world row")
            ids.add(k);selected={"id":k,"name":atom(row[label_field])}
            if extra_field:selected[extra_field]=atom(row[extra_field])
            artists[parent][group].append(selected)
    for r in data["interactions"]:
        parent=key(r["artist_id"]);label=atom(r["interaction"],32)
        require(parent in artists and re.fullmatch(r"[A-Z][A-Za-z]*( / [A-Z][A-Za-z]*)?",label),"Unreviewed input label")
        rows=artists[parent]["interactions"]
        require(all(x["name"]!=label for x in rows),"Duplicate artist interaction")
        rows.append({"name":label,"response":atom(r["theme_native_response"]),
                     "guardrail":atom(r["input_sovereignty_guardrails"])})
    for r in data["music_routes"]:
        k=key(r["playlist_id"]);parent=key(r["artist_id"])
        require(k.startswith(("pl.","music.")) and k not in ids and parent in artists,"Unresolved music route")
        artists[parent]["recorded_music_routes"]+=1
        ids.add(k)
    for artist in artists.values():
        require(all(artist[k] for k in ("worlds","districts","weather")) and len(artist["timeflow"])==4 and len(artist["interactions"])==5,"Incomplete artist authority")
    return (json.dumps({"schema":"athena-foundry-artist-index-v1","source_sha256":PIN,"pinned_source":PROVENANCE,
        "coverage":EXPECTED,"scope":"Public curated names only. Grouped by artist as in the original authority, not a per-world district assignment or a rendered scene.",
        "artists":list(artists.values())},ensure_ascii=False,indent=2)+"\n").encode()

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument("--check",action="store_true")
    a=p.parse_args();expected=generate()
    if a.check:require(DEST.read_bytes().replace(b"\r\n",b"\n")==expected,"Generated artist index differs")
    else:DEST.write_bytes(expected)
    print("Reviewed artist index: 5 artists, 10 worlds, 20 districts, 20 weather records, 20 phase labels, 25 interaction recipes and 21 route counts; no raw provenance or media.")
if __name__=="__main__":main()
