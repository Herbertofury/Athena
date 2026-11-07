import {readFileSync} from 'node:fs';
import {validateFixture as baseline} from './baseline-media-core.mjs';
import {validateFixture as current} from '../../docs/media-lab/media-core.mjs';
const original=JSON.parse(readFileSync(new URL('../../docs/media-lab/public-fixtures.json',import.meta.url)));
const mutations=[
 ['wrong source video',c=>c.source='https://www.youtube.com/watch?v=aaaaaaaaaaa'],
 ['duplicate source ID',c=>c.source+='&v=aaaaaaaaaaa'],
 ['wrong card identity',c=>c.id='youtube:aaaaaaaaaaa'],
 ['wrong player video',c=>c.videos[0].id='aaaaaaaaaaa'],
 ['wrong cover video',c=>c.cover='https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg'],
 ['unreviewed source route',c=>c.source='https://www.youtube.com/channel/M7lc1UVf-VE'],
 ['empty player list',c=>c.videos=[]],
 ['multiple unrelated players',c=>c.videos.push({kind:'youtube',id:'aaaaaaaaaaa'})],
 ['unrelated gallery thumbnail',c=>c.gallery=[{preview:'https://i.ytimg.com/vi/aaaaaaaaaaa/default.jpg',original:'https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg'}]],
];
const rows=mutations.map(([name,mutate])=>{const x=structuredClone(original);mutate(x.cards.find(c=>c.provider==='YouTube'));let old=true,now=true;try{baseline(x);}catch{old=false;}try{current(x);}catch{now=false;}return {case:name,baseline_accepted:old,current_accepted:now};});
console.log(JSON.stringify({fixture_mode:'generated identity mutations of retained public card; no provider requests',cases:rows},null,2));
