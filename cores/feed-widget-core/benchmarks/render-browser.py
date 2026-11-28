"""Measure initial reader batches on an explicit local catalog and digest.

This is an isolated browser scaling check, not a machine-independent CI gate or
a claim about field performance. No publisher URL is requested.
"""
import argparse
import hashlib
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--catalog',type=Path,required=True)
parser.add_argument('--digest',type=Path,required=True)
parser.add_argument('--cores',type=Path,default=Path(__file__).resolve().parents[2])
parser.add_argument('--browser')
parser.add_argument('--output',type=Path)
args=parser.parse_args()
data={'catalog':json.loads(args.catalog.read_text()),'digest':json.loads(args.digest.read_text())}
if not data['digest'].get('items'):raise SystemExit('The benchmark needs a nonempty valid digest.')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=args.browser,args=['--no-sandbox'])
 c=b.new_context(viewport={'width':1280,'height':900},reduced_motion='reduce');c.set_offline(True)
 page=c.new_page();page.set_content('<main id="host"></main>')
 page.add_style_tag(path=str(args.cores/'feed-widget-core/feed-widget-core.css'))
 for name in ['feed-core','ticker-core','content-extraction-core','feed-generation-core','visual-editor-core','feed-widget-core']:
  page.add_script_tag(path=str(args.cores/name/(name+'.js')))
 result=page.evaluate('''data => {
  const reader=FeedWidgetCore.createReader({storageNamespace:'measurement'}),host=document.querySelector('#host'),samples=[];
  for(const count of [166,600])for(let run=0;run<5;run++){
   const items=Array.from({length:count},(_,i)=>{const base=data.digest.items[i%data.digest.items.length];return {...base,id:'measurement-'+i,url:new URL('/acceptance-fixture/'+i,base.url).href};});
   const input={catalog:data.catalog,digest:{...data.digest,generatedAt:new Date(Date.now()+samples.length*1000).toISOString(),items}};
   const start=performance.now();reader.mount(host,input);host.getBoundingClientRect();const mountMs=performance.now()-start;
   const search=document.querySelector('#news-article-search');search.value='never-matches-the-fixture';let tick=performance.now();search.dispatchEvent(new Event('input',{bubbles:true}));host.getBoundingClientRect();const filterMs=performance.now()-tick;
   search.value='';tick=performance.now();search.dispatchEvent(new Event('input',{bubbles:true}));host.getBoundingClientRect();const restoreMs=performance.now()-tick;
   samples.push({count,run,mountMs,filterMs,restoreMs,rendered:document.querySelectorAll('[data-news-item]').length,domElements:document.querySelectorAll('*').length});
  }reader.dispose();return samples;
 }''',data)
 receipt={'schemaVersion':1,'browserVersion':b.version,'viewport':{'width':1280,'height':900},'reducedMotion':True,'offline':True,'catalogSha256':hashlib.sha256(args.catalog.read_bytes()).hexdigest(),'digestSha256':hashlib.sha256(args.digest.read_bytes()).hexdigest(),'readerSha256':hashlib.sha256((args.cores/'feed-widget-core/feed-widget-core.js').read_bytes()).hexdigest(),'measurements':result}
 output=json.dumps(receipt,indent=2)+'\n'
 if args.output:args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(output)
 print(output);b.close()
