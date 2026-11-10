(()=>{
const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials=s=>String(s||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('')||'•';
const now=()=>Date.now();
const feed=$('chatFeed'),frame=$('frame'),viewport=$('viewport');
let messages=[],featured=null,event=null,eventQueue=[],conf={theme:'dark',chatVisible:true},status='Odpojeno',videoId='';
let feedHovered=false,renderedIds=new Set(),streamReady=false,paintedKey='';
let previewReady=false,selectedTheme='dark',themeDirty=false,visibleDirty=false;
const isFeatured=()=>featured&&now()<featured.expiresAt;
function setStatus(msg){status=msg;$('connectionStatus').classList.toggle('online',status==='Připojeno');$('connectionStatus').innerHTML='<span class="dot"></span> '+escape(status);$('connect').disabled=status==='Připojeno'||status==='Připojuji…';$('disconnect').disabled=status==='Odpojeno';}
async function action(name,extra={}){
 try{
  const response=await fetch('/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:name,...extra})});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Akce se nezdařila');
 }catch(error){alert(error.message)}
}
function storePrefs(){return action('save',{theme:selectedTheme,chatVisible:$('chatVisible').checked})}
function resize(){if(!viewport.clientWidth)return;const scale=viewport.clientWidth/1920;frame.style.transform='scale('+scale+')';viewport.style.height=Math.round(1080*scale)+'px'}
function syncFeaturedButtons(){
 const id=isFeatured()?featured.id:null;
 for(const row of feed.querySelectorAll('.message[data-message-id]')){
  const on=id===row.dataset.messageId;
  row.classList.toggle('on-air',on);
  const button=row.querySelector('[data-feature]');
  button.classList.toggle('primary',on);button.classList.toggle('subtle',!on);
  button.textContent=on?'V obraze':'Zvýraznit';
  button.title=on?'Kliknutím skrýt z obrazu':'Zvýraznit komentář';
  button.setAttribute('aria-pressed',String(on));
 }
}
function paintChat(force=false){
 const query=$('chatSearch').value.toLowerCase().trim();
 const display=messages.filter(m=>!query||(m.author+' '+m.text).toLowerCase().includes(query)).slice().reverse();
 $('chatCount').textContent=messages.length;
 const newcomers=display.filter(m=>!renderedIds.has(m.id)).length;
 if(feedHovered&&!force){
  $('chatStats').textContent=newcomers?newcomers+' nových · seznam pozastaven':'Seznam pozastaven pod myší';
  syncFeaturedButtons();return;
 }
 const scroll=feed.scrollTop;
 feed.innerHTML=display.length?display.map(m=>{
  const on=isFeatured()&&featured.id===m.id;
  return '<div class="message'+(on?' on-air':'')+'" data-message-id="'+escape(m.id)+'"><span class="avatar">'+escape(initials(m.author))+'</span><div class="msg-content"><div class="msg-author">'+escape(m.author)+' <span class="msg-meta">'+new Date(m.time).toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'})+'</span></div><div class="msg-body">'+escape(m.text)+'</div></div><div class="msg-actions"><button class="'+(on?'primary':'subtle')+'" data-feature="'+escape(m.id)+'" aria-pressed="'+on+'">'+(on?'V obraze':'Zvýraznit')+'</button></div></div>';
 }).join(''):'<div class="empty">Žádné komentáře.</div>';
 feed.scrollTop=scroll;renderedIds=new Set(display.map(m=>m.id));
 $('chatStats').textContent=display.length+' z '+messages.length+' zpráv';
 syncFeaturedButtons();
}
function paintFeatured(){
 const selected=isFeatured();
 $('featuredNow').className=selected?'featured-selected':'featured-empty';
 $('featuredNow').innerHTML=selected?'<strong>'+escape(featured.author)+'</strong><p>'+escape(featured.text)+'</p>':'Žádný komentář není zvýrazněný.';
 $('hideFeatured').disabled=!selected;
 $('featuredRemaining').textContent=selected?'Zbývá '+Math.max(0,Math.ceil((featured.expiresAt-now())/1000))+' s':'90 s od výběru';
}
function paintEvents(){
 $('eventCount').textContent=eventQueue.length;
 $('eventNow').innerHTML=event?'<span style="color:'+(event.eventType==='membership'?'#70d6c0':'#f0bf59')+'">'+(event.eventType==='membership'?'ČLENSTVÍ':'SUPER CHAT')+'</span> · '+escape(event.author)+(event.amount?' · '+escape(event.amount):''):'Žádná aktivní událost';
 $('eventRemaining').textContent=event?'Zbývá '+Math.max(0,Math.ceil((event.until-now())/1000))+' s':'';
 $('skipEvent').disabled=!event;
 const key=eventQueue.map(e=>e.id).join('|');
 if(key!==paintedKey){
  paintedKey=key;
  $('eventQueue').innerHTML=eventQueue.length?eventQueue.map((e,i)=>'<div class="queue-entry"><span>'+(i+1)+'. '+escape(e.author)+' · '+escape(e.eventType==='membership'?'Členství':e.amount||'Super Chat')+'</span><button data-remove="'+escape(e.id)+'" aria-label="Odebrat z fronty">×</button></div>').join(''):'<p class="muted">Fronta je prázdná.</p>';
 }
}
function accept(s){
 const oldIds=messages.map(m=>m.id).join('|');
 messages=Array.isArray(s.messages)?s.messages:[];
 featured=s.featured||null;event=s.event||null;eventQueue=s.eventQueue||[];
 conf=s.conf||conf;videoId=s.videoId||'';
 setStatus(s.status||'Odpojeno');
 if(!streamReady||!themeDirty){selectedTheme=conf.theme==='light'?'light':'dark';$('theme').value=selectedTheme}
 if(!streamReady||!visibleDirty)$('chatVisible').checked=conf.chatVisible!==false;
 if(!streamReady||!$('streamUrl').value)$('streamUrl').value=videoId?'https://www.youtube.com/watch?v='+videoId:'';
 if(oldIds!==messages.map(m=>m.id).join('|')||!streamReady)paintChat();
 else syncFeaturedButtons();
 paintFeatured();paintEvents();
 streamReady=true;themeDirty=false;visibleDirty=false;
}
$('connect').addEventListener('click',()=>action('connect',{url:$('streamUrl').value}));
$('disconnect').addEventListener('click',()=>action('stop'));
$('chatVisible').addEventListener('change',()=>{visibleDirty=true;storePrefs()});
$('chatSearch').addEventListener('input',()=>paintChat(true));
feed.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')feedHovered=true});
feed.addEventListener('pointerleave',()=>{feedHovered=false;paintChat()});
feed.addEventListener('click',e=>{
 const button=e.target.closest('[data-feature]');
 if(!button)return;
 action('highlight',{id:button.dataset.feature});
});
$('hideFeatured').addEventListener('click',()=>action('clear'));
$('skipEvent').addEventListener('click',()=>action('skipEvent'));
$('eventQueue').addEventListener('click',e=>{
 const button=e.target.closest('[data-remove]');if(button)action('removeEvent',{id:button.dataset.remove});
});
$('theme').addEventListener('change',()=>{selectedTheme=$('theme').value;themeDirty=true;storePrefs()});
$('background').addEventListener('change',()=>{viewport.className='viewport '+$('background').value});
$('copyObs').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(location.origin+'/overlay.html');$('copyObs').textContent='Zkopírováno';setTimeout(()=>$('copyObs').textContent='Kopírovat',1600)}
 catch{alert('Kopírování se nezdařilo.')}
});
const stream=new EventSource('/events');
stream.onmessage=e=>{try{accept(JSON.parse(e.data))}catch(err){console.error('Režie:',err)}};
stream.onerror=()=>{if(status!=='Odpojeno')setStatus('Spojení s lokálním serverem přerušeno')};
new ResizeObserver(resize).observe(viewport);
$('obsPreviewDetails').addEventListener('toggle',()=>{if($('obsPreviewDetails').open)requestAnimationFrame(resize)});
frame.addEventListener('load',resize);
setInterval(()=>{
 $('localClock').textContent=new Date().toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
 paintFeatured();paintEvents();
},500);
resize();

