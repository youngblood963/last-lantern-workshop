/* DEVTEST: make the existing pickpocket cooldown visible in Character status. */
(()=>{'use strict';if(!location.pathname.includes('/route127/devtest/'))return;
if(typeof TravelerPanels==='undefined')return;
const old=TravelerPanels.character;
TravelerPanels.character=function(...args){
 const result=old.apply(this,args);
 const next=Number(player.flags.r18CrimeCooldowns?.pickpocket)||0,days=Math.max(0,next-(Number(day)||1));
 if(days>0&&this.body){
  const note=this.node('p','traveler-eyebrow','STEALING COOLDOWN — '+days+' IN-GAME DAY'+(days===1?'':'S')+' REMAINING');
  note.setAttribute('role','status');this.body.appendChild(note);
 }
 return result;
};
})();