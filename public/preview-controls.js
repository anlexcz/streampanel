(() => {
 const $=id=>document.getElementById(id);
 const frame=$('frame'), viewport=$('viewport');
 let sequence=4;
 const defaults=()=>[
   {id:'1',author:'Petr Novák',text:'Zdravím studio!',type:'message'},
   {id:'2',author:'Andrea K.',text:'Super stream, díky!',type:'message'},
   {id:'3',author:'Martin',text:'Bude záznam dostupný?',type:'message'}
 ];
 let messages=defaults();
 const time=()=>new Date().toISOString();
 messages=messages.map(m=>({...m,time:time()}));
 let ready=false;
 let loopTimer=null;
 let generatedCount=0;
 let currentEvent=null;
 const EVENT_DURATION_MS=12000;
 const FEATURED_DURATION_MS=90000;
 let featuredSelection={id:'featured-default',author:'Divák Metrobusu',text:'Co si myslíte o novém grafikonu?',expiresAt:Date.now()+FEATURED_DURATION_MS};
 const sampleAuthors=['Petr Novák','Andrea K.','Martin','Lucie','Šotouš z Prahy','Tomáš','Klára','Honza','Metrobus divák'];
 const sampleTexts=[
   'Zdravím celé studio!',
   'Co říkáte na nový grafikon?',
   'Bude záznam dnešního streamu?',
   'Kdy vyjede další nová tramvaj?',
   'To je zajímavá informace.',
   'Díky za odpověď!',
   'Jak to bude s přestupy?',
   'A co změny na Smíchově?',
   'Půjde to i během výluk?',
   'Mám ještě jednu otázku ohledně jízdních řádů.',
   'Zdravím z druhého konce Prahy!',
   'Zajímá mě, jak se bude vyvíjet provoz v Praze po změnách grafikonu a zda se projeví také na návaznostech jednotlivých linek.'
 ];
 const sample=(arr)=>arr[Math.floor(Math.random()*arr.length)];
 function insertGenerated(){
   const batch=Number($('loopBatch').value)||1;
   for(let i=0;i<batch;i++){
     sequence++;generatedCount++;
     messages.push({id:'loop-'+sequence,author:sample(sampleAuthors),text:sample(sampleTexts),type:'message',time:time()});
   }
   messages=messages.slice(-200);
   update();
   $('loopStatus').textContent='Smyčka běží · vygenerováno '+generatedCount+' zpráv';
 }
 function stopLoop(){
   if(loopTimer!==null)clearInterval(loopTimer);
   loopTimer=null;
   $('loopStart').disabled=false;
   $('loopStop').disabled=true;
   $('loopStatus').textContent='Smyčka zastavená · vygenerováno '+generatedCount+' zpráv';
 }
 function startLoop(){
   stopLoop();
   $('chat').checked=true;
   $('loopStart').disabled=true;
   $('loopStop').disabled=false;
   insertGenerated();
   loopTimer=setInterval(insertGenerated,Number($('loopSpeed').value)||500);
 }

 function scale(){
   const ratio=viewport.clientWidth/1920;
   frame.style.transform='scale('+ratio+')';
   viewport.style.height=Math.round(1080*ratio)+'px';
 }
 function state(){
   return {
     theme:$('overlayTheme').value,
     messages:$('chat').checked?messages:[],
     featured:$('featured').checked&&featuredSelection&&Date.now()<featuredSelection.expiresAt?featuredSelection:null,
     ticker:$('ticker').checked?{until:12345,text:'Sledujte Metrobus také na Instagramu @metrobuscz'}:null,
     event:$('events').checked&&currentEvent&&Date.now()<currentEvent.until?currentEvent:null
   };
 }
 function update(){if(ready)frame.contentWindow.postMessage({type:'metrobus-preview',state:state()},location.origin);}
 frame.addEventListener('load',()=>{ready=true;update()});
 window.addEventListener('message',event=>{if(event.origin===location.origin && event.source===frame.contentWindow && event.data?.type==='metrobus-preview-ready'){ready=true;update()}});
 for(const id of ['chat','ticker','overlayTheme','events'])$(id).addEventListener('change',update);
 $('featured').addEventListener('change',()=>{
   if($('featured').checked){
     sequence++;
     featuredSelection={id:'featured:'+sequence,author:$('name').value||'Divák',text:$('message').value||'Ukázkový komentář',expiresAt:Date.now()+FEATURED_DURATION_MS};
   }else featuredSelection=null;
   update();
 });
 for(const id of ['name','message'])$(id).addEventListener('input',()=>{});
 $('add').addEventListener('click',()=>{sequence++;messages=[...messages,{id:String(sequence),author:$('name').value||'Divák',text:$('message').value||'Ukázkový komentář',type:'message',time:time()}].slice(-5);update()});
 $('long').addEventListener('click',()=>{$('message').value='Jak se bude měnit provoz v Praze s novým grafikonem a počítá se také s dalšími úpravami tramvajových linek? Zajímalo by mě, jestli to bude mít nějaký dopad na přestupy.';sequence++;update()});
 $('select').addEventListener('click',()=>{$('featured').checked=true;sequence++;featuredSelection={id:'featured:'+sequence,author:$('name').value||'Divák',text:$('message').value||'Ukázkový komentář',expiresAt:Date.now()+FEATURED_DURATION_MS};update()});
 $('reset').addEventListener('click',()=>{messages=defaults().map(m=>({...m,time:time()}));sequence++;$('featured').checked=true;$('ticker').checked=true;$('chat').checked=true;$('name').value='Divák Metrobusu';$('message').value='Co si myslíte o novém grafikonu?';featuredSelection={id:'featured:'+sequence,author:'Divák Metrobusu',text:'Co si myslíte o novém grafikonu?',expiresAt:Date.now()+FEATURED_DURATION_MS};update()});
 $('burst').addEventListener('click',()=>{
   for(let i=0;i<12;i++){sequence++;messages.push({id:String(sequence),author:'Divák '+sequence,text:i%4===0?'Delší komentář pro kontrolu zalamování: co si myslíte o změnách jízdních řádů a přestupech v Praze?':'Testovací komentář číslo '+(i+1),type:'message',time:time()})}
   messages=messages.slice(-200);update();
 });
 $('age').addEventListener('click',()=>{messages=messages.map(m=>({...m,time:new Date(Date.parse(m.time)-61000).toISOString()}));update()});
 $('eventType').addEventListener('change',()=>{$('eventAmount').disabled=$('eventType').value==='membership'});
 $('eventShow').addEventListener('click',()=>{
   sequence++;$('events').checked=true;
   currentEvent={id:'event:'+sequence,eventType:$('eventType').value,author:$('eventAuthor').value||'Divák',amount:$('eventType').value==='superchat'?$('eventAmount').value:'',text:$('eventText').value,until:Date.now()+EVENT_DURATION_MS};
   update();
 });
 $('eventHide').addEventListener('click',()=>{currentEvent=null;update()});
 $('loopStart').addEventListener('click',startLoop);
 $('loopStop').addEventListener('click',stopLoop);
 $('loopSpeed').addEventListener('input',()=>{
   const ms=Number($('loopSpeed').value);
   $('speedLabel').textContent=ms<1000?ms+' ms':(ms/1000).toLocaleString('cs-CZ')+' s';
   if(loopTimer!==null){clearInterval(loopTimer);loopTimer=setInterval(insertGenerated,ms)}
 });
 $('reset').addEventListener('click',()=>{stopLoop();generatedCount=0;$('loopStatus').textContent='Smyčka je zastavená.'});
 setInterval(()=>{
   if(currentEvent&&Date.now()>=currentEvent.until){currentEvent=null;update()}
   if(featuredSelection&&Date.now()>=featuredSelection.expiresAt){
     featuredSelection=null;
     $('featured').checked=false;
     update();
   }
 },500);
 addEventListener('pagehide',stopLoop);
 $('background').addEventListener('change',()=>{viewport.className='viewport '+$('background').value});
 new ResizeObserver(scale).observe(viewport);
 scale();
})();
