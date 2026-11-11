// Original tiny animated triangle, not a third-party asset or target-game fixture.
export function original() {
  const bytes = Buffer.alloc(76);
  [0,0,0, 1,0,0, 0,1,0].forEach((v,i) => bytes.writeFloatLE(v, i*4));
  [0,1,2].forEach((v,i) => bytes.writeUInt16LE(v, 36+i*2));
  [0,1].forEach((v,i) => bytes.writeFloatLE(v, 44+i*4));
  [0,0,0, 1,0,0].forEach((v,i) => bytes.writeFloatLE(v, 52+i*4));
  return {document: {
    asset: {version:'2.0', generator:'Athena original validation fixture'}, scene:0,
    scenes:[{nodes:[0]}], nodes:[{name:'OriginalTriangle', mesh:0}],
    meshes:[{primitives:[{attributes:{POSITION:0}, indices:1, mode:4}]}],
    buffers:[{uri:'scene.bin', byteLength:76}],
    bufferViews:[{buffer:0, byteOffset:0, byteLength:36, target:34962}, {buffer:0, byteOffset:36, byteLength:6, target:34963}, {buffer:0, byteOffset:44, byteLength:8}, {buffer:0, byteOffset:52, byteLength:24}],
    accessors:[{bufferView:0, componentType:5126, count:3, type:'VEC3', min:[0,0,0], max:[1,1,0]}, {bufferView:1, componentType:5123, count:3, type:'SCALAR', min:[0], max:[2]}, {bufferView:2, componentType:5126, count:2, type:'SCALAR', min:[0], max:[1]}, {bufferView:3, componentType:5126, count:2, type:'VEC3'}],
    animations:[{name:'Move', samplers:[{input:2, output:3, interpolation:'LINEAR'}], channels:[{sampler:0, target:{node:0, path:'translation'}}]}]
  }, resources:{'scene.bin':bytes.toString('hex')}};
}
export function buildCases() {
  const cases=[];
  function add(id, change, errors, codes=[], readResources=true, truncated=false, fixtureGate=false) {
    const f=original();change(f);
    cases.push({id, ...f, read_resources:readResources, max_issues:truncated?1:128, expected:{num_errors:errors, issue_codes:codes, is_truncated:truncated, fixture_gate:fixtureGate}});
  }
  function alter(f, fn) { const b=Buffer.from(f.resources['scene.bin'],'hex');fn(b);f.resources['scene.bin']=b.toString('hex'); }
  function badIndex(f) { alter(f,b=>b.writeUInt16LE(3,40));f.document.accessors[1].max=[3]; }
  function duplicateTime(f) { alter(f,b=>b.writeFloatLE(0,48));f.document.accessors[2].max=[0]; }
  add('valid_linear',()=>{},0,[],true,false,true);
  add('changed_motion',f=>alter(f,b=>b.writeFloatLE(4,64)),0);
  add('animation_removed',f=>{delete f.document.animations;f.document.accessors=f.document.accessors.slice(0,2);f.document.bufferViews=f.document.bufferViews.slice(0,2);f.document.buffers[0].byteLength=44;f.resources['scene.bin']=f.resources['scene.bin'].slice(0,88);},0);
  add('bad_index',badIndex,1,['ACCESSOR_INDEX_OOB']);
  add('bad_index_unchecked',badIndex,1,['IO_ERROR'],false);
  add('duplicate_time',duplicateTime,1,['ACCESSOR_ANIMATION_INPUT_NON_INCREASING']);
  add('matrix_animation',f=>{f.document.nodes[0].matrix=[1,0,0,0,0,1,0,0,0,0,1,0,2,0,0,1];},1,['ANIMATION_CHANNEL_TARGET_NODE_MATRIX']);
  add('unknown_required',f=>{f.document.extensionsUsed=['ATLAS_unrecognized'];f.document.extensionsRequired=['ATLAS_unrecognized'];f.document.extensions={ATLAS_unrecognized:{meaning:'Original unsupported extension control'}};},0,['UNSUPPORTED_EXTENSION']);
  add('missing_external',f=>{f.resources={};},1,['IO_ERROR']);
  add('truncated_report',f=>{badIndex(f);duplicateTime(f);},1,['ACCESSOR_INDEX_OOB'],true,true);
  return cases;
}
