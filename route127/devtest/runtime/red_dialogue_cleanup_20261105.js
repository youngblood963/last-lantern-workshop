/* Route 127 DEVTEST — Red dialogue UI cleanup.
 * Preserve original R18 Red quest flags, outcome rewards, criminal penalties
 * and combat. Compact display and navigation only; no PLAYTEST change.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||
    typeof r18RedAllowed!=='function'||typeof r18RedState!=='function'||
    typeof GraphicalUI==='undefined')return;

 let page='conversation';
 const graphical=()=>GraphicalUI.active();
 const clean=()=>{if(graphical()&&screen)screen.replaceChildren();};
 const heading=()=>add('ELIAS “RED” HARPER — THE RUSTY ANCHOR','npc-blue');
 const norm=value=>String(value||'').trim().toLowerCase();

 function redChoices(){
  const q=r18RedState();
  const confronting=page==='poster'&&q.posterOpen&&!q.outcome;
  const options=confronting
   ? ['LET THE PAST STAY BURIED','FORGIVE RED','BLACKMAIL RED FOR 50 BOLTS','ATTACK RED','RETURN TO CONVERSATION']
   : ['ASK RED HIS NAME','ASK RED ABOUT SEAPORT','ASK RED ABOUT THE IRON PIT',
      'BUY RED A DRINK — 5 BOLTS',
      ...(player.flags.r18RedPosterSeen&&!q.outcome?[q.posterOpen?'DISCUSS THE WANTED POSTER':'SHOW THE WANTED POSTER']:[]),
      'RETURN TO MIA'];
  r5DirectChoices(options);
  // A previous conversation may leave a legacy B hotkey in the same menu.
  // The explicit RETURN button provides the only visible exit.
  if(currentHotkeys?.b==='back')delete currentHotkeys.b;
 }
 function redIntro(){
  const q=r18RedState();
  heading();
  add(q.outcome
    ? 'Red remembers your decision about the old poster.'
    : 'Red sits with a cup near the back wall. Mia treats him as an ordinary resident.','system');
  redChoices();
 }
 r18RedMenu=function(){
  if(!r18RedAllowed()){stage='port55Mia';return port55MiaMenu();}
  stage='r18Red';
  clean();
  redIntro();
 };
 r18RedCommand=function(raw){
  if(!r18RedAllowed())return r18RedMenu();
  const cmd=norm(raw);
  const q=r18RedState();
  if(['return to mia','back','b'].includes(cmd)&&page!=='poster'){
   page='conversation';stage='port55Mia';clean();return port55MiaMenu();
  }
  if(page==='poster'&&['return to conversation','back','b'].includes(cmd)){
   page='conversation';clean();return redIntro();
  }
  clean();heading();
  if(cmd==='ask red his name'){
   page='conversation';
   add('RED > Elias Harper. Red is easier. No, the harbor did not give me the name.','bright');
  }else if(cmd==='ask red about seaport'){
   page='conversation';
   add('RED > It is an honest day’s work here, usually. Keep your promises to Mia. She remembers the broken ones.','bright');
  }else if(cmd==='ask red about the iron pit'){
   page='conversation';
   add('RED > Three qualifying rings, one pass. The old motel runs the Deep End. A pass is permission to enter, not a road through a locked gate.','bright');
  }else if((cmd==='buy red a drink — 5 bolts'||cmd==='buy red a drink')){
   page='conversation';
   if(player.bolts<5)add('A drink costs 5 Bolts.','system');
   else{
    player.bolts-=5;updateHud();
    add('You spend 5 Bolts on a drink for Red.','system');
    add('Red thanks you for the drink. Neither of you mistakes it for an obligation.','bright');
   }
  }else if((cmd==='show the wanted poster'||cmd==='discuss the wanted poster')&&
           player.flags.r18RedPosterSeen&&!q.outcome){
   page='poster';
   if(!q.posterOpen){
    q.posterOpen=true;
    add('RED > I was there. The robbery happened. People died. The names on that paper are not all the people who gave the orders. I cannot prove the parts you would want proved.','bright');
    add('MIA > Talk quietly. You can ask questions here. You cannot turn my bar into a court or an execution ground.','system');
   }else{
    add('Red looks at the poster again. He waits for your decision.','system');
   }
  }else if(page==='poster'&&q.posterOpen&&!q.outcome){
   if(cmd==='let the past stay buried'||cmd==='forgive red'){
    q.outcome=cmd==='forgive red'?'forgiven':'buried';
    gainXp(Math.max(8,(Number(player.level)||1)*2));
    add(q.outcome==='forgiven'
     ? 'RED > You do not know all of it. Thank you for leaving me a chance to live differently.'
     : 'Red folds the poster and gives it back. The matter stays between you.','bright');
    page='conversation';
   }else if(cmd==='blackmail red for 50 bolts'){
    q.outcome='blackmailed';gainBolts(50);
    add('Red counts out 50 Bolts once. Mia watches without approval. He will not pay again.','reward');
    page='conversation';
   }else if(cmd==='attack red'){
    q.outcome='hostile';
    player.flags.r18MiaBarredUntil=(Number(day)||1)+3;
    v52Record('Assault','Elias Red Harper','Started a fight inside Mia’s Rusty Anchor',50);
    const level=Math.max(1,Math.min(50,Number(player.level)||1));
    startCombat({name:'ELIAS RED HARPER',level,
      hp:Math.max(20,Math.floor(baseHpForLevel(level)*.25)),
      min:3,max:6,xp:Math.max(20,level*5),bolts:0,
      end:'Red falls. Mia orders you out of the Anchor.'},'r18RedFight');
    return;
   }
  }
  // Show one response and one menu. Do not regenerate Red's introductory
  // paragraph after every action, or mix conversation with confrontation.
  redChoices();
 };

 // Red is inside the Rusty Anchor, not on the generic Seaport waterfront.
 const priorModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=priorModel.apply(this,args);
  if(stage==='r18Red'){
   model.title='The Rusty Anchor — Red';
   model.art='../devtest/assets/locations/rusty_anchor_red.png?v=wo44-red-portrait';
  }
  return model;
 };
})();
