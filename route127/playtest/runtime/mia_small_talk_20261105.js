/* WO45 — DEVTEST only: move Mia's House Rules quest under Small Talk.
 * Preserve canonical R11 quest state, rewards, acceptance, and save handling.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name==='DEVTEST' ||
    typeof port55MiaMenu!=='function' || typeof r11QuestMenu!=='function')return;

 port55MiaMenu=function(){
  stage='port55Mia';
  if((Number(day)||1)<(Number(player.flags.r18MiaBarredUntil)||0)){
   add('MIA > Not until day '+player.flags.r18MiaBarredUntil+'. Leave.','danger');
   return port55Submenu('The Rusty Anchor — Service Refused',['RETURN TO HARBOR']);
  }
  return port55Submenu('The Rusty Anchor — Mia',[
   'SMALL TALK','BUY DRINKS','GAMBLE',
   player.flags.r6AnchorRoomOwned?'GO TO ROOM':'RENT ROOM — 2000 BOLTS',
   ...(typeof r18RedAllowed==='function'&&r18RedAllowed()?['TALK TO RED']:[]),
   'RETURN TO HARBOR'
  ]);
 };

 function talkMenu(){
  stage='port55MiaTalk';
  port55Submenu('The Rusty Anchor — Mia — Small Talk',[
   'ASK ABOUT SEAPORT',
   'ASK ABOUT THE RUSTY ANCHOR',
   'ASK ABOUT MIA',
   ...(portRecruitUnlocked()?['ASK ABOUT HOUSE RULES']:[]),
   'BACK'
  ]);
 }
 const replies={
  'ask about seaport':"MIA > Seaport was here before the fishermen and it'll be here after us. Folks just need somewhere to come in from the cold.",
  'ask about the rusty anchor':"MIA > This old place has survived storms, thieves, and worse customers. The trick is keeping the drinks flowing and the trouble outside.",
  'ask about mia':"MIA > I'm Mia. I run the Anchor. That's all you need for now, sweetheart."
 };
 // A dedicated small-talk stage keeps the quest under Mia's conversation
 // without teaching the existing R11 handler a new quest or changing its flags.
 const previousCore=handleCommandCore;
 handleCommandCore=async function(raw){
  const input=String(raw??'').trim();
  const mapped=/^\d+$/.test(input)?numberedChoices[input]:null;
  const cmd=String(mapped||input).trim().toLowerCase();
  const meta=/^(save|load|inventory|status|quests|map|testing|test off)(?:\s|$)/;
  if(!busy&&!meta.test(cmd)){
   if(stage==='port55Mia'&&cmd==='small talk'){
    talkMenu();return;
   }
   if(stage==='port55MiaTalk'){
    if(['back','b','return','return to mia'].includes(cmd)){
     port55MiaMenu();return;
    }
    if(cmd==='ask about house rules'&&portRecruitUnlocked()){
     r11QuestMenu('houseRules');return;
    }
    if(replies[cmd]){
     add(replies[cmd],'bright');talkMenu();return;
    }
    talkMenu();return;
   }
  }
  return previousCore.apply(this,arguments);
 };
 const previousRender=renderCurrentChoices;
 renderCurrentChoices=function(){
  if(stage==='port55MiaTalk')return talkMenu();
  return previousRender.apply(this,arguments);
 };
 // Preserve tavern imagery inside Mia's nested conversation.
 if(typeof GraphicalUI!=='undefined'){
  const previousModel=GraphicalUI.model;
  GraphicalUI.model=function(...args){
   const model=previousModel.apply(this,args);
   if(stage==='port55MiaTalk'){
    model.art='../devtest/assets/locations/rusty_anchor.png?v=wo34-art-refresh';
    model.title='The Rusty Anchor — Mia';
   }
   return model;
  };
 }
})();
