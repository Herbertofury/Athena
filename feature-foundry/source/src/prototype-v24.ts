// @ts-nocheck -- behavior-locked compatibility runtime; verified against the canonical V24 source.
  (() => {
    'use strict';

    const $ = (q, root=document) => root.querySelector(q);
    const $$ = (q, root=document) => [...root.querySelectorAll(q)];
    const clamp = (n,min,max) => Math.max(min,Math.min(max,n));

    function updatePremiumRange(input){
      if(!input||input.type!=='range')return;
      const min=Number.isFinite(Number(input.min))?Number(input.min):0;
      const max=Number.isFinite(Number(input.max))?Number(input.max):100;
      const raw=Number(input.value),value=Number.isFinite(raw)?clamp(raw,min,max):min;
      const progress=max===min?0:clamp((value-min)/(max-min)*100,0,100);
      const zero=min<0&&max>0?clamp((0-min)/(max-min)*100,0,100):200;
      input.style.setProperty('--range-progress',`${progress}%`);
      input.style.setProperty('--range-zero',`${zero}%`);
      input.dataset.rangeReady='true';
      input.dataset.rangeSigned=String(min<0&&max>0);
      input.setAttribute('aria-valuenow',String(value));
      return {min,max,value,progress,zero};
    }
    function refreshPremiumRanges(root=document){$$('input[type="range"]',root).forEach(updatePremiumRange);}
    function bindPremiumRanges(root=document){
      $$('input[type="range"]',root).forEach(input=>{
        if(input.dataset.premiumRangeBound==='true'){updatePremiumRange(input);return;}
        input.dataset.premiumRangeBound='true';
        const update=()=>updatePremiumRange(input);
        input.addEventListener('input',update);
        input.addEventListener('change',update);
        input.addEventListener('keydown',()=>requestAnimationFrame(update));
        input.addEventListener('pointerdown',()=>{input.classList.add('range-dragging');update();});
        ['pointerup','pointercancel','lostpointercapture','blur'].forEach(type=>input.addEventListener(type,()=>input.classList.remove('range-dragging')));
        update();
      });
    }

    const svg = (body, viewBox='0 0 100 100') => `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>`;
    const art = {
      aeroOrb: svg(`<circle cx="50" cy="51" r="29" fill="rgba(105,228,255,.36)" stroke="#eaffff" stroke-width="2"/><circle cx="41" cy="40" r="9" fill="rgba(255,255,255,.76)"/><path d="M26 58c18 9 33 9 49-2" fill="none" stroke="#45c6df" stroke-width="3" opacity=".7"/><ellipse cx="50" cy="82" rx="26" ry="6" fill="rgba(23,100,130,.22)"/>`),
      cloudChair: svg(`<path d="M20 54c0-16 12-28 28-28 12 0 22 6 27 16 12 0 19 8 19 19 0 12-9 20-22 20H34C19 81 8 72 8 61c0-8 5-14 12-17z" fill="#e8ffff" stroke="#7fd9ff" stroke-width="3"/><path d="M28 76v14M70 76v14" stroke="#3ba4c2" stroke-width="5" stroke-linecap="round"/><path d="M33 57c9 7 25 8 36 0" fill="none" stroke="#76e1d0" stroke-width="5" stroke-linecap="round"/>`),
      leafTerminal: svg(`<rect x="18" y="19" width="64" height="47" rx="10" fill="#124e68" stroke="#d9ffff" stroke-width="3"/><rect x="24" y="25" width="52" height="35" rx="6" fill="#55d9dd"/><path d="M36 55c-10-15 4-27 21-23-1 17-9 26-21 23z" fill="#baff75"/><path d="M45 34c-2 10-6 15-11 21" stroke="#218b62" stroke-width="2"/><path d="M42 67v12M28 82h44" stroke="#d9ffff" stroke-width="5" stroke-linecap="round"/>`),
      ecoGlobe: svg(`<circle cx="50" cy="47" r="31" fill="#45c7f1" stroke="#eaffff" stroke-width="3"/><path d="M29 35c7-12 17-15 25-11 4 2 8 6 10 11-10 1-14 6-13 12-9-1-18-4-22-12zM46 56c10-7 21-5 27 4-6 12-16 18-27 18-4-8-4-15 0-22z" fill="#6be087"/><path d="M17 47h66M50 16c-12 14-13 46 0 62M50 16c12 14 13 46 0 62" fill="none" stroke="rgba(255,255,255,.6)"/><path d="M34 82h32" stroke="#d9ffff" stroke-width="5" stroke-linecap="round"/>`),
      waterLamp: svg(`<path d="M50 12c14 17 23 29 23 43a23 23 0 1 1-46 0c0-14 9-26 23-43z" fill="rgba(91,222,255,.55)" stroke="#eaffff" stroke-width="3"/><circle cx="42" cy="45" r="8" fill="rgba(255,255,255,.74)"/><path d="M50 78v10M31 91h38" stroke="#5bc6d8" stroke-width="5" stroke-linecap="round"/>`),
      sunSeed: svg(`<circle cx="50" cy="48" r="19" fill="#fff176" stroke="#fff" stroke-width="3"/><g stroke="#d5ff84" stroke-width="5" stroke-linecap="round"><path d="M50 10v12M50 74v14M12 48h14M74 48h14M23 20l9 9M68 67l9 9M77 20l-9 9M32 67l-9 9"/></g><path d="M39 47c6-8 16-9 24-2-5 12-13 17-24 15z" fill="#45d483"/>`),

      marbleBust: svg(`<path d="M31 85h38l-5-15c-3-7-9-12-16-14 7-5 11-13 11-22 0-14-9-23-21-23-10 0-18 8-18 19 0 12 7 20 16 24-9 3-16 9-19 17l-4 14z" fill="#e8e2f1" stroke="#fff" stroke-width="2"/><path d="M25 28c6 3 14 2 21-4" fill="none" stroke="#b9a7cf" stroke-width="3"/><path d="M42 39c5 2 9 1 12-2" fill="none" stroke="#b9a7cf" stroke-width="2"/>`),
      neonCrt: svg(`<rect x="14" y="20" width="72" height="52" rx="8" fill="#251046" stroke="#ff7ae7" stroke-width="3"/><rect x="21" y="27" width="51" height="38" rx="5" fill="#0d1c42" stroke="#5ee7ff" stroke-width="2"/><path d="M24 55l12-12 10 8 12-16 11 20" fill="none" stroke="#ff75e9" stroke-width="3"/><circle cx="78" cy="35" r="3" fill="#ffe36b"/><circle cx="78" cy="47" r="3" fill="#5ee7ff"/><path d="M36 73v9M64 73v9M28 84h44" stroke="#c8b3ff" stroke-width="5" stroke-linecap="round"/>`),
      chromeColumn: svg(`<path d="M32 16h36l-4 8h-28zM36 24h28v53H36zM29 77h42l5 9H24z" fill="#e9e5ff" stroke="#fff" stroke-width="2"/><path d="M42 28v45M51 28v45M60 28v45" stroke="#a98fd0" stroke-width="3"/>`),
      cassette: svg(`<rect x="13" y="22" width="74" height="55" rx="7" fill="#35135f" stroke="#ff79e9" stroke-width="3"/><rect x="23" y="31" width="54" height="27" rx="5" fill="#0b1539" stroke="#5fe5ff" stroke-width="2"/><circle cx="37" cy="44" r="8" fill="#ffcf5b"/><circle cx="63" cy="44" r="8" fill="#ff7bdc"/><circle cx="37" cy="44" r="3" fill="#1c0b39"/><circle cx="63" cy="44" r="3" fill="#1c0b39"/><path d="M29 67h42l-7 8H36z" fill="#8eefff"/>`),
      neonPalm: svg(`<path d="M51 30c-4 22-2 40 5 57" fill="none" stroke="#64e8ff" stroke-width="7" stroke-linecap="round"/><g fill="none" stroke="#ff74e8" stroke-width="6" stroke-linecap="round"><path d="M50 31C33 17 20 19 11 27"/><path d="M51 31C66 13 79 16 90 23"/><path d="M51 31C37 7 27 8 20 11"/><path d="M52 31C68 4 82 8 90 13"/></g>`),
      gridBall: svg(`<circle cx="50" cy="50" r="32" fill="#1a0d45" stroke="#5ee7ff" stroke-width="3"/><path d="M19 50h62M50 18v64M26 31c14 12 34 12 48 0M26 69c14-12 34-12 48 0M31 24c12 18 12 34 0 52M69 24c-12 18-12 34 0 52" fill="none" stroke="#ff75e9" stroke-width="2"/>`),

      wobbleChair: svg(`<path d="M18 36c0-13 10-22 23-22h19c13 0 22 9 22 22v26H18z" fill="#ff6f91" stroke="#292742" stroke-width="4"/><path d="M27 61c9 11 37 11 46 0" fill="#ffcf3e" stroke="#292742" stroke-width="4"/><path d="M27 69l-9 18M73 69l9 18" stroke="#292742" stroke-width="6" stroke-linecap="round"/>`),
      zigLamp: svg(`<path d="M26 83h48" stroke="#292742" stroke-width="7" stroke-linecap="round"/><path d="M50 80V60L35 48l24-18-15-17" fill="none" stroke="#4ee4c2" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M31 20h39l-9 24H40z" fill="#ffcf3e" stroke="#292742" stroke-width="4"/>`),
      springToy: svg(`<path d="M17 79h66" stroke="#292742" stroke-width="7" stroke-linecap="round"/><path d="M49 75c-29-9 29-16 0-25s29-16 0-25" fill="none" stroke="#ff6f91" stroke-width="8" stroke-linecap="round"/><circle cx="49" cy="18" r="12" fill="#4ee4c2" stroke="#292742" stroke-width="4"/>`),
      faceClock: svg(`<circle cx="50" cy="48" r="34" fill="#fff3c4" stroke="#292742" stroke-width="5"/><circle cx="39" cy="42" r="4" fill="#292742"/><circle cx="62" cy="42" r="4" fill="#292742"/><path d="M36 59c8 8 20 8 28 0M50 48V26M50 48l16 8" fill="none" stroke="#292742" stroke-width="4" stroke-linecap="round"/>`),
      shapeBlock: svg(`<path d="M14 68l18-42 27 21 25-22 3 49-39 13z" fill="#4ee4c2" stroke="#292742" stroke-width="4"/><circle cx="33" cy="53" r="10" fill="#ffcf3e"/><path d="M58 47l20 22H48z" fill="#ff6f91"/>`),
      confettiVase: svg(`<path d="M31 18h38l-8 19 9 45H30l9-45z" fill="#f7f1d5" stroke="#292742" stroke-width="4"/><circle cx="42" cy="49" r="5" fill="#ff6f91"/><rect x="53" y="56" width="10" height="10" fill="#4ee4c2" transform="rotate(18 58 61)"/><path d="M35 69l15-18 17 23" fill="none" stroke="#ffcf3e" stroke-width="6"/>`),

      exitSign: svg(`<rect x="13" y="25" width="74" height="45" rx="4" fill="#354a32" stroke="#e8ffd1" stroke-width="3"/><text x="50" y="54" text-anchor="middle" fill="#eaffd4" font-size="21" font-family="system-ui" font-weight="800">EXIT</text><path d="M24 76h52" stroke="#81784e" stroke-width="5"/>`),
      rollingChair: svg(`<path d="M26 20h48v37H26z" fill="#67603f" stroke="#d2c47a" stroke-width="3"/><path d="M36 57h28l-3 17H39zM50 74v10M31 88h38" fill="none" stroke="#c2b56f" stroke-width="5" stroke-linecap="round"/><circle cx="27" cy="88" r="5" fill="#332f20"/><circle cx="73" cy="88" r="5" fill="#332f20"/>`),
      fluorescent: svg(`<rect x="11" y="35" width="78" height="24" rx="5" fill="#81794e" stroke="#d7cd85" stroke-width="3"/><rect x="19" y="41" width="62" height="12" rx="6" fill="#fffbd1" style="filter:drop-shadow(0 0 8px #fff7a8)"/>`),
      carpetCube: svg(`<path d="M50 12l34 18v39L50 88 16 69V30z" fill="#8c8256" stroke="#d2c87f" stroke-width="3"/><path d="M16 30l34 20 34-20M50 50v38" fill="none" stroke="#6a6344" stroke-width="3"/><path d="M27 27l34 20M39 20l34 20" stroke="#b4aa70" opacity=".7"/>`),
      cooler: svg(`<path d="M32 20h36l-4 20H36z" fill="#dbe7d0" stroke="#8d8c65" stroke-width="3"/><rect x="29" y="40" width="42" height="44" rx="5" fill="#b7b39a" stroke="#777453" stroke-width="3"/><circle cx="42" cy="57" r="4" fill="#5f6f7c"/><circle cx="58" cy="57" r="4" fill="#8c5b4e"/><path d="M40 72h20" stroke="#e8e4bf" stroke-width="5"/>`),
      doorToken: svg(`<rect x="29" y="12" width="43" height="76" fill="#716b47" stroke="#c8bc72" stroke-width="4"/><circle cx="62" cy="51" r="4" fill="#e4d981"/><path d="M22 88h57" stroke="#5b5639" stroke-width="6"/>`),

      jukebox: svg(`<path d="M25 86V42c0-19 11-31 25-31s25 12 25 31v44z" fill="#31102a" stroke="#f3fbff" stroke-width="3"/><path d="M32 41c0-14 7-22 18-22s18 8 18 22z" fill="#49dbe8" stroke="#ff477d" stroke-width="3"/><rect x="33" y="48" width="34" height="28" rx="7" fill="#ff477d"/><path d="M39 56h22M39 64h22" stroke="#ffe36b" stroke-width="4"/><circle cx="50" cy="35" r="7" fill="#ffe36b"/>`),
      milkshake: svg(`<path d="M30 28h40l-7 49H37z" fill="#f4e6ef" stroke="#9ceefa" stroke-width="3"/><path d="M34 40h32" stroke="#ff477d" stroke-width="8"/><path d="M44 77v9M32 89h36" stroke="#d7eef3" stroke-width="5" stroke-linecap="round"/><path d="M50 27C42 19 46 10 54 10c9 0 12 9 5 17" fill="#ff8bae"/><path d="M62 30l14-19" stroke="#49dbe8" stroke-width="4"/>`),
      chromeStool: svg(`<ellipse cx="50" cy="25" rx="29" ry="13" fill="#ff477d" stroke="#f6ffff" stroke-width="3"/><path d="M35 34l-8 49M65 34l8 49M30 65h40" fill="none" stroke="#dbeef2" stroke-width="6" stroke-linecap="round"/><path d="M22 87h16M62 87h16" stroke="#8299a4" stroke-width="6" stroke-linecap="round"/>`),
      neonSign: svg(`<path d="M19 65c13-27 25-40 37-39 11 1 18 10 25 29" fill="none" stroke="#49dbe8" stroke-width="8" stroke-linecap="round" style="filter:drop-shadow(0 0 7px #49dbe8)"/><path d="M18 50c18 10 40 11 65 2" fill="none" stroke="#ff477d" stroke-width="8" stroke-linecap="round" style="filter:drop-shadow(0 0 7px #ff477d)"/><circle cx="72" cy="26" r="7" fill="#ffe36b"/>`),
      dinerRadio: svg(`<rect x="16" y="27" width="68" height="49" rx="9" fill="#273b4d" stroke="#f0fbff" stroke-width="3"/><circle cx="34" cy="52" r="14" fill="#101d2b" stroke="#49dbe8" stroke-width="3"/><path d="M26 52h16M34 44v16" stroke="#ff477d" stroke-width="2"/><rect x="55" y="39" width="20" height="7" rx="3" fill="#ffe36b"/><circle cx="60" cy="61" r="5" fill="#ff477d"/><circle cx="73" cy="61" r="5" fill="#49dbe8"/>`),
      checkerTray: svg(`<ellipse cx="50" cy="73" rx="36" ry="12" fill="#d7eef2" stroke="#fff" stroke-width="3"/><path d="M28 67h44l-5-34H33z" fill="#f8eef0" stroke="#3a273b" stroke-width="3"/><path d="M34 39h32M31 49h38M29 59h42M43 34l-2 31M57 34l2 31" stroke="#33253a" stroke-width="3"/>`),

      jazzCup: svg(`<path d="M25 14h50l-9 72H34z" fill="#fffdf2" stroke="#2b2947" stroke-width="3"/><path d="M23 34l57-17M21 52l57-17M19 70l57-17" stroke="#62d9c8" stroke-width="9"/><path d="M23 42l56-17M21 60l56-17M19 78l56-17" stroke="#6d3b88" stroke-width="7"/>`),
      squiggleLamp: svg(`<path d="M18 86h64" stroke="#292743" stroke-width="7" stroke-linecap="round"/><path d="M51 82C22 65 80 54 50 38S79 13 50 9" fill="none" stroke="#67e6cf" stroke-width="8" stroke-linecap="round"/><path d="M31 13h38l-8 24H39z" fill="#ffcb55" stroke="#292743" stroke-width="4"/>`),
      terrazzoBlock: svg(`<path d="M15 25l36-14 35 20-5 48-37 11-31-23z" fill="#f5e5c7" stroke="#292743" stroke-width="4"/><circle cx="35" cy="39" r="6" fill="#ff6f8d"/><rect x="57" y="27" width="11" height="7" fill="#67e6cf" transform="rotate(22 62 31)"/><path d="M27 67l13-10 9 13 16-18 11 15" fill="none" stroke="#b791ff" stroke-width="6"/>`),
      triangleClock: svg(`<path d="M50 12l40 71H10z" fill="#ffcb55" stroke="#292743" stroke-width="4"/><circle cx="50" cy="56" r="18" fill="#fff6dc" stroke="#292743" stroke-width="3"/><path d="M50 56V43M50 56l11 6" stroke="#292743" stroke-width="4" stroke-linecap="round"/>`),
      tubeChair: svg(`<path d="M20 55c0-21 13-35 31-35 19 0 30 13 30 35v24H20z" fill="#b791ff" stroke="#292743" stroke-width="4"/><path d="M27 58c12 8 35 8 47 0" fill="none" stroke="#67e6cf" stroke-width="9"/><path d="M31 79v10M68 79v10" stroke="#292743" stroke-width="6" stroke-linecap="round"/>`),
      patternVase: svg(`<path d="M29 15h42l-9 22 10 48H28l10-48z" fill="#f7e8ca" stroke="#292743" stroke-width="4"/><path d="M34 46c15-17 22 16 34 0M32 64c13-17 24 16 37 0" fill="none" stroke="#67e6cf" stroke-width="7"/><circle cx="50" cy="31" r="6" fill="#ff6f8d"/>`)
    };

    const themes = {
      frutiger:{name:'Frutiger Aero',description:'Optimistic natural technology with bright sky, clear water, living greenery, polished glass and playful eco-futurism.',districts:['Horizon Vista','Aqua Atrium','Cloud Garden'],left:'Horizon Garden',right:'Aqua Atrium',weather:['Mostly Sunny','Bubble Shower','Spring Rain'],temp:'24°C',detail:'Soft breeze • 12% humidity',playlist:'Aero Skyline Mix',track:'Ocean Drive',artist:'Theme ambience',selectedCopy:'Natural technology, clear water, sky, glass and hopeful eco-futurism.',selectedWeather:'Sun, bubbles, spring rain',selectedObjects:'Cloud chair, eco globe, leaf terminal',palette:['#71f5cf','#61baff','#cbff72'],scene:'frutiger',mascot:'Aero Buddy',kit:['aero-orb','cloud-chair','leaf-terminal','eco-globe','water-lamp','sun-seed']},
      vaporwave:{name:'Vaporwave',description:'A neon oceanfront workspace with mirrored marble, CRT media, endless sunsets, grids and soft surreal nostalgia.',districts:['Neon Riviera','Marble Mall','CRT Penthouse'],left:'Sunset Arcade',right:'Marble Lounge',weather:['Digital Sunset','Neon Rain','Pixel Fog'],temp:'28°C',detail:'Synthetic breeze • 88 BPM',playlist:'Mallsoft After Dark',track:'Private Caller',artist:'Vaporwave radio',selectedCopy:'Neon nostalgia, marble, chrome, CRT glow and impossible coastal architecture.',selectedWeather:'Neon rain, pixel fog, sunset haze',selectedObjects:'Marble bust, CRT, chrome column',palette:['#ff75e9','#58ddff','#ffd061'],scene:'vaporwave',mascot:'Chrome Koi',kit:['marble-bust','neon-crt','chrome-column','cassette','neon-palm','grid-ball']},
      pomo:{name:'Wacky Pomo',description:'Playful postmodern rooms with oversized furniture, toy physics, loud geometry and cheerful visual surprises.',districts:['Playhouse 96','Geometry Garden','Toy Office'],left:'Shape Workshop',right:'Bounce Lounge',weather:['Confetti Sun','Rubber Rain','Color Burst'],temp:'22°C',detail:'Bouncy air • 64% delight',playlist:'Wacky Pomo Party',track:'Plastic Fantastic',artist:'Playroom FM',selectedCopy:'Postmodern playfulness, geometric furniture, toys, color blocking and friendly chaos.',selectedWeather:'Confetti, rubber rain, color bursts',selectedObjects:'Wobble chair, spring toy, face clock',palette:['#ffcf3e','#4ee4c2','#ff6f91'],scene:'pomo',mascot:'Shape Sprite',kit:['wobble-chair','zig-lamp','spring-toy','face-clock','shape-block','confetti-vase']},
      backrooms:{name:'Liminal Backrooms',description:'Quiet fluorescent corridors, unsettling room transitions, distant hums and endless architecture that never blocks real work.',districts:['Endless Office','Poolrooms','Carpet Junction'],left:'Hallway 18B',right:'Quiet Annex',weather:['Fluorescent Hum','Dust Drift','Distant Drip'],temp:'19°C',detail:'Still air • Exit unknown',playlist:'Liminal Leisure',track:'Fluorescent Memory',artist:'Empty office ambience',selectedCopy:'Endless transitional architecture, beige corridors, hum, distance and quiet exploration.',selectedWeather:'Dust, flicker, distant water',selectedObjects:'Exit sign, rolling chair, fluorescent light',palette:['#f3db72','#b9c86a','#ff9f62'],scene:'backrooms',mascot:'Exit Moth',kit:['exit-sign','rolling-chair','fluorescent','carpet-cube','cooler','door-token']},
      diner:{name:'Atomic Diner',description:'A chrome-and-neon midnight diner with jukebox energy, checkerboard floors, booth seating and a glowing drive-in horizon.',districts:['Midnight Drive-In','Chrome Counter','Starlight Booths'],left:'Jukebox Row',right:'Neon Booth',weather:['Clear Midnight','Warm Summer Rain','Marquee Sparkle'],temp:'21°C',detail:'Open all night • Neon clear',playlist:'Midnight Diner Radio',track:'Cherry Cola',artist:'Jukebox selection',selectedCopy:'Atomic-age chrome, neon signage, diner booths, jukeboxes and midnight road culture.',selectedWeather:'Summer rain, marquee sparkle, night haze',selectedObjects:'Jukebox, milkshake, chrome stool',palette:['#ff477d','#49dbe8','#ffe36b'],scene:'diner',mascot:'Soda Bot',kit:['jukebox','milkshake','chrome-stool','neon-sign','diner-radio','checker-tray']},
      memphis:{name:'Memphis Jazz Cup',description:'The striped retro-cup spirit expanded into a complete Memphis world of squiggles, terrazzo, playful furniture and bold graphic motion.',districts:['Solo Studio','Jazz Cup Café','Squiggle Gallery'],left:'Pattern Lab',right:'Terrazzo Lounge',weather:['Graphic Breeze','Squiggle Shower','Paper Confetti'],temp:'23°C',detail:'Pattern index • 92% playful',playlist:'Memphis Design Mix',track:'Jazz Stripe',artist:'Pattern radio',selectedCopy:'Memphis geometry, Jazz cup stripes, terrazzo, squiggles and late-80s graphic optimism.',selectedWeather:'Graphic breeze, confetti, paper rain',selectedObjects:'Jazz cup, squiggle lamp, terrazzo block',palette:['#67e6cf','#b791ff','#ffcb55'],scene:'memphis',mascot:'Squiggle Pal',kit:['jazz-cup','squiggle-lamp','terrazzo-block','triangle-clock','tube-chair','pattern-vase']}
    };

    const assetDefs = [
      ['aero-orb','frutiger','Glass Water Orb',art.aeroOrb,'Toy / decor','Dynamic','Throw, bounce, glow','Chase, tap, carry',false],
      ['cloud-chair','frutiger','Cloud Chair',art.cloudChair,'Furniture','Jointed dynamic','Sit, rock, detach cushion','Sit, nap, bounce',true],
      ['leaf-terminal','frutiger','Leaf Terminal',art.leafTerminal,'Electronics','Heavy dynamic','Power, type, unfold leaf','Watch, tap controls',true],
      ['eco-globe','frutiger','Eco Globe',art.ecoGlobe,'Knowledge object','Dynamic','Spin, inspect, weather sync','Push, follow',false],
      ['water-lamp','frutiger','Water Drop Lamp',art.waterLamp,'Lighting','Light dynamic','Glow, dim, splash pulse','Warm up, tap',true],
      ['sun-seed','frutiger','Solar Seed',art.sunSeed,'Nature toy','High bounce','Plant, throw, bloom','Fetch, carry',false],
      ['marble-bust','vaporwave','Marble Bust',art.marbleBust,'Sculpture','Heavy dynamic','Rotate, inspect, chip','Pose beside, admire',true],
      ['neon-crt','vaporwave','Neon CRT',art.neonCrt,'Electronics','Heavy dynamic','Power, tune, move antenna','Watch, press buttons',true],
      ['chrome-column','vaporwave','Chrome Column',art.chromeColumn,'Architecture','Heavy detachable','Stack, rotate, crack','Hide behind',true],
      ['cassette','vaporwave','Mallsoft Cassette',art.cassette,'Media','Light dynamic','Insert, rewind, remix','Carry, dance',false],
      ['neon-palm','vaporwave','Neon Palm',art.neonPalm,'Lighting / plant','Soft jointed','Bend, recolor, beat react','Climb, sway',false],
      ['grid-ball','vaporwave','Grid Ball',art.gridBall,'Toy','High bounce','Kick, throw, trail','Fetch, balance',false],
      ['wobble-chair','pomo','Wobble Chair',art.wobbleChair,'Furniture','Spring dynamic','Sit, wobble, tip','Bounce, nap',true],
      ['zig-lamp','pomo','Zigzag Lamp',art.zigLamp,'Lighting','Jointed','Bend, switch, reshape','Tap, climb',true],
      ['spring-toy','pomo','Spring Friend',art.springToy,'Toy','Spring physics','Stretch, bounce, fling','Play, chase',false],
      ['face-clock','pomo','Face Clock',art.faceClock,'Time object','Dynamic','Set face, spin hands, emote','Mimic, inspect',true],
      ['shape-block','pomo','Shape Block',art.shapeBlock,'Construction toy','Stackable','Stack, split, combine','Build, push',false],
      ['confetti-vase','pomo','Confetti Vase',art.confettiVase,'Decor','Light dynamic','Fill, tip, burst confetti','Hide, tap',true],
      ['exit-sign','backrooms','Exit Sign',art.exitSign,'Architecture','Detachable','Flicker, point, detach','Inspect, hide',true],
      ['rolling-chair','backrooms','Rolling Office Chair',art.rollingChair,'Furniture','Rolling dynamic','Sit, spin, roll','Ride, push',true],
      ['fluorescent','backrooms','Fluorescent Light',art.fluorescent,'Lighting','Ceiling joint','Flicker, hum, detach','Avoid, stare',true],
      ['carpet-cube','backrooms','Carpet Cube',art.carpetCube,'Liminal object','Dynamic','Stack, rotate, absorb sound','Climb, hide',false],
      ['cooler','backrooms','Water Cooler',art.cooler,'Utility','Heavy dynamic','Dispense, bubble, tip','Drink, tap',true],
      ['door-token','backrooms','Door Token',art.doorToken,'Portal object','Heavy dynamic','Unlock district, open, slam','Peek, knock',true],
      ['jukebox','diner','Neon Jukebox',art.jukebox,'Music furniture','Heavy static','Select track, glow, open panel','Dance, press buttons',true],
      ['milkshake','diner','Cherry Milkshake',art.milkshake,'Food prop','Light dynamic','Sip, spill, shake','Carry, sniff',true],
      ['chrome-stool','diner','Chrome Stool',art.chromeStool,'Furniture','Rolling / tipping','Sit, spin, slide','Sit, ride',true],
      ['neon-sign','diner','Neon Sign',art.neonSign,'Lighting','Wall joint','Write, flicker, recolor','Point, dance',true],
      ['diner-radio','diner','Tabletop Radio',art.dinerRadio,'Media','Dynamic','Tune, scan, volume','Listen, tap',true],
      ['checker-tray','diner','Checker Tray',art.checkerTray,'Tableware','Light dynamic','Stack, slide, serve','Carry, balance',true],
      ['jazz-cup','memphis','Jazz Cup',art.jazzCup,'Graphic object','Light dynamic','Fill, tip, stack','Carry, hide behind',true],
      ['squiggle-lamp','memphis','Squiggle Lamp',art.squiggleLamp,'Lighting','Flexible joint','Bend, redraw, dim','Climb, trace',true],
      ['terrazzo-block','memphis','Terrazzo Block',art.terrazzoBlock,'Construction object','Stackable','Stack, rotate, remix pattern','Push, build',false],
      ['triangle-clock','memphis','Triangle Clock',art.triangleClock,'Time object','Dynamic','Spin, reskin, chime','Inspect, mimic',true],
      ['tube-chair','memphis','Tube Chair',art.tubeChair,'Furniture','Soft dynamic','Sit, bounce, recolor','Nap, bounce',true],
      ['pattern-vase','memphis','Pattern Vase',art.patternVase,'Decor','Light dynamic','Fill, tip, repaint','Hide, tap',true]
    ];
    const assets = assetDefs.map(([id,theme,name,art,type,physics,affordances,mascot,breakable])=>({id,theme,name,art,type,physics,affordances,mascot,breakable}));
    const assetById = Object.fromEntries(assets.map(a=>[a.id,a]));
    const extraAssets = [
      {id:'sunset-vinyl',theme:'vaporwave',name:'Sunset Vinyl Record',art:svg(`<circle cx="50" cy="50" r="38" fill="#16102f" stroke="#ff76e8" stroke-width="3"/><circle cx="50" cy="50" r="25" fill="none" stroke="#5be5ff" stroke-width="1.5" opacity=".75"/><circle cx="50" cy="50" r="15" fill="#ff7bdc"/><circle cx="50" cy="50" r="5" fill="#ffe46d"/><path d="M50 12A38 38 0 0 1 88 50" fill="none" stroke="#fff" stroke-width="2" opacity=".65"/>`),type:'Music media',physics:'Light dynamic',affordances:'Play tune, spin, scratch, pin','mascot':'Dance, tap, carry',breakable:false,mediaKind:'record'},
      {id:'aero-minidisc',theme:'frutiger',name:'Aero MiniDisc',art:svg(`<rect x="17" y="17" width="66" height="66" rx="13" fill="rgba(215,255,255,.82)" stroke="#65dfff" stroke-width="3"/><circle cx="50" cy="48" r="21" fill="rgba(76,190,255,.35)" stroke="#fff" stroke-width="3"/><circle cx="50" cy="48" r="6" fill="#72f1c8"/><rect x="25" y="69" width="50" height="7" rx="3.5" fill="#88e8b8"/>`),type:'Music media',physics:'Light dynamic',affordances:'Play tune, spin, glow, pin',mascot:'Listen, carry, dance',breakable:false,mediaKind:'disc'}
    ];
    extraAssets.forEach(a=>{assets.push(a);assetById[a.id]=a});
    assets.forEach(a=>{a.stickerCapable=true;if(!a.mediaKind){if(a.id==='cassette')a.mediaKind='cassette';else if(a.id==='jukebox')a.mediaKind='jukebox';else if(a.id==='diner-radio')a.mediaKind='radio';}});

    const objectState = new Map();
    let currentTheme='frutiger',currentView='dashboard',currentMode='living',currentWorldState='interactive',currentWeather='sun',currentTimePreset='auto',currentTimeHour=new Date().getHours();
    const historyState={entries:[],index:-1,ready:false,restoring:false,max:90,lastHash:''};
    const environmentConfig={type:'3d',target:'full',preset:'cosmic',opacity:.82,speed:42,fov:72,horizon:48,floor:72,yaw:0,pitch:-5,depth:86,themeSync:true,motion:true,parallax:true,pauseHidden:true,paused:false,mapping:false,sourceName:'Procedural · Orbital Dream Station',surfaceRoles:{backdrop:'Background',plane:'Floor',left:'Window',right:'Window',display:'TV',selected:'Screen'}};

    const roomSemanticState={
      sourceName:'Aero CAS Lounge.blend', imported:true, importMode:'unified-detached', keepUnified:true, detachInteractables:true, autoPhysics:true, mascotAffordances:true, selectedId:'sofa', stage:'ready', tableAssetId:null,
      objects:[
        {id:'sofa',name:'Cloud Sofa',icon:'🛋️',role:'Couch / Seat',physics:'Static collision',interactive:true,detachable:true,visible:true,locked:false,state:'Ready for sit and bounce',actions:['Sit','Bounce','Nap','Detach cushions'],mascot:'Sit, bounce, nap and climb'},
        {id:'table',name:'Glass Coffee Table',icon:'◯',role:'Table / Surface',physics:'Static collision',interactive:true,detachable:true,visible:true,locked:false,state:'Surface anchors ready',actions:['Place objects','Stack props','Slide items','Clear surface'],mascot:'Place, push and inspect objects'},
        {id:'tv',name:'Aero Media Screen',icon:'📺',role:'TV / Screen',physics:'Kinematic articulated',interactive:true,detachable:true,visible:true,locked:false,state:'Screen off',actions:['Power on/off','Play environment','Change channel','Move antenna'],mascot:'Press power, watch and use remote'},
        {id:'lamp',name:'Waterdrop Floor Lamp',icon:'💡',role:'Lamp / Light',physics:'Kinematic articulated',interactive:true,detachable:true,visible:true,locked:false,state:'Light on',actions:['Power on/off','Dim','Color shift','Music react'],mascot:'Press switch and react to light'},
        {id:'window',name:'Horizon Window',icon:'▣',role:'Window / Portal',physics:'Static collision',interactive:true,detachable:false,visible:true,locked:false,state:'Weather-linked portal',actions:['Map environment','Sync weather','Open portal view','Close blinds'],mascot:'Look outside and react to weather'},
        {id:'door',name:'Garden Door',icon:'▯',role:'Door',physics:'Kinematic articulated',interactive:true,detachable:false,visible:true,locked:false,state:'Closed',actions:['Open/close','Use portal','Lock/unlock','Knock'],mascot:'Open, walk through and knock'},
        {id:'floor',name:'Walkable Floor',icon:'⌗',role:'Floor / Navmesh',physics:'Static collision',interactive:false,detachable:false,visible:true,locked:true,state:'Walkable navmesh generated',actions:['Walkable','Gravity plane','Bounce surface','Drop target'],mascot:'Walk, run, land and navigate'},
        {id:'wall-back',name:'Back Wall',icon:'▤',role:'Wall / Collision',physics:'Static collision',interactive:false,detachable:false,visible:true,locked:true,state:'Collision and sticker anchors ready',actions:['Collision','Sticker surface','Wall bounce','Mount objects'],mascot:'Avoid, lean and bounce soft props'},
        {id:'wall-left',name:'Left Wall',icon:'▤',role:'Wall / Collision',physics:'Static collision',interactive:false,detachable:false,visible:true,locked:true,state:'Collision boundary ready',actions:['Collision','Sticker surface','Wall bounce','Mount objects'],mascot:'Avoid and use safe lane'},
        {id:'wall-right',name:'Right Wall',icon:'▤',role:'Wall / Collision',physics:'Static collision',interactive:false,detachable:false,visible:true,locked:true,state:'Collision boundary ready',actions:['Collision','Sticker surface','Wall bounce','Mount objects'],mascot:'Avoid and use safe lane'}
      ]
    };

    const environmentStars=Array.from({length:190},(_,i)=>({x:(Math.random()-.5)*1800,y:(Math.random()-.5)*1000,z:Math.random()*1200+60,size:Math.random()*1.8+.25,seed:i}));
    let environmentRAF=0,environmentTimer=0,environmentLast=0,environmentImage=null,environmentMediaKind=null,environmentPointer={x:0,y:0},historyTimer=0,layerRefreshTimer=0;

    const transformPrefs={linked:true,snap:true,grid:8};
    let musicPlaying=false,selectedAsset=assetById[themes.frutiger.kit[0]],selectedObject=null,ambientRAF=0,ambientTimer=0,ambientLast=0,particles=[],leftWidth=18,rightWidth=18,toastTimer=0,objectId=0;
    let mascotState={x:18,y:360,vx:0,vy:0,dragging:false,moving:false,lastX:0,lastY:0,lastT:0,moved:false};
    const launcherCatalog={
      dock:[
        {id:'home',label:'Home',icon:'⌂'},{id:'explorer',label:'Aesthetic Explorer',icon:'✦'},{id:'vault',label:'Asset Vault',icon:'◇'},
        {id:'room',label:'Room Studio',icon:'▣'},{id:'music',label:'Soundtrack',icon:'♫'},{id:'focus',label:'Focus UI',icon:'⛶'},
        {id:'stage',label:'Theme Stage',icon:'◩'},{id:'performance',label:'Performance Mode',icon:'⚡'},{id:'settings',label:'Settings',icon:'⚙'},
        {id:'canvas',label:'Canvas Only',icon:'▦'}
      ],
      topbar:[
        {id:'environment',label:'Environment Studio',icon:'▧'},{id:'music',label:'Soundtrack',icon:'♫'},{id:'world',label:'World State',icon:'◫'},
        {id:'room',label:'Room Studio',icon:'▣'},{id:'stage',label:'Theme Stage',icon:'◩'},{id:'canvas',label:'Canvas Only',icon:'▦'}
      ]
    };
    const launcherDefaults={
      dockOrder:launcherCatalog.dock.map(x=>x.id),dockVisible:['home','explorer','vault','music','focus','performance','settings'],
      topbarOrder:launcherCatalog.topbar.map(x=>x.id),topbarVisible:['environment','music','world']
    };
    let uiPrefs={dockMode:'always',dockPosition:'bottom',dockSize:48,dockOpacity:78,dockMagnify:true,topbarMode:'always',railMode:'always',railPosition:'left',workbarMode:'always',worldbarMode:'always',collapseButtonsHide:true,remember:true,...JSON.parse(JSON.stringify(launcherDefaults))};
    let chromeRestoreSnapshot=null;
    let placementPrefs={mode:'world',gravity:false};
    let floatingVaultState={x:118,y:104,minimized:false};
    let audioContext=null;
    let pinId=0;
    const PIN_TARGET_SELECTOR='[data-sticker-zone],.glass-card,.quick-card,.theme-card,.workspace-frame,.workspace-head,.workspace-tabs,.workspace-footer,.topbar,.rail,.dock,.drawer.open,.floating-vault,.world';
    const UI_COLLIDER_SELECTOR='.glass-card,.quick-card,.theme-card,.workspace-head,.workspace-tabs,.workspace-footer,.topbar,.rail,.dock,.drawer.open,.floating-vault';

    function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400);}
    function addActivity(icon,title,detail='just now'){const list=$('#activityList');const row=document.createElement('div');row.className='activity';row.innerHTML=`<div class="activity-icon">${icon}</div><div><strong>${title}</strong><span>${detail}</span></div><span>›</span>`;list.prepend(row);while(list.children.length>5)list.lastElementChild.remove();}
    function populateInitialActivity(){if(!$('#activityList'))return;$('#activityList').innerHTML='';addActivity('✦','Procedural world loaded','No screenshot background');addActivity('◇','Asset Vault synchronized',`${assets.length} borderless world actors`);addActivity('◉','Theme mascot awake','Drag and throw enabled');addActivity('⌄','Studio chrome ready','Expanded, compact, hover or hidden');}

    function sceneMarkup(theme,side){
      const common={
        frutiger:`<div class="scene scene-frutiger side-${side}"><i class="aero-atmosphere"></i><i class="sun-disc"></i><i class="cloud c1"></i><i class="cloud c2"></i><i class="cloud c3"></i><i class="aero-horizon"></i><i class="hill h1"></i><i class="hill h2"></i><i class="aero-arch"></i><i class="aero-bridge"></i><i class="waterfall"></i><i class="aero-fall-far"></i><i class="water"></i><i class="aero-caustics"></i><div class="city"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><i class="aero-tower t1"></i><i class="aero-tower t2"></i><i class="aero-tree tree1"></i><i class="aero-tree tree2"></i><i class="aero-pod"></i><i class="aero-ring"></i><i class="bubble b1"></i><i class="bubble b2"></i><i class="bubble b3"></i><i class="bubble b4"></i><i class="leaf l1"></i><i class="leaf l2"></i><i class="aero-birds"></i></div>`,
        vaporwave:`<div class="scene scene-vaporwave side-${side}"><i class="v-sun"></i><i class="v-star s1"></i><i class="v-star s2"></i><i class="v-star s3"></i><i class="v-column c1"></i><i class="v-column c2"></i><i class="v-palm"></i><i class="v-water"></i><i class="v-grid"></i></div>`,
        pomo:`<div class="scene scene-pomo side-${side}"><i class="p-panel a"></i><i class="p-panel b"></i><i class="p-circle"></i><i class="p-triangle"></i><i class="p-squiggle"></i><i class="p-floor"></i></div>`,
        backrooms:`<div class="scene scene-backrooms side-${side}"><i class="b-ceiling"></i><i class="b-light l1"></i><i class="b-light l2"></i><i class="b-wall-left"></i><i class="b-wall-right"></i><i class="b-door"></i><i class="b-floor"></i></div>`,
        diner:`<div class="scene scene-diner side-${side}"><i class="d-window"></i><i class="d-neon">OPEN 24/7</i><i class="d-booth"></i><i class="d-table"></i><i class="d-chrome"></i><i class="d-floor"></i></div>`,
        memphis:`<div class="scene scene-memphis side-${side}"><i class="m-blob a"></i><i class="m-blob b"></i><i class="m-cup"></i><i class="m-triangle"></i><i class="m-dot"></i><i class="m-zig"></i></div>`
      };
      return common[theme];
    }
    function renderWorldScenery(){
      $('#leftScenery').innerHTML=sceneMarkup(currentTheme,'left');
      $('#rightScenery').innerHTML=sceneMarkup(currentTheme,'right');
      $('#leftWorld').dataset.scene=currentTheme;$('#rightWorld').dataset.scene=currentTheme;
    }

    function mascotArt(theme){
      const map={
        frutiger:svg(`<ellipse cx="50" cy="88" rx="23" ry="6" fill="#0b5f84" opacity=".22"/><path d="M50 6c19 22 31 38 31 55a31 31 0 1 1-62 0C19 44 31 28 50 6z" fill="#dffcff" stroke="#ffffff" stroke-width="3"/><path d="M50 11c12 17 22 34 22 50 0 17-9 27-24 32 20-1 34-14 34-33 0-17-12-33-32-54z" fill="#45bce9" opacity=".72"/><path d="M31 31c7-11 13-17 19-23-5 16-7 28-4 36-7-1-12-5-15-13z" fill="#ffffff" opacity=".72"/><ellipse cx="39" cy="57" rx="6" ry="7" fill="#082a49"/><ellipse cx="62" cy="57" rx="6" ry="7" fill="#082a49"/><circle cx="37" cy="54" r="2.1" fill="#fff"/><circle cx="60" cy="54" r="2.1" fill="#fff"/><ellipse cx="31" cy="66" rx="5" ry="2.6" fill="#76e7e2" opacity=".55"/><ellipse cx="69" cy="66" rx="5" ry="2.6" fill="#76e7e2" opacity=".55"/><path d="M40 71c6 6 14 6 20 0" fill="none" stroke="#147ba2" stroke-width="3" stroke-linecap="round"/><path d="M24 66c-7 2-10 8-8 13 5-1 9-4 12-8M76 66c7 2 10 8 8 13-5-1-9-4-12-8" fill="#8feef2" stroke="#fff" stroke-width="2"/><path d="M40 88c-4 5-8 6-12 4M60 88c4 5 8 6 12 4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`),
        vaporwave:svg(`<path d="M18 44l10-27 18 17h10l18-17 9 28-7 38H25z" fill="#dcd6ff" stroke="#ff78e9" stroke-width="3"/><path d="M26 30l15 12M74 30L59 42" stroke="#5fe6ff" stroke-width="5"/><circle cx="40" cy="55" r="6" fill="#16103c"/><circle cx="62" cy="55" r="6" fill="#16103c"/><path d="M43 69h15" stroke="#ffcf5b" stroke-width="4" stroke-linecap="round"/>`),
        pomo:svg(`<circle cx="49" cy="48" r="31" fill="#ffcf3e" stroke="#292743" stroke-width="4"/><rect x="19" y="57" width="24" height="29" rx="8" fill="#4ee4c2" stroke="#292743" stroke-width="4" transform="rotate(9 31 71)"/><path d="M59 65l25 10-18 17z" fill="#ff6f91" stroke="#292743" stroke-width="4"/><circle cx="39" cy="43" r="5" fill="#292743"/><circle cx="60" cy="43" r="5" fill="#292743"/><path d="M39 59c8 6 15 6 22 0" fill="none" stroke="#292743" stroke-width="4"/>`),
        backrooms:svg(`<path d="M27 18h46l7 58-30 16-31-16z" fill="#d8ce83" stroke="#5e5938" stroke-width="4"/><path d="M35 31h30v22H35z" fill="#fffbd1" style="filter:drop-shadow(0 0 6px #fff7a3)"/><circle cx="40" cy="68" r="4" fill="#393522"/><circle cx="61" cy="68" r="4" fill="#393522"/><path d="M43 80h15" stroke="#393522" stroke-width="3"/>`),
        diner:svg(`<path d="M25 21h50l-5 63H30z" fill="#eaf8fb" stroke="#49dbe8" stroke-width="3"/><path d="M29 42h42" stroke="#ff477d" stroke-width="11"/><circle cx="50" cy="18" r="9" fill="#ff477d"/><circle cx="40" cy="60" r="5" fill="#152438"/><circle cx="61" cy="60" r="5" fill="#152438"/><path d="M41 74c6 4 12 4 18 0" fill="none" stroke="#152438" stroke-width="3"/>`),
        memphis:svg(`<path d="M23 18h54l-8 67H31z" fill="#fff9e8" stroke="#292743" stroke-width="4"/><path d="M20 37l62-18M18 56l62-18M16 75l62-18" stroke="#67e6cf" stroke-width="8"/><path d="M25 46l55-16M23 65l55-16" stroke="#6f3e88" stroke-width="6"/><circle cx="41" cy="63" r="4" fill="#292743"/><circle cx="59" cy="58" r="4" fill="#292743"/>`)
      };
      return map[theme];
    }
    function renderMascot(reset=true){const t=themes[currentTheme];$('#mascotArt').innerHTML=mascotArt(currentTheme);$('#mascotLabel').textContent=t.mascot;$('#mascot').title=`${t.mascot}: drag, throw or click`;if(reset){mascotState.x=8;mascotState.y=Math.max(86,$('#leftWorld').clientHeight*.34);updateMascot();}}
    function updateMascot(){const m=$('#mascot');m.style.left=`${mascotState.x}px`;m.style.top=`${mascotState.y}px`;}
    function clampMascot(){const world=$('#leftWorld');mascotState.x=clamp(mascotState.x,0,Math.max(0,world.clientWidth-92));mascotState.y=clamp(mascotState.y,72,Math.max(74,world.clientHeight-112));}
    function animateMascot(){if(!mascotState.moving||mascotState.dragging||!['living','stage'].includes(currentMode)||currentWorldState!=='interactive'){mascotState.moving=false;return;}const world=$('#leftWorld'),maxX=Math.max(0,world.clientWidth-92),maxY=Math.max(74,world.clientHeight-112);mascotState.vy+=.18;mascotState.x+=mascotState.vx;mascotState.y+=mascotState.vy;if(mascotState.x<0){mascotState.x=0;mascotState.vx*=-.7}if(mascotState.x>maxX){mascotState.x=maxX;mascotState.vx*=-.7}if(mascotState.y<72){mascotState.y=72;mascotState.vy*=-.65}if(mascotState.y>maxY){mascotState.y=maxY;mascotState.vy*=-.52;mascotState.vx*=.86}mascotState.vx*=.985;mascotState.vy*=.985;updateMascot();if(Math.abs(mascotState.vx)+Math.abs(mascotState.vy)<.18&&mascotState.y>=maxY-1){mascotState.moving=false;return;}requestAnimationFrame(animateMascot);}
    function bindMascot(){const m=$('#mascot');m.dataset.bound='true';m.addEventListener('pointerdown',e=>{if(!['living','stage'].includes(currentMode)||currentWorldState!=='interactive')return;e.preventDefault();m.setPointerCapture(e.pointerId);mascotState.dragging=true;mascotState.moving=false;mascotState.moved=false;mascotState.vx=mascotState.vy=0;mascotState.lastX=e.clientX;mascotState.lastY=e.clientY;mascotState.lastT=performance.now();m.classList.add('dragging');});m.addEventListener('pointermove',e=>{if(!mascotState.dragging)return;const now=performance.now(),dt=Math.max(8,now-mascotState.lastT),dx=e.clientX-mascotState.lastX,dy=e.clientY-mascotState.lastY;mascotState.x+=dx;mascotState.y+=dy;mascotState.vx=dx/dt*18;mascotState.vy=dy/dt*18;mascotState.lastX=e.clientX;mascotState.lastY=e.clientY;mascotState.lastT=now;mascotState.moved ||= Math.abs(dx)+Math.abs(dy)>2;clampMascot();updateMascot();});const release=()=>{if(!mascotState.dragging)return;mascotState.dragging=false;m.classList.remove('dragging');if(mascotState.moved){mascotState.moving=true;animateMascot();addActivity('◉',`${themes[currentTheme].mascot} moved`,'Direct manipulation');}else{m.classList.add('dance');setTimeout(()=>{if(!musicPlaying)m.classList.remove('dance')},900);toast(`${themes[currentTheme].mascot} says hello`);}};m.addEventListener('pointerup',release);m.addEventListener('pointercancel',release);}

    function fillSelects(){$('#themeSelect').innerHTML=Object.entries(themes).map(([id,t])=>`<option value="${id}">${t.name}</option>`).join('');$('#secondaryTheme').innerHTML=Object.entries(themes).map(([id,t])=>`<option value="${id}">${t.name}</option>`).join('');$('#secondaryTheme').value='vaporwave';}
    function updateDistricts(){const t=themes[currentTheme];$('#districtSelect').innerHTML=t.districts.map(d=>`<option>${d}</option>`).join('');$('#districtChip').textContent=t.districts[0];$('#weatherDistrict').textContent=t.districts[0];$('#leftDistrict').textContent=t.left;$('#rightDistrict').textContent=t.right;$('#districtCount').textContent=t.districts.length;}
    function renderThemeGrid(filter=''){const term=filter.trim().toLowerCase();$('#themeGrid').innerHTML=Object.entries(themes).filter(([,t])=>!term||`${t.name} ${t.description}`.toLowerCase().includes(term)).map(([id,t])=>`<button class="theme-card ${id===currentTheme?'active':''}" data-theme-card="${id}"><div class="theme-scene scene-${t.scene}">${sceneMarkup(id,'preview')}</div><div class="theme-info"><strong>${t.name}</strong><span>${t.description}</span><div class="swatches">${t.palette.map(c=>`<i style="background:${c}"></i>`).join('')}</div></div></button>`).join('');$$('[data-theme-card]').forEach(btn=>btn.addEventListener('click',()=>setTheme(btn.dataset.themeCard,true)));}
    function assetCardMarkup(a,compact=false){return `<article class="asset-card ${a.id===selectedAsset.id?'active':''}" draggable="true" data-asset="${a.id}"><span class="asset-theme-tag">${themes[a.theme].name}</span><div class="asset-preview">${a.art}</div><strong>${a.name}</strong><span>${a.type}${a.mediaKind?' • playable':''}</span>${compact?'':`<div class="asset-actions"><button data-add-left="${a.id}">Left</button><button data-add-right="${a.id}">Right</button></div>`}</article>`;}
    function bindAssetCards(root=document){$$('[data-asset]',root).forEach(card=>{card.addEventListener('click',e=>{if(!e.target.closest('button'))selectAsset(card.dataset.asset)});card.addEventListener('dragstart',e=>{e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('application/x-feature-foundry-asset',card.dataset.asset);e.dataTransfer.setData('application/x-feature-foundry-placement',placementPrefs.mode);document.body.dataset.assetDragging='true';});card.addEventListener('dragend',()=>{delete document.body.dataset.assetDragging;clearDropGlow();});});$$('[data-add-left]',root).forEach(b=>b.addEventListener('click',()=>spawnObject('left',assetById[b.dataset.addLeft])));$$('[data-add-right]',root).forEach(b=>b.addEventListener('click',()=>spawnObject('right',assetById[b.dataset.addRight])));}
    function filteredAssets(filter=''){const term=filter.trim().toLowerCase();return [...assets].sort((a,b)=>(a.theme===currentTheme?-1:1)-(b.theme===currentTheme?-1:1)).filter(a=>!term||`${a.name} ${a.type} ${a.affordances} ${themes[a.theme].name} ${a.mediaKind||''}`.toLowerCase().includes(term));}
    function renderAssetGrid(filter=''){const grid=$('#assetGrid');if(!grid)return;grid.innerHTML=filteredAssets(filter).map(a=>assetCardMarkup(a,false)).join('');bindAssetCards(grid);renderFloatingAssetGrid($('#floatingAssetSearch')?.value||'');}
    function renderFloatingAssetGrid(filter=''){const grid=$('#floatingAssetGrid');if(!grid)return;grid.innerHTML=filteredAssets(filter).map(a=>assetCardMarkup(a,true)).join('');bindAssetCards(grid);}
    function selectAsset(id){selectedAsset=assetById[id]||assets[0];$('#assetTitle').textContent=selectedAsset.name;$('#assetDescription').textContent=`A real ${selectedAsset.type.toLowerCase()} actor from the ${themes[selectedAsset.theme].name} world kit.`;$('#assetType').textContent=selectedAsset.type;$('#assetPhysics').textContent=selectedAsset.physics;$('#assetAffordances').textContent=selectedAsset.affordances;$('#assetMascot').textContent=selectedAsset.mascot;updateObjectAtlas();renderAssetGrid($('#assetSearch')?.value||'');}

    function setTheme(id,notify=false){if(!themes[id])return;currentTheme=id;document.body.dataset.theme=id;$('#themeSelect').value=id;const t=themes[id];t.palette.forEach((c,i)=>document.documentElement.style.setProperty(`--accent${i?'-'+(i+1):''}`,c));$('#heroTheme').textContent=t.name;$('#heroDescription').textContent=t.description+' The work UI stays authoritative while every surrounding world asset, district, mascot and motion language changes with the aesthetic.';$('#weatherBig').textContent=t.temp;$('#weatherLabel').textContent=t.weather[0];$('#weatherTop').textContent=`${t.temp} ${t.weather[0]}`;$('#weatherDetail').textContent=t.detail;$('#playlistName').textContent=t.playlist;$('#trackName').textContent=t.track;$('#trackArtist').textContent=t.artist;$('#selectedThemeTitle').textContent=t.name;$('#selectedThemeCopy').textContent=t.selectedCopy;$('#selectedDistricts').textContent=t.districts.join(', ');$('#selectedWeather').textContent=t.selectedWeather;$('#selectedObjects').textContent=t.selectedObjects;$('#selectedPlaylist').textContent=t.playlist;$('#colorAccent').value=t.palette[0];$('#colorAccent2').value=t.palette[1];$('#colorAccent3').value=t.palette[2];updateDistricts();refreshWeatherSelect();setWeather(currentWeather,false);setTimePreset(currentTimePreset,false);renderWorldScenery();renderMascot(true);selectedAsset=assetById[t.kit[0]];renderThemeGrid($('#themeSearch').value);renderAssetGrid($('#assetSearch').value);selectAsset(selectedAsset.id);resetRoom(false);resetParticles();if(notify){toast(`${t.name}: complete world kit loaded`);addActivity('✦',`Switched to ${t.name}`,`${t.districts[0]} • unique scene + objects + mascot`);}}
    function setView(view){if(!$('#view-'+view))return;currentView=view;$$('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+view));$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));const labels={dashboard:'Living Dashboard',explorer:'Aesthetic Explorer',vault:'Asset Vault',room:'Room Studio',themeLab:'Theme Lab'};$('#workspaceName').textContent=labels[view]||view;if(view==='room')$('#selectedObjectText').textContent=selectedObject?`${selectedObject.asset.name} • ${objectScopeLabel(selectedObject)}`:'Select an object anywhere in the world or UI.';}
    function setMode(mode,notify=true){currentMode=mode;document.body.dataset.mode=mode;$$('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));const map={living:['Living runtime','Particles + local physics active','World runtime active','60','Living workspace restored'],focus:['Focused UI','World paused, themed UI active','World suspended','60','Focused Full UI enabled'],stage:['Theme Stage','Unified full-width world + editable side lanes','Continuous world preview active','60','Theme Stage enabled'],performance:['Performance runtime','World renderer and physics stopped','Heavy runtime unmounted','0 world','Performance Mode enabled']};const m=map[mode];$('#perfState').textContent=m[0];$('#perfDetail').textContent=m[1];$('#runtimeState').textContent=m[2];$('#fpsMetric').textContent=m[3];if(['living','stage'].includes(mode)&&currentWorldState!=='off')startAmbient();else stopAmbient();if(notify){toast(m[4]);addActivity(mode==='performance'?'⚡':mode==='stage'?'◩':'⛶',m[4],mode==='stage'?'World fills the window; controls remain available':'Workspace state preserved');}}
    function setWorldState(state,notify=true){currentWorldState=state;document.body.dataset.world=state;$$('[data-world-state]').forEach(b=>b.classList.toggle('active',b.dataset.worldState===state));$('#worldStateMetric').textContent=state==='interactive'?'Play':state==='decor'?'Decor':'Off';if(['living','stage'].includes(currentMode)&&state!=='off')startAmbient();else stopAmbient();if(notify)toast(`World state: ${state==='interactive'?'Interactive Play Area':state==='decor'?'Decor Only':'Off'}`);}
    function applyWorldColumns(){const shell=$('#shell');if(!shell)return;const centerMin=worldLayout==='split'?'520px':'300px';shell.style.gridTemplateColumns=`minmax(0,${leftWidth}vw) minmax(${centerMin},1fr) minmax(0,${rightWidth}vw)`;}
    function updateWidths(l=leftWidth,r=rightWidth){leftWidth=Number(l);rightWidth=Number(r);document.documentElement.style.setProperty('--left-world',`${leftWidth}vw`);document.documentElement.style.setProperty('--right-world',`${rightWidth}vw`);applyWorldColumns();['leftWidth','drawerLeftWidth'].forEach(id=>$('#'+id).value=leftWidth);['rightWidth','drawerRightWidth'].forEach(id=>$('#'+id).value=rightWidth);['leftWidthValue','drawerLeftValue'].forEach(id=>$('#'+id).textContent=`${leftWidth}%`);['rightWidthValue','drawerRightValue'].forEach(id=>$('#'+id).textContent=`${rightWidth}%`);resizeCanvases();clampMascot();updateMascot();refreshPremiumRanges();}
    function openDrawer(title='Layout & performance'){$('#drawerTitle').textContent=title;$('#drawer').classList.add('open');}
    function closeDrawer(){$('#drawer').classList.remove('open');}

    function ensureTransformState(s){
      if(!s)return null;
      if(!Number.isFinite(s.scaleX))s.scaleX=1;
      if(!Number.isFinite(s.scaleY))s.scaleY=1;
      if(!Number.isFinite(s.opacity))s.opacity=1;
      if(!s.blendMode)s.blendMode='normal';
      if(typeof s.locked!=='boolean')s.locked=false;
      if(!Number.isFinite(s.zIndex))s.zIndex=s.id||1;
      if(!Number.isFinite(s.skewX))s.skewX=0;if(!Number.isFinite(s.skewY))s.skewY=0;
      if(!Number.isFinite(s.brightness))s.brightness=1;if(!Number.isFinite(s.contrast))s.contrast=1;if(!Number.isFinite(s.saturation))s.saturation=1;
      if(!Number.isFinite(s.hue))s.hue=0;if(!Number.isFinite(s.blur))s.blur=0;if(typeof s.visible!=='boolean')s.visible=true;if(!s.anchor)s.anchor='mc';
      if(!Number.isFinite(s.dragTilt))s.dragTilt=0;
      if(!Number.isFinite(s.motionRotation))s.motionRotation=0;
      if(!Number.isFinite(s.physicsEpoch))s.physicsEpoch=0;
      if(!Number.isFinite(s.physicsRaf))s.physicsRaf=0;
      if(typeof s.restingOnSurface!=='boolean')s.restingOnSurface=false;
      if(typeof s.gravityAfterPeel!=='boolean')s.gravityAfterPeel=!!s.gravity;
      return s;
    }
    function normalizeDegrees(v){let n=Number(v)||0;n=((n+180)%360+360)%360-180;return Math.round(n*10)/10;}
    function objectSurfaceBounds(s){
      if(s?.scope==='world')return {width:s.el.parentElement?.clientWidth||innerWidth,height:s.el.parentElement?.clientHeight||innerHeight};
      return {width:innerWidth,height:innerHeight};
    }
    function syncTransformInspector(){
      const s=ensureTransformState(selectedObject),panel=$('#transformPanel'),controls=$$('[data-transform-control]');
      panel?.classList.toggle('is-empty',!s);controls.forEach(c=>c.disabled=!s);
      if(!s){if($('#transformTarget'))$('#transformTarget').textContent='Select a placed object';refreshPremiumRanges(panel||document);return;}
      $('#transformTarget').textContent=`${s.asset.name} · ${objectScopeLabel(s)}`;
      $('#transformX').value=Math.round(s.x);$('#transformY').value=Math.round(s.y);
      $('#transformRotation').value=normalizeDegrees(s.rotation);$('#transformRotationNumber').value=Math.round(s.rotation*10)/10;
      $('#transformScaleX').value=Math.round(Math.abs(s.scaleX)*100);$('#transformScaleY').value=Math.round(Math.abs(s.scaleY)*100);
      $('#transformOpacity').value=Math.round(s.opacity*100);$('#transformOpacityNumber').value=Math.round(s.opacity*100);
      $('#transformBlend').value=s.blendMode;
      $('#transformLink').classList.toggle('active',transformPrefs.linked);
      $('#transformFlipX').classList.toggle('active',s.scaleX<0);$('#transformFlipY').classList.toggle('active',s.scaleY<0);
      $('#transformLock').classList.toggle('active',s.locked);$('#transformLock').textContent=s.locked?'🔓 Unlock':'🔒 Lock';
      const effectiveGravity=s.scope==='sticker'?!!s.gravityAfterPeel:!!s.gravity;$('#transformGravity').classList.toggle('active',effectiveGravity);$('#transformGravity').textContent=s.scope==='sticker'?(effectiveGravity?'After Peel On':'After Peel Off'):(effectiveGravity?'Gravity On':'Gravity Off');
      $('#transformPeel').disabled=s.scope!=='sticker';
      $('#transformSkewX').value=Math.round(s.skewX*10)/10;$('#transformSkewY').value=Math.round(s.skewY*10)/10;
      $('#transformBrightness').value=Math.round(s.brightness*100);$('#transformBrightnessValue').textContent=`${Math.round(s.brightness*100)}%`;
      $('#transformContrast').value=Math.round(s.contrast*100);$('#transformContrastValue').textContent=`${Math.round(s.contrast*100)}%`;
      $('#transformSaturation').value=Math.round(s.saturation*100);$('#transformSaturationValue').textContent=`${Math.round(s.saturation*100)}%`;
      $('#transformHue').value=Math.round(s.hue);$('#transformHueValue').textContent=`${Math.round(s.hue)}°`;
      $('#transformBlur').value=s.blur;$('#transformBlurValue').textContent=`${s.blur}px`;
      $$('[data-anchor]').forEach(b=>b.classList.toggle('active',b.dataset.anchor===s.anchor));
      refreshPremiumRanges(panel||document);
    }
    function commitTransform(s=selectedObject,{save=true}={}){if(!s)return;ensureTransformState(s);clampObject(s);updateObjectTransform(s);if(selectedObject===s)syncTransformInspector();if(save)saveScrapbookState();scheduleStudioRefresh();}
    function setSelectedPosition(x,y){const s=selectedObject;if(!s)return;s.x=Number.isFinite(Number(x))?Number(x):s.x;s.y=Number.isFinite(Number(y))?Number(y):s.y;if(s.scope==='sticker'&&s.pinTarget){const r=s.pinTarget.getBoundingClientRect();s.pinX=clamp((s.x+s.el.offsetWidth/2-r.left)/Math.max(1,r.width),0,1);s.pinY=clamp((s.y+s.el.offsetHeight/2-r.top)/Math.max(1,r.height),0,1);}commitTransform(s);}
    function setSelectedRotation(value){if(!selectedObject)return;selectedObject.rotation=Number(value)||0;commitTransform(selectedObject);}
    function setSelectedScale(axis,value){const s=selectedObject;if(!s)return;const sign=axis==='x'?(s.scaleX<0?-1:1):(s.scaleY<0?-1:1),v=clamp((Number(value)||100)/100,.05,8)*sign;if(axis==='x'){s.scaleX=v;if(transformPrefs.linked)s.scaleY=Math.abs(v)*(s.scaleY<0?-1:1);}else{s.scaleY=v;if(transformPrefs.linked)s.scaleX=Math.abs(v)*(s.scaleX<0?-1:1);}commitTransform(s);}
    function setSelectedOpacity(value){if(!selectedObject)return;selectedObject.opacity=clamp((Number(value)||0)/100,0,1);commitTransform(selectedObject);}
    function setSelectedBlend(value){if(!selectedObject)return;selectedObject.blendMode=value||'normal';commitTransform(selectedObject);}
    function flipSelected(axis){const s=selectedObject;if(!s)return;if(axis==='x')s.scaleX*=-1;else s.scaleY*=-1;commitTransform(s);}
    function nudgeSelected(dx,dy,step=1){const s=selectedObject;if(!s||s.locked)return;s.x+=dx*step;s.y+=dy*step;commitTransform(s);}
    function centerSelected(){const s=selectedObject;if(!s)return;const b=objectSurfaceBounds(s);s.x=(b.width-s.el.offsetWidth)/2;s.y=(b.height-s.el.offsetHeight)/2;if(s.scope==='sticker'&&s.pinTarget){const r=s.pinTarget.getBoundingClientRect();s.pinX=.5;s.pinY=.5;s.x=r.left+r.width/2-s.el.offsetWidth/2;s.y=r.top+r.height/2-s.el.offsetHeight/2;}commitTransform(s);toast(`${s.asset.name} centered`);}
    function fitSelectedToView(){const s=selectedObject;if(!s)return;const b=objectSurfaceBounds(s),base=Math.max(s.el.offsetWidth,s.el.offsetHeight),fit=clamp(Math.min((b.width-24)/base,(b.height-24)/base),.05,3);s.scaleX=fit*(s.scaleX<0?-1:1);s.scaleY=fit*(s.scaleY<0?-1:1);commitTransform(s);toast(`${s.asset.name} fitted to the visible surface`);}
    function resetSelectedTransform(){const s=selectedObject;if(!s)return;s.rotation=0;s.scaleX=1;s.scaleY=1;s.opacity=1;s.blendMode='normal';s.skewX=0;s.skewY=0;s.brightness=1;s.contrast=1;s.saturation=1;s.hue=0;s.blur=0;s.visible=true;s.anchor='mc';s.locked=false;commitTransform(s);toast(`${s.asset.name} transform reset`);}
    function rescueSelected(){const s=selectedObject;if(!s)return;cancelObjectPhysics(s,{zeroVelocity:true,settle:false});if(s.scope==='sticker'){s.scope='ui';s.pinTarget=null;s.pinTargetId=null;s.pinTargetKey=null;s.el.classList.remove('sticker-object');s.el.dataset.scope='ui';}s.locked=false;s.gravity=false;s.gravityAfterPeel=false;s.rotation=normalizeDegrees(s.rotation);s.scaleX=clamp(Math.abs(s.scaleX||1),.2,2.5);s.scaleY=clamp(Math.abs(s.scaleY||1),.2,2.5);s.opacity=1;s.blendMode='normal';s.skewX=0;s.skewY=0;s.brightness=1;s.contrast=1;s.saturation=1;s.hue=0;s.blur=0;s.visible=true;s.anchor='mc';s.x=innerWidth/2-s.el.offsetWidth/2;s.y=Math.max(86,innerHeight/2-s.el.offsetHeight/2);bringSelectedToFront();settleObjectOrientation(s,{instant:true});commitTransform(s);toast(`${s.asset.name} recovered to the center of the UI`);}
    function layerPeers(s){return [...objectState.values()].filter(o=>o.el.parentElement===s.el.parentElement);}
    function setSelectedLayer(action){const s=selectedObject;if(!s)return;const peers=layerPeers(s);if(action==='front')s.zIndex=Math.max(...peers.map(o=>ensureTransformState(o).zIndex),0)+1;else if(action==='back')s.zIndex=Math.min(...peers.map(o=>ensureTransformState(o).zIndex),1)-1;else s.zIndex+=action==='up'?1:-1;commitTransform(s);}
    function bringSelectedToFront(){setSelectedLayer('front');}
    function toggleSelectedLock(s=selectedObject){if(!s)return;ensureTransformState(s);s.locked=!s.locked;s.el.classList.toggle('locked',s.locked);commitTransform(s);toast(`${s.asset.name} ${s.locked?'locked':'unlocked'}`);}
    function bindTransformGizmo(s){
      const el=s.el,rot=$('.rotate-handle',el);let gesture=null;
      const startRotate=e=>{if(s.locked)return;e.preventDefault();e.stopPropagation();const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;gesture={type:'rotate',cx,cy,startAngle:Math.atan2(e.clientY-cy,e.clientX-cx),startRotation:s.rotation};rot.setPointerCapture(e.pointerId);setSelectedObject(s);};
      rot.addEventListener('pointerdown',startRotate);rot.addEventListener('pointermove',e=>{if(!gesture||gesture.type!=='rotate')return;const a=Math.atan2(e.clientY-gesture.cy,e.clientX-gesture.cx);s.rotation=gesture.startRotation+(a-gesture.startAngle)*180/Math.PI;if(!e.altKey&&transformPrefs.snap)s.rotation=Math.round(s.rotation/15)*15;commitTransform(s,{save:false});});
      const end=()=>{if(!gesture)return;gesture=null;commitTransform(s);};rot.addEventListener('pointerup',end);rot.addEventListener('pointercancel',end);
      $$('.transform-handle',el).forEach(handle=>{handle.addEventListener('pointerdown',e=>{if(s.locked)return;e.preventDefault();e.stopPropagation();const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;gesture={type:'scale',cx,cy,startDistance:Math.max(8,Math.hypot(e.clientX-cx,e.clientY-cy)),sx:s.scaleX,sy:s.scaleY};handle.setPointerCapture(e.pointerId);setSelectedObject(s);});handle.addEventListener('pointermove',e=>{if(!gesture||gesture.type!=='scale')return;const ratio=clamp(Math.hypot(e.clientX-gesture.cx,e.clientY-gesture.cy)/gesture.startDistance,.05,8);s.scaleX=gesture.sx*ratio;s.scaleY=gesture.sy*ratio;if(!e.altKey&&transformPrefs.snap){s.scaleX=Math.round(s.scaleX*20)/20;s.scaleY=Math.round(s.scaleY*20)/20;}commitTransform(s,{save:false});});handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);});
    }
    function setSelectedObject(state){selectedObject=state;$$('.world-object').forEach(el=>el.classList.toggle('selected',state&&el.dataset.objectId===String(state.id)));if(state){ensureTransformState(state);state.el.classList.toggle('locked',state.locked)}const text=state?`${state.asset.name} • ${objectScopeLabel(state)}`:'No object selected.';$('#drawerObject').textContent=text;$('#selectedObjectText').textContent=text;$('#drawerPhysics').textContent=state?(state.moving?'Awake':state.gravity?'Sleeping':'Gravity off'):'Sleeping';$('#drawerIntegrity').textContent=state?`${state.integrity}%`:'100%';$('#drawerAffordance').textContent=state?state.asset.affordances:'Select an object';$('#drawerScope').textContent=state?objectScopeLabel(state):'World restricted';$('#drawerGravity').textContent=state?(state.gravity?'On':'Off'):'On';syncTransformInspector();scheduleStudioRefresh();positionSelectedSurfaceCanvas();}
    function damageObject(s,amount){s.integrity=Math.max(0,s.integrity-amount);if(s.integrity<45)s.el.classList.add('broken');if(selectedObject===s)$('#drawerIntegrity').textContent=`${s.integrity}%`;if(s.integrity===0){s.moving=false;toast(`${s.asset.name} broke. Repair it in Room Studio.`);addActivity('⚠',`${s.asset.name} broke`,'Material-aware damage event');}}
    function interactObject(s){setSelectedObject(s);const actions=s.asset.affordances.split(','),action=actions[Math.floor(Math.random()*actions.length)].trim();s.el.querySelector('.object-visual').animate([{transform:'scale(1) rotate(0)'},{transform:'scale(1.18) rotate(-8deg)'},{transform:'scale(1) rotate(0)'}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});toast(`${s.asset.name}: ${action}`);addActivity('◉',`${s.asset.name} interaction`,action);}
    function removeSelected(){if(!selectedObject)return;selectedObject.el.remove();objectState.delete(selectedObject.id);const name=selectedObject.asset.name;selectedObject=null;setSelectedObject(null);$('#objectCount').textContent=objectState.size;toast(`${name} removed`);}
    function repairSelected(){if(!selectedObject){toast('Select an object first');return;}selectedObject.integrity=100;selectedObject.el.classList.remove('broken');setSelectedObject(selectedObject);toast(`${selectedObject.asset.name} repaired`);}
    function duplicateSelected(){if(!selectedObject){toast('Select an object first');return;}spawnObject(selectedObject.side,selectedObject.asset,selectedObject.x+18,Math.max(20,selectedObject.y-18));}
    function resetRoom(notify=true){objectState.forEach(s=>s.el.remove());objectState.clear();selectedObject=null;objectId=0;const kit=themes[currentTheme].kit.map(id=>assetById[id]);const left=$('#leftObjects'),right=$('#rightObjects'),lh=Math.max(500,left.clientHeight),rh=Math.max(500,right.clientHeight);spawnObject('left',kit[0],18,lh*.52,false);spawnObject('left',kit[1],Math.max(70,left.clientWidth*.45),lh*.64,false);spawnObject('left',kit[2],Math.max(25,left.clientWidth*.18),lh*.78,false);spawnObject('right',kit[3],18,rh*.51,false);spawnObject('right',kit[4],Math.max(65,right.clientWidth*.44),rh*.65,false);spawnObject('right',kit[5],Math.max(25,right.clientWidth*.18),rh*.79,false);$('#objectCount').textContent=objectState.size;setSelectedObject(null);if(notify)toast(`${themes[currentTheme].name} room kit restored`);}


    function objectScopeLabel(s){return s?.scope==='sticker'?'Pinned scrapbook sticker':s?.scope==='ui'?'Whole UI actor':'World restricted';}
    function objectCanInteract(s){if(!s)return false;if(s.scope==='world')return ['living','stage'].includes(currentMode)&&currentWorldState==='interactive';return currentWorldState!=='off';}
    function objectToolsMarkup(){return `<div class="object-mini-tools"><button class="tool-transform" title="Open precision transform">✥</button><button class="tool-lock" title="Lock / unlock object">🔒</button><button class="tool-pin" title="Pin as sticker">⌖</button><button class="tool-peel" title="Peel / unpin">↗</button><button class="tool-gravity" title="Toggle gravity">G</button><button class="tool-play" title="Play / interact">♫</button></div>`;}
    function transformGizmoMarkup(){return `<div class="transform-gizmo" aria-hidden="true"><span class="rotate-stem"></span><button class="rotate-handle" title="Drag to rotate"></button><button class="transform-handle" data-corner="nw" title="Drag to resize"></button><button class="transform-handle" data-corner="ne" title="Drag to resize"></button><button class="transform-handle" data-corner="sw" title="Drag to resize"></button><button class="transform-handle" data-corner="se" title="Drag to resize"></button></div>`;}
    function objectScreenCenter(s){const r=s?.el?.getBoundingClientRect?.();return r?{x:r.left+r.width/2,y:r.top+r.height/2}:{x:innerWidth/2,y:innerHeight/2};}
    function cancelObjectPhysics(s,{zeroVelocity=true,settle=false}={}){if(!s)return;ensureTransformState(s);if(s.physicsRaf)cancelAnimationFrame(s.physicsRaf);s.physicsRaf=0;s.physicsEpoch=(s.physicsEpoch||0)+1;s.moving=false;s.restingOnSurface=false;if(zeroVelocity){s.vx=0;s.vy=0;}if(settle)settleObjectOrientation(s);}
    function cancelObjectPeel(s){if(!s)return;ensureTransformState(s);if(s.peelTimer)clearTimeout(s.peelTimer);s.peelTimer=0;s.peeling=false;s.el?.classList.remove('peeling');}
    function startObjectPhysics(s){if(!s)return;ensureTransformState(s);if(window.__ffRuntimeGovernor?.isSuspended()){s.physicsRaf=0;s.moving=false;return;}if(s.scope==='sticker'||!s.gravity||!objectCanInteract(s)){cancelObjectPhysics(s,{zeroVelocity:true,settle:true});return;}s.vx=clamp(Number(s.vx)||0,-16,16);s.vy=clamp(Number(s.vy)||0,-16,16);s.moving=true;animateObject(s);startObjectHudTracking();}
    function makeObjectElement(asset,id,scope){const el=document.createElement('div');el.className='world-object';el.dataset.objectId=id;el.dataset.scope=scope;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',`${asset.name}. Right-click or press Shift+F10 for actor actions.`);el.innerHTML=`<div class="object-visual">${asset.art}</div><div class="object-name">${asset.name}</div>${objectToolsMarkup()}${transformGizmoMarkup()}`;return el;}
    function setSelectedObject(state){selectedObject=state;$$('.world-object').forEach(el=>el.classList.toggle('selected',state&&el.dataset.objectId===String(state.id)));const text=state?`${state.asset.name} • ${objectScopeLabel(state)}`:'No object selected.';$('#drawerObject').textContent=text;$('#selectedObjectText').textContent=text;$('#drawerPhysics').textContent=state?(state.moving?'Awake':state.gravity?'Sleeping':'Gravity off'):'Sleeping';$('#drawerIntegrity').textContent=state?`${state.integrity}%`:'100%';$('#drawerAffordance').textContent=state?state.asset.affordances:'Select an object';$('#drawerScope').textContent=state?objectScopeLabel(state):'World restricted';$('#drawerGravity').textContent=state?(state.gravity?'On':'Off'):'On';}
    function spawnObject(side,asset,x=null,y=null,notify=true,options={}){if(!asset)return;if(side==='ui'||options.scope==='ui'||options.scope==='sticker')return spawnUiObject(asset,x,y,{...options,notify});const layer=side==='left'?$('#leftObjects'):$('#rightObjects'),rect=layer.getBoundingClientRect(),id=++objectId,el=makeObjectElement(asset,id,'world');const px=x??Math.max(4,Math.random()*Math.max(20,rect.width-96)),py=y??Math.max(80,rect.height*.48+Math.random()*Math.max(20,rect.height*.25)),gravity=options.gravity??placementPrefs.gravity;layer.appendChild(el);const state={id,el,asset,side,scope:'world',gravity:Boolean(gravity),gravityAfterPeel:Boolean(gravity),x:px,y:py,vx:0,vy:0,rotation:0,integrity:100,moving:false,dragging:false,lastX:0,lastY:0,lastT:0,moved:false,pinTarget:null,scaleX:1,scaleY:1,opacity:1,blendMode:'normal',locked:false,zIndex:id,dragTilt:0,motionRotation:0,physicsRaf:0,physicsEpoch:0,restingOnSurface:false,peelTimer:0,peeling:false};objectState.set(id,state);updateObjectTransform(state);bindObject(state);clampObject(state);$('#objectCount').textContent=objectState.size;if(notify){toast(`${asset.name} added to ${side} world${state.gravity?' with gravity':' at rest'}`);addActivity('◇',`Added ${asset.name}`,`${themes[asset.theme].name} actor • world restricted`);}return state;}
    function spawnUiObject(asset,x=null,y=null,{scope='ui',gravity=scope==='ui'?placementPrefs.gravity:false,target=null,notify=true}={}){if(!asset)return;const id=++objectId,el=makeObjectElement(asset,id,scope),px=x??Math.max(90,innerWidth*.5-44),py=y??Math.max(90,innerHeight*.45-44),requestedGravity=Boolean(gravity);$('#uiObjectLayer').appendChild(el);const state={id,el,asset,side:'ui',scope,gravity:scope==='sticker'?false:requestedGravity,gravityAfterPeel:requestedGravity,x:px,y:py,vx:0,vy:0,rotation:0,integrity:100,moving:false,dragging:false,lastX:0,lastY:0,lastT:0,moved:false,pinTarget:null,pinX:.5,pinY:.5,scaleX:1,scaleY:1,opacity:1,blendMode:'normal',locked:false,zIndex:id,dragTilt:0,motionRotation:0,physicsRaf:0,physicsEpoch:0,restingOnSurface:false,peelTimer:0,peeling:false};objectState.set(id,state);updateObjectTransform(state);bindObject(state);if(scope==='sticker')pinObjectToTarget(state,px+44,py+44,target);else clampObject(state);$('#objectCount').textContent=objectState.size;if(notify){toast(scope==='sticker'?`${asset.name} stuck into the scrapbook UI`:`${asset.name} placed across the whole UI${state.gravity?' with gravity':' at rest'}`);addActivity(scope==='sticker'?'✎':'◇',scope==='sticker'?`Pinned ${asset.name}`:`Placed ${asset.name} into UI`,objectScopeLabel(state));}return state;}
    function updateObjectTransform(s){ensureTransformState(s);if(s.scope==='sticker'&&s.pinTarget&&!s.dragging)updatePinnedObject(s);s.el.style.setProperty('--x',`${s.x}px`);s.el.style.setProperty('--y',`${s.y}px`);s.el.style.setProperty('--r',`${s.rotation}deg`);s.el.style.setProperty('--drag-tilt',`${s.dragTilt}deg`);s.el.style.setProperty('--motion-r',`${s.motionRotation}deg`);s.el.style.setProperty('--sx',s.scaleX);s.el.style.setProperty('--sy',s.scaleY);s.el.style.setProperty('--skx',`${s.skewX}deg`);s.el.style.setProperty('--sky',`${s.skewY}deg`);s.el.style.setProperty('--object-opacity',s.opacity);s.el.style.setProperty('--object-blend',s.blendMode);s.el.style.setProperty('--object-z',s.zIndex);s.el.style.setProperty('--object-brightness',s.brightness);s.el.style.setProperty('--object-contrast',s.contrast);s.el.style.setProperty('--object-saturation',s.saturation);s.el.style.setProperty('--object-hue',`${s.hue}deg`);s.el.style.setProperty('--object-blur',`${s.blur}px`);s.el.style.setProperty('--object-visibility',s.visible?'visible':'hidden');s.el.style.transformOrigin=anchorToOrigin(s.anchor);s.el.classList.toggle('locked',s.locked);s.el.classList.toggle('dragging',!!s.dragging);s.el.dataset.scope=s.scope;}
    function settleObjectOrientation(s,{instant=false}={}){if(!s)return;ensureTransformState(s);const hadTransient=Math.abs(s.dragTilt)>0.01||Math.abs(s.motionRotation)>0.01;s.dragging=false;s.el.classList.remove('dragging');clearTimeout(s.orientationSettleTimer);if(hadTransient&&!instant){s.el.classList.add('settling');void s.el.offsetWidth;}s.dragTilt=0;s.motionRotation=0;updateObjectTransform(s);if(hadTransient&&!instant)s.orientationSettleTimer=setTimeout(()=>s.el.classList.remove('settling'),360);else s.el.classList.remove('settling');}

    function bindObject(s){const el=s.el;if(el.dataset.bound==='true')return;el.dataset.bound='true';el.addEventListener('pointerdown',e=>{if(e.button!==0)return;if(e.target.closest('.object-mini-tools,.transform-gizmo'))return;if(!objectCanInteract(s))return;if(s.locked){setSelectedObject(s);toast(`${s.asset.name} is locked. Unlock it in Precision Transform.`);return;}e.preventDefault();el.setPointerCapture(e.pointerId);ensureTransformState(s);cancelObjectPhysics(s,{zeroVelocity:true,settle:false});clearTimeout(s.orientationSettleTimer);el.classList.remove('settling');s.dragging=true;s.el.classList.add('dragging');s.moved=false;s.dragTilt=0;s.motionRotation=0;s.lastX=e.clientX;s.lastY=e.clientY;s.lastT=performance.now();if(s.scope==='sticker'){s.pinTarget=null;s.el.classList.remove('sticker-object');}setSelectedObject(s);updateObjectTransform(s);});el.addEventListener('pointermove',e=>{if(!s.dragging)return;const now=performance.now(),dt=Math.max(8,now-s.lastT),dx=e.clientX-s.lastX,dy=e.clientY-s.lastY;if(Math.abs(dx)+Math.abs(dy)>2)s.moved=true;s.x+=dx;s.y+=dy;s.vx=clamp(dx/dt*18,-16,16);s.vy=clamp(dy/dt*18,-16,16);const targetTilt=clamp(dx*.42+dy*.08,-8,8);s.dragTilt=s.dragTilt*.48+targetTilt*.52;s.lastX=e.clientX;s.lastY=e.clientY;s.lastT=now;clampObject(s);updateObjectTransform(s);});const release=e=>{if(!s.dragging)return;s.dragging=false;el.classList.remove('dragging');if(s.moved&&transformPrefs.snap&&!e?.altKey&&s.scope!=='sticker'){s.x=Math.round(s.x/transformPrefs.grid)*transformPrefs.grid;s.y=Math.round(s.y/transformPrefs.grid)*transformPrefs.grid;}if(s.scope==='sticker'){cancelObjectPhysics(s,{zeroVelocity:true,settle:false});settleObjectOrientation(s);const p=objectScreenCenter(s);pinObjectToTarget(s,e?.clientX??p.x,e?.clientY??p.y);}else if(s.gravity){if(!s.moved){s.vx=0;s.vy=0;}s.dragTilt=0;s.motionRotation=clamp(s.vx*.35,-7,7);updateObjectTransform(s);startObjectPhysics(s);}else{cancelObjectPhysics(s,{zeroVelocity:true,settle:false});settleObjectOrientation(s);}commitTransform(s);};el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('click',()=>{setSelectedObject(s);if(!s.moved&&s.asset.mediaKind)playMediaObject(s);});el.addEventListener('dblclick',()=>interactObject(s));el.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();setSelectedObject(s);openActorContextMenu(s,e.clientX,e.clientY,{opener:el,keyboard:false});});el.addEventListener('keydown',e=>{if((e.shiftKey&&e.key==='F10')||e.key==='ContextMenu'){e.preventDefault();const r=el.getBoundingClientRect();setSelectedObject(s);openActorContextMenu(s,r.left+r.width/2,r.top+r.height/2,{opener:el,keyboard:true});return;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();setSelectedObject(s);duplicateSelected();setTimeout(()=>recordHistory(`Duplicated ${s.asset.name}`),40);}else if(e.key==='Delete'&&!s.locked){e.preventDefault();setSelectedObject(s);removeSelected();setTimeout(()=>recordHistory(`Removed ${s.asset.name}`),40);}});$('.tool-transform',el).addEventListener('click',e=>{e.stopPropagation();setSelectedObject(s);openFloatingVault();setTimeout(()=>$('#transformRotation')?.focus(),80)});$('.tool-lock',el).addEventListener('click',e=>{e.stopPropagation();setSelectedObject(s);toggleSelectedLock(s)});$('.tool-pin',el).addEventListener('click',e=>{e.stopPropagation();const p=objectScreenCenter(s);pinObjectToTarget(s,p.x,p.y)});$('.tool-peel',el).addEventListener('click',e=>{e.stopPropagation();peelSticker(s)});$('.tool-gravity',el).addEventListener('click',e=>{e.stopPropagation();toggleSelectedGravity(s)});$('.tool-play',el).addEventListener('click',e=>{e.stopPropagation();interactObject(s)});bindTransformGizmo(s);}

    function clampObject(s){if(s.scope==='world'){const layer=s.el.parentElement,maxX=Math.max(0,layer.clientWidth-s.el.offsetWidth),maxY=Math.max(0,layer.clientHeight-s.el.offsetHeight-10);s.x=clamp(s.x,0,maxX);s.y=clamp(s.y,0,maxY);}else{s.x=clamp(s.x,0,Math.max(0,innerWidth-s.el.offsetWidth));s.y=clamp(s.y,0,Math.max(0,innerHeight-s.el.offsetHeight));}}
    function rectsOverlap(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
    function resolveUICollisions(s){const w=s.el.offsetWidth,h=s.el.offsetHeight,a={left:s.x,top:s.y,right:s.x+w,bottom:s.y+h};s.restingOnSurface=false;const hits=[];for(const target of $$(UI_COLLIDER_SELECTOR)){if(target===s.el||target.contains(s.el)||!target.offsetParent)continue;const b=target.getBoundingClientRect();if(b.width<50||b.height<32||!rectsOverlap(a,b))continue;const pen={left:a.right-b.left,right:b.right-a.left,top:a.bottom-b.top,bottom:b.bottom-a.top},m=Math.min(pen.left,pen.right,pen.top,pen.bottom);hits.push({target,b,pen,m});}if(!hits.length)return 0;hits.sort((x,y)=>x.m-y.m||x.b.width*x.b.height-y.b.width*y.b.height);const {b,pen,m}=hits[0];let impact=0;if(m===pen.top&&s.vy>=0){s.y=b.top-h-1;impact=Math.abs(s.vy);if(impact<2.2){s.vy=0;s.vx*=.76;s.restingOnSurface=true;}else{s.vy*=-.48;s.vx*=.9;}}else if(m===pen.bottom&&s.vy<0){s.y=b.bottom+1;impact=Math.abs(s.vy);s.vy*=-.48;}else if(m===pen.left&&s.vx>=0){s.x=b.left-w-1;impact=Math.abs(s.vx);s.vx*=-.54;}else{s.x=b.right+1;impact=Math.abs(s.vx);s.vx*=-.54;}return impact;}
    function animateObject(s){if(!s)return;ensureTransformState(s);if(s.physicsRaf)return;if(!s.moving||!objectCanInteract(s)||s.scope==='sticker'||!s.gravity){cancelObjectPhysics(s,{zeroVelocity:true,settle:true});return;}const epoch=++s.physicsEpoch;const step=()=>{s.physicsRaf=0;if(epoch!==s.physicsEpoch||!s.moving||!s.el?.isConnected||!objectCanInteract(s)||s.scope==='sticker'||!s.gravity){if(epoch===s.physicsEpoch)cancelObjectPhysics(s,{zeroVelocity:true,settle:true});return;}ensureTransformState(s);s.restingOnSurface=false;if(s.scope==='world'){const layer=s.el.parentElement,maxX=Math.max(0,layer.clientWidth-s.el.offsetWidth),maxY=Math.max(0,layer.clientHeight-s.el.offsetHeight-10);s.vy=clamp(s.vy+.3,-16,16);s.x+=s.vx;s.y+=s.vy;s.motionRotation=clamp(s.motionRotation+s.vx*.07,-14,14);let impact=0;if(s.x<0){impact=Math.max(impact,Math.abs(s.vx));s.x=0;s.vx*=-.5;s.motionRotation*=-.55}if(s.x>maxX){impact=Math.max(impact,Math.abs(s.vx));s.x=maxX;s.vx*=-.5;s.motionRotation*=-.55}if(s.y<0){impact=Math.max(impact,Math.abs(s.vy));s.y=0;s.vy*=-.42;s.motionRotation*=-.5}if(s.y>maxY){impact=Math.max(impact,Math.abs(s.vy));s.y=maxY;if(impact<2.2){s.vy=0;s.vx*=.72;s.restingOnSurface=true;}else{s.vy*=-.42;s.vx*=.78;s.motionRotation*=-.4}}s.vx*=.975;s.vy*=.982;s.motionRotation*=.94;if(impact>12&&s.asset.breakable)damageObject(s,Math.min(30,Math.round(impact*1.35)));updateObjectTransform(s);const quiet=Math.abs(s.vx)+Math.abs(s.vy)<.2;if(quiet&&s.restingOnSurface){cancelObjectPhysics(s,{zeroVelocity:true,settle:true});if(selectedObject===s)$('#drawerPhysics').textContent='Sleeping';saveScrapbookState();return;}}else{s.vy=clamp(s.vy+.28,-16,16);s.x+=s.vx;s.y+=s.vy;s.motionRotation=clamp(s.motionRotation+s.vx*.06,-12,12);let impact=resolveUICollisions(s),maxX=Math.max(0,innerWidth-s.el.offsetWidth),maxY=Math.max(0,innerHeight-s.el.offsetHeight);if(s.x<0){impact=Math.max(impact,Math.abs(s.vx));s.x=0;s.vx*=-.54;s.motionRotation*=-.55}if(s.x>maxX){impact=Math.max(impact,Math.abs(s.vx));s.x=maxX;s.vx*=-.54;s.motionRotation*=-.55}if(s.y<0){impact=Math.max(impact,Math.abs(s.vy));s.y=0;s.vy*=-.48;s.motionRotation*=-.5}if(s.y>maxY){impact=Math.max(impact,Math.abs(s.vy));s.y=maxY;if(impact<2.2){s.vy=0;s.vx*=.74;s.restingOnSurface=true;}else{s.vy*=-.44;s.vx*=.8;s.motionRotation*=-.4}}s.vx*=.974;s.vy*=.982;s.motionRotation*=.94;if(impact>13&&s.asset.breakable)damageObject(s,Math.min(28,Math.round(impact*1.25)));updateObjectTransform(s);const quiet=Math.abs(s.vx)+Math.abs(s.vy)<.2;if(quiet&&s.restingOnSurface){cancelObjectPhysics(s,{zeroVelocity:true,settle:true});saveScrapbookState();return;}}if(selectedObject===s)$('#drawerPhysics').textContent='Awake';s.physicsRaf=requestAnimationFrame(step);};s.physicsRaf=requestAnimationFrame(step);}

    function pinTargetKey(target){if(!target)return null;if(target.id)return `#${target.id}`;const view=target.closest('.view');if(view?.id){const list=$$(PIN_TARGET_SELECTOR,view),index=list.indexOf(target);return `#${view.id}::${index}`;}const list=$$(PIN_TARGET_SELECTOR),index=list.indexOf(target);return `@root::${index}`;}
    function resolvePinTargetKey(key){if(!key)return null;if(key.startsWith('#')&&key.includes('::')){const [viewKey,indexText]=key.split('::'),view=$(viewKey);return view?$$(PIN_TARGET_SELECTOR,view)[Number(indexText)]||null:null;}if(key.startsWith('#'))return $(key);if(key.startsWith('@root::'))return $$(PIN_TARGET_SELECTOR)[Number(key.split('::')[1])]||null;return null;}
    function findPinTargetAt(x,y,preferred=null){if(preferred)return preferred;const actor=selectedObject?.el;if(actor)actor.style.pointerEvents='none';const hit=document.elementFromPoint(clamp(x,1,innerWidth-1),clamp(y,1,innerHeight-1));if(actor)actor.style.pointerEvents='';return hit?.closest?.(PIN_TARGET_SELECTOR)||$('.workspace-frame');}
    function pinObjectToTarget(s,cx=null,cy=null,preferred=null){if(!s)return;const center=objectScreenCenter(s);cx=Number.isFinite(cx)?cx:center.x;cy=Number.isFinite(cy)?cy:center.y;const target=findPinTargetAt(cx,cy,preferred);if(!target)return;ensureTransformState(s);cancelObjectPeel(s);const gravityAfterPeel=s.scope==='sticker'?!!s.gravityAfterPeel:!!s.gravity;cancelObjectPhysics(s,{zeroVelocity:true,settle:false});target.dataset.pinId=target.dataset.pinId||`pin-${++pinId}`;const r=target.getBoundingClientRect();s.scope='sticker';s.side='ui';s.gravity=false;s.gravityAfterPeel=gravityAfterPeel;s.dragging=false;s.dragTilt=0;s.motionRotation=0;s.pinTarget=target;s.pinTargetId=target.dataset.pinId;s.pinTargetKey=pinTargetKey(target);s.pinX=clamp((cx-r.left)/Math.max(1,r.width),0,1);s.pinY=clamp((cy-r.top)/Math.max(1,r.height),0,1);if(s.el.parentElement!==$('#uiObjectLayer'))$('#uiObjectLayer').appendChild(s.el);s.el.classList.add('sticker-object','sticking');s.el.dataset.scope='sticker';updatePinnedObject(s);settleObjectOrientation(s,{instant:true});setTimeout(()=>s.el?.classList.remove('sticking'),680);setSelectedObject(s);saveScrapbookState();toast(`${s.asset.name} pinned to ${target.classList.contains('floating-vault')?'Asset Vault':'UI surface'}`);}
    function updatePinnedObject(s){if(!s.pinTarget&&s.pinTargetKey)s.pinTarget=resolvePinTargetKey(s.pinTargetKey);if(!s.pinTarget&&s.pinTargetId)s.pinTarget=$(`[data-pin-id="${s.pinTargetId}"]`);if(!s.pinTarget)return;const r=s.pinTarget.getBoundingClientRect(),visible=r.width>2&&r.height>2&&getComputedStyle(s.pinTarget).display!=='none';s.el.classList.toggle('pin-host-hidden',!visible);if(!visible)return;s.x=r.left+r.width*s.pinX-s.el.offsetWidth/2;s.y=r.top+r.height*s.pinY-s.el.offsetHeight/2;clampObject(s);}
    function updatePinnedObjects(){objectState.forEach(s=>{if(s.scope==='sticker')updateObjectTransform(s)});}
    function peelSticker(s=selectedObject,{testOnly=false}={}){if(!s||s.scope!=='sticker'){toast('Select a pinned sticker first');return;}ensureTransformState(s);if(s.peeling&&!testOnly)return;const oldName=s.asset.name;s.peeling=true;s.el.classList.add('peeling');if(testOnly){s.peeling=false;return;}const useGravity=!!s.gravityAfterPeel;cancelObjectPhysics(s,{zeroVelocity:true,settle:false});if(s.peelTimer)clearTimeout(s.peelTimer);s.peelTimer=setTimeout(()=>{s.peelTimer=0;if(!s.el?.isConnected){s.peeling=false;return;}s.el.classList.remove('peeling','sticker-object','pin-host-hidden');s.scope='ui';s.pinTarget=null;s.pinTargetId=null;s.pinTargetKey=null;s.gravity=useGravity;s.x+=16;s.y-=18;s.el.dataset.scope='ui';clampObject(s);setSelectedObject(s);s.peeling=false;if(useGravity){s.vx=1.1;s.vy=-1.3;s.moving=true;startObjectPhysics(s);}else{cancelObjectPhysics(s,{zeroVelocity:true,settle:true});updateObjectTransform(s);}saveScrapbookState();toast(`${oldName} peeled free with gravity ${useGravity?'on':'off'}`);},450);}
    function toggleSelectedGravity(s=selectedObject){if(!s){toast('Select an object first');return;}ensureTransformState(s);if(s.scope==='sticker'){s.gravityAfterPeel=!s.gravityAfterPeel;s.gravity=false;cancelObjectPhysics(s,{zeroVelocity:true,settle:true});setSelectedObject(s);saveScrapbookState();toast(`${s.asset.name} gravity after peel ${s.gravityAfterPeel?'enabled':'disabled'}; sticker remains pinned`);return;}s.gravity=!s.gravity;if(s.gravity){s.vx=0;s.vy=0;s.moving=true;startObjectPhysics(s);}else{cancelObjectPhysics(s,{zeroVelocity:true,settle:true});clampObject(s);updateObjectTransform(s);}setSelectedObject(s);saveScrapbookState();toast(`${s.asset.name} gravity ${s.gravity?'enabled':'disabled and motion stopped'}`);}
    function moveSelectedToUI(){if(!selectedObject){toast('Select an object first');return;}const s=selectedObject,r=s.el.getBoundingClientRect(),wasSticker=s.scope==='sticker',desiredGravity=wasSticker?!!s.gravityAfterPeel:!!s.gravity;cancelObjectPhysics(s,{zeroVelocity:true,settle:false});if(s.el.parentElement!==$('#uiObjectLayer'))$('#uiObjectLayer').appendChild(s.el);s.scope='ui';s.side='ui';s.x=r.left;s.y=r.top;s.gravity=desiredGravity;s.gravityAfterPeel=desiredGravity;s.pinTarget=null;s.pinTargetId=null;s.pinTargetKey=null;s.el.classList.remove('sticker-object');updateObjectTransform(s);setSelectedObject(s);toast(`${s.asset.name} can now interact with the entire UI${s.gravity?' with gravity':' at rest'}`);}
    function playSynth(notes=[261.63,329.63,392,523.25],wave='sine'){try{audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();const start=audioContext.currentTime+.01;notes.forEach((frequency,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=wave;osc.frequency.setValueAtTime(frequency,start+i*.11);gain.gain.setValueAtTime(.0001,start+i*.11);gain.gain.exponentialRampToValueAtTime(.07,start+i*.11+.018);gain.gain.exponentialRampToValueAtTime(.0001,start+i*.11+.18);osc.connect(gain).connect(audioContext.destination);osc.start(start+i*.11);osc.stop(start+i*.11+.2)});}catch{}}
    function mediaNotes(kind){return kind==='cassette'?[[261.63,329.63,392,493.88],'triangle']:kind==='record'?[[220,277.18,329.63,440,554.37],'sine']:kind==='disc'?[[392,493.88,587.33,783.99],'sine']:kind==='jukebox'?[[196,246.94,293.66,392,493.88],'square']:[[174.61,220,261.63,349.23],'triangle'];}
    function noteBurst(s){const burst=document.createElement('span');burst.className='music-note-burst';burst.innerHTML=['♪','♫','✦'].map((n,i)=>`<i style="--delay:${i*.1}s;--drift:${(i-1)*24}px">${n}</i>`).join('');s.el.appendChild(burst);setTimeout(()=>burst.remove(),1300);}
    function playMediaObject(s){if(!s?.asset.mediaKind)return false;const [notes,wave]=mediaNotes(s.asset.mediaKind);playSynth(notes,wave);s.el.classList.add('media-playing');if(['record','disc'].includes(s.asset.mediaKind))s.el.classList.add('media-spinning');noteBurst(s);setTimeout(()=>s.el.classList.remove('media-playing'),1500);if(s.asset.mediaKind==='disc')setTimeout(()=>s.el.classList.remove('media-spinning'),2600);toast(`${s.asset.name} plays a quick ${themes[s.asset.theme].name} tune`);addActivity('♫',`${s.asset.name} played`,`${s.asset.mediaKind} behavior from Object Atlas`);return true;}
    function interactObject(s){setSelectedObject(s);if(playMediaObject(s))return;const actions=s.asset.affordances.split(','),action=actions[Math.floor(Math.random()*actions.length)].trim();s.el.querySelector('.object-visual').animate([{transform:'scale(1) rotate(0)'},{transform:'scale(1.18) rotate(-8deg)'},{transform:'scale(1) rotate(0)'}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});toast(`${s.asset.name}: ${action}`);addActivity('◉',`${s.asset.name} interaction`,action);}
    function removeSelected(){if(!selectedObject)return;const doomed=selectedObject,name=doomed.asset.name;cancelObjectPeel(doomed);cancelObjectPhysics(doomed,{zeroVelocity:true,settle:false});doomed.el.animate([{opacity:1,transform:getComputedStyle(doomed.el).transform},{opacity:0,transform:'scale(.45) rotate(16deg)'}],{duration:260,easing:'ease-in'});setTimeout(()=>doomed.el.remove(),250);objectState.delete(doomed.id);selectedObject=null;setSelectedObject(null);$('#objectCount').textContent=objectState.size;saveScrapbookState();toast(`${name} removed`);}
    function repairSelected(){if(!selectedObject){toast('Select an object first');return;}selectedObject.integrity=100;selectedObject.el.classList.remove('broken');setSelectedObject(selectedObject);toast(`${selectedObject.asset.name} repaired`);}
    function duplicateSelected(){if(!selectedObject){toast('Select an object first');return;}const source=ensureTransformState(selectedObject),copy=source.scope==='world'?spawnObject(source.side,source.asset,source.x+18,Math.max(20,source.y-18)):spawnUiObject(source.asset,source.x+22,source.y+18,{scope:source.scope==='sticker'?'ui':source.scope,gravity:source.gravity});copy.rotation=source.rotation;copy.scaleX=source.scaleX;copy.scaleY=source.scaleY;copy.opacity=source.opacity;copy.blendMode=source.blendMode;copy.locked=false;commitTransform(copy);setSelectedObject(copy);}
    function resetRoom(notify=true){[...objectState.values()].filter(s=>s.scope==='world').forEach(s=>{cancelObjectPhysics(s,{zeroVelocity:true,settle:false});s.el.remove();objectState.delete(s.id)});if(selectedObject?.scope==='world')selectedObject=null;const kit=themes[currentTheme].kit.map(id=>assetById[id]);const left=$('#leftObjects'),right=$('#rightObjects'),lh=Math.max(500,left.clientHeight),rh=Math.max(500,right.clientHeight);spawnObject('left',kit[0],18,lh*.52,false,{gravity:false});spawnObject('left',kit[1],Math.max(70,left.clientWidth*.45),lh*.64,false,{gravity:false});spawnObject('left',kit[2],Math.max(25,left.clientWidth*.18),lh*.78,false,{gravity:false});spawnObject('right',kit[3],18,rh*.51,false,{gravity:false});spawnObject('right',kit[4],Math.max(65,right.clientWidth*.44),rh*.65,false,{gravity:false});spawnObject('right',kit[5],Math.max(25,right.clientWidth*.18),rh*.79,false,{gravity:false});$('#objectCount').textContent=objectState.size;setSelectedObject(selectedObject);if(notify)toast(`${themes[currentTheme].name} room kit restored at rest; scrapbook assets preserved`);}
    function saveScrapbookState(){try{const items=[...objectState.values()].filter(s=>s.scope!=='world').map(s=>({assetId:s.asset.id,scope:s.scope,gravity:s.gravity,gravityAfterPeel:s.gravityAfterPeel,x:s.x,y:s.y,rotation:s.rotation,scaleX:s.scaleX,scaleY:s.scaleY,opacity:s.opacity,blendMode:s.blendMode,locked:s.locked,zIndex:s.zIndex,skewX:s.skewX,skewY:s.skewY,brightness:s.brightness,contrast:s.contrast,saturation:s.saturation,hue:s.hue,blur:s.blur,visible:s.visible,anchor:s.anchor,pinTargetId:s.pinTargetId||null,pinTargetKey:s.pinTargetKey||pinTargetKey(s.pinTarget),pinX:s.pinX,pinY:s.pinY}));localStorage.setItem('ff-scrapbook-layout',JSON.stringify(items));}catch{}}
    function restoreScrapbookState(){try{const items=JSON.parse(localStorage.getItem('ff-scrapbook-layout')||'[]');items.forEach(item=>{const asset=assetById[item.assetId];if(!asset)return;const s=spawnUiObject(asset,item.x,item.y,{scope:item.scope,gravity:item.gravity,notify:false});s.gravityAfterPeel=typeof item.gravityAfterPeel==='boolean'?item.gravityAfterPeel:!!item.gravity;s.rotation=item.rotation||0;s.scaleX=Number.isFinite(item.scaleX)?item.scaleX:1;s.scaleY=Number.isFinite(item.scaleY)?item.scaleY:1;s.opacity=Number.isFinite(item.opacity)?item.opacity:1;s.blendMode=item.blendMode||'normal';s.locked=!!item.locked;s.zIndex=Number.isFinite(item.zIndex)?item.zIndex:s.id;s.skewX=item.skewX||0;s.skewY=item.skewY||0;s.brightness=Number.isFinite(item.brightness)?item.brightness:1;s.contrast=Number.isFinite(item.contrast)?item.contrast:1;s.saturation=Number.isFinite(item.saturation)?item.saturation:1;s.hue=item.hue||0;s.blur=item.blur||0;s.visible=item.visible!==false;s.anchor=item.anchor||'mc';s.pinTargetId=item.pinTargetId;s.pinTargetKey=item.pinTargetKey;s.pinX=item.pinX??.5;s.pinY=item.pinY??.5;if(item.scope==='sticker'){s.pinTarget=resolvePinTargetKey(item.pinTargetKey)||$(`[data-pin-id="${item.pinTargetId}"]`)||$('.workspace-frame');s.el.classList.add('sticker-object');updatePinnedObject(s)}updateObjectTransform(s)});}catch{}}

    function updateObjectAtlas(){if(!selectedAsset||!$('#floatingAssetTitle'))return;$('#floatingAssetTitle').textContent=selectedAsset.name;$('#floatingAssetArt').innerHTML=selectedAsset.art;$('#floatingAssetCopy').textContent=`${themes[selectedAsset.theme].name} ${selectedAsset.type.toLowerCase()} with live physics, scrapbook pinning and mascot affordances.`;$('#floatingAssetBadges').innerHTML=[themes[selectedAsset.theme].name,selectedAsset.type,selectedAsset.mediaKind?'Playable media':'Interactive',selectedAsset.stickerCapable?'Sticker-ready':'World only'].map(x=>`<span>${x}</span>`).join('');$('#floatingAssetPhysics').textContent=selectedAsset.physics;$('#floatingAssetActions').textContent=selectedAsset.affordances;$('#floatingMediaBehavior').textContent=selectedAsset.mediaKind?`${selectedAsset.mediaKind}: click to play${['record','disc'].includes(selectedAsset.mediaKind)?' and spin':''}`:'No tune mapped';$('#floatingAtlasEyebrow').textContent=$('#floatingVault').dataset.tab==='scrapbook'?'Scrapbook Diary':'Object Atlas';}
    function openFloatingVault(){const v=$('#floatingVault');v.classList.add('open');renderFloatingAssetGrid($('#floatingAssetSearch').value);updateObjectAtlas();toast('Floating Asset Vault opened. Drag it anywhere, then drag assets into the exact UI location you want.');}
    function closeFloatingVault(){const v=$('#floatingVault');v.classList.remove('open');}
    function centerFloatingVault(){const v=$('#floatingVault'),r=v.getBoundingClientRect();v.style.left=`${Math.max(12,(innerWidth-r.width)/2)}px`;v.style.top=`${Math.max(64,(innerHeight-r.height)/2)}px`;saveFloatingVaultState();}
    function saveFloatingVaultState(){const v=$('#floatingVault'),r=v.getBoundingClientRect();try{localStorage.setItem('ff-floating-vault',JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height,minimized:v.classList.contains('minimized')}));}catch{}}
    function loadFloatingVaultState(){try{const st=JSON.parse(localStorage.getItem('ff-floating-vault')||'null');if(!st)return;const v=$('#floatingVault');v.style.left=`${clamp(st.x,0,innerWidth-100)}px`;v.style.top=`${clamp(st.y,0,innerHeight-44)}px`;if(st.w)v.style.width=`${Math.min(st.w,innerWidth-24)}px`;if(st.h)v.style.height=`${Math.min(st.h,innerHeight-24)}px`;v.classList.toggle('minimized',!!st.minimized);}catch{}}
    function bindFloatingVault(){const v=$('#floatingVault'),handle=$('#floatingVaultHandle');let drag=null;handle.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=v.getBoundingClientRect();drag={dx:e.clientX-r.left,dy:e.clientY-r.top};handle.setPointerCapture(e.pointerId);v.classList.add('vault-dragging');});handle.addEventListener('pointermove',e=>{if(!drag)return;v.style.left=`${clamp(e.clientX-drag.dx,0,innerWidth-v.offsetWidth)}px`;v.style.top=`${clamp(e.clientY-drag.dy,0,innerHeight-44)}px`;});const release=()=>{if(!drag)return;drag=null;v.classList.remove('vault-dragging');saveFloatingVaultState();};handle.addEventListener('pointerup',release);handle.addEventListener('pointercancel',release);$('#vaultClose').addEventListener('click',closeFloatingVault);$('#vaultMinimize').addEventListener('click',()=>{v.classList.toggle('minimized');$('#vaultMinimize').textContent=v.classList.contains('minimized')?'□':'—';saveFloatingVaultState()});$('#vaultCenter').addEventListener('click',centerFloatingVault);$$('[data-vault-tab]').forEach(b=>b.addEventListener('click',()=>{v.dataset.tab=b.dataset.vaultTab;$$('[data-vault-tab]').forEach(x=>x.classList.toggle('active',x===b));updateObjectAtlas()}));$('#floatingAssetSearch').addEventListener('input',e=>renderFloatingAssetGrid(e.target.value));$('#floatingImport').addEventListener('click',()=>$('#fileInput').click());$('#vaultPlacementMode').addEventListener('change',e=>{placementPrefs.mode=e.target.value;$('#vaultDropCopy').textContent=e.target.value==='world'?'World restricted keeps objects inside the living side rooms. Drop only into a left or right world.':e.target.value==='ui'?'Whole UI actors stay where placed when gravity is off. Enable gravity to throw them and bounce from cards and studio surfaces.':'Scrapbook stickers pin to the exact panel or card under the pointer, stay with it, and ignore gravity until peeled or toggled.'});$('#vaultGravityToggle').addEventListener('click',()=>{placementPrefs.gravity=!placementPrefs.gravity;$('#vaultGravityToggle').classList.toggle('active',placementPrefs.gravity)});$('#vaultPlaceLeft').addEventListener('click',()=>spawnObject('left',selectedAsset));$('#vaultPlaceRight').addEventListener('click',()=>spawnObject('right',selectedAsset));$('#vaultPlaceUI').addEventListener('click',()=>spawnUiObject(selectedAsset,innerWidth*.5-44,innerHeight*.36,{scope:'ui',gravity:placementPrefs.gravity}));$('#vaultPinWorkspace').addEventListener('click',()=>spawnUiObject(selectedAsset,innerWidth*.5-44,innerHeight*.38,{scope:'sticker',gravity:false,target:$('.workspace-frame')}));$('#vaultPreviewBehavior').addEventListener('click',()=>{const ghost={asset:selectedAsset,el:$('#floatingAssetArt')};if(selectedAsset.mediaKind){playSynth(...mediaNotes(selectedAsset.mediaKind));$('#floatingAssetArt').animate([{transform:'scale(1)'},{transform:'scale(1.12) rotate(-4deg)'},{transform:'scale(1)'}],{duration:600})}else toast(`${selectedAsset.name}: ${selectedAsset.affordances.split(',')[0]}`)});new ResizeObserver(()=>saveFloatingVaultState()).observe(v);loadFloatingVaultState();}
    function clearDropGlow(){$$('.drop-target-glow').forEach(x=>x.classList.remove('drop-target-glow'));}
    function assetIdFromTransfer(dt){return dt.getData('application/x-feature-foundry-asset')||'';}
    function bindGlobalAssetDrop(){document.addEventListener('dragover',e=>{const id=assetIdFromTransfer(e.dataTransfer);if(!id)return;e.preventDefault();e.dataTransfer.dropEffect='copy';clearDropGlow();const mode=e.dataTransfer.getData('application/x-feature-foundry-placement')||placementPrefs.mode;if(mode==='sticker'){const target=e.target.closest?.(PIN_TARGET_SELECTOR);target?.classList.add('drop-target-glow');}});document.addEventListener('drop',e=>{const id=assetIdFromTransfer(e.dataTransfer);if(!id)return;e.preventDefault();clearDropGlow();const asset=assetById[id],mode=e.dataTransfer.getData('application/x-feature-foundry-placement')||placementPrefs.mode;if(mode==='world'){const world=e.target.closest?.('.world');if(!world){toast('This asset is World Restricted. Choose Whole UI or Scrapbook Sticker in the floating Vault to place it here.');return;}const layer=world.querySelector('.object-layer'),r=layer.getBoundingClientRect();spawnObject(world.id==='leftWorld'?'left':'right',asset,e.clientX-r.left-44,e.clientY-r.top-44);}else if(mode==='ui'){spawnUiObject(asset,e.clientX-44,e.clientY-44,{scope:'ui',gravity:placementPrefs.gravity});}else{const target=e.target.closest?.(PIN_TARGET_SELECTOR)||$('.workspace-frame');spawnUiObject(asset,e.clientX-44,e.clientY-44,{scope:'sticker',gravity:placementPrefs.gravity,target});}});}



    /* V23: one context-aware command surface for objects, stickers, and mascots. */
    const actorContextMenuState={actor:null,opener:null,keyboard:false,lastX:0,lastY:0};
    const actorContextIconPaths={
      play:'<path d="m9 6 9 6-9 6z"/>',edit:'<path d="M4 20h4l11-11-4-4L4 16zM13.5 6.5l4 4"/>',duplicate:'<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
      pin:'<path d="M8 3h8l-1 6 3 3v2H6v-2l3-3zM12 14v7"/>',peel:'<path d="M4 3h16v11l-7 7H4z"/><path d="M13 21v-7h7M9 17c3-.3 5.5-1.7 7.2-4.2"/>',gravity:'<path d="M12 3v15M7 13l5 5 5-5"/><path d="M5 21h14"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',unlock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7-2.6"/>',
      ui:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/>',left:'<path d="m14 6-6 6 6 6"/><path d="M20 12H8"/>',right:'<path d="m10 6 6 6-6 6"/><path d="M4 12h12"/>',front:'<path d="M9 5h10v10H9z"/><path d="M5 9h10v10H5z"/>',forward:'<path d="m12 4 5 5h-3v5h-4V9H7z"/>',backward:'<path d="m12 20-5-5h3v-5h4v5h3z"/>',back:'<path d="M5 9h10v10H5z"/><path d="M9 5h10v10"/>',
      layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',library:'<path d="M4 4h6v16H4zM14 4h6v16h-6z"/><path d="M7 8h1M17 8h1"/>',reset:'<path d="M4 12a8 8 0 1 0 2.3-5.7L4 8"/><path d="M4 3v5h5"/>',rescue:'<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',repair:'<path d="m14 6 4-3 3 3-3 4M13 7 4 16l4 4 9-9"/>',trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>'
    };
    function actorContextIcon(name){return `<span class="actor-context-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${actorContextIconPaths[name]||actorContextIconPaths.edit}</svg></span>`;}
    function actorContextItem(action,label,icon,detail='',shortcut='',disabled=false,destructive=false){return `<button class="actor-context-item${destructive?' destructive':''}" role="menuitem" data-context-action="${action}" ${disabled?'disabled aria-disabled="true"':''}>${actorContextIcon(icon)}<span class="actor-context-item-copy"><b>${label}</b>${detail?`<small>${detail}</small>`:''}</span>${shortcut?`<span class="actor-context-shortcut">${shortcut}</span>`:'<span></span>'}</button>`;}
    function actorContextMenuModel(s){
      ensureTransformState(s);const sticker=s.scope==='sticker',mascot=!!s.isMascot,media=!!s.asset.mediaKind;
      const canPin=!sticker&&(!mascot||mascotPrefs.pinning),canGravity=!mascot||mascotPrefs.throwPhysics,canAddRemove=!mascot||mascotPrefs.addRemove;
      const groups=[];
      groups.push({label:'Act',items:[
        ['interact',media?'Play quick tune':mascot?'Talk / play':'Interact',media?'play':'play',media?s.asset.mediaKind:mascot?'Run a companion action':'Use the primary affordance',media?'Enter':'Enter',!objectCanInteract(s)],
        ['transform','Edit transform','edit','Open precision placement and image controls','T',false],
        ['duplicate','Duplicate','duplicate','Create an independent copy','Ctrl+D',!canAddRemove]
      ]});
      const placement=[];
      if(sticker) placement.push(['peel','Peel sticker','peel','Release it without changing its authored geometry','P',mascot&&!mascotPrefs.pinning]);
      else placement.push(['pin','Pin as sticker','pin','Attach to the UI surface beneath it','P',!canPin]);
      placement.push(['gravity',sticker?`Gravity after peel: ${s.gravityAfterPeel?'On':'Off'}`:`Gravity: ${s.gravity?'On':'Off'}`,'gravity',sticker?'Toggle future release physics':'Toggle and hard-stop motion when disabled','G',!canGravity]);
      if(s.scope==='world') placement.push(['move-ui','Move to whole UI','ui','Keep the current screen position','',false]);
      else if(!sticker){placement.push(['move-left','Move to left world','left','Restrict to the left living lane','',s.scope==='world'&&s.side==='left']);placement.push(['move-right','Move to right world','right','Restrict to the right living lane','',s.scope==='world'&&s.side==='right']);}
      groups.push({label:'Placement',items:placement});
      groups.push({label:'Arrange',arrange:true,items:[
        ['front','Front','front','Bring to front','',false],['up','Up','forward','Move one layer forward','',false],['down','Down','backward','Move one layer backward','',false],['back','Back','back','Send to back','',false]
      ]});
      const manage=[
        ['lock',s.locked?'Unlock':'Lock',s.locked?'unlock':'lock',s.locked?'Allow editing again':'Protect placement and transforms','L',false],
        ['layers','Reveal in Layers','layers','Open and select this actor in Layers','',false],
        ['library',mascot?'Open Mascot Registry':'Open in Object Atlas','library','Reveal its source asset','',false],
        ['reset','Reset appearance','reset','Reset transform, filters and blend mode','',s.locked],
        ['rescue','Rescue into view','rescue','Recover an offscreen or unusable actor','R',false]
      ];
      if(s.asset.breakable||s.integrity<100)manage.push(['repair','Repair','repair','Restore full object integrity','',false]);
      manage.push(['delete',mascot?'Remove mascot':'Delete object','trash','Undo remains available','Delete',!canAddRemove,true]);
      groups.push({label:'Manage',items:manage});return groups;
    }
    function actorContextFocusable(){return $$('#actorContextMenu [role="menuitem"]:not(:disabled)');}
    function positionActorContextMenu(x,y){const menu=$('#actorContextMenu');if(!menu)return;menu.style.left='0px';menu.style.top='0px';const pad=8,width=menu.offsetWidth,height=menu.offsetHeight;const left=clamp(Number(x)||pad,pad,Math.max(pad,innerWidth-width-pad)),top=clamp(Number(y)||pad,pad,Math.max(pad,innerHeight-height-pad));menu.style.left=`${left}px`;menu.style.top=`${top}px`;actorContextMenuState.lastX=left;actorContextMenuState.lastY=top;}
    function closeActorContextMenu({restoreFocus=true}={}){const menu=$('#actorContextMenu');if(!menu||!menu.classList.contains('open'))return;const opener=actorContextMenuState.opener;menu.classList.remove('open');menu.setAttribute('aria-hidden','true');document.body.dataset.actorContextOpen='false';actorContextMenuState.actor=null;actorContextMenuState.opener=null;actorContextMenuState.keyboard=false;if(restoreFocus&&opener?.isConnected)opener.focus({preventScroll:true});positionObjectSelectionHud();}
    function openActorContextMenu(s,x,y,{opener=s?.el,keyboard=false}={}){if(!s?.el?.isConnected)return;const menu=$('#actorContextMenu');setSelectedObject(s);actorContextMenuState.actor=s;actorContextMenuState.opener=opener;actorContextMenuState.keyboard=keyboard;const groups=actorContextMenuModel(s);menu.innerHTML=`<div class="actor-context-head"><span class="actor-context-preview">${s.asset.art}</span><span class="actor-context-title"><strong>${s.asset.name}</strong><span>${objectScopeLabel(s)}${s.isMascot?' · Mascot':''}</span></span><span class="actor-context-kind">${s.isMascot?'Mascot':s.scope==='sticker'?'Sticker':'Object'}</span></div>`+groups.map(g=>`<section class="actor-context-group"><div class="actor-context-label">${g.label}</div><div class="${g.arrange?'actor-context-arrange':''}">${g.items.map(i=>actorContextItem(...i)).join('')}</div></section>`).join('');menu.classList.add('open');menu.setAttribute('aria-hidden','false');document.body.dataset.actorContextOpen='true';positionActorContextMenu(x,y);$$('[data-context-action]',menu).forEach(button=>button.addEventListener('click',()=>executeActorContextAction(button.dataset.contextAction)));const first=actorContextFocusable()[0];if(first)queueMicrotask(()=>first.focus({preventScroll:true}));}
    function moveActorToWorld(s,side){if(!s)return;ensureTransformState(s);cancelObjectPeel(s);cancelObjectPhysics(s,{zeroVelocity:true,settle:false});const rect=s.el.getBoundingClientRect(),layer=side==='left'?$('#leftObjects'):$('#rightObjects'),lr=layer.getBoundingClientRect(),desiredGravity=s.scope==='sticker'?!!s.gravityAfterPeel:!!s.gravity;layer.appendChild(s.el);s.scope='world';s.side=side;s.pinTarget=null;s.pinTargetId=null;s.pinTargetKey=null;s.el.classList.remove('sticker-object','peeling','sticking');s.el.dataset.scope='world';s.gravity=s.isMascot&&!mascotPrefs.throwPhysics?false:desiredGravity;s.gravityAfterPeel=s.gravity;s.x=clamp(rect.left-lr.left,0,Math.max(0,lr.width-s.el.offsetWidth));s.y=clamp(rect.top-lr.top,74,Math.max(74,lr.height-s.el.offsetHeight));settleObjectOrientation(s,{instant:true});commitTransform(s);setSelectedObject(s);if(s.isMascot)saveWorldMascotState();toast(`${s.asset.name} moved to the ${side} living world`);}
    function revealActorInLibrary(s){selectedAsset=s.asset;selectAsset(s.asset.id);openVaultTab(s.isMascot?'mascots':'atlas');setTimeout(()=>{$(`[data-asset="${s.asset.id}"]`,$('#floatingAssetGrid'))?.scrollIntoView({block:'center'});},60);}
    function executeActorContextAction(action){const s=actorContextMenuState.actor;if(!s?.el?.isConnected){closeActorContextMenu({restoreFocus:false});return;}setSelectedObject(s);closeActorContextMenu({restoreFocus:false});const history=(label,delay=45)=>setTimeout(()=>recordHistory(label),delay);switch(action){
      case'interact':interactObject(s);break;
      case'transform':openFloatingVault();setTimeout(()=>$('#transformRotationNumber')?.focus(),80);break;
      case'duplicate':duplicateSelected();history(`Duplicated ${s.asset.name}`);break;
      case'pin':{const p=objectScreenCenter(s);pinObjectToTarget(s,p.x,p.y);history(`Pinned ${s.asset.name}`);break;}
      case'peel':peelSticker(s);history(`Peeled ${s.asset.name}`,520);break;
      case'gravity':toggleSelectedGravity(s);history(`Changed ${s.asset.name} gravity`);break;
      case'move-ui':moveSelectedToUI();history(`Moved ${s.asset.name} to whole UI`);break;
      case'move-left':moveActorToWorld(s,'left');history(`Moved ${s.asset.name} to left world`);break;
      case'move-right':moveActorToWorld(s,'right');history(`Moved ${s.asset.name} to right world`);break;
      case'lock':toggleSelectedLock(s);history(`${s.locked?'Locked':'Unlocked'} ${s.asset.name}`);break;
      case'front':setSelectedLayer('front');history(`Brought ${s.asset.name} to front`);break;
      case'up':setSelectedLayer('up');history(`Moved ${s.asset.name} forward`);break;
      case'down':setSelectedLayer('down');history(`Moved ${s.asset.name} backward`);break;
      case'back':setSelectedLayer('back');history(`Sent ${s.asset.name} to back`);break;
      case'layers':openVaultTab('layers');setTimeout(()=>{renderLayers();$(`[data-layer-id="${s.id}"]`)?.scrollIntoView({block:'center'});},70);break;
      case'library':revealActorInLibrary(s);break;
      case'reset':resetSelectedTransform();history(`Reset ${s.asset.name} appearance`);break;
      case'rescue':rescueSelected();history(`Rescued ${s.asset.name}`);break;
      case'repair':repairSelected();history(`Repaired ${s.asset.name}`);break;
      case'delete':{const name=s.asset.name,isMascot=!!s.isMascot;removeSelected();if(!isMascot)history(`Removed ${name}`);break;}
    }}
    function bindActorContextMenuSurface(){const menu=$('#actorContextMenu');menu.addEventListener('keydown',e=>{const items=actorContextFocusable(),index=items.indexOf(document.activeElement);if(e.key==='Escape'){e.preventDefault();closeActorContextMenu();return;}if(e.key==='Tab'){closeActorContextMenu({restoreFocus:false});return;}if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();let next=0;if(e.key==='Home')next=0;else if(e.key==='End')next=items.length-1;else if(e.key==='ArrowDown'||e.key==='ArrowRight')next=(index+1+items.length)%items.length;else next=(index-1+items.length)%items.length;items[next]?.focus();return;}const key=e.key.toLowerCase(),map={t:'transform',g:'gravity',l:'lock',p:actorContextMenuState.actor?.scope==='sticker'?'peel':'pin',delete:'delete'};if((e.ctrlKey||e.metaKey)&&key==='d'){e.preventDefault();executeActorContextAction('duplicate');}else if(map[key]){e.preventDefault();executeActorContextAction(map[key]);}});document.addEventListener('pointerdown',e=>{if(menu.classList.contains('open')&&!menu.contains(e.target))closeActorContextMenu({restoreFocus:false});},true);document.addEventListener('contextmenu',e=>{if(menu.classList.contains('open')&&!e.target.closest('.world-object')&&!menu.contains(e.target))closeActorContextMenu({restoreFocus:false});});document.addEventListener('scroll',e=>{if(!menu.classList.contains('open')||menu.contains(e.target))return;const opener=actorContextMenuState.opener,target=e.target===document?document.scrollingElement:e.target;const movesActor=target===document.scrollingElement||target===document.documentElement||target===document.body||(target instanceof Element&&opener&&target.contains(opener));if(movesActor)closeActorContextMenu({restoreFocus:false});},true);window.addEventListener('resize',()=>closeActorContextMenu({restoreFocus:false}));window.addEventListener('blur',()=>closeActorContextMenu({restoreFocus:false}));}


    function refreshWeatherSelect(){const select=$('#weatherSelect');if(!select)return;const t=themes[currentTheme],items=[['sun',t.weather[0]],['bubbles',t.weather[1]||'Atmosphere'],['rain',t.weather[2]||'Rain'],['fog',currentTheme==='vaporwave'?'Pixel Fog':currentTheme==='backrooms'?'Dust Haze':'Soft Fog']];select.innerHTML=items.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');select.value=currentWeather;}
    function formatHour(h){h=((Number(h)%24)+24)%24;return h===0?'12 AM':h<12?`${h} AM`:h===12?'12 PM':`${h-12} PM`;}
    function timeProfile(hour){const h=((Number(hour)%24)+24)%24;if(h<4)return {name:'midnight',brightness:.42,saturation:.82,contrast:1.08,tint:'linear-gradient(rgba(6,10,39,.52),rgba(15,28,72,.28))'};if(h<7)return {name:'dawn',brightness:.72,saturation:1.08,contrast:1.02,tint:'linear-gradient(rgba(255,125,157,.20),rgba(72,94,171,.18))'};if(h<16)return {name:'day',brightness:1.08,saturation:1.04,contrast:1,tint:'transparent'};if(h<19)return {name:'golden',brightness:.98,saturation:1.18,contrast:1.03,tint:'linear-gradient(rgba(255,169,75,.16),rgba(255,94,127,.10))'};if(h<21)return {name:'dusk',brightness:.72,saturation:1.12,contrast:1.06,tint:'linear-gradient(rgba(69,31,101,.28),rgba(17,40,85,.22))'};return {name:'night',brightness:.5,saturation:.9,contrast:1.1,tint:'linear-gradient(rgba(4,10,42,.46),rgba(14,28,66,.30))'};}
    function applyTimeHour(hour,{notify=false,preset=currentTimePreset}={}){currentTimeHour=((Number(hour)%24)+24)%24;const p=timeProfile(currentTimeHour);document.body.dataset.time=p.name;document.documentElement.style.setProperty('--day-brightness',p.brightness);document.documentElement.style.setProperty('--day-saturation',p.saturation);document.documentElement.style.setProperty('--day-contrast',p.contrast);document.documentElement.style.setProperty('--time-tint',p.tint);$('#timeRange').value=currentTimeHour;updatePremiumRange($('#timeRange'));$('#timeValue').textContent=formatHour(currentTimeHour);if($('#timePresetSelect'))$('#timePresetSelect').value=preset;if(notify){toast(`Time of day: ${preset==='auto'?'Live time':$('#timePresetSelect').selectedOptions[0]?.textContent||formatHour(currentTimeHour)}`);addActivity('◐','Time director changed',`${formatHour(currentTimeHour)} · ${p.name}`);}}
    function setTimePreset(value,notify=true){currentTimePreset=value;const hour=value==='auto'?new Date().getHours():Number(value);applyTimeHour(hour,{notify,preset:value});}
    function cycleWeather(){const order=['sun','rain','bubbles','fog'];currentWeather=order[(order.indexOf(currentWeather)+1)%order.length];setWeather(currentWeather,true);}
    function setWeather(type,notify=false){currentWeather=type;$$('#weatherButtons .toggle').forEach(b=>b.classList.toggle('active',b.dataset.weather===type));const t=themes[currentTheme],map={sun:t.weather[0],rain:t.weather[2]||'Rain',bubbles:t.weather[1]||'Bubbles',fog:currentTheme==='vaporwave'?'Pixel Fog':currentTheme==='backrooms'?'Dust Haze':'Soft Fog'};$('#weatherLabel').textContent=map[type];$('#weatherTop').textContent=`${t.temp} ${map[type]}`;if($('#weatherSelect'))$('#weatherSelect').value=type;resetParticles();if(notify){toast(`Weather changed: ${map[type]}`);addActivity('☀','Weather changed',map[type]);}}
    function resizeCanvases(){['fullFx','leftFx','rightFx'].forEach(id=>{const c=$('#'+id);if(!c)return;const r=c.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);c.width=Math.max(1,r.width*d);c.height=Math.max(1,r.height*d);c.dataset.scale=d;});resetParticles();}
    function particleKind(){if(currentTheme==='vaporwave')return'pixel';if(currentTheme==='pomo')return'confetti';if(currentTheme==='backrooms')return'dust';if(currentTheme==='diner')return'spark';if(currentTheme==='memphis')return'squiggle';return'bubble';}
    function resetParticles(){particles=[];const count=currentMode==='performance'?0:currentWeather==='fog'?18:34;for(let i=0;i<count;i++)particles.push({x:Math.random(),y:Math.random(),r:1+Math.random()*7,vx:(Math.random()-.5)*.0007,vy:.0003+Math.random()*.0012,a:.16+Math.random()*.5,kind:particleKind(),rot:Math.random()*6.28});}
    function drawFx(canvas,time){const ctx=canvas.getContext('2d'),d=Number(canvas.dataset.scale)||1,w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);for(const p of particles){p.x+=p.vx*(currentWeather==='rain'?2:1);p.y+=p.vy*(currentWeather==='rain'?4:1);p.rot+=.02;if(p.y>1.08){p.y=-.08;p.x=Math.random()}if(p.x<-0.1)p.x=1.1;if(p.x>1.1)p.x=-.1;const x=p.x*w,y=p.y*h,r=p.r*d;ctx.save();ctx.globalAlpha=p.a;ctx.translate(x,y);ctx.rotate(p.rot);if(p.kind==='bubble'){ctx.strokeStyle='rgba(235,255,255,.9)';ctx.fillStyle='rgba(85,218,255,.12)';ctx.lineWidth=1.2*d;ctx.beginPath();ctx.arc(0,0,r*1.8,0,Math.PI*2);ctx.fill();ctx.stroke();}else if(p.kind==='pixel'){ctx.fillStyle=Math.random()>.5?'#ff75e9':'#58ddff';ctx.fillRect(-r,-r,r*2,r*2);}else if(p.kind==='confetti'){ctx.fillStyle=['#ffcf3e','#4ee4c2','#ff6f91'][Math.floor((p.x*10)%3)];ctx.fillRect(-r*1.5,-r/2,r*3,r);}else if(p.kind==='dust'){ctx.fillStyle='rgba(255,247,192,.7)';ctx.beginPath();ctx.arc(0,0,r*.55,0,Math.PI*2);ctx.fill();}else if(p.kind==='spark'){ctx.strokeStyle=Math.random()>.5?'#ff477d':'#49dbe8';ctx.lineWidth=2*d;ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.moveTo(0,-r);ctx.lineTo(0,r);ctx.stroke();}else{ctx.strokeStyle=Math.random()>.5?'#67e6cf':'#b791ff';ctx.lineWidth=2*d;ctx.beginPath();ctx.moveTo(-r,0);ctx.quadraticCurveTo(-r/2,-r,r/2,0);ctx.quadraticCurveTo(r,r,r*1.5,0);ctx.stroke();}ctx.restore();}}
    function ambientLoop(time){ambientRAF=0;if(window.__ffRuntimeGovernor?.isSuspended()||!['living','stage'].includes(currentMode)||currentWorldState==='off'||document.hidden)return;const fps=resolvedVisualQuality==='ultra'?60:resolvedVisualQuality==='balanced'?36:22;if(worldLayout==='split'){drawFx($('#leftFx'),time);drawFx($('#rightFx'),time);}else{drawFx($('#fullFx'),time);}ambientLast=time;const delay=Math.max(0,1000/fps-18);ambientTimer=setTimeout(()=>{ambientTimer=0;if(!window.__ffRuntimeGovernor?.isSuspended()&&!document.hidden)ambientRAF=requestAnimationFrame(ambientLoop);},delay);}
    function startAmbient(){if(ambientRAF||ambientTimer||window.__ffRuntimeGovernor?.isSuspended()||document.hidden)return;resizeCanvases();ambientRAF=requestAnimationFrame(ambientLoop);}
    function stopAmbient(){if(ambientRAF)cancelAnimationFrame(ambientRAF);if(ambientTimer)clearTimeout(ambientTimer);ambientRAF=0;ambientTimer=0;['fullFx','leftFx','rightFx'].forEach(id=>{const c=$('#'+id);if(!c)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height)});$('#mascot').classList.remove('dance');}

    function buildSpectrum(id){const el=$('#'+id);el.innerHTML=Array.from({length:20},(_,i)=>`<i style="--i:${i}"></i>`).join('');}
    function toggleMusic(force){musicPlaying=force??!musicPlaying;['playButton','soundToggle','dockMusic'].forEach(id=>$('#'+id)?.classList.toggle('active',musicPlaying));$('#playButton').textContent=musicPlaying?'Ⅱ':'▶';$('#mascot').classList.toggle('dance',musicPlaying&&['living','stage'].includes(currentMode));toast(musicPlaying?`${themes[currentTheme].playlist} playing`:'Soundtrack paused');}
    function handleFile(file){if(!file)return;const isImage=file.type.startsWith('image/'),id='user-'+Date.now();if(isImage){const reader=new FileReader();reader.onload=()=>{const asset={id,theme:currentTheme,name:file.name.replace(/\.[^.]+$/,''),art:`<img src="${reader.result}" alt="">`,type:'Imported image actor',physics:'2.5D dynamic',affordances:'Place, throw, resize',mascot:'Inspect, carry',breakable:false};assets.unshift(asset);assetById[id]=asset;selectedAsset=asset;renderAssetGrid($('#assetSearch').value);selectAsset(id);setView('vault');toast(`${file.name} imported as a borderless world object`);};reader.readAsDataURL(file);}else{const asset={id,theme:currentTheme,name:file.name.replace(/\.[^.]+$/,''),art:svg(`<path d="M50 12l34 20v38L50 90 16 70V32z" fill="${themes[currentTheme].palette[1]}" stroke="#fff" stroke-width="3"/><path d="M16 32l34 20 34-20M50 52v38" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="3"/>`),type:'Imported 3D / media',physics:'Semantic rig pending',affordances:'Inspect, rig, place',mascot:'Discover affordances',breakable:false};assets.unshift(asset);assetById[id]=asset;selectedAsset=asset;renderAssetGrid($('#assetSearch').value);selectAsset(id);setView('vault');toast(`${file.name} imported into the semantic rig pipeline`);}}
    function applyThemeMix(){const sec=themes[$('#secondaryTheme').value],amount=Number($('#mixRange').value)/100,pri=themes[currentTheme],mix=(a,b,t)=>{const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16),ar=pa>>16,ag=pa>>8&255,ab=pa&255,br=pb>>16,bg=pb>>8&255,bb=pb&255;return'#'+[ar+(br-ar)*t,ag+(bg-ag)*t,ab+(bb-ab)*t].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')};document.documentElement.style.setProperty('--accent',mix(pri.palette[0],sec.palette[0],amount));document.documentElement.style.setProperty('--accent-2',mix(pri.palette[1],sec.palette[1],amount));document.documentElement.style.setProperty('--accent-3',mix(pri.palette[2],sec.palette[2],amount));$('#mixLabel').textContent=`${Math.round(amount*100)}%`;toast(`${pri.name} × ${sec.name} material mix applied`);}
    function clearThemeMix(){setTheme(currentTheme);toast('Theme material mix cleared');}

    const shelfName=area=>area==='topbar'?'Top application shelf':area==='rail'?'Navigation shelf':area==='workbar'?'Workspace shelf':area==='worldbar'?'World shelf':'Quick shelf';
    function shelfGlyph(area,mode){if(area==='rail')return mode==='compact'?'›':'‹';if(area==='dock')return mode==='compact'?'⌃':'⌄';return mode==='compact'?'⌄':'⌃';}
    function normalizeLauncherPrefs(){
      for(const area of ['dock','topbar']){
        const ids=launcherCatalog[area].map(x=>x.id),orderKey=`${area}Order`,visibleKey=`${area}Visible`;
        const savedOrder=Array.isArray(uiPrefs[orderKey])?uiPrefs[orderKey]:[];
        const savedVisible=Array.isArray(uiPrefs[visibleKey])?uiPrefs[visibleKey]:launcherDefaults[visibleKey];
        uiPrefs[orderKey]=[...new Set([...savedOrder.filter(id=>ids.includes(id)),...ids])];
        uiPrefs[visibleKey]=[...new Set(savedVisible.filter(id=>ids.includes(id)))];
      }
    }
    function launcherElement(area,id){return document.querySelector(area==='dock'?`#dock [data-dock-item="${id}"]`:`#topActions [data-topbar-item="${id}"]`);}
    function renderLauncherManager(area){
      const root=$(`#${area}ItemManager`);if(!root)return;
      const order=uiPrefs[`${area}Order`],visible=new Set(uiPrefs[`${area}Visible`]),catalog=Object.fromEntries(launcherCatalog[area].map(x=>[x.id,x]));
      root.innerHTML=order.map((id,index)=>{const item=catalog[id];return `<div class="launcher-item-row" draggable="true" data-launcher-row="${area}:${id}"><label class="launcher-item-toggle"><input type="checkbox" data-launcher-toggle="${area}:${id}" ${visible.has(id)?'checked':''}><span class="launcher-item-icon">${item.icon}</span><span class="launcher-item-name">${item.label}</span></label><span class="launcher-item-order"><button data-launcher-move="${area}:${id}:-1" title="Move earlier" ${index===0?'disabled':''}>↑</button><button data-launcher-move="${area}:${id}:1" title="Move later" ${index===order.length-1?'disabled':''}>↓</button></span></div>`}).join('');
    }
    function applyLauncherPreferences(){
      normalizeLauncherPrefs();
      const dock=$('#dock'),dockEnd=$('#dockCollapse');
      uiPrefs.dockOrder.forEach(id=>{const el=launcherElement('dock',id);if(!el)return;dock.insertBefore(el,dockEnd);const shown=uiPrefs.dockVisible.includes(id);el.hidden=!shown;el.classList.toggle('launcher-item-hidden',!shown);});
      const top=$('#topActions'),topEnd=$('#topbarCollapse');
      uiPrefs.topbarOrder.forEach(id=>{const el=launcherElement('topbar',id);if(!el)return;top.insertBefore(el,topEnd);const shown=uiPrefs.topbarVisible.includes(id);el.hidden=!shown;el.classList.toggle('launcher-item-hidden',!shown);});
      renderLauncherManager('dock');renderLauncherManager('topbar');
    }
    function setLauncherVisibility(area,id,visible){const key=`${area}Visible`,set=new Set(uiPrefs[key]);visible?set.add(id):set.delete(id);uiPrefs[key]=uiPrefs[`${area}Order`].filter(x=>set.has(x));applyUiPrefs();}
    function moveLauncherItem(area,id,delta){const key=`${area}Order`,arr=[...uiPrefs[key]],from=arr.indexOf(id),to=clamp(from+Number(delta),0,arr.length-1);if(from<0||from===to)return;arr.splice(from,1);arr.splice(to,0,id);uiPrefs[key]=arr;applyUiPrefs();}
    function setLauncherPreset(name){const [area,mode]=name.split('-');if(!launcherCatalog[area])return;uiPrefs[`${area}Order`]=launcherCatalog[area].map(x=>x.id);uiPrefs[`${area}Visible`]=mode==='all'?[...uiPrefs[`${area}Order`]]:[...launcherDefaults[`${area}Visible`]];applyUiPrefs();toast(`${area==='dock'?'Quick shelf':'Top bar'} ${mode==='all'?'shows all available actions':'defaults restored'}`);}
    function bindLauncherManagers(){
      document.addEventListener('change',e=>{const key=e.target?.dataset?.launcherToggle;if(!key)return;const [area,id]=key.split(':');setLauncherVisibility(area,id,e.target.checked);});
      document.addEventListener('click',e=>{const move=e.target.closest?.('[data-launcher-move]')?.dataset.launcherMove;if(move){const [area,id,delta]=move.split(':');moveLauncherItem(area,id,Number(delta));return;}const preset=e.target.closest?.('[data-launcher-preset]')?.dataset.launcherPreset;if(preset)setLauncherPreset(preset);});
      let dragged=null;
      document.addEventListener('dragstart',e=>{const row=e.target.closest?.('[data-launcher-row]');if(!row)return;dragged=row.dataset.launcherRow;row.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragged);});
      document.addEventListener('dragend',e=>e.target.closest?.('[data-launcher-row]')?.classList.remove('dragging'));
      document.addEventListener('dragover',e=>{if(e.target.closest?.('[data-launcher-row]'))e.preventDefault();});
      document.addEventListener('drop',e=>{const target=e.target.closest?.('[data-launcher-row]');if(!target||!dragged)return;e.preventDefault();const [a,id]=dragged.split(':'),[ta,tid]=target.dataset.launcherRow.split(':');if(a!==ta||id===tid)return;const arr=[...uiPrefs[`${a}Order`]],from=arr.indexOf(id),to=arr.indexOf(tid);arr.splice(from,1);arr.splice(to,0,id);uiPrefs[`${a}Order`]=arr;applyUiPrefs();});
    }
    function applyUiPrefs(save=true){
      const b=document.body;
      b.dataset.dockMode=uiPrefs.dockMode;b.dataset.dockPosition=uiPrefs.dockPosition;
      b.dataset.topbarMode=uiPrefs.topbarMode;b.dataset.railMode=uiPrefs.railMode;b.dataset.railPosition=uiPrefs.railPosition;
      b.dataset.workbarMode=uiPrefs.workbarMode;b.dataset.worldbarMode=uiPrefs.worldbarMode;
      b.dataset.collapseButtons=uiPrefs.collapseButtonsHide?'hide':'compact';
      document.documentElement.style.setProperty('--dock-size',`${uiPrefs.dockSize}px`);
      document.documentElement.style.setProperty('--dock-opacity',uiPrefs.dockOpacity/100);
      $('#dock').dataset.magnify=String(uiPrefs.dockMagnify);
      const values={dockModeSelect:uiPrefs.dockMode,dockPositionSelect:uiPrefs.dockPosition,dockSizeRange:uiPrefs.dockSize,dockOpacityRange:uiPrefs.dockOpacity,topbarModeSelect:uiPrefs.topbarMode,railModeSelect:uiPrefs.railMode,railPositionSelect:uiPrefs.railPosition,workbarModeSelect:uiPrefs.workbarMode,worldbarModeSelect:uiPrefs.worldbarMode};
      Object.entries(values).forEach(([id,v])=>{if($('#'+id))$('#'+id).value=v});
      $('#dockSizeValue').textContent=`${uiPrefs.dockSize} px`;$('#dockOpacityValue').textContent=`${uiPrefs.dockOpacity}%`;
      $('#dockMagnifyToggle').classList.toggle('active',uiPrefs.dockMagnify);
      $('#collapseHideToggle').classList.toggle('active',uiPrefs.collapseButtonsHide);
      $('#rememberChromeToggle').classList.toggle('active',uiPrefs.remember);
      applyLauncherPreferences();
      const modes={topbar:uiPrefs.topbarMode,rail:uiPrefs.railMode,workbar:uiPrefs.workbarMode,worldbar:uiPrefs.worldbarMode,dock:uiPrefs.dockMode};
      const ids={topbar:'topbarCollapse',rail:'railCollapse',workbar:'workbarCollapse',dock:'dockCollapse'};
      Object.entries(ids).forEach(([area,id])=>{const button=$('#'+id),glyph=$('#'+id+' .collapse-glyph');if(glyph)glyph.textContent=shelfGlyph(area,modes[area]);if(button){button.setAttribute('aria-expanded',String(modes[area]!=='hidden'));button.title=`${uiPrefs.collapseButtonsHide?'Hide':'Compact'} ${shelfName(area).toLowerCase()} or drag to snap`;}});const topPullGlyph=$('#topbarPull .collapse-glyph');if(topPullGlyph)topPullGlyph.textContent=shelfGlyph('topbar',modes.topbar);
      $$('[data-shelf-grip="worldbar"] .collapse-glyph').forEach(g=>g.textContent=shelfGlyph('worldbar',modes.worldbar));
      setTimeout(updatePinnedObjects,380);if(save&&uiPrefs.remember){try{localStorage.setItem('ff-living-ui-prefs',JSON.stringify(uiPrefs))}catch{}}refreshPremiumRanges($('#drawer')||document);
    }
    function loadUiPrefs(){try{const saved=JSON.parse(localStorage.getItem('ff-living-ui-prefs')||'null');if(saved)uiPrefs={...uiPrefs,...saved};}catch{}applyUiPrefs(false);}
    function setShelfMode(area,mode,{announce=true,save=true}={}){const key=`${area}Mode`;uiPrefs[key]=mode;document.body.dataset.cleanView='false';applyUiPrefs(save);if(announce)toast(`${shelfName(area)} ${mode==='always'?'expanded':mode==='compact'?'compacted':mode==='hover'?'set to edge hover':'hidden'}`);}
    function restoreChrome(){document.body.dataset.cleanView='false';chromeRestoreSnapshot=null;uiPrefs={...uiPrefs,dockMode:'always',dockPosition:'bottom',topbarMode:'always',railMode:'always',railPosition:'left',workbarMode:'always',worldbarMode:'always'};applyUiPrefs();toast('Expanded Studio restored');}
    function toggleChromeCompact(area){const key=`${area}Mode`,current=uiPrefs[key];const next=current==='hidden'?'always':uiPrefs.collapseButtonsHide?'hidden':current==='compact'?'always':'compact';setShelfMode(area,next);}
    function revealChrome(area){setShelfMode(area,'always');}
    function applyChromePreset(preset){if(preset==='expanded'){restoreChrome();return;}if(preset==='compact'){document.body.dataset.cleanView='false';chromeRestoreSnapshot=null;uiPrefs={...uiPrefs,topbarMode:'compact',railMode:'compact',workbarMode:'compact',worldbarMode:'compact',dockMode:'compact'};applyUiPrefs();toast('Compact Studio enabled');return;}toggleCleanView(true);}
    function toggleCleanView(forceOn){const active=document.body.dataset.cleanView==='true';if(active&&forceOn!==true){if(chromeRestoreSnapshot)Object.assign(uiPrefs,chromeRestoreSnapshot);else Object.assign(uiPrefs,{topbarMode:'always',railMode:'always',workbarMode:'always',worldbarMode:'always',dockMode:'always'});chromeRestoreSnapshot=null;document.body.dataset.cleanView='false';applyUiPrefs();toast('Studio interface restored');return;}if(!active){chromeRestoreSnapshot={topbarMode:uiPrefs.topbarMode,railMode:uiPrefs.railMode,workbarMode:uiPrefs.workbarMode,worldbarMode:uiPrefs.worldbarMode,dockMode:uiPrefs.dockMode};Object.assign(uiPrefs,{topbarMode:'hidden',railMode:'hidden',workbarMode:'hidden',worldbarMode:'hidden',dockMode:'hidden'});document.body.dataset.cleanView='true';closeDrawer();applyUiPrefs(false);toast('Canvas Only enabled · press Tab to restore');}}

    function shelfTowardEdge(area,dx,dy){
      if(area==='topbar'||area==='workbar'||area==='worldbar')return-dy;
      if(area==='rail')return uiPrefs.railPosition==='right'?dx:-dx;
      if(uiPrefs.dockPosition==='top')return-dy;
      if(uiPrefs.dockPosition==='bottom')return dy;
      if(uiPrefs.dockPosition==='left')return-dx;
      return dx;
    }
    function shelfDragVector(area,dx,dy){
      let x=0,y=0;
      if(area==='topbar'||area==='workbar'||area==='worldbar')y=clamp(dy,-120,120);
      else if(area==='rail')x=clamp(dx,-120,120);
      else{x=clamp(dx,-120,120);y=clamp(dy,-120,120);}
      document.documentElement.style.setProperty('--shelf-drag-x',`${x}px`);
      document.documentElement.style.setProperty('--shelf-drag-y',`${y}px`);
    }
    function shelfSnapMode(area,startMode,toward){
      if(startMode==='hidden'){
        const away=-toward;
        if(away>48)return'always';
        if(away>14)return'compact';
        return'hidden';
      }
      if(toward>48)return'hidden';
      if(toward>14)return'compact';
      if(toward<-14)return'always';
      return startMode==='hover'?'always':startMode;
    }
    function bindShelfDrag(){
      $$('[data-shelf-grip]').forEach(grip=>{
        let drag=null;
        grip.addEventListener('click',e=>{if(Number(grip.dataset.suppressClick||0)>Date.now()){e.preventDefault();e.stopImmediatePropagation();}},true);
        grip.addEventListener('pointerdown',e=>{
          if(e.button!==0)return;
          const area=grip.dataset.shelfGrip,key=`${area}Mode`,startMode=uiPrefs[key];
          drag={area,key,startMode,x:e.clientX,y:e.clientY,moved:false};
          grip.setPointerCapture(e.pointerId);
          document.body.dataset.shelfDragging=area;
          document.body.dataset.shelfSnap=startMode;
          $('#shelfDragHint').textContent=`${shelfName(area)} · pull toward edge to hide`;
        });
        grip.addEventListener('pointermove',e=>{
          if(!drag)return;
          const dx=e.clientX-drag.x,dy=e.clientY-drag.y,distance=Math.hypot(dx,dy);
          if(distance>5)drag.moved=true;
          if(!drag.moved)return;
          e.preventDefault();
          shelfDragVector(drag.area,dx,dy);
          const toward=shelfTowardEdge(drag.area,dx,dy),snap=shelfSnapMode(drag.area,drag.startMode,toward);
          document.body.dataset.shelfSnap=snap;
          $('#shelfDragHint').textContent=`${shelfName(drag.area)} · ${snap==='always'?'Expanded':snap==='compact'?'Compact':'Hidden'}`;
        });
        const finish=e=>{
          if(!drag)return;
          const dx=e.clientX-drag.x,dy=e.clientY-drag.y,moved=drag.moved;
          if(moved){
            const next=shelfSnapMode(drag.area,drag.startMode,shelfTowardEdge(drag.area,dx,dy));
            grip.dataset.suppressClick=String(Date.now()+500);
            setShelfMode(drag.area,next);
          }
          drag=null;
          delete document.body.dataset.shelfDragging;delete document.body.dataset.shelfSnap;
          document.documentElement.style.removeProperty('--shelf-drag-x');document.documentElement.style.removeProperty('--shelf-drag-y');
          try{grip.releasePointerCapture(e.pointerId)}catch{}
        };
        grip.addEventListener('pointerup',finish);grip.addEventListener('pointercancel',finish);
      });
    }
    function bindDockDrag(){const dock=$('#dock'),grip=$('#dockGrip');let dragging=false;grip.addEventListener('pointerdown',e=>{e.preventDefault();dragging=true;grip.setPointerCapture(e.pointerId);const r=dock.getBoundingClientRect();dock.classList.add('dragging');dock.style.left=`${r.left}px`;dock.style.top=`${r.top}px`;dock.style.right='auto';dock.style.bottom='auto';dock.style.width=`${r.width}px`;});grip.addEventListener('pointermove',e=>{if(!dragging)return;const r=dock.getBoundingClientRect();dock.style.left=`${clamp(e.clientX-r.width/2,0,innerWidth-r.width)}px`;dock.style.top=`${clamp(e.clientY-r.height/2,0,innerHeight-r.height)}px`;});const release=e=>{if(!dragging)return;dragging=false;dock.classList.remove('dragging');const r=dock.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,d={left:cx,right:innerWidth-cx,top:cy,bottom:innerHeight-cy},edge=Object.entries(d).sort((a,b)=>a[1]-b[1])[0][0];uiPrefs.dockPosition=edge;dock.style.cssText='';applyUiPrefs();toast(`Dock snapped to ${edge} edge`);};grip.addEventListener('pointerup',release);grip.addEventListener('pointercancel',release);}

    function openSettings(){openDrawer('Layout, bars & performance');}
    function toggleButton(button){button.classList.toggle('active');}

    function anchorToOrigin(anchor='mc'){const map={tl:'0% 0%',tc:'50% 0%',tr:'100% 0%',ml:'0% 50%',mc:'50% 50%',mr:'100% 50%',bl:'0% 100%',bc:'50% 100%',br:'100% 100%'};return map[anchor]||map.mc;}
    function setSelectedSkew(axis,value){if(!selectedObject)return;selectedObject[axis==='x'?'skewX':'skewY']=clamp(Number(value)||0,-85,85);commitTransform(selectedObject);}
    function setSelectedFilter(key,value){if(!selectedObject)return;const v=Number(value)||0;if(key==='brightness'||key==='contrast'||key==='saturation')selectedObject[key]=clamp(v/100,0,2.5);else if(key==='hue')selectedObject.hue=clamp(v,-180,180);else selectedObject.blur=clamp(v,0,20);commitTransform(selectedObject);}
    function setSelectedAnchor(anchor){if(!selectedObject)return;selectedObject.anchor=anchor;commitTransform(selectedObject);}
    function alignSelected(kind){const s=selectedObject;if(!s)return;const b=objectSurfaceBounds(s),w=s.el.offsetWidth*Math.abs(s.scaleX||1),h=s.el.offsetHeight*Math.abs(s.scaleY||1);if(kind==='left')s.x=8;if(kind==='center')s.x=(b.width-w)/2;if(kind==='right')s.x=b.width-w-8;if(kind==='top')s.y=8;if(kind==='middle')s.y=(b.height-h)/2;if(kind==='bottom')s.y=b.height-h-8;commitTransform(s);toast(`${s.asset.name} aligned ${kind}`);}
    function scheduleStudioRefresh(){clearTimeout(layerRefreshTimer);layerRefreshTimer=setTimeout(()=>{renderLayers();renderEnvironmentLabels();},45);}
    function serializeObjectState(s){ensureTransformState(s);return {assetId:s.asset.id,scope:s.scope||'world',side:s.side||'ui',gravity:!!s.gravity,x:s.x,y:s.y,rotation:s.rotation,scaleX:s.scaleX,scaleY:s.scaleY,opacity:s.opacity,blendMode:s.blendMode,locked:s.locked,zIndex:s.zIndex,skewX:s.skewX,skewY:s.skewY,brightness:s.brightness,contrast:s.contrast,saturation:s.saturation,hue:s.hue,blur:s.blur,visible:s.visible,anchor:s.anchor,integrity:s.integrity,isMascot:!!s.isMascot,themeLinked:!!s.themeLinked,userAdded:s.userAdded!==false,pinTargetKey:s.pinTargetKey||pinTargetKey(s.pinTarget),pinX:s.pinX,pinY:s.pinY};}
    function captureStudioState(){return {theme:currentTheme,view:currentView,mode:currentMode,world:currentWorldState,weather:currentWeather,timePreset:currentTimePreset,timeHour:currentTimePreset==='custom'?currentTimeHour:null,leftWidth,rightWidth,objects:[...objectState.values()].map(serializeObjectState),environment:JSON.parse(JSON.stringify(environmentConfig)),room:roomStateSnapshot()};}
    function stateHash(state=captureStudioState()){return JSON.stringify(state);}
    function recordHistory(label='Edit',{force=false}={}){if(!historyState.ready||historyState.restoring)return;const state=captureStudioState(),hash=stateHash(state);if(!force&&historyState.entries[historyState.index]?.hash===hash)return;historyState.entries=historyState.entries.slice(0,historyState.index+1);historyState.entries.push({label,time:Date.now(),state,hash});if(historyState.entries.length>historyState.max)historyState.entries.shift();historyState.index=historyState.entries.length-1;historyState.lastHash=hash;renderHistory();}
    function queueHistory(label='Edit',delay=140){if(!historyState.ready||historyState.restoring)return;clearTimeout(historyTimer);historyTimer=setTimeout(()=>recordHistory(label),delay);}
    function initHistory(){historyState.ready=true;historyState.entries=[];historyState.index=-1;recordHistory('Opened V24 measured-adaptive living-world studio',{force:true});}
    function clearAllObjectsForRestore(){[...objectState.values()].forEach(o=>{cancelObjectPeel(o);cancelObjectPhysics(o,{zeroVelocity:true,settle:false});clearTimeout(o.mascotActionTimer);clearTimeout(o.mascotSpeechTimer);o.el.remove()});objectState.clear();selectedObject=null;setSelectedObject(null);}
    function restoreStudioState(snapshot){if(!snapshot)return;historyState.restoring=true;try{setTheme(snapshot.theme,false);setMode(snapshot.mode,false);setWorldState(snapshot.world,false);setView(snapshot.view);updateWidths(snapshot.leftWidth,snapshot.rightWidth);setWeather(snapshot.weather,false);if(snapshot.timePreset==='custom'){currentTimePreset='custom';applyTimeHour(snapshot.timeHour??12,{notify:false,preset:'custom'});}else setTimePreset(snapshot.timePreset,false);clearAllObjectsForRestore();snapshot.objects.forEach(item=>{const asset=assetById[item.assetId];if(!asset)return;let o;if(item.scope==='world')o=spawnObject(item.side,asset,item.x,item.y,false);else o=spawnUiObject(asset,item.x,item.y,{scope:item.scope,gravity:item.gravity,notify:false,target:resolvePinTargetKey(item.pinTargetKey)||$('.workspace-frame')});Object.assign(o,item);o.asset=asset;o.el.dataset.scope=o.scope;if(o.scope==='sticker'){o.pinTarget=resolvePinTargetKey(item.pinTargetKey)||$('.workspace-frame');o.el.classList.add('sticker-object');updatePinnedObject(o);}updateObjectTransform(o);});Object.assign(environmentConfig,JSON.parse(JSON.stringify(snapshot.environment||{})));restoreRoomSemanticState(snapshot.room);applyEnvironmentConfig(false);$('#objectCount').textContent=objectState.size;saveScrapbookState();scheduleStudioRefresh();}finally{historyState.restoring=false;}}
    function undoHistory(){if(historyState.index<=0)return;historyState.index--;restoreStudioState(historyState.entries[historyState.index].state);renderHistory();toast(`Undo: ${historyState.entries[historyState.index].label}`);}
    function redoHistory(){if(historyState.index>=historyState.entries.length-1)return;historyState.index++;restoreStudioState(historyState.entries[historyState.index].state);renderHistory();toast(`Redo: ${historyState.entries[historyState.index].label}`);}
    function jumpHistory(index){index=clamp(index,0,historyState.entries.length-1);historyState.index=index;restoreStudioState(historyState.entries[index].state);renderHistory();}
    function clearHistory(){const state=captureStudioState();historyState.entries=[{label:'History cleared',time:Date.now(),state,hash:stateHash(state)}];historyState.index=0;renderHistory();}
    function renderHistory(){const canUndo=historyState.index>0,canRedo=historyState.index<historyState.entries.length-1;['undoButton','historyUndo'].forEach(id=>{const b=$('#'+id);if(b)b.disabled=!canUndo});['redoButton','historyRedo'].forEach(id=>{const b=$('#'+id);if(b)b.disabled=!canRedo});if($('#historyCount'))$('#historyCount').textContent=`${Math.max(0,historyState.index+1)}/${historyState.entries.length}`;const host=$('#historyList');if(!host)return;host.innerHTML=historyState.entries.map((h,i)=>`<button class="history-row ${i===historyState.index?'current':''} ${i>historyState.index?'future':''}" data-history-index="${i}"><span>${i===historyState.index?'●':i<historyState.index?'✓':'○'}</span><span><strong>${h.label}</strong><span>${new Date(h.time).toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'})}</span></span><span>#${i+1}</span></button>`).reverse().join('');$$('[data-history-index]',host).forEach(b=>b.addEventListener('click',()=>jumpHistory(Number(b.dataset.historyIndex))));}
    function layerGroupLabel(s){if(s.scope==='sticker')return 'Pinned stickers';if(s.scope==='ui')return 'Whole UI actors';return s.side==='left'?'Left world':'Right world';}
    function renderLayers(){const host=$('#layersList');if(!host)return;const groups=['Whole UI actors','Pinned stickers','Left world','Right world'];host.innerHTML=groups.map(name=>{const items=[...objectState.values()].filter(s=>layerGroupLabel(s)===name).sort((a,b)=>(b.zIndex||0)-(a.zIndex||0));return `<section class="layer-group"><div class="layer-group-head"><span>${name}</span><span>${items.length}</span></div><div class="layer-list">${items.length?items.map(s=>`<div class="layer-row ${selectedObject===s?'active':''}" data-layer-id="${s.id}" draggable="true"><span class="layer-drag">⋮⋮</span><span class="layer-thumb">${s.asset.art}</span><span class="layer-copy"><strong>${s.asset.name}</strong><span>${objectScopeLabel(s)} · z ${s.zIndex}</span></span><button data-layer-visible="${s.id}" class="${s.visible?'active':''}" title="Show or hide">${s.visible?'◉':'○'}</button><button data-layer-lock="${s.id}" class="${s.locked?'active':''}" title="Lock or unlock">${s.locked?'🔒':'🔓'}</button></div>`).join(''):'<div class="subtle" style="padding:10px">No layers in this group.</div>'}</div></section>`}).join('');$$('[data-layer-id]',host).forEach(row=>{row.addEventListener('click',e=>{if(e.target.closest('button'))return;setSelectedObject(objectState.get(Number(row.dataset.layerId)))});row.addEventListener('dragstart',e=>{row.classList.add('dragging');e.dataTransfer.setData('text/layer-id',row.dataset.layerId)});row.addEventListener('dragend',()=>row.classList.remove('dragging'));row.addEventListener('dragover',e=>e.preventDefault());row.addEventListener('drop',e=>{e.preventDefault();const from=objectState.get(Number(e.dataTransfer.getData('text/layer-id'))),to=objectState.get(Number(row.dataset.layerId));if(!from||!to||from===to)return;from.zIndex=(to.zIndex||1)+1;commitTransform(from);setSelectedObject(from);recordHistory(`Reordered ${from.asset.name}`);});});$$('[data-layer-visible]',host).forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const o=objectState.get(Number(b.dataset.layerVisible));o.visible=!o.visible;updateObjectTransform(o);renderLayers();recordHistory(`${o.visible?'Showed':'Hid'} ${o.asset.name}`);}));$$('[data-layer-lock]',host).forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const o=objectState.get(Number(b.dataset.layerLock));toggleSelectedLock(o);renderLayers();recordHistory(`${o.locked?'Locked':'Unlocked'} ${o.asset.name}`);}));}

    function environmentThemePreset(){return {frutiger:'frutiger',vaporwave:'vapor',pomo:'aurora',backrooms:'backrooms',diner:'diner',memphis:'raincity'}[currentTheme]||'cosmic';}
    function resizeEnvironmentCanvas(canvas){if(!canvas||canvas.offsetWidth<2||canvas.offsetHeight<2)return false;const dpr=Math.min(devicePixelRatio||1,1.75),w=Math.max(2,Math.round(canvas.offsetWidth*dpr)),h=Math.max(2,Math.round(canvas.offsetHeight*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}return true;}
    function drawEnvironment(canvas,time=0){if(!resizeEnvironmentCanvas(canvas))return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,t=time*.001*(environmentConfig.motion&&!environmentConfig.paused?environmentConfig.speed/42:0);ctx.clearRect(0,0,w,h);if(environmentMediaKind==='image'&&environmentImage){ctx.drawImage(environmentImage,0,0,w,h);return;}if(environmentMediaKind==='video'&&!$('#wallpaperVideo').paused&&$('#wallpaperVideo').readyState>=2){ctx.drawImage($('#wallpaperVideo'),0,0,w,h);return;}const preset=environmentConfig.preset;if(preset==='cosmic')drawCosmic(ctx,w,h,t);else if(preset==='frutiger')drawFrutigerWallpaper(ctx,w,h,t);else if(preset==='aurora')drawAurora(ctx,w,h,t);else if(preset==='ocean')drawOcean(ctx,w,h,t);else if(preset==='vapor')drawVapor(ctx,w,h,t);else if(preset==='raincity')drawRainCity(ctx,w,h,t);else if(preset==='backrooms')drawBackrooms(ctx,w,h,t);else drawDiner(ctx,w,h,t);}
    function skyGradient(ctx,w,h,colors){const g=ctx.createLinearGradient(0,0,0,h);colors.forEach((c,i)=>g.addColorStop(i/(colors.length-1),c));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
    function drawCosmic(ctx,w,h,t){skyGradient(ctx,w,h,['#02030d','#071933','#0c3351']);const fov=environmentConfig.fov*6,px=w/2+environmentConfig.yaw/90*w*.12+environmentPointer.x*w*.025,py=h*environmentConfig.horizon/100+environmentConfig.pitch/45*h*.1+environmentPointer.y*h*.025;ctx.save();for(const star of environmentStars){let z=star.z-(t*55+star.seed*2)%(1200);if(z<20)z+=1200;const sx=px+star.x/z*fov,sy=py+star.y/z*fov;if(sx<0||sx>w||sy<0||sy>h)continue;const a=clamp(1-z/1200,.08,.9);ctx.fillStyle=`rgba(${150+star.seed%100},${190+star.seed%65},255,${a})`;ctx.beginPath();ctx.arc(sx,sy,star.size*(1.4-z/1500),0,Math.PI*2);ctx.fill();}ctx.restore();const pr=Math.min(w,h)*.21,pcx=w*.53+Math.sin(t*.25)*w*.03,pcy=h*.41+Math.cos(t*.2)*h*.02;const pg=ctx.createRadialGradient(pcx-pr*.35,pcy-pr*.42,pr*.12,pcx,pcy,pr);pg.addColorStop(0,'#fbffff');pg.addColorStop(.22,'#a6efff');pg.addColorStop(.58,'#297eaa');pg.addColorStop(1,'#031c3a');ctx.fillStyle=pg;ctx.beginPath();ctx.arc(pcx,pcy,pr,0,Math.PI*2);ctx.fill();ctx.save();ctx.translate(pcx,pcy);ctx.rotate(-.22+Math.sin(t*.2)*.04);ctx.strokeStyle='rgba(108,232,255,.72)';ctx.lineWidth=Math.max(2,pr*.035);ctx.beginPath();ctx.ellipse(0,0,pr*1.52,pr*.37,0,0,Math.PI*2);ctx.stroke();ctx.restore();drawPerspectiveFloor(ctx,w,h,'rgba(93,226,255,.23)','rgba(14,111,138,.18)');ctx.fillStyle='rgba(139,239,255,.76)';for(let i=0;i<5;i++){const x=w*(.11+i*.2)+Math.sin(t+i)*18,y=h*(.68+Math.sin(i)*.025);ctx.fillRect(x-18,y,36,5);ctx.fillRect(x-2,y-24,4,25);}}
    function drawPerspectiveFloor(ctx,w,h,line,fill){const horizon=h*environmentConfig.horizon/100,floor=h*environmentConfig.floor/100;const g=ctx.createLinearGradient(0,horizon,0,h);g.addColorStop(0,'transparent');g.addColorStop(1,fill);ctx.fillStyle=g;ctx.fillRect(0,horizon,w,h-horizon);ctx.strokeStyle=line;ctx.lineWidth=1;for(let i=-12;i<=12;i++){ctx.beginPath();ctx.moveTo(w/2+i*7,horizon);ctx.lineTo(w/2+i*w*.12,h);ctx.stroke();}for(let y=horizon+10;y<h;y+=Math.max(9,(y-horizon)*.18)){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}}
    function drawFrutigerWallpaper(ctx,w,h,t){skyGradient(ctx,w,h,['#3cc9ff','#8de7ff','#d8fff0']);const sun=ctx.createRadialGradient(w*.72,h*.22,0,w*.72,h*.22,h*.28);sun.addColorStop(0,'rgba(255,255,215,.95)');sun.addColorStop(.4,'rgba(255,242,122,.35)');sun.addColorStop(1,'transparent');ctx.fillStyle=sun;ctx.fillRect(0,0,w,h);ctx.fillStyle='#31c98c';ctx.beginPath();ctx.moveTo(0,h*.68);ctx.quadraticCurveTo(w*.22,h*.45,w*.45,h*.69);ctx.quadraticCurveTo(w*.7,h*.39,w,h*.65);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();ctx.fillStyle='rgba(73,225,255,.74)';ctx.beginPath();ctx.moveTo(0,h*.78);ctx.bezierCurveTo(w*.25,h*(.73+Math.sin(t)*.02),w*.7,h*.88,w,h*.72);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();for(let i=0;i<18;i++){const x=(i*97+t*22)%w,y=h*(.15+(i%6)*.11);ctx.strokeStyle='rgba(255,255,255,.65)';ctx.beginPath();ctx.arc(x,y,5+i%4*2,0,Math.PI*2);ctx.stroke();}}
    function drawAurora(ctx,w,h,t){skyGradient(ctx,w,h,['#020722','#153258','#07182f']);for(let i=0;i<4;i++){ctx.strokeStyle=['rgba(94,255,203,.36)','rgba(117,181,255,.34)','rgba(255,124,229,.26)','rgba(180,255,121,.24)'][i];ctx.lineWidth=h*.12;ctx.beginPath();for(let x=0;x<=w;x+=12){const y=h*(.2+i*.11)+Math.sin(x*.011+t*.8+i)*h*.09;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}drawPerspectiveFloor(ctx,w,h,'rgba(99,220,255,.18)','rgba(15,55,80,.18)');}
    function drawOcean(ctx,w,h,t){skyGradient(ctx,w,h,['#051a39','#0a6793','#5ce8d8']);for(let y=0;y<h;y+=18){ctx.strokeStyle=`rgba(190,255,255,${.08+(y/h)*.15})`;ctx.beginPath();for(let x=0;x<=w;x+=12){const yy=y+Math.sin(x*.02+t*1.4+y*.02)*7;if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}ctx.stroke();}for(let i=0;i<20;i++){ctx.strokeStyle='rgba(220,255,255,.45)';ctx.beginPath();ctx.arc((i*83+t*22)%w,h-(i*47+t*18)%h,3+i%4,0,Math.PI*2);ctx.stroke();}}
    function drawVapor(ctx,w,h,t){skyGradient(ctx,w,h,['#14072e','#5e1d79','#ff6aae']);const sunY=h*.34,sr=Math.min(w,h)*.17;ctx.fillStyle='#ffd45c';ctx.beginPath();ctx.arc(w*.5,sunY,sr,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,72,172,.85)';for(let i=0;i<6;i++)ctx.fillRect(w*.5-sr,sunY-sr+i*sr*.35,sr*2,5);drawPerspectiveFloor(ctx,w,h,'rgba(68,242,255,.5)','rgba(34,4,66,.35)');}
    function drawRainCity(ctx,w,h,t){skyGradient(ctx,w,h,['#06101f','#16324c','#274660']);ctx.fillStyle='#071321';for(let i=0;i<14;i++){const bw=w/14+5,bh=h*(.2+(i%5)*.07);ctx.fillRect(i*w/14,h-bh,bw,bh);ctx.fillStyle=i%3===0?'#56d9ff':'#ff5bc8';for(let y=h-bh+12;y<h-10;y+=14)ctx.fillRect(i*w/14+7,y,3,5);ctx.fillStyle='#071321';}ctx.strokeStyle='rgba(177,230,255,.42)';for(let i=0;i<100;i++){const x=(i*67+t*180)%w,y=(i*97+t*330)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-8,y+18);ctx.stroke();}}
    function drawBackrooms(ctx,w,h,t){skyGradient(ctx,w,h,['#b8ac61','#807744','#393520']);const horizon=h*.42;ctx.strokeStyle='rgba(55,51,25,.55)';for(let x=0;x<w;x+=w/8){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(w/2+(x-w/2)*.28,horizon);ctx.stroke();ctx.beginPath();ctx.moveTo(w/2+(x-w/2)*.28,horizon);ctx.lineTo(x,h);ctx.stroke();}for(let y=0;y<h;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}ctx.fillStyle='rgba(255,252,195,.78)';for(let i=0;i<5;i++)ctx.fillRect(w*(.08+i*.2),h*.08, w*.11,5);}
    function drawDiner(ctx,w,h,t){skyGradient(ctx,w,h,['#060b1b','#17143a','#541843']);ctx.fillStyle='#ff3e88';ctx.font=`800 ${Math.max(18,h*.12)}px system-ui`;ctx.textAlign='center';ctx.shadowColor='#ff3e88';ctx.shadowBlur=18;ctx.fillText('OPEN 24 HOURS',w/2,h*.3);ctx.shadowBlur=0;ctx.strokeStyle='#58efff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,h*.72);ctx.lineTo(w,h*.72);ctx.stroke();for(let i=0;i<18;i++){ctx.fillStyle=i%2?'#f7f0ef':'#18162b';ctx.fillRect(i*w/18,h*.72,w/18,h*.28);}}
    function activeEnvironmentCanvases(){const map={full:[$('#wallpaperCanvas')],'left-window':[$('#leftWindowCanvas')],'right-window':[$('#rightWindowCanvas')],'both-windows':[$('#leftWindowCanvas'),$('#rightWindowCanvas')],tv:[$('#tvCanvas')],selected:[$('#selectedSurfaceWallpaper')],off:[]};return map[environmentConfig.target]||[];}
    function positionSelectedSurfaceCanvas(){const c=$('#selectedSurfaceWallpaper');if(environmentConfig.target!=='selected'||!selectedObject){c.style.display='none';return;}const r=selectedObject.el.getBoundingClientRect();c.style.display='block';c.style.left=`${r.left}px`;c.style.top=`${r.top}px`;c.style.width=`${Math.max(24,r.width)}px`;c.style.height=`${Math.max(24,r.height)}px`;}
    function environmentLoop(time){environmentRAF=0;if(window.__ffRuntimeGovernor?.isSuspended()||document.hidden)return;const fps=resolvedVisualQuality==='ultra'?30:resolvedVisualQuality==='balanced'?20:12;positionSelectedSurfaceCanvas();activeEnvironmentCanvases().forEach(c=>drawEnvironment(c,time));const preview=$('#environmentPreviewCanvas');if(preview?.offsetParent!==null||$('#floatingVault')?.dataset.tab==='environment')drawEnvironment(preview,time);environmentLast=time;const delay=Math.max(0,1000/fps-18);environmentTimer=setTimeout(()=>{environmentTimer=0;if(!window.__ffRuntimeGovernor?.isSuspended()&&!document.hidden)environmentRAF=requestAnimationFrame(environmentLoop);},delay);}
    function startEnvironmentRenderer(){if(environmentRAF||environmentTimer||window.__ffRuntimeGovernor?.isSuspended()||document.hidden)return;environmentRAF=requestAnimationFrame(environmentLoop);}
    function stopEnvironmentRenderer(){if(environmentRAF)cancelAnimationFrame(environmentRAF);if(environmentTimer)clearTimeout(environmentTimer);environmentRAF=0;environmentTimer=0;}
    function applyEnvironmentConfig(notify=true){document.body.dataset.wallpaperTarget=environmentConfig.target;document.body.dataset.environmentMapping=environmentConfig.mapping;document.documentElement.style.setProperty('--wallpaper-opacity',environmentConfig.opacity);['environmentType','environmentTarget','environmentPreset'].forEach(id=>{const el=$('#'+id);if(el)el.value=environmentConfig[id.replace('environment','').toLowerCase()]||environmentConfig[id==='environmentType'?'type':id==='environmentTarget'?'target':'preset']});const values={environmentOpacity:Math.round(environmentConfig.opacity*100),environmentSpeed:environmentConfig.speed,environmentFov:environmentConfig.fov,environmentHorizon:environmentConfig.horizon,environmentFloor:environmentConfig.floor,environmentYaw:environmentConfig.yaw,environmentPitch:environmentConfig.pitch,environmentDepth:environmentConfig.depth};Object.entries(values).forEach(([id,v])=>{const el=$('#'+id);if(el)el.value=v;const out=$('#'+id+'Value');if(out)out.textContent=id==='environmentOpacity'?`${v}%`:['environmentFov','environmentYaw','environmentPitch'].includes(id)?`${v}°`:String(v)});$('#environmentThemeSync')?.classList.toggle('active',environmentConfig.themeSync);$('#environmentMotion')?.classList.toggle('active',environmentConfig.motion);$('#environmentParallax')?.classList.toggle('active',environmentConfig.parallax);$('#environmentPauseHidden')?.classList.toggle('active',environmentConfig.pauseHidden);$('#environmentPause').textContent=environmentConfig.paused?'Resume':'Pause';renderEnvironmentLabels();positionSelectedSurfaceCanvas();if(notify){toast(`Environment mapped to ${environmentConfig.target.replaceAll('-',' ')}`);recordHistory('Changed animated wallpaper / 3D environment');}}
    function renderEnvironmentLabels(){const preset=$('#environmentPreset')?.selectedOptions[0]?.textContent||environmentConfig.preset,target=$('#environmentTarget')?.selectedOptions[0]?.textContent||environmentConfig.target;if($('#environmentSourceLabel'))$('#environmentSourceLabel').textContent=environmentMediaKind?`${environmentMediaKind} · ${environmentConfig.sourceName}`:`${environmentConfig.type==='3d'?'Procedural 3D':'Animated'} · ${preset}`;if($('#environmentTargetLabel'))$('#environmentTargetLabel').textContent=target;if($('#environmentRendererLabel'))$('#environmentRendererLabel').textContent=environmentConfig.type==='3d'?'Canvas 3D projection + semantic surfaces':environmentConfig.type==='media'?'Imported media compositor':'Procedural wallpaper compositor';}

    function roomObjectById(id){return roomSemanticState.objects.find(o=>o.id===id)||null;}
    function selectedRoomObject(){return roomObjectById(roomSemanticState.selectedId)||roomSemanticState.objects[0];}
    function roomStateSnapshot(){return {sourceName:roomSemanticState.sourceName,imported:roomSemanticState.imported,importMode:roomSemanticState.importMode,keepUnified:roomSemanticState.keepUnified,detachInteractables:roomSemanticState.detachInteractables,autoPhysics:roomSemanticState.autoPhysics,mascotAffordances:roomSemanticState.mascotAffordances,selectedId:roomSemanticState.selectedId,stage:roomSemanticState.stage,tableAssetId:roomSemanticState.tableAssetId,objects:roomSemanticState.objects.map(o=>({...o,actions:[...o.actions]}))};}
    function restoreRoomSemanticState(snapshot){if(!snapshot)return;Object.assign(roomSemanticState,snapshot);roomSemanticState.objects=(snapshot.objects||roomSemanticState.objects).map(o=>({...o,actions:[...(o.actions||[])]}));renderRoomIntelligence();}
    function roomModeLabel(){return roomSemanticState.importMode==='unified-detached'?'Unified room + detached actors':roomSemanticState.importMode==='unified'?'Unified room environment':roomSemanticState.importMode==='decomposed'?'Fully decomposed object set':'CAS-style visual background';}
    function roomRoleArt(obj){const p=themes[currentTheme].palette;const stroke='#eaffff';if(obj.id==='sofa')return svg(`<path d="M16 47c0-15 10-25 25-25h18c15 0 25 10 25 25v30H16z" fill="${p[1]}" stroke="${stroke}" stroke-width="3"/><path d="M24 58h52v20H24z" fill="${p[0]}" opacity=".8"/><path d="M25 78v10M75 78v10" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>`);if(obj.id==='table')return svg(`<ellipse cx="50" cy="35" rx="34" ry="17" fill="rgba(220,255,255,.72)" stroke="${stroke}" stroke-width="3"/><path d="M50 50v31M30 84h40" stroke="${p[1]}" stroke-width="6" stroke-linecap="round"/>`);if(obj.id==='tv')return svg(`<rect x="14" y="20" width="72" height="54" rx="9" fill="#11283c" stroke="${stroke}" stroke-width="3"/><rect x="22" y="28" width="56" height="38" rx="6" fill="${p[0]}"/><path d="M40 76v10M60 76v10M31 88h38" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>`);if(obj.id==='lamp')return svg(`<path d="M50 24v56M31 87h38" stroke="${p[1]}" stroke-width="6" stroke-linecap="round"/><path d="M27 14h46L63 42H37z" fill="#fff4a6" stroke="${stroke}" stroke-width="3"/>`);if(obj.id==='window')return svg(`<rect x="17" y="16" width="66" height="66" rx="7" fill="#70d9ff" stroke="${stroke}" stroke-width="5"/><path d="M50 17v64M18 49h64" stroke="${stroke}" stroke-width="4"/><path d="M19 64c17-16 40-12 62-26v43H19z" fill="#69dc91"/>`);if(obj.id==='door')return svg(`<rect x="28" y="10" width="44" height="80" rx="3" fill="${p[1]}" stroke="${stroke}" stroke-width="4"/><circle cx="62" cy="52" r="4" fill="#fff6a2"/>`);return svg(`<path d="M16 66L50 21l34 45-34 18z" fill="${p[1]}" stroke="${stroke}" stroke-width="3"/><path d="M17 66h66" stroke="${p[0]}" stroke-width="7"/>`);}
    function renderRoomPipeline(stage=roomSemanticState.stage){const order=['bridge','segment','semantic','physics','affordance'];const idx={idle:-1,bridge:0,segment:1,semantic:2,physics:3,affordance:4,ready:5}[stage]??5;$$('[data-room-stage]').forEach((el,i)=>{el.classList.toggle('done',i<idx||idx===5);el.classList.toggle('active',i===idx);const dot=$('.stage-dot',el);if(dot)dot.textContent=i<idx||idx===5?'✓':i===idx?'●':'○';});}
    function renderRoomAssetTray(){const host=$('#roomAssetTray');if(!host)return;host.innerHTML=assets.slice(0,6).map(a=>assetCardMarkup(a,true)).join('');bindAssetCards(host);}
    function renderRoomIntelligence(){if(!$('#roomIntelligencePanel'))return;renderRoomAssetTray();$('#roomSourceLabel').textContent=roomSemanticState.sourceName;$('#roomModeLabel').textContent=roomModeLabel();$('#roomDetectedCount').textContent=`${roomSemanticState.objects.length} semantic actors`;$('#roomRuntimeStatus').textContent=roomSemanticState.stage==='ready'?'Ready':`Scanning · ${roomSemanticState.stage}`;$('#roomImportMode').value=roomSemanticState.importMode;$('#roomKeepUnified').classList.toggle('active',roomSemanticState.keepUnified);$('#roomDetachInteractables').classList.toggle('active',roomSemanticState.detachInteractables);$('#roomAutoPhysics').classList.toggle('active',roomSemanticState.autoPhysics);$('#roomMascotAffordances').classList.toggle('active',roomSemanticState.mascotAffordances);renderRoomPipeline();const host=$('#detectedRoomObjects');host.innerHTML=roomSemanticState.objects.map(o=>`<button class="room-detected-row ${o.id===roomSemanticState.selectedId?'active':''}" data-room-select="${o.id}"><span class="room-detected-icon">${o.icon}</span><span class="room-detected-copy"><strong>${o.name}</strong><span>${o.role} · ${o.physics}</span></span><span class="room-detected-status"><b>${o.interactive?'Interactive':'Structural'}</b><span>${o.atlasId?'In Atlas':o.detachable?'Detachable':'Room-bound'}</span></span></button>`).join('');$$('[data-room-select]',host).forEach(b=>b.addEventListener('click',()=>selectRoomObject(b.dataset.roomSelect)));const obj=selectedRoomObject();$('#roomSelectedName').textContent=obj.name;$('#roomSelectedRole').textContent=obj.role;$('#roomSelectedOwner').textContent=obj.atlasId?'Room actor + Object Atlas':'Imported room scene graph';$('#roomSelectedState').textContent=obj.state;$('#roomRoleSelect').value=[...$('#roomRoleSelect').options].some(x=>x.value===obj.role)?obj.role:'Decoration';$('#roomPhysicsSelect').value=[...$('#roomPhysicsSelect').options].some(x=>x.value===obj.physics)?obj.physics:'Static collision';$('#roomAffordanceChips').innerHTML=obj.actions.map((a,i)=>`<button data-room-affordance="${i}">${a}</button>`).join('');$$('[data-room-affordance]').forEach(b=>b.addEventListener('click',()=>testRoomAffordance(obj.id,obj.actions[Number(b.dataset.roomAffordance)])));$$('[data-room-mesh]').forEach(el=>{const id=el.dataset.roomMesh;const item=roomObjectById(id);el.classList.toggle('selected',id===roomSemanticState.selectedId);el.dataset.hidden=String(item?.visible===false);el.dataset.locked=String(item?.locked===true)});$('#roomToggleVisible').textContent=obj.visible?'Hide mesh':'Show mesh';$('#roomToggleLock').textContent=obj.locked?'Unlock mapping':'Lock mapping';const prop=$('#roomTableProp');const a=roomSemanticState.tableAssetId&&assetById[roomSemanticState.tableAssetId];prop.innerHTML=a?a.art:'';renderRoomPipeline();}
    function selectRoomObject(id){roomSemanticState.selectedId=id;renderRoomIntelligence();}
    function roomMascotTo(target,action=''){const m=$('#roomPreviewMascot');m.classList.remove('sitting','bouncing','at-tv','at-lamp','at-table');if(target==='sofa')m.classList.add(action.toLowerCase().includes('bounce')?'bouncing':'sitting');else if(target==='tv')m.classList.add('at-tv');else if(target==='lamp')m.classList.add('at-lamp');else if(target==='table')m.classList.add('at-table');else {m.style.left=target==='door'?'8%':'18%';m.style.bottom=target==='door'?'22%':'18%';}if(action.toLowerCase().includes('bounce'))setTimeout(()=>m.classList.remove('bouncing'),2100);}
    function placeRoomAssetOnTable(asset=selectedAsset,notify=true){if(!asset)return;roomSemanticState.tableAssetId=asset.id;roomObjectById('table').state=`Holding ${asset.name}`;renderRoomIntelligence();saveRoomSemanticState();if(notify){toast(`${asset.name} placed on the imported room table`);recordHistory(`Placed ${asset.name} on room table`);} }
    function testRoomAffordance(id=roomSemanticState.selectedId,action=''){const obj=roomObjectById(id);roomSemanticState.selectedId=id;const a=String(action||obj.actions[0]).toLowerCase();if(id==='sofa'){roomMascotTo('sofa',a.includes('bounce')?'bounce':'sit');obj.state=a.includes('bounce')?'Mascot bouncing on cushions':'Mascot seated on couch';}else if(id==='tv'){const el=$('[data-room-mesh="tv"]');el.classList.toggle('on');obj.state=el.classList.contains('on')?'Screen on · environment channel':'Screen off';roomMascotTo('tv');}else if(id==='lamp'){const el=$('[data-room-mesh="lamp"]');el.classList.toggle('on');obj.state=el.classList.contains('on')?'Light on':'Light off';roomMascotTo('lamp');}else if(id==='table'){placeRoomAssetOnTable(selectedAsset,false);obj.state=`Holding ${selectedAsset?.name||'object'}`;roomMascotTo('table');}else if(id==='door'){const el=$('[data-room-mesh="door"]');el.classList.toggle('open');obj.state=el.classList.contains('open')?'Door open':'Door closed';roomMascotTo('door');}else if(id==='window'){environmentConfig.target='both-windows';applyEnvironmentConfig(false);obj.state=`Mapped ${environmentConfig.sourceName} outside windows`;}else if(id==='floor'){roomMascotTo('floor');obj.state='Mascot navigation path rebuilt';}else obj.state=`Tested ${action||obj.actions[0]}`;renderRoomIntelligence();saveRoomSemanticState();toast(`${obj.name}: ${obj.state}`);queueHistory(`Tested ${obj.name}`,80);}
    function extractRoomObjectToAtlas(obj=selectedRoomObject(),{notify=true,test=false}={}){if(!obj||!obj.detachable){if(notify)toast(`${obj?.name||'This mesh'} stays bound to the room`);return null;}if(obj.atlasId&&assetById[obj.atlasId]){selectedAsset=assetById[obj.atlasId];selectAsset(selectedAsset.id);if(notify)toast(`${obj.name} is already in Object Atlas`);return selectedAsset;}const id=`room-${obj.id}-${test?'test':Date.now()}`;const asset={id,theme:currentTheme,name:obj.name,art:roomRoleArt(obj),type:`Imported room · ${obj.role}`,physics:obj.physics,affordances:obj.actions.join(', '),mascot:obj.mascot,breakable:['sofa','tv','lamp','table'].includes(obj.id),semanticRole:obj.role,sourceRoom:roomSemanticState.sourceName,roomAffordances:[...obj.actions]};assets.unshift(asset);assetById[id]=asset;obj.atlasId=id;selectedAsset=asset;renderAssetGrid($('#assetSearch')?.value||'');renderFloatingAssetGrid($('#floatingAssetSearch')?.value||'');selectAsset(id);renderRoomIntelligence();saveRoomSemanticState();if(notify){toast(`${obj.name} extracted into Object Atlas with room lineage`);recordHistory(`Extracted ${obj.name} from Blender room`);}return asset;}
    function extractAllRoomObjects(){const extracted=roomSemanticState.objects.filter(o=>o.detachable).map(o=>extractRoomObjectToAtlas(o,{notify:false})).filter(Boolean);renderRoomIntelligence();saveRoomSemanticState();toast(`${extracted.length} room actors available in Object Atlas`);recordHistory('Extracted all Blender room interactables');}
    function scanRoomPipeline(file=null){if(file){roomSemanticState.sourceName=file.name;roomSemanticState.imported=true;}roomSemanticState.stage='bridge';renderRoomIntelligence();openVaultTab('roomai');const stages=['segment','semantic','physics','affordance','ready'];stages.forEach((stage,i)=>setTimeout(()=>{roomSemanticState.stage=stage;if(stage==='ready'){roomSemanticState.objects.forEach(o=>{o.state=o.id==='tv'?'Screen off':o.id==='lamp'?'Light on':o.state});environmentConfig.type='3d';environmentConfig.sourceName=`Full Blender room · ${roomSemanticState.sourceName}`;environmentConfig.target='full';applyEnvironmentConfig(false);saveRoomSemanticState();toast(`${roomSemanticState.sourceName} ready as a semantic room environment`);recordHistory('Imported and analyzed full Blender room');}renderRoomIntelligence();},280*(i+1)));}
    function saveRoomSemanticState(){try{localStorage.setItem('ff-room-semantic-state',JSON.stringify(roomStateSnapshot()))}catch{}}
    function restoreExtractedRoomAssets(){roomSemanticState.objects.forEach(obj=>{if(!obj.atlasId||assetById[obj.atlasId])return;const asset={id:obj.atlasId,theme:currentTheme,name:obj.name,art:roomRoleArt(obj),type:`Imported room · ${obj.role}`,physics:obj.physics,affordances:obj.actions.join(', '),mascot:obj.mascot,breakable:['sofa','tv','lamp','table'].includes(obj.id),semanticRole:obj.role,sourceRoom:roomSemanticState.sourceName,roomAffordances:[...obj.actions]};assets.unshift(asset);assetById[asset.id]=asset;});renderAssetGrid($('#assetSearch')?.value||'');renderFloatingAssetGrid($('#floatingAssetSearch')?.value||'');}
    function loadRoomSemanticState(){try{const saved=JSON.parse(localStorage.getItem('ff-room-semantic-state')||'null');if(saved)restoreRoomSemanticState(saved)}catch{}restoreExtractedRoomAssets();renderRoomIntelligence();}
    function bindRoomMascotDrag(){const m=$('#roomPreviewMascot'),p=$('#semanticRoomPreview');let drag=null;m.addEventListener('pointerdown',e=>{e.preventDefault();const mr=m.getBoundingClientRect(),pr=p.getBoundingClientRect();drag={dx:e.clientX-mr.left,dy:e.clientY-mr.top,pr};m.setPointerCapture(e.pointerId);m.style.transition='none';m.classList.remove('sitting','bouncing','at-tv','at-lamp','at-table');});m.addEventListener('pointermove',e=>{if(!drag)return;const x=clamp(e.clientX-drag.pr.left-drag.dx,0,drag.pr.width-m.offsetWidth),y=clamp(e.clientY-drag.pr.top-drag.dy,0,drag.pr.height-m.offsetHeight);m.style.left=`${x}px`;m.style.top=`${y}px`;m.style.bottom='auto';});const end=()=>{if(!drag)return;drag=null;m.style.transition='';};m.addEventListener('pointerup',end);m.addEventListener('pointercancel',end);}
    function bindRoomIntelligence(){
      $('#roomImportButton').addEventListener('click',()=>$('#roomFileInput').click());$('#roomFileInput').addEventListener('change',e=>{const f=e.target.files[0];if(f)scanRoomPipeline(f)});$('#roomRescan').addEventListener('click',()=>scanRoomPipeline());$('#roomExtractAll').addEventListener('click',extractAllRoomObjects);$('#openRoomIntelligence').addEventListener('click',()=>openVaultTab('roomai'));
      $('#roomImportMode').addEventListener('change',e=>{roomSemanticState.importMode=e.target.value;roomSemanticState.keepUnified=e.target.value!=='decomposed';roomSemanticState.detachInteractables=['unified-detached','decomposed'].includes(e.target.value);renderRoomIntelligence();recordHistory('Changed Blender room import mode')});
      const toggles={roomKeepUnified:'keepUnified',roomDetachInteractables:'detachInteractables',roomAutoPhysics:'autoPhysics',roomMascotAffordances:'mascotAffordances'};Object.entries(toggles).forEach(([id,key])=>$('#'+id).addEventListener('click',()=>{roomSemanticState[key]=!roomSemanticState[key];renderRoomIntelligence();saveRoomSemanticState();recordHistory(`Changed room ${key}`)}));
      $$('[data-room-mesh]').forEach(el=>{el.addEventListener('click',()=>{selectRoomObject(el.dataset.roomMesh);testRoomAffordance(el.dataset.roomMesh)});el.addEventListener('dblclick',()=>{if(el.dataset.roomMesh==='sofa')testRoomAffordance('sofa','Bounce')});});
      $('#roomRoleSelect').addEventListener('change',e=>{const o=selectedRoomObject();o.role=e.target.value;renderRoomIntelligence();saveRoomSemanticState();recordHistory(`Changed ${o.name} semantic role`)});$('#roomPhysicsSelect').addEventListener('change',e=>{const o=selectedRoomObject();o.physics=e.target.value;renderRoomIntelligence();saveRoomSemanticState();recordHistory(`Changed ${o.name} physics`)});
      $('#roomTestPrimary').addEventListener('click',()=>testRoomAffordance());$('#roomSendMascot').addEventListener('click',()=>roomMascotTo(roomSemanticState.selectedId,selectedRoomObject().actions[0]));$('#roomPlaceOnSurface').addEventListener('click',()=>placeRoomAssetOnTable());$('#roomExtractSelected').addEventListener('click',()=>extractRoomObjectToAtlas());$('#roomToggleVisible').addEventListener('click',()=>{const o=selectedRoomObject();o.visible=!o.visible;renderRoomIntelligence();saveRoomSemanticState();recordHistory(`${o.visible?'Showed':'Hid'} ${o.name}`)});$('#roomToggleLock').addEventListener('click',()=>{const o=selectedRoomObject();o.locked=!o.locked;renderRoomIntelligence();saveRoomSemanticState();recordHistory(`${o.locked?'Locked':'Unlocked'} ${o.name}`)});
      const table=$('#roomTableDropZone');table.addEventListener('dragover',e=>{if(assetIdFromTransfer(e.dataTransfer)){e.preventDefault();table.classList.add('selected')}});table.addEventListener('dragleave',()=>table.classList.remove('selected'));table.addEventListener('drop',e=>{const id=assetIdFromTransfer(e.dataTransfer);if(!id)return;e.preventDefault();table.classList.remove('selected');placeRoomAssetOnTable(assetById[id])});bindRoomMascotDrag();renderRoomIntelligence();
    }

    function openVaultTab(tab){openFloatingVault();$('#floatingVault').dataset.tab=tab;$$('[data-vault-tab]').forEach(b=>b.classList.toggle('active',b.dataset.vaultTab===tab));if(tab==='layers')renderLayers();if(tab==='history')renderHistory();if(tab==='environment'){applyEnvironmentConfig(false);startEnvironmentRenderer();}if(tab==='roomai')renderRoomIntelligence();}
    function handleEnvironmentFile(file){if(!file)return;const ext=(file.name.split('.').pop()||'').toLowerCase();if(['blend','glb','gltf','fbx','obj','usdz'].includes(ext)){scanRoomPipeline(file);return;}environmentConfig.themeSync=false;$('#environmentThemeSync').classList.remove('active');environmentConfig.sourceName=file.name;if(file.type.startsWith('image/')){const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{environmentImage=img;environmentMediaKind='image';environmentConfig.type='media';applyEnvironmentConfig();};img.src=reader.result};reader.readAsDataURL(file);}else if(file.type.startsWith('video/')){const video=$('#wallpaperVideo');video.src=URL.createObjectURL(file);video.hidden=true;video.play().catch(()=>{});environmentMediaKind='video';environmentConfig.type='media';applyEnvironmentConfig();}else{environmentMediaKind=null;environmentConfig.type='3d';environmentConfig.preset='cosmic';environmentConfig.sourceName=`3D scene staged · ${file.name}`;applyEnvironmentConfig();toast(`${file.name} staged for semantic floor, window, wall, screen and background mapping`);}}
    function bindV9(){
      $('#undoButton').addEventListener('click',undoHistory);$('#redoButton').addEventListener('click',redoHistory);$('#historyUndo').addEventListener('click',undoHistory);$('#historyRedo').addEventListener('click',redoHistory);$('#historyClear').addEventListener('click',clearHistory);$('#environmentButton').addEventListener('click',()=>openVaultTab('environment'));$('#layersSelectAll').addEventListener('click',()=>{const top=[...objectState.values()].sort((a,b)=>(b.zIndex||0)-(a.zIndex||0))[0];if(top)setSelectedObject(top)});$('#layersRefresh').addEventListener('click',renderLayers);
      $$('[data-vault-tab]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.vaultTab==='layers')renderLayers();if(b.dataset.vaultTab==='history')renderHistory();if(b.dataset.vaultTab==='environment')applyEnvironmentConfig(false);if(b.dataset.vaultTab==='roomai')renderRoomIntelligence();}));
      $('#environmentType').addEventListener('change',e=>{environmentConfig.type=e.target.value;environmentMediaKind=e.target.value==='media'?environmentMediaKind:null;applyEnvironmentConfig()});$('#environmentTarget').addEventListener('change',e=>{environmentConfig.target=e.target.value;applyEnvironmentConfig()});$('#environmentPreset').addEventListener('change',e=>{environmentConfig.preset=e.target.value;environmentConfig.type=e.target.value==='cosmic'?'3d':'animated';environmentMediaKind=null;applyEnvironmentConfig()});$('#environmentFileInput').addEventListener('change',e=>handleEnvironmentFile(e.target.files[0]));
      const toggles={environmentThemeSync:'themeSync',environmentMotion:'motion',environmentParallax:'parallax',environmentPauseHidden:'pauseHidden'};Object.entries(toggles).forEach(([id,key])=>$('#'+id).addEventListener('click',()=>{environmentConfig[key]=!environmentConfig[key];$('#'+id).classList.toggle('active',environmentConfig[key]);applyEnvironmentConfig()}));$('#environmentPause').addEventListener('click',()=>{environmentConfig.paused=!environmentConfig.paused;applyEnvironmentConfig()});$('#environmentMapper').addEventListener('click',()=>{environmentConfig.mapping=!environmentConfig.mapping;applyEnvironmentConfig(false);toast(environmentConfig.mapping?'Semantic surface mapper visible':'Surface mapper hidden')});$('#environmentApply').addEventListener('click',()=>applyEnvironmentConfig());
      const ranges={environmentOpacity:['opacity',.01],environmentSpeed:['speed',1],environmentFov:['fov',1],environmentHorizon:['horizon',1],environmentFloor:['floor',1],environmentYaw:['yaw',1],environmentPitch:['pitch',1],environmentDepth:['depth',1]};Object.entries(ranges).forEach(([id,[key,m]])=>$('#'+id).addEventListener('input',e=>{environmentConfig[key]=Number(e.target.value)*m;applyEnvironmentConfig(false);queueHistory('Adjusted 3D environment',260)}));$$('[data-surface-role]').forEach(s=>s.addEventListener('change',e=>{environmentConfig.surfaceRoles[e.target.dataset.surfaceRole]=e.target.value;recordHistory(`Mapped ${e.target.dataset.surfaceRole} as ${e.target.value}`)}));
      document.addEventListener('pointermove',e=>{if(!environmentConfig.parallax)return;environmentPointer.x=e.clientX/innerWidth-.5;environmentPointer.y=e.clientY/innerHeight-.5;},{passive:true});
      document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redoHistory():undoHistory();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redoHistory();}});
      $('#themeSelect').addEventListener('change',()=>{if(environmentConfig.themeSync){environmentConfig.preset=environmentThemePreset();environmentConfig.type=environmentConfig.preset==='cosmic'?'3d':'animated';environmentMediaKind=null;applyEnvironmentConfig(false);}});
      const historyTriggers=['themeSelect','districtSelect','weatherSelect','timePresetSelect','vaultPlacementMode','transformBlend'];historyTriggers.forEach(id=>$('#'+id)?.addEventListener('change',()=>setTimeout(()=>recordHistory(`Changed ${id.replace(/([A-Z])/g,' $1')}`),0)));
      bindRoomIntelligence();
      const actionHistory={vaultPlaceLeft:'Placed asset in left world',vaultPlaceRight:'Placed asset in right world',vaultPlaceUI:'Placed whole-UI actor',vaultPinWorkspace:'Pinned scrapbook sticker',addSelectedLeft:'Placed asset in left world',addSelectedRight:'Placed asset in right world',addSelectedUI:'Placed whole-UI actor',pinSelectedSticker:'Pinned scrapbook sticker',duplicateObject:'Duplicated object',deleteObject:'Removed object',drawerDelete:'Removed object',drawerPin:'Pinned object',drawerPeel:'Peeled sticker',drawerGravityToggle:'Changed gravity',transformDuplicate:'Duplicated object',transformDelete:'Removed object',transformPeel:'Peeled sticker',transformLock:'Changed object lock',transformGravity:'Changed gravity',transformReset:'Reset transform',transformRescue:'Rescued object',resetObjects:'Reset room objects'};Object.entries(actionHistory).forEach(([id,label])=>$('#'+id)?.addEventListener('click',()=>setTimeout(()=>recordHistory(label),40)));
      document.addEventListener('pointerup',e=>{if(e.target.closest('.world-object'))queueHistory(`Moved ${selectedObject?.asset?.name||'object'}`,80);else if(e.target.closest('[data-transform-control],.chrome-collapse-button,[data-mode],[data-layout],[data-world-state]'))queueHistory('Edited studio layout or object',100);});
      new MutationObserver(()=>scheduleStudioRefresh()).observe($('#uiObjectLayer'),{childList:true});new MutationObserver(()=>scheduleStudioRefresh()).observe($('#leftObjects'),{childList:true});new MutationObserver(()=>scheduleStudioRefresh()).observe($('#rightObjects'),{childList:true});startEnvironmentRenderer();applyEnvironmentConfig(false);renderLayers();renderHistory();
    }
    function bindTransformControls(){
      const bindInput=(id,fn,event='input')=>$('#'+id).addEventListener(event,e=>fn(e.target.value));
      bindInput('transformX',v=>setSelectedPosition(Number(v),selectedObject?.y),'change');bindInput('transformY',v=>setSelectedPosition(selectedObject?.x,Number(v)),'change');
      bindInput('transformRotation',setSelectedRotation);bindInput('transformRotationNumber',setSelectedRotation,'change');
      bindInput('transformScaleX',v=>setSelectedScale('x',v),'change');bindInput('transformScaleY',v=>setSelectedScale('y',v),'change');
      bindInput('transformOpacity',setSelectedOpacity);bindInput('transformOpacityNumber',setSelectedOpacity,'change');bindInput('transformBlend',setSelectedBlend,'change');
      bindInput('transformSkewX',v=>setSelectedSkew('x',v),'change');bindInput('transformSkewY',v=>setSelectedSkew('y',v),'change');
      bindInput('transformBrightness',v=>setSelectedFilter('brightness',v));bindInput('transformContrast',v=>setSelectedFilter('contrast',v));bindInput('transformSaturation',v=>setSelectedFilter('saturation',v));bindInput('transformHue',v=>setSelectedFilter('hue',v));bindInput('transformBlur',v=>setSelectedFilter('blur',v));
      $$('[data-anchor]').forEach(b=>b.addEventListener('click',()=>setSelectedAnchor(b.dataset.anchor)));$$('[data-align]').forEach(b=>b.addEventListener('click',()=>alignSelected(b.dataset.align)));
      $('#transformLink').addEventListener('click',()=>{transformPrefs.linked=!transformPrefs.linked;syncTransformInspector();toast(`Aspect ratio ${transformPrefs.linked?'linked':'unlinked'}`)});
      $('#transformFlipX').addEventListener('click',()=>flipSelected('x'));$('#transformFlipY').addEventListener('click',()=>flipSelected('y'));$('#transformRotate90').addEventListener('click',()=>setSelectedRotation((selectedObject?.rotation||0)+90));
      $('#transformBack').addEventListener('click',()=>setSelectedLayer('back'));$('#transformDown').addEventListener('click',()=>setSelectedLayer('down'));$('#transformUp').addEventListener('click',()=>setSelectedLayer('up'));$('#transformFront').addEventListener('click',()=>setSelectedLayer('front'));
      $('#transformLock').addEventListener('click',()=>toggleSelectedLock());$('#transformGravity').addEventListener('click',()=>toggleSelectedGravity());$('#transformReset').addEventListener('click',resetSelectedTransform);$('#transformRescue').addEventListener('click',rescueSelected);
      $$('[data-nudge]').forEach(b=>b.addEventListener('click',()=>{const [x,y]=b.dataset.nudge.split(',').map(Number);nudgeSelected(x,y,transformPrefs.grid)}));$('#transformCenter').addEventListener('click',centerSelected);
      $('#transformDuplicate').addEventListener('click',duplicateSelected);$('#transformPeel').addEventListener('click',()=>peelSticker());$('#transformFit').addEventListener('click',fitSelectedToView);$('#transformDelete').addEventListener('click',removeSelected);
      syncTransformInspector();
    }
    function bindUI(){
      $('#themeSelect').addEventListener('change',e=>setTheme(e.target.value,true));
      $('#districtSelect').addEventListener('change',e=>{$('#districtChip').textContent=e.target.value;$('#weatherDistrict').textContent=e.target.value;toast(`District changed to ${e.target.value}`);addActivity('⌂',`Entered ${e.target.value}`,'Procedural transition prepared');});
      $('#weatherSelect').addEventListener('change',e=>setWeather(e.target.value,true));$('#timePresetSelect').addEventListener('change',e=>setTimePreset(e.target.value,true));
      $$('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));$$('[data-open]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.open==='vault')openFloatingVault();else setView(b.dataset.open)}));
      $$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
      $('#focusShortcut').addEventListener('click',()=>setMode(currentMode==='focus'?'living':'focus'));
      $('#focusQuick').addEventListener('click',()=>setMode('focus'));$('#performanceQuick').addEventListener('click',()=>setMode('performance'));$('#stageQuick').addEventListener('click',()=>setMode('stage'));
      $('#dockFocus').addEventListener('click',()=>setMode('focus'));$('#dockStage').addEventListener('click',()=>setMode('stage'));$('#dockPerf').addEventListener('click',()=>setMode('performance'));$('#topRoom').addEventListener('click',()=>setView('room'));$('#topStage').addEventListener('click',()=>setMode('stage'));
      $('#layoutButton').addEventListener('click',openSettings);$('#settingsButton').addEventListener('click',openSettings);$('#dockSettings').addEventListener('click',openSettings);$('#editTheme').addEventListener('click',()=>{setView('themeLab');openDrawer('Theme behavior')});$('#closeDrawer').addEventListener('click',closeDrawer);
      $('#themeStageButton').addEventListener('click',()=>{setMode('stage');closeDrawer()});$('#restoreChromeButton').addEventListener('click',restoreChrome);
      $('#worldToggle').addEventListener('click',()=>{const o=['interactive','decor','off'];setWorldState(o[(o.indexOf(currentWorldState)+1)%o.length])});
      $('#weatherQuick').addEventListener('click',cycleWeather);$('#musicQuick').addEventListener('click',()=>toggleMusic());$('#playButton').addEventListener('click',()=>toggleMusic());$('#soundToggle').addEventListener('click',()=>toggleMusic());$('#dockMusic').addEventListener('click',()=>toggleMusic());
      $('#surpriseButton').addEventListener('click',()=>{const ids=Object.keys(themes);setTheme(ids[Math.floor(Math.random()*ids.length)],true);setWeather(['sun','rain','bubbles','fog'][Math.floor(Math.random()*4)],true)});$('#randomTheme').addEventListener('click',()=>{const ids=Object.keys(themes);setTheme(ids[Math.floor(Math.random()*ids.length)],true)});
      $('#themeSearch').addEventListener('input',e=>renderThemeGrid(e.target.value));$('#assetSearch').addEventListener('input',e=>renderAssetGrid(e.target.value));$('#floatVault').addEventListener('click',openFloatingVault);
      $('#mixRange').addEventListener('input',e=>{$('#mixValue').textContent=`${e.target.value}%`;$('#mixLabel').textContent=`${e.target.value}%`});$('#applyMix').addEventListener('click',applyThemeMix);$('#clearMix').addEventListener('click',clearThemeMix);
      $('#addSelectedLeft').addEventListener('click',()=>spawnObject('left',selectedAsset));$('#addSelectedRight').addEventListener('click',()=>spawnObject('right',selectedAsset));$('#addSelectedUI').addEventListener('click',()=>spawnUiObject(selectedAsset,innerWidth*.5-44,innerHeight*.36,{scope:'ui',gravity:placementPrefs.gravity}));$('#pinSelectedSticker').addEventListener('click',()=>spawnUiObject(selectedAsset,innerWidth*.5-44,innerHeight*.4,{scope:'sticker',target:$('.workspace-frame')}));
      $('#importAsset').addEventListener('click',()=>$('#fileInput').click());$('#fileInput').addEventListener('change',e=>handleFile(e.target.files[0]));
      ['leftWorld','rightWorld'].forEach(id=>{$('#'+id).addEventListener('dragover',e=>{if(assetIdFromTransfer(e.dataTransfer))e.preventDefault()})});
      $('#dropZone').addEventListener('dragover',e=>e.preventDefault());$('#dropZone').addEventListener('drop',e=>{e.preventDefault();handleFile(e.dataTransfer.files[0])});
      [['leftWidth','left'],['drawerLeftWidth','left'],['rightWidth','right'],['drawerRightWidth','right']].forEach(([id,side])=>$('#'+id).addEventListener('input',e=>updateWidths(side==='left'?e.target.value:leftWidth,side==='right'?e.target.value:rightWidth)));
      $$('[data-layout]').forEach(b=>b.addEventListener('click',()=>{const p=b.dataset.layout==='balanced'?[18,18]:b.dataset.layout==='work'?[5,5]:[0,0];updateWidths(...p);if(p[0]===0)setMode('focus');else setMode('living')}));
      $$('[data-side-collapse]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.sideCollapse==='left')updateWidths(leftWidth?0:18,rightWidth);else updateWidths(leftWidth,rightWidth?0:18)}));
      $$('[data-world-state]').forEach(b=>b.addEventListener('click',()=>setWorldState(b.dataset.worldState)));
      $('#resetObjects').addEventListener('click',()=>resetRoom(true));$('#repairObject').addEventListener('click',repairSelected);$('#drawerRepair').addEventListener('click',repairSelected);$('#duplicateObject').addEventListener('click',duplicateSelected);$('#deleteObject').addEventListener('click',removeSelected);$('#drawerDelete').addEventListener('click',removeSelected);$('#drawerPin').addEventListener('click',()=>{if(selectedObject)(()=>{const p=objectScreenCenter(selectedObject);return pinObjectToTarget(selectedObject,p.x,p.y)})();else toast('Select an object first')});$('#drawerPeel').addEventListener('click',()=>peelSticker());$('#drawerGravityToggle').addEventListener('click',()=>toggleSelectedGravity());$('#drawerPlayObject').addEventListener('click',()=>selectedObject?interactObject(selectedObject):toast('Select an object first'));$('#wholeUiObjects').addEventListener('click',()=>{if(selectedObject)moveSelectedToUI();else{placementPrefs.mode=placementPrefs.mode==='ui'?'world':'ui';$('#wholeUiObjects').classList.toggle('active',placementPrefs.mode==='ui');toast(`New asset placement: ${placementPrefs.mode==='ui'?'Whole UI':'World Restricted'}`)}});$('#stickerGravityDefault').addEventListener('click',()=>{placementPrefs.gravity=!placementPrefs.gravity;$('#stickerGravityDefault').classList.toggle('active',placementPrefs.gravity)});
      $$('#weatherButtons [data-weather]').forEach(b=>b.addEventListener('click',()=>setWeather(b.dataset.weather,true)));
      $('#timeRange').addEventListener('input',e=>{currentTimePreset='custom';applyTimeHour(Number(e.target.value),{notify:false,preset:'custom'});if(!$('#timePresetSelect option[value="custom"]'))$('#timePresetSelect').insertAdjacentHTML('beforeend','<option value="custom">Custom</option>');$('#timePresetSelect').value='custom';});
      ['glassRange','motionRange','volumeRange'].forEach(id=>$('#'+id).addEventListener('input',e=>$('#'+id.replace('Range','Value')).textContent=`${e.target.value}%`));
      $('#colorAccent').addEventListener('input',e=>document.documentElement.style.setProperty('--accent',e.target.value));$('#colorAccent2').addEventListener('input',e=>document.documentElement.style.setProperty('--accent-2',e.target.value));$('#colorAccent3').addEventListener('input',e=>document.documentElement.style.setProperty('--accent-3',e.target.value));
      $$('.toggle:not([data-world-state]):not([data-weather]):not(#dockMagnifyToggle):not(#rememberChromeToggle)').forEach(b=>b.addEventListener('click',()=>toggleButton(b)));
      const prefBinds={dockModeSelect:'dockMode',dockPositionSelect:'dockPosition',topbarModeSelect:'topbarMode',railModeSelect:'railMode',railPositionSelect:'railPosition',workbarModeSelect:'workbarMode',worldbarModeSelect:'worldbarMode'};Object.entries(prefBinds).forEach(([id,key])=>$('#'+id).addEventListener('change',e=>{uiPrefs[key]=e.target.value;applyUiPrefs()}));
      $('#dockSizeRange').addEventListener('input',e=>{uiPrefs.dockSize=Number(e.target.value);applyUiPrefs()});$('#dockOpacityRange').addEventListener('input',e=>{uiPrefs.dockOpacity=Number(e.target.value);applyUiPrefs()});
      $('#dockMagnifyToggle').addEventListener('click',()=>{uiPrefs.dockMagnify=!uiPrefs.dockMagnify;applyUiPrefs()});$('#collapseHideToggle').addEventListener('click',()=>{uiPrefs.collapseButtonsHide=!uiPrefs.collapseButtonsHide;applyUiPrefs();toast(`Collapse buttons now ${uiPrefs.collapseButtonsHide?'fully hide':'compact'} shelves`)});$('#rememberChromeToggle').addEventListener('click',()=>{uiPrefs.remember=!uiPrefs.remember;applyUiPrefs()});
      $('#dockCollapse').addEventListener('click',()=>toggleChromeCompact('dock'));
      $('#topbarCollapse').addEventListener('click',()=>toggleChromeCompact('topbar'));$('#railCollapse').addEventListener('click',()=>toggleChromeCompact('rail'));$('#workbarCollapse').addEventListener('click',()=>toggleChromeCompact('workbar'));
      $$('[data-chrome-toggle="worldbar"]').forEach(b=>b.addEventListener('click',()=>toggleChromeCompact('worldbar')));
      $$('[data-reveal]').forEach(b=>b.addEventListener('click',()=>revealChrome(b.dataset.reveal)));
      $$('[data-chrome-preset]').forEach(b=>b.addEventListener('click',()=>applyChromePreset(b.dataset.chromePreset)));
      $('#studioCleanTop').addEventListener('click',()=>toggleCleanView());$('#studioCleanDock').addEventListener('click',()=>toggleCleanView());$('#cleanViewExit').addEventListener('click',()=>toggleCleanView());bindLauncherManagers();
      $('#saveTheme').addEventListener('click',()=>toast('Theme snapshot saved in this prototype session'));
      document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable)return;const k=e.key.toLowerCase();if(e.key==='Tab'){e.preventDefault();toggleCleanView();return;}if(selectedObject&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const step=e.shiftKey?10:1,n={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];nudgeSelected(n[0],n[1],step);return;}if(selectedObject&&e.key==='Home'){e.preventDefault();rescueSelected();return;}if(selectedObject&&e.key==='Delete'){e.preventDefault();removeSelected();return;}if(selectedObject&&(e.ctrlKey||e.metaKey)&&k==='d'){e.preventDefault();duplicateSelected();return;}if(selectedObject&&k==='['){setSelectedRotation(selectedObject.rotation-1);return;}if(selectedObject&&k===']'){setSelectedRotation(selectedObject.rotation+1);return;}if(k==='f')setMode('focus');if(k==='p')setMode('performance');if(k==='l')setMode('living');if(k==='t')setMode('stage');if(k==='d')toggleChromeCompact('dock');if(e.key==='Escape'){if(selectedObject){setSelectedObject(null);return;}if(document.body.dataset.cleanView==='true')toggleCleanView();else closeDrawer()}});
      document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAmbient();else if(['living','stage'].includes(currentMode)&&currentWorldState!=='off')startAmbient()});window.addEventListener('resize',()=>{resizeCanvases();clampMascot();updateMascot();updatePinnedObjects();positionSelectedSurfaceCanvas()});document.addEventListener('scroll',updatePinnedObjects,true);
      bindMascot();bindDockDrag();bindShelfDrag();bindFloatingVault();bindTransformControls();bindGlobalAssetDrop();bindV9();bindV12();const pinObserver=new ResizeObserver(updatePinnedObjects);[$('.workspace-frame'),$('.topbar'),$('.rail'),$('.dock'),$('#floatingVault')].filter(Boolean).forEach(el=>pinObserver.observe(el));
    }

    function updateClock(){const d=new Date();$('#clock').textContent=d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});if(currentTimePreset==='auto')applyTimeHour(d.getHours()+d.getMinutes()/60,{notify:false,preset:'auto'});}
    function runSelfTest(){const results={};let priorScrapbook=null;try{try{priorScrapbook=localStorage.getItem('ff-scrapbook-layout')}catch{}results.noImageBackground=!getComputedStyle(document.body).getPropertyValue('--world-bg').includes('url(');const before=$('#leftScenery').innerHTML;setTheme('vaporwave');results.themeSceneChanged=before!==$('#leftScenery').innerHTML&&$('#leftWorld').dataset.scene==='vaporwave';results.themeKitChanged=[...objectState.values()].filter(s=>s.scope==='world').every(s=>s.asset.theme==='vaporwave');results.floatingVault=!!$('#floatingVault')&&!!$('#floatingVaultHandle')&&getComputedStyle($('#floatingVault')).position==='fixed';openFloatingVault();results.vaultOpens=$('#floatingVault').classList.contains('open');const ui=spawnUiObject(assetById['grid-ball'],420,260,{scope:'ui',gravity:false,notify:false});results.wholeUiActor=ui.scope==='ui'&&ui.el.parentElement===$('#uiObjectLayer');const sticker=spawnUiObject(assetById['cassette'],520,330,{scope:'sticker',target:$('.workspace-frame'),notify:false});results.stickerPinned=sticker.scope==='sticker'&&sticker.el.classList.contains('sticker-object')&&!sticker.gravity;results.mediaMapped=assetById['cassette'].mediaKind==='cassette'&&assetById['sunset-vinyl'].mediaKind==='record';results.objectTools=$$('.object-mini-tools',ui.el).length===1;setSelectedObject(ui);ui.scaleX=1.35;ui.rotation=27;ui.opacity=.72;commitTransform(ui,{save:false});results.precisionTransform=getComputedStyle(ui.el).transform!=='none'&&$('#transformRotationNumber').value==='27'&&$('#transformOpacityNumber').value==='72';ui.dragTilt=7;ui.motionRotation=5;updateObjectTransform(ui);settleObjectOrientation(ui,{instant:true});results.transientDragTilt=ui.rotation===27&&ui.dragTilt===0&&ui.motionRotation===0&&ui.el.style.getPropertyValue('--r')==='27deg'&&ui.el.style.getPropertyValue('--drag-tilt')==='0deg';results.transformHandles=$$('.transform-handle',ui.el).length===4&&!!$('.rotate-handle',ui.el);setWeather('rain',false);results.topWeatherDirector=$('#weatherSelect').value==='rain';setTimePreset('22',false);results.topTimeDirector=document.body.dataset.time==='night'&&$('#timePresetSelect').value==='22';results.historyControls=!!$('#undoButton')&&!!$('#historyPanel')&&typeof undoHistory==='function';results.layersPanel=!!$('#layersPanel')&&typeof renderLayers==='function';environmentConfig.target='left-window';applyEnvironmentConfig(false);results.environmentMapping=document.body.dataset.wallpaperTarget==='left-window'&&!!$('#leftWindowCanvas');environmentConfig.target='full';environmentConfig.preset='cosmic';applyEnvironmentConfig(false);results.wallpaper3D=typeof drawCosmic==='function'&&!!$('#environmentPreviewCanvas');ui.skewX=12;ui.brightness=1.2;commitTransform(ui,{save:false});results.advancedImageControls=getComputedStyle(ui.el).transform.includes('matrix')&&$('#transformSkewX').value==='12'&&$('#transformBrightnessValue').textContent==='120%';results.dragAssets=$('#floatingAssetGrid [draggable="true"]')!==null;results.collidableUI=typeof resolveUICollisions==='function';openVaultTab('roomai');renderRoomIntelligence();results.blenderRoomUpload=$('#roomFileInput').accept.includes('.blend')&&roomSemanticState.objects.length>=8;selectRoomObject('sofa');testRoomAffordance('sofa','Sit');results.couchMascotAffordance=$('#roomPreviewMascot').classList.contains('sitting');testRoomAffordance('tv');results.tvRoomAffordance=$('[data-room-mesh="tv"]').classList.contains('on');testRoomAffordance('lamp');results.lampRoomAffordance=!$('[data-room-mesh="lamp"]').classList.contains('on');placeRoomAssetOnTable(assetById['aero-orb'],false);results.tableSurfaceAffordance=$('#roomTableProp').innerHTML.length>20;const testRoomObj=roomObjectById('sofa'),priorAtlas=testRoomObj.atlasId,priorAssets=assets.length,extracted=extractRoomObjectToAtlas(testRoomObj,{notify:false,test:true});results.roomObjectAtlas=!!extracted&&assets.length===priorAssets+1&&extracted.sourceRoom===roomSemanticState.sourceName;if(extracted){assets.splice(assets.indexOf(extracted),1);delete assetById[extracted.id];testRoomObj.atlasId=priorAtlas;}roomSemanticState.tableAssetId=null;const roomTv=$('[data-room-mesh="tv"]'),roomLamp=$('[data-room-mesh="lamp"]');roomTv?.classList.remove('on');roomLamp?.classList.add('on');$('#roomPreviewMascot')?.classList.remove('sitting','bouncing','at-tv','at-lamp','at-table');renderRoomIntelligence();peelSticker(sticker,{testOnly:true});results.peelStarted=sticker.el.classList.contains('peeling');sticker.el.classList.remove('peeling');[ui,sticker].forEach(o=>{objectState.delete(o.id);o.el.remove()});selectedObject=null;try{if(priorScrapbook===null)localStorage.removeItem('ff-scrapbook-layout');else localStorage.setItem('ff-scrapbook-layout',priorScrapbook)}catch{}setMode('stage',false);results.stageMode=document.body.dataset.mode==='stage';uiPrefs.dockMode='compact';uiPrefs.railMode='compact';applyUiPrefs(false);results.compactChrome=document.body.dataset.dockMode==='compact'&&document.body.dataset.railMode==='compact';results.edgeRecovery=$$('[data-reveal]').length>=6;results.topShelfControl=!!$('#topbarCollapse')&&getComputedStyle($('#topbarCollapse')).display!=='none';results.collapseDefaultsToHide=uiPrefs.collapseButtonsHide===true;const obj=$('.world-object .object-visual');const cs=getComputedStyle(obj);results.borderlessObjects=cs.borderTopStyle==='none'||cs.borderTopWidth==='0px';results.mascotDraggable=$('#mascot').dataset.bound==='true';refreshPremiumRanges();const range=$('#drawerLeftWidth'),rangeInfo=updatePremiumRange(range),signedInfo=updatePremiumRange($('#transformRotation'));results.premiumRangeControls=$$('input[type="range"]').every(r=>r.dataset.rangeReady==='true'&&r.dataset.premiumRangeBound==='true')&&Math.abs(rangeInfo.progress-(Number(range.value)-Number(range.min))/(Number(range.max)-Number(range.min))*100)<.01&&Math.abs(signedInfo.zero-50)<.01;setTheme('frutiger');setWeather('sun',false);setTimePreset('auto',false);setMode('living',false);restoreChrome();updateWidths(18,18);}catch(e){results.error=String(e)}const pass=Object.values(results).every(Boolean);$('#selfTest').textContent=pass?'PASS':'FAIL';document.body.dataset.selftest=pass?'pass':'fail';window.__ffPrototypeTest=results;}


    const v18BaseRunSelfTest=runSelfTest;
    runSelfTest=function(){
      const vault=$('#floatingVault'),wasOpen=vault.classList.contains('open'),priorTab=vault.dataset.tab||'atlas';
      v18BaseRunSelfTest();
      vault.dataset.tab=priorTab;
      $$('[data-vault-tab]').forEach(b=>b.classList.toggle('active',b.dataset.vaultTab===priorTab));
      if(wasOpen)openFloatingVault();else closeFloatingVault();
      setTimeout(()=>{if(!wasOpen)closeFloatingVault();},0);
    };

    // V19: world composition is controlled directly inside Workspace mode; unified remains default and split left/right remains a first-class option without changing side widths.
    const normalizeWorldLayout=mode=>mode==='split'?'split':'unified';
    let worldLayout = normalizeWorldLayout(document.body.dataset.worldLayout);
    let objectHudRaf = 0, objectHudFrozen = false, objectHudReleaseTimer = 0;

    function setWorldLayout(mode='unified',notify=true){
      worldLayout = normalizeWorldLayout(mode);
      document.body.dataset.worldLayout = worldLayout;
      applyWorldColumns();
      $('#splitWorldToggle')?.classList.toggle('active',worldLayout==='split');
      $('#drawerSplitWorldToggle')?.classList.toggle('active',worldLayout==='split');
      $('#drawerFullBackgroundToggle')?.classList.toggle('active',worldLayout==='unified');
      $$('[data-world-layout-choice]').forEach(button=>{
        const active=button.dataset.worldLayoutChoice===worldLayout;
        button.classList.toggle('active',active);
        button.setAttribute('aria-pressed',String(active));
      });
      const worldLayoutStatus=$('#workspaceWorldLayoutStatus');
      if(worldLayoutStatus)worldLayoutStatus.textContent=worldLayout==='unified'?'One continuous scene':'Independent left + right';
      resizeCanvases();
      clampMascot();
      updateMascot();
      updatePinnedObjects();
      positionObjectSelectionHud();
      try{localStorage.setItem('ff-world-layout',worldLayout)}catch{}
      if(notify){
        toast(worldLayout==='unified'?'Unified Living World enabled · one continuous scene with interactive side lanes':'Two Independent Side Worlds enabled');
        queueHistory('Changed world composition',60);
      }
    }

    const v12RenderWorldScenery = renderWorldScenery;
    renderWorldScenery = function(){
      v12RenderWorldScenery();
      const full = $('#fullScenery');
      if(full) full.innerHTML = sceneMarkup(currentTheme,'unified');
      const bg = $('#fullWorldBackground');
      if(bg) bg.dataset.scene = currentTheme;
    };

    function syncObjectSelectionHud(){
      const hud=$('#objectSelectionHud'),s=selectedObject;
      if(!hud)return;
      if(!s||!s.el?.isConnected||!s.visible){
        hud.classList.remove('visible');
        hud.setAttribute('aria-hidden','true');
        delete hud.dataset.objectKey;
        return;
      }
      ensureTransformState(s);
      const label=`${s.asset.name} · ${objectScopeLabel(s)}`;
      $('#objectSelectionHudLabel').textContent=label;
      hud.setAttribute('aria-label',`${label} controls`);
      $('#hudLock').classList.toggle('active',s.locked);
      $('#hudLock').setAttribute('aria-pressed',String(!!s.locked));
      $('#hudLock').title=s.locked?'Unlock':'Lock';
      $('#hudLock').textContent='L';
      $('#hudPeel').disabled=s.scope!=='sticker';
      $('#hudPin').disabled=s.scope==='sticker';
      $('#hudPin').classList.toggle('active',s.scope==='sticker');
      const gravityActive=s.scope==='sticker'?!!s.gravityAfterPeel:!!s.gravity;
      $('#hudGravity').classList.toggle('active',gravityActive);
      $('#hudGravity').setAttribute('aria-pressed',String(gravityActive));
      $('#hudGravity').title=s.scope==='sticker'?(gravityActive?'Gravity after peel on':'Gravity after peel off'):(gravityActive?'Gravity on':'Gravity off');
      $('#hudGravity').textContent='G';
      hud.classList.add('visible');
      hud.setAttribute('aria-hidden','false');
    }

    function positionObjectSelectionHud(force=false){
      const hud=$('#objectSelectionHud'),s=selectedObject;
      syncObjectSelectionHud();
      if(!hud||!hud.classList.contains('visible')||!s?.el?.isConnected)return;
      const objectKey=String(s.id||s.asset?.id||'selected');
      if(hud.dataset.objectKey!==objectKey)hud.dataset.objectKey=objectKey;
      if(objectHudFrozen&&!force)return;
      const r=s.el.getBoundingClientRect();
      if(r.width<1||r.height<1)return;
      const w=hud.offsetWidth||214,h=hud.offsetHeight||30,margin=4,gap=4;
      let x=clamp(r.left+r.width/2-w/2,margin,Math.max(margin,innerWidth-w-margin));
      let y=r.top-h-gap,side='above';
      if(y<margin){y=clamp(r.bottom+gap,margin,Math.max(margin,innerHeight-h-margin));side='below';}
      const anchorX=clamp(r.left+r.width/2-x,10,Math.max(10,w-10));
      hud.style.left=`${Math.round(x)}px`;
      hud.style.top=`${Math.round(y)}px`;
      hud.style.setProperty('--anchor-x',`${Math.round(anchorX)}px`);
      hud.dataset.side=side;
    }

    function startObjectHudTracking(){
      if(objectHudRaf||window.__ffRuntimeGovernor?.isSuspended()||document.hidden)return;
      const tick=()=>{
        objectHudRaf=0;
        if(window.__ffRuntimeGovernor?.isSuspended()||document.hidden)return;
        if(selectedObject)positionObjectSelectionHud();
        const needsContinuous=!!selectedObject&&(!!selectedObject.dragging||!!selectedObject.moving||!!selectedObject.physicsRaf||objectHudFrozen);
        if(needsContinuous)objectHudRaf=requestAnimationFrame(tick);
      };
      objectHudRaf=requestAnimationFrame(tick);
    }
    function stopObjectHudTracking(){if(objectHudRaf)cancelAnimationFrame(objectHudRaf);objectHudRaf=0;}

    const v12SetSelectedObject = setSelectedObject;
    setSelectedObject = function(state){
      v12SetSelectedObject(state);
      if(state){
        ensureTransformState(state);
        state.el.classList.toggle('locked',state.locked);
        syncTransformInspector();
      }
      syncObjectSelectionHud();
      positionObjectSelectionHud();
      startObjectHudTracking();
      scheduleStudioRefresh();
      positionSelectedSurfaceCanvas();
    };

    const v12CaptureStudioState = captureStudioState;
    captureStudioState = function(){
      const state=v12CaptureStudioState();
      state.worldLayout=worldLayout;
      return state;
    };
    const v12RestoreStudioState = restoreStudioState;
    restoreStudioState = function(snapshot){
      v12RestoreStudioState(snapshot);
      setWorldLayout(snapshot?.worldLayout||'unified',false);
    };

    function bindV12(){
      const hud=$('#objectSelectionHud');
      const freezeHud=()=>{clearTimeout(objectHudReleaseTimer);objectHudFrozen=true;};
      const releaseHud=()=>{clearTimeout(objectHudReleaseTimer);objectHudReleaseTimer=setTimeout(()=>{objectHudFrozen=false;positionObjectSelectionHud(true);},90);};
      hud?.addEventListener('pointerenter',freezeHud);
      hud?.addEventListener('pointerleave',releaseHud);
      hud?.addEventListener('focusin',freezeHud);
      hud?.addEventListener('focusout',releaseHud);
      hud?.addEventListener('pointerdown',e=>{freezeHud();e.stopPropagation();},true);
      hud?.addEventListener('mousedown',e=>e.stopPropagation(),true);
      hud?.addEventListener('touchstart',e=>e.stopPropagation(),{capture:true,passive:true});
      hud?.addEventListener('pointerup',e=>{e.stopPropagation();releaseHud();},true);
      hud?.addEventListener('pointercancel',releaseHud,true);
      hud?.addEventListener('click',e=>e.stopPropagation());
      $('#hudTransform')?.addEventListener('click',()=>{if(!selectedObject)return;openFloatingVault();openVaultTab('atlas');setTimeout(()=>$('#transformRotationNumber')?.focus(),80)});
      $('#hudLock')?.addEventListener('click',()=>toggleSelectedLock(selectedObject));
      $('#hudPin')?.addEventListener('click',()=>selectedObject?(()=>{const p=objectScreenCenter(selectedObject);return pinObjectToTarget(selectedObject,p.x,p.y)})():toast('Select an object first'));
      $('#hudPeel')?.addEventListener('click',()=>peelSticker(selectedObject));
      $('#hudGravity')?.addEventListener('click',()=>toggleSelectedGravity(selectedObject));
      $('#hudPlay')?.addEventListener('click',()=>selectedObject?interactObject(selectedObject):toast('Select an object first'));
      $('#hudRescue')?.addEventListener('click',()=>rescueSelected());
      $('#hudClose')?.addEventListener('click',()=>setSelectedObject(null));
      $('#splitWorldToggle')?.addEventListener('click',()=>setWorldLayout(worldLayout==='split'?'unified':'split'));
      $('#drawerSplitWorldToggle')?.addEventListener('click',()=>setWorldLayout('split'));
      $('#drawerFullBackgroundToggle')?.addEventListener('click',()=>setWorldLayout('unified'));
      window.addEventListener('resize',()=>positionObjectSelectionHud(true),{passive:true});
      document.addEventListener('scroll',()=>positionObjectSelectionHud(true),true);
      startObjectHudTracking();
    }

    const v12RunSelfTest = runSelfTest;
    runSelfTest = function(){
      v12RunSelfTest();
      const results=window.__ffPrototypeTest||{};
      const originalLayout=worldLayout;
      results.fullBackgroundWorldDefault=document.body.dataset.worldLayout==='unified'&&getComputedStyle($('#fullWorldBackground')).display!=='none';results.workspaceModeWorldLayoutPicker=$$('#workspaceWorldLayoutPicker [data-world-layout-choice]').length===2&&$('#drawerFullBackgroundToggle').getAttribute('aria-pressed')==='true'&&$('#workspaceWorldLayoutStatus').textContent.includes('continuous');
      setWorldLayout('split',false);
      results.splitWorldOptional=document.body.dataset.worldLayout==='split'&&getComputedStyle($('#fullWorldBackground')).display==='none'&&getComputedStyle($('#leftScenery')).display!=='none'&&getComputedStyle($('#rightScenery')).display!=='none';
      setWorldLayout('unified',false);
      const fullBounds=$('#fullWorldBackground').getBoundingClientRect(),shellBounds=$('#shell').getBoundingClientRect();
      results.unifiedContinuousScene=document.body.dataset.worldLayout==='unified'&&$('#fullScenery .side-unified')!==null&&Math.abs(fullBounds.width-shellBounds.width)<1&&getComputedStyle($('#leftScenery')).display==='none'&&getComputedStyle($('#rightScenery')).display==='none';
      results.sideLanesRemainInteractive=getComputedStyle($('#leftWorld')).position==='relative'&&getComputedStyle($('#rightWorld')).position==='relative'&&getComputedStyle($('#leftObjects')).pointerEvents==='none'&&getComputedStyle($('.world-object',$('#leftObjects'))||$('#mascot')).pointerEvents==='auto';
      setMode('stage',false);
      results.unifiedThemeStage=document.body.dataset.worldLayout==='unified'&&getComputedStyle($('#fullWorldBackground')).display!=='none'&&getComputedStyle($('#leftScenery')).display==='none'&&getComputedStyle($('#rightScenery')).display==='none'&&$('#fullScenery .side-unified')!==null;
      setMode('living',false);updateWidths(18,18);updateWidths(7,9);results.sideWidthsReserveStudioSpace=$('#shell').style.gridTemplateColumns.includes('7vw')&&$('#shell').style.gridTemplateColumns.includes('9vw')&&$('#leftWidth').value==='7'&&$('#rightWidth').value==='9';updateWidths(18,18);
      results.launcherDefaultsHideRoomStageCanvas=['room','stage','canvas'].every(id=>launcherElement('dock',id)?.hidden)&&['room','stage','canvas'].every(id=>launcherElement('topbar',id)?.hidden);
      const clickable=[...objectState.values()].find(o=>o.scope==='world');if(clickable){setSelectedObject(null);clickable.el.click();results.worldObjectInteractionRestored=selectedObject===clickable;}else results.worldObjectInteractionRestored=false;
      setMode('living',false);
      const sample=[...objectState.values()][0];
      if(sample){setSelectedObject(sample);positionObjectSelectionHud(true);const hud=$('#objectSelectionHud'),hr=hud.getBoundingClientRect(),or=sample.el.getBoundingClientRect(),gap=Math.min(Math.abs(hr.bottom-or.top),Math.abs(hr.top-or.bottom));results.compactAttachedObjectToolbar=hud.classList.contains('visible')&&getComputedStyle(hud).position==='fixed'&&Number(getComputedStyle(hud).zIndex)>=220&&hr.width<240&&gap<=8&&getComputedStyle($('.object-mini-tools',sample.el)).display==='none';results.compactControlLabels=$('#hudGravity').textContent==='G'&&$('#hudTransform').textContent==='T'&&$('#hudLock').textContent==='L'&&parseFloat(getComputedStyle($('#hudGravity')).width)<=26;results.stableObjectToolbarInput=typeof objectHudFrozen==='boolean'&&!!$('#hudGravity')&&!!$('#hudRescue')&&typeof positionObjectSelectionHud==='function';setSelectedObject(null);}else{results.compactAttachedObjectToolbar=false;results.compactControlLabels=false;}
      setWorldLayout(originalLayout,false);
      const pass=Object.values(results).every(Boolean);
      $('#selfTest').textContent=pass?'PASS':'FAIL';
      document.body.dataset.selftest=pass?'pass':'fail';
      window.__ffPrototypeTest=results;
    };


    const v13RunSelfTest=runSelfTest;
    runSelfTest=function(){
      v13RunSelfTest();
      const results=window.__ffPrototypeTest||{};
      let a=null,b=null;
      try{
        results.stickerPinPeelIcons=!!$('#hudPin svg')&&!!$('#hudPeel svg')&&$('#hudPin').textContent.trim()===''&&$('#hudPeel').textContent.trim()==='';
        a=spawnUiObject(assetById['grid-ball'],360,260,{scope:'ui',gravity:false,notify:false});
        a.vx=12;a.vy=-8;a.moving=true;a.gravity=true;setSelectedObject(a);toggleSelectedGravity(a);
        results.gravityOffStopsMotion=!a.gravity&&!a.moving&&a.vx===0&&a.vy===0&&!a.physicsRaf;
        a.gravity=true;a.vx=8;a.vy=-4;a.moving=true;startObjectPhysics(a);const p=objectScreenCenter(a);pinObjectToTarget(a,p.x,p.y,$('.workspace-frame'));
        results.pinCancelsPhysics=a.scope==='sticker'&&!a.gravity&&!a.moving&&a.vx===0&&a.vy===0&&!a.physicsRaf;
        const beforeScope=a.scope,beforePos=[a.x,a.y];toggleSelectedGravity(a);
        results.stickerGravityDoesNotUnpin=a.scope===beforeScope&&a.scope==='sticker'&&!a.gravity&&!a.moving&&Math.abs(a.x-beforePos[0])<1&&Math.abs(a.y-beforePos[1])<1;results.pinnedStickerCurrentGravityAlwaysOff=a.gravity===false&&a.moving===false&&a.physicsRaf===0;
        b=spawnUiObject(assetById['cassette'],560,280,{scope:'ui',gravity:false,notify:false});
        b.vx=15;b.vy=10;b.moving=true;animateObject(b);
        results.gravityOffNeverSchedulesPhysics=!b.physicsRaf&&!b.moving&&b.vx===0&&b.vy===0;
        results.separateCollisionSurface=typeof UI_COLLIDER_SELECTOR==='string'&&!UI_COLLIDER_SELECTOR.includes('workspace-frame')&&!UI_COLLIDER_SELECTOR.includes('.world');
        results.singlePhysicsOwner=typeof cancelObjectPhysics==='function'&&typeof startObjectPhysics==='function'&&Number.isFinite(a.physicsEpoch);
      }catch(e){results.v14Error=String(e)}finally{[a,b].forEach(o=>{if(o){cancelObjectPhysics(o,{zeroVelocity:true,settle:false});objectState.delete(o.id);o.el.remove();}});setSelectedObject(null);}
      const pass=Object.values(results).every(Boolean);$('#selfTest').textContent=pass?'PASS':'FAIL';document.body.dataset.selftest=pass?'pass':'fail';window.__ffPrototypeTest=results;
    };


    /* V15: selection and peel visuals never own object geometry or input. */
    let v15SelectionMotionTimer=0;
    const v14SetSelectedObjectNatural=setSelectedObject;
    setSelectedObject=function(state){
      const previous=selectedObject;
      v14SetSelectedObjectNatural(state);
      if(!state||previous===state||!state.el?.isConnected)return;
      clearTimeout(v15SelectionMotionTimer);
      state.el.classList.remove('selection-enter');
      const hud=$('#objectSelectionHud');
      hud?.classList.remove('selection-enter');
      requestAnimationFrame(()=>{
        if(selectedObject!==state||!state.el?.isConnected)return;
        state.el.classList.add('selection-enter');
        hud?.classList.add('selection-enter');
      });
      v15SelectionMotionTimer=setTimeout(()=>{
        state.el?.classList.remove('selection-enter');
        hud?.classList.remove('selection-enter');
      },230);
    };

    function clearPeelFeedback(s){
      if(!s)return;
      if(s.peelTimer)clearTimeout(s.peelTimer);
      s.peelTimer=0;
      if(s.peelAnimation&&typeof s.peelAnimation.cancel==='function'){
        try{s.peelAnimation.cancel();}catch{}
      }
      s.peelAnimation=null;
      s.peelFx?.remove();
      s.peelFx=null;
      s.el?.classList.remove('peeling');
      s.peeling=false;
    }

    cancelObjectPeel=function(s){
      if(!s)return;
      ensureTransformState(s);
      s.peelEpoch=(s.peelEpoch||0)+1;
      clearPeelFeedback(s);
    };

    function createPeelFeedback(s){
      const fx=document.createElement('span');
      fx.className='peel-feedback';
      fx.setAttribute('aria-hidden','true');
      fx.innerHTML='<i class="peel-feedback-shadow"></i><i class="peel-feedback-curl"></i><i class="peel-feedback-tape"></i>';
      s.el.appendChild(fx);
      s.peelFx=fx;
      return fx;
    }

    peelSticker=function(s=selectedObject,{testOnly=false}={}){
      if(!s||s.scope!=='sticker'){toast('Select a pinned sticker first');return;}
      ensureTransformState(s);
      if(s.peeling&&!testOnly)return;
      if(testOnly){s.el.classList.add('peeling');return;}
      const oldName=s.asset.name;
      const useGravity=!!s.gravityAfterPeel;
      cancelObjectPhysics(s,{zeroVelocity:true,settle:false});
      cancelObjectPeel(s);
      const epoch=(s.peelEpoch||0)+1;
      s.peelEpoch=epoch;
      s.peeling=true;
      const stableX=s.x,stableY=s.y,stableRotation=s.rotation,stableScaleX=s.scaleX,stableScaleY=s.scaleY;
      s.scope='ui';
      s.side='ui';
      s.gravity=useGravity;
      s.pinTarget=null;
      s.pinTargetId=null;
      s.pinTargetKey=null;
      s.dragTilt=0;
      s.motionRotation=0;
      s.x=stableX;
      s.y=stableY;
      s.rotation=stableRotation;
      s.scaleX=stableScaleX;
      s.scaleY=stableScaleY;
      s.el.dataset.scope='ui';
      s.el.classList.remove('sticker-object','pin-host-hidden','sticking');
      s.el.classList.add('peeling');
      createPeelFeedback(s);
      updateObjectTransform(s);
      setSelectedObject(s);
      syncObjectSelectionHud();
      positionObjectSelectionHud(true);
      s.peelTimer=setTimeout(()=>{
        if(!s.el?.isConnected||s.peelEpoch!==epoch)return;
        s.peelTimer=0;
        s.peelFx?.remove();
        s.peelFx=null;
        s.el.classList.remove('peeling');
        s.peeling=false;
        settleObjectOrientation(s,{instant:true});
        if(s.gravity&&!s.dragging&&!s.locked){
          s.vx=1.05;
          s.vy=-1.15;
          s.moving=true;
          startObjectPhysics(s);
        }else if(!s.gravity){
          cancelObjectPhysics(s,{zeroVelocity:true,settle:true});
          updateObjectTransform(s);
        }
        saveScrapbookState();
        syncObjectSelectionHud();
        positionObjectSelectionHud(true);
        toast(`${oldName} peeled free with gravity ${s.gravity?'on':'off'}`);
      },380);
    };

    const v14ToggleSelectedGravityNatural=toggleSelectedGravity;
    toggleSelectedGravity=function(s=selectedObject){
      if(!s)return v14ToggleSelectedGravityNatural(s);
      if(s.peeling&&s.scope==='ui'){
        s.gravity=!s.gravity;
        if(!s.gravity)cancelObjectPhysics(s,{zeroVelocity:true,settle:true});
        else {s.vx=0;s.vy=0;s.moving=false;}
        setSelectedObject(s);
        saveScrapbookState();
        toast(`${s.asset.name} gravity ${s.gravity?'will start after the peel finishes':'disabled while peeling'}`);
        return;
      }
      return v14ToggleSelectedGravityNatural(s);
    };

    const v14RunSelfTestNatural=runSelfTest;
    runSelfTest=function(){
      v14RunSelfTestNatural();
      const results=window.__ffPrototypeTest||{};
      let selectionObj=null,peelObj=null;
      try{
        selectionObj=spawnUiObject(assetById['grid-ball'],430,250,{scope:'ui',gravity:false,notify:false});
        const beforeSelection={x:selectionObj.x,y:selectionObj.y,rotation:selectionObj.rotation,scaleX:selectionObj.scaleX,scaleY:selectionObj.scaleY};
        setSelectedObject(selectionObj);
        const afterSelection={x:selectionObj.x,y:selectionObj.y,rotation:selectionObj.rotation,scaleX:selectionObj.scaleX,scaleY:selectionObj.scaleY};
        results.selectionAnimationDoesNotMutateObjectGeometry=JSON.stringify(beforeSelection)===JSON.stringify(afterSelection)&&getComputedStyle($('#objectSelectionHud')).pointerEvents==='auto';
        peelObj=spawnUiObject(assetById['cassette'],560,330,{scope:'sticker',gravity:false,target:$('.workspace-frame'),notify:false});
        setSelectedObject(peelObj);
        const beforePeel={x:peelObj.x,y:peelObj.y,rotation:peelObj.rotation,scaleX:peelObj.scaleX,scaleY:peelObj.scaleY};
        peelSticker(peelObj);
        const afterPeel={x:peelObj.x,y:peelObj.y,rotation:peelObj.rotation,scaleX:peelObj.scaleX,scaleY:peelObj.scaleY};
        results.peelIsNonBlockingAndGeometryStable=peelObj.scope==='ui'&&peelObj.peeling&&!!peelObj.peelFx&&getComputedStyle(peelObj.peelFx).pointerEvents==='none'&&getComputedStyle(peelObj.el).pointerEvents!=='none'&&JSON.stringify(beforePeel)===JSON.stringify(afterPeel);
      }catch(e){results.v15AnimationError=String(e)}finally{
        [selectionObj,peelObj].forEach(o=>{if(o){cancelObjectPeel(o);cancelObjectPhysics(o,{zeroVelocity:true,settle:false});objectState.delete(o.id);o.el.remove();}});
        setSelectedObject(null);
      }
      const pass=Object.values(results).every(Boolean);
      $('#selfTest').textContent=pass?'PASS':'FAIL';
      document.body.dataset.selftest=pass?'pass':'fail';
      window.__ffPrototypeTest=results;
    };


    /* V21: multi-instance mascot system. Mascots are first-class Object Atlas actors with opt-in resize. */
    const mascotCatalog=[];
    const mascotInstances=new Map();
    const MASCOT_PREFS_SCHEMA=3;
    const mascotDefaultPrefs={
      enabled:true,addRemove:true,directManipulation:true,resize:false,rotate:true,pinning:true,throwPhysics:true,
      autonomy:true,objectInteractions:true,uiInteractions:true,musicWeatherReactions:true,speechSound:true,
      themeCompanion:true,quietFocus:false
    };
    let mascotPrefs={...mascotDefaultPrefs};
    let mascotBehaviorTimer=0;
    let defaultMascotInstance=null;
    let mascotRestoreInProgress=false;

    function loadMascotPrefs(){
      try{
        const saved=JSON.parse(localStorage.getItem('ff-mascot-prefs')||'null');
        if(saved){
          const schema=Number(saved._schema||0),legacyResizeRotate=saved.resizeRotate;
          const clean={...saved};delete clean._schema;delete clean.resizeRotate;
          mascotPrefs={...mascotDefaultPrefs,...clean};
          if(schema<MASCOT_PREFS_SCHEMA){
            mascotPrefs.resize=false;
            if(typeof clean.rotate!=='boolean')mascotPrefs.rotate=typeof legacyResizeRotate==='boolean'?legacyResizeRotate:true;
          }
        }
      }catch{}
      applyMascotPrefs(false);
    }
    function saveMascotPrefs(){try{localStorage.setItem('ff-mascot-prefs',JSON.stringify({...mascotPrefs,_schema:MASCOT_PREFS_SCHEMA}));}catch{}}
    function applyMascotPrefs(save=true){
      document.body.dataset.mascotsEnabled=String(!!mascotPrefs.enabled);
      document.body.dataset.mascotResize=String(!!mascotPrefs.resize);
      document.body.dataset.mascotRotate=String(!!mascotPrefs.rotate);
      document.body.dataset.mascotDirect=String(!!mascotPrefs.directManipulation);
      document.body.dataset.mascotPinning=String(!!mascotPrefs.pinning);
      $$('[data-mascot-setting]').forEach(button=>{
        const on=!!mascotPrefs[button.dataset.mascotSetting];
        button.classList.toggle('active',on);
        button.setAttribute('aria-pressed',String(on));
      });
      for(const s of mascotInstances.values()){
        s.el.setAttribute('aria-hidden',String(!mascotPrefs.enabled));
        if(!mascotPrefs.throwPhysics&&s.gravity){s.gravity=false;cancelObjectPhysics(s,{zeroVelocity:true,settle:true});}
        if(!mascotPrefs.autonomy)s.el.classList.remove('mascot-idle','mascot-walk','mascot-hop','mascot-look','mascot-rare','mascot-object-play');
      }
      updateMascotCount();
      syncMascotHudPermissions();
      if(save)saveMascotPrefs();
    }
    function setMascotPref(key,value=!mascotPrefs[key]){
      if(!(key in mascotDefaultPrefs))return;
      mascotPrefs[key]=!!value;
      if(key==='themeCompanion'){
        if(mascotPrefs.themeCompanion&&mascotPrefs.enabled)ensureThemeMascot();
        else if(defaultMascotInstance?.el?.isConnected){
          const doomed=defaultMascotInstance;
          cancelObjectPhysics(doomed,{zeroVelocity:true,settle:false});
          clearTimeout(doomed.mascotActionTimer);clearTimeout(doomed.mascotSpeechTimer);
          mascotInstances.delete(doomed.id);objectState.delete(doomed.id);doomed.el.remove();defaultMascotInstance=null;
        }
      }
      if(key==='enabled'&&mascotPrefs.enabled&&mascotPrefs.themeCompanion)ensureThemeMascot();
      applyMascotPrefs();
      saveWorldMascotState();
      toast(`${key.replace(/([A-Z])/g,' $1')} ${mascotPrefs[key]?'enabled':'disabled'}`);
    }
    function registerMascotAssets(){
      if(mascotCatalog.length)return;
      Object.entries(themes).forEach(([themeId,t])=>{
        const asset={
          id:`mascot-${themeId}`,theme:themeId,name:t.mascot,art:mascotArt(themeId),kind:'mascot',isMascot:true,
          type:'Mascot companion',physics:'Character body · optional throw and gravity',
          affordances:'Walk, idle, rare action, speak, react, use objects, pin, optional resize, rotate',
          mascot:'Self-directed companion behavior',breakable:false,stickerCapable:true,
          behaviorProfile:{engine:'Feature Foundry Mascot Shell',idle:['breathe','look','blink'],movement:['walk','hop','throw','land'],rare:['celebrate','inspect-world','music-dance'],surfaces:['floor','wall','card','panel','sticker-zone'],themeLinked:true}
        };
        mascotCatalog.push(asset);assets.push(asset);assetById[asset.id]=asset;
      });
    }
    function mascotStates(){return [...mascotInstances.values()].filter(s=>s.el?.isConnected);}
    function updateMascotCount(){
      const count=mascotStates().length;
      if($('#mascotCountChip'))$('#mascotCountChip').textContent=`${count} active`;
    }
    function setMascotStateLabel(s,label){if(!s?.el)return;s.mascotBehavior=label;s.el.dataset.mascotState=label;}
    function mascotSpeech(s,text,{sound=true}={}){
      if(!s?.el?.isConnected||!mascotPrefs.speechSound)return;
      s.el.querySelector('.mascot-speech-bubble')?.remove();
      const bubble=document.createElement('span');bubble.className='mascot-speech-bubble';bubble.textContent=text;s.el.appendChild(bubble);
      s.el.classList.add('mascot-speaking');setMascotStateLabel(s,'speaking');
      if(sound)playSynth([392,493.88,587.33],'sine');
      clearTimeout(s.mascotSpeechTimer);s.mascotSpeechTimer=setTimeout(()=>{bubble.remove();s.el.classList.remove('mascot-speaking');setMascotStateLabel(s,s.scope==='sticker'?'pinned companion':'ready');},1700);
    }
    function clearMascotAction(s){
      if(!s?.el)return;
      s.el.classList.remove('mascot-idle','mascot-walk','mascot-hop','mascot-look','mascot-rare','mascot-object-play');
    }
    function playMascotAction(s,action,{announce=false}={}){
      if(!s?.el?.isConnected||!mascotPrefs.enabled)return false;
      clearMascotAction(s);
      const className=`mascot-${action}`;s.el.classList.add(className);setMascotStateLabel(s,action.replace('-',' '));
      const durations={idle:1300,walk:1250,hop:760,look:820,rare:1240,'object-play':780};
      clearTimeout(s.mascotActionTimer);s.mascotActionTimer=setTimeout(()=>{s.el.classList.remove(className);setMascotStateLabel(s,s.scope==='sticker'?'pinned companion':'ready');},durations[action]||900);
      if(announce)mascotSpeech(s,{idle:'Just taking in the world.',walk:'Let’s explore.',hop:'Boing!',look:'What is that?',rare:'A rare animation!', 'object-play':'This object is fun.'}[action]||'Hello!');
      return true;
    }
    function nearbyObjectForMascot(s){
      const peers=[...objectState.values()].filter(o=>o!==s&&!o.isMascot&&o.el?.isConnected&&o.el.parentElement===s.el.parentElement);
      if(!peers.length)return null;
      return peers.sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
    }
    function stepMascot(s){
      if(!mascotPrefs.enabled||!mascotPrefs.autonomy||s.dragging||s.locked||s.scope==='sticker'||!s.el?.isConnected)return;
      if(currentMode==='performance'||currentWorldState!=='interactive'||(currentMode==='focus'&&mascotPrefs.quietFocus))return;
      if(musicPlaying&&mascotPrefs.musicWeatherReactions){s.el.classList.add('mascot-dance');setMascotStateLabel(s,'music dancing');return;}
      s.el.classList.remove('mascot-dance');
      const roll=Math.random();
      if(roll>.92){playMascotAction(s,'rare');if(mascotPrefs.speechSound&&Math.random()>.45)mascotSpeech(s,'I found something unusual!',{sound:false});return;}
      if(roll>.72&&mascotPrefs.objectInteractions){const target=nearbyObjectForMascot(s);if(target){playMascotAction(s,'object-play');target.el.querySelector('.object-visual')?.animate([{transform:'translateY(0)'},{transform:'translateY(-4px) rotate(3deg)'},{transform:'translateY(0)'}],{duration:520,easing:'ease-out'});return;}}
      if(roll>.48){playMascotAction(s,'look');return;}
      if(roll>.28){playMascotAction(s,'hop');return;}
      playMascotAction(s,'walk');
      if(s.scope==='world'){
        const dir=Math.random()>.5?1:-1;s.x+=dir*(10+Math.random()*18);clampObject(s);updateObjectTransform(s);
      }else if(s.scope==='ui'&&mascotPrefs.uiInteractions){
        s.x+=Math.random()>.5?8:-8;clampObject(s);updateObjectTransform(s);
      }
    }
    function mascotBehaviorLoop(){clearInterval(mascotBehaviorTimer);mascotBehaviorTimer=0;if(window.__ffRuntimeGovernor?.isSuspended()||document.hidden)return;mascotBehaviorTimer=setInterval(()=>{if(!window.__ffRuntimeGovernor?.isSuspended()&&!document.hidden)mascotStates().forEach(stepMascot);},1450);}
    function stopMascotBehaviorLoop(){clearInterval(mascotBehaviorTimer);mascotBehaviorTimer=0;}
    function promoteMascotState(s,{themeLinked=false,userAdded=true}={}){
      if(!s||s.isMascot)return s;
      s.isMascot=true;s.kind='mascot';s.themeLinked=themeLinked;s.userAdded=userAdded;s.asset.isMascot=true;
      s.el.classList.add('mascot-actor');s.el.dataset.mascotId=s.asset.id;s.el.dataset.mascotState=s.scope==='sticker'?'pinned companion':'ready';
      s.el.setAttribute('role','button');s.el.setAttribute('aria-label',`${s.asset.name} mascot companion`);
      mascotInstances.set(s.id,s);updateMascotCount();
      s.el.addEventListener('pointerdown',e=>{
        const resizeGesture=e.target.closest('.transform-handle'),rotateGesture=e.target.closest('.rotate-handle');
        if(resizeGesture&&!mascotPrefs.resize){e.preventDefault();e.stopImmediatePropagation();setSelectedObject(s);toast('Mascot resizing is off by default. Enable it in Settings.');return;}
        if(rotateGesture&&!mascotPrefs.rotate){e.preventDefault();e.stopImmediatePropagation();setSelectedObject(s);toast('Mascot rotation is disabled in Settings.');return;}
        const transformGesture=resizeGesture||rotateGesture;
        if(!transformGesture&&!mascotPrefs.directManipulation){e.preventDefault();e.stopImmediatePropagation();setSelectedObject(s);if(mascotPrefs.speechSound)mascotSpeech(s,'Direct dragging is off in Settings.',{sound:false});}
      },true);
      s.el.addEventListener('dblclick',e=>{e.stopPropagation();playMascotAction(s,Math.random()>.75?'rare':'hop',{announce:true});});
      return s;
    }
    const v19SpawnObjectMascot=spawnObject;
    spawnObject=function(side,asset,x=null,y=null,notify=true,options={}){
      if(asset?.isMascot&&!mascotPrefs.addRemove&&options.userAdded!==false&&!mascotRestoreInProgress&&!historyState.restoring){toast('Mascot add/remove is disabled in Settings.');return null;}
      const state=v19SpawnObjectMascot(side,asset,x,y,notify,{...options,gravity:asset?.isMascot?(mascotPrefs.throwPhysics&&(options.gravity??false)):options.gravity});
      const promoted=asset?.isMascot?promoteMascotState(state,{themeLinked:!!options.themeLinked,userAdded:options.userAdded!==false}):state;
      if(promoted?.isMascot&&options.userAdded!==false&&historyState.ready&&!historyState.restoring)recordHistory(`Added ${promoted.asset.name} mascot`);
      return promoted;
    };
    const v19SpawnUiObjectMascot=spawnUiObject;
    spawnUiObject=function(asset,x=null,y=null,opts={}){
      if(asset?.isMascot&&!mascotPrefs.addRemove&&opts.userAdded!==false&&!mascotRestoreInProgress&&!historyState.restoring){toast('Mascot add/remove is disabled in Settings.');return null;}
      const scope=opts.scope||'ui';
      if(asset?.isMascot&&scope==='sticker'&&!mascotPrefs.pinning){toast('Mascot pinning is disabled in Settings.');return null;}
      const state=v19SpawnUiObjectMascot(asset,x,y,{...opts,gravity:asset?.isMascot?(mascotPrefs.throwPhysics&&!!opts.gravity):opts.gravity});
      const promoted=asset?.isMascot?promoteMascotState(state,{themeLinked:!!opts.themeLinked,userAdded:opts.userAdded!==false}):state;
      if(promoted?.isMascot&&opts.userAdded!==false&&historyState.ready&&!historyState.restoring)recordHistory(`Added ${promoted.asset.name} mascot`);
      return promoted;
    };
    const v19PinObjectToTargetMascot=pinObjectToTarget;
    pinObjectToTarget=function(s,...args){if(s?.isMascot&&!mascotPrefs.pinning){toast('Mascot pinning is disabled in Settings.');return s;}const out=v19PinObjectToTargetMascot(s,...args);if(s?.isMascot)setMascotStateLabel(s,'pinned companion');return out;};
    const v19ToggleGravityMascot=toggleSelectedGravity;
    toggleSelectedGravity=function(s=selectedObject){if(s?.isMascot&&!mascotPrefs.throwPhysics){toast('Mascot throw physics are disabled in Settings.');return;}return v19ToggleGravityMascot(s);};
    const v19ScaleMascot=setSelectedScale;
    setSelectedScale=function(axis,value){if(selectedObject?.isMascot&&!mascotPrefs.resize){toast('Mascot resizing is off by default. Enable it in Settings.');return;}return v19ScaleMascot(axis,value);};
    const v19RotateMascot=setSelectedRotation;
    setSelectedRotation=function(value){if(selectedObject?.isMascot&&!mascotPrefs.rotate){toast('Mascot rotation is disabled in Settings.');return;}return v19RotateMascot(value);};
    const v19RemoveMascot=removeSelected;
    removeSelected=function(){
      if(selectedObject?.isMascot&&!mascotPrefs.addRemove){toast('Mascot removal is disabled in Settings.');return;}
      const doomed=selectedObject,name=doomed?.asset?.name;if(doomed?.isMascot){mascotInstances.delete(doomed.id);if(defaultMascotInstance===doomed)defaultMascotInstance=null;}
      const out=v19RemoveMascot();updateMascotCount();saveWorldMascotState();if(doomed?.isMascot&&historyState.ready&&!historyState.restoring)recordHistory(`Removed ${name} mascot`);return out;
    };
    const v19InteractMascot=interactObject;
    interactObject=function(s){if(!s?.isMascot)return v19InteractMascot(s);setSelectedObject(s);playMascotAction(s,Math.random()>.72?'rare':'hop',{announce:true});return true;};
    const v19SetSelectedMascot=setSelectedObject;
    setSelectedObject=function(state){const out=v19SetSelectedMascot(state);syncMascotHudPermissions();return out;};
    function syncMascotHudPermissions(){
      const mascot=!!selectedObject?.isMascot;
      if($('#hudPin'))$('#hudPin').disabled=mascot&&(!mascotPrefs.pinning||selectedObject.scope==='sticker');
      if($('#hudPeel'))$('#hudPeel').disabled=mascot?selectedObject.scope!=='sticker':selectedObject?.scope!=='sticker';
      if($('#hudGravity'))$('#hudGravity').disabled=mascot&&!mascotPrefs.throwPhysics;
      if($('#hudTransform'))$('#hudTransform').disabled=false;
      const resizeBlocked=mascot&&!mascotPrefs.resize,rotateBlocked=mascot&&!mascotPrefs.rotate;
      ['transformScaleX','transformScaleY'].forEach(id=>{const input=$('#'+id);if(input)input.disabled=resizeBlocked;input?.closest('.transform-field')?.classList.toggle('mascot-capability-disabled',resizeBlocked);});
      ['transformRotation','transformRotationNumber'].forEach(id=>{const input=$('#'+id);if(input)input.disabled=rotateBlocked;input?.closest('.transform-field')?.classList.toggle('mascot-capability-disabled',rotateBlocked);});
    }
    function ensureThemeMascot(){
      if(!mascotPrefs.themeCompanion||!mascotPrefs.enabled)return null;
      const asset=assetById[`mascot-${currentTheme}`];if(!asset)return null;
      if(defaultMascotInstance?.el?.isConnected){
        defaultMascotInstance.asset=asset;defaultMascotInstance.el.dataset.mascotId=asset.id;
        defaultMascotInstance.el.querySelector('.object-visual').innerHTML=asset.art;
        defaultMascotInstance.el.querySelector('.object-name').textContent=asset.name;
        defaultMascotInstance.themeLinked=true;setMascotStateLabel(defaultMascotInstance,'theme companion');return defaultMascotInstance;
      }
      const layer=$('#leftObjects'),y=Math.max(90,layer.clientHeight*.70);
      defaultMascotInstance=spawnObject('left',asset,Math.max(8,layer.clientWidth*.38),y,false,{gravity:false,themeLinked:true,userAdded:false});
      return defaultMascotInstance;
    }
    const v19RenderMascot=renderMascot;
    renderMascot=function(){const legacy=$('#mascot');if(legacy)legacy.hidden=true;};
    const v19SetThemeMascot=setTheme;
    setTheme=function(id,notify=false){const out=v19SetThemeMascot(id,notify);ensureThemeMascot();renderFloatingAssetGrid($('#floatingAssetSearch')?.value||'');return out;};
    const v19ResetRoomMascot=resetRoom;
    resetRoom=function(notify=true){
      const preserved=[...mascotInstances.values()].filter(s=>s.el?.isConnected).map(s=>({asset:s.asset,side:s.side,scope:s.scope,x:s.x,y:s.y,scaleX:s.scaleX,scaleY:s.scaleY,rotation:s.rotation,themeLinked:s.themeLinked,userAdded:s.userAdded,pinTarget:s.pinTarget,gravity:s.gravity}));
      mascotInstances.clear();defaultMascotInstance=null;
      v19ResetRoomMascot(notify);
      preserved.filter(p=>!p.themeLinked).forEach(p=>{const n=p.scope==='world'?spawnObject(p.side,p.asset,p.x,p.y,false,{gravity:p.gravity,userAdded:false}):spawnUiObject(p.asset,p.x,p.y,{scope:p.scope,gravity:p.gravity,target:p.pinTarget,notify:false,userAdded:false});if(n){n.scaleX=p.scaleX;n.scaleY=p.scaleY;n.rotation=p.rotation;commitTransform(n,{save:false});}});
      ensureThemeMascot();updateMascotCount();
    };
    const v19ToggleMusicMascot=toggleMusic;
    toggleMusic=function(force){const out=v19ToggleMusicMascot(force);mascotStates().forEach(s=>{s.el.classList.toggle('mascot-dance',musicPlaying&&mascotPrefs.musicWeatherReactions);if(!musicPlaying)setMascotStateLabel(s,s.scope==='sticker'?'pinned companion':'ready');});return out;};
    const v19SetWeatherMascot=setWeather;
    setWeather=function(type,notify=false){const out=v19SetWeatherMascot(type,notify);if(notify&&mascotPrefs.musicWeatherReactions)mascotStates().slice(0,2).forEach(s=>playMascotAction(s,type==='rain'?'look':'hop'));return out;};
    const v19FilteredMascots=filteredAssets;
    function mascotFilteredAssets(filter=''){const term=filter.trim().toLowerCase();return mascotCatalog.filter(a=>!term||`${a.name} ${a.type} ${a.affordances} ${themes[a.theme].name}`.toLowerCase().includes(term));}
    const v19AssetCardMarkupMascot=assetCardMarkup;
    assetCardMarkup=function(a,compact=false){const markup=v19AssetCardMarkupMascot(a,compact);return a?.isMascot?markup.replace('class="asset-card','class="asset-card mascot-card'):markup;};
    const v19RenderFloatingMascot=renderFloatingAssetGrid;
    renderFloatingAssetGrid=function(filter=''){
      const grid=$('#floatingAssetGrid');if(!grid)return;
      const tab=$('#floatingVault')?.dataset.tab||'atlas';
      if(tab==='mascots'){grid.innerHTML=mascotFilteredAssets(filter).map(a=>assetCardMarkup(a,true)).join('');bindAssetCards(grid);return;}
      if(tab==='atlas'){const items=v19FilteredMascots(filter).filter(a=>!a.isMascot);grid.innerHTML=items.map(a=>assetCardMarkup(a,true)).join('');bindAssetCards(grid);return;}
      return v19RenderFloatingMascot(filter);
    };
    const v19UpdateAtlasMascot=updateObjectAtlas;
    updateObjectAtlas=function(){
      v19UpdateAtlasMascot();if(!selectedAsset?.isMascot)return;
      $('#floatingAtlasEyebrow').textContent='Mascot Registry';
      $('#floatingAssetCopy').textContent=`${themes[selectedAsset.theme].name} companion with autonomous actions, object-grade transforms, UI pinning, optional gravity and persistent placement.`;
      $('#floatingAssetBadges').innerHTML=[themes[selectedAsset.theme].name,'Mascot companion','Add/remove',mascotPrefs.resize?'Resize enabled':'Resize opt-in','Pin-ready'].map(x=>`<span>${x}</span>`).join('');
      $('#floatingAssetPhysics').textContent='Character body · settings-controlled';
      $('#floatingAssetActions').textContent=selectedAsset.affordances;
      $('#floatingMediaBehavior').textContent='Music, weather, time and object reactions';
    };
    const v19OpenVaultTabMascot=openVaultTab;
    openVaultTab=function(tab){const out=v19OpenVaultTabMascot(tab);if(tab==='mascots'){selectedAsset=mascotCatalog.find(a=>a.theme===currentTheme)||mascotCatalog[0];$('#floatingAssetSearch').placeholder='Search mascots and behavior profiles...';renderFloatingAssetGrid($('#floatingAssetSearch').value);updateObjectAtlas();}else if($('#floatingAssetSearch'))$('#floatingAssetSearch').placeholder='Search Object Atlas...';return out;};
    const v19HandleFileMascot=handleFile;
    handleFile=function(file){
      if($('#floatingVault')?.dataset.tab!=='mascots')return v19HandleFileMascot(file);
      if(!file)return;if(!mascotPrefs.addRemove){toast('Mascot add/remove is disabled in Settings.');return;}
      const id=`mascot-user-${Date.now()}`,name=file.name.replace(/\.[^.]+$/,'');
      const finish=art=>{const asset={id,theme:currentTheme,name,art,kind:'mascot',isMascot:true,type:'Imported mascot companion',physics:'Character body · optional throw',affordances:'Idle, walk, speak, pin, resize, rotate, react',mascot:'Imported companion',breakable:false,stickerCapable:true,behaviorProfile:{engine:'Imported Mascot Adapter',source:file.name}};mascotCatalog.unshift(asset);assets.push(asset);assetById[id]=asset;selectedAsset=asset;renderFloatingAssetGrid('');updateObjectAtlas();toast(`${name} imported into the Mascot Registry`);};
      if(file.type.startsWith('image/')){const reader=new FileReader();reader.onload=()=>finish(`<img src="${reader.result}" alt="">`);reader.readAsDataURL(file);}else finish(mascotArt(currentTheme));
    };
    function dismissAllMascots(){if(!mascotPrefs.addRemove){toast('Mascot removal is disabled in Settings.');return;}for(const s of mascotStates()){cancelObjectPhysics(s,{zeroVelocity:true,settle:false});s.el.remove();objectState.delete(s.id);}mascotInstances.clear();defaultMascotInstance=null;setSelectedObject(null);updateMascotCount();saveWorldMascotState();toast('All mascots dismissed.');}
    function addThemeMascot(side='left'){const asset=assetById[`mascot-${currentTheme}`];return spawnObject(side,asset,null,null,true,{gravity:false});}
    function saveWorldMascotState(){
      try{const items=mascotStates().filter(s=>s.scope==='world'&&!s.themeLinked).map(s=>({assetId:s.asset.id,side:s.side,x:s.x,y:s.y,rotation:s.rotation,scaleX:s.scaleX,scaleY:s.scaleY,gravity:s.gravity}));localStorage.setItem('ff-world-mascots',JSON.stringify(items));}catch{}
    }
    function restoreWorldMascotState(){
      mascotRestoreInProgress=true;
      try{const items=JSON.parse(localStorage.getItem('ff-world-mascots')||'[]');items.forEach(item=>{const asset=assetById[item.assetId];if(!asset?.isMascot)return;const s=spawnObject(item.side||'left',asset,item.x,item.y,false,{gravity:item.gravity,userAdded:true});if(s){s.rotation=item.rotation||0;s.scaleX=item.scaleX||1;s.scaleY=item.scaleY||1;commitTransform(s,{save:false});}});}catch{}finally{mascotRestoreInProgress=false;}
    }
    const v19RestoreScrapbookMascot=restoreScrapbookState;
    restoreScrapbookState=function(){mascotRestoreInProgress=true;try{return v19RestoreScrapbookMascot();}finally{mascotRestoreInProgress=false;}};
    const v19SaveScrapbookMascot=saveScrapbookState;
    saveScrapbookState=function(){const out=v19SaveScrapbookMascot();saveWorldMascotState();return out;};
    function bindMascotSettings(){
      $$('[data-mascot-setting]').forEach(button=>button.addEventListener('click',e=>{e.stopPropagation();setMascotPref(button.dataset.mascotSetting);}));
      $('#openMascotRegistry')?.addEventListener('click',()=>openVaultTab('mascots'));
      $('#drawerOpenMascots')?.addEventListener('click',()=>{closeDrawer();openVaultTab('mascots')});
      $('#addThemeMascot')?.addEventListener('click',()=>addThemeMascot(mascotStates().length%2?'right':'left'));
      $('#dismissSelectedMascot')?.addEventListener('click',()=>selectedObject?.isMascot?removeSelected():toast('Select a mascot first.'));
      $('#dismissAllMascots')?.addEventListener('click',dismissAllMascots);
      $('#mascotCloneSelected')?.addEventListener('click',()=>selectedAsset?.isMascot?spawnUiObject(selectedAsset,innerWidth*.5-50,innerHeight*.42-50,{scope:'ui',gravity:false}):toast('Choose a mascot first.'));
      $('#mascotDismissSelectedVault')?.addEventListener('click',()=>selectedObject?.isMascot?removeSelected():toast('Select a placed mascot first.'));
      $$('[data-vault-tab="mascots"]').forEach(button=>button.addEventListener('click',()=>{openVaultTab('mascots')}));
    }
    function initMascotSystem(){
      registerMascotAssets();loadMascotPrefs();bindMascotSettings();mascotBehaviorLoop();
      $('#fileInput')?.setAttribute('accept','image/*,.gif,.png,.webp,.json,.zip,.blend,.glb,.gltf,.obj,.fbx,audio/*');
    }

    /* V23 history integration: rebuild the mascot registry only after the mascot runtime exists. */
    const v23ClearAllObjectsForRestoreMascots=clearAllObjectsForRestore;
    clearAllObjectsForRestore=function(){
      for(const s of mascotStates()){
        clearTimeout(s.mascotActionTimer);clearTimeout(s.mascotSpeechTimer);
      }
      mascotInstances.clear();defaultMascotInstance=null;
      return v23ClearAllObjectsForRestoreMascots();
    };
    const v23RestoreStudioStateMascots=restoreStudioState;
    restoreStudioState=function(snapshot){
      const out=v23RestoreStudioStateMascots(snapshot);
      mascotInstances.clear();defaultMascotInstance=null;
      for(const s of objectState.values()){
        if(!(s.isMascot||s.asset?.isMascot))continue;
        if(!s.isMascot)promoteMascotState(s,{themeLinked:!!s.themeLinked,userAdded:s.userAdded!==false});
        else mascotInstances.set(s.id,s);
        if(s.themeLinked)defaultMascotInstance=s;
      }
      updateMascotCount();syncMascotHudPermissions();
      return out;
    };

    const v19RunSelfTestMascot=runSelfTest;
    runSelfTest=function(){
      const activitySnapshot=$('#activityList')?.innerHTML||'';
      v19RunSelfTestMascot();
      const results=window.__ffPrototypeTest||{};let added=null,pinned=null;
      try{
        results.mascotRegistry=mascotCatalog.length===Object.keys(themes).length&&!!$('[data-vault-tab="mascots"]');
        results.defaultMascotUsesObjectPipeline=!!defaultMascotInstance?.isMascot&&objectState.get(defaultMascotInstance.id)===defaultMascotInstance&&defaultMascotInstance.el.classList.contains('mascot-actor');
        added=spawnUiObject(mascotCatalog[1],460,270,{scope:'ui',gravity:false,notify:false,userAdded:false});
        results.mascotAddRemove=!!added&&mascotInstances.has(added.id);setSelectedObject(added);added.scaleX=1.35;added.scaleY=1.35;added.rotation=18;commitTransform(added,{save:false});
        results.mascotObjectGradeTransform=added.scaleX===1.35&&added.rotation===18&&added.el.querySelectorAll('.transform-handle').length===4;
        pinned=spawnUiObject(mascotCatalog[2],540,330,{scope:'sticker',gravity:false,target:$('.workspace-frame'),notify:false,userAdded:false});
        results.mascotPinning=!!pinned&&pinned.scope==='sticker'&&pinned.el.classList.contains('sticker-object');
        results.mascotSettingsGranular=Object.keys(mascotDefaultPrefs).every(k=>$$(`[data-mascot-setting="${k}"]`).length>=1);
        results.mascotResizeDefaultOff=mascotPrefs.resize===false&&document.body.dataset.mascotResize==='false'&&[...added.el.querySelectorAll('.transform-handle')].every(h=>getComputedStyle(h).display==='none');
        results.mascotRotationIndependent=mascotPrefs.rotate===true&&getComputedStyle(added.el.querySelector('.rotate-handle')).display!=='none';
        results.visualQualitySystem=['ultra','balanced','eco'].includes(resolvedVisualQuality)&&!!$('#visualQualityPicker')&&document.body.dataset.visualQualityMode==='adaptive';
        results.advancedFrutigerScene=sceneMarkup('frutiger','unified').includes('aero-arch')&&sceneMarkup('frutiger','unified').includes('aero-pod')&&sceneMarkup('frutiger','unified').includes('aero-caustics');
        results.mascotDirectManipulationBound=added.el.dataset.bound==='true'&&added.el.classList.contains('mascot-actor');
        results.mascotAutonomyEngine=typeof stepMascot==='function'&&typeof playMascotAction==='function'&&mascotBehaviorTimer!==0;
      }catch(e){results.v21MascotError=String(e)}finally{
        [added,pinned].forEach(s=>{if(s){mascotInstances.delete(s.id);objectState.delete(s.id);s.el.remove();}});setSelectedObject(null);updateMascotCount();
      }
      if($('#activityList'))$('#activityList').innerHTML=activitySnapshot;
      const pass=!results.v21MascotError&&Object.values(results).every(v=>v===true);$('#selfTest').textContent=pass?'PASS':'FAIL';document.body.dataset.selftest=pass?'pass':'fail';window.__ffPrototypeTest=results;
    };


    /* V21: adaptive visual quality and one compositor-safe pointer-light owner. */
    const visualQualityDefaults={mode:'adaptive'};
    let visualQualityPrefs={...visualQualityDefaults};
    let resolvedVisualQuality='balanced',specularFrame=0,pendingSpecular={x:innerWidth*.5,y:innerHeight*.28};
    function resolveVisualQuality(mode=visualQualityPrefs.mode){
      if(mode!=='adaptive')return ['ultra','balanced','eco'].includes(mode)?mode:'balanced';
      const governed=window.__ffRuntimeGovernor?.adaptiveTier;
      if(['ultra','balanced','eco'].includes(governed))return governed;
      const cores=navigator.hardwareConcurrency||4,memory=navigator.deviceMemory||4,dpr=devicePixelRatio||1;
      if(cores>=8&&memory>=8&&dpr<=2.5)return 'ultra';
      if(cores>=4&&memory>=4)return 'balanced';
      return 'eco';
    }
    function applyVisualQuality(save=true){
      resolvedVisualQuality=resolveVisualQuality();
      document.body.dataset.visualQualityMode=visualQualityPrefs.mode;
      document.body.dataset.visualQuality=resolvedVisualQuality;
      $$('[data-visual-quality-mode]').forEach(button=>{const active=button.dataset.visualQualityMode===visualQualityPrefs.mode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
      const names={ultra:'Cinematic',balanced:'Balanced',eco:'Eco'};
      if($('#visualQualityResolved'))$('#visualQualityResolved').textContent=visualQualityPrefs.mode==='adaptive'?`Adaptive · ${names[resolvedVisualQuality]}`:names[resolvedVisualQuality];
      if($('#visualQualityMaterial'))$('#visualQualityMaterial').textContent=resolvedVisualQuality==='ultra'?'Deep spectral materials':resolvedVisualQuality==='balanced'?'Layered spectral materials':'Lean solid materials';
      if($('#visualQualityMotion'))$('#visualQualityMotion').textContent=resolvedVisualQuality==='ultra'?'Full atmospheric detail':resolvedVisualQuality==='balanced'?'Compositor-safe motion':'Essential motion only';
      resetParticles();
      if(save)try{localStorage.setItem('ff-visual-quality',JSON.stringify(visualQualityPrefs));}catch{}
    }
    function setVisualQuality(mode){visualQualityPrefs.mode=mode;if(mode==='adaptive')window.__ffRuntimeGovernor?.resetAdaptive('User returned to measured Adaptive mode');applyVisualQuality();window.__ffRuntimeGovernor?.updateDiagnostics();toast(`Visual quality: ${mode==='adaptive'?'Adaptive · '+resolvedVisualQuality:mode}`);}
    function updateSpecularLight(){specularFrame=0;const light=$('#uiSpecularLight');if(!light||resolvedVisualQuality==='eco'||currentMode==='performance'||window.__ffRuntimeGovernor?.isSuspended())return;light.style.transform=`translate3d(${pendingSpecular.x}px,${pendingSpecular.y}px,0)`;}
    function initVisualQuality(){
      try{const saved=JSON.parse(localStorage.getItem('ff-visual-quality')||'null');if(saved)visualQualityPrefs={...visualQualityDefaults,...saved};}catch{}
      $$('[data-visual-quality-mode]').forEach(button=>button.addEventListener('click',()=>setVisualQuality(button.dataset.visualQualityMode)));
      document.addEventListener('pointermove',event=>{if(window.__ffRuntimeGovernor?.isSuspended())return;pendingSpecular.x=event.clientX;pendingSpecular.y=event.clientY;if(!specularFrame)specularFrame=requestAnimationFrame(updateSpecularLight);},{passive:true});
      applyVisualQuality(false);updateSpecularLight();
    }
    const v20ResetParticlesForQuality=resetParticles;
    resetParticles=function(){
      v20ResetParticlesForQuality();
      const target=currentMode==='performance'?0:resolvedVisualQuality==='ultra'?(currentWeather==='fog'?28:44):resolvedVisualQuality==='balanced'?(currentWeather==='fog'?18:30):(currentWeather==='fog'?10:16);
      if(particles.length>target)particles.length=target;
      while(particles.length<target)particles.push({x:Math.random(),y:Math.random(),r:1+Math.random()*7,vx:(Math.random()-.5)*.0007,vy:.0003+Math.random()*.0012,a:.14+Math.random()*.42,kind:particleKind(),rot:Math.random()*6.28});
    };
    const v20SetModeForVisualQuality=setMode;
    setMode=function(mode,notify=true){const out=v20SetModeForVisualQuality(mode,notify);resetParticles();return out;};


    /* V22: deterministic vector icon system and cinematic procedural world renderer. */
    const cinematicIcons={
      home:'<path d="M3 11.5 12 4l9 7.5v8a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5z"/>',
      spark:'<path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z"/><path d="m18 15 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/>',
      layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
      music:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
      sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
      mascot:'<path d="M8 5c0-2 1.8-3 4-3s4 1 4 3v1.4c2.1 1.2 3.5 3.5 3.5 6.1 0 4.4-3.3 8-7.5 8s-7.5-3.6-7.5-8C4.5 9.9 5.9 7.6 8 6.4z"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M9.5 16c1.7 1.2 3.3 1.2 5 0"/>',
      plus:'<path d="M12 5v14M5 12h14"/>',play:'<path d="m8 5 11 7-11 7z"/>',pause:'<path d="M9 5v14M15 5v14"/>',
      search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',
      focus:'<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',bolt:'<path d="m13 2-8 12h7l-1 8 8-12h-7z"/>',stage:'<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.2.35.5.7.9.9.34.2.72.3 1.1.3h.1v4h-.1a1.7 1.7 0 0 0-2 1z"/>',
      'chevron-left':'<path d="m15 18-6-6 6-6"/>','chevron-right':'<path d="m9 18 6-6-6-6"/>'
    };
    function cinematicIcon(name){return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${cinematicIcons[name]||cinematicIcons.spark}</svg>`;}
    function installCinematicIcons(){
      $$('[data-ui-icon]').forEach(el=>{el.innerHTML=cinematicIcon(el.dataset.uiIcon);});
      const railMap={dashboard:'home',explorer:'spark',vault:'layers',room:'home',themeLab:'spark'};
      $$('.rail-button[data-view]').forEach(button=>{const slot=button.querySelector('.ri');if(slot)slot.innerHTML=cinematicIcon(railMap[button.dataset.view]||'spark');});
      const direct={settingsButton:'settings',focusShortcut:'focus',soundToggle:'music',environmentButton:'layers',worldToggle:'stage',undoButton:'chevron-left',redoButton:'chevron-right',dockMusic:'music',dockFocus:'focus',dockPerf:'bolt',dockSettings:'settings'};
      Object.entries(direct).forEach(([id,icon])=>{const el=$('#'+id);if(el)el.innerHTML=cinematicIcon(icon);});
    }

    const cinematicWorld={canvas:null,ctx:null,w:0,h:0,dpr:1,raf:0,timer:0,last:0,time:0,dirty:true,observer:null,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
    function cinematicGradient(ctx,x0,y0,x1,y1,stops){const g=ctx.createLinearGradient(x0,y0,x1,y1);stops.forEach(([p,c])=>g.addColorStop(p,c));return g;}
    function cinematicCloud(ctx,x,y,s,a=.8){ctx.save();ctx.globalAlpha=a;ctx.fillStyle='rgba(255,255,255,.92)';ctx.shadowColor='rgba(55,160,210,.18)';ctx.shadowBlur=18*s;[[0,8,28],[24,0,22],[48,8,31],[77,13,22]].forEach(([dx,dy,r])=>{ctx.beginPath();ctx.arc(x+dx*s,y+dy*s,r*s,0,Math.PI*2);ctx.fill();});ctx.restore();}
    function cinematicBubble(ctx,x,y,r,a=.55){ctx.save();const g=ctx.createRadialGradient(x-r*.3,y-r*.35,r*.08,x,y,r);g.addColorStop(0,'rgba(255,255,255,.96)');g.addColorStop(.18,'rgba(219,255,255,.28)');g.addColorStop(.72,'rgba(96,220,255,.08)');g.addColorStop(1,'rgba(137,244,255,.22)');ctx.fillStyle=g;ctx.strokeStyle=`rgba(220,255,255,${a})`;ctx.lineWidth=Math.max(1,r*.035);ctx.shadowColor='rgba(86,215,255,.35)';ctx.shadowBlur=r*.35;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
    function cinematicTree(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(52,104,76,.82)';ctx.fillRect(-4*s,0,8*s,52*s);const colors=['#0a765a','#12936a','#31b879','#5edb88'];for(let i=0;i<17;i++){const ang=i*2.399,rad=(10+(i%5)*6)*s,cx=Math.cos(ang)*rad,cy=-15*s+Math.sin(ang)*rad*.65;ctx.fillStyle=colors[i%colors.length];ctx.beginPath();ctx.arc(cx,cy,(11+(i%3)*3)*s,0,Math.PI*2);ctx.fill();}ctx.restore();}
    function drawAeroGlassChair(ctx,x,y,s){
      ctx.save();ctx.translate(x,y);ctx.strokeStyle='rgba(226,253,255,.72)';ctx.lineWidth=2*s;ctx.shadowColor='rgba(63,192,225,.3)';ctx.shadowBlur=18*s;const g=ctx.createRadialGradient(0,-8*s,4*s,0,0,42*s);g.addColorStop(0,'rgba(255,255,255,.42)');g.addColorStop(.55,'rgba(116,221,240,.12)');g.addColorStop(1,'rgba(217,252,255,.34)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,40*s,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(61,142,181,.6)';ctx.beginPath();ctx.ellipse(0,11*s,27*s,18*s,-.15,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(210,249,255,.65)';ctx.beginPath();ctx.ellipse(-8*s,3*s,17*s,10*s,-.2,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    function drawAeroTable(ctx,x,y,s){
      ctx.save();ctx.translate(x,y);ctx.shadowColor='rgba(0,43,70,.28)';ctx.shadowBlur=18*s;const g=ctx.createRadialGradient(-12*s,-8*s,3*s,0,0,50*s);g.addColorStop(0,'rgba(255,255,255,.62)');g.addColorStop(.5,'rgba(125,226,239,.22)');g.addColorStop(1,'rgba(35,132,169,.32)');ctx.fillStyle=g;ctx.strokeStyle='rgba(225,252,255,.55)';ctx.lineWidth=2*s;ctx.beginPath();ctx.ellipse(0,0,52*s,26*s,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(206,246,255,.28)';ctx.beginPath();ctx.ellipse(0,12*s,43*s,14*s,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(10,91,126,.65)';ctx.fillRect(-5*s,20*s,10*s,34*s);ctx.fillStyle='rgba(223,251,255,.36)';ctx.beginPath();ctx.ellipse(0,53*s,26*s,6*s,0,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    function drawCinematicFrutiger(ctx,w,h,t){
      const hour=currentTimeHour??12,night=hour<6||hour>=20,dusk=(hour>=17&&hour<20)||(hour>=5&&hour<7),q=resolvedVisualQuality==='ultra'?1:resolvedVisualQuality==='balanced'?.76:.52;
      const sky=cinematicGradient(ctx,0,0,0,h,night?[[0,'#04152f'],[.42,'#143f68'],[.72,'#24717a'],[1,'#063c55']]:dusk?[[0,'#2f71b0'],[.33,'#f69e9e'],[.58,'#8edfd8'],[1,'#0d6982']]:[[0,'#0b8fd9'],[.3,'#49c7f2'],[.57,'#b9f4ed'],[.78,'#4ec6b6'],[1,'#0c6c82']]);ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
      // Volumetric sunlight and aerial perspective.
      let glow=ctx.createRadialGradient(w*.65,h*.13,0,w*.65,h*.13,h*.38);glow.addColorStop(0,night?'rgba(175,213,255,.46)':'rgba(255,251,213,.7)');glow.addColorStop(.22,night?'rgba(120,174,255,.16)':'rgba(255,240,162,.22)');glow.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h*.62);
      const sunX=w*.67,sunY=h*.16,sunR=Math.min(w,h)*.048;ctx.save();ctx.shadowColor=night?'rgba(168,207,255,.68)':'rgba(255,242,132,.9)';ctx.shadowBlur=sunR*2.1;ctx.fillStyle=night?'#dbeaff':'#fff5b0';ctx.beginPath();ctx.arc(sunX,sunY,sunR,0,Math.PI*2);ctx.fill();ctx.restore();
      const cloudShift=cinematicWorld.reduced?0:(t*.004%(w+300));cinematicCloud(ctx,w*.1+cloudShift*.08,h*.14,.9,.9);cinematicCloud(ctx,w*.43-cloudShift*.05,h*.085,.62,.8);cinematicCloud(ctx,w*.79+cloudShift*.04,h*.2,.46,.68);
      // Far mountain basin.
      ctx.fillStyle='rgba(30,132,103,.45)';ctx.beginPath();ctx.moveTo(0,h*.59);ctx.bezierCurveTo(w*.08,h*.43,w*.17,h*.55,w*.27,h*.48);ctx.bezierCurveTo(w*.42,h*.35,w*.55,h*.57,w*.69,h*.45);ctx.bezierCurveTo(w*.83,h*.33,w*.93,h*.5,w,h*.42);ctx.lineTo(w,h*.78);ctx.lineTo(0,h*.78);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(3,91,72,.72)';ctx.beginPath();ctx.moveTo(0,h*.66);ctx.bezierCurveTo(w*.11,h*.49,w*.23,h*.67,w*.36,h*.55);ctx.bezierCurveTo(w*.5,h*.44,w*.64,h*.68,w*.79,h*.55);ctx.bezierCurveTo(w*.9,h*.45,w*.96,h*.55,w,h*.5);ctx.lineTo(w,h*.82);ctx.lineTo(0,h*.82);ctx.closePath();ctx.fill();
      // Glass city skyline.
      for(let i=0;i<24;i++){const x=w*(.22+i*.024),bh=h*(.09+(i%7)*.016),base=h*.57,tw=w*(.009+(i%4)*.0025);const tg=cinematicGradient(ctx,x,base-bh,x+tw,base,[[0,'rgba(238,253,255,.95)'],[.43,'rgba(118,210,233,.78)'],[1,'rgba(11,91,137,.88)']]);ctx.fillStyle=tg;ctx.strokeStyle='rgba(235,255,255,.42)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,base-bh,tw,bh,tw*.36);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.24)';ctx.fillRect(x+tw*.16,base-bh+4,tw*.16,bh-8);for(let j=1;j<6;j++){ctx.strokeStyle='rgba(231,255,255,.2)';ctx.beginPath();ctx.moveTo(x+tw*.12,base-bh*j/6);ctx.lineTo(x+tw*.88,base-bh*j/6);ctx.stroke();}}
      // Tall landmark towers.
      for(const [x,bh,tw] of [[.53,.29,.028],[.57,.34,.032],[.62,.26,.024]]){const gx=ctx.createLinearGradient(w*x,0,w*(x+tw),0);gx.addColorStop(0,'rgba(243,255,255,.96)');gx.addColorStop(.25,'rgba(120,219,244,.74)');gx.addColorStop(.65,'rgba(20,114,170,.88)');gx.addColorStop(1,'rgba(223,252,255,.78)');ctx.fillStyle=gx;ctx.strokeStyle='rgba(243,255,255,.62)';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(w*x,h*(.57-bh),w*tw,h*bh,w*.008);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.28)';ctx.fillRect(w*(x+.004),h*(.57-bh+.012),w*.004,h*(bh-.025));}
      // Left ecological cliff and waterfall.
      ctx.fillStyle=cinematicGradient(ctx,0,h*.28,w*.2,h*.79,[[0,'#4ab46d'],[.52,'#0e7a5f'],[1,'#07524d']]);ctx.beginPath();ctx.moveTo(0,h*.26);ctx.bezierCurveTo(w*.05,h*.23,w*.1,h*.36,w*.16,h*.31);ctx.bezierCurveTo(w*.2,h*.39,w*.17,h*.56,w*.22,h*.76);ctx.lineTo(0,h*.82);ctx.closePath();ctx.fill();
      const fall=ctx.createLinearGradient(w*.055,0,w*.145,0);fall.addColorStop(0,'rgba(255,255,255,.45)');fall.addColorStop(.35,'rgba(214,252,255,.98)');fall.addColorStop(.68,'rgba(76,194,230,.72)');fall.addColorStop(1,'rgba(43,172,211,.08)');ctx.fillStyle=fall;ctx.beginPath();ctx.moveTo(w*.06,h*.2);ctx.bezierCurveTo(w*.1,h*.29,w*.07,h*.5,w*.1,h*.76);ctx.lineTo(w*.155,h*.76);ctx.bezierCurveTo(w*.12,h*.5,w*.17,h*.29,w*.13,h*.2);ctx.closePath();ctx.fill();
      ctx.save();ctx.globalAlpha=.45;ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1;for(let i=0;i<12;i++){const x=w*(.08+i*.005);ctx.beginPath();ctx.moveTo(x,h*.25);ctx.bezierCurveTo(x+w*.008,h*.4,x-w*.006,h*.59,x+w*.004,h*.74);ctx.stroke();}ctx.restore();
      // Reflective water/floor plane.
      ctx.fillStyle=cinematicGradient(ctx,0,h*.65,0,h,[[0,'rgba(184,246,250,.58)'],[.24,'rgba(87,194,218,.57)'],[.62,'rgba(19,121,157,.62)'],[1,'rgba(2,63,92,.9)']]);ctx.fillRect(0,h*.65,w,h*.35);
      ctx.save();ctx.globalAlpha=.48;ctx.strokeStyle='rgba(224,255,255,.78)';ctx.lineWidth=1;for(let i=0;i<24;i++){const yy=h*(.67+i*.014);ctx.beginPath();ctx.moveTo(w*(.03+(i%4)*.03),yy);ctx.bezierCurveTo(w*.32,yy-3,w*.62,yy+4,w*(.97-(i%5)*.025),yy);ctx.stroke();}ctx.restore();
      // Premium atrium shell and roof ribs.
      ctx.save();ctx.strokeStyle='rgba(239,253,255,.88)';ctx.lineCap='round';ctx.shadowColor='rgba(8,88,126,.26)';ctx.shadowBlur=32;ctx.lineWidth=Math.max(16,w*.014);ctx.beginPath();ctx.moveTo(w*.07,h*.07);ctx.bezierCurveTo(w*.28,h*.015,w*.38,h*.13,w*.54,h*.12);ctx.bezierCurveTo(w*.72,h*.11,w*.84,h*.02,w*.96,h*.075);ctx.stroke();ctx.lineWidth=Math.max(8,w*.006);ctx.strokeStyle='rgba(208,246,255,.55)';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(w*(.16+i*.18),h*.035);ctx.bezierCurveTo(w*(.26+i*.13),h*.08,w*(.34+i*.12),h*.15,w*(.45+i*.1),h*.14);ctx.stroke();}ctx.lineWidth=Math.max(15,w*.012);ctx.strokeStyle='rgba(240,254,255,.84)';ctx.beginPath();ctx.moveTo(w*.96,h*.075);ctx.bezierCurveTo(w*.91,h*.27,w*.95,h*.48,w*.9,h*.72);ctx.stroke();ctx.restore();
      // Blimp.
      ctx.save();ctx.translate(w*.31,h*.18);ctx.fillStyle='rgba(241,253,255,.95)';ctx.strokeStyle='rgba(80,168,210,.68)';ctx.lineWidth=2;ctx.shadowColor='rgba(0,69,108,.22)';ctx.shadowBlur=18;ctx.beginPath();ctx.ellipse(0,0,w*.052,h*.025,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(53,141,194,.88)';ctx.font=`700 ${Math.max(8,w*.0085)}px sans-serif`;ctx.fillText('AERO',-w*.016,3);ctx.fillStyle='rgba(232,252,255,.9)';ctx.beginPath();ctx.moveTo(-w*.032,h*.018);ctx.lineTo(-w*.045,h*.03);ctx.lineTo(-w*.022,h*.026);ctx.closePath();ctx.fill();ctx.restore();
      // Hanging chair and foreground furniture.
      ctx.save();ctx.strokeStyle='rgba(224,252,255,.68)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.8,0);ctx.lineTo(w*.8,h*.31);ctx.stroke();ctx.restore();drawAeroGlassChair(ctx,w*.8,h*.39,Math.max(.7,w/1500));drawAeroTable(ctx,w*.67,h*.77,Math.max(.65,w/1600));
      // Orb on table and magazines.
      cinematicBubble(ctx,w*.69,h*.72,18*q+10,.58);ctx.save();ctx.translate(w*.62,h*.755);ctx.rotate(-.08);ctx.fillStyle='rgba(17,74,117,.78)';ctx.fillRect(-26,-7,52,14);ctx.fillStyle='rgba(226,248,255,.8)';ctx.fillRect(-20,-5,38,3);ctx.translate(20,3);ctx.rotate(.16);ctx.fillStyle='rgba(38,113,150,.8)';ctx.fillRect(-24,-7,48,13);ctx.restore();
      // Trees and foreground plant mass.
      cinematicTree(ctx,w*.012,h*.48,1.22);cinematicTree(ctx,w*.93,h*.45,1.3);cinematicTree(ctx,w*.885,h*.55,.75);ctx.fillStyle='rgba(10,93,69,.82)';ctx.beginPath();ctx.ellipse(w*.96,h*.86,w*.09,h*.14,-.5,0,Math.PI*2);ctx.fill();
      // Bubbles and birds.
      for(let i=0;i<(resolvedVisualQuality==='ultra'?14:8);i++){const phase=i*1.7,x=w*(.14+(i*.073)% .72)+Math.sin(t*.00022+phase)*18,y=h*(.17+(i*.093)% .5)-((t*.009+i*31)%(h*.09));cinematicBubble(ctx,x,y,6+(i%5)*4,.3+(i%3)*.12);}
      ctx.save();ctx.strokeStyle='rgba(244,255,255,.78)';ctx.lineWidth=1.4;for(let i=0;i<6;i++){const x=w*(.39+i*.018),y=h*(.18+Math.sin(i)*.012);ctx.beginPath();ctx.arc(x,y,6,Math.PI*1.1,Math.PI*1.85);ctx.arc(x+11,y,6,Math.PI*1.15,Math.PI*1.9);ctx.stroke();}ctx.restore();
      if(currentWeather==='rain'){ctx.save();ctx.strokeStyle='rgba(210,249,255,.38)';ctx.lineWidth=1;for(let i=0;i<145;i++){const x=(i*97+t*.18)%w,y=(i*57+t*.34)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+18);ctx.stroke();}ctx.restore();}
      if(currentWeather==='fog'){const fg=ctx.createLinearGradient(0,h*.25,0,h*.82);fg.addColorStop(0,'rgba(230,252,255,.04)');fg.addColorStop(.5,'rgba(230,252,255,.24)');fg.addColorStop(1,'rgba(230,252,255,.08)');ctx.fillStyle=fg;ctx.fillRect(0,h*.24,w,h*.6);}
      // Fine cinematic vignette and floor specular.
      const vg=ctx.createRadialGradient(w*.5,h*.43,h*.12,w*.5,h*.43,w*.72);vg.addColorStop(0,'rgba(255,255,255,0)');vg.addColorStop(.75,'rgba(0,29,53,.02)');vg.addColorStop(1,'rgba(0,13,31,.22)');ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);ctx.fillStyle=cinematicGradient(ctx,0,h*.65,w,h,[[0,'rgba(255,255,255,.08)'],[.42,'rgba(255,255,255,.2)'],[1,'rgba(255,255,255,0)']]);ctx.fillRect(0,h*.65,w,h*.35);
    }
    function drawCinematicVaporwave(ctx,w,h,t){ctx.fillStyle=cinematicGradient(ctx,0,0,0,h,[[0,'#17043f'],[.48,'#6a1c7b'],[.56,'#ff72bd'],[1,'#070c2c']]);ctx.fillRect(0,0,w,h);const sx=w*.63,sy=h*.34,sr=h*.16;ctx.fillStyle='#ff91d7';ctx.beginPath();ctx.arc(sx,sy,sr,Math.PI,0);ctx.fill();ctx.strokeStyle='rgba(255,205,244,.75)';for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(sx-sr,sy-sr*.12+i*sr*.19);ctx.lineTo(sx+sr,sy-sr*.12+i*sr*.19);ctx.stroke();}ctx.save();ctx.translate(0,h*.55);ctx.strokeStyle='rgba(84,235,255,.55)';ctx.lineWidth=1;for(let i=0;i<20;i++){const yy=(i*i)*h*.0018;ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(w,yy);ctx.stroke();}for(let i=-12;i<=12;i++){ctx.beginPath();ctx.moveTo(w*.5,h*.45);ctx.lineTo(w*.5+i*w*.08,0);ctx.stroke();}ctx.restore();for(let i=0;i<5;i++){ctx.fillStyle='rgba(230,220,255,.62)';ctx.fillRect(w*(.08+i*.19),h*.26,w*.025,h*.43);ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(w*(.083+i*.19),h*.26,w*.006,h*.43);}}
    function drawCinematicPomo(ctx,w,h,t){ctx.fillStyle='#2a3156';ctx.fillRect(0,0,w,h);ctx.fillStyle='#ff718f';ctx.beginPath();ctx.arc(w*.17,h*.25,h*.18,0,Math.PI*2);ctx.fill();ctx.fillStyle='#4edfc1';ctx.beginPath();ctx.roundRect(w*.58,h*.14,w*.31,h*.33,34);ctx.fill();ctx.fillStyle='#ffd044';ctx.beginPath();ctx.moveTo(w*.28,h*.74);ctx.lineTo(w*.48,h*.34);ctx.lineTo(w*.62,h*.78);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=4;for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(w*.7,h*.73,16+i*9,Math.PI*.2,Math.PI*1.35);ctx.stroke();}}
    function drawCinematicBackrooms(ctx,w,h,t){ctx.fillStyle='#b9ad67';ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(99,91,47,.48)';ctx.lineWidth=2;for(let x=0;x<w;x+=65){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(w*.5+(x-w*.5)*.35,h);ctx.stroke();}for(let y=0;y<h;y+=52){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}ctx.fillStyle='#6f6844';ctx.fillRect(w*.4,h*.35,w*.2,h*.5);ctx.fillStyle='rgba(255,251,208,.95)';ctx.shadowColor='#fff3a0';ctx.shadowBlur=24;ctx.fillRect(w*.18,h*.08,w*.28,10);ctx.fillRect(w*.58,h*.16,w*.24,10);ctx.shadowBlur=0;ctx.fillStyle='rgba(69,62,36,.34)';ctx.beginPath();ctx.moveTo(0,h*.7);ctx.lineTo(w*.5,h*.52);ctx.lineTo(w,h*.7);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();}
    function drawCinematicDiner(ctx,w,h,t){ctx.fillStyle='#10182d';ctx.fillRect(0,0,w,h);ctx.fillStyle='#22113b';ctx.fillRect(0,h*.5,w,h*.5);ctx.strokeStyle='#dcefff';ctx.lineWidth=8;ctx.beginPath();ctx.roundRect(w*.08,h*.08,w*.84,h*.43,24);ctx.stroke();const g=cinematicGradient(ctx,0,h*.08,0,h*.51,[[0,'#091a3d'],[.65,'#361a4b'],[.72,'#ff4d88'],[1,'#0e1530']]);ctx.fillStyle=g;ctx.fillRect(w*.09,h*.09,w*.82,h*.41);ctx.fillStyle='#ff4c7f';ctx.beginPath();ctx.roundRect(w*.08,h*.58,w*.84,h*.25,34);ctx.fill();ctx.fillStyle='#dbe9ef';ctx.beginPath();ctx.ellipse(w*.5,h*.72,w*.16,h*.045,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font=`700 ${Math.max(18,w*.025)}px sans-serif`;ctx.shadowColor='#ff337e';ctx.shadowBlur=20;ctx.fillText('OPEN 24/7',w*.18,h*.22);ctx.shadowBlur=0;}
    function drawCinematicMemphis(ctx,w,h,t){ctx.fillStyle='#f7e8ca';ctx.fillRect(0,0,w,h);ctx.fillStyle='#ff748d';ctx.beginPath();ctx.ellipse(w*.16,h*.26,w*.24,h*.14,.25,0,Math.PI*2);ctx.fill();ctx.fillStyle='#64dcc8';ctx.beginPath();ctx.ellipse(w*.8,h*.72,w*.28,h*.18,-.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fffdf2';ctx.beginPath();ctx.moveTo(w*.38,h*.18);ctx.lineTo(w*.62,h*.18);ctx.lineTo(w*.57,h*.82);ctx.lineTo(w*.43,h*.82);ctx.closePath();ctx.fill();ctx.strokeStyle='#55cfc3';ctx.lineWidth=14;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(w*.39,h*(.34+i*.13));ctx.lineTo(w*.61,h*(.26+i*.13));ctx.stroke();ctx.strokeStyle=i%2?'#55cfc3':'#6f3c89';}ctx.fillStyle='#282743';for(let i=0;i<12;i++){ctx.beginPath();ctx.arc(w*(.08+(i%6)*.05),h*(.72+Math.floor(i/6)*.07),6,0,Math.PI*2);ctx.fill();}}
    function drawCinematicWorld(now=performance.now()){
      const c=cinematicWorld.canvas;if(!c||!c.isConnected)return;const rect=c.getBoundingClientRect();if(rect.width<2||rect.height<2)return;const quality=resolvedVisualQuality==='ultra'?1.5:resolvedVisualQuality==='balanced'?1.25:1,dpr=Math.min(devicePixelRatio||1,quality);const rw=Math.max(1,Math.round(rect.width*dpr)),rh=Math.max(1,Math.round(rect.height*dpr));if(c.width!==rw||c.height!==rh){c.width=rw;c.height=rh;cinematicWorld.dirty=true;}const ctx=c.getContext('2d',{alpha:false});ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);const renderers={frutiger:drawCinematicFrutiger,vaporwave:drawCinematicVaporwave,pomo:drawCinematicPomo,backrooms:drawCinematicBackrooms,diner:drawCinematicDiner,memphis:drawCinematicMemphis};(renderers[currentTheme]||drawCinematicFrutiger)(ctx,rect.width,rect.height,now);cinematicWorld.time=now;cinematicWorld.dirty=false;
    }
    function cinematicWorldLoop(now){cinematicWorld.raf=0;if(document.hidden||window.__ffRuntimeGovernor?.isSuspended())return;const live=['living','stage'].includes(currentMode)&&worldLayout==='unified'&&currentWorldState!=='off'&&currentMode!=='performance';const fps=cinematicWorld.reduced||resolvedVisualQuality==='eco'?0:resolvedVisualQuality==='ultra'?30:20;if(cinematicWorld.dirty||!cinematicWorld.last||!fps||now-cinematicWorld.last>=1000/fps){drawCinematicWorld(now);cinematicWorld.last=now;}if(live&&fps){const delay=Math.max(0,1000/fps-18);cinematicWorld.timer=setTimeout(()=>{cinematicWorld.timer=0;if(!window.__ffRuntimeGovernor?.isSuspended()&&!document.hidden)cinematicWorld.raf=requestAnimationFrame(cinematicWorldLoop);},delay);}}
    function scheduleCinematicWorld(){cinematicWorld.dirty=true;if(window.__ffRuntimeGovernor?.isSuspended()||document.hidden)return;if(!cinematicWorld.raf&&!cinematicWorld.timer)cinematicWorld.raf=requestAnimationFrame(cinematicWorldLoop);}
    function initCinematicWorld(){cinematicWorld.canvas=$('#cinematicWorldCanvas');if(!cinematicWorld.canvas)return;cinematicWorld.observer=new ResizeObserver(scheduleCinematicWorld);cinematicWorld.observer.observe($('#fullWorldBackground'));document.addEventListener('visibilitychange',scheduleCinematicWorld);scheduleCinematicWorld();}
    function syncCinematicDashboard(){
      document.body.dataset.view=currentView;
      $('#commandRoomName')&&( $('#commandRoomName').textContent=themes[currentTheme]?.districts?.[0]||$('#districtSelect')?.selectedOptions?.[0]?.textContent||'Current room');
      $('#commandWeatherName')&&( $('#commandWeatherName').textContent=$('#weatherLabel')?.textContent||'Current weather');
      $$('[data-home-theme]').forEach(card=>card.classList.toggle('active',card.dataset.homeTheme===currentTheme));
    }
    function bindCinematicDashboard(){
      installCinematicIcons();
      $$('[data-home-theme]').forEach(card=>card.addEventListener('click',()=>setTheme(card.dataset.homeTheme,true)));
      $('#commandWeather')?.addEventListener('click',()=>$('#weatherSelect')?.focus());
      $('#commandSoundtrack')?.addEventListener('click',()=>$('#musicQuick')?.click());
      $('#openMascotRegistryHome')?.addEventListener('click',()=>openVaultTab('mascots'));
      $('#customizeDashboard')?.addEventListener('click',()=>$('#settingsButton')?.click());
      syncCinematicDashboard();
    }
    function normalizeCinematicMascotClutter(){
      const autos=mascotStates().filter(s=>s.themeLinked&&!s.userAdded&&s.el?.isConnected);autos.slice(1).forEach(s=>{mascotInstances.delete(s.id);objectState.delete(s.id);s.el.remove();});
      const companion=autos[0],layer=$('#leftObjects');
      if(companion&&layer){companion.x=Math.max(8,layer.clientWidth*.38);companion.y=Math.max(90,layer.clientHeight*.70);companion.vx=0;companion.vy=0;companion.gravity=false;updateObjectTransform(companion);}
      $$('.mascot-speech-bubble').forEach(x=>x.remove());updateMascotCount();
    }
    const v21SetViewCinematic=setView;setView=function(id){const out=v21SetViewCinematic(id);document.body.dataset.view=id;scheduleCinematicWorld();return out;};
    const v21SetThemeCinematic=setTheme;setTheme=function(id,notify=false){const out=v21SetThemeCinematic(id,notify);syncCinematicDashboard();scheduleCinematicWorld();return out;};
    const v21SetWeatherCinematic=setWeather;setWeather=function(id,notify=true){const out=v21SetWeatherCinematic(id,notify);syncCinematicDashboard();scheduleCinematicWorld();return out;};
    const v21ApplyTimeHourCinematic=applyTimeHour;applyTimeHour=function(hour,options={}){const out=v21ApplyTimeHourCinematic(hour,options);scheduleCinematicWorld();return out;};
    const v21WorldLayoutCinematic=setWorldLayout;setWorldLayout=function(mode,notify=true){const out=v21WorldLayoutCinematic(mode,notify);scheduleCinematicWorld();return out;};
    const v21VisualQualityCinematic=applyVisualQuality;applyVisualQuality=function(save=true){const out=v21VisualQualityCinematic(save);scheduleCinematicWorld();return out;};
    const v21ModeCinematic=setMode;setMode=function(mode,notify=true){const out=v21ModeCinematic(mode,notify);scheduleCinematicWorld();return out;};

    /* V24: measured-adaptive Runtime Governor. One lifecycle owner, bounded work, reversible suspension. */
    let clockTimer=0;
    function startClockLoop(){if(clockTimer||window.__ffRuntimeGovernor?.isSuspended()||document.hidden)return;updateClock();clockTimer=setInterval(()=>{if(!window.__ffRuntimeGovernor?.isSuspended()&&!document.hidden)updateClock();},30000);}
    function stopClockLoop(){if(clockTimer)clearInterval(clockTimer);clockTimer=0;}

    const runtimeGovernor={
      adaptiveTier:null,hardwareSeed:'balanced',lifecycle:'booting',reason:'boot',qualityRaf:0,qualityTimer:0,lastFrameAt:0,lastSampleAt:0,lastDecisionAt:0,lastUiAt:0,frameMs:16.7,fps:60,slowMs:0,fastMs:0,cooldownUntil:0,lastAdaptReason:'Hardware seed pending measured frame pacing',longFrames:[],loafObserver:null,physicsSnapshot:new Map(),audioWasRunning:false,videoWasPlaying:false,initialized:false,
      tierOrder:['eco','balanced','ultra'],
      isSuspended(){return this.lifecycle==='suspended';},
      shouldSuspend(){return document.hidden||currentMode==='focus'||currentMode==='performance'||currentWorldState==='off';},
      computeHardwareSeed(){const cores=navigator.hardwareConcurrency||4,memory=navigator.deviceMemory||4,dpr=devicePixelRatio||1;if(cores>=8&&memory>=8&&dpr<=2.5)return'ultra';if(cores>=4&&memory>=4)return'balanced';return'eco';},
      resetAdaptive(reason='Measured Adaptive reset'){this.hardwareSeed=this.computeHardwareSeed();this.adaptiveTier=this.hardwareSeed;this.slowMs=0;this.fastMs=0;this.cooldownUntil=0;this.lastAdaptReason=`${reason} · seed ${this.hardwareSeed}`;if(this.initialized&&visualQualityPrefs.mode==='adaptive')applyVisualQuality(false);this.updateDiagnostics();return this.adaptiveTier;},
      decideAdaptiveTransition({tier=this.adaptiveTier||'balanced',frameMs=this.frameMs,longFrameRate=this.longFrameRate(),slowMs=this.slowMs,fastMs=this.fastMs,cooldown=false}={}){const i=this.tierOrder.indexOf(tier);if(cooldown)return{tier,reason:'Hysteresis cooldown'};if((frameMs>=28||longFrameRate>=.18)&&slowMs>=1200&&i>0)return{tier:this.tierOrder[i-1],reason:`Sustained pressure ${frameMs.toFixed(1)} ms${longFrameRate?` · long frames ${Math.round(longFrameRate*100)}%`:''}`};if(frameMs>=21.5&&slowMs>=2400&&i>0)return{tier:this.tierOrder[i-1],reason:`Frame budget pressure ${frameMs.toFixed(1)} ms`};if(frameMs<=15.2&&longFrameRate<.03&&fastMs>=9000&&i<this.tierOrder.length-1)return{tier:this.tierOrder[i+1],reason:`Sustained headroom ${frameMs.toFixed(1)} ms`};return{tier,reason:'Holding tier inside hysteresis band'};},
      longFrameRate(now=performance.now()){this.longFrames=this.longFrames.filter(x=>now-x.t<10000);return Math.min(1,this.longFrames.length/20);},
      observeLongFrames(){if(this.loafObserver||this.isSuspended()||document.hidden||!('PerformanceObserver'in window))return;try{const supported=PerformanceObserver.supportedEntryTypes||[];if(!supported.includes('long-animation-frame'))return;this.loafObserver=new PerformanceObserver(list=>{const now=performance.now();for(const e of list.getEntries())this.longFrames.push({t:Number.isFinite(e.startTime)?e.startTime:now,d:e.duration||0});this.longFrames=this.longFrames.filter(x=>now-x.t<10000);});this.loafObserver.observe({type:'long-animation-frame',buffered:false});}catch{this.loafObserver=null;}},
      stopLongFrameObserver(){this.loafObserver?.disconnect?.();this.loafObserver=null;},
      noteFrame(delta,now){if(!(delta>0&&delta<250))return;const elapsed=this.lastSampleAt?Math.min(500,Math.max(16,now-this.lastSampleAt)):200;this.lastSampleAt=now;this.frameMs=this.frameMs*.82+delta*.18;this.fps=1000/Math.max(1,this.frameMs);const slow=this.frameMs>=21.5||this.longFrameRate(now)>=.18,fast=this.frameMs<=15.2&&this.longFrameRate(now)<.03;if(slow){this.slowMs+=elapsed;this.fastMs=0;}else if(fast){this.fastMs+=elapsed;this.slowMs=Math.max(0,this.slowMs-elapsed*.5);}else{this.slowMs=Math.max(0,this.slowMs-elapsed);this.fastMs=Math.max(0,this.fastMs-elapsed);}
        if(visualQualityPrefs.mode==='adaptive'&&now-this.lastDecisionAt>=250){const d=this.decideAdaptiveTransition({cooldown:now<this.cooldownUntil});this.lastDecisionAt=now;if(d.tier!==this.adaptiveTier){this.adaptiveTier=d.tier;this.cooldownUntil=now+5000;this.slowMs=0;this.fastMs=0;this.lastAdaptReason=d.reason;applyVisualQuality(false);}else if(d.reason!=='Hysteresis cooldown'&&now>=this.cooldownUntil)this.lastAdaptReason=d.reason;}
        if(now-this.lastUiAt>=1000){this.lastUiAt=now;this.updateDiagnostics();}
      },
      startMonitor(){if(this.qualityRaf||this.qualityTimer||this.isSuspended()||document.hidden)return;const schedule=()=>{if(this.isSuspended()||document.hidden)return;this.qualityTimer=setTimeout(()=>{this.qualityTimer=0;if(this.isSuspended()||document.hidden)return;this.qualityRaf=requestAnimationFrame(t0=>{this.qualityRaf=requestAnimationFrame(t1=>{this.qualityRaf=0;if(this.isSuspended()||document.hidden)return;this.noteFrame(t1-t0,t1);schedule();});});},220);};schedule();},
      stopMonitor(){if(this.qualityRaf)cancelAnimationFrame(this.qualityRaf);if(this.qualityTimer)clearTimeout(this.qualityTimer);this.qualityRaf=0;this.qualityTimer=0;this.lastFrameAt=0;this.lastSampleAt=0;},
      suspendPhysics(){this.physicsSnapshot.clear();for(const s of objectState.values()){ensureTransformState(s);if(s.physicsRaf||s.moving){this.physicsSnapshot.set(s.id,{vx:s.vx,vy:s.vy,moving:!!s.moving,motionRotation:s.motionRotation,dragTilt:s.dragTilt});if(s.physicsRaf)cancelAnimationFrame(s.physicsRaf);s.physicsRaf=0;s.physicsEpoch=(s.physicsEpoch||0)+1;s.moving=false;}}mascotState.moving=false;},
      resumePhysics(){const saved=[...this.physicsSnapshot.entries()];this.physicsSnapshot.clear();for(const[id,p]of saved){const s=objectState.get(id);if(!s?.el?.isConnected)continue;s.vx=p.vx;s.vy=p.vy;s.motionRotation=p.motionRotation;s.dragTilt=p.dragTilt;if(p.moving&&s.gravity&&s.scope!=='sticker'&&objectCanInteract(s))startObjectPhysics(s);}},
      suspend(reason='policy'){if(this.lifecycle==='suspended'){this.reason=reason;this.updateDiagnostics();return;}this.lifecycle='suspended';this.reason=reason;document.body.dataset.runtimeLifecycle='suspended';this.stopMonitor();this.stopLongFrameObserver();stopClockLoop();stopAmbient();stopEnvironmentRenderer();stopObjectHudTracking();if(cinematicWorld.raf)cancelAnimationFrame(cinematicWorld.raf);if(cinematicWorld.timer)clearTimeout(cinematicWorld.timer);cinematicWorld.raf=0;cinematicWorld.timer=0;if(specularFrame)cancelAnimationFrame(specularFrame);specularFrame=0;stopMascotBehaviorLoop();this.suspendPhysics();for(const s of mascotStates()){clearTimeout(s.mascotActionTimer);clearTimeout(s.mascotSpeechTimer);clearMascotAction(s);}const legacy=$('#mascot');legacy?.classList.remove('dance');
        if(audioContext?.state==='running'){this.audioWasRunning=true;audioContext.suspend?.().catch?.(()=>{});}const video=$('#wallpaperVideo');if(video&&!video.paused){this.videoWasPlaying=true;video.pause();}this.updateDiagnostics();},
      resume(reason='policy'){if(this.shouldSuspend()){this.suspend(reason);return;}const wasSuspended=this.lifecycle==='suspended';this.lifecycle='active';this.reason=reason;document.body.dataset.runtimeLifecycle='active';startClockLoop();startAmbient();startEnvironmentRenderer();scheduleCinematicWorld();if(selectedObject)startObjectHudTracking();mascotBehaviorLoop();this.observeLongFrames();if(wasSuspended)this.resumePhysics();if(this.audioWasRunning&&musicPlaying){audioContext?.resume?.().catch?.(()=>{});this.audioWasRunning=false;}const video=$('#wallpaperVideo');if(this.videoWasPlaying&&video){video.play?.().catch?.(()=>{});this.videoWasPlaying=false;}this.startMonitor();this.updateDiagnostics();},
      applyPolicy(reason='state'){this.shouldSuspend()?this.suspend(reason):this.resume(reason);},
      activeOwners(){const available=!this.isSuspended()&&!document.hidden,physics=[...objectState.values()].filter(s=>s.physicsRaf).length,ambient=available&&['living','stage'].includes(currentMode)&&currentWorldState!=='off',environment=available,cinematic=available&&['living','stage'].includes(currentMode)&&worldLayout==='unified'&&currentWorldState!=='off'&&!cinematicWorld.reduced&&resolvedVisualQuality!=='eco';return{clock:!!clockTimer,ambient,environment,cinematic,selectionHud:!!objectHudRaf,mascotAutonomy:!!mascotBehaviorTimer,physics,qualityMonitor:available,longFrameObserver:!!this.loafObserver};},
      updateDiagnostics(){const owners=this.activeOwners(),active=Object.entries(owners).filter(([,v])=>typeof v==='number'?v>0:v).map(([k,v])=>typeof v==='number'&&v>1?`${k}×${v}`:k);const frame=$('#runtimeFrameMetric'),loops=$('#runtimeLoopState'),detail=$('#runtimeLoopDetail'),why=$('#runtimeAdaptiveReason');if(frame)frame.textContent=this.isSuspended()?'Frame monitor suspended':`${this.frameMs.toFixed(1)} ms · ${Math.round(this.fps)} FPS`;if(loops)loops.textContent=this.isSuspended()?`Suspended · ${this.reason}`:`${active.length} governed owners active`;if(detail)detail.textContent=this.isSuspended()?'Rendering, physics, mascot autonomy and hidden animation owners released.':active.join(' · ')||'Event-driven UI only';if(why)why.textContent=visualQualityPrefs.mode==='adaptive'?this.lastAdaptReason:`Pinned ${visualQualityPrefs.mode} · adaptation locked`;if($('#fpsMetric'))$('#fpsMetric').textContent=this.isSuspended()?'0 world':`${Math.round(this.fps)}`;},
      getDiagnostics(){return{lifecycle:this.lifecycle,reason:this.reason,adaptiveTier:this.adaptiveTier,hardwareSeed:this.hardwareSeed,frameMs:Number(this.frameMs.toFixed(2)),fps:Number(this.fps.toFixed(1)),longFrameRate:Number(this.longFrameRate().toFixed(3)),longFrameCount:this.longFrames.length,slowMs:Math.round(this.slowMs),fastMs:Math.round(this.fastMs),cooldownMs:Math.max(0,Math.round(this.cooldownUntil-performance.now())),owners:this.activeOwners(),physicsSnapshots:this.physicsSnapshot.size,lastAdaptReason:this.lastAdaptReason};}
    };
    window.__ffRuntimeGovernor=runtimeGovernor;

    const v24SetMode=setMode;setMode=function(mode,notify=true){const out=v24SetMode(mode,notify);runtimeGovernor.applyPolicy(`mode:${mode}`);return out;};
    const v24SetWorldState=setWorldState;setWorldState=function(state,notify=true){const out=v24SetWorldState(state,notify);runtimeGovernor.applyPolicy(`world:${state}`);return out;};
    const v24SetWorldLayout=setWorldLayout;setWorldLayout=function(mode,notify=true){const out=v24SetWorldLayout(mode,notify);runtimeGovernor.updateDiagnostics();return out;};

    function initRuntimeGovernor(){if(runtimeGovernor.initialized)return;runtimeGovernor.initialized=true;runtimeGovernor.resetAdaptive('Hardware seed established');runtimeGovernor.observeLongFrames();document.addEventListener('visibilitychange',()=>runtimeGovernor.applyPolicy(document.hidden?'document:hidden':'document:visible'));window.addEventListener('pagehide',()=>runtimeGovernor.suspend('pagehide'));window.addEventListener('pageshow',()=>runtimeGovernor.applyPolicy('pageshow'));runtimeGovernor.applyPolicy('initial');}

    const v24BaseRunSelfTest=runSelfTest;
    runSelfTest=function(){
      v24BaseRunSelfTest();
      const results=window.__ffPrototypeTest||{},beforeMode=currentMode,beforeWorld=currentWorldState,beforeCount=objectState.size;
      try{
        results.runtimeGovernorPresent=window.__ffRuntimeGovernor===runtimeGovernor&&typeof runtimeGovernor.getDiagnostics==='function';
        const down=runtimeGovernor.decideAdaptiveTransition({tier:'ultra',frameMs:31,longFrameRate:.2,slowMs:1500,fastMs:0,cooldown:false});
        const up=runtimeGovernor.decideAdaptiveTransition({tier:'eco',frameMs:13.5,longFrameRate:0,slowMs:0,fastMs:10000,cooldown:false});
        const hold=runtimeGovernor.decideAdaptiveTransition({tier:'balanced',frameMs:16.7,longFrameRate:0,slowMs:0,fastMs:4000,cooldown:true});
        results.measuredAdaptiveHysteresis=down.tier==='balanced'&&up.tier==='balanced'&&hold.tier==='balanced';
        results.accessibilityIndependentQuality=!String(resolveVisualQuality.toString()).includes("prefers-reduced-motion");
        setMode('performance',false);
        const perf=runtimeGovernor.getDiagnostics();
        results.performanceReleasesHeavyOwners=perf.lifecycle==='suspended'&&!perf.owners.clock&&!perf.owners.ambient&&!perf.owners.environment&&!perf.owners.cinematic&&!perf.owners.selectionHud&&!perf.owners.mascotAutonomy&&perf.owners.physics===0&&!perf.owners.qualityMonitor&&!perf.owners.longFrameObserver;
        results.performancePreservesObjects=objectState.size===beforeCount;
        setMode('living',false);setWorldState('interactive',false);
        const live=runtimeGovernor.getDiagnostics();
        results.runtimeResumeRestoresOwners=live.lifecycle==='active'&&!!live.owners.clock&&!!live.owners.qualityMonitor&&!!live.owners.mascotAutonomy&&objectState.size===beforeCount;
        results.eventDrivenSelectionHud=typeof stopObjectHudTracking==='function'&&typeof startObjectHudTracking==='function';
        results.environmentRendererReleases=typeof stopEnvironmentRenderer==='function';
      }catch(e){results.v24RuntimeError=String(e);}finally{setWorldState(beforeWorld,false);setMode(beforeMode,false);runtimeGovernor.applyPolicy('self-test restored');}
      const pass=!results.v24RuntimeError&&Object.values(results).every(v=>v===true);$('#selfTest').textContent=pass?'PASS':'FAIL';document.body.dataset.selftest=pass?'pass':'fail';window.__ffPrototypeTest=results;
    };

    function init(){fillSelects();loadUiPrefs();initVisualQuality();initCinematicWorld();bindActorContextMenuSurface();let savedWorldLayout='unified';try{savedWorldLayout=normalizeWorldLayout(localStorage.getItem('ff-world-layout'))}catch{}setWorldLayout(savedWorldLayout,false);buildSpectrum('spectrum');buildSpectrum('footerSpectrum');populateInitialActivity();bindUI();initMascotSystem();bindPremiumRanges();updateWidths(18,18);setTheme('frutiger');if(environmentConfig.themeSync)environmentConfig.preset=environmentThemePreset();setView('dashboard');restoreScrapbookState();restoreWorldMascotState();normalizeCinematicMascotClutter();loadRoomSemanticState();refreshWeatherSelect();setWeather(currentWeather,false);updateClock();setTimePreset('auto',false);startClockLoop();startAmbient();bindCinematicDashboard();scheduleCinematicWorld();initRuntimeGovernor();setTimeout(runSelfTest,650);setTimeout(initHistory,1050);window.ffPrototype={buildVersion:'24.0.0',themes,assets,getState:()=>({currentTheme,currentMode,currentView,currentWorldState,uiPrefs:{...uiPrefs},placementPrefs:{...placementPrefs},objectScopes:[...objectState.values()].map(s=>s.scope),objectThemes:[...objectState.values()].filter(s=>s.scope==='world').map(s=>s.asset.theme),mascots:mascotStates().map(s=>({id:s.id,name:s.asset.name,scope:s.scope,side:s.side,themeLinked:s.themeLinked,x:s.x,y:s.y,scaleX:s.scaleX,scaleY:s.scaleY,rotation:s.rotation})),mascotPrefs:{...mascotPrefs},visualQuality:{mode:visualQualityPrefs.mode,resolved:resolvedVisualQuality,particles:particles.length,specularTransform:$('#uiSpecularLight')?.style.transform||''},floatingVaultOpen:$('#floatingVault').classList.contains('open'),worldLayout}),setTheme,setMode,applyUiPrefs,toggleCleanView,applyChromePreset,toggleChromeCompact,setShelfMode,openFloatingVault,spawnUiObject,pinObjectToTarget,peelSticker,playMediaObject,setWeather,setTimePreset,setSelectedObject,setSelectedRotation,setSelectedScale,settleObjectOrientation,rescueSelected,resetSelectedTransform,undoHistory,redoHistory,recordHistory,renderLayers,openVaultTab,applyEnvironmentConfig,environmentConfig,roomSemanticState,scanRoomPipeline,renderRoomIntelligence,testRoomAffordance,extractRoomObjectToAtlas,placeRoomAssetOnTable,setWorldLayout,setLauncherVisibility,moveLauncherItem,setLauncherPreset,applyLauncherPreferences,mascotCatalog,mascotInstances,setMascotPref,applyMascotPrefs,setVisualQuality,applyVisualQuality,scheduleCinematicWorld,drawCinematicWorld,addThemeMascot,dismissAllMascots,openMascotRegistry:()=>openVaultTab('mascots'),playMascotAction,mascotSpeech,updatePremiumRange,refreshPremiumRanges,bindPremiumRanges,openActorContextMenu,closeActorContextMenu,executeActorContextAction,moveActorToWorld,positionActorContextMenu,actorContextMenuState,positionObjectSelectionHud,cancelObjectPhysics,startObjectPhysics,objectScreenCenter,UI_COLLIDER_SELECTOR,toggleSelectedGravity,getObjectSnapshots:()=>[...objectState.values()].map(o=>({id:o.id,name:o.asset.name,scope:o.scope,gravity:o.gravity,gravityAfterPeel:o.gravityAfterPeel,moving:o.moving,vx:o.vx,vy:o.vy,x:o.x,y:o.y,physicsRaf:o.physicsRaf,peeling:o.peeling})),getSelectedSnapshot:()=>selectedObject?({id:selectedObject.id,name:selectedObject.asset?.name,scope:selectedObject.scope,isMascot:!!selectedObject.isMascot,gravity:selectedObject.gravity,gravityAfterPeel:selectedObject.gravityAfterPeel,moving:selectedObject.moving,vx:selectedObject.vx,vy:selectedObject.vy,x:selectedObject.x,y:selectedObject.y,scaleX:selectedObject.scaleX,scaleY:selectedObject.scaleY,rotation:selectedObject.rotation,physicsRaf:selectedObject.physicsRaf,peeling:selectedObject.peeling}):null};}
    init();
    if(window.ffPrototype)Object.assign(window.ffPrototype,{runtimeGovernor,getRuntimeDiagnostics:()=>runtimeGovernor.getDiagnostics(),forceRuntimePolicy:reason=>runtimeGovernor.applyPolicy(reason||'api'),evaluateAdaptiveTier:metrics=>runtimeGovernor.decideAdaptiveTransition(metrics)});
  })();
  
