#!/usr/bin/env python3
"""Fixed CLI: no paths, arbitrary expressions, network or output files."""
import sys
sys.dont_write_bytecode = True
import argparse
import json
from lab import COMMANDS, receipt

def main(argv=None):
    parser = argparse.ArgumentParser(description='Run one fixed synthetic Python BI conceptual model, not Power BI.')
    parser.add_argument('exercise', choices=COMMANDS)
    args = parser.parse_args(argv)
    print(json.dumps(receipt(args.exercise), sort_keys=True, indent=2, allow_nan=False))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
