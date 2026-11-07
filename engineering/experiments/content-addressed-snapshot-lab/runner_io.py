"""Bounded complete-file fingerprints for the fixed experimental executable."""
import hashlib,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
def digest(path,maximum=64*1024*1024):
 if type(maximum) is not int or not 0<=maximum<=64*1024*1024:raise ValueError("Invalid fingerprint budget")
 h=hashlib.sha256();total=0
 with pathlib.Path(path).open('rb') as source:
  while chunk:=source.read(65536):
   total+=len(chunk)
   if total>maximum:raise ValueError('Fingerprint input exceeds budget')
   h.update(chunk)
 return h.hexdigest()
def fixed_binary(path):
 expected=ROOT/'apps/atlas-lab/target/release/examples/addressed_snapshot_crash_probe'
 if expected.is_symlink() or pathlib.Path(path).resolve()!=expected.resolve() or not expected.is_file():raise ValueError('Only the fixed locally built probe is permitted')
 return expected
