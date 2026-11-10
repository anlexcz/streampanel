'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {LiveChat}=require('youtube-chat');
const PORT=4173;
const ROOT=path.join(__dirname,'public');
const DATA=path.join(__dirname,'data');
fs.mkdirSync(DATA,{recursive:true});
const CONFIG_FILE=path.join(DATA,'config.json');
let conf={theme:'dark',chatVisible:true};
try{
  const saved=JSON.parse(fs.readFileSync(CONFIG_FILE,'utf8'));
  conf={...conf,theme:saved.theme==='light'?'light':'dark',chatVisible:saved.chatVisible!==false};
}catch{}
const FEATURED_MS=90000,EVENT_MS=30000,EVENT_EXIT_MS=350,EVENT_GAP_MS=500;
let messages=[],featured=null,currentEvent=null,eventQueue=[],eventGapUntil=0;
let chat=null,status='Odpojeno',videoId='',generation=0;
const clients=new Set(),seenIds=new Set();
function persist(){fs.writeFileSync(CONFIG_FILE,JSON.stringify(conf,null,2))}
function state(){return{messages,featured,event:currentEvent,eventQueue,status,videoId,conf}}
function emit(){
  const value='data: '+JSON.stringify(state())+'\n\n';
  for(const c of clients)try{c.write(value)}catch{clients.delete(c)}
}
function parseVideo(input){
  const s=String(input||'').trim();
  if(/^[\w-]{11}$/.test(s))return s;
  try{
    const u=new URL(s);
    if(!['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtu.be'].includes(u.hostname))return null;
    const id=u.hostname.endsWith('youtu.be')?u.pathname.split('/')[1]:u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:live|embed|shorts)\/([\w-]{11})/)?.[1];
    return /^[\w-]{11}$/.test(id||'')?id:null;
  }catch{return null}
}
function cleanAvatar(url){
 let value=String(url||'').trim();if(value.startsWith('//'))value='https:'+value;
 try{const u=new URL(value),h=u.hostname.toLowerCase();
  if(u.protocol!=='https:'||!(h==='yt3.ggpht.com'||h==='ggpht.com'||h.endsWith('.ggpht.com')||h==='googleusercontent.com'||h.endsWith('.googleusercontent.com')))return '';
  return value.slice(0,1000);
 }catch{return ''}
}
function clean(m){
  return{
    id:String(m.id||randomUUID()).slice(0,180),
    author:String(m.author||'Divák').replace(/^@+/,'').slice(0,100),
    text:String(m.text||'').slice(0,1500),
    avatar:cleanAvatar(m.avatar),
    time:new Date().toISOString(),
    type:m.type==='superchat'?'superchat':m.type==='membership'?'membership':'message',
    amount:String(m.amount||'').slice(0,40)
  };
}
function log(m){try{fs.appendFileSync(path.join(DATA,'chat.jsonl'),JSON.stringify({...m,videoId})+'\n')}catch(e){console.error('Zápis archivu:',e.message)}}
function enqueue(item){
  const event={id:item.id,eventType:item.type==='membership'?'membership':'superchat',author:item.author,text:item.text,avatar:item.avatar,amount:item.amount};
  eventQueue.push(event);
  if(eventQueue.length>150)eventQueue.shift();
  advanceEvents();
}
function add(input){
  const item=clean(input);
  if(seenIds.has(item.id))return;
  seenIds.add(item.id);
  if(seenIds.size>1000){seenIds.clear();for(const m of messages)seenIds.add(m.id)}
  messages.push(item);
  if(messages.length>200)messages.shift();
  log(item);
  if(item.type==='superchat'||item.type==='membership')enqueue(item);
  emit();
}
function advanceEvents(){
  const now=Date.now();
  if(currentEvent&&now>=currentEvent.until){
    currentEvent=null;
    eventGapUntil=now+EVENT_EXIT_MS+EVENT_GAP_MS;
    emit();
  }
  if(!currentEvent&&eventQueue.length&&now>=eventGapUntil){
    currentEvent={...eventQueue.shift(),until:now+EVENT_MS};
    emit();
  }
}
function stop(){
  generation++;
  if(chat)try{chat.stop()}catch{}
  chat=null;videoId='';featured=null;currentEvent=null;eventQueue=[];eventGapUntil=0;
  messages=[];seenIds.clear();status='Odpojeno';emit();
}
async function connect(link){
  const id=parseVideo(link);
  if(!id)throw Error('Zadejte platnou URL YouTube streamu nebo jeho ID.');
  stop();
  const active=generation;
  videoId=id;status='Připojuji…';emit();
  const instance=chat=new LiveChat({liveId:id});
  instance.on('start',()=>{
    if(active===generation){status='Připojeno';emit()}
  });
  instance.on('end',reason=>{
    if(active===generation){status='Chat skončil: '+String(reason||'');emit()}
  });
  instance.on('error',error=>{
    if(active===generation){status='Chyba: '+String(error?.message||error);emit()}
  });
  instance.on('chat',item=>{
    if(active!==generation)return;
    const text=(Array.isArray(item.message)?item.message:[]).map(part=>part.text||part.emojiText||'').join('');
    // Some versions mark all members with isMembership; do not turn their ordinary comments into join alerts.
    const membershipType=/^membership(?:-|$)/.test(String(item.type||''));
    const membershipJoin=membershipType||Boolean(item.isMembership&&!text&&!item.superchat);
    const type=item.superchat?'superchat':membershipJoin?'membership':'message';
    add({
      id:item.id,author:item.author?.name,text,
      avatar:item.author?.thumbnail?.url||item.author?.thumbnail?.[0]?.url||'',
      type,amount:item.superchat?.amount||''
    });
  });
  try{
    if(!await instance.start()&&active===generation){status='Chat nelze načíst';emit()}
  }catch(error){
    if(active===generation){status='Chyba: '+error.message;emit()}
  }
}
setInterval(()=>{
  if(featured&&Date.now()>=featured.expiresAt){featured=null;emit()}
  advanceEvents();
},250).unref();
function reply(res,statusCode,data,mime='application/json; charset=utf-8'){
  res.writeHead(statusCode,{'Content-Type':mime,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});
  res.end(mime.startsWith('application/json')?JSON.stringify(data):data);
}
http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&u.pathname==='/events'){
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
    res.write('data: '+JSON.stringify(state())+'\n\n');
    clients.add(res);req.on('close',()=>clients.delete(res));return;
  }
  if(req.method==='GET'&&u.pathname==='/export'){
    const csv=['time,author,text,type,amount',...messages.map(m=>[m.time,m.author,m.text,m.type,m.amount].map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(','))].join('\r\n');
    return reply(res,200,'\ufeff'+csv,'text/csv; charset=utf-8');
  }
  if(req.method==='POST'&&u.pathname==='/action'){
    let input='';
    for await(const chunk of req){
      input+=chunk;
      if(input.length>12000)return reply(res,413,{error:'Příliš velký požadavek'});
    }
    try{
      const data=JSON.parse(input||'{}');
      switch(data.action){
        case 'connect':await connect(data.url);break;
        case 'stop':stop();break;
        case 'highlight':{
          const selected=messages.find(m=>m.id===String(data.id));
          if(!selected)throw Error('Komentář už není v aktuální historii.');
          featured=featured?.id===selected.id?null:{...selected,expiresAt:Date.now()+FEATURED_MS};
          emit();break;
        }
        case 'clear':featured=null;emit();break;
        case 'skipEvent':
          if(currentEvent){
            currentEvent=null;eventGapUntil=Date.now()+EVENT_EXIT_MS+EVENT_GAP_MS;emit();
          }
          break;
        case 'removeEvent':{
          const before=eventQueue.length;
          eventQueue=eventQueue.filter(e=>e.id!==String(data.id));
          if(before!==eventQueue.length)emit();break;
        }
        case 'save':{
          conf.theme=data.theme==='light'?'light':'dark';
          if(typeof data.chatVisible==='boolean')conf.chatVisible=data.chatVisible;
          persist();emit();break;
        }
        default:throw Error('Neznámá akce');
      }
      return reply(res,200,{ok:true});
    }catch(error){return reply(res,400,{error:error.message})}
  }
  const requestPath=u.pathname==='/'?'/index.html':u.pathname;
  const file=path.resolve(ROOT,'.'+requestPath);
  if(!file.startsWith(ROOT+path.sep))return reply(res,403,{error:'Zakázáno'});
  const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'}[path.extname(file)];
  if(!mime)return reply(res,404,{error:'Nenalezeno'});
  try{
    res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    fs.createReadStream(file).on('error',()=>res.end()).pipe(res);
  }catch{return reply(res,404,{error:'Nenalezeno'})}
}).listen(PORT,'127.0.0.1',()=>console.log('Metrobus Stream Panel: http://localhost:'+PORT));
