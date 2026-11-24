/* DEVTEST Lounge casino: venue routing over the existing casino engine/journal. */
(()=>{'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
let opening=false,feedback='';
const games=new Map(),root=new URL('../devtest/assets/locations/',document.baseURI);
const here=()=>Route127Motel.here(),key=()=>player.flags.motelCasino;
const active=()=>here()&&!!key()&&['motelCasino','r6Casino'].includes(stage);
const ownRound=()=>active()&&key()!=='floor'&&r6Round()?.motelKey===key();
const round=()=>ownRound()?r6Round():null;
const liveAnimations=new Set();
const locked=r=>!!r&&Date.now()<Number(r.animationUntil||0);
const notice=text=>{feedback=text;add(text,'danger');render();GraphicalUI.schedule();return false;};
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
const asset=name=>new URL(name,root).href;
function choices(title,labels){add(title,'place');DevtestMenuModel.publishQueued('motel-casino-'+key(),labels,labels.at(-1),r5DirectChoices,{direct:true});GraphicalUI.schedule();}
function allowed(){processRefill();if(player.turns<=0&&!testMode){noTurnsMenu();return false;}return true;}
function floor(){if(!here()||!allowed())return;feedback='';screen.replaceChildren();player.flags.motelRoom='casino';player.flags.motelCasino='floor';stage='motelCasino';render();v49Autosave();}
function open(id,resume=false){if(!here()||!allowed()||!games.has(id))return false;feedback='';player.flags.motelRoom='casino';player.flags.motelCasino=id;
 if(!resume||r6Round()?.motelKey!==id){screen.replaceChildren();opening=true;try{r6Open(id==='poker'?"PIRATE'S POKER":'MOTEL '+id.toUpperCase());}finally{opening=false;}r6Round().motelKey=id;r6Round().venue='motel';games.get(id).setup?.(r6Round());r6CasinoSave();}
 stage='r6Casino';render();return true;
}
const nativeRender=r6CasinoRender;
function render(){if(!active())return;if(key()==='floor')return choices('THE LOUNGE — CASINO',['POKER','SLOTS','BIG SIX WHEEL','KENO','ROULETTE','BACK']);
 const game=games.get(key()),r=round();if(!game||!r)return floor();if(game.render)return game.render(r);return nativeRender();}
function back(){const r=round();if(r?.status==='active')r6Settle(0,'Round abandoned — wager forfeited.');floor();}
const nativeCommand=r6CasinoCommand;
r6CasinoCommand=function(raw){if(!active()||stage!=='r6Casino')return nativeCommand.apply(this,arguments);const cmd=v53Normalize(r5Mapped(raw)),r=round();feedback='';if(!r)return floor();
 if(['back','b'].includes(cmd)&&!r.custom)return back();
 if(cmd==='play again'&&r.status==='settled')return open(key());
 if(games.get(key())?.command)return games.get(key()).command(cmd,r);
 return nativeCommand.call(this,cmd);
};
r6CasinoRender=function(...args){if(opening)return;return active()?render():nativeRender.apply(this,args);};
const nativeCore=handleCommandCore;
handleCommandCore=async function(raw){const cmd=v53Normalize(r5Mapped(raw));if(here()&&stage==='motelLounge'&&cmd==='gamble')return floor();
 if(active()&&stage==='motelCasino'){
  if(cmd==='back'||cmd==='b'){delete player.flags.motelCasino;return Route127Motel.open('lounge');}
  const id={poker:'poker',slots:'slots','big six wheel':'bigsix',keno:'keno',roulette:'roulette'}[cmd];if(id)return open(id);return render();
 }
 return nativeCore.apply(this,arguments);
};
const nativeChoices=renderCurrentChoices;
renderCurrentChoices=function(...args){return active()?render():nativeChoices.apply(this,args);};
const nativeModel=GraphicalUI.model;
GraphicalUI.model=function(...args){const m=nativeModel.apply(this,args);if(active()&&m.active){const g=games.get(key());m.title='THE LOUNGE — '+(g?.title||'CASINO');m.regionalSky=null;m.scenarioBackdrop=null;
 if(key()!=='poker'){m.layout='motel-casino';m.art=asset(key()==='floor'?'motel_casino.png':g?.art||'motel_casino.png');}
 }return m;};
const nativeHands=r11PokerHands;
r11PokerHands=function(r,hidden){if(!active()||key()!=='poker')return nativeHands.apply(this,arguments);if(GraphicalUI.active())return;outputQueue=outputQueue.then(()=>{addImmediate('YOUR CARDS — 1  2  3  4  5','system');r11CardRows(r.hand);addImmediate('DEALER’S CARDS','npc-blue');r11CardRows(r.dealer,hidden);followOutput();});};
const nativeSettle=r6Settle;
r6Settle=function(payout,message){return nativeSettle.call(this,payout,ownRound()&&key()==='poker'?String(message).replace(/MIA/g,'DEALER'):message);};
const nativeLoad=loadGame;
loadGame=function(...args){const out=nativeLoad.apply(this,args);if(here()&&(player.flags.motelRoom==='casino'||r6Round()?.venue==='motel'&&stage==='r6Casino')){
 const id=r6Round()?.motelKey;if(id&&games.has(id)&&key()!=='floor'){player.flags.motelCasino=id;stage='r6Casino';const r=round();if(r?.status==='active'&&r.motelOutcome)r6Settle(r.motelOutcome.payout,r.motelOutcome.message);open(id,true);}else floor();
 }return out;};
function commit(r,bet,data,payout,message,duration){
 if(window.matchMedia?.('(prefers-reduced-motion:reduce)').matches)duration=0;
 if(r!==round()||r.status!=='waiting'||!allowed())return false;
 if(!Number.isSafeInteger(bet)||bet<1||bet>1000||bet>player.bolts)return notice('Wager must be an affordable whole number from 1 to 1,000 Bolts.');
 if(!Number.isSafeInteger(payout)||payout<0||!Number.isSafeInteger(player.bolts-bet+payout))return notice('This wager exceeds the safe wallet limit.');
 // Fail before taking a stake if the existing local journal is unavailable.
 try{r11CasinoBaseline();const probe='route127-motel-casino-write-check';localStorage.setItem(probe,r.id);if(localStorage.getItem(probe)!==r.id)throw Error('write');localStorage.removeItem(probe);}catch{return notice('Casino save storage is unavailable. No wager was taken.');}
 Object.assign(r,data,{motelOutcome:{payout,message},committedAt:Date.now(),animationUntil:Date.now()+duration});
 liveAnimations.add(r.id);
 if(!r6Wager(bet)){liveAnimations.delete(r.id);delete r.animationUntil;return notice('Invalid or unaffordable wager. No wager was taken.');}
 // The native journal already holds the outcome with the debit before settlement.
 r6Settle(payout,message);render();GraphicalUI.schedule();
 setTimeout(()=>{liveAnimations.delete(r.id);if(round()===r){render();GraphicalUI.sync();}},duration+20);return true;
}
let layer=null,panel=null,sceneKey='';
const nativeSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){const out=nativeSync.apply(this,args),e=this.element;if(!e)return out;
 e.frame.classList.toggle('r127-motel-casino',active());
 if(!active()){layer?.remove();panel?.remove();layer=null;panel=null;sceneKey='';return out;}
 if(key()==='poker'){
  layer?.remove();panel?.remove();layer=null;panel=null;sceneKey='';
  for(const label of e.figure.querySelectorAll('.poker-label')){label.textContent=label.textContent.replace(/PIRATE'S POKER/g,'POKER').replace(/MIA'S/g,"DEALER'S").replace(/MIA WINS/g,'DEALER WINS');}
  for(const card of e.figure.querySelectorAll('[aria-label="Mia card face down"]'))card.setAttribute('aria-label','Dealer card face down');
  return out;
 }
 const game=games.get(key()),r=round();
 if(sceneKey!==key()){layer?.remove();panel?.remove();layer=null;panel=null;sceneKey=key();}
 if(game?.paint){if(!layer){layer=node('div','motel-casino-canvas');e.figure.append(layer);panel=node('section','motel-casino-panel');e.main.insertBefore(panel,e.choices);}
 const box=e.figure.getBoundingClientRect(),w=Math.min(box.width,box.height*(1672/941));layer.style.width=w+'px';layer.style.height=w*941/1672+'px';game.paint(layer,panel,r);let alert=panel.querySelector('.motel-casino-error');if(feedback){if(!alert){alert=node('p','motel-casino-error');alert.setAttribute('role','alert');panel.prepend(alert);}alert.textContent=feedback;}else alert?.remove();
 }return out;
};
const style=node('style');style.textContent=`
.r127-motel-casino[data-layout="motel-casino"] .gfx-image{object-fit:contain!important;object-position:center!important}
.motel-casino-canvas{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:5}
.motel-casino-canvas img{position:absolute;object-fit:contain}.motel-casino-panel{color:#fff;background:#0b0b0bf5;border:1px solid #977340;padding:8px;max-height:210px;overflow:auto;flex:0 0 auto;font:14px/1.35 system-ui,sans-serif}
.r127-motel-casino[data-layout="motel-casino"] .gfx-narrative{display:none}.motel-casino-panel:empty{display:none}.motel-casino-panel button,.motel-casino-panel select,.motel-casino-panel input{color:#fff;background:#151310;border:1px solid #b48a51;padding:7px;font:inherit;min-height:36px;box-sizing:border-box}.motel-casino-panel button{cursor:pointer}.motel-casino-panel button:disabled{opacity:.5}
.motel-casino-panel label{display:inline-flex;gap:6px;align-items:center;margin:3px}.motel-casino-panel p{margin:4px 0}.motel-casino-error{color:#ffd6b0;border:1px solid #b33b26;padding:5px;background:#35140e}.motel-casino-panel .casino-status{color:#ffdf86;font-weight:700}.motel-casino-panel table{border-collapse:collapse;width:100%;font-size:12px}.motel-casino-panel td,.motel-casino-panel th{padding:3px 6px;border:1px solid #59452e;text-align:center}
@media(max-width:600px){.r127-motel-casino .gfx-main{display:flex;flex-direction:column;min-height:0;overflow:hidden}.r127-motel-casino .gfx-art{flex:1 1 0;min-height:170px}.r127-motel-casino .gfx-choices{flex:0 0 auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));max-height:145px;min-height:44px;overflow-y:auto}.r127-motel-casino .gfx-choice{min-width:0;min-height:40px;padding:3px 6px}.motel-casino-panel{flex:0 1 auto;min-height:90px;max-height:270px;font-size:14px;overflow:auto;box-sizing:border-box}}
@media(prefers-reduced-motion:reduce){.motel-casino-canvas *{animation-duration:.01ms!important}}
`;document.head.append(style);
games.set('poker',{title:'POKER'});
globalThis.MotelCasino={register:(id,game)=>games.set(id,game),games,here,active,key,round,asset,node,choices,open,floor,render,allowed,
 commit,locked,notice,liveAnimations,command:cmd=>handleCommand(cmd).then(()=>GraphicalUI.sync()),status:(r)=>r?.status==='settled'?r.message+' · Wager '+r.bet+' / Return '+r.payout+' / Net '+(r.payout-r.bet)+' Bolts':'Choose your wager. No turns consumed.'};
// The shared numeric entry's All shortcut is not offered at this venue.
const nativeEntryOpen=FocusedEntry.open;
FocusedEntry.open=function(...args){const result=nativeEntryOpen.apply(this,args);if(active()&&round()?.custom&&this.dialog)for(const button of this.dialog.querySelectorAll('button'))if(/^all$/i.test(button.textContent.trim()))button.remove();return result;};
})();
