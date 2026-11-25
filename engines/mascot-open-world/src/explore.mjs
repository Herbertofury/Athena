// SPDX-License-Identifier: GPL-3.0-or-later
import {cityCatalog,inspectWorldPoint,planRoadRoute,createDoorVisit} from './city.mjs';

try{
 const [mode='map',...args]=process.argv.slice(2);
 const map=cityCatalog();
 const number=value=>{if(typeof value!=='string'||!value.trim())throw Error('Expected a number');return Number(value);};
 let result;
 if(mode==='map'&&!args.length){
  result={dimensions:[map.width,map.height],
    districts:map.districts.map(({id,name})=>({id,name})),
    streets:map.roadNodes.length,
    connections:map.roads.reduce((n,[,neighbors])=>n+neighbors.length,0)/2,
    visitable:map.interiors.map(({id,name,outsideDoor})=>({id,name,outsideDoor}))};
 }else if(mode==='route'&&args.length===2){
  result=planRoadRoute(number(args[0]),number(args[1]));
 }else if(mode==='point'&&args.length===2){
  result=inspectWorldPoint(number(args[0]),number(args[1]));
 }else if(mode==='tour'&&args.length===1){
  const room=map.interiors.find(({id})=>id===args[0]);
  if(!room)throw Error('Unknown authored room; run map to list rooms');
  const visit=createDoorVisit(),{x,y}=room.outsideDoor,z=room.exitZone;
  result={name:room.name,approach:{x,y},entered:visit.enter(room.id,x,y),
    exited:visit.exit(z.x+z.w/2,z.y+z.h/2)};
 }else throw Error('Usage: node explore.mjs [map | route FROM TO | point X Y | tour ROOM]');
 console.log(JSON.stringify(result,null,2));
}catch(error){console.error(error.message);process.exitCode=2;}
