"""Offline retained-evidence checks, not a Java or game-launch test."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

LAB = Path(__file__).resolve().parents[1] / 'experiments/classloading-boundary-lab'
spec = importlib.util.spec_from_file_location('classloading_boundary_lab', LAB / 'run.py')
lab = importlib.util.module_from_spec(spec); spec.loader.exec_module(lab)


class ClassloadingBoundary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.receipt = lab.read_json(LAB / 'observed-2026-11-11.json')
        cls.doc, cls.cases, _, _ = lab.input_identity()
        cls.rows = {r['id']: r for r in cls.receipt['observations']}

    def test_retained_receipt(self):
        d = lab.validate_receipt(self.receipt)
        self.assertTrue(d['all_expected']); self.assertEqual(d['observation_count'], 37)
        self.assertEqual(d['expected_failure_observations'], 8)

    def test_actual_absent_profile(self):
        d = self.receipt['compiled']['profiles']
        self.assertIn('client/ClientApi.class', d['complete'])
        self.assertNotIn('client/ClientApi.class', d['without_client'])
        self.assertEqual(len(d['complete']), 9); self.assertEqual(len(d['without_client']), 8)

    def test_discovery_does_not_initialize(self):
        for r in self.receipt['observations']:
            if r['operation'] == 'discover': self.assertEqual(r['actual']['events'], [])

    def test_direct_absence_is_class_not_found(self):
        self.assertEqual(self.rows['presence_without_client:1']['actual']['exception_chain'], ['java.lang.ClassNotFoundException'])

    def test_common_path_survives_failed_client_call(self):
        failed = self.rows['body_without_client:3']['actual']; later = self.rows['body_without_client:4']['actual']
        self.assertFalse(failed['success']); self.assertIn('java.lang.NoClassDefFoundError', failed['exception_chain'])
        self.assertTrue(later['success']); self.assertEqual(later['result'], 'common')
        self.assertEqual(later['events'], ['BodyReference'])

    def test_reflection_resolves_descriptor_without_initializing(self):
        r = self.rows['descriptor_without_client:2']['actual']
        self.assertFalse(r['success']); self.assertEqual(r['events'], [])
        self.assertEqual(r['exception_chain'][0], 'java.lang.NoClassDefFoundError')
        initialized = self.rows['descriptor_without_client:3']['actual']
        self.assertTrue(initialized['success']); self.assertEqual(initialized['events'], ['DescriptorReference'])

    def test_static_reference_poison(self):
        first = self.rows['static_without_client:2']['actual']; again = self.rows['static_without_client:3']['actual']
        self.assertEqual(first['events'], again['events']); self.assertEqual(first['events'], ['StaticReference'])
        self.assertEqual(again['exception_chain'], ['java.lang.NoClassDefFoundError', 'java.lang.ExceptionInInitializerError'])

    def test_condition_change_does_not_reinitialize(self):
        again = self.rows['initializer_retry:4']['actual']
        self.assertFalse(again['success']); self.assertEqual(again['events'], ['Exploding'])

    def test_fresh_loader_has_separate_initialization(self):
        row = self.rows['initializer_retry:5']; self.assertEqual(row['loader_generation'], 2)
        self.assertTrue(row['actual']['success']); self.assertEqual(row['actual']['events'], ['Exploding', 'Exploding'])

    def test_constant_access_is_not_initialization_probe(self):
        self.assertEqual(self.rows['constants:2']['actual']['result'], '7')
        self.assertEqual(self.rows['constants:2']['actual']['events'], [])
        self.assertEqual(self.rows['constants:3']['actual']['result'], '9')
        self.assertEqual(self.rows['constants:3']['actual']['events'], ['Constants'])

    def test_duplicate_json(self):
        with self.assertRaises(ValueError): lab.parse_json('{"x":1,"x":2}')

    def test_nonfinite_json(self):
        for value in ['NaN', 'Infinity', '-Infinity']:
            with self.assertRaises(ValueError): lab.parse_json(value)

    def test_input_byte_budget(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'large'; p.write_bytes(b'x' * 9)
            with self.assertRaises(ValueError): lab.read_bytes(p, 8)

    def test_invalid_case_types(self):
        for field, value in [('profile', []), ('operation', {}), ('loader_generation', True)]:
            d = copy.deepcopy(self.doc); d['cases'][0][field] = value
            with self.assertRaises(ValueError): lab.validate_cases(d)

    def test_unsafe_source(self):
        d = copy.deepcopy(self.doc); d['sources'][0] = '../escape.java'
        with self.assertRaises(ValueError): lab.validate_cases(d)

    def test_unhashable_source(self):
        d = copy.deepcopy(self.doc); d['sources'][0] = []
        with self.assertRaises(ValueError): lab.validate_cases(d)

    def test_unhashable_event(self):
        with self.assertRaises(ValueError): lab.validate_result({'success': True, 'result': 'ready', 'events': [[]], 'exception_chain': []})

    def test_failed_outcome_requires_null_result(self):
        with self.assertRaises(ValueError): lab.validate_result({'success': False, 'result': 'ready', 'events': [], 'exception_chain': ['java.lang.Error']})

    def test_success_cannot_have_exception(self):
        with self.assertRaises(ValueError): lab.validate_result({'success': True, 'result': 'ready', 'events': [], 'exception_chain': ['java.lang.Error']})

    def test_missing_driver_row(self):
        text = '\n'.join(self.receipt['driver_stdout'].splitlines()[:-1])
        with self.assertRaises(ValueError): lab.derive(text, self.doc, self.cases)

    def test_extra_driver_row(self):
        with self.assertRaises(ValueError): lab.derive(self.receipt['driver_stdout'] + '{}\n', self.doc, self.cases)

    def test_self_consistent_mismatch_stays_false(self):
        doc = copy.deepcopy(self.receipt); lines = doc['driver_stdout'].splitlines()
        row = json.loads(lines[1]); row['result'] = 'wrong'; lines[1] = json.dumps(row)
        doc['driver_stdout'] = '\n'.join(lines) + '\n'; doc.update(lab.derive(doc['driver_stdout'], self.doc, self.cases))
        self.assertFalse(lab.validate_receipt(doc)['all_expected'])

    def test_no_existing_output_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'prior.json'; p.write_text('keep evidence')
            self.assertEqual(lab.main(['--output', str(p)]), 2); self.assertEqual(p.read_text(), 'keep evidence')


def reject_receipt(path, value):
    def test(self):
        doc = copy.deepcopy(self.receipt); target = doc
        for part in path[:-1]: target = target[part]
        target[path[-1]] = value
        with self.assertRaises(ValueError): lab.validate_receipt(doc)
    return test


MUTATIONS = {
    'schema_bool': (['schema_version'], True),
    'scope_overclaim': (['scope'], 'Native dedicated server accepted'),
    'scope_missing': (['scope'], None),
    'runtime_scope': (['runtime_reference', 'scope'], 'Installed game support proven'),
    'input_hash': (['input_sha256', 'run.py'], '0' * 64),
    'timestamp': (['recorded_at_utc'], '2026-11-99T00:00:00+00:00'),
    'timezone': (['recorded_at_utc'], '2026-11-11T00:00:00+01:00'),
    'driver_exit_bool': (['driver_returncode'], False),
    'driver_exit': (['driver_returncode'], 1),
    'driver_stderr': (['driver_stderr'], 'warning'),
    'count_float': (['observation_count'], 37.0),
    'failure_count_float': (['expected_failure_observations'], 8.0),
    'all_expected_int': (['all_expected'], 1),
    'generation_bool': (['observations', 0, 'loader_generation'], True),
    'success_int': (['observations', 0, 'actual', 'success'], 1),
    'match_int': (['observations', 0, 'matches_expected'], 1),
    'class_major_float': (['compiled', 'inventory', 0, 'class_major'], 65.0),
    'absent_profile_pollution': (['compiled', 'profiles', 'without_client'], ['client/ClientApi.class']),
}
for name, (path, value) in MUTATIONS.items(): setattr(ClassloadingBoundary, 'test_reject_' + name, reject_receipt(path, value))


def reject_raw(row_index, key, value):
    def test(self):
        lines = self.receipt['driver_stdout'].splitlines(); row = json.loads(lines[row_index]); row[key] = value; lines[row_index] = json.dumps(row)
        with self.assertRaises(ValueError): lab.derive('\n'.join(lines) + '\n', self.doc, self.cases)
    return test


for name, (index, key, value) in {
    'wrong_runtime': (0, 'java_version', '25.0.1'),
    'wrong_identity': (1, 'id', 'presence_complete:2'),
    'generation_bool': (1, 'loader_generation', True),
    'success_int': (1, 'success', 1),
    'exception_shape': (1, 'exception_chain', ['not a java exception']),
    'impossible_success': (1, 'result', None),
    'extra_field': (1, 'unclaimed', True),
}.items(): setattr(ClassloadingBoundary, 'test_reject_raw_' + name, reject_raw(index, key, value))


if __name__ == '__main__': unittest.main()
