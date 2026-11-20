/* DEVTEST roadside choice repair. */
(()=>{'use strict';if(!location.pathname.includes('/route127/devtest/'))return;
const original=resolveEncounter;
resolveEncounter=function(cmd){
 const title=currentEncounter()?.title,c=String(cmd).toLowerCase();
 if(title==='THE MILK CRATES'&&c.includes('question the hunters')){
  add('The hunter holds up a photograph and asks whether you have seen the person. His companions watch for your answer.','system');renderCurrentChoices();return;
 }
 if(title==='THE STEEL ORCHARD'&&c.includes('examine the keepsakes')){
  add('You examine the keepsakes carefully. Martha waits for your response.','system');renderCurrentChoices();return;
 }
 const encounter=currentEncounter();
 const offered=encounter&&encounterChoices(encounter).split(/\s{2,}/).some(label=>choiceCommand(label)===c);
 if(!offered)return original.apply(this,arguments);
 // A recognized action can legitimately fail a prerequisite. Keep the
 // handler's explanation and retry menu instead of also reporting bad input.
 const write=add;
 let explained=false;
 add=function(message,...args){
  if(String(message)==="That's not an option."){
   if(explained)return;
  }else if(String(message??'').trim())explained=true;
  return write.call(this,message,...args);
 };
 try{return original.apply(this,arguments);}
 finally{add=write;}
};

const oldCombat=startCombat;
startCombat=function(spec,source,...rest){
 if(spec?.r18WardenId){
  const level=Math.min(50,Math.max(12,(Number(player.level)||1)+8));
  spec={...spec,level,hp:Math.max(90,Math.floor(baseHpForLevel(level)*.62)),armorDef:Math.max(3,spec.armorDef||0)};
 }
 return oldCombat.call(this,spec,source,...rest);
};
})();
