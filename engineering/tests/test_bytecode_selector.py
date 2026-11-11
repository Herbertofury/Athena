"""Offline original-fixture and receipt checks; the Java replay is separate."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

LAB = Path(__file__).resolve().parents[1] / 'experiments/bytecode-selector-lab'
SPEC = importlib.util.spec_from_file_location('bytecode_selector_probe', LAB / 'run.py')
probe = importlib.util.module_from_spec(SPEC); SPEC.loader.exec_module(probe)


class BytecodeSelectorTests(unittest.TestCase):
    def setUp(self):
        self.doc = probe.read_json(LAB / 'cases.json')
        self.receipt = probe.read_json(LAB / 'observed-2026-11-11.json')
        self.fixtures = probe.validate_cases(self.doc)

    def test_original_fixtures(self):
        self.assertEqual(len(self.fixtures), 11)
        self.assertTrue(all((LAB/f['source']).is_file() for f in self.fixtures))

    def test_retained_receipt(self):
        self.assertEqual(probe.validate_receipt(self.receipt), 22)

    def test_duplicate_json_keys_rejected(self):
        with self.assertRaises(ValueError): probe.parse_json('{"x":1,"x":2}')

    def test_nonfinite_json_rejected(self):
        for value in ['NaN','Infinity','-Infinity']:
            with self.subTest(value=value), self.assertRaises(ValueError): probe.parse_json(value)

    def test_read_budget(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'data';p.write_bytes(b'ab')
            with self.assertRaises(ValueError): probe.read_bytes(p, 1)

    def test_case_schema_boolean_rejected(self):
        self.doc['schema_version']=True
        with self.assertRaises(ValueError): probe.validate_cases(self.doc)

    def test_case_scope_is_fixed(self):
        self.doc['scope']='Game accepted'
        with self.assertRaises(ValueError): probe.validate_cases(self.doc)

    def test_selector_change_rejected(self):
        self.doc['selector']['call_owner']='other/Owner'
        with self.assertRaises(ValueError): probe.validate_cases(self.doc)

    def test_compiler_option_change_rejected(self):
        self.doc['compiler_options']=['-proc:full']
        with self.assertRaises(ValueError): probe.validate_cases(self.doc)

    def test_duplicate_fixture_rejected(self):
        self.doc['fixtures'].append(self.doc['fixtures'][0])
        with self.assertRaises(ValueError): probe.validate_cases(self.doc)

    def test_source_traversal_rejected(self):
        self.doc['fixtures'][0]['source']='../../other.java'
        with self.assertRaises(ValueError): probe.validate_cases(self.doc)

    def test_boolean_expected_count_rejected(self):
        self.doc['fixtures'][0]['expected']['exact_matches']=True
        with self.assertRaises(ValueError): probe.validate_cases(self.doc)

    def test_unknown_expected_count_rejected(self):
        self.doc['fixtures'][0]['expected']['accepted']=1
        with self.assertRaises(ValueError): probe.validate_cases(self.doc)

    def mutated_raw(self, change):
        rows=[json.loads(line) for line in self.receipt['raw_stdout'].splitlines()];change(rows)
        return ''.join(json.dumps(row)+'\n' for row in rows)

    def test_missing_class_row_rejected(self):
        raw=self.mutated_raw(lambda rows: rows.pop())
        with self.assertRaises(ValueError): probe.decode_inventory(raw,self.fixtures)

    def test_extra_class_row_rejected(self):
        raw=self.mutated_raw(lambda rows: rows.append(rows[0]))
        with self.assertRaises(ValueError): probe.decode_inventory(raw,self.fixtures)

    def test_reordered_class_rows_rejected(self):
        raw=self.mutated_raw(lambda rows: rows.reverse())
        with self.assertRaises(ValueError): probe.decode_inventory(raw,self.fixtures)

    def test_wrong_class_name_rejected(self):
        raw=self.mutated_raw(lambda rows: rows[0].update(class_name='game/RealClass'))
        with self.assertRaises(ValueError): probe.decode_inventory(raw,self.fixtures)

    def test_wrong_class_major_rejected(self):
        raw=self.mutated_raw(lambda rows: rows[0].update(class_major=True))
        with self.assertRaises(ValueError): probe.decode_inventory(raw,self.fixtures)

    def test_invalid_class_digest_rejected(self):
        raw=self.mutated_raw(lambda rows: rows[0].update(class_sha256='unknown'))
        with self.assertRaises(ValueError): probe.decode_inventory(raw,self.fixtures)

    def test_duplicate_method_rejected(self):
        raw=self.mutated_raw(lambda rows: rows[0]['methods'].append(rows[0]['methods'][0]))
        with self.assertRaises(ValueError): probe.decode_inventory(raw,self.fixtures)

    def test_broken_instruction_index_rejected(self):
        raw=self.mutated_raw(lambda rows: rows[0]['methods'][0]['instructions'][0].update(index=1))
        with self.assertRaises(ValueError): probe.decode_inventory(raw,self.fixtures)

    def test_instruction_opcode_rejected(self):
        for opcode in [True, -1, 202, '21']:
            with self.subTest(opcode=opcode), self.assertRaises(ValueError): probe.validate_instruction(dict(index=0,opcode=opcode),0)

    def test_missing_invocation_owner_rejected(self):
        with self.assertRaises(ValueError): probe.validate_instruction(dict(index=0,opcode=184,name='hook',descriptor='(I)I',interface=False),0)

    def test_extra_instruction_fields_rejected(self):
        with self.assertRaises(ValueError): probe.validate_instruction(dict(index=0,opcode=172,accepted=True),0)

    def test_illegal_instruction_field_type_rejected(self):
        with self.assertRaises(ValueError): probe.validate_instruction(dict(index=0,opcode=21,variable=True),0)

    def test_scope_cannot_promote_receipt(self):
        for value in [None,'Native Mixin compatibility proven']:
            with self.subTest(value=value):
                r=copy.deepcopy(self.receipt)
                if value is None:r.pop('scope')
                else:r['scope']=value
                with self.assertRaises(ValueError):probe.validate_receipt(r)

    def test_receipt_identity_required(self):
        self.receipt['input_sha256']['run.py']='0'*64
        with self.assertRaises(ValueError):probe.validate_receipt(self.receipt)

    def test_receipt_time_utc(self):
        self.receipt['observed_at_utc']='2026-11-11T00:00:00'
        with self.assertRaises(ValueError):probe.validate_receipt(self.receipt)

    def test_receipt_environment_required(self):
        self.receipt['environment']['java_version']=''
        with self.assertRaises(ValueError):probe.validate_receipt(self.receipt)

    def test_aggregate_not_boolean_count(self):
        self.receipt['class_observations']=True
        with self.assertRaises(ValueError):probe.validate_receipt(self.receipt)

    def test_cannot_hide_mismatch(self):
        self.receipt['all_expected']=False
        with self.assertRaises(ValueError):probe.validate_receipt(self.receipt)

    def test_inventory_matches_raw(self):
        self.receipt['inventory'][0]['class_bytes']+=1
        with self.assertRaises(ValueError):probe.validate_receipt(self.receipt)

    def test_facts_match_raw(self):
        self.receipt['observations'][0]['facts']['exact_hook_calls']+=1
        with self.assertRaises(ValueError):probe.validate_receipt(self.receipt)

    def test_fact_boolean_is_not_integer(self):
        self.receipt['observations'][0]['facts']['name_matches']=True
        with self.assertRaises(ValueError):probe.validate_receipt(self.receipt)

    def test_inventory_float_is_not_integer(self):
        value=self.receipt['inventory'][0]['methods'][0]['access']
        self.receipt['inventory'][0]['methods'][0]['access']=float(value)
        with self.assertRaises(ValueError):probe.validate_receipt(self.receipt)

    def test_match_integer_is_not_boolean(self):
        self.receipt['observations'][0]['matches_expected']=1
        with self.assertRaises(ValueError):probe.validate_receipt(self.receipt)

    def test_debug_integer_is_not_boolean(self):
        self.receipt['debug_comparisons'][0]['inspected_methods_equal']=1
        with self.assertRaises(ValueError):probe.validate_receipt(self.receipt)

    def test_dependency_size_float_is_not_integer(self):
        self.receipt['dependencies'][0]['bytes']=float(self.receipt['dependencies'][0]['bytes'])
        with self.assertRaises(ValueError):probe.validate_receipt(self.receipt)

    def test_wrong_expectation_retains_mismatch(self):
        rows=copy.deepcopy(self.fixtures);rows[0]['expected']['exact_hook_calls']=2
        _,mismatches,_=probe.evaluate(self.receipt['inventory'],rows)
        self.assertEqual(mismatches,['baseline/none','baseline/all'])

    def facts(self, ident):
        return next(r['facts'] for r in self.receipt['observations'] if r['fixture']==ident and r['debug']=='none')

    def test_overload_does_not_change_exact_descriptor(self):
        self.assertEqual(self.facts('overload')['name_matches'],2)
        self.assertEqual(self.facts('overload')['exact_matches'],1)

    def test_changed_descriptor_has_no_exact_method(self):
        self.assertEqual(self.facts('descriptor_drift')['exact_matches'],0)

    def test_return_does_not_mean_exceptional_exit(self):
        self.assertEqual((self.facts('always_throw')['return_opcodes'],self.facts('always_throw')['throw_opcodes']),(0,1))
        self.assertEqual((self.facts('throw_path')['return_opcodes'],self.facts('throw_path')['throw_opcodes']),(1,1))

    def test_counts_cannot_prove_same_argument(self):
        self.assertEqual(self.facts('baseline'),self.facts('same_count_drift'))
        calls=[next(r['matching_call_context'] for r in self.receipt['observations'] if r['fixture']==f and r['debug']=='none') for f in ['baseline','same_count_drift']]
        self.assertNotEqual(calls[0][0]['preceding_instruction'],calls[1][0]['preceding_instruction'])

    def test_owner_is_part_of_literal_call_identity(self):
        self.assertEqual(self.facts('different_owner')['exact_hook_calls'],0)
        self.assertEqual(self.facts('different_owner')['owner_omitted_hook_calls'],1)

    def test_debug_bytes_differ_with_same_inspected_methods(self):
        self.assertTrue(all(not r['artifact_hash_equal'] and r['inspected_methods_equal'] for r in self.receipt['debug_comparisons']))

    def test_missing_dependency_does_not_download(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(FileNotFoundError):probe.verify_dependency(d)

    def test_changed_dependency_fails(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d)/'asm-9.11.1.jar').write_bytes(b'wrong')
            with self.assertRaises(ValueError):probe.verify_dependency(d)


if __name__=='__main__':unittest.main()
