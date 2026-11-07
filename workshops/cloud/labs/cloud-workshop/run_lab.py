#!/usr/bin/env python3
"""Run a fixed offline exercise. No cloud account, API, credential or charge."""
import argparse
import json
from pathlib import Path
import lab

R = Path(__file__).resolve().parent
COMMANDS = ('scope', 'network', 'scaling', 'failure', 'recovery', 'cost', 'changes', 'restore')

def fixtures():
    path = R/'fixtures/scenarios.json'
    with path.open('rb') as file:
        raw = file.read(32769)
    if len(raw) > 32768:
        raise ValueError('bundled fixture exceeds 32768 bytes')
    return json.loads(raw.decode('utf-8'))

def run(name):
    if name not in COMMANDS:
        raise ValueError('unknown fixed exercise')
    if name == 'restore':
        result = lab.restore_roundtrip()
    else:
        case = fixtures()[name]
        if name == 'scope':
            result = {label: [resource for resource in case['resources'] if lab.scope_contains(case[label], resource)] for label in ('narrow', 'broad')}
        elif name == 'network':
            result = {label: lab.connection_checks(**values) for label, values in case.items()}
        elif name == 'scaling':
            result = lab.replica_plan(**case)
        elif name == 'failure':
            result = {label: lab.failure_report(**values) for label, values in case.items()}
        elif name == 'recovery':
            result = lab.recovery_report(**case)
        elif name == 'cost':
            result = {label: lab.cost_estimate(**values) for label, values in case.items()}
        else:
            result = lab.plan_changes(**case)
    return dict(exercise=name, real_cloud_executed=False,
                execution_kind='actual_local_file_exercise' if name=='restore' else 'local_model', result=result)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('exercise',choices=COMMANDS)
    args=parser.parse_args()
    print(json.dumps(run(args.exercise),indent=2,sort_keys=True,allow_nan=False))

if __name__=='__main__':main()
