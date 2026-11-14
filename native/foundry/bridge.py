"""Explicit local-only Athena profile; fixed executable/database, no arbitrary commands or paths."""
import argparse,json,mimetypes,pathlib,subprocess,threading,hashlib,re,time,secrets
from http.server import BaseHTTPRequestHandler,HTTPServer
from urllib.parse import urlsplit,unquote
MAX_BODY=4_000_000
# Explicitly reviewed application assets only; never expose operator backup/data files.
STATIC_PATHS=frozenset(['app.js', 'catalog.js', 'core.js', 'index.html', 'native-store-bootstrap.js', 'styles.css', 'workshops/cloud/learner-pack.zip', 'workshops/data/learner-pack.zip', 'workshops/programming/learner-pack.zip', 'workshops/security/learner-pack.zip', 'workshops/systems/learner-pack.zip', 'workspace-host.js', 'workspaces/engineering/audio/archive-selection.mjs', 'workspaces/engineering/audio/audio-core.mjs', 'workspaces/engineering/audio/index.mjs', 'workspaces/engineering/audio/manifest.json', 'workspaces/engineering/audio/media-events.mjs', 'workspaces/engineering/audio/style.css', 'workspaces/engineering/cards/baseline.mjs', 'workspaces/engineering/cards/bounded-encoding.mjs', 'workspaces/engineering/cards/cooperative-commit.mjs', 'workspaces/engineering/cards/cooperative-pairs.mjs', 'workspaces/engineering/cards/cooperative-scheduler.mjs', 'workspaces/engineering/cards/index.mjs', 'workspaces/engineering/cards/lab-core.mjs', 'workspaces/engineering/cards/lab-worker.mjs', 'workspaces/engineering/cards/manifest.json', 'workspaces/engineering/cards/preparation-core.mjs', 'workspaces/engineering/cards/style.css', 'workspaces/engineering/cards/verified-receiver.mjs', 'workspaces/engineering/diagnostics/event-log-baseline.mjs', 'workspaces/engineering/diagnostics/event-log-fixture.json', 'workspaces/engineering/diagnostics/event-log-recovery.mjs', 'workspaces/engineering/diagnostics/event-log-view.mjs', 'workspaces/engineering/diagnostics/index.mjs', 'workspaces/engineering/diagnostics/manifest.json', 'workspaces/engineering/diagnostics/preview-loader.mjs', 'workspaces/engineering/diagnostics/style.css', 'workspaces/engineering/lab/archive-view.mjs', 'workspaces/engineering/lab/collection-input.mjs', 'workspaces/engineering/lab/index.mjs', 'workspaces/engineering/lab/job-submit.mjs', 'workspaces/engineering/lab/manifest.json', 'workspaces/engineering/lab/style.css', 'workspaces/engineering/manifest.json', 'workspaces/engineering/media/bilibili-player.mjs', 'workspaces/engineering/media/event-log-view.mjs', 'workspaces/engineering/media/index.mjs', 'workspaces/engineering/media/media-core.mjs', 'workspaces/engineering/media/media-event-recorder.mjs', 'workspaces/engineering/media/media-events.mjs', 'workspaces/engineering/media/preview-loader.mjs', 'workspaces/engineering/media/public-fixtures.json', 'workspaces/engineering/media/resource-loader.mjs', 'workspaces/engineering/media/style.css', 'workspaces/engineering/media/vendor/HLS-LICENSE.txt', 'workspaces/engineering/media/vendor/hls-1.7.3.min.js', 'workspaces/engineering/media/vendor/provenance.json', 'workspaces/engineering/receiver/baseline.293713d95cef8511.mjs', 'workspaces/engineering/receiver/bounded-encoding.b3c034a08dcad316.mjs', 'workspaces/engineering/receiver/index.mjs', 'workspaces/engineering/receiver/lab-core.07b69b8b7583dd03.mjs', 'workspaces/engineering/receiver/manifest.json', 'workspaces/engineering/receiver/phase-clock.517bbc23572a2147.mjs', 'workspaces/engineering/receiver/receipt-protocol.b4d10c91dd34ebaa.mjs', 'workspaces/engineering/receiver/receiver-worker.2ddd526f33d730b2.mjs', 'workspaces/engineering/receiver/style.css', 'workspaces/engineering/receiver/verified-receiver.0b0bb67b4513ac91.mjs', 'workspaces/engineering/receiver/worker-esbuild.b1772614243c7c75.mjs', 'workspaces/engineering/receiver/worker-rolldown.0e9c42dd5c7472df.mjs', 'workspaces/engineering/research/catalog.json', 'workspaces/engineering/research/explorer-core.mjs', 'workspaces/engineering/research/index.mjs', 'workspaces/engineering/research/style.css', 'workspaces/foundry/FOUNDRY-LICENSE.txt', 'workspaces/foundry/THREE-LICENSE.txt', 'workspaces/foundry/catalog.json', 'workspaces/foundry/cinematic-world.mjs', 'workspaces/foundry/cinematic.mjs', 'workspaces/foundry/index.mjs', 'workspaces/foundry/layout-state.mjs', 'workspaces/foundry/native-backup.mjs', 'workspaces/foundry/native-import.mjs', 'workspaces/foundry/native-soundtrack.mjs', 'workspaces/foundry/native-weather.mjs', 'workspaces/foundry/native-ecology.mjs', 'workspaces/foundry/native-local-video.mjs', 'workspaces/foundry/native-environment.mjs', 'workspaces/foundry/native-tones.mjs', 'workspaces/foundry/native-canvas-view.mjs','workspaces/foundry/native-layers.mjs', 'workspaces/foundry/native-semantic-room.mjs', 'workspaces/foundry/style.css', 'workspaces/foundry/weather-renderer.mjs'])
FOUNDRY_MODULES=('canvasView','cinema','weather','backup','soundtrack','legacyImport','ecology','localVideo','environment','semanticRoom','tones','layers')
class Bridge(HTTPServer):
    def __init__(self,binary,database,runtime,legacy_source=None,import_destination=None,disable_foundry_modules=()):
        if any(name not in FOUNDRY_MODULES for name in disable_foundry_modules):raise ValueError('Unknown Foundry module')
        disabled={name:False for name in sorted(set(disable_foundry_modules))}
        self.binary=str(pathlib.Path(binary).resolve(strict=True));self.database=str(pathlib.Path(database).resolve(strict=True))
        if bool(legacy_source)!=bool(import_destination):raise ValueError('Both legacy paths must be explicitly selected')
        self.legacy_source=None;self.import_destination=None;self.review=None
        if legacy_source:
            source=pathlib.Path(legacy_source);destination=pathlib.Path(import_destination)
            if source.is_symlink() or destination.is_symlink():raise ValueError('Symlink import paths rejected')
            self.legacy_source=source.resolve(strict=True)
            self.import_destination=destination.parent.resolve(strict=True)/destination.name
            protected={pathlib.Path(str(base)+suffix) for base in (self.legacy_source,pathlib.Path(self.database)) for suffix in ('','-wal','-shm','-journal')}
            if self.import_destination in protected:raise ValueError('Import must use a separate new destination, not source/live sidecars')
        self.files={}
        root=pathlib.Path(runtime).resolve(strict=True)
        for p in root.rglob('*'):
            if p.is_symlink():raise ValueError('Symlink runtime rejected')
            if p.is_file():
                relative=p.relative_to(root)
                if any(x.startswith('.') for x in relative.parts):continue
                if relative.as_posix() not in STATIC_PATHS:raise ValueError('Unreviewed runtime file rejected; move private data outside runtime')
                self.files['/'+relative.as_posix()]=(p.read_bytes(),{'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'}.get(p.suffix.lower(),mimetypes.guess_type(p)[0] or 'application/octet-stream'))
        if disabled:
            payload,kind=self.files['/native-store-bootstrap.js']
            marker=b'/* FOUNDRY_STARTUP_MODULES */{}'
            if payload.count(marker)!=1:raise ValueError('Unsupported native bootstrap profile marker')
            self.files['/native-store-bootstrap.js']=(payload.replace(marker,json.dumps(disabled,separators=(',',':')).encode()),kind)
        status=json.loads(self.cli('status'))
        self.schema=status.get('schema')
        if self.schema not in (2,3,4,5,6,7,8,9,10,11,12,13,14,15):raise ValueError('Database requires explicit backup upgrade before launch')
        super().__init__(('127.0.0.1',0),Handler)
        self.origin=f'http://127.0.0.1:{self.server_port}';self.host=f'127.0.0.1:{self.server_port}'
    def fingerprint(self):
        p=self.legacy_source
        if p is None or p.is_symlink():raise ValueError('No stable configured source')
        before=p.stat()
        if not p.is_file() or before.st_size>64*1024*1024:raise ValueError('Source size/type rejected')
        h=hashlib.sha256()
        with p.open('rb') as f:
            total=0
            while chunk:=f.read(1024*1024):
                total+=len(chunk)
                if total>64*1024*1024:raise ValueError('Source grew beyond limit')
                h.update(chunk)
        after=p.stat()
        info=lambda x:(x.st_dev,x.st_ino,x.st_size,x.st_mtime_ns,x.st_ctime_ns)
        if info(before)!=info(after):raise ValueError('Source changed during fingerprint')
        return (h.hexdigest(),info(after))
    def legacy_cli(self,action):
        args=[self.binary,action,str(self.legacy_source)]
        if action=='import-legacy':args.append(str(self.import_destination))
        result=subprocess.run(args,capture_output=True,text=True,timeout=15,check=False)
        if result.returncode or len(result.stdout.encode())>MAX_BODY:raise ValueError('Legacy operation rejected')
        return json.loads(result.stdout)
    def inspect_source(self):
        self.review=None
        before=self.fingerprint();report=self.legacy_cli('inspect-legacy');after=self.fingerprint()
        if before!=after:raise ValueError('Source changed during review')
        token=secrets.token_hex(32);self.review=(token,after,time.monotonic())
        return {'report':report,'review_token':token,'destination_exists':self.import_destination.exists(),'lossless_migration':False}
    def import_reviewed(self,token):
        review=self.review;self.review=None
        if not review or token!=review[0] or time.monotonic()-review[2]>300: return 409,{'error':'Fresh dry-run review required; no import attempted'}
        if self.fingerprint()!=review[1]:return 409,{'error':'Source changed since review; no import attempted'}
        if self.import_destination.exists() or self.import_destination.is_symlink():return 409,{'error':'Destination already exists; never overwritten'}
        try:report=self.legacy_cli('import-legacy')
        except (ValueError,subprocess.TimeoutExpired):return 422,{'error':'Import not confirmed. Destination may contain partial output; preserve and inspect it. Do not retry blindly. Source and live database were not intentionally changed.'}
        try:unchanged=self.fingerprint()==review[1]
        except (OSError,ValueError):unchanged=False
        return 200,{'imported':True,'report':report,'source_unchanged_at_checks':unchanged,'snapshot_identity_verified':False,'lossless_migration':False,'restart_required':True}
    def cli(self,command,text=None,revision=None,room=None):
        result=subprocess.run([self.binary,command,self.database]+([str(revision)] if revision is not None else [])+(list(room) if room is not None else []),input=text,capture_output=True,text=True,timeout=15,check=False)
        if result.returncode!=0:raise ValueError('Native operation failed; database retained')
        if len(result.stdout.encode())>MAX_BODY:raise ValueError('Native response exceeds limit')
        return result.stdout.strip()
