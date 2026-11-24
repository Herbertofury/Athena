"""Distribution QA, not a score for completed learner starters.
Run project check.py commands to assess your own implementations.
"""
import ast
from collections import Counter
import copy
import importlib.util
import io
import json
from pathlib import Path
import re
import socket
import subprocess
import sys
import unittest
from unittest.mock import patch

R = Path(__file__).resolve().parents[1]

def load(relative):
    spec = importlib.util.spec_from_file_location(relative.replace('/', '_'), R / relative)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

Q = load('projects/repair_quotes/reference.py')
E = load('projects/event_summary/reference.py')
QS = load('projects/repair_quotes/specs.py')
ES = load('projects/event_summary/specs.py')
LESSONS = json.loads((R/'content/programming-lessons.json').read_text())
CHECKS = json.loads((R/'content/programming-checks.json').read_text())

def command(*args):
    return subprocess.run([sys.executable, *args], cwd=R, capture_output=True, text=True, timeout=30)

class PackTests(unittest.TestCase):
    def test_lesson_structure_and_depth(self):
        self.assertEqual(len(LESSONS), 8)
        self.assertEqual(len({x['id'] for x in LESSONS}), 8)
        for lesson in LESSONS:
            with self.subTest(lesson=lesson['id']):
                self.assertEqual(len(lesson['explain']), 6)
                self.assertGreaterEqual(len(' '.join(lesson['explain']).split()), 250)
                self.assertEqual(len(lesson['lab']), 6)
                self.assertEqual(len(lesson['learningGoals']), 3)
                self.assertEqual(len(lesson['evidence']), 3)
                self.assertTrue(lesson['limitations'])
                ast.parse(lesson['workedCode'])
    def test_checks_balanced_distinct_and_explained(self):
        self.assertEqual(len(CHECKS), 24)
        self.assertEqual(len({c['id'] for c in CHECKS}), 24)
        self.assertEqual(len({c['question'] for c in CHECKS}), 24)
        self.assertEqual(Counter(c['answer'] for c in CHECKS), {0:6,1:6,2:6,3:6})
        for c in CHECKS:
            self.assertEqual(len(c['options']), 4)
            self.assertEqual(len(set(c['options'])), 4)
            self.assertGreater(len(c['why']), 30)
    def test_generated_documents_preserve_content(self):
        for lesson in LESSONS:
            doc=(R/'docs/shared'/(lesson['id']+'.md')).read_text()
            for text in lesson['explain']+lesson['lab']+[lesson['workedCode'],lesson['limitations']]:
                self.assertIn(text, doc)
            for check in [lesson]+lesson['additionalChecks']:
                self.assertIn(check['question'], doc)
                self.assertIn(check['why'], doc)
    def test_path_order_and_no_certificate_claim(self):
        path=json.loads((R/'content/programming-path.json').read_text())
        self.assertEqual(path['lessonIds'],[l['id'] for l in LESSONS])
        self.assertEqual(path['caseIds'],[])
        self.assertIn('not complete programming',path['limits'])
    def test_sources_registered(self):
        registry=json.loads((R/'research/programming-sources.json').read_text())
        sources=registry['sources']
        self.assertEqual(len(sources),12)
        allowed={s['url'] for s in sources}
        self.assertTrue(all(s['status']=='opened' and s['url'].startswith('https://docs.python.org/3.12/') for s in sources))
        for lesson in LESSONS:self.assertTrue(set(lesson['sources'])<=allowed)
    def test_relative_markdown_links_resolve(self):
        paths=[R/'README.md',*R.joinpath('docs').rglob('*.md'),*R.joinpath('projects').rglob('*.md')]
        for path in paths:
            for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',path.read_text()):
                if not target.startswith(('http:', 'https:', '#')):
                    self.assertTrue((path.parent/target.split('#')[0]).is_file(),(path,target))
    def test_expected_fixture_bytes_and_outputs(self):
        quotes=(R/'projects/repair_quotes/fixtures/quote.json').read_text()
        events=(R/'projects/event_summary/fixtures/events.csv').read_text()
        self.assertEqual(Q.parse_quote_json(quotes), QS.SAMPLE)
        self.assertEqual(E.parse_events_csv(events), ES.ROWS)
    def test_reference_cli_quote(self):
        proc=command('scripts/run_project.py','repair_quotes','--implementation','reference')
        self.assertEqual(proc.returncode,0,proc.stderr)
        expected=copy.deepcopy(QS.EXPECTED);expected['display_subtotal']='49.97'
        self.assertEqual(json.loads(proc.stdout),expected)
        self.assertEqual(proc.stderr,'')
    def test_reference_cli_events(self):
        proc=command('scripts/run_project.py','event_summary','--implementation','reference')
        self.assertEqual(proc.returncode,0,proc.stderr)
        actual=json.loads(proc.stdout)
        self.assertEqual(actual['unique_events'],4)
        self.assertEqual(actual['total_duration_ms'],800)
        self.assertEqual(actual['duplicate_rows'],1)
        self.assertEqual(proc.stderr,'')
    def test_default_cli_reports_unfinished_starters(self):
        for project in ['repair_quotes','event_summary']:
            proc=command('scripts/run_project.py',project)
            self.assertEqual(proc.returncode,2)
            self.assertIn('Starter unfinished',proc.stderr)
            self.assertEqual(proc.stdout,'')
    def test_cli_rejects_arbitrary_project_and_path(self):
        for args in [('unknown',),('../README.md',),('repair_quotes','--input','README.md'),('repair_quotes','--implementation','../README')]:
            proc=command('scripts/run_project.py',*args)
            self.assertEqual(proc.returncode,2)
            self.assertIn('error:',proc.stderr)
    def test_check_wrapper_restricts_target(self):
        proc=command('projects/repair_quotes/check.py','--target','../README')
        self.assertEqual(proc.returncode,2)
        self.assertIn('invalid choice',proc.stderr)
    def test_starter_placeholders_intentionally_raise(self):
        q=load('projects/repair_quotes/starter.py')
        e=load('projects/event_summary/starter.py')
        for method,args in [(q.validate_item,(QS.SAMPLE[0],)),(q.quote_total,([],)),(q.format_cents,(0,)),(q.parse_quote_json,('[]',)),(e.validate_event,(ES.ROWS[0],)),(e.parse_events_csv,(ES.HEADER,)),(e.summarize_events,([],))]:
            with self.subTest(method=method.__name__),self.assertRaises(NotImplementedError):method(*args)
    def test_trace_intermediate_values(self):
        trace=load('examples/trace_total.py').demo()
        self.assertEqual([x['before'] for x in trace['trace']],[0,2500,3997])
        self.assertEqual([x['line_cents'] for x in trace['trace']],[2500,1497,1000])
        self.assertEqual([x['after'] for x in trace['trace']],[2500,3997,4997])
    def test_aliasing_relationships(self):
        out=load('examples/aliasing_demo.py').demo()
        self.assertTrue(out['alias_is_original'])
        self.assertFalse(out['shallow_is_original'])
        self.assertTrue(out['nested_item_is_shared'])
        self.assertEqual(out['original_quantity_after_shallow_edit'],3)
        self.assertEqual(out['separate_quantity'],1)
    def test_known_bug_is_distinguished(self):
        bug=load('examples/bug_hunt.py')
        self.assertNotEqual(bug.buggy_mean([1,2]),1.5)
        self.assertEqual(bug.corrected_mean([1,2]),1.5)
        self.assertIsNone(bug.corrected_mean([]))
    def test_actual_temporary_roundtrip_and_cleanup(self):
        out=load('examples/json_roundtrip.py').demo()
        self.assertTrue(out['roundtrip_equal'])
        self.assertTrue(out['temporary_directory_removed'])
        self.assertGreater(out['utf8_bytes'],0)
    def test_all_examples_execute_as_documented(self):
        for script in sorted((R/'examples').glob('*.py')):
            proc=command(str(script.relative_to(R)))
            self.assertEqual(proc.returncode,0,proc.stderr)
            self.assertIsInstance(json.loads(proc.stdout),dict)
            self.assertEqual(proc.stderr,'')
    def test_calculations_work_when_socket_creation_is_disabled(self):
        with patch.object(socket,'socket',side_effect=AssertionError('network forbidden in this test')):
            self.assertEqual(Q.quote_total(QS.SAMPLE)['subtotal_cents'],4997)
            self.assertEqual(E.summarize_events(ES.ROWS)['total_duration_ms'],800)
            self.assertTrue(load('examples/json_roundtrip.py').demo()['roundtrip_equal'])
    def test_source_has_no_network_shell_eval_or_exec(self):
        files=[*R.joinpath('examples').glob('*.py'),*R.joinpath('projects').glob('*/reference.py'),R/'scripts/run_project.py']
        banned={'socket','requests','urllib','http','subprocess','ftplib','webbrowser'}
        for path in files:
            tree=ast.parse(path.read_text())
            for node in ast.walk(tree):
                if isinstance(node,ast.Import):self.assertFalse({a.name.split('.')[0] for a in node.names}&banned,path)
                if isinstance(node,ast.ImportFrom):self.assertNotIn((node.module or '').split('.')[0],banned,path)
                if isinstance(node,ast.Call) and isinstance(node.func,ast.Name):self.assertNotIn(node.func.id,{'eval','exec','compile'},path)
    def test_precise_byte_boundaries_and_nonascii_size(self):
        self.assertEqual(Q.parse_quote_json('[]'+' '*8190),[])
        with self.assertRaises(ValueError):Q.parse_quote_json('[]'+' '*8191)
        with self.assertRaises(ValueError):Q.parse_quote_json('é'*4097)
        header=ES.HEADER.rstrip('\n')
        # Header-only CSV with trailing whitespace would alter the header, so use a valid quoted label row plus legal line endings for parser cases separately.
        with self.assertRaises(ValueError):E.parse_events_csv('é'*8193)
        for text in ['\ud800','\udfff']:
            with self.assertRaises(ValueError):Q.parse_quote_json(text)
            with self.assertRaises(ValueError):E.parse_events_csv(text)
    def test_extreme_quote_total_is_supported(self):
        rows=[dict(sku='MAX',quantity=1000,unit_cents=1000000)]*100
        out=Q.quote_total(rows)
        self.assertEqual(out['subtotal_cents'],100000000000)
        self.assertEqual(Q.format_cents(out['subtotal_cents']),'1000000000.00')
    def test_event_zero_prefix_and_header_bom(self):
        parsed=E.parse_events_csv(ES.HEADER+'EVT-001,x,005,ok\n')
        self.assertEqual(parsed[0]['duration_ms'],5)
        with self.assertRaises(ValueError):E.parse_events_csv('\ufeff'+ES.HEADER)
    def test_nonstandard_json_constants_all_rejected(self):
        for value in ['NaN','Infinity','-Infinity']:
            text='[{"sku":"X","quantity":1,"unit_cents":'+value+'}]'
            with self.subTest(value=value),self.assertRaises(ValueError):Q.parse_quote_json(text)
    def test_visible_suite_detects_known_mutation(self):
        # Run the acceptance suite against a deliberately broken adapter, not edited files.
        class BadEventAdapter:
            validate_event=staticmethod(E.validate_event)
            parse_events_csv=staticmethod(E.parse_events_csv)
            @staticmethod
            def summarize_events(*args,**kwargs):
                out=E.summarize_events(*args,**kwargs)
                if out['mean_duration_ms'] is not None:out['mean_duration_ms']=int(out['mean_duration_ms'])
                return out
        result=unittest.TextTestRunner(stream=io.StringIO()).run(ES.make_suite(BadEventAdapter))
        self.assertFalse(result.wasSuccessful())
        self.assertTrue(any('fractional_mean' in str(test) for test,_ in result.failures))
    def test_generated_data_is_reproducible(self):
        source=load('scripts/programming_content.py')
        self.assertEqual(source.LESSONS,LESSONS)
        self.assertEqual(source.PATH,json.loads((R/'content/programming-path.json').read_text()))

def load_tests(loader, standard_tests, pattern):
    suite=unittest.TestSuite([standard_tests, QS.make_suite(Q), ES.make_suite(E)])
    return suite
