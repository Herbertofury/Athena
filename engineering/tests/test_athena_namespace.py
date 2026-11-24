"""Migration routing tests; historical evidence and shortlist keys stay stable."""
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class AthenaNamespaceTests(unittest.TestCase):
    def test_new_community_refresh_uses_athena(self):
        self.assertEqual(load('refresh_research_signals').REPOSITORY, 'Herbertofury/Athena')

    def test_wiki_projection_is_namespaced_and_has_repository_prefix(self):
        module = load('export_adapter_wiki')
        mapping = {source: 'Engineering-' + page for source, page in
                   json.loads((ROOT / 'data/wiki-adapter-pages.json').read_text()).items()}
        page = module.project('docs/adapters/README.md', mapping)
        self.assertIn('https://github.com/Herbertofury/Athena/wiki/Engineering-Home', page)
        self.assertIn('https://github.com/Herbertofury/Athena/blob/main/engineering/docs/adapters/README.md', page)
        self.assertIn('/wiki/Engineering-', page)
        self.assertNotIn('/wiki/Home)', page)

    def test_current_explorer_routes_to_destination_and_keeps_saved_shortlist(self):
        source = (ROOT / 'docs/explorer/explorer.mjs').read_text()
        self.assertIn("const REPO = 'https://github.com/Herbertofury/Athena'", source)
        self.assertIn("REPO + '/blob/main/engineering/", source)
        self.assertIn('engineering-atlas-shortlist-v1', source)
        self.assertNotIn('https://github.com/Herbertofury/Engineering-Atlas', source)

    def test_report_template_is_installed_at_destination_root(self):
        template = ROOT.parent / '.github/ISSUE_TEMPLATE/research-rating.yml'
        if not template.exists():
            self.skipTest('Root integration template is checked in the combined Athena checkout')
        self.assertIn('https://github.com/Herbertofury/Athena/blob/main/engineering/docs/research-community.md', template.read_text())


if __name__ == '__main__':
    unittest.main()
