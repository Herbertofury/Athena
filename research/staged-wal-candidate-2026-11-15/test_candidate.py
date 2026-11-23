import importlib.util, json, os, pathlib, shutil, sqlite3, subprocess, tempfile, unittest, sys, time
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('candidate',pathlib.Path(__file__).with_name('prepare_candidate.py'))
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
class Candidate(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup); self.root=pathlib.Path(self.tmp.name)
        self.source=self.root/'stopped.sqlite'; self.out=self.root/'new.sqlite'
        live=self.root/'fixture.sqlite'
        db=sqlite3.connect(live)
        try:
            db.execute('pragma journal_mode=WAL'); db.execute('pragma wal_autocheckpoint=0')
            db.execute('create table evidence(id integer primary key, value text)'); db.execute("insert into evidence values(1,'retained from WAL')"); db.commit()
            # Construct a stopped synthetic artifact while fixture is idle, then close the fixture.
            shutil.copyfile(live,self.source); shutil.copyfile(str(live)+'-wal',str(self.source)+'-wal')
        finally: db.close()
        self.before=c.helper.digest(c.helper.capture(self.source))
        self.worker=os.environ['ATHENA_STAGED_WAL_BINARY']
    def unchanged(self): self.assertEqual(c.helper.digest(c.helper.capture(self.source)),self.before)
    def test_committed_wal_preserved(self):
        receipt=c.prepare(self.source,self.out,self.root,self.worker,True)
        self.assertGreaterEqual(receipt['sqlite_version_number'],3054000)
        db=sqlite3.connect(self.out)
        try: self.assertEqual(db.execute('select * from evidence').fetchall(),[(1,'retained from WAL')])
        finally: db.close()
        self.unchanged(); print(json.dumps(receipt))
    def test_existing_destination_preserved(self):
        self.out.write_bytes(b'keep'); self.assertRaises(FileExistsError,c.prepare,self.source,self.out,self.root,self.worker,True)
        self.assertEqual(self.out.read_bytes(),b'keep');self.unchanged()
    def test_assertion_required(self):
        self.assertRaises(ValueError,c.prepare,self.source,self.out,self.root,self.worker);self.unchanged()
    def test_mismatched_pages_fail_closed(self):
        wal=pathlib.Path(str(self.source)+'-wal'); data=bytearray(wal.read_bytes()); data[8:12]=(8192).to_bytes(4,'big');wal.write_bytes(data)
        self.before=c.helper.digest(c.helper.capture(self.source))
        self.assertRaises(subprocess.CalledProcessError,c.prepare,self.source,self.out,self.root,self.worker,True)
        self.assertFalse(self.out.exists());self.unchanged()
    def test_truncated_wal_refused(self):
        pathlib.Path(str(self.source)+'-wal').write_bytes(b'bad');self.before=c.helper.digest(c.helper.capture(self.source))
        self.assertRaises(subprocess.CalledProcessError,c.prepare,self.source,self.out,self.root,self.worker,True)
        self.assertFalse(self.out.exists());self.unchanged()
    def test_corrupted_frame_refused(self):
        wal=pathlib.Path(str(self.source)+'-wal'); data=bytearray(wal.read_bytes());data[-1]^=1;wal.write_bytes(data)
        self.before=c.helper.digest(c.helper.capture(self.source))
        self.assertRaises(subprocess.CalledProcessError,c.prepare,self.source,self.out,self.root,self.worker,True)
        self.assertFalse(self.out.exists());self.unchanged()
    def test_65536_page_fixture(self):
        live=self.root/'large-page.sqlite';db=sqlite3.connect(live)
        try:
            db.execute('pragma page_size=65536');db.execute('pragma journal_mode=WAL');db.execute('pragma wal_autocheckpoint=0')
            db.execute('create table evidence(value text)');db.execute("insert into evidence values('64KiB preserved')");db.commit()
            shutil.copyfile(live,self.source);shutil.copyfile(str(live)+'-wal',str(self.source)+'-wal')
        finally:db.close()
        self.before=c.helper.digest(c.helper.capture(self.source))
        c.prepare(self.source,self.out,self.root,self.worker,True);self.unchanged()
        db=sqlite3.connect(self.out)
        try:self.assertEqual(db.execute('select value from evidence').fetchone()[0],'64KiB preserved')
        finally:db.close()
    def test_big_endian_checksum(self):
        wal=pathlib.Path(str(self.source)+'-wal');data=bytearray(wal.read_bytes());data[:4]=(0x377f0683).to_bytes(4,'big')
        sums=[0,0]
        def checksum(part):
            for at in range(0,len(part),8):
                sums[0]=(sums[0]+int.from_bytes(part[at:at+4],'big')+sums[1])&0xffffffff
                sums[1]=(sums[1]+int.from_bytes(part[at+4:at+8],'big')+sums[0])&0xffffffff
            return sums[0].to_bytes(4,'big')+sums[1].to_bytes(4,'big')
        data[24:32]=checksum(data[:24]);page=int.from_bytes(data[8:12],'big')
        for at in range(32,len(data),page+24):
            checksum(data[at:at+8]);data[at+16:at+24]=checksum(data[at+24:at+24+page])
        wal.write_bytes(data);self.before=c.helper.digest(c.helper.capture(self.source))
        c.prepare(self.source,self.out,self.root,self.worker,True);self.unchanged()
        db=sqlite3.connect(self.out)
        try:self.assertEqual(db.execute('select value from evidence').fetchone()[0],'retained from WAL')
        finally:db.close()
    def test_old_salt_tail_conservatively_refused(self):
        wal=pathlib.Path(str(self.source)+'-wal');data=bytearray(wal.read_bytes());page=int.from_bytes(data[8:12],'big')
        tail=bytearray(data[-page-24:]);tail[8]^=1;wal.write_bytes(data+tail)
        self.before=c.helper.digest(c.helper.capture(self.source))
        self.assertRaises(subprocess.CalledProcessError,c.prepare,self.source,self.out,self.root,self.worker,True)
        self.assertFalse(self.out.exists());self.unchanged()
    def test_actual_child_deadline(self):
        original=subprocess.run;start=time.monotonic()
        def sleeping_child(*args,**kwargs):
            return original([sys.executable,'-c','import time;time.sleep(30)'],**kwargs)
        with patch.object(c.subprocess,'run',side_effect=sleeping_child):
            self.assertRaises(subprocess.TimeoutExpired,c.prepare,self.source,self.out,self.root,self.worker,True)
        self.assertGreaterEqual(time.monotonic()-start,11);self.assertLess(time.monotonic()-start,20)
        self.assertFalse(self.out.exists());self.assertFalse(list(self.root.glob('athena-wal-candidate-*')));self.unchanged()
    def test_rollback_header_with_wal_refused(self):
        data=bytearray(self.source.read_bytes());data[18:20]=b'\x01\x01';self.source.write_bytes(data)
        self.before=c.helper.digest(c.helper.capture(self.source))
        self.assertRaises(subprocess.CalledProcessError,c.prepare,self.source,self.out,self.root,self.worker,True)
        self.assertFalse(self.out.exists());self.unchanged()
    def test_changed_source_withholds_destination(self):
        original=subprocess.run
        def changed(*args,**kwargs):
            result=original(*args,**kwargs)
            with self.source.open('ab') as f:f.write(b'changed')
            return result
        with patch.object(c.subprocess,'run',side_effect=changed):
            self.assertRaisesRegex(ValueError,'Source changed',c.prepare,self.source,self.out,self.root,self.worker,True)
        self.assertFalse(self.out.exists())
    def test_final_destination_sidecars_preserved(self):
        for suffix in ('-wal','-shm','-journal'):
            side=pathlib.Path(str(self.out)+suffix);side.write_bytes(b'untouched')
            self.assertRaises(FileExistsError,c.prepare,self.source,self.out,self.root,self.worker,True)
            self.assertEqual(side.read_bytes(),b'untouched');self.assertFalse(self.out.exists());side.unlink()
        self.unchanged()
    def test_dangling_destination_sidecar_refused(self):
        side=pathlib.Path(str(self.out)+'-wal')
        try:side.symlink_to(self.root/'absent')
        except OSError as e:self.skipTest('Host symlink capability unavailable: '+str(e))
        self.assertRaises(FileExistsError,c.prepare,self.source,self.out,self.root,self.worker,True)
        self.assertTrue(side.is_symlink());self.assertFalse(self.out.exists());self.unchanged()
    def test_late_destination_sidecar_preserved(self):
        original=subprocess.run;side=pathlib.Path(str(self.out)+'-journal')
        def appeared(*args,**kwargs):
            result=original(*args,**kwargs);side.write_bytes(b'keep');return result
        with patch.object(c.subprocess,'run',side_effect=appeared):
            self.assertRaises(FileExistsError,c.prepare,self.source,self.out,self.root,self.worker,True)
        self.assertEqual(side.read_bytes(),b'keep');self.assertFalse(self.out.exists());self.unchanged()
    def test_parent_timeout_cleans_stage(self):
        with patch.object(c.subprocess,'run',side_effect=subprocess.TimeoutExpired('reviewed-worker',12)) as run:
            self.assertRaises(subprocess.TimeoutExpired,c.prepare,self.source,self.out,self.root,self.worker,True)
            self.assertEqual(run.call_args.kwargs['timeout'],12)
        self.assertFalse(self.out.exists());self.assertFalse(list(self.root.glob('athena-wal-candidate-*')));self.unchanged()
if __name__=='__main__': unittest.main()
