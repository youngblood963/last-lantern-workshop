/* Shared DEVTEST terminal composition and ambient playback. */
globalThis.TomorrowProjectScene=(()=>{
 'use strict';
 const root='../devtest/assets/tomorrow_project/';
 // The game wraps localStorage with this prefix. The standalone Workshop
 // writes the same physical key without loading the character runtime.
 const storageKey=(globalThis.ROUTE127_ENV?.name==='DEVTEST'?'':'route127:devtest:v1:')+'tomorrow-project-layout-v1';
 const clips={
  walk:['luna','luna/luna_walk.gif','Luna — Walk'],
  turn:['luna','luna/luna_turn.gif','Luna — Turn'],
  coffee:['luna','luna/luna_coffee.gif','Luna — Coffee'],
  peek:['luna','luna/luna_peek.gif','Luna — Peek'],
  floraPeek:['flora','flora/flora_peek.gif','Flora — Peek'],
  floraRun:['flora','flora/flora_run.gif','Flora — Run']
 };
 const sequences={
  walk:['Luna — Walk Through','walk',null,true],
  glance:['Luna — Camera Glance','walk','turn',true],
  coffee:['Luna — Coffee Break','walk','coffee',true],
  peek:['Luna — Peek','peek',null,false],
  floraPeek:['Flora — Peek','floraPeek',null,false],
  floraRun:['Flora — Run','floraRun',null,true]
 };
 const defaults={
  actors:{
   syn:{x:50,y:50,scale:100,layer:3,visible:true},
   luna:{x:21,y:56,scale:30,layer:2,visible:true},
   flora:{x:75,y:78,scale:18,layer:4,visible:true}
  },
  probability:40,
  cooldown:1000,
  peekLayer:2,
  speed:1,
  loop:false,
  paths:Object.fromEntries(Object.keys(sequences).map(id=>[id,{
   fromX:-20,toX:120,fromY:0,toY:0,duration:id==='floraRun'?1600:2400,
   speed:1,pause:id==='glance'?300:0,facing:'auto'
  }]))
 };
 const num=(value,fallback,min,max)=>typeof value==='number'&&Number.isFinite(value)?
  Math.min(max,Math.max(min,value)):fallback;
 function normalize(data={}){
  const actors={};
  for(const [id,base] of Object.entries(defaults.actors)){
   const a=data?.actors?.[id]||{};
   actors[id]={x:num(a.x,base.x,-150,250),y:num(a.y,base.y,-100,200),
    scale:num(a.scale,base.scale,1,200),layer:num(a.layer,base.layer,1,20),
    visible:typeof a.visible==='boolean'?a.visible:base.visible};
  }
  const paths={};
  for(const [id,base] of Object.entries(defaults.paths)){
   const p=data?.paths?.[id]||{};
   paths[id]={fromX:num(p.fromX,base.fromX,-150,250),toX:num(p.toX,base.toX,-150,250),
    fromY:num(p.fromY,0,-150,150),toY:num(p.toY,0,-150,150),
    duration:num(p.duration,base.duration,100,20000),speed:num(p.speed,1,.25,4),
    pause:num(p.pause,base.pause,0,10000),facing:['left','right'].includes(p.facing)?p.facing:'auto'};
  }
  return {actors,paths,probability:num(data?.probability,40,0,100),
   cooldown:num(data?.cooldown,1000,0,20000),peekLayer:num(data?.peekLayer,2,1,20),
   speed:num(data?.speed,1,.25,4),loop:data?.loop===true};
 }
 function load(){
  try{return normalize(JSON.parse(localStorage.getItem(storageKey)||'null'));}
  catch{return normalize();}
 }
 function save(config){localStorage.setItem(storageKey,JSON.stringify(normalize(config)));}

 // The uploaded files are GIF89a animations. Adjust frame delays in a
 // temporary copy so preview speed and the actual sprite frames stay in sync.
 const sources=new Map();
 function source(id){
  if(!sources.has(id)){
   const promise=fetch(root+clips[id][1]).then(r=>{
    if(!r.ok)throw Error('Artwork unavailable');
    return r.arrayBuffer();
   }).catch(error=>{sources.delete(id);throw error;});
   sources.set(id,promise);
  }
  return sources.get(id);
 }
 function gif(buffer,speed,still=false){
  const data=new Uint8Array(buffer.slice(0));
  if(data.length<14||data[0]!==71||data[1]!==73||data[2]!==70)throw Error('Invalid GIF');
  const palette=flag=>flag&128?3*(2**((flag&7)+1)):0;
  const blocks=offset=>{
   while(offset<data.length){
    const size=data[offset++];
    if(size===0)return offset;
    offset+=size;
   }
   throw Error('Truncated GIF');
  };
  let p=13+palette(data[10]),duration=0,frames=0,delay=10;
  while(p<data.length){
   const tag=data[p++];
   if(tag===0x3b)break;
   if(tag===0x21){
    const label=data[p++];
    if(label===0xf9&&data[p]===4){
     delay=Math.max(2,Math.round(((data[p+2]+256*data[p+3])||10)/speed));
     data[p+2]=delay&255;data[p+3]=delay>>8;
    }
    p=blocks(p);
   }else if(tag===0x2c){
    p=blocks(p+10+palette(data[p+8]));
    duration+=delay*10;frames++;delay=10;
    if(still)return {blob:new Blob([data.slice(0,p),new Uint8Array([0x3b])],{type:'image/gif'}),duration};
   }else throw Error('Unsupported GIF block');
  }
  if(!frames)throw Error('GIF has no frames');
  return {blob:new Blob([data],{type:'image/gif'}),duration};
 }

 function create(){
  const visual=document.createElement('div');
  visual.className='tomorrow-visual';
  const composition=document.createElement('div');
  composition.className='tomorrow-composition';
  visual.append(composition);
  function sprite(className,alt=''){
   const img=document.createElement('img');
   img.className=className;img.alt=alt;img.hidden=true;img.draggable=false;
   composition.append(img);
   return img;
  }
  const background=sprite('tomorrow-background');
  const computer=sprite('tomorrow-computer','Communications computer');
  const syn=sprite('tomorrow-actor','Syn at the communications desk');
  syn.dataset.actor='syn';
  let current=load(),active=null,last='',next=0;
  const ghosts=new Map();
  function show(img,path){
   img.hidden=!path;
   if(path&&img.getAttribute('src')!==path)img.setAttribute('src',path);
  }
  function position(img,id,layer){
   const a=current.actors[id];
   img.style.left=a.x+'%';img.style.top=a.y+'%';img.style.width=a.scale+'%';
   img.style.zIndex=String(layer??a.layer);img.hidden=!a.visible;
  }
  function configure(settings){
   current=normalize(settings);
   const hub=visual.dataset.view==='hub';
   position(syn,'syn');syn.hidden=!hub||!current.actors.syn.visible;
   for(const [id,entry] of ghosts){
    position(entry.img,id);
    entry.img.hidden=!hub||!current.actors[id].visible||active?.actor===id;
   }
   if(active?.img)position(active.img,active.actor,active.peek?current.peekLayer:undefined);
  }
  function view(kind,roomArt,computerArt){
   visual.dataset.view=kind;
   visual.hidden=!kind;
   show(background,kind==='hub'?root+'backgrounds/communication_hub.png':roomArt);
   show(computer,computerArt);
   show(syn,kind==='hub'?root+'characters/syn_desk.png':'');
   configure(current);
  }
  async function pose(actor,id){
   const url=URL.createObjectURL(gif(await source(id),1,true).blob);
   const old=ghosts.get(actor);
   if(old){URL.revokeObjectURL(old.url);old.img.remove();}
   const img=sprite('tomorrow-actor');
   img.dataset.actor=actor;img.src=url;
   ghosts.set(actor,{img,url});
   configure(current);
  }
  function release(play){
   clearTimeout(play.timer);
   if(play.img)play.img.remove();
   if(play.url)URL.revokeObjectURL(play.url);
   play.img=null;play.url=null;
  }
  function releasePending(play){
   if(!play.pending)return;
   clearTimeout(play.pending.timer);
   const {img,url}=play.pending;
   img.onload=null;img.onerror=null;img.remove();
   URL.revokeObjectURL(url);play.pending=null;
  }
  function stop(reason='Stopped'){
   if(!active)return;
   const play=active;active=null;
   release(play);releasePending(play);next=Date.now()+current.cooldown;
   configure(current);
   play.onEnd?.(reason);
  }
  function start(id,{single=false,loop=false,onEnd}={}){
   if(visual.dataset.view!=='hub')return false;
   const def=single?null:sequences[id], clip=single?id:def?.[1];
   if(!clips[clip])return false;
   const actor=clips[clip][0],a=current.actors[actor];
   if(!a.visible)return false;
   stop();
   const path=def?current.paths[id]:null;
   const speed=path?path.speed:current.speed;
   const middle=[a.x,a.y],from=path?[path.fromX,a.y+path.fromY]:middle,to=path?[path.toX,a.y+path.toY]:middle;
   const backwards=path&&(path.facing==='left'||(path.facing==='auto'&&to[0]<from[0]));
   const layer=clip==='floraPeek'?current.peekLayer:a.layer;
   const actions=def?.[2]?
    [[clip,from,middle,path.duration],[def[2],middle,middle,null],...(path.pause?[[def[2],middle,middle,path.pause,true]]:[]),[clip,middle,to,path.duration]]:
    [[clip,def?.[3]?from:middle,def?.[3]?to:middle,def?.[3]?path.duration:null]];
   const play=active={actor,onEnd,peek:clip==='floraPeek'};configure(current);
   async function go(index){
    if(active!==play)return;
    if(index===actions.length){
     if(!loop)return stop('Finished');
     index=0;
    }
    const [action,start,end,ms,still]=actions[index];
    try{
     const media=gif(await source(action),speed,still);
     if(active!==play)return;
     const img=sprite('tomorrow-actor tomorrow-moving');
     const url=URL.createObjectURL(media.blob);
     const duration=ms??media.duration;
     img.dataset.actor=actor;
     position(img,actor,layer);img.hidden=true;
     for(const [key,value] of Object.entries({'from-x':start[0]+'%','from-y':start[1]+'%',
      'to-x':end[0]+'%','to-y':end[1]+'%','duration':duration+'ms','facing':backwards?-1:1})){
      img.style.setProperty('--tomorrow-'+key,String(value));
     }
     play.pending={img,url,timer:setTimeout(()=>stop('Artwork timed out'),5000)};
     img.onload=()=>{
      if(active!==play)return;
      clearTimeout(play.pending.timer);play.pending=null;
      release(play);play.img=img;play.url=url;
      img.hidden=!current.actors[actor].visible;
      play.timer=setTimeout(()=>go(index+1),duration);
     };
     img.onerror=()=>{if(active===play)stop('Artwork unavailable');};
     img.src=url;
    }catch{if(active===play)stop('Artwork unavailable');}
   }
   go(0);
   return true;
  }
  function roll(onEnd){
   if(active)return 'Animation already playing';
   if(Date.now()<next)return 'Cooldown';
   if(Math.random()>=current.probability/100)return 'No animation triggered';
   const options=Object.keys(sequences).filter(id=>id!==last&&current.actors[clips[sequences[id][1]][0]].visible);
   if(!options.length)return 'No different visible sequence';
   const id=options[Math.floor(Math.random()*options.length)];
   if(start(id,{onEnd})){last=id;return sequences[id][0];}
   return 'No animation triggered';
  }
  function reset(){stop();last='';next=0;}
  return {visual,composition,view,configure,pose,start,stop,roll,reset};
 }
 return {create,load,save,normalize,clips,sequences};
})();
