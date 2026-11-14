#!/usr/bin/env python3
"""Ten fixed local demonstrations; no AWS accounts, APIs, network, or writes."""
import sys
sys.dont_write_bytecode = True
import inspect
import json
from pathlib import Path
import lab

COMMANDS = ('identity', 'network', 'storage', 'compute', 'queues', 'database',
            'resilience', 'operations', 'cost', 'capstone')
FUNCTIONS = dict(identity=lab.identity, network=lab.network, storage=lab.decision_matrix,
                 compute=lab.decision_matrix, queues=lab.queues, database=lab.decision_matrix,
                 resilience=lab.resilience, operations=lab.operations, cost=lab.cost)
ROOT = Path(__file__).resolve().parent


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise lab.ContractError('fixture: duplicate JSON object key')
        result[key] = value
    return result


def reject_constant(value):
    raise lab.ContractError('fixture: nonfinite JSON number')


def fixtures():
    # Only this package-owned path is read. No user path is accepted.
    with (ROOT / 'fixtures' / 'scenarios.json').open('rb') as stream:
        raw = stream.read(65537)
    if len(raw) > 65536:
        raise lab.ContractError('fixture: exceeds 65536 bytes')
    try:
        cases = json.loads(raw.decode('utf-8'), object_pairs_hook=unique_object,
                           parse_constant=reject_constant)
    except (ValueError, UnicodeError, RecursionError) as exc:
        raise lab.ContractError('fixture: malformed JSON') from exc
    lab.record(cases, COMMANDS[:-1], 'fixtures')
    return cases


def run(name):
    if type(name) is not str or name not in COMMANDS:
        raise lab.ContractError('unknown fixed exercise')
    cases = fixtures()
    if name == 'capstone':
        result = lab.capstone(cases)
    else:
        function = FUNCTIONS[name]
        lab.record(cases[name], tuple(inspect.signature(function).parameters), name)
        result = function(**cases[name])
    return dict(exercise=name, execution_kind='synthetic_offline_model',
                real_aws_executed=False, result=result)


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    try:
        if len(argv) != 1:
            raise lab.ContractError('supply exactly one fixed exercise name')
        if argv[0] in ('--help', '-h'):
            output = dict(commands=list(COMMANDS), scope=__doc__)
        else:
            output = run(argv[0])
        status = 0
    except (lab.ContractError, OSError) as exc:
        output = dict(error=str(exc), error_type='input_contract', real_aws_executed=False)
        status = 2
    print(json.dumps(output, indent=2, sort_keys=True, allow_nan=False))
    return status


if __name__ == '__main__':
    sys.exit(main())
