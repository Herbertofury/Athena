#!/usr/bin/env python3
"""Fixed fixtures only. No user paths, stdin, sockets, or external dependencies."""
import sys
sys.dont_write_bytecode = True
import json
from pathlib import Path
from lab import COMMANDS, MAX_BYTES, LabError, decode, run


def main(args):
    command = args[0] if len(args) == 1 and args[0] in COMMANDS else None
    try:
        if command is None:
            raise LabError('Supply exactly one fixed command: ' + ', '.join(COMMANDS))
        path = Path(__file__).resolve().parent / 'fixtures' / (command + '.json')
        if path.parent.is_symlink() or path.is_symlink():
            raise LabError('Fixture symlinks are not supported')
        if not path.is_file():
            raise LabError('Fixture must be a regular package file')
        with path.open('rb') as stream:
            raw = stream.read(MAX_BYTES + 1)
        output = run(command, decode(raw))
        status = 0
    except (LabError, OSError, RecursionError) as exc:
        message = str(exc) if isinstance(exc, LabError) else 'Fixture unavailable or invalid'
        output = {'command': command, 'real_network_executed': False, 'synthetic_model': True,
                  'error': {'code': 'invalid_input', 'message': message}}
        status = 2
    print(json.dumps(output, indent=2, sort_keys=True, allow_nan=False))
    return status

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
