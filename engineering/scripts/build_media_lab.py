#!/usr/bin/env python3
"""Content-addressed public-media lab, with pinned third-party bundle integrity."""
import argparse,base64,hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'docs/media-lab'
def outputs():
 recovery=(ROOT/'event-log-recovery.mjs').read_bytes();recovery_name='event-log-recovery.'+hashlib.sha256(recovery).hexdigest()[:16]+'.mjs'
 baseline=(ROOT/'event-log-baseline.mjs').read_bytes();baseline_name='event-log-baseline.'+hashlib.sha256(baseline).hexdigest()[:16]+'.mjs'
 log=(ROOT/'event-log-view.mjs').read_bytes();log_name='event-log-view.'+hashlib.sha256(log).hexdigest()[:16]+'.mjs'
 log_fixture=(ROOT/'event-log-fixture.json').read_bytes();log_fixture_name='event-log-fixture.'+hashlib.sha256(log_fixture).hexdigest()[:16]+'.json'
 log_script=(ROOT/'event-log-benchmark.js').read_text().replace("'./event-log-recovery.mjs'",repr('./'+recovery_name)).replace("'./event-log-baseline.mjs'",repr('./'+baseline_name)).replace("'./event-log-view.mjs'",repr('./'+log_name)).replace("'./event-log-fixture.json'",repr('./'+log_fixture_name)).encode();log_script_name='event-log-benchmark.'+hashlib.sha256(log_script).hexdigest()[:16]+'.js'
 log_html=(ROOT/'event-log-benchmark.template.html').read_text().replace('src="event-log-benchmark.js"',f'src="{log_script_name}"').encode()
 recorder=(ROOT/'media-event-recorder.mjs').read_text().replace("'./event-log-view.mjs'",repr('./'+log_name)).encode();recorder_name='media-event-recorder.'+hashlib.sha256(recorder).hexdigest()[:16]+'.mjs'
 events=(ROOT/'media-events.mjs').read_bytes();events_name='media-events.'+hashlib.sha256(events).hexdigest()[:16]+'.mjs'
 preview=(ROOT/'preview-loader.mjs').read_bytes();preview_name='preview-loader.'+hashlib.sha256(preview).hexdigest()[:16]+'.mjs'
 timeout_check=(ROOT/'preview-timeout-check.js').read_text().replace("'./preview-loader.mjs'",repr('./'+preview_name)).encode();timeout_name='preview-timeout-check.'+hashlib.sha256(timeout_check).hexdigest()[:16]+'.js'
 timeout_html=(ROOT/'preview-timeout-check.template.html').read_text().replace('src="preview-timeout-check.js"',f'src="{timeout_name}"').encode()
 bili=(ROOT/'bilibili-player.mjs').read_bytes();bili_name='bilibili-player.'+hashlib.sha256(bili).hexdigest()[:16]+'.mjs'
 core=(ROOT/'media-core.mjs').read_text().replace("'./bilibili-player.mjs'",repr('./'+bili_name)).encode();core_name='media-core.'+hashlib.sha256(core).hexdigest()[:16]+'.mjs'
 loader=(ROOT/'resource-loader.mjs').read_bytes();loader_name='resource-loader.'+hashlib.sha256(loader).hexdigest()[:16]+'.mjs'
 fixture=(ROOT/'public-fixtures.json').read_bytes();fixture_name='public-fixtures.'+hashlib.sha256(fixture).hexdigest()[:16]+'.json'
 script=(ROOT/'media.js').read_text().replace("'./media-event-recorder.mjs'",repr('./'+recorder_name)).replace("'./media-events.mjs'",repr('./'+events_name)).replace("'./preview-loader.mjs'",repr('./'+preview_name)).replace("'./bilibili-player.mjs'",repr('./'+bili_name)).replace("'./media-core.mjs'",repr('./'+core_name)).replace("'./resource-loader.mjs'",repr('./'+loader_name)).replace("'./public-fixtures.json'",repr('./'+fixture_name)).encode();script_name='media.'+hashlib.sha256(script).hexdigest()[:16]+'.js'
 css=(ROOT/'media.css').read_bytes();css_name='media.'+hashlib.sha256(css).hexdigest()[:16]+'.css'
 vendor=(ROOT/'vendor/hls-1.7.3.min.js').read_bytes();provenance=json.loads((ROOT/'vendor/provenance.json').read_text())
 if hashlib.sha256(vendor).hexdigest()!=provenance['bundle_sha256']:raise ValueError('Pinned player bundle changed')
 sri='sha384-'+base64.b64encode(hashlib.sha384(vendor).digest()).decode()
 script=script.replace(b'__HLS_SRI__',sri.encode());script_name='media.'+hashlib.sha256(script).hexdigest()[:16]+'.js'
 html=(ROOT/'index.template.html').read_text().replace('href="media.css"',f'href="{css_name}"').replace('src="media.js"',f'src="{script_name}"').replace('src="vendor/hls-1.7.3.min.js"',f'src="vendor/hls-1.7.3.min.js" integrity="{sri}" crossorigin="anonymous"').encode()
 files={timeout_name:timeout_check,'preview-timeout-check.html':timeout_html,recorder_name:recorder,recovery_name:recovery,baseline_name:baseline,log_name:log,log_fixture_name:log_fixture,log_script_name:log_script,'event-log-benchmark.html':log_html,events_name:events,preview_name:preview,bili_name:bili,core_name:core,loader_name:loader,fixture_name:fixture,script_name:script,css_name:css,'index.html':html}
 manifest={'harness':'atlas-real-media-v13-player-ready-deadline','artifacts':{n:hashlib.sha256(b).hexdigest() for n,b in files.items()},'vendor_sha256':provenance['bundle_sha256'],'vendor_sri':sri}
 files['build-manifest.json']=(json.dumps(manifest,indent=2)+'\n').encode();return files
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
 for name,data in outputs().items():
  path=ROOT/name
  if args.check:
   if not path.exists() or path.read_bytes()!=data:raise SystemExit('Stale media asset: '+name)
  else:path.write_bytes(data)
 print('Media asset identities verified' if args.check else 'Media assets generated')
