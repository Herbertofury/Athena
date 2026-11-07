import {parseState, encodeState, queryCatalog, repositorySignal, communityScore, publishedDate,
  evidenceFor, cohortFor, measurement, exportCSV, safeURL, ratingURL, COMMUNITY_PRIOR, publicationYearMatches,
  testPlanFor, plansForCandidate, buildTestPlanProposal} from './explorer-core.mjs';


export async function mount({container,search,theme="dark",notify:hostNotify,navigate,state:initialState,route="",signal:outerSignal}={}){

  if (!container?.attachShadow) throw new TypeError('A workspace container is required');
  const root=container.shadowRoot || container.attachShadow({mode:'open'});
  const lifetime=new AbortController(), cleanups=[], timeouts=new Set(), objectURLs=new Set();
  let disposed=false;
  const setTimeout=(fn,ms)=>{const id=globalThis.setTimeout(()=>{timeouts.delete(id);if(!disposed)fn();},ms);timeouts.add(id);return id;};
  const clearTimeout=id=>{timeouts.delete(id);globalThis.clearTimeout(id);};
  const createObjectURL=blob=>{const url=URL.createObjectURL(blob);objectURLs.add(url);return url;};
  const revokeObjectURL=url=>{objectURLs.delete(url);URL.revokeObjectURL(url);};
  function unmount(){if(disposed)return;disposed=true;lifetime.abort();for(const cleanup of cleanups.splice(0)){try{cleanup();}catch{}}for(const id of timeouts)globalThis.clearTimeout(id);timeouts.clear();for(const url of objectURLs)URL.revokeObjectURL(url);objectURLs.clear();root.replaceChildren();outerSignal?.removeEventListener('abort',unmount);}
  function setTheme(value){container.dataset.theme=value==='light'?'light':'dark';}
  outerSignal?.addEventListener('abort',unmount,{once:true});
  if(outerSignal?.aborted){unmount();return {unmount,setTheme,setSearch(){},exportState(){return null;},ready:false};}
  root.innerHTML="<style>\n:host{--ink:#152e37;--muted:#52636a;--paper:#f5f6f2;--white:#fff;--line:#dce3df;--teal:#087a69;--teal-dark:#056150;--mint:#e7f3ec;--orange:#a35113;--amber:#fff2dc;--nav:#102e36;--radius:10px;font-family:Inter,\"Segoe UI\",Arial,sans-serif;color:var(--ink);background:var(--paper);font-synthesis:none}\n*{box-sizing:border-box}:host{margin:0;font-size:14px;line-height:1.55}button,input,select{font:inherit}button,select{cursor:pointer}button:disabled{cursor:default;opacity:.45}button,a,input,select,summary{outline-offset:4px}a{color:var(--teal-dark);text-decoration:none}a:hover{text-decoration:underline}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #b66719}button{color:inherit}h1,h2,h3,p{margin:0}h1,h2,h3{line-height:1.17}h2{font-size:25px;letter-spacing:-.7px}h3{font-size:18px}button{border:0}select,input{min-width:0}input,select{accent-color:var(--teal)}[hidden]{display:none!important}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.skip{position:fixed;top:-100px;left:12px;padding:14px;background:white;z-index:30}.skip:focus{top:10px}\n.masthead{height:88px;display:flex;align-items:center;gap:40px;padding:0 36px;background:white;border-bottom:1px solid var(--line)}.brand{display:flex;gap:12px;align-items:center;color:var(--ink);font-size:10px;letter-spacing:1.7px;line-height:1.4}.brand:hover{text-decoration:none}.brand strong{font-size:20px;letter-spacing:4px}.brand-symbol{position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:var(--ink);color:white;font-size:31px;font-weight:700;letter-spacing:-4px;border-radius:9px}.brand-symbol span{font-size:17px;align-self:flex-start;margin-top:1px;letter-spacing:0}.masthead-label{border-left:1px solid var(--line);padding-left:30px;font-size:10px;font-weight:700;letter-spacing:1.8px;color:var(--muted)}.masthead nav{display:flex;gap:27px;margin-left:auto;font-weight:600;font-size:12px}.masthead nav a{color:var(--ink)}\n.shell{display:grid;grid-template-columns:228px minmax(0,1fr);max-width:1800px;margin:auto}.sidebar{padding:34px 17px 30px 24px;border-right:1px solid var(--line);background:#edf1ed;display:flex;flex-direction:column;align-self:stretch}.eyebrow{font-size:10px;font-weight:750;letter-spacing:1.7px;line-height:1.7;color:var(--muted)}.sidebar>.eyebrow{padding-left:10px;margin-bottom:16px}.sidebar-title{font-size:9px;font-weight:700;color:#627570;letter-spacing:1.7px;margin:28px 10px 11px}.nav-button{display:flex;justify-content:space-between;gap:10px;align-items:center;width:100%;padding:10px 12px;background:transparent;text-align:left;font-size:12px;border-radius:6px;margin-bottom:3px;line-height:1.4}.nav-button:hover{background:#e0e9e1}.nav-button.active{background:var(--nav);color:#fff}.nav-count{font-size:10px;font-variant-numeric:tabular-nums;opacity:.75}.category-list{display:flex;flex-direction:column}.sidebar-note{margin:35px 7px 0;padding:19px 0 0;border-top:1px solid #cbd6ce;font-size:11px}.sidebar-note strong{display:block;font-size:12px;margin:9px 0}.sidebar-note p{color:var(--muted);margin-bottom:13px}.status-dot{display:block;width:7px;height:7px;border-radius:100%;background:var(--teal);box-shadow:0 0 0 5px #dae9de;margin:4px 0 15px 4px}.sidebar-link{font-size:11px;margin:25px 7px}\nmain{min-width:0;padding:36px 44px 0;max-width:1400px;width:100%;margin:auto}.hero-top{display:flex;justify-content:space-between;gap:16px;align-items:center}.snapshot{font-family:\"SFMono-Regular\",Consolas,monospace;font-size:10px;color:#627069;white-space:nowrap}.hero h1{font-size:clamp(38px,4vw,57px);font-weight:650;letter-spacing:-2.7px;line-height:1.05;margin:24px 0 18px}.hero h1 span{color:var(--teal)}.hero-bottom{display:flex;gap:28px;align-items:flex-end;justify-content:space-between}.hero-bottom p{max-width:535px;font-size:14px;line-height:1.7;color:var(--muted)}.text-link{font-size:12px;font-weight:650}.hero-bottom .text-link{white-space:nowrap;padding-bottom:4px}.stats{display:grid;grid-template-columns:repeat(4,1fr);padding:22px 0;margin:28px 0 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.stats>div{padding:0 24px;display:flex;flex-direction:column-reverse;border-left:1px solid var(--line)}.stats>div:first-child{padding-left:0;border:0}.stats dt{font-size:10px;color:var(--muted);margin-top:3px}.stats dd{font-size:29px;margin:0;line-height:1.15;font-weight:600;letter-spacing:-1px;font-variant-numeric:tabular-nums}.catalog{padding-top:32px;scroll-margin-top:20px}.section-heading{display:flex;gap:16px;justify-content:space-between;align-items:center;margin-bottom:22px}.section-heading .eyebrow{margin-bottom:7px}.button{display:inline-flex;justify-content:center;align-items:center;gap:8px;padding:9px 13px;border-radius:6px;font-weight:600;font-size:11px;white-space:nowrap;min-height:36px}.primary{background:var(--teal);color:white}.primary:hover{background:var(--teal-dark)}.secondary{border:1px solid #cfd9d2;background:white}.secondary:hover{background:#edf5ef}.quiet{background:transparent;color:var(--muted);padding:7px}.quiet:hover{background:#e8ede7}.button #shortlist-count{background:var(--mint);color:var(--teal-dark);padding:0 5px;border-radius:3px}.search-row{display:flex;gap:12px}.search-field{border:1px solid #cbd7d0;box-shadow:0 2px 4px #243b2c04;border-radius:7px;background:white;padding:0 15px;display:flex;align-items:center;gap:10px;flex:1}.search-field>span:first-child{font-size:29px;font-weight:300;color:var(--teal);line-height:1}.search-field input{background:transparent;border:0;padding:13px 0;flex:1;width:100%;color:var(--ink);font-size:13px;outline-offset:0}.search-field:focus-within{box-shadow:0 0 0 2px #258b7360}.search-field input:focus{outline:none}.search-field input::placeholder{color:#6e7e76}.filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:18px 0 19px}.filters label,.cohort-control label{display:flex;flex-direction:column;gap:6px;color:var(--muted);font-size:10px;font-weight:600}.filters select,.cohort-control select{background:white;border:1px solid var(--line);border-radius:5px;padding:8px 27px 8px 10px;min-height:36px;color:var(--ink);font-size:11px;width:100%}.sort-row{display:flex;align-items:center;gap:20px;justify-content:space-between;border-top:1px solid var(--line);padding:15px 0}.sort-row>span{font-size:11px;color:var(--muted)}.sort-actions{display:flex;gap:10px;align-items:center}.sort-label{font-size:10px;color:var(--muted);display:flex;gap:6px;align-items:center;white-space:nowrap}.sort-label select{color:var(--ink);font-size:11px;font-weight:650;border:0;background:transparent;max-width:175px}.evidence-note{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:#eaf0e9;border:1px solid #d6e1d6;border-radius:6px;color:#465c50;font-size:11px;margin-bottom:16px;line-height:1.65}.note-icon{border:1px solid #819789;border-radius:50%;font-size:10px;line-height:14px;min-width:15px;text-align:center;margin-top:2px}.evidence-note a{font-weight:600}.cohort-control{margin-bottom:14px;max-width:100%}.cohort-control select{font-size:12px}\n.results{display:flex;flex-direction:column;gap:10px}.research-card{border:1px solid var(--line);border-radius:8px;background:white;overflow:hidden}.card-main{padding:18px 19px;display:grid;grid-template-columns:35px minmax(0,1fr) 145px;gap:13px}.entry-icon{width:34px;height:34px;border:1px solid #dce5df;background:#f3f6f1;display:flex;align-items:center;justify-content:center;font-family:Consolas,monospace;font-size:12px;color:var(--teal);border-radius:7px;font-weight:700}.entry-icon.paper{background:#fff2e4;color:#975b20;border-color:#f0e3d3}.card-title{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.card-title h3{font-size:16px;letter-spacing:-.3px}.card-title h3 a{color:var(--ink)}.badge{font-size:9px;line-height:1.6;border:1px solid #dfe6df;border-radius:4px;padding:1px 6px;color:#52675d;background:#f7f9f5;white-space:nowrap}.badge.measured{color:#08715e;background:#e9f6ed;border-color:#cbe3d1}.badge.experimental{color:#9b5f13;background:#fff5e7;border-color:#edddc2}.card-summary{margin:7px 0 10px;font-size:12px;color:var(--muted);max-width:690px;line-height:1.65}.card-meta{display:flex;gap:7px 12px;align-items:center;flex-wrap:wrap;font-size:10px;color:#64766c}.card-meta .type{font-weight:650;color:#42594b}.card-meta .divider{color:#bdcbbf}.card-side{display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:12px}.signal{font-size:16px;font-weight:650;line-height:1.2;font-variant-numeric:tabular-nums;text-align:right}.signal small{display:block;font-size:9px;font-weight:400;color:var(--muted);margin-top:5px;line-height:1.5;max-width:150px}.shortlist-label{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--muted);cursor:pointer}.shortlist-label input{width:14px;height:14px;margin:0}.card-detail{border-top:1px solid #edf0eb}.card-detail summary{padding:8px 19px 8px 67px;list-style:none;cursor:pointer;font-size:10px;font-weight:600;color:var(--teal);display:flex;justify-content:space-between;gap:20px}.card-detail summary::-webkit-details-marker{display:none}.card-detail summary:after{content:'+';font-size:14px}.card-detail[open] summary:after{content:'\u2212'}.detail-content{padding:12px 22px 22px 67px;font-size:12px;line-height:1.7}.detail-content h4{font-size:10px;text-transform:uppercase;letter-spacing:.8px;margin:18px 0 6px;color:var(--muted)}.detail-content h4:first-child{margin-top:2px}.detail-content ul{padding-left:18px;margin:4px 0 12px}.detail-content li{margin-bottom:5px}.detail-content .detail-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:25px}.source-list small{color:var(--muted);display:block;font-size:10px}.source-list a{font-weight:600}.entry-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}.empty{padding:55px 20px;text-align:center;border:1px dashed #bfcec3;border-radius:8px;background:#f1f5ef}.empty h3{font-size:19px;margin-bottom:9px}.empty p{color:var(--muted);font-size:12px;max-width:520px;margin:auto}.pagination{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:22px 0}.pagination>span{font-size:11px;color:var(--muted)}\n.methodology{margin-top:42px;padding:32px 0 40px;border-top:1px solid var(--line);scroll-margin-top:20px}.methodology>h2{max-width:590px;font-size:28px;margin:12px 0 25px}.method-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-bottom:26px}.method-number{font-family:Consolas,monospace;font-size:12px;color:var(--teal);display:block;margin-bottom:14px}.method-grid h3{font-size:16px;margin-bottom:9px}.method-grid p{font-size:12px;color:var(--muted);line-height:1.8}footer{border-top:1px solid var(--line);padding:22px 0 28px;display:flex;align-items:flex-start;gap:24px;font-size:10px;color:var(--muted)}footer>span{font-size:9px;letter-spacing:1px;font-weight:650;white-space:nowrap}footer>p{max-width:460px;margin-left:auto}footer>a{white-space:nowrap}\ndialog{width:min(1120px,calc(100% - 40px));max-height:85vh;border:1px solid var(--line);padding:28px;border-radius:12px;background:var(--paper);color:var(--ink);box-shadow:0 20px 100px #001b2840}dialog::backdrop{background:#061b27a6}.dialog-header{display:flex;justify-content:space-between;gap:15px;align-items:center}.dialog-header h2{margin-top:6px}#comparison-note{font-size:12px;color:var(--muted);margin:20px 0}.comparison-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:15px}.comparison-card{background:white;padding:19px;border:1px solid var(--line);border-radius:7px;font-size:12px;min-width:0}.comparison-card h3{font-size:18px;overflow-wrap:anywhere}.comparison-card h4{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin:20px 0 7px}.comparison-card p{margin-top:10px}.comparison-card ul{padding-left:18px}.comparison-card li{margin-bottom:7px}.comparison-card .button{margin-top:14px}.dialog-actions{display:flex;gap:10px;margin-top:24px}.toast{position:fixed;bottom:25px;left:50%;transform:translateX(-50%);max-width:90vw;background:var(--ink);color:#fff;font-size:12px;padding:12px 22px;box-shadow:0 6px 25px #001d2b30;border-radius:8px;z-index:40}\n@media(min-width:1550px){main{padding-left:60px;padding-right:60px}.shell{grid-template-columns:250px minmax(0,1fr)}.sidebar{padding-left:30px;padding-right:24px}.hero h1{font-size:61px}.card-main{padding-top:21px;padding-bottom:21px}}\n@media(max-width:1100px){.shell{grid-template-columns:195px minmax(0,1fr)}main{padding:30px 25px 0}.sidebar{padding-left:13px;padding-right:12px}.hero-bottom{display:block}.hero-bottom .text-link{display:inline-block;margin-top:13px}.filters{grid-template-columns:repeat(3,1fr)}.sort-row{align-items:flex-start;flex-wrap:wrap;gap:8px}.sort-actions{flex-wrap:wrap}.card-main{grid-template-columns:30px minmax(0,1fr) 115px;gap:10px}.card-detail summary{padding-left:59px}.detail-content{padding-left:25px}.detail-content .detail-grid{grid-template-columns:1fr}.masthead{padding:0 24px;gap:25px}footer{flex-wrap:wrap}footer>p{margin-left:0}.hero-top{align-items:flex-start;flex-direction:column;gap:8px}.hero h1{margin-top:20px}.stats>div{padding:0 12px}}\n@media(max-width:760px){.masthead{height:74px;padding:0 18px}.masthead-label{display:none}.masthead nav{gap:16px;font-size:11px}.brand{font-size:8px}.brand strong{font-size:17px}.brand-symbol{width:34px;height:34px;font-size:27px}.shell{display:block}.sidebar{padding:15px 18px;border-right:0;border-bottom:1px solid var(--line);display:block}.sidebar>.eyebrow,.sidebar-title,.sidebar-note,.sidebar-link{display:none}.sidebar>#all-categories{display:inline-flex;width:auto;margin:0 7px 0 0;padding:7px 10px;vertical-align:top}.category-list{display:inline-flex;flex-direction:row;gap:5px;width:calc(100% - 137px);overflow:auto;vertical-align:top;scrollbar-width:thin}.category-list .nav-button{width:auto;white-space:nowrap;padding:7px 10px;margin:0}.nav-count{margin-left:5px}main{padding:26px 18px 0}.hero h1{font-size:44px;letter-spacing:-2px}.hero-bottom p{font-size:13px}.stats{margin-top:22px;padding:18px 0}.stats dd{font-size:25px}.stats dt{font-size:9px}.stats>div{padding:0 9px}.section-heading{align-items:flex-end}.section-heading h2{font-size:22px}.section-heading .button{font-size:10px;padding:8px}.search-row>.button{font-size:10px;padding:8px}.search-field{padding:0 10px}.search-field input{font-size:12px}.filters{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sort-actions{gap:7px}.sort-label select{max-width:160px}.card-main{grid-template-columns:28px minmax(0,1fr);padding:15px 13px;gap:10px}.entry-icon{width:28px;height:28px;font-size:10px}.card-side{grid-column:2;flex-direction:row;align-items:center;justify-content:space-between;margin-top:2px}.signal{text-align:left;font-size:13px}.signal small{display:inline;font-size:9px;margin-left:6px}.card-title h3{font-size:15px}.card-summary{font-size:11px}.card-detail summary{padding-left:51px;font-size:9px}.detail-content{padding:12px 15px 18px;font-size:11px}.card-meta{font-size:9px;gap:6px 8px}.methodology{margin-top:30px}.methodology>h2{font-size:25px}.method-grid{grid-template-columns:1fr;gap:22px}.method-grid article{display:grid;grid-template-columns:30px minmax(0,1fr);column-gap:12px}.method-grid p{grid-column:2}.method-number{grid-row:1/3;margin:2px 0}.method-grid h3{margin:0 0 8px}.comparison-cards{grid-template-columns:1fr}dialog{padding:18px;width:calc(100% - 24px);max-height:90vh}footer{gap:12px}.snapshot{font-size:9px}}\n@media(prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}.research-card{transition:border-color .15s,box-shadow .15s}.research-card:hover{border-color:#b4cbbd;box-shadow:0 2px 10px #213b2605}}\n@media print{.sidebar,.masthead nav,.filters,.search-row,.sort-actions,.pagination,.shortlist-label,.button{display:none!important}.shell{display:block}main{padding:0}.card-detail{display:none}.research-card{break-inside:avoid}.hero h1{font-size:34px}.methodology{break-before:page}}\n\n.layer-guide{margin:0 0 18px;padding:20px;background:#fff;border:1px solid #c7dacf;border-left:4px solid var(--teal);border-radius:8px}.layer-guide h3{margin:5px 0 10px;font-size:20px}.layer-decision,.layer-gate{font-size:12px;line-height:1.8}.layer-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin:15px 0}.layer-choices h4{font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--muted);margin:0 0 7px}.layer-choices ul{margin:0;padding-left:17px;font-size:12px}.layer-choices li{margin:4px 0}.layer-choices p,.layer-scope{font-size:10px;color:var(--muted);line-height:1.7}.layer-gate{border-top:1px solid var(--line);padding-top:12px}.layer-scope{margin-top:8px}\n@media(min-width:1550px){.filters{grid-template-columns:repeat(6,minmax(0,1fr))}}\n@media(max-width:760px){.layer-guide{padding:15px}.layer-choices{grid-template-columns:1fr;gap:13px}.layer-guide h3{font-size:18px}}\n\n.plan-control{display:flex;align-items:flex-end;gap:20px;margin:0 0 19px}.plan-control label{display:flex;flex-direction:column;gap:6px;color:var(--muted);font-size:10px;font-weight:600;flex:1;min-width:0}.plan-control select{background:white;border:1px solid var(--line);border-radius:5px;padding:8px 27px 8px 10px;min-height:36px;color:var(--ink);font-size:11px;width:100%}.plan-control p{flex:1;font-size:10px;color:var(--muted);padding-bottom:3px}.plan-guide{margin:0 0 18px;padding:20px;background:#f0f6f2;border:1px solid #b9d2c4;border-radius:8px}.plan-heading{display:flex;justify-content:space-between;gap:18px;align-items:center}.plan-heading h3{margin:5px 0 10px;font-size:20px}.plan-decision{font-size:12px;line-height:1.8}.plan-scope{font-size:10px;color:var(--muted);margin-top:8px;line-height:1.7}.plan-contract{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:16px}.plan-contract h4,.related-plans h4{font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--muted);margin:0 0 7px}.plan-contract ul,.plan-protocol ul,.related-plans ul{padding-left:17px;font-size:11px;margin:5px 0}.plan-contract li,.plan-protocol li,.related-plans li{margin:5px 0}.plan-protocol{border-top:1px solid #ccded2;padding-top:12px;margin-top:16px;font-size:11px}.plan-protocol summary{cursor:pointer;color:var(--teal-dark);font-weight:650}.plan-protocol p{font-size:10px;color:var(--muted);margin-top:10px}.related-plans{border-top:1px solid var(--line);padding-top:12px;margin-top:12px}\n@media(max-width:1100px){.plan-contract{grid-template-columns:1fr;gap:13px}}\n@media(max-width:760px){.plan-control{display:block}.plan-control p{margin-top:8px}.plan-guide{padding:15px}.plan-heading{display:block}.plan-heading h3{font-size:18px}.plan-heading .button{margin-bottom:12px}.plan-control select{max-width:100%}}\n@media print{.plan-control{display:none!important}.plan-guide{break-inside:avoid}}\n\n:host{display:block;min-width:0}.masthead{display:none}.shell{min-height:0}main{min-width:0}.skip{display:none}\n:host([data-theme=\"dark\"]){color-scheme:dark;--ink:#edf4ef;--muted:#a3b7bf;--paper:#101b24;--white:#192b35;--line:#36505c;--teal:#8ee1c7;--teal-dark:#8ee1c7;--mint:#183b36;--orange:#f1ba8a;--amber:#3d3021;--nav:#101e28}.search-field,.filters select,.plan-control select,.sort-label select,dialog,.comparison-card{background:var(--white);color:var(--ink)}\n</style>\n  <a class=\"skip\" href=\"#catalog\">Skip to research catalog</a>\n  \n  <div class=\"shell\">\n    <aside class=\"sidebar\" aria-label=\"Research categories\">\n      <p class=\"eyebrow\">EXPLORE ATHENA</p>\n      <button class=\"nav-button active\" id=\"all-categories\" type=\"button\" aria-pressed=\"true\"><span>All research</span><span id=\"all-count\" class=\"nav-count\">\u2014</span></button>\n      <h2 class=\"sidebar-title\">FIELDS OF RESEARCH</h2>\n      <div id=\"category-list\" class=\"category-list\"></div>\n      <div class=\"sidebar-note\"><span class=\"status-dot\"></span><strong>Evidence before adoption.</strong><p>Discover a candidate. Define a fair test. Keep the result, including the failures.</p><a href=\"https://github.com/Herbertofury/Athena/blob/main/engineering/docs/research-explorer.md\">How this works <span aria-hidden=\"true\">\u2197</span></a></div>\n      <a class=\"sidebar-link\" href=\"https://github.com/Herbertofury/Athena/blob/main/engineering/docs/research-test-queue.md\">Open the test queue <span aria-hidden=\"true\">\u2197</span></a>\n    </aside>\n    <main id=\"app\" data-catalog=\"catalog.json\">\n      <section class=\"hero\" aria-labelledby=\"page-title\">\n        <div class=\"hero-top\"><p class=\"eyebrow\">CURATED DISCOVERY / REPRODUCIBLE DECISIONS</p><span class=\"snapshot\" id=\"snapshot\">Research snapshot</span></div>\n        <h1 id=\"page-title\">Find what\u2019s next.<br><span>Prove what\u2019s better.</span></h1>\n        <div class=\"hero-bottom\"><p>Explore tools, languages, papers and methods across the stack. Choose a layer for a focused shortlist and the test it must pass.</p><a class=\"text-link\" href=\"#methodology\">Read the ranking rules <span aria-hidden=\"true\">\u2193</span></a></div>\n        <dl class=\"stats\" id=\"stats\"><div><dt>Candidates</dt><dd>\u2014</dd></div><div><dt>Primary URLs</dt><dd>\u2014</dd></div><div><dt>2026 publications</dt><dd>\u2014</dd></div><div><dt>Measured candidates</dt><dd>\u2014</dd></div></dl>\n      </section>\n      <section id=\"catalog\" class=\"catalog\" aria-labelledby=\"catalog-heading\">\n        <div class=\"section-heading\"><div><p class=\"eyebrow\">THE RESEARCH INDEX</p><h2 id=\"catalog-heading\">Explore the catalog</h2></div><button type=\"button\" class=\"button secondary\" id=\"compare-open\">Compare shortlist <span id=\"shortlist-count\">0</span></button></div>\n        <div class=\"search-row\"><label class=\"search-field\" hidden><span aria-hidden=\"true\">\u2315</span><span class=\"sr-only\">Search research</span><input id=\"search\" type=\"search\" aria-label=\"Search research\" placeholder=\"Search projects, papers, techniques, source domains\u2026\" autocomplete=\"off\" maxlength=\"300\"></label><button type=\"button\" id=\"reset\" class=\"button secondary\">Reset filters</button></div>\n        <div class=\"filters\">\n          <label>Stack layer<select id=\"layer\"><option value=\"\">All stack layers</option></select></label>\n          <label>Type<select id=\"kind\"><option value=\"\">All types</option></select></label>\n          <label>Maturity<select id=\"maturity\"><option value=\"\">All stages</option><option value=\"established\">Established</option><option value=\"emerging\">Emerging</option><option value=\"experimental\">Experimental</option></select></label>\n          <label>Evidence<select id=\"evidence\"><option value=\"\">All evidence</option><option value=\"candidate\">Research candidate</option><option value=\"measured\">Atlas measurement</option></select></label>\n          <label>Publication<select id=\"year\"><option value=\"\">Any date / unknown</option><option value=\"2026\">Published in 2026</option></select></label>\n          <label>Evaluation track<select id=\"track\"><option value=\"\">All tracks</option></select></label>\n        </div>\n        <div class=\"plan-control\"><label for=\"plan\">Planned comparison<select id=\"plan\"><option value=\"\">All candidates / no plan selected</option></select></label><p id=\"plan-summary\">Browse the shared test queue.</p></div>\n        <section id=\"layer-guide\" class=\"layer-guide\" aria-label=\"Stack layer decision guide\" hidden></section>\n        <section id=\"plan-guide\" class=\"plan-guide\" aria-label=\"Planned comparison protocol\" hidden></section>\n        <div class=\"sort-row\"><span id=\"result-count\" role=\"status\" aria-live=\"polite\">Loading the source-backed catalog\u2026</span><div class=\"sort-actions\"><label class=\"sort-label\">Order by<select id=\"sort\"><option value=\"priority\">Test priority</option><option value=\"name\">Name A\u2013Z</option><option value=\"stars\">GitHub stars \u2193</option><option value=\"recent\">Publication date \u2193</option><option value=\"community\">Community rating \u2193</option><option value=\"external\">Published benchmark</option><option value=\"measured\">Atlas measurement</option></select></label><button type=\"button\" id=\"export\" class=\"button quiet\">Export CSV <span aria-hidden=\"true\">\u2193</span></button><button type=\"button\" id=\"share\" class=\"button quiet\">Copy view link</button></div></div>\n        <div id=\"cohort-control\" class=\"cohort-control\" hidden><label>Comparable benchmark cohort<select id=\"cohort\"><option value=\"\">Choose a cohort</option></select></label></div>\n        <div class=\"evidence-note\" id=\"ranking-note\"><span class=\"note-icon\" aria-hidden=\"true\">i</span><p>Test priority is an editorial queue. It is not a performance ranking.</p></div>\n        <div id=\"results\" class=\"results\" aria-live=\"off\"></div>\n        <nav class=\"pagination\" aria-label=\"Catalog pages\"><button type=\"button\" id=\"previous\" class=\"button secondary\">\u2190 Previous</button><span id=\"page-label\"></span><button type=\"button\" id=\"next\" class=\"button secondary\">Next \u2192</button></nav>\n        <noscript><p>This interactive explorer needs JavaScript. Read the <a href=\"https://github.com/Herbertofury/Athena/blob/main/engineering/docs/research-catalog.md\">complete research catalog in Markdown</a> instead.</p></noscript>\n      </section>\n      <section id=\"methodology\" class=\"methodology\" aria-labelledby=\"method-title\">\n        <p class=\"eyebrow\">HOW TO READ THE SIGNALS</p><h2 id=\"method-title\">A ranking is only as useful as its evidence.</h2>\n        <div class=\"method-grid\"><article><span class=\"method-number\">01</span><h3>Discover</h3><p>Stars show attention. Release notes show change. Papers propose ideas. These help decide what deserves a test.</p></article><article><span class=\"method-number\">02</span><h3>Compare fairly</h3><p>User reports stay within a track. Published results stay within a benchmark version and protocol. Missing evidence stays missing.</p></article><article><span class=\"method-number\">03</span><h3>Verify locally</h3><p>Keep the workload, complete outputs and constraints fixed. Retain raw results, regressions and failures before choosing a winner.</p></article></div>\n        <a class=\"text-link\" href=\"https://github.com/Herbertofury/Athena/blob/main/engineering/docs/research-explorer.md\">Full methodology, data contracts and contribution guide <span aria-hidden=\"true\">\u2197</span></a>\n      </section>\n      <footer><span>ATHENA / OPEN RESEARCH</span><p>Shortlists stay in this browser. Ratings are submitted through public GitHub issues for review. No account keys or private data are needed to browse.</p><a href=\"https://github.com/Herbertofury/Athena/blob/main/engineering/data/research-catalog.json\">Download source data \u2197</a></footer>\n    </main>\n  </div>\n  <dialog id=\"compare-dialog\" aria-labelledby=\"compare-title\"><div class=\"dialog-header\"><div><p class=\"eyebrow\">YOUR RESEARCH SHORTLIST</p><h2 id=\"compare-title\">Compare candidates</h2></div><button type=\"button\" id=\"compare-close\" class=\"button secondary\">Close \u2715</button></div><p id=\"comparison-note\"></p><div id=\"comparison-cards\" class=\"comparison-cards\"></div><div class=\"dialog-actions\"><button type=\"button\" id=\"shortlist-export\" class=\"button primary\">Export test plan</button><button type=\"button\" id=\"shortlist-clear\" class=\"button secondary\">Clear shortlist</button></div></dialog>\n  <div id=\"toast\" class=\"toast\" role=\"status\" aria-live=\"polite\" hidden></div>\n  \n";setTheme(theme);
  function shareURL(){const url=new URL(globalThis.location.href);url.hash="research?"+(encodeState(state)||"q=");return url.href;}
  root.addEventListener("click",e=>{const a=e.target.closest?.("a[href]");if(!a)return;const href=a.getAttribute("href");if(href.startsWith("?")){e.preventDefault();state=parseState(href.split("#")[0]);render();}else if(href.startsWith("#")){e.preventDefault();root.getElementById(href.slice(1))?.scrollIntoView?.({block:"start"});}});
const $ = id => root.getElementById(id);
const REPO = 'https://github.com/Herbertofury/Athena';
let catalog,loaded=false;
let state = parseState(route.includes('?')?route.slice(route.indexOf('?')+1):typeof initialState==='string'?initialState:initialState?.query||'');
if(search!==undefined)state.q=String(search).slice(0,300);
let shortlist = [];
let visibleQuery;
let toastTimer;

function element(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (value !== null && value !== undefined) node.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) if (child !== null && child !== undefined) node.append(child);
  return node;
}

