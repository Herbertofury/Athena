/* visual-editor-core 0.1.0 — immutable feed-dashboard layout operations. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('../feed-core/feed-core.js'):root.FeedCore);
  if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VisualEditorCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Feed){
  'use strict';
  if(!Feed)throw new Error('visual-editor-core requires feed-core.');
  const VERSION='0.1.0',normalizeDashboard=Feed.normalizeDashboard;
  function moveWidget(dashboard,id,targetIndex){
    const result=normalizeDashboard(dashboard),index=result.widgets.findIndex(w=>w.id===id);
    if(index<0||!Number.isFinite(Number(targetIndex)))return result;
    const [widget]=result.widgets.splice(index,1);
    result.widgets.splice(Math.min(result.widgets.length,Math.max(0,Math.trunc(Number(targetIndex)))),0,widget);return result;
  }
  function updateWidget(dashboard,id,patch={}){
    const current=normalizeDashboard(dashboard);
    return normalizeDashboard({...current,widgets:current.widgets.map(w=>w.id===id?{...w,...patch,id:w.id}:w)});
  }
  function deleteWidget(dashboard,id){const result=normalizeDashboard(dashboard);result.widgets=result.widgets.filter(w=>w.id!==id);return result;}
  function addWidget(dashboard,widget){const current=normalizeDashboard(dashboard);return normalizeDashboard({...current,widgets:[...current.widgets,widget]});}
  return Object.freeze({VERSION,normalizeDashboard,moveWidget,updateWidget,deleteWidget,addWidget});
});
