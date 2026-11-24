#!/usr/bin/env python3
"""Run one fixed synthetic project fixture, printing JSON only. No external I/O."""
import argparse
import importlib.util
import json
from pathlib import Path
import sys
R=Path(__file__).resolve().parents[1]


def load(project,implementation):
    if project not in {'repair_quotes','event_summary'} or implementation not in {'starter','reference'}:raise ValueError('fixed project and implementation required')
    spec=importlib.util.spec_from_file_location('project_'+project,R/'projects'/project/(implementation+'.py'))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module


def run(project,implementation):
    module=load(project,implementation)
    name,limit=('quote.json',8192) if project=='repair_quotes' else ('events.csv',16384)
    # Read a bounded amount from the known bundled fixture, not a CLI-supplied path.
    with (R/'projects'/project/'fixtures'/name).open('rb') as file:raw=file.read(limit+1)
    if len(raw)>limit:raise ValueError('fixture exceeds byte limit')
    text=raw.decode('utf-8')
    if project=='repair_quotes':
        result=module.quote_total(module.parse_quote_json(text));result['display_subtotal']=module.format_cents(result['subtotal_cents'])
        return result
    return module.summarize_events(module.parse_events_csv(text))


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('project',choices=['repair_quotes','event_summary'])
    p.add_argument('--implementation',choices=['starter','reference'],default='starter')
    a=p.parse_args()
    try:result=run(a.project,a.implementation)
    except NotImplementedError:
        print('Starter unfinished: implement the functions and run its acceptance tests.',file=sys.stderr);return 2
    except (ValueError,UnicodeError) as exc:
        print('Invalid synthetic input: '+str(exc),file=sys.stderr);return 2
    print(json.dumps(result,indent=2,ensure_ascii=False,sort_keys=True,allow_nan=False));return 0

if __name__=='__main__':raise SystemExit(main())
