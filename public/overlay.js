const mode=document.body.dataset.mode;
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials=name=>String(name||'').trim().split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('')||'•';
function avatar(m,cls){
  const src=typeof m.avatar==='string'&&/^https:\/\/(yt3\.ggpht\.com|yt3\.googleusercontent\.com|lh3\.googleusercontent\.com)\//.test(m.avatar)?m.avatar:'';
  return src?'<img class="'+cls+'" src="'+escapeHtml(src)+'" alt="">':'<span class="'+cls+'">'+escapeHtml(initials(m.author))+'</span>';
}
function card(m,kind){
  if(kind==='chat')return '<article class="stack-card">'+avatar(m,'stack-avatar')+'<div class="stack-content"><div class="stack-author">'+escapeHtml(m.author)+'</div><div class="stack-text">'+escapeHtml(m.text)+'</div></div></article>';
  if(kind==='highlight')return '<article class="featured-card"><div class="featured-band">VYBRANÝ KOMENTÁŘ</div><div class="featured-body"><div class="featured-side">'+avatar(m,'featured-avatar')+'</div><div class="featured-content"><div class="featured-author">'+escapeHtml(m.author)+'</div><div class="featured-text">'+escapeHtml(m.text)+'</div></div></div></article>';
  if(kind==='ticker')return '<article class="promo-banner"><div class="promo-banner__text">'+escapeHtml(m.text)+'</div></article>';
  return '';
}
function makeLayer(el,kind){
  let previous='',removal=null,epoch=0;
  return entries=>{
    if(!el)return;
    const sig=entries.map(m=>m.id+':'+m.text+':'+m.author).join('|');
    if(sig===previous)return;
    previous=sig;
    const current=++epoch;
    clearTimeout(removal);
    if(!entries.length){
      el.classList.remove('visible');
      removal=setTimeout(()=>{if(current===epoch)el.replaceChildren()},200);
      return;
    }
    el.innerHTML=entries.map(m=>card(m,kind)).join('');
    el.classList.remove('visible');
    requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('visible')));
  };
}
let render;
if(mode==='unified'){
  const chat=makeLayer(document.querySelector('#chat-layer'),'chat');
  const featured=makeLayer(document.querySelector('#featured-layer'),'highlight');
  const ticker=makeLayer(document.querySelector('#ticker-layer'),'ticker');
  render=s=>{
    chat((s.messages||[]).filter(m=>m.type!=='superchat').slice(-5));
    featured(s.featured?[s.featured]:[]);
    const banner=s.tickerVisible||s.ticker;
    ticker(banner?[{id:String(banner.until),author:'METROBUS',text:banner.text}]:[]);
  };
}else{
  const kind=mode==='highlight'?'highlight':mode==='ticker'?'ticker':'chat';
  const layer=makeLayer(document.querySelector('#stage'),kind);
  render=s=>{
    const banner=s.tickerVisible||s.ticker;
    layer(kind==='highlight'?(s.featured?[s.featured]:[]):kind==='ticker'?(banner?[{id:String(banner.until),text:banner.text}]:[]):(s.messages||[]).slice(-5));
  };
}
function update(s){
  document.body.dataset.theme=(s.theme||s.conf?.theme)==='light'?'light':'dark';
  render(s);
}
if(document.body.dataset.preview==='true'){
  addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='metrobus-preview')return;update(e.data.state)});
  parent.postMessage({type:'metrobus-preview-ready'},location.origin);
}else{
  new EventSource('/events').onmessage=e=>{try{update(JSON.parse(e.data))}catch(err){console.error('Overlay:',err)}};
}