function link(text, url, className = '') {
  const href = safeURL(url);
  return href ? element('a', {href, class: className, target: '_blank', rel: 'noopener noreferrer'}, text) : element('span', {}, text);
}

function dateLabel(date) {
  if (!date) return 'Date not reported';
  const d = new Date(date.length === 10 ? date + 'T12:00:00Z' : date);
  return Number.isNaN(d.valueOf()) ? 'Date not reported' : new Intl.DateTimeFormat('en', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'}).format(d);
}

function compact(number) { return new Intl.NumberFormat('en', {notation: 'compact', maximumFractionDigits: 1}).format(number); }
function title(text) { return text.replaceAll('-', ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function trackLabel(id) { return catalog.tracks.find(t => t.id === id)?.label || title(id); }
function categoryLabel(id) { return catalog.categories.find(t => t.id === id)?.label || title(id); }
function layerLabel(id) { return (catalog.layers || []).find(layer => layer.id === id)?.label || title(id); }

function planLink(plan) {
  return element('a', {href: '?' + encodeState({...parseState(''), plan: plan.id}) + '#catalog'}, plan.title);
}

function notify(message) {
  if(hostNotify){hostNotify(message);return;}
  $('toast').textContent = message;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
}

function setState(change, resetPage = true) {
  state = {...state, ...change, ...(resetPage ? {page: 1} : {})};
  render();
}

function saveShortlist() {
  try { localStorage.setItem('engineering-atlas-shortlist-v1', JSON.stringify(shortlist)); }
  catch { notify('Browser storage is unavailable. Your shortlist will last for this page session.'); }
  $('shortlist-count').textContent = shortlist.length;
}

function toggleShortlist(id, checked) {
  if (checked && !shortlist.includes(id)) {
    if (shortlist.length >= 4) { notify('Compare up to four candidates at a time. Remove one from your shortlist first.'); return false; }
    shortlist.push(id);
  } else if (!checked) shortlist = shortlist.filter(item => item !== id);
  saveShortlist();
  return true;
}

function download(name, content, type = 'application/json') {
  const blob = new Blob([content], {type});
  const url = createObjectURL(blob);
  const a = element('a', {href: url, download: name});
  root.append(a); a.click(); a.remove();
  setTimeout(() => revokeObjectURL(url), 1500);
}

function populateSelect(id, rows) {
  const select = $(id);
  while (select.options.length > 1) select.remove(1);
  for (const row of rows) select.add(new Option(row.label, row.id));
}

function renderNavigation() {
  const counts = new Map(catalog.categories.map(c => [c.id, catalog.entries.filter(e => e.category === c.id).length]));
  $('all-count').textContent = catalog.entries.length;
  $('all-categories').classList.toggle('active', !state.category);
  $('all-categories').setAttribute('aria-pressed', String(!state.category));
  $('category-list').replaceChildren(...catalog.categories.map(category =>
    element('button', {type: 'button', class: 'nav-button' + (state.category === category.id ? ' active' : ''),
      'aria-pressed': String(state.category === category.id), onclick: () => setState({category: category.id})},
      element('span', {}, category.label), element('span', {class: 'nav-count'}, String(counts.get(category.id))))));
}

function renderStats() {
  const measured = catalog.entries.filter(e => evidenceFor(e, catalog) === 'measured').length;
  const recent = catalog.entries.filter(e => publicationYearMatches(e, '2026')).length;
  const sources = new Set(catalog.entries.flatMap(e => e.sources.map(source => source.url)));
  const stats = [[catalog.entries.length, 'Candidates'], [sources.size, 'Primary URLs'], [recent, '2026 publications'], [measured, 'Measured candidates']];
  $('stats').replaceChildren(...stats.map(([value, label]) => element('div', {}, element('dt', {}, label), element('dd', {}, String(value)))));
  $('snapshot').textContent = 'SNAPSHOT / ' + dateLabel(catalog.snapshot_date).toUpperCase();
  $('snapshot').title = catalog.snapshot_timezone + '; source check timestamps are UTC.';
}

function renderLayerGuide() {
  const layer = (catalog.layers || []).find(item => item.id === state.layer);
  const guide = $('layer-guide');
  guide.hidden = !layer;
  if (!layer) { guide.replaceChildren(); return; }
  const choices = [['Reference choices', 'baseline_ids'], ['Compare next', 'challenger_ids'], ['Research watchlist', 'watch_ids']];
  const groups = choices.map(([label, key]) => element('div', {}, element('h4', {}, label),
    layer[key].length ? element('ul', {}, layer[key].map(id => {
      const entry = catalog.entries.find(item => item.id === id);
      const view = encodeState({...parseState(''), layer: layer.id, q: entry.name});
      return element('li', {}, element('a', {href: '?' + view + '#catalog'}, entry.name));
    })) : element('p', {}, 'None selected for this role.')));
  guide.replaceChildren(element('p', {class: 'eyebrow'}, 'A STARTING POINT FOR THIS LAYER'),
    element('h3', {}, layer.label), element('p', {class: 'layer-decision'}, layer.decision),
    element('div', {class: 'layer-choices'}, groups),
    element('p', {class: 'layer-gate'}, element('strong', {}, 'Adoption gate: '), layer.gate),
    element('p', {class: 'layer-scope'}, 'Editorial roles, not measured winners. A layer can contain complementary components. Compare only the same functional role and workload; adding a component is a separate variable from replacing one.'));
  const plans = (catalog.test_plans || []).filter(plan => plan.layer_ids.includes(layer.id));
  if (plans.length) guide.append(element('div', {class: 'related-plans'}, element('h4', {}, 'Planned comparisons'),
    element('ul', {}, plans.map(plan => element('li', {}, planLink(plan))))));
}

function renderPlanGuide() {
  const plan = testPlanFor(catalog, state.plan);
  const guide = $('plan-guide');
  guide.hidden = !plan;
  $('plan-summary').textContent = (catalog.test_plans || []).length + ' planned comparisons. Plans describe work to run; they are not results.';
  if (!plan) { guide.replaceChildren(); return; }
  const groups = [['Reference contract', 'controls'], ['Required gates', 'gates'], ['Measure', 'metrics']];
  guide.replaceChildren(element('div', {class: 'plan-heading'},
      element('div', {}, element('p', {class: 'eyebrow'}, 'PLANNED / P' + plan.priority), element('h3', {}, plan.title)),
      element('button', {type: 'button', class: 'button primary', onclick: () => {
        download(plan.id + '.json', JSON.stringify(buildTestPlanProposal(catalog, plan.id), null, 2));
        notify('Plan download requested. Pin the baseline, workload and execution details before running.');
      }}, 'Export this plan ↓')),
    element('p', {class: 'plan-decision'}, plan.decision),
    element('p', {class: 'plan-scope'}, plan.candidate_ids.length + ' registered candidates · ' + plan.layer_ids.map(layerLabel).join(' · ') +
      '. Other filters can narrow the visible list; the plan export always includes every registered candidate.'),
    element('div', {class: 'plan-contract'}, groups.map(([label, key]) => element('div', {}, element('h4', {}, label), bulletList(plan[key])))),
    element('details', {class: 'plan-protocol'}, element('summary', {}, 'Execution protocol and evidence requirements'),
      bulletList(plan.protocol), element('p', {}, 'Baseline revisions, workload hashes, environment, acceptance thresholds and raw evidence remain unfilled until a real experiment is prepared. A shared plan can contain complementary components; compare only equivalent configurations.')));
}

function signal(entry) {
  if (state.sort === 'measured' || state.sort === 'external') {
    const m = measurement(entry, catalog, state), c = cohortFor(catalog, state);
    return [new Intl.NumberFormat('en', {maximumFractionDigits: c?.unit === 'ms' ? 4 : 2}).format(m.value) + ' ' + c.unit,
      c.direction === 'lower' ? 'Lower is better · this cohort' : 'Higher is better · this cohort'];
  }
  if (state.sort === 'community') {
    const score = communityScore(entry, catalog, state.track);
    if (!score) return ['Unrated', 'No reviewed reports'];
    return [score.eligible ? score.adjusted.toFixed(2) + ' / 5' : score.mean.toFixed(1) + ' / 5',
      score.count + ' reports · ' + (score.eligible ? 'adjusted mean' : 'not enough to rank')];
  }
  if (state.sort === 'recent') return [publishedDate(entry) ? dateLabel(publishedDate(entry)) : 'Undated', 'Latest cited publication'];
  if (state.sort === 'stars') {
    const s = repositorySignal(entry, catalog);
    return s ? ['☆ ' + compact(s.stars), 'GitHub · ' + dateLabel(s.observed_at)] : ['—', entry.repo ? 'Snapshot unavailable' : 'No GitHub repository'];
  }
  const labels = {1: 'Test first', 2: 'Test next', 3: 'Watch / explore'};
  return [labels[entry.priority], 'Editorial priority · P' + entry.priority];
}

function bulletList(items) { return element('ul', {}, items.map(item => element('li', {}, item))); }

function detail(entry) {
  const s = repositorySignal(entry, catalog);
  const sources = element('ul', {class: 'source-list'}, entry.sources.map(source => element('li', {},
    link(source.title, source.url), element('small', {},
      (source.published_at ? 'Published ' + dateLabel(source.published_at) + ' · ' : 'Publication date not recorded · ') +
      'Checked ' + dateLabel(source.checked_at) + ' UTC'), element('span', {}, source.note || ''))));
  const column1 = element('div', {}, element('h4', {}, 'What changed / why investigate'),
    element('p', {}, entry.latest_signal || entry.summary), element('h4', {}, 'Proposed test · ' + trackLabel(entry.evaluation.track)),
    element('p', {}, entry.evaluation.proposal), element('h4', {}, 'Measure'), bulletList(entry.evaluation.metrics),
    element('h4', {}, 'Constraints and possible disqualifiers'), bulletList(entry.evaluation.caveats));
  if (entry.layers?.length) column1.append(element('h4', {}, 'Stack layers'), element('p', {}, entry.layers.map(layerLabel).join(' · ')));
  const plans = plansForCandidate(entry, catalog);
  if (plans.length) column1.append(element('h4', {}, 'Registered test plans'),
    element('ul', {}, plans.map(plan => element('li', {}, planLink(plan)))));
  const column2 = element('div', {}, element('h4', {}, 'Primary sources'), sources,
    element('h4', {}, 'Test priority rationale'), element('p', {}, entry.priority_reason),
    element('h4', {}, 'Repository snapshot'), element('p', {}, s ?
      s.stars.toLocaleString() + ' stars · ' + s.forks.toLocaleString() + ' forks · ' +
      (s.license || 'License not identified by GitHub') + ' · ' + (s.archived ? 'Archived' : 'Not archived') +
      ' · observed ' + dateLabel(s.observed_at) + ' UTC. Popularity does not establish quality or license permission.' :
      'No repository snapshot is available. Missing data is not zero and does not imply poor quality.'));
  const observation = measurement(entry, catalog, state);
  if (observation) column1.append(element('h4', {}, 'Displayed measurement'),
    element('p', {}, observation.subject), link('Inspect the recorded evidence ↗', observation.source_url),
    element('p', {}, observation.note || ''));
  const votes = communityScore(entry, catalog, entry.evaluation.track);
  if (votes) column2.append(element('h4', {}, 'Reviewed community reports'),
    element('p', {}, votes.count + ' reports; unadjusted mean ' + votes.mean.toFixed(2) + '/5. Moderation verifies submission structure, not the claim.'),
    element('ul', {}, votes.votes.map(v => element('li', {}, link('@' + v.author + ' · ' + v.score + '/5', v.issue_url)))));
  const actions = element('div', {class: 'entry-actions'}, link('Open project / paper ↗', entry.url, 'button secondary'),
    link('Submit experience rating ↗', ratingURL(entry), 'button secondary'));
  if (entry.repo) actions.append(link('GitHub repository ↗', 'https://github.com/' + entry.repo, 'button secondary'));
  return element('details', {class: 'card-detail'}, element('summary', {}, 'Sources, test proposal & constraints'),
    element('div', {class: 'detail-content'}, element('div', {class: 'detail-grid'}, column1, column2), actions));
}

function card(entry, index) {
  const isPaper = entry.kind === 'paper';
  const [value, label] = signal(entry);
  const measured = evidenceFor(entry, catalog) === 'measured';
  const publisherReported = catalog.results.observations.some(o => o.candidate_id === entry.id &&
    catalog.results.cohorts.some(c => c.id === o.cohort_id && c.evidence === 'external_reported'));
  const labelText = measured ? 'Atlas measured' : publisherReported ? 'Publisher reported' : 'Candidate';
  const check = element('input', {type: 'checkbox', 'aria-label': 'Shortlist ' + entry.name});
  check.checked = shortlist.includes(entry.id);
  check.addEventListener('change', () => { if (!toggleShortlist(entry.id, check.checked)) check.checked = false; });
  const icon = ['measured', 'external'].includes(state.sort) ? String(index + 1).padStart(2, '0') : isPaper ? 'P' : entry.kind === 'language' ? '{ }' : '↗';
  return element('article', {class: 'research-card', 'data-candidate': entry.id},
    element('div', {class: 'card-main'}, element('span', {class: 'entry-icon' + (isPaper ? ' paper' : ''), 'aria-hidden': 'true'}, icon),
      element('div', {}, element('div', {class: 'card-title'}, element('h3', {}, link(entry.name, entry.url)),
        element('span', {class: 'badge' + (measured ? ' measured' : '')}, labelText),
        entry.maturity === 'experimental' ? element('span', {class: 'badge experimental'}, 'Experimental') : null),
        element('p', {class: 'card-summary'}, entry.summary),
        element('div', {class: 'card-meta'}, element('span', {class: 'type'}, title(entry.kind)),
          element('span', {class: 'divider', 'aria-hidden': 'true'}, '/'), element('span', {}, categoryLabel(entry.category)),
          entry.tags.slice(0, 3).map(tag => element('span', {class: 'badge'}, tag)))),
      element('div', {class: 'card-side'}, element('span', {class: 'signal'}, value, element('small', {}, label)),
        element('label', {class: 'shortlist-label'}, check, 'Compare'))), detail(entry));
}

function renderRankingNote() {
  const c = cohortFor(catalog, state);
  const messages = {
    priority: 'Test priority is an editorial queue based on relevance, tractability and available evidence. It is not a performance ranking. Open each entry for its rationale.',
    name: 'Alphabetical catalog. Candidate status means source-reviewed and proposed for testing; it does not establish an engineering win.',
    recent: 'Sorted by the latest publication date in each entry’s cited sources. An old project can have a new release. Unknown publication dates sort last.',
    stars: 'GitHub stars measure attention, not quality or performance. These are dated snapshots; repositories without a snapshot sort last. A mirror can differ from the canonical project.',
    community: 'Community ranking is scoped to the selected track. At least ' + COMMUNITY_PRIOR.minimum + ' distinct reviewed accounts are needed to rank. Adjusted mean = (sum of ratings + 15) / (reports + 5). No votes are invented.',
    external: c ? c.description + ' ' + c.caveats.join(' ') + ' Positions describe only the candidates in this catalog, not the full source leaderboard.' : 'Select a benchmark version and protocol. Scores from different cohorts are never combined.',
    measured: c ? c.description + ' ' + c.caveats.join(' ') : 'Choose a local experiment cohort. A measured result is specific to its retained workload and environment.'
  };
  const content = element('p', {}, messages[state.sort]);
  if (c) content.append(' ', link('Method and source ↗', c.source_url));
  if (state.sort === 'stars' && catalog.signals.errors.length) content.append(' Refresh history retains ' + catalog.signals.errors.length + ' retrieval errors, including resolved attempts; each successful snapshot keeps its actual observation date.');
  if (state.sort === 'community') {
    content.append(catalog.community.last_completed_at ? ' Last complete collection: ' + dateLabel(catalog.community.last_completed_at) + ' UTC.' : ' No complete community collection has been recorded.');
    if (catalog.community.errors.length) content.append(' Refresh history contains ' + catalog.community.errors.length + ' rejected reports or retrieval errors. A failed refresh retains the previous complete collection.');
    content.append(' ', link('Inspect the community snapshot ↗', REPO + '/blob/main/engineering/data/research-community.json'));
  }
  $('ranking-note').replaceChildren(element('span', {class: 'note-icon', 'aria-hidden': 'true'}, 'i'), content);
}

function render() {
  if (state.layer && !(catalog.layers || []).some(layer => layer.id === state.layer)) state.layer = '';
  renderNavigation();
  for (const key of ['layer', 'kind', 'maturity', 'evidence', 'year', 'track', 'plan', 'sort']) $(key).value = state[key];
  if ($('search').value !== state.q) $('search').value = state.q;
  const isBenchmark = ['external', 'measured'].includes(state.sort);
  $('cohort-control').hidden = !isBenchmark;
  populateSelect('cohort', catalog.results.cohorts.filter(c => c.evidence === (state.sort === 'measured' ? 'atlas_measured' : 'external_reported'))
    .map(c => ({id: c.id, label: c.label})));
  $('cohort').value = state.cohort;
  visibleQuery = queryCatalog(catalog, state);
  state.page = visibleQuery.page;
  const query = encodeState(state);
  navigate?.('#research?'+(query||'q='),{replace:true});
  $('result-count').textContent = visibleQuery.total + ' of ' + catalog.entries.length + ' candidates' +
    (state.layer ? ' · ' + layerLabel(state.layer) : '') + (state.category ? ' · ' + categoryLabel(state.category) : '') +
    (testPlanFor(catalog, state.plan) ? ' · ' + testPlanFor(catalog, state.plan).title : '');
  if (!visibleQuery.total) $('results').replaceChildren(element('div', {class: 'empty'}, element('h3', {}, visibleQuery.reason ? 'Choose a comparison scope' : 'No matching candidates'),
    element('p', {}, visibleQuery.reason || 'Try fewer filters or a broader search. Missing results are not evidence that a project is unsuitable.')));
  else $('results').replaceChildren(...visibleQuery.visible.map((entry, index) => card(entry, (visibleQuery.page - 1) * 24 + index)));
  $('previous').disabled = state.page <= 1; $('next').disabled = state.page >= visibleQuery.pages;
  $('page-label').textContent = 'Page ' + state.page + ' of ' + visibleQuery.pages;
  renderRankingNote();
  renderLayerGuide();
  renderPlanGuide();
}

function showComparison() {
  const entries = shortlist.map(id => catalog.entries.find(e => e.id === id)).filter(Boolean);
  const tracks = new Set(entries.map(e => e.evaluation.track));
  $('comparison-note').textContent = !entries.length ? 'Select Compare on up to four catalog entries to build a test plan.' :
    tracks.size > 1 ? 'These candidates belong to different tracks. Compare their fit and test proposals; their scores do not form a shared ranking.' :
    'Shared track: ' + trackLabel(entries[0].evaluation.track) + '. Validate workload, versions and output contracts before comparing performance.';
  $('comparison-cards').replaceChildren(...entries.map(entry => element('article', {class: 'comparison-card'},
    element('h3', {}, entry.name), element('p', {}, entry.summary), element('h4', {}, 'Track / stage'),
    element('p', {}, trackLabel(entry.evaluation.track) + ' · ' + title(entry.maturity)), element('h4', {}, 'Proposed experiment'),
    element('p', {}, entry.evaluation.proposal), element('h4', {}, 'Metrics'), bulletList(entry.evaluation.metrics),
    element('h4', {}, 'Disqualifying constraints'), bulletList(entry.evaluation.caveats), link('Primary source ↗', entry.url),
    element('br'), element('button', {type: 'button', class: 'button secondary', onclick: () => {
      toggleShortlist(entry.id, false); render(); showComparison();
    }}, 'Remove from shortlist'))));
  $('shortlist-export').disabled = !entries.length;
  if (!$('compare-dialog').open) $('compare-dialog').showModal();
}

function bindEvents() {
  $('search').addEventListener('input', e => setState({q: e.target.value}));
  for (const key of ['layer', 'kind', 'maturity', 'evidence', 'year', 'track', 'plan', 'cohort']) $(key).addEventListener('change', e => setState({[key]: e.target.value}));
  $('sort').addEventListener('change', e => {
    const sort = e.target.value;
    const type = sort === 'measured' ? 'atlas_measured' : sort === 'external' ? 'external_reported' : null;
    setState({sort, cohort: type ? catalog.results.cohorts.find(c => c.evidence === type)?.id || '' : '',
      ...(type ? {q: '', category: '', layer: '', plan: '', kind: '', maturity: '', evidence: '', year: '', track: ''} : {})});
  });
  $('all-categories').addEventListener('click', () => setState({category: ''}));
  $('reset').addEventListener('click', () => { state = parseState(''); render(); });
  for (const [id, change] of [['previous', -1], ['next', 1]]) $(id).addEventListener('click', () => { setState({page: state.page + change}, false); $('catalog').scrollIntoView({block: 'start'}); });
  $('export').addEventListener('click', () => download('athena-research-catalog.csv', exportCSV(visibleQuery.entries, catalog, state), 'text/csv;charset=utf-8'));
  $('share').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(shareURL()); notify('Link copied. Search, filters and sort order are included.'); }
    catch { notify('Copy the address bar URL to share this exact view.'); }
  });
  $('compare-open').addEventListener('click', showComparison);
  $('compare-close').addEventListener('click', () => $('compare-dialog').close());
  $('shortlist-clear').addEventListener('click', () => { shortlist = []; saveShortlist(); render(); showComparison(); });
  $('shortlist-export').addEventListener('click', () => {
    const entries = shortlist.map(id => catalog.entries.find(e => e.id === id)).filter(Boolean);
    download('athena-research-test-plan.json', JSON.stringify({schema_version: 1, evidence: 'proposal_not_run',
      exported_at: new Date().toISOString(), catalog_snapshot: catalog.snapshot_date,
      required_before_execution: ['Exact baseline and candidate revisions', 'Workload and expected complete-output hashes',
        'Hardware, OS and toolchain', 'Quality, security and resource gates', 'Trial order and retained raw evidence'],
      selected_layer: state.layer || null,
      selected_plan: state.plan || null,
      registered_plans: [...new Set(entries.flatMap(entry => plansForCandidate(entry, catalog).map(plan => plan.id)))],
      candidates: entries.map(e => ({id: e.id, name: e.name, url: e.url, layers: e.layers || [], evaluation: e.evaluation, source_ids: e.source_ids}))}, null, 2));
  });
  // The Athena shell owns history and route changes.
}

