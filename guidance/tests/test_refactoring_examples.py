"""Synthetic behavioral demonstrations, not agent-performance benchmarks."""
import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location(
    'refactoring_examples', Path(__file__).resolve().parents[1] / 'examples/refactoring.py')
examples = importlib.util.module_from_spec(spec)
spec.loader.exec_module(examples)


def outcome(function, value):
    try:
        return ('result', function(value))
    except Exception as error:
        return ('error', type(error), str(error))


class RefactoringExamplesTests(unittest.TestCase):
    def test_extraction_preserves_results_errors_order_and_inputs(self):
        for value in ({'name': ' Kiwi ', 'kind': 'creator'},
                      {'name': '  ', 'kind': 'project'}, {},
                      {'name': ''}, {'name': None, 'kind': 'creator'},
                      {'name': 'Valid'}, {'name': 'Valid', 'kind': None}):
            original = copy.deepcopy(value)
            with self.subTest(value=value):
                self.assertEqual(outcome(examples.label_before, value),
                                 outcome(examples.label_after, value))
                self.assertEqual(value, original)

    def test_shared_validation_preserves_caller_specific_policies(self):
        for value in (' Kiwi ', 'ProjectID', '  ', '', None):
            for before, after in ((examples.creator_before, examples.creator_after),
                                  (examples.project_before, examples.project_after)):
                with self.subTest(value=value, caller=before.__name__):
                    self.assertEqual(outcome(before, value), outcome(after, value))

    def test_negative_control_overconsolidation_changes_project_identity(self):
        self.assertNotEqual(examples.project_before('ProjectID'),
                            examples.creator_after('ProjectID'))

    def test_internal_rename_preserves_wire_format(self):
        for pending in (0, 1, 10):
            with self.subTest(pending=pending):
                self.assertEqual(examples.receipt_before(pending),
                                 examples.receipt_after(pending))
                self.assertEqual(examples.receipt_after(pending)['n'], pending)
                self.assertEqual(examples.receipt_before(n=pending),
                                 examples.receipt_after(n=pending))

    def test_negative_control_serialized_key_rename_breaks_consumer(self):
        incorrectly_renamed = {'pending_count': 1, 'complete': False}
        with self.assertRaises(KeyError):
            _ = incorrectly_renamed['n']
