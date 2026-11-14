import unittest,tempfile,pathlib,sqlite3
from unittest.mock import patch
import prepare
ROOT=pathlib.Path(__file__).parent
class Tests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.tmp.name);self.source=self.root/'original.sqlite';self.dest=self.root/'backup.sqlite'
  self.db=sqlite3.connect(self.source);self.db.execute('pragma journal_mode=WAL');self.db.execute('pragma wal_autocheckpoint=0');self.db.executescript('CREATE TABLE original(value TEXT); INSERT INTO original VALUES("base");');self.db.commit();self.db.execute('insert into original values("committed-in-WAL")');self.db.commit()
 def tearDown(self):self.db.close();self.tmp.cleanup()
 def test_preserves_original_and_committed_wal(self):
  before=prepare.capture(self.source);r=prepare.prepare(self.source,self.dest,self.root,True);self.assertTrue(r['source_wal_present']);self.assertEqual(prepare.capture(self.source),before)
  with sqlite3.connect(self.dest) as c:self.assertEqual(c.execute('select value from original').fetchall(),[('base',),('committed-in-WAL',)]);self.assertEqual(c.execute('pragma journal_mode').fetchone(),('delete',))
  self.assertEqual(self.dest.read_bytes()[18:20],b'\x01\x01');self.assertEqual(self.dest.stat().st_mode & 0o777,0o600)
 def test_source_and_sidecar_destinations_refused(self):
  before=prepare.capture(self.source)
  for suffix in prepare.SUFFIXES:
   self.assertRaises(ValueError,prepare.prepare,self.source,pathlib.Path(str(self.source)+suffix),self.root,True)
  self.assertEqual(prepare.capture(self.source),before)
  self.assertFalse(pathlib.Path(str(self.source)+'-journal').exists())
 def test_existing_destination_never_overwritten(self):
  self.dest.write_bytes(b'existing');self.assertRaises(FileExistsError,prepare.prepare,self.source,self.dest,self.root,True);self.assertEqual(self.dest.read_bytes(),b'existing')
 def test_changed_source_refuses_before_destination(self):
  original=prepare.capture;calls=0
  def changed(p):
   nonlocal calls;calls+=1
   if calls==3:self.db.execute('insert into original values("changed")');self.db.commit()
   return original(p)
  with patch('prepare.capture',side_effect=changed):self.assertRaises(ValueError,prepare.prepare,self.source,self.dest,self.root,True)
  self.assertFalse(self.dest.exists())
 def test_quiescence_symlink_and_journal_requirements(self):
  self.assertRaises(ValueError,prepare.prepare,self.source,self.dest,self.root,False)
  link=self.root/'link.sqlite';link.symlink_to(self.source);self.assertRaises(ValueError,prepare.prepare,link,self.dest,self.root,True)
  pathlib.Path(str(self.source)+'-journal').write_bytes(b'active');self.assertRaises(ValueError,prepare.prepare,self.source,self.dest,self.root,True)
if __name__=='__main__':unittest.main()
