(()=>{
const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials=s=>String(s||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('')||'•';
const now=()=>Date.now();
const frame=$('frame'),viewport=$('viewport');
let serial=10,connected=false,ready=false,autoTimer=null,chatEnabled=true,theme='dark';
let messages=[
 {id:'msg1',author:'Petr Novák',text:'Zdravím celé studio!',time:new Date().toISOString()},
 {id:'msg2',author:'Andrea K.',text:'Jak to bude s novým grafikonem?',time:new Date().toISOString()},
 {id:'msg3',author:'Martin',text:'Bude dnešní záznam dostupný?',time:new Date().toISOString()},
 {id:'msg4',author:'Šotouš z Prahy',text:'Co říkáte na nové tramvaje 52T?',time:new Date().toISOString()}
];
let featured=null,currentEvent=null,eventQueue=[],gapUntil=0;
const FEATURED_MS=90000,EVENT_MS=30000,EVENT_EXIT_MS=350,EVENT_GAP_MS=500;
function resize(){const scale=viewport.clientWidth/1920;frame.style.transform='scale('+scale+')';viewport.style.height=Math.round(1080*scale)+'px'}
function state(){return{theme,messages:chatEnabled?messages:[],featured:featured&&now()<featured.expiresAt?featured:null,event:currentEvent,ticker:null}}
function publish(){if(ready)frame.contentWindow.postMessage({type:'metrobus-preview',state:state()},location.origin)}
function status(){const s=$('connectionStatus');s.classList.toggle('online',connected);s.innerHTML='<span class="dot"></span> '+(connected?'Připojeno (simulace)':'Odpojeno');$('connect').disabled=connected;$('disconnect').disabled=!connected}
function paintChat(){
 const q=$('chatSearch').value.toLowerCase().trim(),questions=$('showOnlyQuestions').checked;
 const displayed=messages.filter(m=>(!q||(m.author+' '+m.text).toLowerCase().includes(q))&&(!questions||m.text.includes('?'))).slice().reverse();
 $('chatCount').textContent=messages.length;
 $('chatStats').textContent=displayed.length+' z '+messages.length+' zpráv';
 $('chatFeed').innerHTML=displayed.length?displayed.map(m=>{
 const on=featured?.id===m.id&&now()<featured.expiresAt;
 return '<div class="message'+(on?' on-air':'')+'"><span class="avatar">'+escape(initials(m.author))+'</span><div class="msg-content"><div class="msg-author">'+escape(m.author)+' <span class="msg-meta">'+new Date(m.time).toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'})+'</span></div><div class="msg-body">'+escape(m.text)+'</div></div><div class="msg-actions"><button class="'+(on?'primary':'subtle')+'" data-feature="'+escape(m.id)+'">'+(on?'V obraze':'Zvýraznit')+'</button></div></div>'
 }).join(''):'<div class="empty">Žádné komentáře neodpovídají filtru.</div>';
 for(const b of $('chatFeed').querySelectorAll('[data-feature]'))b.addEventListener('click',()=>setFeatured(messages.find(x=>x.id===b.dataset.feature)));
}
function paintFeatured(){
 const shown=featured&&now()<featured.expiresAt;
 $('featuredNow').className=shown?'featured-selected':'featured-empty';
 $('featuredNow').innerHTML=shown?'<strong>'+escape(featured.author)+'</strong><p>'+escape(featured.text)+'</p>':'Žádný komentář není zvýrazněný.';
 $('hideFeatured').disabled=!shown;
 $('featuredRemaining').textContent=shown?'Zbývá '+Math.ceil((featured.expiresAt-now())/1000)+' s':'90 s od výběru';
}
function setFeatured(m){featured=m?{...m,expiresAt:now()+FEATURED_MS}:null;paintChat();paintFeatured();publish()}
function addMessage(author,text){
 const m={id:'msg'+(++serial),author,text,time:new Date().toISOString()};
 messages.push(m);messages=messages.slice(-200);paintChat();publish();
}
function finishEvent(){if(currentEvent){currentEvent=null;gapUntil=now()+EVENT_EXIT_MS+EVENT_GAP_MS;publish()}}
function updateEvents(){
 if(currentEvent&&now()>=currentEvent.until)finishEvent();
 if(!currentEvent&&eventQueue.length&&now()>=gapUntil){currentEvent={...eventQueue.shift(),until:now()+EVENT_MS};publish()}
 const current=$('eventNow');current.innerHTML=currentEvent
  ?'<span style="color:'+(currentEvent.eventType==='membership'?'#70d6c0':'#f0bf59')+'">'+(currentEvent.eventType==='membership'?'ČLENSTVÍ':'SUPER CHAT')+'</span> · '+escape(currentEvent.author)+(currentEvent.amount?' · '+escape(currentEvent.amount):'')
  :'Žádná aktivní událost';
 $('eventRemaining').textContent=currentEvent?'Zbývá '+Math.ceil((currentEvent.until-now())/1000)+' s':'';
 $('skipEvent').disabled=!currentEvent;
 $('eventCount').textContent=eventQueue.length;
 $('eventQueue').innerHTML=eventQueue.length?eventQueue.map((e,i)=>'<div class="queue-entry"><span>'+(i+1)+'. '+escape(e.author)+' · '+(e.eventType==='membership'?'Členství':escape(e.amount||'Super Chat'))+'</span><button data-remove="'+i+'" aria-label="Odebrat událost">×</button></div>').join(''):'<p class="muted">Fronta je prázdná.</p>';
 for(const b of $('eventQueue').querySelectorAll('[data-remove]'))b.addEventListener('click',()=>{eventQueue.splice(Number(b.dataset.remove),1);updateEvents()});
}
function enqueueEvent(){
 eventQueue.push({id:'event'+(++serial),eventType:$('eventType').value,author:$('eventAuthor').value.trim()||'Divák',amount:$('eventType').value==='membership'?'':$('eventAmount').value.trim(),text:$('eventText').value.trim()});
 updateEvents();
}
function stopAuto(){if(autoTimer!==null)clearInterval(autoTimer);autoTimer=null;$('autoFeed').textContent='Spustit simulaci';$('simulationStatus').textContent='Simulace je zastavená.'}
const authors=['Lucie','Petr Novák','Tomáš','Klára','Honza','Andrea K.','Šotouš z Prahy'];
const texts=['Co přinese nový grafikon?','Zdravím studio!','Díky za vysvětlení.','A co modernizace tramvají?','Bude záznam streamu?','Jak to bude během výluk?','Zdravím z Prahy!'];
function sample(){return a=>a[Math.floor(Math.random()*a.length)]}
const pick=sample();
$('connect').addEventListener('click',()=>{connected=true;status()});
$('disconnect').addEventListener('click',()=>{connected=false;status()});
$('chatVisible').addEventListener('change',e=>{chatEnabled=e.target.checked;publish()});
$('chatSearch').addEventListener('input',paintChat);
$('showOnlyQuestions').addEventListener('change',paintChat);
$('clearChat').addEventListener('click',()=>{messages=[];setFeatured(null);paintChat();publish()});
$('demoMessage').addEventListener('click',()=>addMessage(pick(authors),pick(texts)));
$('hideFeatured').addEventListener('click',()=>setFeatured(null));
$('restoreFeatured').addEventListener('click',()=>setFeatured({id:'featured-demo-'+(++serial),author:'Divák Metrobusu',text:'Co si myslíte o novém grafikonu?'}));
$('eventType').addEventListener('change',()=>{$('eventAmount').disabled=$('eventType').value==='membership'});
$('queueEvent').addEventListener('click',enqueueEvent);
$('skipEvent').addEventListener('click',()=>{finishEvent();updateEvents()});
$('theme').addEventListener('change',e=>{theme=e.target.value;publish()});
$('background').addEventListener('change',e=>{viewport.className='viewport '+e.target.value});
$('flood').addEventListener('click',()=>{for(let i=0;i<10;i++)addMessage(pick(authors),pick(texts))});
$('autoFeed').addEventListener('click',()=>{if(autoTimer!==null){stopAuto();return}addMessage(pick(authors),pick(texts));autoTimer=setInterval(()=>addMessage(pick(authors),pick(texts)),4000);$('autoFeed').textContent='Zastavit simulaci';$('simulationStatus').textContent='Jedna zpráva každé 4 sekundy.'});
$('reset').addEventListener('click',()=>{stopAuto();messages=[];featured=null;currentEvent=null;eventQueue=[];gapUntil=0;chatEnabled=true;$('chatVisible').checked=true;$('chatSearch').value='';$('showOnlyQuestions').checked=false;paintChat();paintFeatured();updateEvents();publish()});
$('copyObs').addEventListener('click',async()=>{const value='http://localhost:4173/overlay.html';try{await navigator.clipboard.writeText(value);$('copyObs').textContent='Zkopírováno';setTimeout(()=>$('copyObs').textContent='Kopírovat',1800)}catch{$('copyObs').textContent='Nelze kopírovat'}});
frame.addEventListener('load',()=>{ready=true;publish()});
addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='metrobus-preview-ready'){ready=true;publish()}});
new ResizeObserver(resize).observe(viewport);resize();
setInterval(()=>{const t=new Date();$('localClock').textContent=t.toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit',second:'2-digit'});if(featured&&now()>=featured.expiresAt){featured=null;paintChat();publish()}paintFeatured();updateEvents()},500);
addEventListener('pagehide',stopAuto);
status();paintChat();paintFeatured();updateEvents();
})();