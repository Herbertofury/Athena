import importlib.util,tempfile,pathlib,unittest,json
spec=importlib.util.spec_from_file_location('sync','scripts/sync_wiki.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class WikiTests(unittest.TestCase):
 def test_preserves_manual_home_and_unknown_pages(self):
  with tempfile.TemporaryDirectory() as d:
   s=pathlib.Path(d)/'s';t=pathlib.Path(d)/'t';s.mkdir();t.mkdir();(s/'Home.md').write_text('Welcome to the Athena wiki!\n\n# Generated');(t/'Home.md').write_text('Welcome to the Athena wiki!\nMy notes.');(t/'Other.md').write_text('Keep');m.sync(s,t);self.assertIn('My notes.',(t/'Home.md').read_text());self.assertEqual((t/'Other.md').read_text(),'Keep');before=(t/'Home.md').read_text();m.sync(s,t);self.assertEqual(before,(t/'Home.md').read_text())
 def test_preflight_conflict_no_partial_writes(self):
  with tempfile.TemporaryDirectory() as d:
   s=pathlib.Path(d)/'s';t=pathlib.Path(d)/'t';s.mkdir();t.mkdir();(s/'A.md').write_text('New');(s/'Z.md').write_text('New');(t/'Z.md').write_text('User');
   with self.assertRaises(ValueError):m.sync(s,t)
   self.assertFalse((t/'A.md').exists())
 def test_managed_update_and_user_edit_rejection(self):
  with tempfile.TemporaryDirectory() as d:
   s=pathlib.Path(d)/'s';t=pathlib.Path(d)/'t';s.mkdir();t.mkdir();(s/'A.md').write_text('One');m.sync(s,t);(s/'A.md').write_text('Two');m.sync(s,t);self.assertEqual((t/'A.md').read_text(),'Two');(t/'A.md').write_text('Manual');
   with self.assertRaises(ValueError):m.sync(s,t)
if __name__=='__main__':unittest.main()
