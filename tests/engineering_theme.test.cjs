// Fast palette/selector guards supplement the real Chromium computed-style tests.
// They are not a substitute for browser rendering, opacity or visual acceptance.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function stylesheet(kind){const source=fs.readFileSync(path.join(__dirname,'../dist/workspaces/engineering',kind,'index.mjs'),'utf8');const encoded=source.match(/root\.innerHTML=("(?:\\.|[^"\\])*");setTheme/);assert.ok(encoded,'Generated static workspace markup');return JSON.parse(encoded[1]).split('<style>')[1].split('</style>')[0];}
function rule(css,selector){let found;for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){if(match[1].trim().split(',').map(s=>s.trim()).includes(selector))found=Object.fromEntries(match[2].split(';').filter(Boolean).map(x=>{const i=x.indexOf(':');return[x.slice(0,i).trim(),x.slice(i+1).trim()];}));}assert.ok(found,selector+' rule exists');return found;}
function luminance(hex){assert.match(hex,/^#[a-f0-9]{3}(?:[a-f0-9]{3})?$/i);if(hex.length===4)hex='#'+[...hex.slice(1)].map(x=>x+x).join('');const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function contrast(fg,bg){const a=luminance(fg),b=luminance(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
function checkPairs(tokens,pairs){for(const[label,fg,bg]of pairs){const ratio=contrast(tokens[fg]||fg,tokens[bg]||bg);assert.ok(ratio>=4.5,label+' contrast '+ratio.toFixed(2)+' must be at least4.5:1');}}

test('Research dark palette covers card, navigation, control and secondary text contrast',()=>{
 const css=stylesheet('research'),host=':host([data-theme="dark"])',tokens=rule(css,host);
 checkPairs(tokens,[['card title','--ink','--white'],['card summary','--muted','--white'],['sidebar category','--ink','--sidebar'],['active category','--ink','--nav'],['snapshot','--muted','--paper'],['primary button','--accent-ink','--teal'],['primary hover','--accent-ink','#b1f2df'],['standard badge','--muted','--badge'],['measured badge','--teal','--mint'],['experimental badge','--orange','--amber'],['evidence note','--note-ink','--note']]);
 for(const selector of ['.research-card','.comparison-card','.layer-guide','.button.secondary','.filters select','.cohort-control select','.plan-control select','.sort-label select','dialog']){const declarations=rule(css,host+' '+selector);assert.equal(declarations.background,'var(--white)',selector);assert.equal(declarations.color,'var(--ink)',selector);}
 assert.equal(rule(css,host+' .sidebar').background,'var(--sidebar)');assert.equal(rule(css,host+' .nav-button').color,'var(--ink)');assert.equal(rule(css,host+' .button.primary').color,'var(--accent-ink)');assert.equal(rule(css,host+' .card-meta .type').color,'var(--ink)');assert.equal(rule(css,host+' .snapshot').color,'var(--muted)');
});

test('Media light palette keeps source identities, placeholders and load controls readable',()=>{
 const css=stylesheet('media'),host=':host([data-theme="light"])',tokens=rule(css,host);
 checkPairs(tokens,[['card title','--ink','--panel'],['summary/identity','--muted','--panel'],['provider/source link','--green','--panel'],['intro','--muted','--bg'],['placeholder','--muted','--placeholder'],['preview action','--action-ink','--green'],['player control','--ink','--control'],['metrics','--muted','--subtle'],['error message','--error','--bg']]);
 assert.equal(rule(css,host+' #load-media').color,'var(--action-ink)');assert.equal(rule(css,host+' .identity').color,'var(--muted)');assert.equal(rule(css,host+' .provider').color,'var(--green)');assert.equal(rule(css,host+' .cover-placeholder').background,'var(--placeholder)');assert.equal(rule(css,host+' .error').color,'var(--error)!important');
});

test('Media dark placeholder text passes against both retained gradient endpoints',()=>{
 const css=stylesheet('media');
 assert.equal(rule(css,':host([data-theme="dark"]) .cover-placeholder').color,'var(--ink)');
 checkPairs({},[['placeholder bright endpoint','#edf4ef','#2d4b50'],['placeholder dark endpoint','#edf4ef','#1b303c']]);
});
