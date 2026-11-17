/* DEVTEST only. Non-slot betting cap + differentiated Rat Racing.
 * Slot payouts / stakes and animations are unchanged. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof r11RaceDraw!=='function'||typeof GraphicalUI==='undefined')return;
const MAX=1000,odds=[.40,.30,.20,.10],returns=[2,3,4,9];
const slots=r=>r&&String(r.game).toLowerCase()==='slots';
const wagerCommand=v=>Number(String(v).match(/^(?:wager|bet)\s+(\d+)(?:\s+bolts?)?$/i)?.[1]);
const isAllIn=v=>/^(?:all in|all-in|bet all|a|confirm even all in)$/i.test(String(v||'').trim());
const oldSolaceWager=casinoWager;
casinoWager=function(command,round){
 const n=wagerCommand(command);
 if(round&&!slots(round)&&Number.isFinite(n)&&n>MAX)return false;
 return oldSolaceWager.apply(this,arguments);
};
const oldHarborWager=r6Wager;
r6Wager=function(bet){
 const r=r6Round(),n=Number(bet);
 if(r&&!slots(r)&&Number.isFinite(n)&&n>MAX)return false;
 return oldHarborWager.apply(this,arguments);
};
// The same six-button menu in either non-slot casino.
const oldMenu=casinoWagerMenu;
casinoWagerMenu=function(){
 const r=stage==='r6Casino'?r6Round():casinoRound();
 if(!r||slots(r))return oldMenu.apply(this,arguments);
 outputQueue=outputQueue.then(()=>{
  currentHotkeys={c:'custom wager',b:'back'};
  numberedChoices={1:'wager 10',2:'wager 50',3:'wager 100',4:'wager 500'};
  usedHotkeys=new Set(['c','b']);
  for(const label of ['[1] WAGER 10 BOLTS','[2] WAGER 50 BOLTS','[3] WAGER 100 BOLTS',
                      '[4] WAGER 500 BOLTS','[C] CUSTOM','[B] BACK'])
   addImmediate(label,'system');
  followOutput();
  GraphicalUI.schedule();
 });
};
// Reject All In in the command layer as well as removing its button.
const oldSolaceCommand=handleCasinoCommand;
handleCasinoCommand=function(cmd){
 const r=casinoRound();
 if(r?.status==='waiting'&&!slots(r)&&isAllIn(cmd)){
  delete r.allInEven;
  add('ALL IN is no longer available. Maximum wager: 1,000 Bolts.','system');
  casinoRender();return true;
 }
 return oldSolaceCommand.apply(this,arguments);
};
const oldHarborCommand=r6CasinoCommand;
r6CasinoCommand=function(cmd){
 const r=r6Round();
 if(r?.status==='waiting'&&!slots(r)&&isAllIn(cmd)){
  add('ALL IN is no longer available. Maximum wager: 1,000 Bolts.','system');
  r6CasinoRender();return true;
 }
 return oldHarborCommand.apply(this,arguments);
};
// Preserve old return/ledger and animation paths; change only rat odds and multipliers.
// Elephant's Luck uses the same weighted r11RaceDraw calculation as Crab Racing.
casinoRatWinner=function(){return r11RaceDraw(odds,casinoRound()?.pick);};
casinoResolveRats=function(r){
 r.winner=casinoRatWinner();
 const win=Number.isInteger(r.pick)&&r.pick>=0&&r.pick<4&&r.pick===r.winner;
 casinoSettle(r,win?returns[r.pick]*r.bet:0,
  CASINO_RATS[r.winner]+' WINS — '+(win?'YOUR RAT WINS':'YOUR RAT LOSES'));
 add('Nibbles bursts ahead. Rustbucket starts slowly and finishes strong. Sir Squeaks-a-Lot doubles back; Cheeseburger stops for a bite.');
 const art=casinoRatFrames(r.winner);
 casinoAnimate(art.frames,art.final);
};
// Show wager rules and weighted rat odds while keeping original menu processing.
const prevSolaceRender=casinoRender;
casinoRender=function(){
 const r=casinoRound();
 if(r?.allInEven)delete r.allInEven;
 if(r?.game==='rats'&&r.status==='waiting'&&r.pick===null)
  add('RAT ODDS / TOTAL RETURN: Nibbles 40% / 2x; Rustbucket 30% / 3x; Sir Squeaks-a-Lot 20% / 4x; Cheeseburger 10% / 9x.','system');
 if(r?.custom&&r.status==='waiting'&&!slots(r))
  add('CUSTOM WAGER — enter 1 to 1,000 Bolts'+(r.game==='blackjack'?' (even numbers only).':'.'),'system');
 return prevSolaceRender.apply(this,arguments);
};
const prevHarborRender=r6CasinoRender;
r6CasinoRender=function(){
 const r=r6Round();
 if(r?.custom&&r.status==='waiting'&&!slots(r))add('CUSTOM WAGER — enter 1 to 1,000 Bolts.','system');
 return prevHarborRender.apply(this,arguments);
};
// Display the actual odds alongside the rat selection (without changing its command).
const prevChoices=GraphicalUI.choices;
GraphicalUI.choices=function(...args){
 const rows=prevChoices.apply(this,args),r=casinoRound();
 if(r?.game!=='rats'||r.status!=='waiting'||r.pick!==null)return rows;
 return rows.map(row=>{
  const m=String(row.command||'').match(/^rat\s+([1-4])(?:\s|$)/i);
  if(!m)return row;
  const i=Number(m[1])-1;
  return {...row,label:CASINO_RATS[i]+' · '+Math.round(odds[i]*100)+'% / '+returns[i]+'x'};
 });
};
// The graphical numeric entry must reflect the wager cap too, rather
// than suggesting the player's entire balance is an acceptable custom bet.
if(typeof FocusedEntry!=='undefined'){
 const prevDescribe=FocusedEntry.describe;
 FocusedEntry.describe=function(...args){
  const d=prevDescribe.apply(this,args),r=stage==='r6Casino'?r6Round():stage==='mercy'&&mercyLocation==='casinoGame'?casinoRound():null;
  if(d&&r?.status==='waiting'&&r.custom&&!slots(r)){
   return {...d,max:Math.min(MAX,player.bolts),
    hint:'Maximum 1,000 Bolts.'+(r.game==='blackjack'?' Even-numbered bets only.':'')};
  }
  return d;
 };
}
globalThis.Route127CasinoWagerPolicy={maximum:MAX,ratOdds:[...odds],ratReturns:[...returns]};
})();