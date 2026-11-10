const mode=document.body.dataset.mode;
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials=name=>String(name||'').trim().split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('')||'•';
function avatar(m,cls){
  const src=typeof m.avatar==='string'&&/^https:\/\/(yt3\.ggpht\.com|yt3\.googleusercontent\.com|lh3\.googleusercontent\.com)\//.test(m.avatar)?m.avatar:'';
  return src?'<img class="'+cls+'" src="'+escapeHtml(src)+'" alt="">':'<span class="'+cls+'">'+escapeHtml(initials(m.author))+'</span>';
}
function card(m,kind){
  if(kind==='chat')return '<article class="stack-card">'+avatar(m,'stack-avatar')+'<div class="stack-content"><div class="stack-author">'+escapeHtml(m.author)+'</div><div class="stack-text">'+escapeHtml(m.text)+'</div></div></article>';
  if(kind==='highlight')return '<article class="featured-card"><div class="featured-body"><div class="featured-side">'+avatar(m,'featured-avatar')+'</div><div class="featured-content"><div class="featured-author">'+escapeHtml(m.author)+'</div><div class="featured-text">'+escapeHtml(m.text)+'</div></div></div></article>';
  if(kind==='ticker')return '<article class="promo-banner"><div class="promo-banner__text">'+escapeHtml(m.text)+'</div></article>';
  if(kind==='event'){
    const amount=escapeHtml(m.amount||'');
    const label=m.eventType==='membership'?'NOVÉ ČLENSTVÍ':'SUPER CHAT';
    return '<article class="event-card event-card--'+(m.eventType==='membership'?'membership':'superchat')+'">'+
      '<div class="event-card__heading"><span class="event-card__label">'+label+'</span>'+
      (amount?'<span class="event-card__amount">'+amount+'</span>':'')+'</div>'+
      '<div class="event-card__author">'+avatar(m,'event-card__avatar')+'<strong>'+escapeHtml(m.author)+'</strong></div>'+
      (m.text?'<div class="event-card__text">'+escapeHtml(m.text)+'</div>':'')+
      '</article>';
  }
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
    if(removal)clearTimeout(removal);
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const outgoing=el.classList.contains('visible')&&el.firstElementChild;
    // On replacement: animate the old card out before bringing the next card in.
    // On hide: keep the old content alive for the duration of its exit animation.
    const draw=()=>{
      if(current!==epoch)return;
      el.replaceChildren();
      if(!entries.length)return;
      el.innerHTML=entries.map(m=>card(m,kind)).join('');
      el.classList.add('visible');
      if(!reduced)el.animate(
        [{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],
        {duration:300,easing:'cubic-bezier(.2,.8,.2,1)'}
      );
    };
    if(outgoing&&!reduced){
      const anim=el.animate(
        [{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-18px)'}],
        {duration:260,easing:'cubic-bezier(.2,.8,.2,1)'}
      );
      anim.onfinish=()=>{if(current===epoch){el.classList.remove('visible');draw()}};
      removal=setTimeout(()=>{if(current===epoch){anim.cancel();el.classList.remove('visible');draw()}},320);
    }else{
      el.classList.remove('visible');
      draw();
    }
  };
}
const CHAT_MAX_ITEMS=5;
const CHAT_MAX_AGE_MS=60000;
const CHAT_DISPLAY_INTERVAL_MS=1800;
const CHAT_QUEUE_LIMIT=80;

/* Message arrival only appends to the queue. The renderer runs at its own pace. */
function makeChatLayer(el){
  const pending=[];
  const known=new Set();
  const visible=[];
  const cards=new Map();
  let lastSnapshot=[];
  let initialized=false;

  const stamp=m=>{
    const t=Date.parse(m.time||'');
    return Number.isFinite(t)&&t<=Date.now()+120000?t:Date.now();
  };
  const fresh=m=>Date.now()-stamp(m)<CHAT_MAX_AGE_MS;

  function sync(entries){
    lastSnapshot=(entries||[]).filter(m=>m&&m.type!=='superchat');
    // Initial snapshot should not replay the last 200 messages on a new OBS load.
    const take=initialized?lastSnapshot:lastSnapshot.slice(-CHAT_MAX_ITEMS);
    initialized=true;
    for(const m of take){
      const id=String(m.id);
      if(known.has(id))continue;
      known.add(id);
      if(fresh(m))pending.push({...m,id});
    }
    while(pending.length>CHAT_QUEUE_LIMIT)pending.shift();
    // Limit the identity cache without allowing the same still-visible ID to reappear.
    if(known.size>1000){
      const retained=new Set(lastSnapshot.map(m=>String(m.id)));
      for(const m of pending)retained.add(m.id);
      for(const m of visible)retained.add(m.id);
      known.clear();for(const id of retained)known.add(id);
    }
  }

  function paint(){
    if(!el)return;
    const desired=new Set(visible.map(m=>m.id));
    const before=new Map();
    for(const [id,node] of cards)before.set(id,node.getBoundingClientRect());

    for(const [id,node] of cards){
      if(desired.has(id))continue;
      const r=node.getBoundingClientRect(),host=el.getBoundingClientRect();
      if(r.height){
        const ghost=node.cloneNode(true);
        ghost.classList.add('chat-ghost');
        ghost.style.cssText='position:absolute;top:'+(r.top-host.top)+'px;right:'+(host.right-r.right)+'px;width:'+r.width+'px;max-width:none;margin:0;pointer-events:none;';
        el.appendChild(ghost);
        const animation=ghost.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-18px)'}],{duration:260,easing:'ease-out'});
        animation.onfinish=()=>ghost.remove();
        setTimeout(()=>ghost.remove(),360);
      }
      node.remove();cards.delete(id);
    }

    const added=new Set();
    for(const m of visible){
      let node=cards.get(m.id);
      if(!node){
        const template=document.createElement('template');
        template.innerHTML=card(m,'chat');
        node=template.content.firstElementChild;
        node.dataset.messageId=m.id;
        node.classList.add('chat-item');
        cards.set(m.id,node);
        added.add(m.id);
      }
      el.appendChild(node);
    }

    const heightLimit=Math.floor(window.innerHeight*.42);
    const usedHeight=()=>[...cards.values()].reduce((s,node)=>s+node.getBoundingClientRect().height,0)+Math.max(0,cards.size-1)*8;
    while(visible.length>1&&usedHeight()>heightLimit){
      const removed=visible.shift();
      cards.get(removed.id)?.remove();
      cards.delete(removed.id);
    }

    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reduced)for(const [id,node] of cards){
      const previous=before.get(id),next=node.getBoundingClientRect();
      if(added.has(id)){
        node.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'cubic-bezier(.2,.8,.2,1)'});
      }else if(previous&&Math.abs(previous.top-next.top)>1){
        node.animate([{transform:'translateY('+(previous.top-next.top)+'px)'},{transform:'translateY(0)'}],{duration:300,easing:'cubic-bezier(.2,.8,.2,1)'});
      }
    }
    el.classList.toggle('visible',cards.size>0);
  }

  function tick(){
    // Expiration runs independently of chat traffic.
    const snapshotIds=new Set(lastSnapshot.map(m=>String(m.id)));
    const before=visible.length;
    for(let i=visible.length-1;i>=0;i--){
      const m=visible[i];
      if(!fresh(m)||!snapshotIds.has(m.id))visible.splice(i,1);
    }
    for(let i=pending.length-1;i>=0;i--){
      const m=pending[i];
      const current=lastSnapshot.find(x=>String(x.id)===m.id);
      if(!current||!fresh(current))pending.splice(i,1);
      else pending[i]={...current,id:m.id};
    }
    // One message at most per cycle, even if hundreds arrive between cycles.
    if(pending.length){
      const next=pending.shift();
      visible.push(next);
      while(visible.length>CHAT_MAX_ITEMS)visible.shift();
    }
    if(visible.length!==before||pending.length||before)paint();
  }
  function nextInterval(){
    if(pending.length>=16)return 800;
    if(pending.length>=6)return 1200;
    return CHAT_DISPLAY_INTERVAL_MS;
  }
  function scheduleTick(){
    setTimeout(()=>{tick();scheduleTick()},nextInterval());
  }
  scheduleTick();
  // Expire an idle chat without waiting for the next incoming message.
  setInterval(()=>{
    if(!visible.length&&!pending.length)return;
    const prev=visible.length;
    for(let i=visible.length-1;i>=0;i--)if(!fresh(visible[i]))visible.splice(i,1);
    if(prev!==visible.length)paint();
  },1000);
  return sync;
}
let render;
if(mode==='unified'){
  const chat=makeChatLayer(document.querySelector('#chat-layer'));
  const featured=makeLayer(document.querySelector('#featured-layer'),'highlight');
  const ticker=makeLayer(document.querySelector('#ticker-layer'),'ticker');
  const event=makeLayer(document.querySelector('#event-layer'),'event');
  render=s=>{
    chat(s.messages||[]);
    featured(s.featured?[s.featured]:[]);
    const banner=s.tickerVisible||s.ticker;
    ticker(banner?[{id:String(banner.until),author:'METROBUS',text:banner.text}]:[]);
    event(s.event?[s.event]:[]);
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