const stage=document.querySelector('#stage'), status=document.querySelector('.mode');
const options=[...document.querySelectorAll('[data-frame]')];
for (const button of options) button.addEventListener('click',()=>{
  if(button.getAttribute('aria-pressed')==='true') return;
  for(const opt of options) opt.setAttribute('aria-pressed',String(opt===button));
  if(!button.dataset.frame){
    const hint=document.createElement('p');hint.textContent='Pick a family to try its real controls.';
    stage.replaceChildren(hint);status.textContent='Off. No renderer loaded.';return;
  }
  const frame=document.createElement('iframe');
  frame.title=button.textContent;frame.src=button.dataset.frame;
  stage.replaceChildren(frame);status.textContent=button.textContent+' selected.';
});
