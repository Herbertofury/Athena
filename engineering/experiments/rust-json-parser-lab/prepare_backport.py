#!/usr/bin/env python3
"""Prepare an isolated source repair; no download, build, app change or overwrite."""
import argparse,hashlib,json,shutil,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('crate_dir',type=Path);p.add_argument('new_directory',type=Path);args=p.parse_args()
source=args.crate_dir.resolve();dest=args.new_directory.resolve();here=Path(__file__).resolve().parent
expected='bff940468eda3173a2c1b7bac3e2658bf0beac17f4029fc00bd322499dffa8c5'
repaired='1926d04ef7b02f9781859334400f631d90a7b34ad1963c2d8be64c07e287224b'
if dest.exists():raise SystemExit('Refusing to overwrite an existing experiment or backup')
if hashlib.sha256((source/'src/stringparse.rs').read_bytes()).hexdigest()!=expected:raise SystemExit('Source mismatch: expected the exact released simd-json 0.18.1 source')
if json.loads((source/'.cargo_vcs_info.json').read_text())['git']['sha1']!='61d649d13fae83ac6d9f587863696be2741f5b8b':raise SystemExit('Unexpected release provenance')
dest.mkdir(parents=True);shutil.copytree(source,dest/'patched-simd-json')
subprocess.run(['patch','--batch','--forward','-p1','-i',str(here/'unicode-backport.patch')],cwd=dest/'patched-simd-json',check=True)
if hashlib.sha256((dest/'patched-simd-json/src/stringparse.rs').read_bytes()).hexdigest()!=repaired:raise SystemExit('Repair output mismatch; retained directory for diagnosis')
for name,accurate in [('repaired-runner',False),('accurate-reference-runner',True)]:
 runner=dest/name;(runner/'src').mkdir(parents=True);shutil.copy2(here/'src/main.rs',runner/'src/main.rs');shutil.copy2(here/'Cargo.lock',runner/'Cargo.lock')
 if (here/'src/bin/allocations.rs').exists():
  (runner/'src/bin').mkdir();shutil.copy2(here/'src/bin/allocations.rs',runner/'src/bin/allocations.rs')
 manifest=(here/'Cargo.toml').read_text()
 if accurate:manifest=manifest.replace('serde_json = "=1.0.154"','serde_json = { version = "=1.0.154", features = ["float_roundtrip"] }')
 (runner/'Cargo.toml').write_text(manifest+'\n[patch.crates-io]\nsimd-json = { path = "../patched-simd-json" }\n')
print('Prepared isolated runners. Build offline to update their copied locks, then use --locked. No application dependency changed.')
