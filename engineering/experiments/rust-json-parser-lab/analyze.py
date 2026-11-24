#!/usr/bin/env python3
"""Summarize retained evidence without changing or dropping failing cases."""
import argparse,json,statistics
from decimal import Decimal,localcontext
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('result',type=Path);args=p.parse_args();d=json.loads(args.result.read_text())
rows=[]
for w in d['workloads']:
 t=[x for x in w['trials'] if not x['warmup']]
 rows.append({'fixture_index':w['fixture_index'],'input_bytes':w['input_bytes'],'measured_pairs':len(t),'all_value_equal':w['initial_full_value_equal'] and all(x['full_value_equal'] for x in t),'baseline_median_us':statistics.median(x['baseline_100_ns'] for x in t)/100000 if t else None,'candidate_with_copy_median_us':statistics.median(x['candidate_including_copy_100_ns'] for x in t)/100000 if t else None})
closeness={'baseline_closer':0,'candidate_closer':0,'tie':0}
with localcontext() as ctx:
 ctx.prec=100
 for e in d['generated_stress']['failure_evidence']:
  number=json.loads(e['input'],parse_float=Decimal).get('number')
  if number is None:raise ValueError('Unexpected failure shape; inspect it rather than skipping it')
  a=Decimal.from_float(e['baseline']['Ok']['number']);b=Decimal.from_float(e['candidate']['Ok']['number']);da,db=abs(a-number),abs(b-number)
  closeness['baseline_closer' if da<db else 'candidate_closer' if db<da else 'tie']+=1
print(json.dumps({'complete':d['complete'],'workloads':rows,'generated_stress':{'cases':d['generated_stress']['cases'],'failures':d['generated_stress']['failures'],'decimal_distance_classification':closeness},'unicode_failures':len(d['unicode_single_escape']['failure_evidence']),'pair_failures':len(d['unicode_pairs']['failure_evidence']),'adversarial_mismatches':[x['input'] for x in d['adversarial'] if not x['equivalent']]},indent=2))
