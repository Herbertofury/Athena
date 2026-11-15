"""Synthetic source-growth regressions; never opens user data in SQLite."""
import io
import pathlib
import tempfile
import unittest
from unittest.mock import patch
import prepare

HEADER = b'SQLite format 3\0'

class CaptureBoundsTests(unittest.TestCase):
 def test_exact_combined_boundary_preserves_bytes(self):
  with tempfile.TemporaryDirectory() as d, patch.object(prepare, 'LIMIT', 64):
   source=pathlib.Path(d)/'source.sqlite';source.write_bytes(HEADER+b'x'*16)
   wal=pathlib.Path(str(source)+'-wal');wal.write_bytes(b'w'*32)
   self.assertEqual(prepare.capture(source),{'':source.read_bytes(),'-wal':wal.read_bytes()})

 def test_growth_reads_only_remaining_budget_plus_sentinel(self):
  for suffix,expected in [('',65),('-wal',33),('-shm',17)]:
   with self.subTest(suffix=suffix),tempfile.TemporaryDirectory() as d,patch.object(prepare,'LIMIT',64):
    source=pathlib.Path(d)/'source.sqlite';source.write_bytes(HEADER+b'x'*16)
    wal=pathlib.Path(str(source)+'-wal');wal.write_bytes(b'w'*16)
    shm=pathlib.Path(str(source)+'-shm');shm.write_bytes(b's'*8)
    target=pathlib.Path(str(source)+suffix);real_open=pathlib.Path.open;reads=[]
    class GrowingStream(io.BytesIO):
     def read(self,size=-1):
      reads.append(size)
      return super().read(size)
    def opened(path,*args,**kwargs):
     if path==target:return GrowingStream(HEADER+b'g'*128)
     return real_open(path,*args,**kwargs)
    before={p:p.read_bytes() for p in (source,wal,shm)}
    with patch.object(pathlib.Path,'open',opened):
     self.assertRaisesRegex(ValueError,'Combined source exceeds',prepare.capture,source)
    self.assertEqual(reads,[expected])
    for path,raw in before.items():self.assertEqual(path.read_bytes(),raw)

 def test_combined_excess_refused_without_prepared_destination(self):
  with tempfile.TemporaryDirectory() as d,patch.object(prepare,'LIMIT',64):
   root=pathlib.Path(d);source=root/'source.sqlite';source.write_bytes(HEADER+b'x'*16)
   pathlib.Path(str(source)+'-wal').write_bytes(b'w'*33);destination=root/'prepared.sqlite'
   self.assertRaisesRegex(ValueError,'Combined source exceeds',prepare.prepare,source,destination,root,True)
   self.assertFalse(destination.exists());self.assertEqual(sorted(p.name for p in root.iterdir()),['source.sqlite','source.sqlite-wal'])

 def test_zero_remaining_budget_still_detects_nonempty_sidecar(self):
  with tempfile.TemporaryDirectory() as d,patch.object(prepare,'LIMIT',64):
   source=pathlib.Path(d)/'source.sqlite';source.write_bytes(HEADER+b'x'*48)
   wal=pathlib.Path(str(source)+'-wal');wal.write_bytes(b'')
   self.assertEqual(prepare.capture(source),{'':source.read_bytes(),'-wal':b''})
   wal.write_bytes(b'x');self.assertRaisesRegex(ValueError,'Combined source exceeds',prepare.capture,source)

if __name__=='__main__':unittest.main()
