(()=>{'use strict';
if(!/(?:^|\/)route127\/(?:playtest|devtest)\/(?:index\.html)?$/.test(location.pathname))return;
let inWork=false;
const jen=()=>stage==='mercy'&&mercyLocation==='jen'&&!!player.flags.jenInDialogue;
function workOptions(){
const f=player.flags,items=[];
if(f.jenQuest==='recovered')items.push("DELIVER JEN'S SUPPLY CRATE");
if(f.jenQuest==='rescued')items.push("DELIVER RUNNER'S TOKEN");
items.push('ASK ABOUT MISSING SHIPMENT');
if(f.jenUnpaidTab==='active')items.push('SETTLE UNPAID TAB');
items.push('ASK ABOUT UNPAID TAB');
if(f.jenFamiliarFace==='active'&&typeof storyHasValeEvidence==='function'&&storyHasValeEvidence())items.push('TELL JEN ABOUT THE FAMILIAR FACE');
items.push('A FAMILIAR FACE');
if(f.r18ClaraMet&&f.r18DanielQuest!=='done')items.push('ASK ABOUT DANIEL');
if(typeof r18StewReady==='function'&&r18StewReady())items.push('ASK ABOUT WASTELAND STEW');
if(typeof r18CourierEligible==='function'&&r18CourierEligible('jen'))items.push('DELIVER JEN LETTER');
if(!f.relayUnlocked&&f.relayQuest==='ask')items.push('ASK ABOUT RELAY STATION');
items.push('BACK TO JEN');
return items;
}
const beforeAdd=add;
add=function(value='',cls=''){
const s=String(value);
if(jen()&&cls.includes('system')&&s.includes('ASK ABOUT SOLACE   ASK ABOUT ROAD   ASK ABOUT WORK   ASK RUMORS')&&s.includes('ASK ABOUT MISSING SHIPMENT')){
return beforeAdd((inWork?workOptions():['ASK ABOUT WORK','ASK RUMORS','(B) BACK']).join('   '),cls);
}
return beforeAdd(value,cls);
};
const beforeBar=showBarActions;
showBarActions=function(...args){inWork=false;return beforeBar.apply(this,args);};
const beforeCore=handleCommandCore;
handleCommandCore=async function(raw){
if(jen()&&!busy&&!player.flags.pendingQuestOffer){
const rawCmd=String(raw??'').trim().toLowerCase();
const cmd=String(numberedChoices[rawCmd]||currentHotkeys[rawCmd]||rawCmd).trim().toLowerCase();
if(cmd==='ask about work'||cmd==='about work'){
inWork=true;add('JEN — WORK','place');add(workOptions().join('   '),'system');return;
}
if(inWork&&['back','b','back to jen'].includes(cmd)){
inWork=false;npcTalk('jen');return;
}
}
return beforeCore.apply(this,arguments);
};
})();