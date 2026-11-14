// Reuse MIT source geometry, shader and animation algorithms; scope lifecycle to Athena.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),source=path.join(root,'feature-foundry/source/src/world/CinematicWorld.ts');
let code=fs.readFileSync(source,'utf8');
function replace(a,b){if(!code.includes(a))throw Error('Source contract changed: '+a);code=code.replace(a,b);}
replace('constructor(host: HTMLElement) {','private disposed = false;\n  private motionEnabled = false;\n  constructor(host: HTMLElement) {');
replace('this.setTheme(document.body.dataset.theme ?? "frutiger");','this.setTheme("frutiger");');
replace('this.resizeObserver = new ResizeObserver(() => this.resize());','this.resizeObserver = new ResizeObserver(() => { if (!this.disposed) this.render(); });');
replace('    this.targetThemeBlend = theme === \"frawgy\" ? 1 : 0;','    this.targetThemeBlend = theme === \"frawgy\" ? 1 : 0;\n    if (!this.motionEnabled) this.themeBlend = this.targetThemeBlend;');
replace('    if (!this.renderer) return;','    if (this.disposed || !this.renderer) return;');
replace('    this.start();','    this.step(0);');
replace('      this.frameId = requestAnimationFrame(frame);','      if (!this.disposed) this.frameId = requestAnimationFrame(frame);');
replace('  dispose(): void {','  setMotion(enabled: boolean): void {\n    this.motionEnabled = enabled;\n    if (!enabled) this.themeBlend = this.targetThemeBlend;\n    cancelAnimationFrame(this.frameId);\n    this.frameId = 0;\n    if (this.disposed) return;\n    if (enabled && this.supported) this.start();\n    else this.step(0);\n  }\n\n  dispose(): void {\n    if (this.disposed) return;\n    this.disposed = true;');
// Manual quality budgets adapted from original prototype-v24.ts1603–1607.
// No adaptive hardware probing; changing a tier always requires a new motion opt-in.
replace('private motionEnabled = false;', 'private motionEnabled = false;\n  private qualityDpr = 1.25;\n  private qualityFps = 20;\n  private renderRatio = 0;');
replace('    if (width === this.width && height === this.height) return;', '    const ratio = Math.min(window.devicePixelRatio || 1, this.qualityDpr);\n    if (width === this.width && height === this.height && ratio === this.renderRatio) return;\n    this.renderRatio = ratio;');
replace('Math.min(window.devicePixelRatio || 1, 2)', 'ratio');
replace('      const delta = Math.min(50, Math.max(0, now - this.lastFrame));\n      this.lastFrame = now;\n      this.update(delta / 1000);\n      this.render();', '      if (this.disposed || !this.motionEnabled || !this.qualityFps) return;\n      const elapsed = Math.max(0, now - this.lastFrame), interval = 1000 / this.qualityFps;\n      if (elapsed + 1e-7 >= interval) {\n        this.lastFrame += Math.floor((elapsed + 1e-7) / interval) * interval;\n        this.update(Math.min(50, elapsed) / 1000);\n        this.render();\n      }');
replace('    this.frameId = requestAnimationFrame(frame);\n  }', '    this.lastFrame = performance.now();\n    this.frameId = requestAnimationFrame(frame);\n  }');
replace('if (enabled && this.supported) this.start();', 'if (enabled && this.supported && this.qualityFps !== 0) this.start();');
replace('  setMotion(enabled: boolean): void {', '  setQuality(mode: string): void {\n    const budgets: Record<string, [number, number]> = {eco:[1,0], balanced:[1.25,20], ultra:[1.5,30]};\n    if (!Object.prototype.hasOwnProperty.call(budgets, mode)) throw new Error("Unknown cinema quality tier");\n    [this.qualityDpr, this.qualityFps] = budgets[mode];\n    this.setMotion(false);\n  }\n\n  setMotion(enabled: boolean): void {');
const tmp=fs.mkdtempSync(path.join(root,'.cinematic-build-'));
try{
 fs.writeFileSync(path.join(tmp,'world.ts'),code);
 const result=esbuild.buildSync({entryPoints:[path.join(tmp,'world.ts')],bundle:true,format:'esm',platform:'browser',target:'es2022',write:false,minify:true,legalComments:'eof',logLevel:'silent'});
 const output=path.join(root,'dist/workspaces/foundry/cinematic-world.mjs'),bytes=result.outputFiles[0].contents;
 if(process.argv.includes('--check')){if(!fs.existsSync(output)||!fs.readFileSync(output).equals(Buffer.from(bytes)))throw Error('Cinematic bundle stale');}else fs.writeFileSync(output,bytes);
 console.log(JSON.stringify({sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),bundleSHA256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length}));
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
