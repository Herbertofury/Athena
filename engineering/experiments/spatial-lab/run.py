"""Measured discrete-circle broad-phase illustration, not engine benchmarking."""
import datetime, hashlib, json, platform, random, statistics, sys, time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'examples'))
from spatial_grid import Circle, brute_force, indexed
rng=random.Random(20261026)
workloads={
 'sparse_1000':[Circle(i,rng.randrange(-5000,5001),rng.randrange(-5000,5001),rng.randrange(1,5)) for i in range(1000)],
 'dense_500':[Circle(i,rng.randrange(-5,6),rng.randrange(-5,6),rng.randrange(1,5)) for i in range(500)],
 'mixed_radius_500':[Circle(i,rng.randrange(-100,101),rng.randrange(-100,101),1 if i%10 else 80) for i in range(500)],
 'huge_radius_fallback':[Circle(i,rng.randrange(-100,101),rng.randrange(-100,101),1 if i else 1000000) for i in range(200)]}
# Ensure the sparse workload contains real overlaps, not only an empty-result fast path.
for i in range(0,40,2):
 a=workloads['sparse_1000'][i]
 workloads['sparse_1000'][i+1]=Circle(i+1,a.x+1,a.y,2)
report={'date':datetime.datetime.now(datetime.timezone.utc).date().isoformat(),'evidence':'measured_local_generated_workload','harness_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'implementation_sha256':hashlib.sha256((Path(__file__).resolve().parents[2]/'examples/spatial_grid.py').read_bytes()).hexdigest(),'environment':{'python':platform.python_version(),'system':platform.system(),'machine':platform.machine()},'rounds':9,'iterations_per_sample':1,'order_seed':20261026,'memory_measured':False,'workloads':{},'qualification':'Integer-lattice generated inputs only. Not Jolt, Bevy, GPU, continuous collision, real physics or application acceptance.'}
for name,items in workloads.items():
 reference=brute_force(items);candidate,info=indexed(items)
 assert reference==candidate
 timings={'brute_force':[],'grid':[]};orders=[]
 for round_id in range(9):
  order=list(timings);rng.shuffle(order);orders.append(order[:])
  for method in order:
   start=time.perf_counter_ns();result=brute_force(items) if method=='brute_force' else indexed(items)[0];duration=(time.perf_counter_ns()-start)/1e6
   assert result==reference
   timings[method].append(duration)
 report['workloads'][name]={'count':len(items),'result_count':len(reference),'result_sha256':hashlib.sha256(json.dumps(reference,separators=(',',':')).encode()).hexdigest(),'input_sha256':hashlib.sha256(json.dumps([vars(c) for c in items],sort_keys=True,separators=(',',':')).encode()).hexdigest(),'grid_info':info,'round_orders':orders,'timings_ms':timings,'median_ms':{m:statistics.median(v) for m,v in timings.items()}}
print(json.dumps(report,indent=2))
