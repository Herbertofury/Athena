import unittest
from claim_gate import assess

def fixture():
    return dict(source_revision="synthetic-source-v1",checker_revision="synthetic-judge-v1",input_sha256="a"*64,scope_id="synthetic-2-units",compiler_identity="synthetic-compiler",expected_units=2,checked_units=2,matched_units=2,expected_bytes=100,checked_bytes=100,matched_bytes=100,unresolved_bindings=0,failed_units=0)

class GateTests(unittest.TestCase):
    def test_consistency_is_not_truth_or_rights(self):
        r=assess(fixture());self.assertEqual(r['status'],'receipt_consistent_for_declared_scope')
        for k in ('independently_verified','playable_port_proven','reuse_rights_granted'):self.assertFalse(r[k])
    def test_subset_not_complete(self):
        r=fixture();r.update(checked_units=1,matched_units=1,checked_bytes=20,matched_bytes=20);self.assertEqual(assess(r)['status'],'incomplete')
    def test_function_count_hides_bytes(self):
        r=fixture();r['matched_bytes']=99;self.assertEqual(assess(r)['status'],'incomplete')
    def test_unknown_binding_blocks(self):
        r=fixture();r['unresolved_bindings']=1;self.assertEqual(assess(r)['status'],'incomplete')
    def test_bool_not_count(self):
        r=fixture();r['matched_units']=True;self.assertEqual(assess(r)['status'],'invalid')
    def test_overcount_rejected(self):
        r=fixture();r['matched_units']=3;self.assertEqual(assess(r)['status'],'invalid')
    def test_zero_denominator_rejected(self):
        r=fixture();r.update(expected_units=0,checked_units=0,matched_units=0);self.assertEqual(assess(r)['status'],'invalid')
    def test_missing_identity_rejected(self):
        r=fixture();del r['checker_revision'];self.assertEqual(assess(r)['status'],'invalid')
    def test_bad_hash_and_object_rejected(self):
        r=fixture();r['input_sha256']='file.exe';self.assertEqual(assess(r)['status'],'invalid');self.assertEqual(assess(None)['status'],'invalid')
    def test_success_flag_cannot_override_failed_unit(self):
        r=fixture();r.update(failed_units=1,status='verified');self.assertEqual(assess(r)['status'],'incomplete')

if __name__=='__main__':unittest.main()
