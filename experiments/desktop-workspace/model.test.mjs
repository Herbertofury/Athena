import test from 'node:test';
import assert from 'node:assert/strict';
import {desktopSession} from './model.mjs';
test('preview is off by default and arbitrary activity IDs never open',()=>{
  const m=desktopSession(['projects','note'],{enabled:'true',pins:['note','note','unknown']});
  assert.deepEqual(m.preferences(),{enabled:false,pins:['note']});
  assert.equal(m.open('note'),false);
  m.setEnabled(true);assert.equal(m.activate('external process'),false);assert.equal(m.state().windows.length,0);
});
test('switch, minimize, restore and close preserve only current supported windows',()=>{
  const m=desktopSession(['projects','note']);m.setEnabled(true);
  m.open('note');m.open('projects');m.minimize('note');m.toggleDesktop();
  assert.equal(m.state().active,null);m.toggleDesktop();
  assert.equal(m.state().active,'projects');assert.equal(m.state().windows[0].minimized,true);
  m.activate('note');assert.equal(m.state().active,'note');
  m.close('note');assert.equal(m.state().active,'projects');assert.equal(m.state().windows.length,1);
});
test('pin order is distinct from windows and survives turning the feature off',()=>{
  const m=desktopSession(['p','n','s']);m.setEnabled(true);
  m.open('s');assert.equal(m.movePin('s',-1),false);m.togglePin('s');m.movePin('s',-1);m.setEnabled(false);
  assert.deepEqual(m.preferences(),{enabled:false,pins:['p','s','n']});assert.equal(m.close('s'),false);
});
