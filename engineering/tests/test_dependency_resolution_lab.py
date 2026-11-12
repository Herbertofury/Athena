from pathlib import Path
import importlib.util,json,copy,unittest,tempfile
L=Path(__file__).resolve().parents[1]/'experiments/dependency-resolution-lab'
s=importlib.util.spec_from_file_location('lab',L/'run.py');lab=importlib.util.module_from_spec(s);s.loader.exec_module(lab)
class LabTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.receipt=lab.read_json(L/'observed-2026-11-11.json')
 def reject(self,mutate):
  r=copy.deepcopy(self.receipt);mutate(r)
  with self.assertRaises((ValueError,TypeError,KeyError)):lab.validate_receipt(r)
 def test_receipt(self):self.assertTrue(lab.validate_receipt(self.receipt))
 def test_exact_case_count(self):self.assertEqual(len(self.receipt['runs']),15)
 def test_four_failures(self):self.assertEqual(sum(x['returncode']!=0 for x in self.receipt['runs']),4)
 def test_mismatched_scope(self):self.reject(lambda r:r.update(scope='Game compatible'))
 def test_missing_scope(self):self.reject(lambda r:r.pop('scope'))
 def test_bool_schema(self):self.reject(lambda r:r.update(schema_version=True))
 def test_input_change(self):self.reject(lambda r:r['inputs'].update({'build.gradle':'0'*64}))
 def test_float_distribution_size(self):self.reject(lambda r:r['dependency'].update(bytes=float(r['dependency']['bytes'])))
 def test_missing_jvm(self):self.reject(lambda r:r['environment'].update(gradle_version_output='Gradle 9.2.1 '+lab.dependency()['revision']))
 def test_false_summary(self):self.reject(lambda r:r.update(all_expected=False))
 def test_int_summary(self):self.reject(lambda r:r.update(all_expected=1))
 def test_derived_bool(self):self.reject(lambda r:r['observations'][0].update(success=1))
 def test_derived_hash(self):self.reject(lambda r:r['observations'][0]['artifact_hashes'].update({'atlas.synthetic:core:2.0':'0'*64}))
 def test_run_order(self):self.reject(lambda r:r['runs'].reverse())
 def test_run_missing(self):self.reject(lambda r:r['runs'].pop())
 def test_run_extra(self):self.reject(lambda r:r['runs'].append(r['runs'][0]))
 def test_command_flag(self):self.reject(lambda r:r['runs'][0]['command'].append('--dependency-verification=off'))
 def test_bool_exit(self):self.reject(lambda r:r['runs'][0].update(returncode=False))
 def test_missing_marker(self):self.reject(lambda r:r['runs'][0].update(stdout='BUILD SUCCESSFUL'))
 def test_extra_marker(self):self.reject(lambda r:r['runs'][0].update(stdout=r['runs'][0]['stdout']+'\nATLAS_OBSERVATION={}'))
 def test_repo_sha(self):self.reject(lambda r:r['runs'][0]['repository'][0].update(sha256='0'*64))
 def test_repo_float_size(self):self.reject(lambda r:r['runs'][0]['repository'][0].update(bytes=float(r['runs'][0]['repository'][0]['bytes'])))
 def test_repo_bytes(self):self.reject(lambda r:r['runs'][0]['repository'][0].update(base64='AAAA'))
 def test_repo_missing(self):self.reject(lambda r:r['runs'][0]['repository'].pop())
 def test_graph_extra_component(self):self.reject(lambda r:r['runs'][0]['graph']['components'].append(r['runs'][0]['graph']['components'][0]))
 def test_graph_bad_flag(self):self.reject(lambda r:r['runs'][0]['graph']['edges'][0].update(resolved=1))
 def test_graph_bad_cause(self):self.reject(lambda r:r['runs'][0]['graph']['components'][0]['reasons'][0].update(cause='COMPATIBLE'))
 def test_missing_lock(self):self.reject(lambda r:r['runs'][7].update(lock=None))
 def test_changed_lock(self):self.reject(lambda r:r['runs'][7].update(lock=r['runs'][7]['lock'].replace('1.1','1.2')))
 def test_unexpected_lock(self):self.reject(lambda r:r['runs'][0].update(lock=r['runs'][5]['lock']))
 def test_missing_verification(self):self.reject(lambda r:r['runs'][11].update(verification=None))
 def test_verification_disabled(self):self.reject(lambda r:r['runs'][11].update(verification=r['runs'][11]['verification'].replace('<verify-metadata>true','<verify-metadata>false')))
 def test_verification_checksum(self):self.reject(lambda r:r['runs'][11].update(verification=r['runs'][11]['verification'].replace('ba0cc6','000000')))
 def test_dtd(self):
  with self.assertRaises(ValueError):lab.parse_verification('<!DOCTYPE x>'+self.receipt['runs'][11]['verification'])
 def test_duplicate_keys(self):
  with self.assertRaises(ValueError):lab.parse_json('{"x":1,"x":2}')
 def test_nonfinite(self):
  with self.assertRaises(ValueError):lab.parse_json('{"x":NaN}')
 def test_recursive_type_equality(self):self.assertFalse(lab.same({'x':[1]}, {'x':[True]}))
 def test_wrong_distribution(self):
  with tempfile.TemporaryDirectory() as p:
   f=Path(p)/'bad.zip';f.write_bytes(b'no')
   with self.assertRaises(ValueError):lab.unpack_distribution(f,Path(p)/'out')
 def test_unsafe_path(self):
  for p in ['../bad','/absolute','a/../b','a\\b','a:b','a//b','a/./b']:
   with self.subTest(path=p),self.assertRaises(ValueError):lab.safe_path(p)
 def test_jar_change_same_coordinate(self):
  a=self.receipt['observations'][5];b=self.receipt['observations'][9]
  self.assertEqual(a['selected_modules'],b['selected_modules']);self.assertNotEqual(a['artifact_hashes'],b['artifact_hashes'])
 def test_lock_pins_added_version(self):
  self.assertEqual(self.receipt['observations'][6]['selected_modules'],['atlas.synthetic:core:1.2']);self.assertEqual(self.receipt['observations'][7]['selected_modules'],['atlas.synthetic:core:1.1'])
 def test_legacy_and_files_differ(self):self.assertTrue(self.receipt['observations'][12]['success']);self.assertFalse(self.receipt['observations'][13]['success'])
 def test_bootstrap_has_pom_and_jar(self):self.assertEqual(set(lab.parse_verification(self.receipt['runs'][10]['verification'])),{'core-1.1.jar','core-1.1.pom'})
 def test_initial_hypotheses_retained(self):
  d=lab.read_json(L/'initial-observations.json');self.assertEqual(len(d['hypotheses']),2)
  self.assertTrue(all(x['result']['returncode']==0 for x in d['hypotheses']));self.assertEqual(d['follow_up_file_collection']['returncode'],1)
 def test_consistency_is_not_execution_authentication(self):
  r=copy.deepcopy(self.receipt);r['environment']['python']='99.0.0';self.assertTrue(lab.validate_receipt(r))
 def test_extra_verification_section(self):
  value=self.receipt['runs'][10]['verification'].replace('</verification-metadata>','<unexpected/></verification-metadata>')
  with self.assertRaises(ValueError):lab.parse_verification(value)
 def test_verification_config_attributes(self):
  value=self.receipt['runs'][10]['verification'].replace('<verify-metadata>','<verify-metadata unexpected="true">')
  with self.assertRaises(ValueError):lab.parse_verification(value)
 def test_verification_checksum_children(self):
  value=self.receipt['runs'][10]['verification'].replace('origin="Generated by Gradle"/>','origin="Generated by Gradle"><unexpected/></sha256>',1)
  with self.assertRaises(ValueError):lab.parse_verification(value)
 def test_existing_partial_is_preserved(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'out.json';partial=Path(tmp)/'out.json.partial.json';partial.write_text('previous')
   with self.assertRaises(ValueError):lab.execute(Path(tmp)/'nonexistent',p)
   self.assertEqual(partial.read_text(),'previous')
 def test_bad_timestamp(self):self.reject(lambda r:r.update(recorded_at='2026-13-99T00:00:00Z'))
 def test_byte_budget(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'input';p.write_bytes(b'12345')
   with self.assertRaises(ValueError):lab.bounded_read(p,4)
 def test_failed_graph_required(self):self.reject(lambda r:r['runs'][2].update(graph=None))
 def test_verification_failure_graph_required(self):self.reject(lambda r:r['runs'][13].update(graph=None))
 def test_graph_contract_all_cases(self):
  for c,r in zip(lab.fixtures()['cases'],self.receipt['runs']):
   with self.subTest(case=c['id']):self.assertTrue(lab.graph_contract(c,r['graph']))
 def test_edge_removal_even_with_coordinated_output_is_mismatch(self):
  r=copy.deepcopy(self.receipt);row=r['runs'][0];row['graph']['edges']=[];row['observation']['graph']=row['graph']
  lines=row['stdout'].splitlines();row['stdout']='\n'.join('ATLAS_OBSERVATION='+json.dumps(row['observation'],separators=(',',':')) if v.startswith('ATLAS_OBSERVATION=') else v for v in lines)+'\n'
  r['observations']=lab.analyze(r['runs']);r['all_expected']=all(x['matches_expected'] for x in r['observations'])
  self.assertFalse(lab.validate_receipt(r));self.assertFalse(r['observations'][0]['checks']['graph_topology'])
 def test_negative_edge_required(self):
  c=lab.fixtures()['cases'][8];g=copy.deepcopy(self.receipt['runs'][8]['graph']);g['edges'].pop();self.assertFalse(lab.graph_contract(c,g))
 def test_missing_reason_rejected_by_contract(self):
  c=lab.fixtures()['cases'][0];g=copy.deepcopy(self.receipt['runs'][0]['graph']);g['components'][1]['reasons'].pop();self.assertFalse(lab.graph_contract(c,g))
 def test_changed_input_snapshot_rejects(self):
  original=lab.identity();original['run.py']='0'*64
  with self.assertRaises(ValueError):lab.assert_unchanged(original)
if __name__=='__main__':unittest.main(verbosity=2)
