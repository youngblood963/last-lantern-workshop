/* DEVTEST: batch ordinary workshop crafting, persistent single-job result. */
(()=>{'use strict';if(!location.pathname.includes('/route127/playtest/'))return;
const mats=r=>({Cloth:r.cloth||0,'Scrap Metal':r.scrap||0,Wire:r.wire||0,'Uncommon Electrical Parts':r.parts||0,'Tempered Steel':r.tempered||0,'Small Animal Bones':r.smallBones||0,'Animal Bones':r.bones||0,'Explosive Components':r.explosives||0,'Animal Hide':r.hide||0,...(r.materials||{})});
function maxBatch(r){
 let max=25;
 for(const [name,n]of Object.entries(mats(r)))if(n>0)max=Math.min(max,Math.floor(r6MaterialCount(name)/n));
 if(r.bolts>0)max=Math.min(max,Math.floor(player.bolts/r.bolts));
 return Math.max(0,max);
}
function menu(){
 const q=player.flags.devCraftQuote,r=q&&CRAFT_RECIPES[q.key];if(!r)return r11CraftMenu();
 stage='r11Craft';add('CRAFT '+r.name.toUpperCase()+' — SELECT QUANTITY','place');
 add('Available materials permit up to '+maxBatch(r)+' attempts. '+r.seconds+' seconds each.','system');
 r5DirectChoices(['CRAFT 1','CRAFT 5','CRAFT ALL','CUSTOM AMOUNT','CANCEL BATCH']);
}
const oldMenu=r11CraftMenu;
r11CraftMenu=function(...args){
 if(player.flags.devCraftQuote)return menu();
 return oldMenu.apply(this,args);
};
const oldCraft=r11CraftCommand;
r11CraftCommand=function(cmd){
 const q=player.flags.devCraftQuote,job=player.flags.v49MurphyJob;
 if(job?.devBatch&&cmd==='collect craft'){
  if(Date.now()<job.endsAt){add('Crafting is still in progress.','system');return r11CraftMenu();}
  const recipe=CRAFT_RECIPES[job.key],success=job.successes;
  if(success>0&&!addPack(job.outputName||recipe.name,recipe.type,success,true)){
   add('Your pack is full. Finished items remain at the workbench.','system');return r11CraftMenu();
  }
  delete player.flags.v49MurphyJob;
  add('BATCH COMPLETE — '+success+' succeeded, '+(job.quantity-success)+' failed.','reward');
  updateHud();if(typeof v49Autosave==='function')v49Autosave();return r11CraftMenu();
 }
 if(q){
  if(['cancel batch','back','b'].includes(cmd)){delete player.flags.devCraftQuote;return r11CraftMenu();}
  if(cmd==='custom amount'){q.custom=true;add('Enter a quantity (1–'+maxBatch(CRAFT_RECIPES[q.key])+')','system');return;}
  const r=CRAFT_RECIPES[q.key],max=maxBatch(r);
  const qty=cmd==='craft all'?max:cmd==='craft 5'?5:cmd==='craft 1'?1:q.custom&&/^\d+$/.test(cmd)?Number(cmd):0;
  if(!Number.isSafeInteger(qty)||qty<1||qty>max){
   add('Insufficient materials or invalid quantity. Nothing consumed.','system');return menu();
  }
  for(const [name,n]of Object.entries(mats(r)))if(n)r6ConsumeMaterial(name,n*qty);
  player.bolts-=r.bolts*qty;
  let successes=0;
  for(let i=0;i<qty;i++)if(Math.random()<r.chance)successes++;
  player.flags.v49MurphyJob={key:q.key,devBatch:true,quantity:qty,successes,
   endsAt:Date.now()+r.seconds*qty*1000};
  delete player.flags.devCraftQuote;
  updateHud();if(typeof v49Autosave==='function')v49Autosave();
  add('BATCH STARTED — '+qty+' × '+r.name+'; total time '+r.seconds*qty+' seconds.','reward');
  return r11CraftMenu();
 }
 if(cmd.startsWith('craft ')&&!job){
  const key=Object.keys(CRAFT_RECIPES).find(k=>CRAFT_RECIPES[k].name.toLowerCase()===cmd.slice(6));
  const r=CRAFT_RECIPES[key];
  if(r&&!r.food&&!r.questInputs&&!r.basicTent&&!r.catalogId&&
    r11Learned(key)&&(!r.minLevel||player.level>=r.minLevel)&&key!=='pipe'){
   player.flags.devCraftQuote={key};
   return menu();
  }
 }
 return oldCraft.apply(this,arguments);
};
})();