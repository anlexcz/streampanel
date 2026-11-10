const stage=document.querySelector('#stage');
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const legacyMode=document.body.dataset.mode;
let lastKey='',lastKind='';
function draw(s){
  let kind,items;
  if(legacyMode==='unified'){
    if(s.featured){kind='highlight';items=[s.featured]}
    else if(s.ticker){kind='ticker';items=[{id:String(s.ticker.until),author:'METROBUS',text:s.ticker.text}]}
    else {kind='chat';items=s.messages.slice(-5)}
  } else if(legacyMode==='highlight'){kind='highlight';items=s.featured?[s.featured]:[]}
  else if(legacyMode==='ticker'){kind='ticker';items=s.ticker?[{id:String(s.ticker.until),author:'METROBUS',text:s.ticker.text}]:[]}
  else {kind='chat';items=s.messages.slice(-5)}
  const key=kind+'|'+items.map(m=>m.id+':'+m.text).join('|');
  if(key===lastKey)return;
  lastKey=key;
  const html=items.map(x=>'<article><b>'+escapeHtml(x.author)+'</b><p>'+escapeHtml(x.text)+'</p></article>').join('');
  // A short exit transition ensures the three display modes never overlap.
  stage.classList.add('switching');
  const render=()=>{stage.dataset.kind=kind;stage.innerHTML=html;stage.classList.remove('switching')};
  if(lastKind&&lastKind!==kind){setTimeout(render,180)}else render();
  lastKind=kind;
}
new EventSource('/events').onmessage=e=>draw(JSON.parse(e.data));
