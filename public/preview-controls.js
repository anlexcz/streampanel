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
 let ready=false;
 function scale(){
   const ratio=viewport.clientWidth/1920;
   frame.style.transform='scale('+ratio+')';
   viewport.style.height=Math.round(1080*ratio)+'px';
 }
 function state(){
   return {
     theme:$('overlayTheme').value,
     messages:$('chat').checked?messages:[],
     featured:$('featured').checked?{id:'featured:'+sequence,author:$('name').value||'Divák',text:$('message').value||'Ukázkový komentář'}:null,
     ticker:$('ticker').checked?{until:12345,text:'Sledujte Metrobus také na Instagramu @metrobuscz'}:null
   };
 }
 function update(){if(ready)frame.contentWindow.postMessage({type:'metrobus-preview',state:state()},location.origin);}
 frame.addEventListener('load',()=>{ready=true;update()});
 window.addEventListener('message',event=>{if(event.origin===location.origin && event.source===frame.contentWindow && event.data?.type==='metrobus-preview-ready'){ready=true;update()}});
 for(const id of ['chat','featured','ticker','overlayTheme'])$(id).addEventListener('change',update);
 for(const id of ['name','message'])$(id).addEventListener('input',()=>{sequence++;update()});
 $('add').addEventListener('click',()=>{sequence++;messages=[...messages,{id:String(sequence),author:$('name').value||'Divák',text:$('message').value||'Ukázkový komentář',type:'message'}].slice(-5);update()});
 $('long').addEventListener('click',()=>{$('message').value='Jak se bude měnit provoz v Praze s novým grafikonem a počítá se také s dalšími úpravami tramvajových linek? Zajímalo by mě, jestli to bude mít nějaký dopad na přestupy.';sequence++;update()});
 $('select').addEventListener('click',()=>{$('featured').checked=true;sequence++;update()});
 $('reset').addEventListener('click',()=>{messages=defaults();sequence++;$('featured').checked=true;$('ticker').checked=true;$('chat').checked=true;$('name').value='Divák Metrobusu';$('message').value='Co si myslíte o novém grafikonu?';update()});
 $('background').addEventListener('change',()=>{viewport.className='viewport '+$('background').value});
 new ResizeObserver(scale).observe(viewport);
 scale();
})();
