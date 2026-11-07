"""Fail-closed receipt validation shared by runner and adversarial tests."""
import math,re
FIELDS={'schema_version','mode','count','metadata_bytes','serialized_bytes','sha256','complete_output_equal','prepare_ms','prepare_and_verify_ms','peak_rss_kib','encoding_buffer_bytes'}
def require(value,message):
 if not value:raise ValueError(message)
def validate(v,mode,count,size):
 require(isinstance(v,dict) and set(v)==FIELDS,'Unexpected receipt fields')
 require(type(v.get('schema_version')) is int and v['schema_version']==1 and v.get('mode')==mode and type(v.get('count')) is int and v['count']==count and type(v.get('metadata_bytes')) is int and v['metadata_bytes']==size,'Receipt identity')
 require(v.get('complete_output_equal') is True,'Incomplete output')
 require(isinstance(v.get('sha256'),str) and re.fullmatch('[0-9a-f]{64}',v['sha256']),'Digest shape')
 for k in ['serialized_bytes','peak_rss_kib','encoding_buffer_bytes']:require(type(v.get(k)) is int and v[k]>0,'Invalid integer '+k)
 for k in ['prepare_ms','prepare_and_verify_ms']:require(type(v.get(k)) in (float,int) and math.isfinite(v[k]) and v[k]>0,'Invalid timing '+k)
 require(v['prepare_and_verify_ms']>=v['prepare_ms'],'Reversed timings')
 require(count*size<=v['serialized_bytes']<=v['encoding_buffer_bytes']<=count*size+count*1024+2,'Allocation binding')
 require(v['encoding_buffer_bytes']==(v['serialized_bytes'] if mode=='baseline' else count*size+count*1024+2),'Lane allocation mismatch')
 return v
