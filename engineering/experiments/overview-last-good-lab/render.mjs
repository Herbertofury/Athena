import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {mount} from '../job-identity-lab/render-harness.mjs';
import * as input from '../../apps/atlas-lab/ui/collection-input.mjs';
const dir=process.argv[2];
const source=readFileSync(join(dir,'served-app.js'),'utf8').replace(/^import .*;\n/gm,'');
const data=name=>JSON.parse(readFileSync(join(dir,name+'.json'),'utf8'));
const app=mount(source,input);app.render(data('good'));
const nodes=[...app.get('jobs').children],metrics=()=>['pending','completed','failed'].map(id=>app.get(id).textContent),before=metrics();
let error;try{app.render(data('malformed'));}catch(e){error=String(e);}
const retainedCards=app.get('jobs').children.every((node,i)=>node===nodes[i])&&app.get('jobs').children.length===nodes.length;
const retainedMetrics=JSON.stringify(before)===JSON.stringify(metrics());
app.render(data('recovered'));const recovered=app.get('jobs').textContent;
const receipt={scope:'Actual HTTP responses and served application in controlled DOM, not native browser',preparationError:error,retainedCards,retainedMetrics,recoveredCorrect:recovered.includes('VERIFIED NEXT RESULT')&&!recovered.includes('UNCOMMITTED RESULT'),cardCount:app.get('jobs').children.length};
writeFileSync(join(dir,'render-receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
