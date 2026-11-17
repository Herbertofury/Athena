"""Opt-in, launch-scoped public-source refresh; never accepts browser project text."""
import json,pathlib,re,subprocess,sys,tempfile,threading
class ChallengerService:
 def __init__(self,repositories=(),timeout=35):
  ids=list(dict.fromkeys(repositories))
  if len(ids)>3 or any(not isinstance(x,str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9-]{0,38}/[A-Za-z0-9_.-]{1,100}',x) or x.split('/')[1] in ('.','..') for x in ids):raise ValueError('Select at most three public owner/repository IDs')
  self.repositories=ids;self.timeout=timeout;self.lock=threading.Lock();self.stopped=threading.Event();self.process=None;self.thread=None
  self.result={'status':'pending' if ids else 'disabled','public_repositories':ids,'report':None}
 def start(self):
  if self.repositories and self.thread is None:
   self.thread=threading.Thread(target=self.run,daemon=True);self.thread.start()
 def snapshot(self):
  with self.lock:return json.loads(json.dumps(self.result))
 def run(self):
  here=pathlib.Path(__file__).resolve().parent;script=here/'refresh_challenger_sources.py'
  if not script.is_file():script=here.parents[1]/'scripts'/'refresh_challenger_sources.py'
  try:
   with tempfile.TemporaryDirectory(prefix='athena-public-review-') as directory:
    output=pathlib.Path(directory)/'receipt.json';command=[sys.executable,'-B',str(script),'--refresh','--output',str(output)]
    for identity in self.repositories:command+=['--repo',identity]
    with self.lock:
     if self.stopped.is_set():return
     self.process=subprocess.Popen(command,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:code=self.process.wait(timeout=self.timeout)
    except subprocess.TimeoutExpired:
     self.process.kill();self.process.wait();raise ValueError('deadline')
    if self.stopped.is_set():return
    if code or not output.is_file() or output.stat().st_size>1_000_000:raise ValueError('receipt unavailable')
    report=json.loads(output.read_text(encoding='utf-8'))
    if not isinstance(report,dict) or report.get('kind')!='athena-public-challenger-source-review':raise ValueError('invalid receipt')
    with self.lock:self.result={**self.result,'status':'completed','report':report}
  except (OSError,ValueError,subprocess.SubprocessError):
   with self.lock:
    if not self.stopped.is_set():self.result={**self.result,'status':'unavailable','report':None}
 def close(self):
  self.stopped.set()
  with self.lock:
   process=self.process;self.result={**self.result,'status':'stopped'}
  if process is not None and process.poll() is None:
   try:process.terminate()
   except OSError:pass
  if self.thread:self.thread.join(timeout=2)
  if process is not None and process.poll() is None:
   try:process.kill()
   except OSError:pass
