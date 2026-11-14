#!/usr/bin/env python3
"""Run a fixed, isolated Git delivery exercise. Verified on Linux with Python 3.12.14 and Git 2.52.0."""
import argparse
import json
import sys
import lab


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('exercise', choices=lab.COMMANDS)
    args = parser.parse_args(argv)
    try:
        result = lab.run(args.exercise)
    except (lab.LabError, ValueError) as exc:
        print(json.dumps({'exercise': args.exercise, 'ok': False, 'error': str(exc)}), file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2, sort_keys=True, allow_nan=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
