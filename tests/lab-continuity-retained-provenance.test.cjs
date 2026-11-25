const {test} = require('node:test');
const assert = require('node:assert/strict');
const {parseHTML} = require('linkedom');
const {createHash, webcrypto} = require('node:crypto');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const packageDir = resolve(process.env.ATHENA_PROVENANCE_PREVIEW || resolve(__dirname, '../dist'));
const workspace = name => import(pathToFileURL(resolve(packageDir, 'workspaces', name)).href);
const sha = text => createHash('sha256').update(text).digest('hex');

test('Athena inspects the reviewed source and its retained archive without adopting the latest observation', async () => {
  const id = 'AANobbMI';
  const generation = '9007199254740993';
  const reviewedURL = 'https://modrinth.com/mod/receipt-fixture/version/reviewed?object=1#evidence';
  const latestURL = 'https://modrinth.com/mod/receipt-fixture/version/unreviewed?object=2#evidence';
  // These are synthetic old and new provider records, not fetched provider data.
  const archived = '{"id":"AANobbMI","title":"Atlas migration fixture","release":"'+reviewedURL+'","large":18446744073709551617}';
  const newest = '{"id":"AANobbMI","release":"'+latestURL+'"}';
  const receipt = {
    schema_version:1, status:'complete_received_response', canonical_id:id, generation,
    payload_bytes:Buffer.byteLength(archived), payload_sha256:sha(archived),
  };
  const archivedPath = '/api/project-archive/'+id+'/'+generation;
  const jobs = [{
    id:7, id_text:'7', state:'succeeded', attempt:1, job:{CollectModrinthRaw:{project:'receipt-fixture'}},
    result:{project_archive:receipt},
  }];
  const {document} = parseHTML('<html><body><section id="continuity"></section><section id="lab"></section></body></html>');
  const requests = [], writes = [];
  const original = new Map();
  const fakeFetch = async (url, options={}) => {
    url = String(url);
    const method = options.method || 'GET';
    requests.push({url, method});
    if (method!=='GET') throw Error('Receipt verification must not write');
    if (url==='/api/runtime') return Response.json({
      application:'Athena', api_version:1, loopback_only:true, same_origin_only:true,
      runtime_manifest_sha256:'a'.repeat(64),
    });
    if (url==='/api/overview') return Response.json({jobs,counts:{succeeded:1},worker_status:'running'},{
      headers:{'x-atlas-engine-instance':'a'.repeat(32)},
    });
    if (url===archivedPath || url==='/api/project-archive/'+id) {
      const [bytes,selected] = url===archivedPath ? [archived,generation] : [newest,'9007199254740994'];
      return new Response(bytes,{headers:{
        'content-type':'application/json', 'x-atlas-archive-kind':'project', 'x-atlas-canonical-id':id,
        'x-atlas-generation':selected, 'x-atlas-payload-sha256':sha(bytes),
      }});
    }
    throw Error('Unexpected provider, write or additional API request');
  };
  for (const [key,value] of Object.entries({document,location:new URL('http://127.0.0.1:41379/#lab'),fetch:fakeFetch,crypto:webcrypto})) {
    original.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
    Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  }
  const select = Object.getPrototypeOf(document.createElement('select'));
  const selectValue = Object.getOwnPropertyDescriptor(select,'value');
  // Normalize browser selection semantics for the existing Linkedom harness.
  Object.defineProperty(select,'value',{configurable:true,get(){return this._value||'';},set(v){this._value=v;}});
  let continuity, lab;
  try {
    const [model,continuityModule,labModule] = await Promise.all([
      workspace('continuity/model.mjs'), workspace('continuity/index.mjs'), workspace('engineering/lab/index.mjs'),
    ]);
    const events = [
      {type:'add',id:'migration',project:'Athena Atlas migration',kind:'decision',text:'Reviewed project archive generation '+generation,source:''},
      {type:'add',id:'atlas-record',project:'Retained Atlas catalog',kind:'resource',text:'Project response '+id,source:reviewedURL},
      {type:'link',id:'migration',dependencyId:'atlas-record'},
      {type:'revise',id:'atlas-record',text:'Later source observation, not reviewed',source:latestURL},
      {type:'ignore',id:'atlas-record'},
    ];
    const state = events.reduce((saved,event,index)=>model.apply(saved,event,index+1),model.fresh());
    const initial = structuredClone(state);
    const notes = document.getElementById('continuity');
    continuity = continuityModule.mount({container:notes,state,setState(...args){writes.push(args);return true;}});
    const dep = notes.shadowRoot.querySelector('[data-entry-id="migration"] .dependency');
    const a = dep.querySelector('details a');
    assert.equal(a?.getAttribute('href'),reviewedURL,'Continuity opens only the exact reviewed source, not the newest one');
    assert.equal(dep.querySelector(`a[href="${latestURL}"]`),null);
    dep.querySelector('details').open = true;
    assert.equal(requests.length,0,'inspecting Continuity did not fetch a provider or API');
    const host = document.getElementById('lab');
    lab = await labModule.mount({container:host});
    const view = host.shadowRoot;
    const dialog = view.getElementById('saved-archive-dialog');
    dialog.showModal = function(){ this.open=true; };
    dialog.close = function(){ this.open=false; };
    const action = view.querySelector('[data-project-archive-review]');
    assert.ok(action,'Lab Overview exposes exact retained archive review');
    assert.ok(action.textContent.includes(generation));
    assert.deepEqual(requests.map(x=>x.url),['/api/runtime','/api/overview']);
    action.click();
    const deadline = performance.now()+3000;
    while (!dialog.open && performance.now()<deadline) await new Promise(done=>setTimeout(done,5));
    assert.equal(dialog.open,true);
    const body = view.getElementById('saved-archive-text');
    assert.equal(body.textContent,archived);
    assert.ok(body.textContent.includes(a.getAttribute('href')),'archive provenance matches the actual reviewed link');
    assert.equal(body.children.length,0);
    assert.match(view.getElementById('saved-archive-meta').textContent,new RegExp(receipt.payload_sha256));
    assert.deepEqual(requests.filter(x=>x.url.includes('-archive/')), [{url:archivedPath,method:'GET'}]);
    assert.ok(requests.every(x=>x.method==='GET'&&['/api/runtime','/api/overview',archivedPath].includes(x.url)));
    assert.deepEqual(writes,[]);
    assert.deepEqual(state,initial);
  } finally {
    lab?.unmount();continuity?.unmount();
    if(selectValue)Object.defineProperty(select,'value',selectValue);else delete select.value;
    for(const [key,descriptor] of original) {
      if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
    }
  }
});
