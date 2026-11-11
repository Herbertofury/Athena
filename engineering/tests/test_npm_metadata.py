"""Synthetic fixtures: these tests do not assert live registry behavior."""
import importlib.util
import json
import sys
import unittest
from unittest.mock import patch
from pathlib import Path

PATH = Path(__file__).resolve().parents[1] / 'experiments/npm-metadata-lab/metadata.py'
spec = importlib.util.spec_from_file_location('npm_metadata', PATH)
npm = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = npm
spec.loader.exec_module(npm)


def document():
    return {'name': 'example', 'description': 'root secret', 'readme': 'root ![x](https://example.org/a)',
            'dist-tags': {'latest': '2.0.0', 'old': '1.0.0'},
            'versions': {'1.0.0': {'name': 'example', 'version': '1.0.0', 'description': 'old secret',
                                    'author': {'name': 'author secret'}, 'maintainers': [{'name': 'maint secret'}],
                                    '_npmUser': {'name': 'publisher secret'}, 'license': 'MIT',
                                    'dependencies': {'dependency': '^1'}, 'extension': {'secret': 'kept'}},
                         '2.0.0': {'name': 'example', 'version': '2.0.0'}}}


def capture(doc=None, **changes):
    result = {'request_url': 'https://registry.npmjs.org/example',
              'final_url': 'https://registry.npmjs.org/example', 'accept': npm.FULL,
              'status': 200, 'content_type': npm.FULL + '; charset=utf-8',
              'body': json.dumps(document() if doc is None else doc).encode(), 'complete': True}
    result.update(changes)
    return result


