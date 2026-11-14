"""Offline evidence checks; native Gradle execution is an explicit separate step."""
import base64
import copy
import importlib.util
import io
import json
from pathlib import Path
import unittest
import warnings
import zipfile

LAB = Path(__file__).resolve().parents[1] / 'experiments/resource-packaging-lab'
spec = importlib.util.spec_from_file_location('resource_packaging_lab', LAB / 'run.py')
lab = importlib.util.module_from_spec(spec); spec.loader.exec_module(lab)


def zip_bytes(entries):
    result = io.BytesIO()
    with warnings.catch_warnings():
        warnings.simplefilter('ignore', UserWarning)
        with zipfile.ZipFile(result, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
            for name, data in entries: archive.writestr(name, data)
    return result.getvalue()


class PackagingLab(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.receipt = lab.read_json(LAB / 'observed-2026-11-11.json')
        cls.fixtures = lab.read_json(LAB / 'fixtures.json')

    def test_retained_receipt(self):
        result = lab.validate_receipt(self.receipt)
        self.assertTrue(result['all_expected']); self.assertEqual(result['successful_archives'], 10)
        self.assertEqual(result['expected_failed_builds'], 2)

    def test_binary_payload_retained(self):
        artifact = self.receipt['artifacts'][0]
        with zipfile.ZipFile(io.BytesIO(base64.b64decode(artifact['base64']))) as archive:
            self.assertEqual(archive.read('assets/atlas_lab/data/bytes.bin'), bytes(range(256)))

    def test_reproducible_incomplete_archives(self):
        obs = {r['id']: r for r in self.receipt['observations']}
        self.assertEqual(obs['a:missingJar']['archive']['sha256'], obs['b:missingJar']['archive']['sha256'])
        self.assertFalse(obs['a:missingJar']['complete_primary_resources'])
        self.assertFalse(obs['b:missingJar']['complete_primary_resources'])

    def test_timestamp_negative_control(self):
        rows = {r['task']: r for r in self.receipt['comparisons']}
        self.assertFalse(rows['timestampJar']['archive_bytes_equal'])
        self.assertTrue(rows['defaultJar']['archive_bytes_equal'])

    def test_exclude_order_changes_winner(self):
        obs = {r['id']: r for r in self.receipt['observations']}
        self.assertTrue(obs['a:excludeJar']['complete_primary_resources'])
        self.assertFalse(obs['b:excludeJar']['complete_primary_resources'])
        self.assertNotEqual(obs['a:excludeJar']['resource_entries'], obs['b:excludeJar']['resource_entries'])

    def test_include_retains_duplicates(self):
        for variant in ['a', 'b']:
            obs = next(r for r in self.receipt['observations'] if r['id'] == variant + ':includeJar')
            self.assertEqual(obs['duplicate_paths'], ['assets/atlas_lab/data/message.txt'])
            self.assertEqual(len(obs['resource_entries']), 4)

    def test_identical_duplicate_build_fails(self):
        row = self.receipt['runs'][3]
        self.assertEqual(row['id'], 'a:failIdentical'); self.assertNotEqual(row['returncode'], 0)
        self.assertIn('has already been copied there', row['stderr'])

    def test_each_zipinfo_occurrence_read(self):
        rows = lab.inspect_archive(zip_bytes([('same.txt', b'first'), ('same.txt', b'second')]))['entries']
        self.assertEqual([r['sha256'] for r in rows], [lab.digest(b'first'), lab.digest(b'second')])

    def test_unsafe_archive_paths(self):
        for name in ['../escape', '/absolute', 'a/../escape', 'a\\b', 'C:drive', 'a//b', 'a/./b', 'a\x00b']:
            with self.subTest(name=name), self.assertRaises(ValueError): lab.safe_path(name)

    def test_expanded_byte_budget(self):
        with self.assertRaises(ValueError): lab.inspect_archive(zip_bytes([('big.bin', b'x' * 65537)]))

    def test_entry_budget(self):
        with self.assertRaises(ValueError): lab.inspect_archive(zip_bytes([(str(i), b'x') for i in range(65)]))

    def test_archive_byte_budget(self):
        with self.assertRaises(ValueError): lab.inspect_archive(b'x' * 65537)

    def test_malformed_zip(self):
        with self.assertRaises(zipfile.BadZipFile): lab.inspect_archive(b'not a zip')

    def test_duplicate_json_key(self):
        with self.assertRaises(ValueError): lab.parse_json('{"a":1,"a":2}')

    def test_nonfinite_json(self):
        for value in ['NaN', 'Infinity', '-Infinity']:
            with self.assertRaises(ValueError): lab.parse_json(value)

    def test_changed_fixture_perturbations(self):
        for key, value in [('mtime', True), ('reverse_creation', 1)]:
            d = copy.deepcopy(self.fixtures); d['variants']['a'][key] = value
            with self.assertRaises(ValueError): lab.validate_fixtures(d)

    def test_fixture_unsafe_path(self):
        d = copy.deepcopy(self.fixtures); d['resources'][0]['path'] = '../escape'
        with self.assertRaises(ValueError): lab.validate_fixtures(d)

    def test_same_value_type_strict(self):
        for a, b in [(True, 1), (1, 1.0), ([1], [True]), ({'x': 1}, {'x': 1.0})]: self.assertFalse(lab.same_value(a, b))

    def manifest_mutation(self, action):
        artifacts = copy.deepcopy(self.receipt['artifacts'])
        with zipfile.ZipFile(io.BytesIO(base64.b64decode(artifacts[0]['base64']))) as archive:
            entries = [(row.filename, archive.read(row)) for row in archive.infolist() if not row.is_dir()]
        if action == 'missing': entries = [(n, b) for n, b in entries if n != 'META-INF/MANIFEST.MF']
        elif action == 'changed': entries = [(n, b'Changed: yes\r\n\r\n' if n == 'META-INF/MANIFEST.MF' else b) for n, b in entries]
        elif action == 'duplicate': entries.append(('META-INF/MANIFEST.MF', b'Manifest-Version: 1.0\r\n\r\n'))
        artifacts[0]['base64'] = base64.b64encode(zip_bytes(entries)).decode()
        observations, _ = lab.analyze(artifacts, self.fixtures)
        self.assertFalse(observations[0]['matches_expected'])
        if action == 'duplicate': self.assertIn('META-INF/MANIFEST.MF', observations[0]['duplicate_paths'])

    def test_missing_manifest(self): self.manifest_mutation('missing')

    def test_changed_manifest(self): self.manifest_mutation('changed')

    def test_duplicate_manifest(self): self.manifest_mutation('duplicate')

    def test_missing_artifact(self):
        with self.assertRaises(ValueError): lab.analyze(self.receipt['artifacts'][:-1], self.fixtures)

    def test_extra_artifact(self):
        with self.assertRaises(ValueError): lab.analyze(self.receipt['artifacts'] + [self.receipt['artifacts'][0]], self.fixtures)

    def test_bad_base64(self):
        d = copy.deepcopy(self.receipt['artifacts']); d[0]['base64'] = '###'
        with self.assertRaises(ValueError): lab.analyze(d, self.fixtures)

    def test_changed_payload_is_mismatch(self):
        d = copy.deepcopy(self.receipt['artifacts'])
        d[0]['base64'] = base64.b64encode(zip_bytes([('atlas-lab.json', b'wrong')])).decode()
        observations, _ = lab.analyze(d, self.fixtures)
        self.assertFalse(observations[0]['matches_expected'])


def reject_mutation(path, value):
    def test(self):
        doc = copy.deepcopy(self.receipt); target = doc
        for part in path[:-1]: target = target[part]
        target[path[-1]] = value
        with self.assertRaises((ValueError, zipfile.BadZipFile)): lab.validate_receipt(doc)
    return test


MUTATIONS = {
    'schema_bool': (['schema_version'], True),
    'scope_overclaim': (['scope'], 'Native game compatibility accepted'),
    'scope_missing': (['scope'], None),
    'dependency_bytes_float': (['dependency', 'bytes'], 135535598.0),
    'input_hash': (['input_sha256', 'run.py'], '0' * 64),
    'flags': (['flags'], ['--online']),
    'invalid_date': (['recorded_at_utc'], '2026-99-11T01:00:00+00:00'),
    'wrong_timezone': (['recorded_at_utc'], '2026-11-11T01:00:00+01:00'),
    'version': (['gradle_version_stdout'], 'Gradle 9.9.1'),
    'missing_runs': (['runs'], []),
    'failed_success': (['runs', 0, 'returncode'], 1),
    'exit_bool': (['runs', 0, 'returncode'], False),
    'successful_failure': (['runs', 2, 'returncode'], 0),
    'missing_failure_detail': (['runs', 2, 'stderr'], 'BUILD FAILED'),
    'artifact_order': (['artifacts', 0, 'id'], 'b:defaultJar'),
    'archive_hash': (['observations', 0, 'archive', 'sha256'], '0' * 64),
    'entry_index_bool': (['observations', 0, 'archive', 'entries', 0, 'index'], False),
    'bytes_float': (['observations', 0, 'archive', 'bytes'], 0.0),
    'match_int': (['observations', 0, 'matches_expected'], 1),
    'comparison_bool': (['comparisons', 0, 'archive_bytes_equal'], 1),
    'summary_bool': (['successful_archives'], True),
    'failure_count_float': (['expected_failed_builds'], 2.0),
    'summary_int': (['all_expected'], 1),
}
for name, (path, value) in MUTATIONS.items(): setattr(PackagingLab, 'test_reject_' + name, reject_mutation(path, value))


if __name__ == '__main__': unittest.main()
