/* DEVTEST only: autonomous arena exhibitions with 2 existing fighter sprites.
 * Does not touch player combat, turn counter, inventory, tournament progress or odds elsewhere. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined'||typeof casinoWagerMenu!=='function')return;
const root=new URL('../devtest/',document.baseURI);
const src=file=>new URL('assets/enemies/'+file,root).href;
const arenaArt=key=>new URL(key==='ring'?'../../the_fighting_ring.png':'../../the_forgotten_arena.png',root).href;
const roster={ring:[['SCRAPPER','arena_scrapper.png'],['BRUISER','arena_bruiser.png'],['THE HAMMER','arena_the_hammer.png']],grave:[['DRIFTER','arena_drifter.png'],['IRONBACK','arena_ironback.png'],['GRAVEKEEPER','arena_gravekeeper.png']]};
const title=key=>key==='ring'?'THE FIGHTING RING':'THE FORGOTTEN ARENA';
function identify(){
 if(stage!=='encounter'||typeof currentEncounter!=='function')return null;
 const name=String(currentEncounter()?.title||'').toUpperCase().replace(/^EAST ROAD — /,'');
 return name==='THE FIGHTING RING'?'ring':name==='THE FORGOTTEN ARENA'?'grave':null;
}
let session=null,timer=0;
const active=()=>stage==='r127ArenaLobby'&&!!session;
const resolve=raw=>{const key=String(raw||'').trim().toLowerCase();return String(numberedChoices?.[key]||currentHotkeys?.[key]||key).toLowerCase();};
function menu(){
 if(!session)return;
 session.mode='main';
 add(title(session.key),'place');
 if(session.result)add(session.result,'reward');
 add('Watch the exhibition, back a fighter, or enter the championship. Spectating costs no travel turns.','system');
 r5DirectChoices(['WATCH A ROUND','BET ON A ROUND','ENTER TOURNAMENT','BACK AWAY']);
 GraphicalUI.schedule();
}
function pick(){
 const all=roster[session.key],i=Math.floor(Math.random()*3);
 let j=Math.floor(Math.random()*2);if(j>=i)j++;
 return [all[i],all[j]].map(([name,file])=>({name,file,hp:100,max:100}));
}
function select(){
 session.mode='pick';session.fighters=pick();session.bet=null;session.result='';
 add('Choose the fighter to back. A winning wager returns 2× the stake.','system');
 r5DirectChoices([session.fighters[0].name,session.fighters[1].name,'BACK']);
 GraphicalUI.schedule();
}
function wagerMenu(){
 session.mode='wager';
 add('YOUR PICK: '+session.fighters[session.bet.pick].name+' — 1,000 Bolts maximum.','system');
 casinoWagerMenu();GraphicalUI.schedule();
}
function placeBet(n){
 if(!Number.isSafeInteger(n)||n<1||n>1000||n>player.bolts){
  add('Wager must be an affordable whole number from 1 to 1,000.','danger');return wagerMenu();
 }
 session.bet.amount=n;player.bolts-=n;updateHud();
 if(typeof v49Autosave==='function')v49Autosave();
 start();
}
function start(){
 if(timer){clearInterval(timer);timer=0;}
 if(!session.fighters)session.fighters=pick();
 session.mode='fight';session.turn=Math.floor(Math.random()*2);session.effect=null;session.result='';
 // While the automatic exhibition runs, hide the old betting/venue buttons.
 numberedChoices={};currentHotkeys={};
 add('The referee rings the bell. Two fighters step into the arena!','bright');
 GraphicalUI.schedule();
 timer=setInterval(()=>{
  if(!active()||session.mode!=='fight'){clearInterval(timer);timer=0;return;}
  const [a,b]=session.fighters,off=session.turn++%2===0?a:b,def=off===a?b:a;
  if(Math.random()<.12)session.effect={name:off.name,miss:true,amount:0,turn:session.turn};
  else {const d=8+Math.floor(Math.random()*11)+(Math.random()<.1?8:0);def.hp=Math.max(0,def.hp-d);session.effect={name:def.name,miss:false,amount:d,turn:session.turn};}
  GraphicalUI.schedule();
  if(a.hp===0||b.hp===0){
   clearInterval(timer);timer=0;session.mode='ending';GraphicalUI.schedule();
   setTimeout(()=>{
    if(!active()||session.mode!=='ending')return;
    const winner=a.hp>0?a:b,loser=a.hp>0?b:a;
    session.result=winner.name+' defeats '+loser.name+'! The crowd erupts.';
    if(session.bet?.amount){
     const amount=session.bet.amount,win=session.fighters[session.bet.pick]===winner;
     if(win)gainBolts(2*amount);
     add(win?'BET WON — '+(2*amount)+' Bolts returned (+'+amount+' profit).':'BET LOST — '+amount+' Bolts.',win?'reward':'system');
     if(typeof v49Autosave==='function')v49Autosave();
    }
    add(session.result,'reward');session.bet=null;menu();
   },650);
  }
 },590);
}
function leave(){
 if(timer){clearInterval(timer);timer=0;}
 session=null;
 const g=typeof lanternState==='function'?lanternState():null;
 if(g?.pending){stage='encounter';completeRoadTurn();}
 else if(g?.currentEdgeId){stage='lanternRoad';lanternRoadMenu();}
 else{stage='lanternNode';lanternNodeMenu();}
 GraphicalUI.schedule();
}
function command(raw){
 const cmd=resolve(raw),mode=session.mode;
 if(mode==='fight'||mode==='ending'){add('The round is still underway.','system');return;}
 if(mode==='main'){
  if(cmd==='watch a round'){session.fighters=pick();session.bet=null;start();return;}
  if(cmd==='bet on a round')return select();
  if(cmd==='enter tournament'){if(!r18TournamentEnter(session.key))menu();return;}
  if(['back away','back','b'].includes(cmd))return leave();
  return menu();
 }
 if(mode==='pick'){
  if(['back','b'].includes(cmd)){session.bet=null;session.fighters=null;return menu();}
  const index=session.fighters.findIndex(f=>f.name.toLowerCase()===cmd);
  if(index>=0){session.bet={pick:index,amount:0};return wagerMenu();}
  return select();
 }
 if(mode==='wager'){
  if(['back','b'].includes(cmd))return select();
  if(['custom','custom wager','c'].includes(cmd)){session.mode='custom';add('CUSTOM WAGER — 1 to 1,000 Bolts.','system');GraphicalUI.schedule();return;}
  const m=cmd.match(/^(?:wager|bet)\s+(\d+)(?:\s+bolts?)?$/);
  if(m)return placeBet(Number(m[1]));
  return wagerMenu();
 }
 if(mode==='custom'){
  if(['back','b','cancel'].includes(cmd))return wagerMenu();
  if(/^\d+$/.test(cmd))return placeBet(Number(cmd));
  add('Enter an affordable whole-number wager (1–1,000).','system');
 }
}
const oldCore=handleCommandCore;
handleCommandCore=async function(raw){
 const key=identify(),cmd=resolve(raw);
 if(key&&['watch a round','bet on a round','enter tournament'].includes(cmd)){
  session={key,mode:'main',fighters:null,bet:null,result:''};stage='r127ArenaLobby';
  if(cmd==='enter tournament'){if(!r18TournamentEnter(key))menu();}
  else if(cmd==='bet on a round')select();
  else{session.fighters=pick();start();}
  return;
 }
 if(active()){command(raw);return;}
 return oldCore.apply(this,arguments);
};
const oldRender=renderCurrentChoices;
renderCurrentChoices=function(...args){
 if(active()){if(session.mode==='main')return menu();if(session.mode==='pick')return select();if(session.mode==='wager')return wagerMenu();return;}
 return oldRender.apply(this,args);
};
if(typeof FocusedEntry!=='undefined'){
 const oldDescribe=FocusedEntry.describe;
 FocusedEntry.describe=function(...args){
  if(active()&&session.mode==='custom')return {key:'arena-exhibition-custom',title:'Custom arena wager',label:'Bolts',numeric:true,min:1,max:Math.min(1000,player.bolts),hint:'1–1,000 Bolts. All In disabled.',cancel:'back',format:v=>v};
  return oldDescribe.apply(this,args);
 };
}
const oldModel=GraphicalUI.model;
GraphicalUI.model=function(...args){
 const model=oldModel.apply(this,args);
 if(active()&&model.active){model.art=arenaArt(session.key);model.title=title(session.key);model.regionalSky=null;}
 return model;
};
const css=document.createElement('style');css.id='r127-spectator-fights';
css.textContent=[
 '.gfx-art.r127-spectating{position:relative;isolation:isolate}',
 '.gfx-art.r127-spectating>.gfx-image{object-fit:contain!important;object-position:center!important}',
 '.gfx-art.r127-spectating.r127-arena-night>.gfx-image{filter:brightness(.55) saturate(.72) contrast(1.06)!important}',
 '.gfx-art.r127-spectating>.r127-spectator-layer{position:absolute;inset:0;z-index:8;pointer-events:none;display:flex;justify-content:space-around;align-items:flex-end;padding:0 12% 2%;box-sizing:border-box}',
 '.r127-spectator-unit{position:relative;width:43%;height:84%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-width:0}',
 '.r127-spectator-unit img{width:100%;height:calc(100% - 32px);min-height:0;object-fit:contain;object-position:center bottom;filter:drop-shadow(3px 6px 5px #000a);transition:opacity .5s,transform .4s}',
 '.r127-spectator-unit:first-child img{transform:scaleX(-1)}',
 '.r127-spectator-unit.hit img{animation:r127-spectator-shake .24s ease-out}',
 '.r127-spectator-unit.ko img{opacity:0;translate:0 24px}',
 '.r127-spectator-hp{position:relative;width:94%;height:27px;box-sizing:border-box;background:#26110fea;border:1px solid #b24639;text-align:center;font:700 11px/25px system-ui,sans-serif;color:#fff;white-space:nowrap}',
 '.r127-spectator-hp-fill{position:absolute;inset:0 auto 0 0;background:#982e26;transition:width .25s}',
 '.r127-spectator-hp span{position:relative;text-shadow:0 1px 3px #000}',
 '.r127-spectator-damage{position:absolute;top:2%;color:#fff1b9;font:800 19px system-ui,sans-serif;text-shadow:0 2px 4px black}',
 '@keyframes r127-spectator-shake{0%,100%{translate:0}45%{translate:14px}}',
 '@media(max-width:600px){.gfx-art.r127-spectating>.r127-spectator-layer{padding:0 2% 1%}.r127-spectator-unit{width:49%;height:78%}.r127-spectator-hp{font-size:9px}}'
].join('\n');
document.head.append(css);
const oldSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=oldSync.apply(this,args),e=this.element;
 if(!e?.figure)return result;
 const shown=!!active()&&this.preference()==='graphics'&&!e.frame.hidden;
 e.figure.classList.toggle('r127-spectating',shown);
 const phase=typeof Route127RegionalSky?.phase==='function'?Route127RegionalSky.phase(player.flags.worldHour):'day';
 e.figure.classList.toggle('r127-arena-night',shown&&phase==='night');
 let layer=e.figure.querySelector(':scope > .r127-spectator-layer');
 if(!shown||!session.fighters){layer?.remove();return result;}
 if(!layer){layer=document.createElement('div');layer.className='r127-spectator-layer';e.figure.append(layer);}
 session.fighters.forEach((f,i)=>{
  let unit=layer.children[i];
  if(!unit||unit.dataset.sprite!==f.file){
   unit?.remove();unit=document.createElement('div');unit.className='r127-spectator-unit';unit.dataset.sprite=f.file;
   const pic=document.createElement('img');pic.src=src(f.file);pic.alt=f.name;
   const hp=document.createElement('div');hp.className='r127-spectator-hp';
   const fill=document.createElement('div');fill.className='r127-spectator-hp-fill';
   const label=document.createElement('span');hp.append(fill,label);
   const dmg=document.createElement('div');dmg.className='r127-spectator-damage';
   unit.append(pic,hp,dmg);layer.insertBefore(unit,layer.children[i]||null);
  }
  unit.querySelector('.r127-spectator-hp-fill').style.width=f.hp/f.max*100+'%';
  unit.querySelector('.r127-spectator-hp span').textContent=f.name+' '+f.hp+'/'+f.max;
  unit.classList.toggle('ko',f.hp<=0);
  const effect=session.effect;
  unit.classList.toggle('hit',session.mode==='fight'&&effect?.name===f.name&&!effect.miss);
  unit.querySelector('.r127-spectator-damage').textContent=effect?.name===f.name?(effect.miss?'MISS':'-'+effect.amount):'';
 });
 while(layer.children.length>session.fighters.length)layer.lastElementChild.remove();
 return result;
};
globalThis.Route127ArenaSpectator={wagerOpen:()=>!!active()&&session.mode==='wager'};
})();