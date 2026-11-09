/* Route 127 DEVTEST — game-wide, read-only menu priority resolver.
 * One visible choice source per UI state. No changes to gameplay commands,
 * quests, saves or shared Playtest. A provider must explicitly opt in and
 * provide commands already registered in the live engine.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof GraphicalUI==='undefined')return;
 const providers=new Map();
 let registrationOrder=0;
 const LEVEL=Object.freeze({devtest:400,graphics:300,r11:200,original:100});
 const norm=v=>String(v??'').trim().toLowerCase();
 const dedupe=rows=>{
  const usedCommands=new Set(),usedKeys=new Set(),result=[];
  for(const row of rows||[]){
   if(!row||!norm(row.command))continue;
   const key=norm(row.key),cmd=norm(row.command);
   if(usedCommands.has(cmd)||usedKeys.has(key))continue;
   usedCommands.add(cmd);usedKeys.add(key);result.push(row);
  }
  return result;
 };
 // Providers run only for the current state; false/null/[] means unsupported.
 // Never auto-execute gameplay menu functions while resolving display.
 function register(id,{level='devtest',supports,choices}){
  if(!id||typeof supports!=='function'||typeof choices!=='function')throw Error('Invalid menu provider');
  providers.set(id,{id,priority:LEVEL[level]??0,order:++registrationOrder,supports,choices});
  return ()=>providers.delete(id);
 }
 let chosenOwner=null;
 const upstream=GraphicalUI.choices;
 const baseChoices=function(){return dedupe(upstream.apply(GraphicalUI,arguments));};
 function resolve(){
  const base=DevtestMenuModel.project(baseChoices());
  chosenOwner=null;
  if(!GraphicalUI.active())return base;
  const context=Object.freeze({
   stage:String(stage),location:typeof mercyLocation==='string'?mercyLocation:'',
   stop:player.flags?.port55CurrentStop||'',player,
   base:base.slice(),numbered:numberedChoices,hotkeys:currentHotkeys
  });
  for(const provider of [...providers.values()].sort((a,b)=>b.priority-a.priority||b.order-a.order)){
   if(!provider.supports(context))continue;
   const offered=provider.choices(context);
   if(!Array.isArray(offered)||!offered.length)continue;
   // All offered commands must be present in current gameplay key maps.
   // Otherwise do not show a button that cannot be dispatched.
   const actual=new Map(base.map(c=>[norm(c.command),c]));
   const picked=[];
   for(const item of offered){
    const command=typeof item==='string'?norm(item):norm(item?.command);
    const live=actual.get(command);
    if(!live){picked.length=0;break;}
    picked.push({...live,...(typeof item==='object'?{label:item.label||live.label}:{}),command:live.command,key:live.key});
   }
   if(picked.length){chosenOwner=provider.id;return dedupe(picked);}
  }
  return base;
 }
 GraphicalUI.choices=function(){return resolve();};
 // Existing engine maps are the dispatch authority. For chosen buttons the
 // command is sent directly, so old numeric-choice maps cannot remap it.
 const dispatch=GraphicalUI.dispatch;
 GraphicalUI.dispatch=async function(choice){
  if(busy)return false;
  const live=this.choices().find(x=>x.key===choice?.key&&x.command===choice?.command);
  if(!live){this.sync();return false;}
  // Default engine navigation must keep numeric/hotkey semantics. Only an
  // explicitly owned menu uses the direct command path.
  if(!chosenOwner)return dispatch.call(this,choice);
  this.navOpen=false;
  await handleCommand(live.command);
  this.sync();return true;
 };
 globalThis.Route127MenuAuthority=Object.freeze({
  priority:LEVEL,register,resolve,
  diagnose:()=>({stage,providers:[...providers.values()].map(p=>({id:p.id,priority:p.priority})),choices:resolve().map(x=>({key:x.key,command:x.command}))})
 });
})();
