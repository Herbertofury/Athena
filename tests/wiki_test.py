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
class CatalogNavigationTests(unittest.TestCase):
 def test_clean_and_repeated_build_preserve_pillars_navigation(self):
  import shutil,subprocess,sys
  root=pathlib.Path(__file__).resolve().parents[1]
  expected=(root/'docs/README.md').read_text().split('\n## Cross-project product requirements')[1]
  with tempfile.TemporaryDirectory() as d:
   target=pathlib.Path(d)
   for directory in ['scripts','src','research','workshops']:
    shutil.copytree(root/directory,target/directory,ignore=shutil.ignore_patterns('__pycache__'))
   (target/'dist').mkdir()
   for attempt in range(2):
    subprocess.run([sys.executable,str(target/'scripts/build_catalog.py')],check=True,capture_output=True)
    readme=(target/'docs/README.md').read_text()
    self.assertEqual(readme.count('## Cross-project product requirements'),1)
    self.assertEqual(readme.split('\n## Cross-project product requirements')[1],expected)
    self.assertIn('[Universal engineering pillars](PRODUCT-PILLARS.md)',readme)
    generated={str(p.relative_to(target)):p.read_bytes() for folder in ['docs','wiki','dist'] for p in (target/folder).rglob('*') if p.is_file()}
    if attempt: self.assertEqual(generated,previous)
    previous=generated
   engineering_pages=[target/'wiki/Engineering-Home.md',target/'wiki/Engineering-Navigation.md']
   for path in engineering_pages:
    self.assertFalse(path.exists(), f'Learning catalog must not create {path.name}')
    path.write_bytes(b'# Existing Engineering navigation\n\nKeep this exact content.\n')
   before={path:path.read_bytes() for path in engineering_pages}
   subprocess.run([sys.executable,str(target/'scripts/build_catalog.py')],check=True,capture_output=True)
   for path,body in before.items(): self.assertEqual(path.read_bytes(),body)
   for name in ('Home.md','_Sidebar.md'):
    page=(target/'wiki'/name).read_text()
    self.assertEqual(page.count('## Game engines'),1)
    self.assertIn('## Game engines\n\n- [Athena Engine Foundry](Engineering-Engine-Foundry)',page)
   founder=(target/'wiki/Engineering-Engine-Foundry.md').read_bytes()
   self.assertIn(b'[Game Systems Exchange](Engineering-Game-Systems-Exchange)',founder)
   self.assertTrue(founder.endswith(b'\n') and not founder.endswith(b'\n\n'))
class DocumentationLinkTests(unittest.TestCase):
 def test_url_path_fragment_and_query(self):
  import sys
  sys.path.insert(0,str(pathlib.Path('scripts').resolve()))
  from documentation_links import local_target
  with tempfile.TemporaryDirectory() as d:
   p=pathlib.Path(d)/'guide.md'; target=p.parent/'PRODUCT-PILLARS.md';target.touch()
   for suffix in ['', '#p8--modular-features-and-safe-independent-evolution','?view=1#p8']:
    self.assertEqual(local_target(p,'PRODUCT-PILLARS.md'+suffix),target)
    self.assertTrue(local_target(p,'PRODUCT-PILLARS.md'+suffix).exists())
   self.assertFalse(local_target(p,'missing.md#section').exists())
   self.assertFalse(local_target(p,'http-not-a-scheme.md#section').exists())
 def test_encoded_punctuation_and_external_urls(self):
  import sys
  sys.path.insert(0,str(pathlib.Path('scripts').resolve()))
  from documentation_links import local_target
  p=pathlib.Path('/tmp/docs/guide.md')
  self.assertEqual(local_target(p,'a%23b%3Fc%20d.md#anchor'),p.parent/'a#b?c d.md')
  self.assertEqual(local_target(p,'../README.md#top'),p.parent/'../README.md')
  for url in ['#section','?view=1#section','https://example.test/a#b','HTTP://example.test/a','//example.test/a','mailto:a@example.test']:
   self.assertIsNone(local_target(p,url))
if __name__=='__main__':unittest.main()
