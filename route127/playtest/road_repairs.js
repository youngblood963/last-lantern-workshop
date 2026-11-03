/* WO18: stable save keys, clearer roads/objectives, automatic equipment upgrades. */
let routeGearTransfer=false;
function routeKeepGear(name,type,stolen=false){
 const prior=routeGearTransfer;routeGearTransfer=true;
 try{return addPack(name,type,1,true,stolen);}finally{routeGearTransfer=prior;}
}
function routeGearScore(name,type){const g=GEAR[name];if(!g)return -1;return type==='weapon'?((Number(g.min)||0)+(Number(g.max)||0))/2:Number(g.def)||0;}
const routePickup=addPack;
addPack=function(name,type='material',qty=1,quietFull=false,stolen=false){
 const upgrade=!routeGearTransfer&&['weapon','armor'].includes(type)&&stage!=='fallen'&&!combatState?.r18Bare&&routeGearScore(name,type)>routeGearScore(player[type],type);
 const fullUpgrade=upgrade&&qty===1&&packSlotsUsed()>=player.packMax&&!player.pack.some(i=>i.name===name&&i.type===type&&!!i.stolen===!!stolen);
 // Equip the new find directly when full; the displaced gear stays recoverable.
 if(fullUpgrade)player.pack.push({name,type,qty:1,...(stolen?{stolen:true}:{})});
 const result=fullUpgrade?true:routePickup(name,type,qty,quietFull,stolen);
 if(!result||routeGearTransfer||!['weapon','armor'].includes(type)||stage==='fallen'||combatState?.r18Bare)return result;
 const item=player.pack.find(i=>i.name===name&&i.type===type&&!!i.stolen===!!stolen);
 if(!item||routeGearScore(name,type)<=routeGearScore(player[type],type))return result;
 const previous=player[type],flags=player.flags.r18EquippedStolen||(player.flags.r18EquippedStolen={}),oldStolen=!!flags[type];
 if(!removeItem(r18ItemLabel(item),1))return result;
 player[type]=name;flags[type]=!!stolen;
 if(type==='armor'){player.maxHp=Math.max(1,player.maxHp+(GEAR[name]?.maxHpBonus||0)-(GEAR[previous]?.maxHpBonus||0));player.hp=Math.min(player.hp,player.maxHp);}
 if(previous&&!routeKeepGear(previous,type,oldStolen)){
  // Retain displaced equipment in the existing pending-loot system if necessary.
  (player.flags.r5LootQueue||(player.flags.r5LootQueue=[])).push({name:previous,type,qty:1,...(oldStolen?{stolen:true}:{})});
 }
 resultLine(`AUTO-EQUIPPED — ${gearLabel(name)} (${type==='weapon'?'average damage':'defense'} ${routeGearScore(name,type)} > ${routeGearScore(previous,type)}). ${previous?gearLabel(previous)+' kept.':'Previously empty slot.'}`,'reward');updateHud();return result;
};
PlaythroughRepairs.relayDirections=function(){
 const parts=ensureRelayParts();return [
 ['johnny','POWER REGULATOR','Johnny may have this. In Solace, visit Johnny Briggs and choose Ask About Relay Parts.'],
 ['yard','ANTENNA SERVO','From Solace’s south gate, follow Route 127 to Works Junction. Turn onto Scrap Yard Road toward Scrap Yard. Inspect Scrap Yard, defeat the Yardman, then Search Maintenance Yard.'],
 ['branch','SHIELDED FEED COUPLER','From Works Junction on Route 127, take Signal Cabinet Road toward Old Service Road. At Old Service Road, Inspect Signal Cabinet.'],
 ['east','SIGNAL-CONDITIONING MODULE','From Solace’s south gate, follow Route 127 through Works Junction to the Factory. At the Factory crossroads, Search Equipment Rack.']
 ].map(([key,title,clue])=>`${parts[key]?'RECOVERED':'NEEDED'} — ${title}: ${clue}`);
};
PlaythroughRepairs.relayClues=function(){if(!player.flags.relayPartsRevealed||player.flags.relayQuest==='complete')return;for(const text of this.relayDirections())add(text,'system');};
// Presentation labels are separate from original executable menu commands.
function routeChoiceLabel(command,label){
 const road=route127RoadChoiceLabel(command);if(road!==command)return road;
 if(/(?:visit|examine) fresh mart/i.test(command))return 'Fresh Mart Road — Fresh Mart';
 if(command==='visit ash cemetery')return 'Cemetery Road — Ash Cemetery';
 if(command==='follow dirt path to station nine')return 'Station Nine Road — Station Nine';
 if(/(?:enter|visit|approach).*hospital/i.test(command))return 'Mercy Hospital Road — St. Mercy Hospital';

 if(/^take road to /i.test(command)){
  const g=lanternState();if(g&&!g.currentEdgeId){const edge=lanternConnections(g.nodeId).find(e=>command.slice(13).toLowerCase()===LG_NODES[lanternOther(e,g.nodeId)].name.toLowerCase());if(edge)return `${edge.name} — toward ${LG_NODES[lanternOther(edge,g.nodeId)].name}`;}
 }
 if(command==='continue road'&&lanternEdge())return `Continue ${lanternEdge().name} toward ${lanternDestination()}`;
 if(command==='reverse direction'&&lanternEdge()){const g=lanternState(),e=lanternEdge();return `Return along ${e.name} toward ${LG_NODES[g.direction>0?e.a:e.b].name}`;}
 return label;
}
const routeChoices=GraphicalUI.choices;
GraphicalUI.choices=function(){return routeChoices.call(this).filter(c=>!/^nudge(?:\s|$)/i.test(c.command.trim())).map(c=>({...c,label:routeChoiceLabel(c.command,c.label)}));};
// Prevent diagnostic command echoes from entering either desktop or mobile logs.
const routeAdd=add,routeImmediate=addImmediate;
function routeDiagnostic(text){return /^\s*(?:>\s*)?nudge(?:\s*[:—-].*)?\s*$/i.test(String(text));}
add=function(text='',cls=''){if(routeDiagnostic(text))return;if(!CorvetteRestoration.state().found&&/^MURPHY’S RIDE — .*tires submitted/.test(String(text)))text='MURPHY’S RIDE — Find and inspect the lost Corvette along Route 127.';return routeAdd(PlaythroughRepairs.cleanLabel(text),cls);};
addImmediate=function(text='',cls=''){if(routeDiagnostic(text))return;return routeImmediate(PlaythroughRepairs.cleanLabel(text),cls);};
// Discovery-only guards around existing Corvette behavior; no restoration/gate rewrite.
const routeCorvetteNeeds=RoadScenarioRegistry.wo3Needs;
RoadScenarioRegistry.wo3Needs=function(...args){return !!CorvetteRestoration.state().found&&routeCorvetteNeeds.apply(this,args);};
for(const method of ['options','report','deliver','tires','station','silas']){
 const previous=CorvetteRestoration[method];
 CorvetteRestoration[method]=function(...args){
  if(!this.state().found){
   if(method==='options')return [];
   if(method==='tires')return false;
   if(method==='silas'&&args[0]!=='ask silas about engine')return previous.apply(this,args);
   add('MURPHY’S RIDE — Find and inspect the lost Corvette along Route 127 before collecting restoration parts.','system');
   return method==='silas'||method==='station'?true:undefined;
  }
  return previous.apply(this,args);
 };
}
const routeMurphyParts=CorvetteRestoration.murphy;
CorvetteRestoration.murphy=function(cmd){if(cmd==='ask about corvette parts'&&!this.state().found){this.state().active=true;add('MURPHY > Find my lost Corvette along Route 127 and inspect it first. Then bring me its location.','bright');murphyTalkMenu();this.save();return true;}return routeMurphyParts.call(this,cmd);};
