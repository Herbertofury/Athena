"""Driver safety boundaries; full owned-service checks are retained separately."""
import argparse
import importlib.util
import pathlib
import subprocess
import sys
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'experiments/native-app-ui-lab/check_current_http.py'

class CurrentAppDriverTests(unittest.TestCase):
    def test_import_does_not_parse_arguments_or_start_service(self):
        spec = importlib.util.spec_from_file_location('atlas_current_driver_import_test', SCRIPT)
        module = importlib.util.module_from_spec(spec)
        with patch.object(argparse.ArgumentParser, 'parse_args', side_effect=AssertionError('Import parsed CLI')), patch.object(subprocess, 'Popen', side_effect=AssertionError('Import started process')):
            spec.loader.exec_module(module)
        self.assertTrue(callable(module.main))

    def test_arbitrary_binary_override_is_not_supported(self):
        result = subprocess.run([sys.executable, str(SCRIPT), '--source-db', 'fixture.sqlite', '--output', 'new-output', '--binary', 'unrecognized-program'], capture_output=True, timeout=5)
        self.assertEqual(result.returncode, 2)
        self.assertIn(b'unrecognized arguments: --binary', result.stderr)

    def test_help_has_only_owned_fixture_inputs(self):
        result = subprocess.run([sys.executable, str(SCRIPT), '--help'], capture_output=True, timeout=5)
        self.assertEqual(result.returncode, 0)
        self.assertIn(b'--source-db', result.stdout)
        self.assertIn(b'--output', result.stdout)
        self.assertNotIn(b'--binary', result.stdout)

if __name__ == '__main__':
    unittest.main()
