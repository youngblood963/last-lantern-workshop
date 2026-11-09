(()=>{'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
let inWork=false;
const jen=()=>stage==='mercy'&&mercyLocation==='jen'&&!!player.flags.jenInDialogue;
const publish=DevtestMenuModel.publish;
function showWork(){
 const f=player.flags;
 publish('jen-work',[
  ['supply-crate',"DELIVER JEN'S SUPPLY CRATE",f.jenQuest==='recovered'],
  ['runner-token',"DELIVER RUNNER'S TOKEN",f.jenQuest==='rescued'],
  ['shipment','ASK ABOUT MISSING SHIPMENT'],
  ['settle-tab','SETTLE UNPAID TAB',f.jenUnpaidTab==='active'],
  ['unpaid-tab','ASK ABOUT UNPAID TAB'],
  ['report-familiar-face','TELL JEN ABOUT THE FAMILIAR FACE',f.jenFamiliarFace==='active'&&storyHasValeEvidence()],
  ['familiar-face','A FAMILIAR FACE'],
  ['daniel','ASK ABOUT DANIEL',!!f.r18ClaraMet&&f.r18DanielQuest!=='done'],
  ['stew','ASK ABOUT WASTELAND STEW',!!r18StewReady()],
  ['courier','DELIVER JEN LETTER',!!r18CourierEligible('jen')],
  ['relay','ASK ABOUT RELAY STATION',!f.relayUnlocked&&f.relayQuest==='ask'],
  ['back','BACK TO JEN',true,'jen-dialogue']
 ]);
}
showBarActions=function(){
 inWork=false;
 storyValeReunion();
 player.flags.solaceMenu='bar';
 player.flags.jenInDialogue=false;
 publish('rusty-lantern',[
  ['drinks','(B) BUY DRINKS'],
  ['gamble','(G) GAMBLE'],
  ['room',player.flags.rustyRoomOwned?'(R) YOUR ROOM':'(R) BUY ROOM — 2000 BOLTS',
   !!player.flags.rustyRoomOwned||player.bolts>=2000],
  ['jen','(J) SMALL TALK JEN'],
  ['visitor',currentTownWanderer?'TALK TO '+currentTownWanderer.toUpperCase():'',!!currentTownWanderer],
  ['sell','SELL ITEMS'],
  ['return','(T) RETURN TO TOWN',true,'solace']
 ]);
};
const jenIntro={
 active:'Jen keeps glancing toward the south gate. The runner is still missing.',
 cart:"Jen asks whether you've searched the cart marked on the eastern road.",
 recovered:'Jen sees the supply crate and rises from behind the bar.',
 hideout:'Jen has the supplies, but her runner is still out there.',
 raiders:'Jen waits for news from the abandoned checkpoint.',
 rescued:"Jen sees the runner's token and lets out a breath.",
 done:"Jen smiles. The runner is home. Your drinks still aren't free."
};
const previousTalk=npcTalk;
npcTalk=function(name,...args){
 if(stage!=='mercy'||name.toLowerCase()!=='jen')return previousTalk.call(this,name,...args);
 // Shared npcTalk has no separate Jen menu hook. Preserve its entry effects
 // and introduction here, then publish choices without intercepting output.
 mercyLocation='jen';
 player.flags.solaceMenu='dialogue';
 player.flags.jenInDialogue=true;
 storyValeReunion();
 r18FoodSync();
 const quest=player.flags.jenQuest;
 if(quest==='recovered')add("DELIVER JEN'S SUPPLY CRATE — available now",'reward');
 if(quest==='rescued')add("DELIVER RUNNER'S TOKEN — available now",'reward');
 add('JEN','place');
 v48NpcIntro('jen',jenIntro[quest]||'Jen leans against the bar and gives you her full attention.',quest||'none',true);
 if(inWork)return showWork();
 // These shared eligibility reads also synchronize food and courier state.
 r18StewReady();
 r18CourierEligible('jen');
 publish('jen-dialogue',[
  ['work','ASK ABOUT WORK'],
  ['rumors','ASK RUMORS'],
  ['back','(B) BACK',true,'rusty-lantern']
 ]);
};
const previousSmallTalk=smallTalk;
smallTalk=function(name,...args){
 if(stage!=='mercy'||name!=='jen')return previousSmallTalk.call(this,name,...args);
 // Expansion's generic smallTalk closes over the original npcTalk.
 townWandererFocus=null;
 mercyLocation='jen';
 v50OldSmallTalk(name);
 return npcTalk(name);
};
const beforeCore=handleCommandCore;
handleCommandCore=async function(raw){
 if(stage==='mercy'&&mercyLocation==='jen'&&!busy&&!player.flags.pendingQuestOffer){
  const rawCmd=String(raw??'').trim().toLowerCase();
  const cmd=String(numberedChoices[rawCmd]||currentHotkeys[rawCmd]||rawCmd).trim().toLowerCase();
  if(player.flags.solaceMenu==='bar'&&player.flags.rustyRoomOwned&&cmd==='your room'){
   return beforeCore.call(this,'room');
  }
  if(jen()&&(cmd==='ask about work'||cmd==='about work')){
   inWork=true;
   add('JEN — WORK','place');
   return showWork();
  }
  if(jen()&&inWork&&['back','b','back to jen'].includes(cmd)){
   inWork=false;
   return npcTalk('jen');
  }
 }
 return beforeCore.apply(this,arguments);
};
})();
