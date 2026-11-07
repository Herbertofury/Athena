from pathlib import Path
import datetime,hashlib,json,resource,subprocess,time
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'count-run';OUT.mkdir(exist_ok=False)
def budget():
 resource.setrlimit(resource.RLIMIT_AS,(128*1024*1024,128*1024*1024))
 resource.setrlimit(resource.RLIMIT_CPU,(2,2))
results=[];start=time.monotonic()
try:
 for repeat in range(3):
  for n in (1,4,8,12,16):
   for enabled in ('off','on'):
    for lane in (('before','after') if repeat%2==0 else ('after','before')):
     if time.monotonic()-start>60:raise RuntimeError('Whole-run 60-second budget exceeded')
     executable=ROOT/lane/'target/release'/('atlas-wikilink-'+lane)
     label=f'{repeat}-{n}-{enabled}-{lane}'
     p=subprocess.run([str(executable),str(n),enabled],capture_output=True,text=True,timeout=3,preexec_fn=budget,check=False)
     (OUT/(label+'.stdout')).write_text(p.stdout);(OUT/(label+'.stderr')).write_text(p.stderr)
     row={'repeat':repeat,'repetitions':n,'wikilinks':enabled,'version':'0.13.4' if lane=='before' else '0.13.5','exit_code':p.returncode,'executable_sha256':hashlib.sha256(executable.read_bytes()).hexdigest(),'raw_file':label+'.stdout'}
     results.append(row)
     if p.returncode:raise RuntimeError('Bounded parser process failed')
     data=json.loads(p.stdout)
     if data['repetitions']!=n or data['wikilinks']!=(enabled=='on') or data['input_bytes']!=7*n or type(data['event_count']) is not int or data['event_cap_reached'] is not False:raise ValueError('Parser result did not satisfy bounded protocol')
     row['result']=data
finally:
 (OUT/'results.json').write_text(json.dumps({'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Local generated event-count regression; no service, memory-exhaustion attempt, general speed ranking or complete Markdown correctness claim','budgets':{'address_space_bytes_per_child':128*1024*1024,'cpu_seconds_per_child':2,'wall_seconds_per_child':3,'maximum_events':500000,'maximum_input_bytes':112},'samples':results},indent=2)+'\n')
print(json.dumps({'samples':len(results),'elapsed_seconds':time.monotonic()-start}))
