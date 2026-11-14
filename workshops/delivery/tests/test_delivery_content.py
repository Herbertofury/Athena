"""Schema, evidence and reference consistency for the app-ready workshop."""
import ast
import importlib.util
import json
from pathlib import Path
import re
import unittest
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('delivery_content_test', ROOT / 'scripts/delivery_content.py')
content = importlib.util.module_from_spec(spec)
spec.loader.exec_module(content)
LESSONS = content.LESSONS
REGISTER = json.loads((ROOT / 'research/delivery-sources.json').read_text())

class ContentContract(unittest.TestCase):
    def test_dirty_gate_is_distinct_from_committed_test_input(self):
        lesson = next(x for x in LESSONS if x['id'] == 'delivery-revision-tests')
        self.assertIn('read release.json from the named commit', ' '.join(lesson['explain']))
        check = lesson['additionalChecks'][0]
        self.assertIn('assertions read committed data', check['options'][check['answer']])
        self.assertIn('before assertions', check['why'])

    def test_eight_unique_lessons(self):
        self.assertEqual(len(LESSONS), 8)
        self.assertEqual(len({x['id'] for x in LESSONS}), 8)

    def test_path_identity_and_order(self):
        self.assertEqual(content.PATH['id'], 'delivery-workshop')
        self.assertEqual(content.PATH['lessonIds'], [x['id'] for x in LESSONS])
        self.assertEqual(content.PATH['prerequisites'], ['git', 'testing'])

    def test_narrow_tags_preserve_certification_mapping(self):
        for lesson in LESSONS:
            with self.subTest(lesson=lesson['id']):
                self.assertEqual(lesson['tags'], ['delivery', 'coding', 'git'])
                self.assertEqual(lesson['category'], 'Coding')
                self.assertTrue(lesson['id'].startswith('delivery-'))

    def test_substantive_paragraphs(self):
        for lesson in LESSONS:
            with self.subTest(lesson=lesson['id']):
                self.assertEqual(len(lesson['explain']), 6)
                self.assertGreaterEqual(sum(len(x.split()) for x in lesson['explain']), 300)
                self.assertTrue(all(len(x.split()) >= 30 for x in lesson['explain']))

    def test_goals_practice_evidence_limits(self):
        for lesson in LESSONS:
            with self.subTest(lesson=lesson['id']):
                self.assertEqual(len(lesson['learningGoals']), 3)
                self.assertEqual(len(lesson['lab']), 6)
                self.assertEqual(len(lesson['evidence']), 3)
                self.assertGreater(len(lesson['limitations']), 100)
                self.assertEqual(lesson['estimatedMinutes'], 45)

    def test_24_original_valid_checks(self):
        checks = [c for lesson in LESSONS for c in [lesson] + lesson['additionalChecks']]
        self.assertEqual(len(checks), 24)
        self.assertEqual(len({c['question'] for c in checks}), 24)
        for check in checks:
            self.assertEqual(len(check['options']), 4)
            self.assertEqual(len(set(check['options'])), 4)
            self.assertIn(check['answer'], range(4))
            self.assertGreater(len(check['why']), 40)

    def test_answer_positions_balanced(self):
        answers = [c['answer'] for lesson in LESSONS for c in [lesson] + lesson['additionalChecks']]
        self.assertEqual([answers.count(n) for n in range(4)], [6, 6, 6, 6])

    def test_all_code_is_safe_entrypoint_or_comment(self):
        expected = ['snapshots', 'staging', 'branches', 'conflict', 'recovery', 'revision-tests', 'provenance', 'capstone']
        for lesson, command in zip(LESSONS, expected):
            self.assertEqual(lesson['codeLanguage'], 'sh')
            self.assertIn('python3 labs/delivery-workshop/run_lab.py ' + command, lesson['workedCode'])
            for line in lesson['workedCode'].splitlines():
                self.assertTrue(line.startswith('#') or line.startswith('python3 '))

    def test_all_sources_registered(self):
        urls = {source['url'] for source in REGISTER['sources']}
        self.assertEqual(set(content.S.values()), urls)
        for lesson in LESSONS:
            self.assertTrue(set(lesson['sources']).issubset(urls))

    def test_sources_have_official_identity_review_and_claim(self):
        self.assertEqual(REGISTER['reviewedAt'], '2026-11-07')
        for source in REGISTER['sources']:
            self.assertIn(urlparse(source['url']).netloc, {'git-scm.com', 'docs.python.org', 'docs.github.com'})
            self.assertEqual(urlparse(source['url']).scheme, 'https')
            self.assertEqual(source['reviewedAt'], REGISTER['reviewedAt'])
            self.assertEqual(source['status'], 'opened')
            self.assertTrue(source['title'] and source['supports'])
        self.assertIn('original teaching', REGISTER['originality'])

    def test_generated_json_matches_module(self):
        self.assertEqual(json.loads((ROOT/'content/delivery-lessons.json').read_text()), LESSONS)
        self.assertEqual(json.loads((ROOT/'content/delivery-path.json').read_text()), content.PATH)
        checks = json.loads((ROOT/'content/delivery-checks.json').read_text())
        self.assertEqual(len(checks), 24)
        self.assertEqual(len({c['id'] for c in checks}), 24)

    def test_all_lesson_docs_contain_complete_fields(self):
        for lesson in LESSONS:
            doc = (ROOT/'docs/shared'/ (lesson['id']+'.md')).read_text()
            for value in [lesson['title'], lesson['example'], lesson['workedCode'], lesson['limitations'], *lesson['explain']]:
                self.assertIn(value, doc)
            for check in [lesson] + lesson['additionalChecks']:
                self.assertIn(check['question'], doc)
                self.assertIn(check['why'], doc)

    def test_html_safe_complete_navigation(self):
        text = (ROOT/'START-HERE.html').read_text()
        self.assertIn('lang="en"', text)
        self.assertNotIn('<script', text)
        self.assertEqual(text.count('<details>'), 24)
        for lesson in LESSONS:
            self.assertIn('id="' + lesson['id'] + '"', text)
            self.assertIn('href="#' + lesson['id'] + '"', text)

    def test_local_html_links_exist(self):
        text = (ROOT/'START-HERE.html').read_text()
        for href in re.findall(r'href="([^"]+)"', text):
            if not href.startswith(('https:', '#')):
                self.assertTrue((ROOT / href).is_file(), href)

    def test_module_has_no_execution_or_filesystem_imports(self):
        tree = ast.parse((ROOT/'scripts/delivery_content.py').read_text())
        self.assertFalse(any(isinstance(node, (ast.Import, ast.ImportFrom)) for node in ast.walk(tree)))
        calls = {node.func.id for node in ast.walk(tree) if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)}
        self.assertTrue(calls <= {'dict', 'list', 'len', 'enumerate', 'q', 'add'})

    def test_snapshots_and_staging_evidence_distinguished(self):
        snapshot = LESSONS[0]
        self.assertIn('old_content', ' '.join(snapshot['lab']))
        self.assertIn('following staging exercise', snapshot['example'])
        self.assertIn('working_content', (ROOT/'labs/delivery-workshop/lab.py').read_text())

    def test_no_certification_or_publication_overclaim(self):
        self.assertIn('not a published release', content.PATH['limits'])
        self.assertIn('no hosted CI', LESSONS[-1]['example'])
        self.assertIn('does not independently authenticate', ' '.join(LESSONS[-2]['explain']))

if __name__ == '__main__':
    unittest.main()
