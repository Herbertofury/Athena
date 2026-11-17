"""Explicit public GitHub research, never implicit transmission of project context."""
import argparse, hashlib, json, re, time
from datetime import datetime, timezone
from http.client import HTTPException
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import HTTPRedirectHandler, Request, build_opener
from check_software_links import classify

MAX_BYTES=1_000_000
API='https://api.github.com'
LIMITATIONS=['Public GitHub metadata only, not source-code inspection or proof of superiority.',
 'License metadata is not a reuse authorization; review the exact license and compatibility.',
 'Latest release means the GitHub latest-release endpoint, not every tag/prerelease or newest commit.',
 'No credentials, private-project reads, installations or automatic adoption.',
 '30-second request-admission budget and per-request socket timeout; not a hard whole-process deadline.']
def repo_id(value):
 if not isinstance(value,str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9-]{0,38}/[A-Za-z0-9_.-]{1,100}',value) or value.split('/')[1] in {'.','..'}:raise ValueError('Use a public owner/repository ID, not a URL or path')
 return value
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None

def fetch_json(path,timeout):
 if not path.startswith('/repos/') and not path.startswith('/search/repositories?'):raise ValueError('Unsupported API route')
 url=API+path
 try:
  request=Request(url,headers={'Accept':'application/vnd.github+json','User-Agent':'AthenaChallengerReview/1.0','X-GitHub-Api-Version':'2022-11-28'})
  with build_opener(NoRedirect()).open(request,timeout=timeout) as response:
   raw=response.read(MAX_BYTES+1)
   if len(raw)>MAX_BYTES:return {'status':response.status,'outcome':'response_budget_exceeded'}
   try:data=json.loads(raw.decode('utf-8'))
   except (ValueError,UnicodeError):return {'status':response.status,'outcome':'invalid_json'}
   return {'status':response.status,'outcome':'observed','sha256':hashlib.sha256(raw).hexdigest(),'data':data}
 except HTTPError as error:return {'status':error.code,'outcome':classify(error.code)}
 except (URLError,TimeoutError,OSError,HTTPException):return {'status':None,'outcome':'transport_unavailable'}

def refresh(repositories=(),public_query=None,transport=fetch_json,budget_seconds=30,clock=time.monotonic):
 ids=list(dict.fromkeys(repo_id(x) for x in repositories))
 if len(ids)>3:raise ValueError('Select at most three public repositories per pass')
 if public_query is not None:
  if ids or not isinstance(public_query,str) or not public_query.strip() or len(public_query)>120 or any(ord(c)<32 for c in public_query):raise ValueError('Use either repository IDs or one explicit public query (1–120 characters)')
  # The fixed visibility qualifier cannot be negated by accepting query operators.
  if ':' in public_query:raise ValueError('Use public search words, not query operators')
 if not ids and public_query is None:raise ValueError('Select repositories or a public query')
 if not 0<budget_seconds<=30:raise ValueError('Budget must be between 0 and 30 seconds')
 start=clock();evidence=[];records=[]
 def request(path):
  remaining=budget_seconds-(clock()-start)
  if remaining<=0:return {'outcome':'time_budget_exhausted','data':None}
  result=transport(path,min(5,remaining));observation={k:v for k,v in result.items() if k!='data'}
  observation.update(source=API+path,checked_at=datetime.now(timezone.utc).isoformat());evidence.append(observation)
  return result
 if public_query is not None:
  path='/search/repositories?q='+quote(public_query.strip()+' is:public',safe='')+'&per_page=3&sort=updated&order=desc'
  result=request(path);data=result.get('data')
  search_outcome=result.get('outcome')
  if search_outcome=='observed':
   if not isinstance(data,dict) or not isinstance(data.get('items'),list):search_outcome='invalid_response'
   else:
    for item in data['items'][:3]:
     try:
      if not isinstance(item,dict) or item.get('private') is not False:raise ValueError('Invalid public search item')
      identity=repo_id(item.get('full_name'))
      if identity not in ids:ids.append(identity)
     except ValueError:search_outcome='invalid_response'
  search={'query':public_query,'outcome':search_outcome,'total_count':data.get('total_count') if isinstance(data,dict) and isinstance(data.get('total_count'),int) else None,'incomplete':data.get('incomplete_results') if isinstance(data,dict) and isinstance(data.get('incomplete_results'),bool) else None,'scope':'First three updated public search results, not comprehensive or ranked quality.'}
 else:search=None
 for identity in ids:
  record={'repository':identity,'status':'unverified','commit':None,'license':None,'release':None};records.append(record)
  prefix='/repos/'+identity;meta=request(prefix);data=meta.get('data')
  if meta.get('outcome')!='observed' or not isinstance(data,dict) or data.get('private') is not False or str(data.get('full_name','')).lower()!=identity.lower():
   record['status']=meta.get('outcome') if meta.get('outcome')!='observed' else 'identity_or_visibility_mismatch';continue
  record.update(status='metadata_observed',source='https://github.com/'+identity,archived=data.get('archived'),default_branch=data.get('default_branch'),pushed_at=data.get('pushed_at'))
  branch=data.get('default_branch')
  if isinstance(branch,str) and 0<len(branch)<=255:
   commit=request(prefix+'/commits/'+quote(branch,safe=''));value=commit.get('data');sha=value.get('sha') if isinstance(value,dict) else None
   if commit.get('outcome')=='observed' and isinstance(sha,str) and re.fullmatch('[0-9a-f]{40}',sha):
    record['commit']={'sha':sha,'source':'https://github.com/'+identity+'/commit/'+sha}
    license_result=request(prefix+'/license?ref='+sha);license_data=license_result.get('data')
    if license_result.get('outcome')=='observed' and isinstance(license_data,dict):
     detected=license_data.get('license');detected=detected if isinstance(detected,dict) else {};record['license']={'spdx_id':detected.get('spdx_id'),'name':detected.get('name'),'blob_sha':license_data.get('sha'),'ref':sha,'source':API+prefix+'/license?ref='+sha,'reuse_decision':'unreviewed'}
  release=request(prefix+'/releases/latest');value=release.get('data')
  if release.get('outcome')=='observed' and isinstance(value,dict):record['release']={'tag':value.get('tag_name'),'published_at':value.get('published_at'),'draft':value.get('draft'),'prerelease':value.get('prerelease'),'source':API+prefix+'/releases/latest'}
 return {'schema':1,'kind':'athena-public-challenger-source-review','search':search,'repositories':records,'evidence':evidence,'limitations':LIMITATIONS,'requests':len(evidence),'elapsed_seconds':clock()-start}

def main():
 parser=argparse.ArgumentParser(description=__doc__);group=parser.add_mutually_exclusive_group(required=True);group.add_argument('--repo',action='append');group.add_argument('--public-query');parser.add_argument('--output',required=True);parser.add_argument('--refresh',action='store_true',help='Explicitly send only selected public IDs/query to GitHub without credentials')
 args=parser.parse_args()
 if not args.refresh:parser.error('--refresh is required for network research')
 path=Path(args.output)
 if path.exists() or path.is_symlink():parser.error('Output already exists; choose a new receipt path')
 try:
  result=refresh(args.repo or (),args.public_query)
  with path.open('x',encoding='utf-8') as handle:json.dump(result,handle,indent=2,ensure_ascii=False);handle.write('\n')
 except (ValueError,OSError) as error:parser.exit(2,'Review could not complete: '+str(error)+'\n')
 print('Wrote public source-review receipt; inspect unknowns and limitations before adoption.')
if __name__=='__main__':main()
