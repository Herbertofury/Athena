import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {parseHTML} from 'linkedom';

const read = name => readFileSync(new URL('../apps/atlas-lab/ui/learning-history.'+name,import.meta.url),'utf8');
test('narrow Learning keeps reopened evidence ahead of the loaded list in DOM and grid order',()=>{
  const {document}=parseHTML(read('html'));
  const layout=document.querySelector('main .layout');
  assert.equal(layout.firstElementChild.id,'detail');
  assert.equal(layout.firstElementChild.getAttribute('aria-label'),'Selected evidence');
  assert.ok(layout.firstElementChild.getAttribute('aria-live'));
  assert.ok(layout.lastElementChild.querySelector('#history-search'));
  assert.ok(layout.lastElementChild.querySelector('#more'));
  const css=read('css');
  assert.match(css,/\.learning-history-layout\s*\{\s*grid-template-areas:\s*"recorded evidence"/);
  assert.match(css,/@media \(max-width: 760px\)\s*\{\s*\.learning-history-layout\s*\{\s*grid-template-areas:\s*"evidence"\s*"recorded"/);
});
