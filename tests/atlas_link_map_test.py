"""Offline target checks: an archive map is neither a redirect nor proof of HTTP availability."""
from collections import Counter
import hashlib
from html.parser import HTMLParser
import io
import importlib.util
import json
from pathlib import Path
import re
import tarfile
import unittest
import zipfile
from urllib.parse import unquote, urlsplit
ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / 'migration/engineering-atlas/metadata-2026-11-14'
class PublishedTargets(unittest.TestCase):
    def test_every_claimed_file_and_wiki_destination_exists(self):
        for row in json.loads((SNAPSHOT / 'source-link-inventory.json').read_text()):
            destination = row['preserved_or_native_destination']
            if not destination:
                continue
            with self.subTest(source=row['original']):
                parts = urlsplit(destination)
                if parts.path.startswith('/Herbertofury/Athena/blob/main/'):
                    path = unquote(parts.path.removeprefix('/Herbertofury/Athena/blob/main/'))
                    self.assertTrue((ROOT / path).is_file(), path)
                elif parts.path.startswith('/Herbertofury/Athena/wiki/'):
                    page = unquote(parts.path.removeprefix('/Herbertofury/Athena/wiki/'))
                    self.assertTrue((ROOT / 'wiki' / (page + '.md')).is_file(), page)
                elif not parts.scheme:
                    self.assertTrue((ROOT / destination).is_file(), destination)
    def test_historical_pages_map_covers_actual_atlas_anchors(self):
        work = ROOT / "migration/engineering-atlas/verification-2026-11-07"
        archive = (work / "engineering-atlas-pages-089b4ec.zip").read_bytes()
        digest = "645b9e78b496471eaeca7c1f4f7be217ab9cfbd9769b9ac7f8879f04745d2009"
        self.assertEqual(hashlib.sha256(archive).hexdigest(), digest)
        legacy = "https://github.com/Herbertofury/Engineering-Atlas"
        class OriginalAnchors(HTMLParser):
            def __init__(self):
                super().__init__()
                self.targets = []
            def handle_starttag(self, tag, attrs):
                if tag == "a":
                    self.targets.extend(value for key, value in attrs if key == "href"
                                        and value and (value == legacy or value.startswith(legacy + "/")))
        served, templates = Counter(), Counter()
        with zipfile.ZipFile(io.BytesIO(archive)) as outer:
            self.assertEqual(outer.namelist(), ["artifact.tar"])
            with tarfile.open(fileobj=io.BytesIO(outer.read("artifact.tar")), mode="r:") as tar:
                for item in tar:
                    if item.isfile() and item.name.endswith(".html"):
                        page = OriginalAnchors()
                        page.feed(tar.extractfile(item).read().decode("utf-8"))
                        (templates if item.name.endswith(".template.html") else served).update(page.targets)
        report = (work / "PAGES-LINK-RECOVERY.md").read_text(encoding="utf-8")
        targets = re.findall(r"^## `(https://github[.]com/Herbertofury/Engineering-Atlas[^`]*)`$", report, re.M)
        self.assertEqual(len(targets), 9)
        self.assertEqual(set(targets), set(served))
        self.assertTrue(set(templates) <= set(served))
        self.assertEqual(sum(served.values()), 13)
        self.assertEqual(sum(templates.values()), 10)
        self.assertEqual(report.count("[Read the exact retained Git object]"), 4)
        self.assertEqual(report.count("[Restore the exact object from the Athena-hosted source bundle]"), 5)
        self.assertIn(digest, report)
        self.assertIn("not browser or external-link acceptance", report)
        overview = (work.parent / "README.md").read_text(encoding="utf-8")
        self.assertIn("(verification-2026-11-07/PAGES-LINK-RECOVERY.md)", overview)

SPEC = importlib.util.spec_from_file_location("atlas_source_links", ROOT / "scripts/reconcile_atlas_source_links.py")
mapper = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mapper)

class MappingSemantics(unittest.TestCase):
    def mapped(self, url):
        row = {'original': url, 'locations': ['synthetic-fixture']}
        result = mapper.reconcile(row)
        self.assertEqual(result['original'], row['original'])
        self.assertEqual(result['locations'], row['locations'])
        return result
    def test_existing_athena_path_is_not_prefixed_again(self):
        url = mapper.ATHENA + '/blob/main/migration/engineering-atlas/README.md'
        self.assertEqual(self.mapped(url)['preserved_or_native_destination'], url)
    def test_missing_files_and_wiki_pages_remain_explicitly_unresolved(self):
        for path in ['blob/main/docs/adapters/discourse.md', 'wiki/Adapter-Round-Four-Other-Games']:
            row = self.mapped('https://github.com/Herbertofury/Engineering-Atlas/' + path)
            self.assertIsNone(row['preserved_or_native_destination'])
            self.assertTrue(row['classification'].startswith('unresolved'))
    def test_research_routes_keep_query_instead_of_losing_selection(self):
        row = self.mapped('https://herbertofury.github.io/Engineering-Atlas/explorer/?plan=planned-agent-protocol-v1#catalog')
        self.assertEqual(row['preserved_or_native_destination'], mapper.PAGES + '#research?plan=planned-agent-protocol-v1')
    def test_static_asset_targets_exact_archived_blob_instead_of_unshipped_pages_path(self):
        suffix = 'card-receiver-lab/receiver.de24fd43535f3039.js'
        relative = 'engineering/docs/' + suffix
        row = self.mapped('https://herbertofury.github.io/Engineering-Atlas/' + suffix)
        self.assertEqual(row['preserved_or_native_destination'],
                         mapper.ATHENA + '/blob/af594fd2cdd5c00f01178ee353965a54b01b05d7/' + relative)
        self.assertIn('not a served Pages path', row['classification'])
        source_files = json.loads((ROOT / 'migration/engineering-atlas/cutover-2026-11-13/source-manifest.json').read_text())['files']
        original = next(value for value in source_files if value['source_path'] == 'docs/' + suffix)
        self.assertEqual(original['relation'], 'exact')
        self.assertEqual(original['source_blob'], '1d166a6819a6e527109f512ac99b9377b5ea5c05')
        self.assertEqual(hashlib.sha256((ROOT / relative).read_bytes()).hexdigest(), original['source_sha256'])
    def test_other_static_files_are_not_assumed_to_have_a_pages_or_archive_target(self):
        row = self.mapped('https://herbertofury.github.io/Engineering-Atlas/card-receiver-lab/index.html')
        self.assertTrue((ROOT / 'engineering/docs/card-receiver-lab/index.html').is_file())
        self.assertIsNone(row['preserved_or_native_destination'])
        self.assertTrue(row['classification'].startswith('unresolved'))
    def test_creation_route_is_not_a_preserved_issue_body(self):
        row = self.mapped('https://github.com/Herbertofury/Engineering-Atlas/issues/new/choose')
        self.assertEqual(row['preserved_or_native_destination'], mapper.ATHENA + '/issues/new/choose')
        self.assertTrue(row['classification'].startswith('active destination issue creation'))
    def test_unknown_discussion_or_host_does_not_claim_identity(self):
        for url in ['https://github.com/Herbertofury/Engineering-Atlas/pull/99999',
                    'https://github.com.example.org/Herbertofury/Engineering-Atlas/blob/main/README.md']:
            self.assertIsNone(self.mapped(url)['preserved_or_native_destination'])
    def test_current_snapshot_is_reproducible(self):
        self.assertEqual(mapper.update(check=True), {'rows': 826, 'unresolved': 19})

if __name__ == '__main__': unittest.main()
