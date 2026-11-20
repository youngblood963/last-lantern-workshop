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
 // All six current source GIFs contain 16 frames.
 const clipFrameCount=16;
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
   fromX:id==='floraRun'?115:-20,toX:id==='floraRun'?57:id==='walk'?75:120,
   fromY:0,toY:0,duration:id==='walk'?2500:id==='floraRun'?1600:2400,
   speed:id==='walk'?.6:1,pause:id==='glance'?300:0,facing:'auto'
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
   const saved=data?.paths?.[id]||{};
   const p={...saved};
   // Upgrade untouched pre-sequencer paths while retaining edited coordinates and timing.
   if(!data?.timelines?.[id]){
    if(id==='walk'&&p.fromX===-20&&p.toX===120&&p.duration===2400&&p.speed===1){
     p.toX=base.toX;p.duration=base.duration;p.speed=base.speed;
    }
    if(id==='floraRun'&&p.fromX===-20&&p.toX===120){
     p.fromX=base.fromX;p.toX=base.toX;
    }
   }
   paths[id]={fromX:num(p.fromX,base.fromX,-150,250),toX:num(p.toX,base.toX,-150,250),
    fromY:num(p.fromY,0,-150,150),toY:num(p.toY,0,-150,150),
    duration:num(p.duration,base.duration,100,20000),speed:num(p.speed,base.speed,.25,4),
    pause:num(p.pause,base.pause,0,10000),facing:['left','right'].includes(p.facing)?p.facing:'auto'};
  }
  const placements={};
  for(const [id] of Object.entries(clips)){
   const raw=data?.placements?.[id];
   placements[id]={
    x:num(raw?.x,null,-150,250),y:num(raw?.y,null,-100,200),
    scale:num(raw?.scale,null,1,200),layer:num(raw?.layer,null,1,20)
   };
  }
  const timelines={};
  for(const [id,def] of Object.entries(sequences)){
   const path=paths[id];
   const move=target=>({type:'move',clip:def[1],target,x:path.toX,y:actors[clips[def[1]][0]].y,
    duration:path.duration,facing:path.facing});
   const hold={type:'pause',duration:path.pause};
   const initial=def[3]?[
    move(def[2]?'placement':'waypoint'),
    ...(def[2]?[{type:'play',clip:def[2],facing:'auto'}]:[]),
    ...(path.pause?[hold]:[]),
    move('origin')
   ]:[{type:'play',clip:def[1],facing:'auto'}];
   const actor=clips[def[1]][0];
   const incoming=data?.timelines?.[id];
   const stages=Array.isArray(incoming)?incoming.slice(0,16).map(s=>{
    if(s?.type==='hold'){
     if(clips[s.clip]?.[0]!==actor)return null;
     return {type:'hold',clip:s.clip,frame:Math.round(num(s.frame,9,1,clipFrameCount)),
      duration:num(s.duration,4000,0,60000),facing:['left','right'].includes(s.facing)?s.facing:'auto'};
    }
    if(!['move','play','pause'].includes(s?.type))return null;
    const clip=clips[s.clip]?.[0]===actor?s.clip:def[1];
    if(s.type==='pause')return {type:s.type,duration:num(s.duration,300,0,10000)};
    if(s.type==='play')return {type:s.type,clip,facing:['left','right'].includes(s.facing)?s.facing:'auto'};
    return {type:s.type,clip,target:['waypoint','placement','origin','custom'].includes(s.target)?s.target:'waypoint',
     x:num(s.x,path.toX,-150,250),y:num(s.y,actors[actor].y,-100,200),
     duration:num(s.duration,path.duration,100,20000),facing:['left','right'].includes(s.facing)?s.facing:'auto'};
   }).filter(Boolean):[];
   timelines[id]=stages.length?stages:initial;
  }
  return {actors,paths,placements,timelines,probability:num(data?.probability,40,0,100),
   cooldown:num(data?.cooldown,1000,0,20000),peekLayer:num(data?.peekLayer,2,1,20),
   speed:num(data?.speed,1,.25,4),loop:data?.loop===true};
 }
 function appearance(config,id){
  const actor=config.actors[clips[id][0]],clip=config.placements[id];
  return {x:clip.x??actor.x,y:clip.y??actor.y,scale:clip.scale??actor.scale,
   layer:clip.layer??(id==='floraPeek'?config.peekLayer:actor.layer),visible:actor.visible};
 }
 function plan(config,id,single=false){
  if(single){
   const a=appearance(config,id);
   return [{clip:id,from:[a.x,a.y],to:[a.x,a.y],speed:config.speed}];
  }
  const def=sequences[id],p=config.paths[id],actor=config.actors[clips[def[1]][0]];
  const origin=def[3]?[p.fromX,actor.y+p.fromY]:[actor.x,actor.y];
  let position=origin, facing=1, lastClip=def[1], lastType;
  const stages=config.timelines[id];
  function resolve(stage){
   const id=stage.clip||lastClip;
   const a=appearance(config,id);
   const offset=[a.x-actor.x,a.y-actor.y];
   // A return ends at the original entrance, using the movement clip's own offset.
   const target=stage.type!=='move'?position:
    stage.target==='origin'?origin:stage.target==='placement'?[actor.x,actor.y]:
    stage.target==='custom'?[stage.x,stage.y]:[p.toX,actor.y+p.toY];
   if(stage.type==='move'){
    const delta=target[0]-position[0];
    facing=stage.facing==='left'?-1:stage.facing==='right'?1:delta===0?facing:Math.sign(delta);
   }else if(stage.type==='play'||stage.type==='hold'){
    if(stage.facing==='left'||stage.facing==='right')facing=stage.facing==='left'?-1:1;
    else if(!def[3])facing=p.facing==='left'?-1:1;
   }
   const shift=point=>[point[0]+offset[0],point[1]+offset[1]];
   const step={clip:id,from:shift(position),to:shift(target),speed:p.speed,facing,duration:stage.type==='hold'?undefined:stage.duration,
    still:stage.type==='pause',holdPrevious:stage.type==='pause'&&lastType==='play',
    oneCycle:stage.type==='play'&&def[3]};
   if(stage.type==='hold')step.frameHold={frame:stage.frame,duration:stage.duration};
   position=target;lastClip=id;
   if(stage.type!=='pause')lastType=stage.type==='hold'?'play':stage.type;
   return step;
  }
  const actions=stages.map(resolve);
  if(def[3]&&(position[0]!==origin[0]||position[1]!==origin[1])){
   const last=actions[actions.length-1], width=appearance(config,last.clip).scale;
   const endX=last.to[0];
   if(endX>-width/2&&endX<100+width/2){
    actions.push(resolve({type:'move',clip:def[1],target:'origin',duration:p.duration,facing:'auto'}));
   }
  }
  return actions;
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
 function gif(buffer,speed,still=false,oneCycle=false,frameHold){
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
  let p=13+palette(data[10]),duration=0,frames=0,delay=10,delayOffset,loopStart,loopEnd,frameInsert;
  while(p<data.length){
   const tag=data[p++];
   if(tag===0x3b)break;
   if(tag===0x21){
    const label=data[p++];
    if(label===0xf9&&data[p]===4){
     delay=Math.max(2,Math.round(((data[p+2]+256*data[p+3])||10)/speed));
     delayOffset=p+2;
     data[delayOffset]=delay&255;data[delayOffset+1]=delay>>8;
    }
    const end=blocks(p);
    if((oneCycle||frameHold)&&label===0xff&&data[p]===11){
     const app=String.fromCharCode(...data.slice(p+1,p+12));
     if(app==='NETSCAPE2.0'||app==='ANIMEXTS1.0'){loopStart=p-2;loopEnd=end;}
    }
    p=end;
   }else if(tag===0x2c){
    const imageStart=p-1;
    p=blocks(p+10+palette(data[p+8]));
    // Extend just this frame's delay in the temporary GIF. The browser
    // decodes the same frames in order, including their transparency/disposal.
    if(frameHold&&frames+1===frameHold.frame){
     const added=Math.max(0,Math.min(65535-delay,Math.round(frameHold.duration/10)));
     delay+=added;
     if(delayOffset!==undefined){
      data[delayOffset]=delay&255;data[delayOffset+1]=delay>>8;
     }else{
      frameInsert=[imageStart,new Uint8Array([0x21,0xf9,4,0,delay&255,delay>>8,0,0])];
     }
    }
    duration+=delay*10;frames++;delay=10;delayOffset=undefined;
    if(still)return {blob:new Blob([data.slice(0,p),new Uint8Array([0x3b])],{type:'image/gif'}),duration};
   }else throw Error('Unsupported GIF block');
  }
  if(!frames)throw Error('GIF has no frames');
  if(!frameHold)return {blob:new Blob(loopEnd?[data.slice(0,loopStart),data.slice(loopEnd)]:[data],{type:'image/gif'}),duration};
  if(frames<frameHold.frame)throw Error('Hold frame is outside the GIF');
  const edits=[];
  if(loopEnd)edits.push([loopStart,loopEnd]);
  if(frameInsert)edits.push([frameInsert[0],frameInsert[0],frameInsert[1]]);
  const parts=[];
  let offset=0;
  for(const [start,end,bytes] of edits.sort((a,b)=>a[0]-b[0])){
   parts.push(data.slice(offset,start));
   if(bytes)parts.push(bytes);
   offset=end;
  }
  parts.push(data.slice(offset));
  return {blob:new Blob(parts,{type:'image/gif'}),duration};
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
  const hubArt=root+'backgrounds/communication_hub.png';
  const overlayArt=null; // Optional transparent-center artwork.
  const background=sprite('tomorrow-background');
  const computer=sprite('tomorrow-computer','Communications computer');
  const syn=sprite('tomorrow-actor','Syn at the communications desk');
  syn.dataset.actor='syn';
  const frame=sprite('tomorrow-frame');
  let current=load(),active=null,last='',next=0;
  const ghosts=new Map();
  function show(img,path){
   img.hidden=!path;
   if(path&&img.getAttribute('src')!==path)img.setAttribute('src',path);
  }
  function position(img,id,clip){
   const a=clip?appearance(current,clip):current.actors[id];
   img.style.left=a.x+'%';img.style.top=a.y+'%';img.style.width=a.scale+'%';
   img.style.zIndex=String(a.layer);img.hidden=!a.visible;
  }
  function configure(settings){
   current=normalize(settings);
   const hub=visual.dataset.view==='hub';
   position(syn,'syn');syn.hidden=!hub||!current.actors.syn.visible;
   for(const [id,entry] of ghosts){
    position(entry.img,id,entry.clip);
    entry.img.hidden=!hub||!current.actors[id].visible||active?.actor===id;
   }
   if(active?.img)position(active.img,active.actor,active.clip);
  }
  function view(kind,roomArt,computerArt){
   visual.dataset.view=kind;
   visual.hidden=!kind;
   const backdrop=kind==='hub'?hubArt:kind==='room'?roomArt:null;
   show(background,backdrop);
   show(frame,kind==='hub'?overlayArt:null);
   if(backdrop)visual.style.setProperty('--tomorrow-backing','url('+JSON.stringify(new URL(backdrop,document.baseURI).href)+')');
   else visual.style.removeProperty('--tomorrow-backing');
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
   ghosts.set(actor,{img,url,clip:id});
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
  function start(id,{single=false,stageIndex,loop=false,onEnd}={}){
   if(visual.dataset.view!=='hub')return false;
   const def=single?null:sequences[id], clip=single?id:def?.[1];
   if(!Object.prototype.hasOwnProperty.call(clips,clip))return false;
   const actor=clips[clip][0],a=current.actors[actor];
   if(!a.visible)return false;
   const all=plan(current,id,single);
   const selected=Number.isInteger(stageIndex)?all[stageIndex]:null;
   if(stageIndex!==undefined&&!selected)return false;
   stop();
   const actions=selected?[{...selected,holdPrevious:false}]:all;
   const play=active={actor,onEnd};configure(current);
   async function go(index){
    if(active!==play)return;
    if(index===actions.length){
     if(!loop)return stop('Finished');
     index=0;
    }
    const step=actions[index];
    if(step.holdPrevious&&play.img){
     play.timer=setTimeout(()=>go(index+1),step.duration);
     return;
    }
    const {clip:action,from:start,to:end,duration:ms,facing,still,speed,oneCycle,frameHold}=step;
    try{
     const media=gif(await source(action),speed,still,oneCycle,frameHold);
     if(active!==play)return;
     const img=sprite('tomorrow-actor tomorrow-moving');
     const url=URL.createObjectURL(media.blob);
     const duration=ms??media.duration;
     img.dataset.actor=actor;
     position(img,actor,action);img.hidden=true;
     for(const [key,value] of Object.entries({'from-x':start[0]+'%','from-y':start[1]+'%',
      'to-x':end[0]+'%','to-y':end[1]+'%','duration':duration+'ms','facing':facing??1})){
      img.style.setProperty('--tomorrow-'+key,String(value));
     }
     play.pending={img,url,timer:setTimeout(()=>stop('Artwork timed out'),5000)};
     img.onload=()=>{
      if(active!==play)return;
      clearTimeout(play.pending.timer);play.pending=null;
      release(play);play.img=img;play.url=url;play.clip=action;
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
 return {create,load,save,normalize,clips,sequences,plan,clipFrameCount};
})();