class MetadataTests(unittest.TestCase):
    def run_capture(self, value, **selector):
        return npm.reconcile([value], package='example', **(selector or {'version': '1.0.0'}))

    def test_scope_roles_and_no_fallback(self):
        report = self.run_capture(capture())
        obs = report.observations[0]
        self.assertEqual(obs['state'], 'metadata_observed')
        self.assertNotEqual(obs['source_document']['description'], obs['selected_source']['description'])
        self.assertEqual(obs['selected_states']['readme'], 'missing')
        self.assertEqual(obs['selected_source']['extension']['secret'], 'kept')
        self.assertFalse(obs['root_readme_projection']['projectionComplete'])
        self.assertEqual(obs['selected_source']['_npmUser']['name'], 'publisher secret')
        with self.assertRaises(TypeError):
            obs['selected_source']['author']['name'] = 'changed'

    def test_tag_is_exact_pointer_not_ranking(self):
        report = self.run_capture(capture(), tag='old')
        self.assertEqual(report.observations[0]['selected_version'], '1.0.0')
        self.assertEqual(self.run_capture(capture(), tag='absent').observations[0]['state'], 'tag_unresolved')
        with self.assertRaises(npm.ExtractionError):
            npm.reconcile([capture()], package='example')

    def test_representation_omissions(self):
        data = document()
        del data['versions']['1.0.0']['description']
        report = self.run_capture(capture(data, accept=npm.ABBREVIATED, content_type=npm.ABBREVIATED))
        self.assertEqual(report.observations[0]['selected_states']['description'], 'missing')
        self.assertEqual(report.observations[0]['representation'], 'abbreviated')
        self.assertEqual(self.run_capture(capture(accept=npm.ABBREVIATED)).observations[0]['state'], 'representation_mismatch')

    def test_field_states(self):
        data = document()
        v = data['versions']['1.0.0']
        v.update(description=None, license='', deprecated=False, dependencies={'x': 3}, maintainers=[])
        states = self.run_capture(capture(data)).observations[0]['selected_states']
        self.assertEqual([states[k] for k in ('description', 'license', 'deprecated', 'dependencies', 'maintainers', 'readme')],
                         ['null', 'empty', 'invalid', 'invalid', 'empty', 'missing'])

    def test_failures_retained_next_to_success(self):
        values = [capture(status=403), capture(complete=False), capture(error='private transport detail'), capture()]
        report = npm.reconcile(values, package='example', version='1.0.0')
        self.assertEqual([o['state'] for o in report.observations],
                         ['access_denied', 'incomplete', 'transport_error', 'metadata_observed'])
        self.assertNotIn('private transport detail', json.dumps(report.receipt()))

    def test_strict_json(self):
        for raw in [b'{"name":"a","name":"b"}', b'{"x":NaN}', b'{"x":1e999}',
                    b'{"x":"\\ud800"}', b'[]', b'[' * 1000 + b']' * 1000, b'{bad']:
            with self.subTest(raw=raw[:30]):
                self.assertEqual(self.run_capture(capture(body=raw)).observations[0]['state'], 'invalid_json')

    def test_provenance_and_identity(self):
        for url in ['https://evil.test/example', 'https://registry.npmjs.org/example/1.0.0',
                    'https://registry.npmjs.org/example?token=private', 'https://registry.npmjs.org/example#x',
                    'https://user@registry.npmjs.org/example', 'http://registry.npmjs.org/example']:
            self.assertEqual(self.run_capture(capture(final_url=url)).observations[0]['state'], 'provenance_mismatch')
        data = document()
        data['versions']['1.0.0']['version'] = '2.0.0'
        self.assertEqual(self.run_capture(capture(data)).observations[0]['state'], 'identity_mismatch')
        self.assertTrue(npm.endpoint('https://registry.npmjs.org/@scope%2Fname', '@scope/name'))

    def test_bounds_and_exact_types_before_copy(self):
        class Hostile(dict):
            def items(self):
                self.fail('must not invoke subclass')
        with self.assertRaises(npm.ExtractionError):
            npm.reconcile([Hostile()], package='example', version='1')
        with self.assertRaises(npm.ExtractionError):
            npm.reconcile([capture()] * (npm.MAX_CAPTURES + 1), package='example', version='1')
        cycle = []
        cycle.append(cycle)
        with self.assertRaises(npm.ExtractionError):
            npm.bounded(cycle)
        with self.assertRaises(npm.ExtractionError):
            npm.bounded({'x': [None] * npm.MAX_NODES})
        self.assertEqual(self.run_capture(capture(status=True)).observations[0]['state'], 'invalid_envelope')

    def test_body_aggregate_and_projection_budgets(self):
        with patch.object(npm, 'MAX_BODY_BYTES', 8):
            self.assertEqual(self.run_capture(capture()).observations[0]['state'], 'invalid_envelope')
        with patch.object(npm, 'MAX_TOTAL_BYTES', 8):
            with self.assertRaises(npm.ExtractionError):
                self.run_capture(capture())
        with patch.object(npm, 'MAX_PROJECTION_CHARS', 2):
            obs = self.run_capture(capture()).observations[0]
            self.assertEqual(obs['root_readme_projection_state'], 'omitted_budget')
            self.assertNotIn('root_readme_projection', obs)
            self.assertEqual(obs['source_document']['readme'], document()['readme'])

    def test_cross_representation_tag_conflict(self):
        first = capture()
        data = document()
        data['dist-tags']['latest'] = '1.0.0'
        second = capture(data, accept=npm.ABBREVIATED, content_type=npm.ABBREVIATED)
        report = npm.reconcile([first, second], package='example', tag='latest')
        self.assertEqual(report.conflicts, 1)
        self.assertEqual([o['selected_version'] for o in report.observations], ['2.0.0', '1.0.0'])

    def test_utf8_selectors_and_null_version(self):
        for codec in ('utf-16', 'utf-32'):
            raw = json.dumps(document()).encode(codec)
            self.assertEqual(self.run_capture(capture(body=raw)).observations[0]['state'], 'invalid_json')
        with self.assertRaises(npm.ExtractionError):
            self.run_capture(capture(), version='\ud800')
        data = document()
        data['versions']['1.0.0'] = None
        self.assertEqual(self.run_capture(capture(data)).observations[0]['state'], 'identity_mismatch')
        del data['versions']['1.0.0']
        self.assertEqual(self.run_capture(capture(data)).observations[0]['state'], 'version_missing')

    def test_projection_failure_and_receipt_diagnostics(self):
        with patch.object(npm, 'markdown_body', side_effect=ValueError('private failure')):
            report = self.run_capture(capture())
        obs = report.observations[0]
        self.assertEqual(obs['state'], 'metadata_observed')
        self.assertEqual(obs['root_readme_projection_state'], 'projection_failed')
        self.assertEqual(obs['source_document']['readme'], document()['readme'])
        public = report.receipt()['observations'][0]
        raw = document()['readme'].encode()
        self.assertEqual(public['rootReadme']['sha256'], npm.digest(raw))
        self.assertEqual(public['rootReadme']['bytes'], len(raw))
        self.assertEqual(public['versionCount'], 2)
        self.assertEqual(public['selectedVersionSha256'], npm.digest(b'1.0.0'))
        self.assertEqual(public['selectedReadme']['state'], 'missing')
        self.assertNotIn('private failure', json.dumps(report.receipt()))
        working = self.run_capture(capture()).receipt()['observations'][0]
        self.assertEqual(working['rootReadme']['mediaCount'], 1)

    def test_conflicts_and_mutation(self):
        first = capture()
        second = capture(document() | {'description': 'changed secret'})
        report = npm.reconcile([first, second], package='example', version='1.0.0')
        self.assertEqual(report.conflicts, 1)
        first['status'] = 500
        self.assertEqual(report.observations[0]['source_capture']['status'], 200)
        public = report.receipt()
        public['observations'][0]['rootFields']['description'] = 'tampered'
        self.assertEqual(report.receipt()['observations'][0]['rootFields']['description'], 'present')
        encoded = json.dumps(report.receipt())
        for secret in ['example', 'secret', 'https:', 'MIT', '1.0.0', '_npmUser": {']:
            self.assertNotIn(secret, encoded)
        for key in ('archiveVerified', 'authenticityVerified', 'installAccepted', 'compatibilityAccepted', 'playbackAccepted', 'targetAccepted'):
            self.assertIs(report.receipt()[key], False)


if __name__ == '__main__':
    unittest.main()
