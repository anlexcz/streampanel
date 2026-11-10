const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mode=document.body.dataset.mode;
function card(item,kind){const author=kind==='ticker'?'METROBUS':item.author;return '<article class="message-card"><b>'+escapeHtml(author)+'</b><p>'+escapeHtml(item.text)+'</p></article>';}
function makeLayer(element,kind){let signature='',pending=null,generation=0;return items=>{const next=items.map(item=>String(item.id)+':'+String(item.text)).join('|');if(next===signature)return;signature=next;const token=++generation;if(pending)clearTimeout(pending);if(!items.length){element.classList.remove('visible');pending=setTimeout(()=>{if(generation===token)element.replaceChildren()},250);return;}element.dataset.kind=kind;element.innerHTML=items.map(item=>card(item,kind)).join('');element.classList.remove('visible');requestAnimationFrame(()=>requestAnimationFrame(()=>element.classList.add('visible')));};}
let render;
if(mode==='unified'){
 const chat=makeLayer(document.querySelector('#chat-layer'),'chat');
 const featured=makeLayer(document.querySelector('#featured-layer'),'highlight');
 const ticker=makeLayer(document.querySelector('#ticker-layer'),'ticker');
 const event=makeLayer(document.querySelector('#event-layer'),'event');
 render=state=>{chat(state.messages.filter(m=>m.type!=='superchat').slice(-5));featured(state.featured?[state.featured]:[]);ticker(state.ticker?[{id:String(state.ticker.until),text:state.ticker.text}]:[]);event([]);};
}else{
 const layer=makeLayer(document.querySelector('#stage'),mode);
 render=state=>layer(mode==='highlight'?(state.featured?[state.featured]:[]):mode==='ticker'?(state.ticker?[{id:String(state.ticker.until),text:state.ticker.text}]:[]):state.messages.slice(-5));
}
new EventSource('/events').onmessage=e=>{try{render(JSON.parse(e.data))}catch(error){console.error('Chyba overlaye',error)}};