def version(text):
    return '"empty"' if text=='null' else '"'+hashlib.sha256(text.encode()).hexdigest()+'"'
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args):pass # No saved body, URL or user-data logs.
    def setup(self):super().setup();self.connection.settimeout(5)
    def reply(self,code,body=b'',kind='application/json',etag=None):
        if isinstance(body,str):body=body.encode()
        self.send_response(code);self.send_header('Content-Type',kind);self.send_header('Content-Length',str(len(body)))
        self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Cross-Origin-Resource-Policy','same-origin');self.send_header('X-Frame-Options','DENY');self.send_header('Referrer-Policy','no-referrer')
        if etag is not None:self.send_header('ETag',etag)
        self.end_headers();self.wfile.write(body)
    def valid(self,api=False,mutating=False):
        if self.headers.get_all('Host')!=[self.server.host]:return False
        origins=self.headers.get_all('Origin') or []
        if origins and origins!=[self.server.origin]:return False
        if mutating and origins!=[self.server.origin]:return False
        if self.headers.get('Sec-Fetch-Site') not in (None,'same-origin','none'):return False
        if api and self.headers.get_all('X-Athena-Native')!=['1']:return False
        return True
    def do_OPTIONS(self):self.reply(405)
    def do_GET(self):
        if not self.valid():return self.reply(403)
        parsed=urlsplit(self.path)
        if parsed.scheme or parsed.netloc or parsed.query or parsed.fragment:return self.reply(400)
        if parsed.path=='/__native/legacy-review':
            if not self.valid(api=True):return self.reply(403)
            if self.server.legacy_source is None:return self.reply(409,'{"error":"Legacy import not configured. Operator must select source and NEW destination at launch."}')
            try:return self.reply(200,json.dumps(self.server.inspect_source()))
            except (OSError,ValueError,subprocess.TimeoutExpired):return self.reply(422,'{"error":"Review failed or source changed; no import attempted. A quiescent supported source backup is required."}')
        if parsed.path.startswith('/__native/soundtrack/'):
            if not self.valid(api=True):return self.reply(403)
            match=re.fullmatch(r'/__native/soundtrack/([a-z0-9-]{1,100})/([a-z0-9:-]{1,100})',parsed.path)
            if not match:return self.reply(400)
            if self.server.schema not in (4,5,6,7,8,9,10,11,12,13,14,15):return self.reply(409,'{"error":"Soundtrack metadata requires explicit upgrade-soundtracks and relaunch; no automatic migration"}')
            try:
                result=json.loads(self.server.cli('read-native-versioned',room=match.groups()));return self.reply(200,json.dumps(result['value']),etag=result['version'])
            except (ValueError,subprocess.TimeoutExpired):return self.reply(422,'{"error":"Soundtrack metadata unavailable or invalid"}')
        if parsed.path=='/__native/revisions' or parsed.path.startswith('/__native/revision/'):
            if not self.valid(api=True):return self.reply(403)
            if self.server.schema==2:return self.reply(409,'{"error":"History unavailable: explicit upgrade-history required before relaunch. No automatic migration."}')
            try:
                if parsed.path=='/__native/revisions':return self.reply(200,self.server.cli('revisions'))
                match=re.fullmatch(r'/__native/revision/([1-9][0-9]{0,15})',parsed.path)
                if not match:return self.reply(400)
                return self.reply(200,self.server.cli('read-revision',revision=int(match[1])))
            except (ValueError,subprocess.TimeoutExpired):return self.reply(422,'{"error":"Revision missing, corrupt, or unavailable; no changes made"}')
        if parsed.path=='/__native/backup':
            if not self.valid(api=True):return self.reply(403)
            try:
                text=self.server.cli('load-backup');return self.reply(200,text,etag=version(text))
            except (ValueError,subprocess.TimeoutExpired):return self.reply(422,'{"error":"Native read failed"}')
        path=unquote(parsed.path)
        if path=='/':path='/index.html'
        if path not in self.server.files:return self.reply(404)
        data,kind=self.server.files[path];return self.reply(200,data,kind)
    def reject_post(self,code):
        # Closing with an unread request body can reset TCP on Windows, hiding
        # the rejection response. Discard only bounded, unambiguous framing;
        # never parse, store or dispatch rejected input. Slow peers get 250ms.
        self.close_connection=True
        lengths=self.headers.get_all('Content-Length') or []
        if (not self.headers.get_all('Transfer-Encoding') and len(lengths)==1
                and re.fullmatch(r'[0-9]{1,7}',lengths[0])
                and int(lengths[0])<=MAX_BODY):
            remaining=int(lengths[0]);deadline=time.monotonic()+0.25
            previous=self.connection.gettimeout()
            try:
                while remaining:
                    budget=deadline-time.monotonic()
                    if budget<=0:break
                    self.connection.settimeout(budget)
                    chunk=self.rfile.read1(min(remaining,65536))
                    if not chunk:break
                    remaining-=len(chunk)
            except OSError:
                pass # Incomplete/slow rejected input must never block service.
            finally:self.connection.settimeout(previous)
        return self.reply(code)
    def do_POST(self):
        if self.path not in ('/__native/backup','/__native/restore','/__native/assign-soundtrack','/__native/legacy-import'):return self.reject_post(404)
        if not self.valid(api=True,mutating=True):return self.reject_post(403)
        if self.headers.get('Content-Type')!='application/json' or self.headers.get('Transfer-Encoding'):return self.reject_post(415)
        lengths=self.headers.get_all('Content-Length') or []
        if len(lengths)!=1 or not lengths[0].isdigit():return self.reject_post(411)
        length=int(lengths[0])
        if length>MAX_BODY:return self.reject_post(413)
        try:
            raw=self.rfile.read(length)
            if len(raw)!=length:return self.reply(400)
            text=raw.decode('utf8')
            if self.path=='/__native/legacy-import':
                if self.server.legacy_source is None:return self.reply(409,'{"error":"Legacy import not configured"}')
                if length>1024:return self.reply(413)
                request=json.loads(text)
                if not isinstance(request,dict) or set(request)!={'review_token'} or not isinstance(request['review_token'],str) or len(request['review_token'])!=64:return self.reply(400)
                try:code,result=self.server.import_reviewed(request['review_token']);return self.reply(code,json.dumps(result))
                except (OSError,ValueError):return self.reply(422,'{"error":"Source changed or unavailable; fresh review required. Preserve any existing output."}')
            expected=self.headers.get_all('If-Match') or []
            if not expected:return self.reply(428,'{"error":"Load and review native backup before saving"}')
            if len(expected)!=1 or len(expected[0])>80:return self.reply(400)
            if self.path=='/__native/assign-soundtrack':
                if self.server.schema not in (4,5,6,7,8,9,10,11,12,13,14,15):return self.reply(422,'{"error":"Explicit upgrade-soundtracks required"}')
                if len(raw)>8192:return self.reply(413)
                assignment=json.loads(text)
                if not isinstance(assignment,dict) or set(assignment)!={'theme_id','room_id','provider','url','label'}:return self.reply(400)
                result=json.loads(self.server.cli('compare-assign-soundtrack',json.dumps({'expected':expected[0],'assignment':assignment})))
                if result is None:return self.reply(409,'{"error":"Room bookmark changed; refresh and review before retrying"}')
                return self.reply(200,json.dumps(result['value']),etag=result['version'])
            if self.path=='/__native/restore':
                if self.server.schema==2:return self.reply(422,'{"error":"History requires explicit upgrade-history before relaunch"}')
                request=json.loads(text)
                if not isinstance(request,dict) or set(request)!={'id'} or type(request['id']) is not int or not 1<=request['id']<=9007199254740991:return self.reply(400)
                result=json.loads(self.server.cli('compare-restore-revision',json.dumps({'expected':expected[0],'id':request['id']})))
                if result is None:return self.reply(409,'{"error":"Native backup changed; restore and review first"}')
                return self.reply(200,json.dumps(result),etag=result['version'])
            payload=json.loads(text)
            if isinstance(payload,dict) and payload.get('version')==11 and self.server.schema<14:return self.reply(422,'{"error":"Blend modes require explicit upgrade-blend-modes to schema14 and relaunch"}')
            if isinstance(payload,dict) and payload.get('version')==10 and self.server.schema<13:return self.reply(422,'{"error":"Expanded environments require explicit upgrade-environments to schema13 and relaunch"}')
            if isinstance(payload,dict) and payload.get('version')==9 and self.server.schema<12:return self.reply(422,'{"error":"Origin backups require explicit upgrade-origins to schema12 and relaunch"}')
            if isinstance(payload,dict) and payload.get('version')==8 and self.server.schema<11:return self.reply(422,'{"error":"Filter backups require explicit upgrade-filters to schema11 and relaunch; no migration was performed"}')
            if isinstance(payload,dict) and payload.get('version')==7 and self.server.schema<10:return self.reply(422,'{"error":"Appearance backups require explicit upgrade-appearance to schema10 and relaunch; no migration was performed"}')
            if isinstance(payload,dict) and payload.get('version')==6 and self.server.schema<9:return self.reply(422,'{"error":"Instance backups require explicit upgrade-instances to schema9 and relaunch; no migration was performed"}')
            if isinstance(payload,dict) and payload.get('version')==5 and self.server.schema<8:return self.reply(422,'{"error":"Targeted environment backups require explicit upgrade-targets to schema8 and relaunch; no migration was performed"}')
            if isinstance(payload,dict) and payload.get('version')==4 and self.server.schema<7:return self.reply(422,'{"error":"Environment backups require explicit upgrade-environment to schema7 and relaunch; no migration was performed"}')
            if isinstance(payload,dict) and payload.get('version')==3 and self.server.schema<6:return self.reply(422,'{"error":"Scoped backups require explicit upgrade-scopes to schema6 and relaunch; no migration was performed"}')
            if isinstance(payload,dict) and payload.get('version')==2 and self.server.schema<5:return self.reply(422,'{"error":"Transform backups require explicit upgrade-transforms to schema5 and relaunch; no migration was performed"}')
            result=json.loads(self.server.cli('compare-save-backup',json.dumps({'expected':expected[0],'text':text})))
            if not result.get('saved'):return self.reply(409,'{"error":"Native backup changed. Restore and review before saving again"}')
            return self.reply(200,'{"saved":true}',etag=result['version'])
        except (ValueError,UnicodeError,subprocess.TimeoutExpired,TimeoutError):return self.reply(422,'{"error":"Native save rejected"}')
def main():
    p=argparse.ArgumentParser();p.add_argument('--binary',required=True);p.add_argument('--database',required=True);p.add_argument('--runtime',default=str(pathlib.Path(__file__).resolve().parents[2]/'dist'));p.add_argument('--legacy-source');p.add_argument('--import-destination');p.add_argument('--disable-foundry-module',action='append',default=[],choices=FOUNDRY_MODULES);a=p.parse_args()
    server=Bridge(a.binary,a.database,a.runtime,a.legacy_source,a.import_destination,a.disable_foundry_module);print(server.origin+'/#build',flush=True)
    try:server.serve_forever()
    finally:server.server_close()
if __name__=='__main__':main()
