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

const CHAT_MAX_ITEMS=5;
const CHAT_MAX_AGE_MS=60000;
function makeChatLayer(el){
  let latest=[];
  const born=new Map();
  const cards=new Map();
  const discarded=new Set();
  let initialized=false;
  function refresh(){
    if(!el)return;
    const now=Date.now();
    const eligible=latest.filter(m=>{
      if(m.type==='superchat')return false;
      const id=String(m.id);
      const stamp=Date.parse(m.time||'');
      // Keep the authoritative reception time; allow the test lab to age a message.
      if(Number.isFinite(stamp)&&stamp<=now+120000){
        if(born.get(id)!==stamp)born.set(id,stamp);
      }else if(!born.has(id)){
        born.set(id,now);
      }
      return !discarded.has(id)&&now-born.get(id)<CHAT_MAX_AGE_MS;
    }).slice(-CHAT_MAX_ITEMS);
    const desired=new Set(eligible.map(m=>String(m.id)));
    const before=new Map();
    for(const [id,node] of cards)before.set(id,node.getBoundingClientRect());
    for(const [id,node] of cards){
      if(!desired.has(id)){
        const r=node.getBoundingClientRect(),host=el.getBoundingClientRect();
        if(initialized&&r.height>0){
          const ghost=node.cloneNode(true);
          ghost.classList.add('chat-ghost');
          ghost.style.cssText='position:absolute;top:'+(r.top-host.top)+'px;right:'+(host.right-r.right)+'px;width:'+r.width+'px;max-width:none;margin:0;pointer-events:none;';
          el.appendChild(ghost);
          ghost.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-10px)'}],{duration:240,easing:'ease-out'}).onfinish=()=>ghost.remove();
          setTimeout(()=>ghost.remove(),350);
        }
        node.remove();cards.delete(id);
      }
    }
    const added=[];
    for(const m of eligible){
      const id=String(m.id);
      let node=cards.get(id);
      if(!node){
        const t=document.createElement('template');
        t.innerHTML=card(m,'chat');
        node=t.content.firstElementChild;
        node.dataset.messageId=id;
        node.classList.add('chat-item');
        cards.set(id,node);
        added.push(node);
      }
      el.appendChild(node);
    }
    // Fit the newest messages within the allotted vertical height.
    // Oversized old cards are discarded rather than clipping the new message.
    const limit=Math.floor(window.innerHeight*0.42);
    const gap=8;
    function usedHeight(){
      return [...cards.values()].reduce((sum,node)=>sum+node.getBoundingClientRect().height,0)+Math.max(0,cards.size-1)*gap;
    }
    while(cards.size>1&&usedHeight()>limit){
      const [oldId,oldNode]=cards.entries().next().value;
      discarded.add(oldId);oldNode.remove();cards.delete(oldId);
    }
    for(const [id,node] of cards){
      if(added.includes(node)){
        if(initialized&& !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
          node.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],
            {duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
        }
      }else{
        const old=before.get(id),next=node.getBoundingClientRect();
        if(old&&Math.abs(old.top-next.top)>1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
          node.animate([{transform:'translateY('+(old.top-next.top)+'px)'},{transform:'translateY(0)'}],
            {duration:300,easing:'cubic-bezier(.2,.8,.2,1)'});
        }
      }
    }
    el.classList.toggle('visible',cards.size>0);
    // Prevent the lookup maps from accumulating an entire long livestream.
    const active=new Set(latest.map(m=>String(m.id)));
    for(const id of born.keys())if(!active.has(id))born.delete(id);
    for(const id of discarded)if(!active.has(id))discarded.delete(id);
    initialized=true;
  }
  setInterval(refresh,1000);
  return entries=>{latest=entries||[];refresh()};
}

let render;
if(mode==='unified'){
  const chat=makeChatLayer(document.querySelector('#chat-layer'));
  const featured=makeLayer(document.querySelector('#featured-layer'),'highlight');
  const ticker=makeLayer(document.querySelector('#ticker-layer'),'ticker');
  render=s=>{
    chat(s.messages||[]);
    featured(s.featured?[s.featured]:[]);
    const banner=s.tickerVisible||s.ticker;
    ticker(banner?[{id:String(banner.until),author:'METROBUS',text:banner.text}]:[]);
  };
}else{
  const kind=mode==='highlight'?'highlight':mode==='ticker'?'ticker':'chat';
  const layer=kind==='chat'?makeChatLayer(document.querySelector('#stage')):makeLayer(document.querySelector('#stage'),kind);
  render=s=>{
    const banner=s.tickerVisible||s.ticker;
    layer(kind==='highlight'?(s.featured?[s.featured]:[]):kind==='ticker'?(banner?[{id:String(banner.until),text:banner.text}]:[]):(s.messages||[]));
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