let lanOverlayAddress='';
async function findLanOverlay(){
 try{
  const response=await fetch('/network-info');
  if(!response.ok)throw Error('Síťové adresy nelze načíst');
  const data=await response.json();
  const urls=data.urls||[];
  lanOverlayAddress=urls.find(url=>/^http:\/\/192\.168\./.test(url))||
    urls.find(url=>/^http:\/\/10\./.test(url))||
    urls.find(url=>/^http:\/\/172\.(1[6-9]|2\d|3[01])\./.test(url))||urls[0]||'';
  $('lanObsUrl').textContent=lanOverlayAddress||'Není nalezena LAN IPv4 adresa';
  $('copyLanObs').disabled=!lanOverlayAddress;
  $('copyLanObs').title=urls.length>1?'Dostupné adresy: '+urls.join(' | '):'';
 }catch(error){$('lanObsUrl').textContent='LAN adresa nedostupná';console.error(error)}
}
$('copyLanObs').addEventListener('click',async()=>{
 if(!lanOverlayAddress)return;
 try{
  await navigator.clipboard.writeText(lanOverlayAddress);
  $('copyLanObs').textContent='Zkopírováno';
  setTimeout(()=>$('copyLanObs').textContent='Kopírovat LAN',1600);
 }catch{alert('Zkopíruj adresu ručně: '+lanOverlayAddress)}
});
findLanOverlay();

})();