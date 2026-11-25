// SPDX-License-Identifier: GPL-3.0-or-later
import {WORLD_W,WORLD_H,ROAD_NODES,DISTRICTS,BUILDINGS,BUILDING_SIGN_TEXT,SAFEHOUSES,INTERIORS,buildRoadGraph} from './city-source.mjs';

const graph=buildRoadGraph(ROAD_NODES);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const point=(x,y)=>({x,y});
function within(x,y,rect){return x>=rect.x&&y>=rect.y&&x<=rect.x+rect.w&&y<=rect.y+rect.h;}
function validatePoint(x,y,w=WORLD_W,h=WORLD_H){
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>w||y>h)throw RangeError('Point outside authored world bounds');
}

export function cityCatalog(){
 return structuredClone({width:WORLD_W,height:WORLD_H,roadNodes:ROAD_NODES,
  roads:[...graph.entries()],districts:DISTRICTS,buildings:BUILDINGS,signs:BUILDING_SIGN_TEXT,
  safehouses:SAFEHOUSES,interiors:INTERIORS});
}

export function inspectWorldPoint(x,y){
 validatePoint(x,y);
 const p=point(x,y);
 let nearest=0,best=Infinity;
 for(const [i,node] of ROAD_NODES.entries()){
  const d=distance(node,p);if(d<best){nearest=i;best=d;}
 }
 return {nearestRoadNode:nearest,distanceToRoadNode:best,districts:DISTRICTS.filter(r=>within(x,y,r)).map(r=>r.id),
   buildings:BUILDINGS.filter(r=>within(x,y,r)).map(r=>r.id),
   doors:INTERIORS.filter(v=>distance(v.outsideDoor,p)<=v.outsideDoor.r).map(v=>v.id),
   safehouses:SAFEHOUSES.filter(v=>distance(v,p)<=v.radius).map(v=>v.id)};
}

export function planRoadRoute(start,end){
 if(!graph.has(start)||!graph.has(end))throw RangeError('Unknown road node');
 const best=new Map([[start,0]]),previous=new Map(),remaining=new Set(graph.keys());
 while(remaining.size){
  let id=null,cost=Infinity;
  for(const i of remaining){const next=best.get(i)??Infinity;if(next<cost){id=i;cost=next;}}
  if(id===null)return null;
  if(id===end){
   const nodes=[];while(id!==undefined){nodes.push(id);id=previous.get(id);}nodes.reverse();
   return {nodes,distance:cost};
  }
  remaining.delete(id);
  for(const neighbor of graph.get(id)){
   if(!remaining.has(neighbor))continue;
   const next=cost+distance(ROAD_NODES[id],ROAD_NODES[neighbor]);
   if(next<(best.get(neighbor)??Infinity)){best.set(neighbor,next);previous.set(neighbor,id);}
  }
 }
 return null;
}

// A bounded white-box traversal rehearsal, not a physics or player-save implementation.
export function createDoorVisit(){
 let visited=null,origin=null;
 return Object.freeze({
  enter(id,x,y){
   if(visited)throw Error('Exit the current interior first');
   if(!inspectWorldPoint(x,y).doors.includes(id))throw RangeError('Point is not at that authored door');
   visited=INTERIORS.find(v=>v.id===id);origin=point(x,y);
   return {interior:id,position:{...visited.insideSpawn}};
  },
  exit(x,y){
   if(!visited)throw Error('No active interior');
   validatePoint(x,y,visited.w,visited.h);
   if(!within(x,y,visited.exitZone))throw RangeError('Point is not in the authored exit zone');
   const position={...origin};visited=origin=null;
   return {interior:null,position};
  }
 });
}
