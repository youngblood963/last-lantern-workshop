/* DEVTEST roadside choice repair. */
(()=>{'use strict';if(!location.pathname.includes('/route127/playtest/'))return;
const original=resolveEncounter;
resolveEncounter=function(cmd){
 const title=currentEncounter()?.title,c=String(cmd).toLowerCase();
 if(title==='THE MILK CRATES'&&c.includes('question the hunters')){
  add('The hunter holds up a photograph and asks whether you have seen the person. His companions watch for your answer.','system');renderCurrentChoices();return;
 }
 if(title==='THE STEEL ORCHARD'&&c.includes('examine the keepsakes')){
  add('You examine the keepsakes carefully. Martha waits for your response.','system');renderCurrentChoices();return;
 }
 return original.apply(this,arguments);
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
