"""Verify a private bundle without applying it."""
import argparse,json
from pathlib import Path
from convert import verify_bundle
if __name__ == "__main__":
 p=argparse.ArgumentParser(description=__doc__);p.add_argument("--catalog",required=True,type=Path);p.add_argument("--bundle",required=True,type=Path);a=p.parse_args()
 try: print(json.dumps(verify_bundle(a.bundle,a.catalog)))
 except Exception: raise SystemExit("Verification failed; preserve private bundle for review")
