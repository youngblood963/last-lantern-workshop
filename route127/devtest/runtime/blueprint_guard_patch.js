/* DEVTEST: separate late-game Epic blueprints from ordinary Murphy stock. */
(()=>{'use strict';if(!location.pathname.includes('/route127/devtest/'))return;
const epic=new Set(['keeperCoat','widowmaker']);
const oldChoices=v53Choices;
v53Choices=function(options,...args){
 if(stage==='mercy'&&mercyLocation==='murphy'&&Array.isArray(options)){
  options=options.filter(v=>!/^LEARN (?:LANTERN KEEPER|WIDOWMAKER)/i.test(String(v)));
 }
 return oldChoices.call(this,options,...args);
};
const oldAdd=add;
add=function(text='',type=''){
 if(stage==='mercy'&&mercyLocation==='murphy'&&
   /^(?:Widowmaker|Lantern Keeper.s Coat) —/.test(String(text)))return;
 return oldAdd.apply(this,arguments);
};
const oldCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=String(r5Mapped(raw)||'').toLowerCase();
 if(!busy&&stage==='mercy'&&mercyLocation==='murphy'&&cmd.startsWith('learn ')){
  const key=Object.keys(CRAFT_RECIPES).find(k=>CRAFT_RECIPES[k].name.toLowerCase()===cmd.slice(6));
  if(epic.has(key)){
   add('Epic blueprints cannot be purchased here. Find them through high-level exploration.','system');
   return;
  }
 }
 return oldCore.apply(this,arguments);
};
})();