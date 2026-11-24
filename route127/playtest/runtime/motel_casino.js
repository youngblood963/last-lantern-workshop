/* The Lounge: DEVTEST-only adapter over the existing R6 casino journal/transactions. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST')return;
const poker="PIRATE'S POKER",games=['POKER','SLOTS','BIG SIX WHEEL','KENO','ROULETTE'];
const here=()=>Route127Motel.here(),at=()=>here()&&player.flags.motelRoom==='casino';
const round=()=>{const r=r6Round();return r?.location==='motel'?r:null;};
const inGame=()=>at()&&stage==='r6Casino'&&!!round();
const name=r=>r.game===poker?'POKER':r.game;
const choices=labels=>DevtestMenuModel.publishQueued('motel-casino-'+stage,labels,labels.at(-1),r5DirectChoices,{direct:true});
function menu(){if(player.turns<=0&&!testMode)return noTurnsMenu();screen.replaceChildren();player.flags.motelRoom='casino';player.flags.port55Casino=false;stage='motelCasino';choices([...games,'BACK']);}
function open(game){if(player.turns<=0&&!testMode){noTurnsMenu();return false;}if(!games.includes(game))return false;const prev=round();if(prev?.status==='active')return false;
 screen.replaceChildren();player.flags.motelRoom='casino';player.flags.port55Casino=false;
 player.flags.r6Game={game:game==='POKER'?poker:game,location:'motel',status:'waiting',bet:0,id:crypto.randomUUID(),ticket:[1,2],bets:[],stake:10};
 stage='r6Casino';r6CasinoSave();render();return true;
}
const nativeRender=r6CasinoRender;
function render(){
 const r=round();if(!r)return menu();stage='r6Casino';addImmediate(name(r),'place');
 if(r.status==='settled'){
  addImmediate(r.message,'reward');addImmediate(`WAGER ${r.bet} / RETURN ${r.payout} / NET ${r.payout-r.bet} Bolts`,'system');
  return choices(['PLAY AGAIN','BACK']);
 }
 if(r.game===poker&&r.status==='active')return nativeRender();
 if(r.game===poker)addImmediate('Five-card draw. Replace up to three cards once, or stand. Win: 2× total return; tie: stake returned.','system');
 if(r.game==='SLOTS')addImmediate('Three matching symbols: Wrenches 10× / Cherries 18× / Car 28× / Dice 50× / Gas Pump 70× / Record 300×. Other combinations return zero.','system');
 if(r.game==='BIG SIX WHEEL'){
  addImmediate('Six equal segments, each 1 in 6. A matching number returns 5× your stake (4:1 net).','system');
  if(!r.pick)return choices([1,2,3,4,5,6].map(n=>'NUMBER '+n).concat('BACK'));
  addImmediate('YOUR NUMBER: '+r.pick,'bright');
 }
 if(r.game==='KENO'){
  addImmediate('Select 2–10 unique numbers from 1–80. Twenty are drawn. Ticket and payout table are shown before you wager.','system');
  addImmediate('TICKET: '+r.ticket.join(', ')+' | TOTAL RETURNS: '+Object.entries(KENO[r.ticket.length]).map(([hits,m])=>hits+' matches '+m+'×').join('; '),'system');
 }
 if(r.game==='ROULETTE'){
  addImmediate('European single zero. Place chips on the felt. Combined stakes: 1–1,000 Bolts. Zero loses ordinary outside bets.','system');
  addImmediate('CHIPS: '+r.bets.reduce((s,b)=>s+b.amount,0)+' Bolts. Set chip with WAGER <amount>. BBS bet: PLACE <bet id>.','system');
  return choices(['CHIP 10','CUSTOM','UNDO BET','CLEAR BETS','SPIN','BACK']);
 }
 if(r.custom){addImmediate('CUSTOM WAGER — enter 1 to 1,000 whole Bolts.','system');return choices(['BACK']);}
 return choices(r.game==='SLOTS'?['WAGER 10','WAGER 20','WAGER 50','BACK']:['WAGER 10','WAGER 50','WAGER 100','WAGER 500','CUSTOM','BACK']);
}
r6CasinoRender=function(){return inGame()?render():nativeRender.apply(this,arguments);};
const nativeHands=r11PokerHands;
r11PokerHands=function(r,hidden){if(r?.location!=='motel')return nativeHands.apply(this,arguments);if(GraphicalUI.preference()==='graphics')return;outputQueue=outputQueue.then(()=>{addImmediate('YOUR CARDS','system');r11CardRows(r.hand);addImmediate('DEALER’S CARDS','system');r11CardRows(r.dealer,hidden);followOutput();});};
const nativeSettle=r6Settle;
r6Settle=function(payout,message){return nativeSettle.call(this,payout,inGame()?String(message).replace(/MIA/g,'DEALER').replace(/Mia/g,'Dealer'):message);};
const nativeWager=r6Wager;
r6Wager=function(bet){
 if(!inGame())return nativeWager.apply(this,arguments);
 const r=round();
 if(!Number.isSafeInteger(bet)||bet<1||bet>1000||bet>player.bolts||r.status!=='waiting'||player.turns<=0&&!testMode)return false;
 if(r.game==='BIG SIX WHEEL'&&![1,2,3,4,5,6].includes(r.pick))return false;
 if(r.game==='KENO'&&!validTicket(r.ticket))return false;
 if(r.game==='ROULETTE'&&(!r.bets.length||r.bets.some(c=>!BETS.some(b=>b.id===c.id)||!Number.isSafeInteger(c.amount)||c.amount<1)||bet!==r.bets.reduce((s,b)=>s+b.amount,0)))return false;
 const maximum=r.game==='KENO'?100000:r.game==='SLOTS'?300:36;
 if(!Number.isSafeInteger(player.bolts)||player.bolts>Number.MAX_SAFE_INTEGER-bet*maximum)return false;
 r11CasinoBaseline();
 // Generate and persist the committed outcome with the debit, before any animation.
 if(r.game==='BIG SIX WHEEL')r.winner=1+Math.floor(Math.random()*6);
 if(r.game==='KENO')r.draw=drawNumbers(20);
 if(r.game==='ROULETTE')r.winner=Math.floor(Math.random()*37);
 if(r.game==='SLOTS'){r.reels=[casinoSlotDraw(),casinoSlotDraw(),casinoSlotDraw()];r.committedPayout=casinoSlotPayout(r.reels,bet);}
 if(!nativeWager.call(this,bet))return false;
 if(r.game===poker)return true;
 resume(r);
 render();return true;
};
function resume(r){
 if(r.status!=='active')return;
 if(r.game==='SLOTS')r6Settle(r.committedPayout,r.reels.map(s=>slotLabel(s)).join(' / '));
 if(r.game==='BIG SIX WHEEL')r6Settle(r.winner===r.pick?r.bet*5:0,'WINNING NUMBER: '+r.winner+(r.winner===r.pick?' — YOU WIN':' — NO MATCH'));
 if(r.game==='KENO'){r.hits=r.ticket.filter(n=>r.draw.includes(n));r6Settle((KENO[r.ticket.length][r.hits.length]||0)*r.bet,r.hits.length+' MATCHES — '+r.hits.join(', ')+' | DRAW: '+r.draw.join(', '));}
 if(r.game==='ROULETTE')r6Settle(rouletteReturn(r.bets,r.winner),'WINNING POCKET: '+r.winner+(r.winner===0?' GREEN':RED.has(r.winner)?' RED':' BLACK'));
}
const nativeCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=v53Normalize(r5Mapped(raw));
 if(here()&&!busy&&stage==='motelLounge'&&cmd==='gamble'){menu();r6CasinoSave();return;}
 if(at()&&!busy&&['motelCasino','r6Casino'].includes(stage)){
  if(/^(?:save|load|inventory|status|map|quests)(?: |$)/.test(cmd)||['i','s','m','q','v'].includes(cmd))return nativeCore.apply(this,arguments);
  const r=round();
  if(stage==='motelCasino'){
   if(['back','b'].includes(cmd))return Route127Motel.open('lounge');
   const game=games.find(g=>g.toLowerCase()===cmd);if(game)return open(game);return menu();
  }
  if(['back','b'].includes(cmd)){
   if(r.custom){delete r.custom;return render();}
   if(r.status==='active'){if(r.game===poker)r6Settle(0,'Round abandoned — wager forfeited.');else resume(r);}
   delete player.flags.r6Game;menu();r6CasinoSave();return;
  }
  if(r.status==='settled'){if(cmd==='play again')return open(name(r));return render();}
  if(r.status==='active'&&r.game===poker)return r6CasinoCommand(cmd);
  if(r.status!=='waiting')return render();
  if(cmd==='custom'||cmd==='custom wager'){if(r.game==='SLOTS')return render();r.custom=true;return render();}
  const wager=cmd.match(/^(?:wager|bet|chip) (\d+)$/)||r.custom&&cmd.match(/^(\d+)$/);
  if(wager){const n=Number(wager[1]);if(r.game==='ROULETTE'){if(Number.isSafeInteger(n)&&n>=1&&n<=1000){r.stake=n;delete r.custom;r6CasinoSave();}else addImmediate('Chip must be 1–1,000 Bolts.','danger');}else if(r6Wager(n))return;else addImmediate('Invalid wager. You need enough Bolts and an allowed whole-number stake. Maximum 1,000; slots 10 / 20 / 50.','danger');return render();}
  const pick=cmd.match(/^number ([1-6])$/);if(pick&&r.game==='BIG SIX WHEEL'){r.pick=+pick[1];r6CasinoSave();return render();}
  if(r.game==='KENO'){
   if(cmd==='quick pick')setTicket(drawNumbers(r.ticket.length));
   const t=cmd.match(/^ticket ([\d ,]+)$/);if(t&&!setTicket(t[1].split(/[ ,]+/).map(Number)))addImmediate('Choose 2–10 unique numbers between 1 and 80.','danger');
  }
  if(r.game==='ROULETTE'){
   if(cmd==='undo bet')r.bets.pop();else if(cmd==='clear bets')r.bets=[];else if(cmd==='spin'){if(r6Wager(r.bets.reduce((s,b)=>s+b.amount,0)))return;else addImmediate('Place affordable chips first. Combined maximum: 1,000 Bolts.','danger');}
   else if(cmd.startsWith('place '))place(cmd.slice(6));
   r6CasinoSave();
  }
  return render();
 }
 return nativeCore.apply(this,arguments);
};
const oldModel=GraphicalUI.model;
GraphicalUI.model=function(){const m=oldModel.apply(this,arguments);if(at()&&['motelCasino','r6Casino'].includes(stage)){
 const r=round();m.art=new URL('../devtest/assets/locations/'+(stage==='motelCasino'?'motel_casino.png':r?.game===poker?'casino/motel_poker_table.webp':'casino/'+({SLOTS:'motel_slot_machine.png','BIG SIX WHEEL':'motel_bigsix_background.png',KENO:'motel_keno_board.png',ROULETTE:'motel_roulette_background.png'}[r?.game]||'motel_slot_machine.png')),document.baseURI).href;
 m.title=stage==='r6Casino'?name(r):'THE LOUNGE — CASINO';m.regionalSky=null;m.scenarioBackdrop=null;
 m.layout=r?.game===poker&&stage==='r6Casino'?'motel-poker':'motel-casino';
 }return m;};
const oldLoad=loadGame;
loadGame=function(){const result=oldLoad.apply(this,arguments);if(at()&&round()){
 stage='r6Casino';resume(round());render();
 }return result;};
const oldChoices=renderCurrentChoices;
renderCurrentChoices=function(){if(at()&&['motelCasino','r6Casino'].includes(stage))return stage==='motelCasino'?menu():render();return oldChoices.apply(this,arguments);};
const KENO={2:{2:12},3:{2:2,3:42},4:{2:1,3:4,4:100},5:{3:2,4:20,5:800},6:{3:1,4:7,5:50,6:1600},7:{3:1,4:2,5:20,6:400,7:7000},8:{4:2,5:10,6:50,7:1000,8:10000},9:{4:1,5:5,6:25,7:200,8:4000,9:25000},10:{5:2,6:20,7:80,8:500,9:5000,10:100000}};
const validTicket=t=>Array.isArray(t)&&t.length>=2&&t.length<=10&&new Set(t).size===t.length&&t.every(n=>Number.isInteger(n)&&n>=1&&n<=80);
function drawNumbers(count){const pool=Array.from({length:80},(_,i)=>i+1);for(let i=0;i<count;i++){const j=i+Math.floor(Math.random()*(80-i));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,count);}
function setTicket(t){const r=round();if(r?.game!=='KENO'||r.status!=='waiting'||!validTicket(t))return false;r.ticket=[...t];r6CasinoSave();return true;}
const ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const BETS=[];
function addBet(id,label,numbers,mult){BETS.push({id,label,numbers,mult});}
for(let n=0;n<=36;n++)addBet('n'+n,String(n),[n],36);
for(let row=0;row<12;row++){
 const start=1+row*3;
 addBet('street'+start,'Street '+start+'–'+(start+2),[start,start+1,start+2],12);
 if(row<11)addBet('six'+start,'Six-line '+start+'–'+(start+5),Array.from({length:6},(_,i)=>start+i),6);
 for(let col=0;col<3;col++){
  const n=start+col;
  if(col<2)addBet('split'+n+'-'+(n+1),'Split '+n+'/'+(n+1),[n,n+1],18);
  if(row<11)addBet('split'+n+'-'+(n+3),'Split '+n+'/'+(n+3),[n,n+3],18);
  if(row<11&&col<2)addBet('corner'+n,'Corner '+n+'/'+(n+1)+'/'+(n+3)+'/'+(n+4),[n,n+1,n+3,n+4],9);
 }
}
addBet('corner0','First four 0/1/2/3',[0,1,2,3],9);
for(let n=1;n<=3;n++)addBet('split0-'+n,'Split 0/'+n,[0,n],18);
for(let k=0;k<3;k++){addBet('dozen'+(k+1),'Dozen '+(k+1),Array.from({length:12},(_,i)=>k*12+i+1),3);addBet('column'+(k+1),'Column '+(k+1),Array.from({length:12},(_,i)=>k+1+i*3),3);}
for(const [id,label,predicate]of [['red','Red',n=>RED.has(n)],['black','Black',n=>!RED.has(n)],['odd','Odd',n=>n%2],['even','Even',n=>n%2===0],['low','1–18',n=>n<=18],['high','19–36',n=>n>=19]])addBet(id,label,Array.from({length:36},(_,i)=>i+1).filter(predicate),2);
function place(id){const r=round(),b=BETS.find(b=>b.id===id),total=r?.bets.reduce((s,b)=>s+b.amount,0)||0;if(!inGame()||r.game!=='ROULETTE'||r.status!=='waiting'||!b)return false;
 if(total+r.stake>1000||total+r.stake>player.bolts){addImmediate('Not enough Bolts, or combined wager exceeds 1,000.','danger');return false;}
 r.bets.push({id,amount:r.stake});r6CasinoSave();return true;
}
function rouletteReturn(bets,winner){return bets.reduce((s,chip)=>{const b=BETS.find(b=>b.id===chip.id);return s+(b?.numbers.includes(winner)?chip.amount*b.mult:0);},0);}
const slotNames=['Wrenches','Cherries','Car','Dice','Gas Pump','Record'];
const slotLabel=s=>slotNames[SLOT_SYMBOLS.findIndex(x=>x.name===s)]||s;
const describe=FocusedEntry.describe;
FocusedEntry.describe=function(){const d=describe.apply(this,arguments);return d&&inGame()&&round()?.custom?{...d,max:Math.min(1000,player.bolts),hint:'Maximum 1,000 Bolts.'}:d;};
globalThis.MotelCasino=Object.freeze({here,at,inGame,round,menu,open,render,KENO,validTicket,drawNumbers,setTicket,ORDER,RED,BETS,place,rouletteReturn,slotNames});
})();
