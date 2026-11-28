const test=require('node:test');
const assert=require('node:assert/strict');
const Editor=require('../visual-editor-core');
const Feed=require('../../feed-core/feed-core');
const initial={id:'work',name:'Work',widgets:[{id:'one',title:'Updates',view:'list',limit:12,span:1},{id:'two',title:'Security',query:'patch',view:'gallery',limit:24,span:2},{id:'three',title:'Reading',sourceIds:['a','b']}]};

test('drag and keyboard reorder preserve stable IDs, filters and input immutability',()=>{
  const moved=Editor.moveWidget(initial,'one',2);
  assert.deepEqual(moved.widgets.map(w=>w.id),['two','three','one']);assert.deepEqual(initial.widgets.map(w=>w.id),['one','two','three']);
  assert.equal(moved.widgets[0].query,'patch');assert.equal(moved.widgets[0].span,2);
  assert.deepEqual(Editor.moveWidget(moved,'one',-100).widgets.map(w=>w.id),['one','two','three']);
  assert.equal(Editor.moveWidget(initial,'missing',1).widgets.length,3);
});
test('edits, duplicate IDs and deletion cannot corrupt neighboring widgets',()=>{
  const edited=Editor.updateWidget(initial,'two',{id:'renamed',limit:200,span:8,view:'script',query:'kernel',html:'<script>bad</script>'});
  assert.equal(edited.widgets[1].id,'two');assert.equal(edited.widgets[1].limit,100);assert.equal(edited.widgets[1].span,2);assert.equal(edited.widgets[1].view,'gallery');assert.equal(edited.widgets[1].html,undefined);
  assert.equal(Editor.addWidget(edited,{id:'one',title:'Duplicate'}).widgets.length,3);
  assert.deepEqual(Editor.deleteWidget(edited,'two').widgets.map(w=>w.id),['one','three']);
  assert.deepEqual(Editor.normalizeDashboard({id:'empty',name:'Empty'}).widgets,[]);
});
test('workspace preferences preserve dashboards and active selection while display presets exclude them',()=>{
  const prefs=Feed.importPreferences(Feed.exportPreferences({dashboards:[initial],activeDashboardId:'work',presets:[{id:'p',name:'Look',settings:{dashboards:[initial],activeDashboardId:'work'}}]}));
  assert.equal(prefs.activeDashboardId,'work');assert.equal(prefs.dashboards[0].widgets[1].query,'patch');
  assert.equal(prefs.presets[0].settings.dashboards,undefined);assert.equal(prefs.presets[0].settings.activeDashboardId,undefined);
});
