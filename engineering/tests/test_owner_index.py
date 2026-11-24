import importlib.util,random,sys,unittest
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'examples/owner_prefix_index.py'
spec=importlib.util.spec_from_file_location('owner_prefix_index',p);m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
class OwnerIndexTests(unittest.TestCase):
 def test_ambiguous_owners_are_not_dropped(self):
  self.assertEqual(m.OwnerPrefixIndex(['a','a-b']).matches('a-b-client.toml'),['a','a-b'])
 def test_exact_and_delimited_only(self):
  index=m.OwnerPrefixIndex(['mod']);self.assertEqual(index.matches('mod'),['mod']);self.assertEqual(index.matches('mod.toml'),['mod']);self.assertEqual(index.matches('mod-client.json'),['mod']);self.assertEqual(index.matches('modpack.toml'),[])
 def test_case_is_not_silently_folded(self):self.assertEqual(m.OwnerPrefixIndex(['Mod']).matches('mod.toml'),[])
 def test_duplicate_and_order_independence(self):self.assertEqual(m.OwnerPrefixIndex(['a-b','a','a']).matches('a-b.json'),['a','a-b'])
 def test_no_filesystem_paths(self):
  for name in ['','a/b.toml','a\\b.toml','a\0.toml',None]:
   with self.assertRaises(ValueError):m.OwnerPrefixIndex(['a']).matches(name)
 def test_unsupported_ids_rejected(self):
  for name in ['a.b','a/b','','x'*129]:
   with self.assertRaises(ValueError):m.OwnerPrefixIndex([name])
 def test_reference_equivalence_on_generated_inputs(self):
  rng=random.Random(20261026);owners=[''.join(rng.choice('abcd_-0123') for _ in range(rng.randint(1,12))) for _ in range(100)];index=m.OwnerPrefixIndex(owners)
  for _ in range(2000):
   stem=rng.choice(owners) if rng.random()<.7 else ''.join(rng.choice('abcd_-0123') for _ in range(15));name=stem+rng.choice(['','.toml','-client.json','.config','pack.json'])
   self.assertEqual(index.matches(name),m.reference_matches(name,owners))
 def test_invalid_owner_containers(self):
  for values in ['abc',None,[None],[[]]]:
   with self.assertRaises(ValueError):m.OwnerPrefixIndex(values)
 def test_index_children_are_immutable(self):
  with self.assertRaises(TypeError):m.OwnerPrefixIndex(['a'])._root.children['x']=None
if __name__=='__main__':unittest.main()
