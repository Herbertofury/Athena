import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import successor_review as command
from convert import write_bundle

ROOT = Path(__file__).resolve().parents[3]
CAT = ROOT / 'dist/workspaces/foundry/catalog.json'


class SuccessorReviewCLI(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        theme = json.loads(CAT.read_bytes())['themes'][0]
        one = {'assetId': 'owned', 'scope': 'ui', 'gravity': False, 'gravityAfterPeel': False,
               'x': 45, 'y': 45, 'rotation': 11, 'scaleX': 1, 'scaleY': 1, 'opacity': .8,
               'blendMode': 'normal', 'locked': False, 'zIndex': 10, 'skewX': 0, 'skewY': 0,
               'brightness': 1, 'contrast': 1, 'saturation': 1, 'hue': 0, 'blur': 0,
               'visible': True, 'anchor': 'mc', 'pinTargetId': None, 'pinTargetKey': None,
               'pinX': .5, 'pinY': .5}

        def make(folder, rows):
            raw = json.dumps(rows).encode()
            source = self.root / (folder + '.json')
            source.write_bytes(raw)
            frame = {'left': 0, 'top': 0, 'width': 100, 'height': 100}
            size = {'width': 10, 'height': 10}
            mapping = {'sourceSha256': hashlib.sha256(raw).hexdigest(),
                       'coordinatePolicy': 'proportional-centers',
                       'assetReview': 'manual-equivalence-confirmed',
                       'stackingReview': 'independent-surfaces-reviewed',
                       'themeId': theme['id'], 'roomId': theme['rooms'][0]['id'],
                       'assets': {'owned': theme['objects'][0]['id']},
                       'rows': [{'index': i, 'sourceFrame': frame, 'targetFrame': frame,
                                 'sourceSize': size, 'targetSize': size, 'anchor': None}
                                for i in range(len(rows))]}
            mapping_file = self.root / (folder + '-mapping.json')
            mapping_file.write_text(json.dumps(mapping))
            result = self.root / folder
            write_bundle(source, mapping_file, result, CAT)
            return result

        self.prior = make('prior-owned-Ω', [one])
        self.incoming = make('incoming-owned-Ω', [{**one, 'zIndex': 11},
                                                  {**one, 'zIndex': 12, 'x': 62}])
        self.prior_layout = json.loads((self.prior / 'athena-workspace.json').read_bytes())
        incoming = json.loads((self.incoming / 'athena-workspace.json').read_bytes())
        self.old_id, = self.prior_layout['active']['placements']
        successor, new = incoming['active']['placements']
        self.current = self.root / 'selected-current.json'
        self.current.write_bytes((self.prior / 'athena-workspace.json').read_bytes())
        self.receipt = self.root / 'selected-receipt.json'
        self.form = {'kind': 'athena-scrapbook-successor-review', 'schema': 1,
                     'currentWorkspaceSha256': command.digest(self.current.read_bytes()),
                     'rows': [{'decision': 'successor', 'priorId': self.old_id, 'incomingId': successor},
                              {'decision': 'new', 'priorId': None, 'incomingId': new}]}
        for label, folder in [('prior', self.prior), ('incoming', self.incoming)]:
            self.form[label] = {'sourceSha256': command.digest((folder/'source-original.utf8').read_bytes()),
                                'mappingSha256': command.digest((folder/'mapping-private.json').read_bytes())}

    def invoke(self, form=None, rc=0, same_bytes=False):
        if not same_bytes:
            self.receipt.write_text(json.dumps(self.form if form is None else form))
        before = {f.relative_to(self.root): f.read_bytes() for f in self.root.rglob('*') if f.is_file()}
        invocation = subprocess.run([
            sys.executable, '-B', str(Path(command.__file__)), '--prior-bundle', str(self.prior),
            '--incoming-bundle', str(self.incoming), '--current-workspace', str(self.current),
            '--receipt', str(self.receipt), '--catalog', str(CAT)], capture_output=True, cwd=self.root,
            timeout=10)
        self.assertEqual(invocation.returncode, rc, invocation.stdout + invocation.stderr)
        self.assertEqual({f.relative_to(self.root): f.read_bytes()
                          for f in self.root.rglob('*') if f.is_file()}, before)
        self.assertEqual(invocation.stderr, b'')
        self.assertNotIn(str(self.root).encode(), invocation.stdout)
        self.assertNotIn(self.old_id.encode(), invocation.stdout)
        return json.loads(invocation.stdout)

    def test_moved_exact_bundle_preview_separates_successor_and_new(self):
        target = self.root / 'relocated prior Ω'
        self.prior.rename(target)
        self.prior = target
        result = self.invoke()
        self.assertEqual(result['counts'], {'prior': 1, 'incoming': 2, 'preservePriorId': 1,
                                          'successorsWithPlacementChanges': 1, 'explicitNew': 1,
                                          'wouldRemove': 0})
        self.assertTrue(result['readOnly'])
        self.assertFalse(result['applied'] or result['inferredIdentity'] or result['sourceRetirementSafe'])

    def test_each_source_mapping_and_current_byte_binding_is_exact(self):
        for kind in ('prior', 'incoming'):
            for field in ('sourceSha256', 'mappingSha256'):
                with self.subTest(kind=kind, field=field):
                    wrong = copy.deepcopy(self.form)
                    wrong[kind][field] = 'a'*64
                    self.assertIn('error', self.invoke(wrong, rc=2))
        self.current.write_bytes(self.current.read_bytes() + b'\n')
        self.assertIn('error', self.invoke(rc=2))

    def test_wrong_target_layout_refused_even_when_current_digest_is_updated(self):
        changed = copy.deepcopy(self.prior_layout)
        changed['active']['placements'][self.old_id]['x'] = .7
        self.current.write_text(json.dumps(changed))
        latest = {**self.form, 'currentWorkspaceSha256': command.digest(self.current.read_bytes())}
        self.assertIn('error', self.invoke(latest, rc=2))

    def test_json_boolean_is_not_a_numeric_alias_of_prior_values(self):
        wrong = copy.deepcopy(self.prior_layout)
        wrong['active']['placements'][self.old_id]['scaleX'] = True
        wrong['layouts'][wrong['active']['roomId']] = copy.deepcopy(wrong['active'])
        self.current.write_text(json.dumps(wrong))
        reviewed = {**self.form, 'currentWorkspaceSha256': command.digest(self.current.read_bytes())}
        self.assertIn('error', self.invoke(reviewed, rc=2))

    def test_duplicates_unreviewed_removal_unknown_and_schema_rejected(self):
        for variant in ('duplicate', 'missing', 'all-new', 'wrong-id', 'ambiguous', 'schema', 'boolean'):
            with self.subTest(variant=variant):
                wrong = copy.deepcopy(self.form)
                if variant == 'duplicate':
                    wrong['rows'][1]['incomingId'] = wrong['rows'][0]['incomingId']
                elif variant == 'missing':
                    wrong['rows'].pop()
                elif variant == 'all-new':
                    wrong['rows'][0].update(decision='new', priorId=None)
                elif variant == 'wrong-id':
                    wrong['rows'][0]['priorId'] = wrong['rows'][0]['incomingId']
                elif variant == 'ambiguous':
                    wrong['rows'][0]['inferred'] = True
                elif variant == 'boolean':
                    wrong['schema'] = True
                else:
                    wrong['schema'] = 2
                self.assertIn('error', self.invoke(wrong, rc=2))

    def test_rejects_duplicate_json_keys_and_corrupt_bundle(self):
        self.receipt.write_text(json.dumps(self.form).replace('"schema": 1', '"schema": 1,"schema": 1'))
        self.assertIn('error', self.invoke(rc=2, same_bytes=True))
        path = self.incoming / 'athena-workspace.json'
        path.write_bytes(path.read_bytes().replace(b'"zIndex": 12', b'"zIndex": 17'))
        self.assertIn('error', self.invoke(rc=2))

    def test_symlink_or_special_input_refused_when_platform_supports_it(self):
        linked = self.root/'alias-current'
        try:
            linked.symlink_to(self.current)
        except (OSError, NotImplementedError):
            self.skipTest('Symlink creation unsupported in local executor')
        self.current = linked
        self.assertIn('error', self.invoke(rc=2))

    def test_postreview_reread_detects_change_before_success(self):
        self.receipt.write_text(json.dumps(self.form))
        raw = self.receipt.read_bytes()
        calls = 0
        verify = command.verify_bundle

        def inject(*args):
            nonlocal calls
            calls += 1
            verify(*args)
            if calls == 2:
                self.receipt.write_bytes(raw + b' ')
        with patch.object(command, 'verify_bundle', side_effect=inject):
            with self.assertRaisesRegex(ValueError, 'changed during review'):
                command.review(self.prior, self.incoming, self.current, self.receipt, CAT)
        self.assertEqual(self.receipt.read_bytes(), raw+b' ')


if __name__ == '__main__':
    unittest.main()
