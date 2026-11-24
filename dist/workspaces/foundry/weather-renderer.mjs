// Adapted from MIT Feature Foundry prototype-v24.ts neutral cinematic rain/fog layers.
// Pure bounded Canvas2D drawing, separate from authoring, media and scene state.
export const WEATHER_MODES=Object.freeze(['clear','rain','fog']);
export function drawNeutralWeather(ctx,mode,time=0,width=640,height=240){
 if(!WEATHER_MODES.includes(mode)||!Number.isFinite(time)||time<0||!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||width>1280||height>720)throw Error('Invalid bounded weather frame');
 ctx.clearRect(0,0,width,height);
 if(mode==='rain'){ctx.save();ctx.strokeStyle='rgba(210,249,255,.38)';ctx.lineWidth=1;for(let i=0;i<145;i++){const x=(i*97+time*.18)%width,y=(i*57+time*.34)%height;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+18);ctx.stroke();}ctx.restore();}
 if(mode==='fog'){const gradient=ctx.createLinearGradient(0,height*.25,0,height*.82);gradient.addColorStop(0,'rgba(230,252,255,.04)');gradient.addColorStop(.5,'rgba(230,252,255,.24)');gradient.addColorStop(1,'rgba(230,252,255,.08)');ctx.fillStyle=gradient;ctx.fillRect(0,height*.24,width,height*.6);}
}