async function main() {
  try {
    const response = await fetch(new URL('./catalog.json',import.meta.url),{signal:lifetime.signal});
    if (!response.ok) throw new Error('Catalog request returned HTTP ' + response.status);
    catalog = await response.json(); if(disposed)return;
    if (catalog.schema_version !== 1 || !Array.isArray(catalog.entries)) throw new Error('Unsupported catalog format');
    for (const key of ['category', 'track']) if (state[key] && !catalog[key === 'category' ? 'categories' : 'tracks'].some(x => x.id === state[key])) state[key] = '';
    populateSelect('kind', [...new Set(catalog.entries.map(e => e.kind))].sort().map(id => ({id, label: title(id)})));
    populateSelect('track', catalog.tracks);
    populateSelect('layer', catalog.layers || []);
    populateSelect('plan', [...(catalog.test_plans || [])].sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title))
      .map(plan => ({id: plan.id, label: 'P' + plan.priority + ' · ' + plan.title})));
    try { const saved = initialState?.shortlist || JSON.parse(localStorage.getItem('engineering-atlas-shortlist-v1') || '[]');
      if (Array.isArray(saved)) shortlist = [...new Set(saved)].filter(id => catalog.entries.some(e => e.id === id)).slice(0, 4);
    } catch { shortlist = []; }
    $('shortlist-count').textContent = shortlist.length;
    renderStats(); bindEvents(); render(); loaded=true;
  } catch (error) {
    if(disposed)return;
    $('result-count').textContent = 'Catalog could not be loaded.';
    $('results').replaceChildren(element('div', {class: 'empty'}, element('h3', {}, 'The catalog is temporarily unavailable'),
      element('p', {}, error.message + '. Reload the page or browse the Markdown catalog.'),
      link('Open the complete catalog ↗', REPO + '/blob/main/engineering/docs/research-catalog.md', 'button secondary')));
  }
}
await main();

  return {unmount,setTheme,ready:loaded,setRoute(value){if(disposed||!catalog)return;const next=parseState(value.includes('?')?value.slice(value.indexOf('?')+1):'');if(encodeState(next)!==encodeState(state)){state=next;render();}},setSearch(q){if(disposed||!catalog)return;setState({q:String(q??'').slice(0,300)});},exportState(){return {query:encodeState(state),shortlist:[...shortlist],loaded};}};
}
