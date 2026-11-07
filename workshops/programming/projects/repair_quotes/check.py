#!/usr/bin/env python3
"""Run visible tests against a fixed local starter or reference module.
This executes Python code with your normal permissions; it is not a sandbox.
"""
import argparse
import importlib.util
from pathlib import Path
import unittest
R = Path(__file__).resolve().parent

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--target', choices=['starter', 'reference'], default='starter')
    a = p.parse_args()
    candidate = load('candidate_' + R.name, R / (a.target + '.py'))
    specs = load('specs_' + R.name, R / 'specs.py')
    result = unittest.TextTestRunner(verbosity=2).run(specs.make_suite(candidate))
    if a.target == 'starter' and (not result.wasSuccessful()):
        print('Starter failures are expected before implementation. Work from CONTRACT.md; keep the tests meaningful.')
    return 0 if result.wasSuccessful() else 1
if __name__ == '__main__':
    raise SystemExit(main())
