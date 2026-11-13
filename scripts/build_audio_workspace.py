"""Native verified-audio workspace; exact preserved source algorithms, no iframe."""
from pathlib import Path
import argparse, hashlib, json
from build_engineering_workspaces import replace, body, scoped_css, LIFECYCLE
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'engineering/docs/audio-lab'
DEST=ROOT/'dist/workspaces/engineering/audio'
def build():
    files={}; origins={}
    def emit(name,content,source):
        files[DEST/name]=content.encode(); origins[str(source.relative_to(ROOT))]=hashlib.sha256(source.read_bytes()).hexdigest()
    for name,path in [('audio-core.mjs',SOURCE/'audio-core.mjs'),('archive-selection.mjs',ROOT/'engineering/apps/atlas-lab/ui/archive-view.mjs'),('media-events.mjs',ROOT/'engineering/docs/media-lab/media-events.mjs')]:emit(name,path.read_text(),path)
    fixture=(SOURCE/'public-fixture.json').read_bytes()
    code=(SOURCE/'audio.js').read_text().replace('__SELECTION_MODULE__','./archive-selection.mjs').replace('__EVENT_MODULE__','./media-events.mjs').replace('__FIXTURE_JSON_STRING__',json.dumps(fixture.decode())).replace('__FIXTURE_SHA256__',hashlib.sha256(fixture).hexdigest())
    imports='\n'.join(line for line in code.splitlines() if line.startswith('import '))
    code='\n'.join(line for line in code.splitlines() if not line.startswith('import '))
    code=replace(code,'document.getElementById(id)','root.getElementById(id)')
    code=replace(code,"harness:'atlas-public-audio-v1-verified-bytes'","harness:'athena-native-audio-v1-verified-bytes',source_harness:'atlas-public-audio-v1-verified-bytes'")
    code=code.replace('URL.createObjectURL(', 'createObjectURL(').replace('URL.revokeObjectURL(', 'revokeObjectURL(')
    code=replace(code,'atlas-public-audio-receipt.json','athena-public-audio-receipt.json')
    code=replace(code,"window.addEventListener('beforeunload',()=>{closed=true;selection.cancel();clearTimeout(readyTimer);if(currentAudio)currentAudio.pause();if(currentUrl)revokeObjectURL(currentUrl);});", "cleanups.push(()=>{closed=true;selection.cancel();clearTimeout(readyTimer);if(currentAudio){currentAudio.pause();currentAudio.removeAttribute('src');currentAudio.load();}currentAudio=null;currentUrl=null;});")
    code=replace(code,"finally{$('load').disabled=closed||selection.pending;", "finally{if(disposed)return;$('load').disabled=closed||selection.pending;")
    html='<p class="note">Athena native verified audio v1. One dated public sample. Load verifies complete bytes; native Play is separate. Autoplay is off. Export the receipt before leaving this workspace.</p>'+body(SOURCE/'index.template.html').replace('../media-lab/','#media')
    html='<p id="search-status" class="note" role="status"></p>'+html
    header='export async function mount({container,search="",theme="dark",signal:outerSignal}={}){\n'+LIFECYCLE+'\nroot.innerHTML='+json.dumps(html)+';\nconst style=document.createElement("link");style.rel="stylesheet";style.href=new URL("./style.css",import.meta.url).href;root.prepend(style);setTheme(theme);\n'
    footer='''
function setSearch(value){if(disposed)return;const query=String(value??'').trim().toLowerCase();$('search-status').textContent=!query?'Search matches this single source without changing verification.':JSON.stringify(fixture).toLowerCase().includes(query)?'This public source matches your search.':'No match in this single public sample. Verification and any loaded clip remain unchanged.';}
setSearch(search);
return {unmount,setTheme,setSearch,ready:true,exportState(){return null;}};
}
'''
    emit('index.mjs',imports+'\n'+header+code+footer,SOURCE/'audio.js')
    css=scoped_css(SOURCE/'audio.css','audio')+'\nmain{padding:0}:host([data-theme="light"]){color-scheme:light;background:#f4f6fa;color:#172139}:host([data-theme="light"]) .panel{background:#fff;border-color:#aebbd0}:host([data-theme="light"]) #status,:host([data-theme="light"]) .note,:host([data-theme="light"]) dt,:host([data-theme="light"]) pre,:host([data-theme="light"]) footer{color:#405369}:host([data-theme="light"]) a{color:#2459a9}:host([data-theme="light"]) button:focus-visible,:host([data-theme="light"]) a:focus-visible{outline-color:#2459a9}\n'
    emit('style.css',css,SOURCE/'audio.css')
    files[DEST/'manifest.json']=(json.dumps({'schema':1,'kind':'native verified audio workspace','source_files':origins,'fixture_sha256':hashlib.sha256(fixture).hexdigest(),'boundaries':['Explicit public file load only; autoplay off','Exact verified bytes; readiness is not playing','Navigation cancels load, stops audio and revokes blobs','Export receipt before navigation; no durability claim']},indent=2)+'\n').encode()
    return files
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args()
    for path,data in build().items():
        if a.check:
            if not path.exists() or path.read_bytes()!=data:raise SystemExit('Stale audio workspace: '+str(path))
        else:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    print('Native audio workspace '+('verified' if a.check else 'generated'))
