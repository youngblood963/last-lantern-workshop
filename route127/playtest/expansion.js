// v50 focused expansion. Saved legacy identifiers and equipment definitions stay authoritative.
const V50_ROLES=['Guard','Mechanic','Cook','Guard','Medic','Scavenger','Cook','Trader','Guard','Scavenger','Mechanic','Trader'];
const V50_CLUES={Medic:'Clean dressings and carefully labeled jars hang from their satchel.',Mechanic:'Grease stains their cuffs; tools are sorted by size.',Trader:'A handwritten price book peeks from a neatly tied bundle.',Guard:'They watch hands and exits, standing with practiced discipline.',Scavenger:'Their patched pack holds sorted salvage and a coil of wire.',Cook:'A soot-black pot and bundles of dried food hang from their pack.'};
wanderers.forEach((w,i)=>{w.occupation=V50_ROLES[i];w.level=[3,2,1,4,2,3,6,5,9,7,8,10][i];});
function v50Profile(w){
 const st=ws(w.name);if(st.profile){w.level=st.profile.level;return st.profile;}
 const level=w.level,row=level<=2?[95,5]:level<=4?[80,19]:level<=6?[65,30]:level<=8?[45,45]:[25,55],r=Math.random()*100;
 const rarity=r<row[0]?'common':r<row[0]+row[1]?'uncommon':'rare';
 // Quest-exclusive rewards never enter random equipment generation.
 const pool=VENDOR_POOL.filter(n=>GEAR[n]?.type==='weapon'&&GEAR[n].rarity===rarity);
 const weapon=pool[Math.floor(Math.random()*pool.length)];
 const armors=VENDOR_POOL.filter(n=>GEAR[n]?.type==='armor'&&GEAR[n].rarity===rarity);
 const armor=Math.random()<.65?armors[Math.floor(Math.random()*armors.length)]||'Worn Jacket':null;
 const goods={Medic:['Bandage','Cloth'],Mechanic:['Scrap Metal','Wire','Battered Flashlight'],Trader:['Energy Bars','Bandage','Tent','Wire'],Guard:['Bandage','Scrap Metal'],Scavenger:['Scrap Metal','Wire','Cloth'],Cook:['Energy Bars','Cloth']}[w.occupation];
 st.profile={level,weapon,armor,occupation:w.occupation,hostile:['suspicious','cocky'].includes(w.vibe),stock:goods.filter(()=>Math.random()<.75).map(name=>({name,qty:1+Math.floor(Math.random()*3),price:VENDOR_BASE[name]||Math.max(1,(V48_LOOT_PRICES[name]||2)*2)})),lootRolled:false,pendingLoot:null};return st.profile;
}
function v50WeightedWanderer(pool){const weights=pool.map(w=>Math.pow(roadGoal==='east'?.82:.62,w.level-1));let roll=Math.random()*weights.reduce((a,b)=>a+b,0);return pool.find((w,i)=>(roll-=weights[i])<0)||pool[pool.length-1];}
function v50Threat(level){const d=level-player.level;return d<=-3?['Trivial','green']:d<0?['Easy','green']:d===0?['Even','yellow']:d<=2?['Challenging','orange']:d<=4?['Dangerous','red']:['Deadly','purple'];}
function v50Inspect(w){const p=v50Profile(w),[threat,color]=v50Threat(p.level);add(`${w.name} — LEVEL ${p.level} — ${threat.toUpperCase()} (relative threat; no guarantee)`,'system');outputQueue=outputQueue.then(()=>{if(player.level>=5){const last=screen.lastElementChild;if(last){last.dataset.threat=color;last.style.color={green:'#22c55e',yellow:'#facc15',orange:'#fb923c',red:'#ef4444',purple:'#a855f7'}[color];}}});add(`VISIBLE WEAPON: ${gearLabel(p.weapon)}; ARMOR: ${p.armor?gearLabel(p.armor):'None visible'}`);add(`${V50_CLUES[p.occupation]} ${w.name} looks ${w.vibe}.`);}
function v50WandererCombat(w){const p=v50Profile(w),g=GEAR[p.weapon];return {hp:12+p.level*4,min:g.min,max:g.max,armorDef:GEAR[p.armor]?.def||0};}
function v50WandererLoot(name){const w=wandererByName(name);if(!w)return;const p=v50Profile(w);if(!p.lootRolled){p.lootRolled=true;if(Math.random()<.45)p.pendingLoot=p.weapon;}if(p.pendingLoot){if(addPack(p.pendingLoot,'weapon')){add(`RECOVERED VISIBLE WEAPON — ${gearLabel(p.pendingLoot)}`,'reward');p.pendingLoot=null;}else add('Their weapon remains at the scene. Free a pack slot; type CLAIM WANDERER LOOT followed by their name.','system');}}
function v50Trade(w){const p=v50Profile(w);if(p.hostile){add(`${w.name} keeps a hand on their weapon. They are not offering trade.`);return;}player.flags.v50Trade=w.name;add(`${w.name.toUpperCase()} — ${p.occupation.toUpperCase()} TRADE`,'place');p.stock.forEach(i=>add(`${i.name} — ${i.price} BOLTS — ${i.qty} remaining`));add([...p.stock.filter(i=>i.qty>0).map(i=>'BUY '+i.name.toUpperCase()),'SELL ITEMS','LEAVE TRADE'].join('   '),'system');}
function v50TradeCommand(cmd){const w=wandererByName(player.flags.v50Trade);if(!w)return false;const p=v50Profile(w);if(p.hostile){delete player.flags.v50Trade;return false;}if(['leave trade','back','b','leave','move on','town'].includes(cmd)){delete player.flags.v50Trade;delete player.flags.v50Sale;delete player.flags.v48Shop;return false;}
 if(cmd==='sell items'){add('TRADE — SELL ONE CARRIED ITEM','place');const items=player.pack.filter(i=>v48SellPrice(i)>0);add([...items.map(i=>`SELL ${i.name.toUpperCase()} — ${v48SellPrice(i)} BOLTS EACH`),'LEAVE TRADE'].join('   '),'system');return true;}
 if(cmd.startsWith('sell ')){const name=cmd.slice(5).split(' —')[0],i=player.pack.find(i=>i.name.toLowerCase()===name),price=i&&v48SellPrice(i);if(!price){add('That item cannot be sold.','system');return true;}player.flags.v50Sale={name:i.name,price};add(`SELL ONE ${i.name} FOR ${price} BOLTS?`,'system');add('CONFIRM SALE   CANCEL SALE','system');return true;}
 if(cmd==='confirm sale'||cmd==='cancel sale'){const sale=player.flags.v50Sale;delete player.flags.v50Sale;if(cmd==='confirm sale'&&sale){const i=findItem(sale.name);if(i&&v48SellPrice(i)===sale.price){removeItem(sale.name);gainBolts(sale.price);}}v50Trade(w);return true;}
 if(cmd.startsWith('buy ')){const i=p.stock.find(i=>i.name.toLowerCase()===cmd.slice(4).toLowerCase());if(!i||i.qty<=0){add('Not available.','system');return true;}if(player.bolts<i.price){add('Insufficient Bolts.','system');return true;}const type=['Energy Bars','Bandage'].includes(i.name)?'consumable':i.name==='Tent'?'supply':i.name==='Battered Flashlight'?'tool':'material';if(!addPack(i.name,type))return true;player.bolts-=i.price;i.qty--;updateHud();v50Trade(w);return true;}v50Trade(w);return true;
}
function v50Armory(){mercyLocation='mara';currentTownWanderer=null;townWandererFocus=null;player.flags.solaceMenu='equipment';add('MARA — SCRAP & STEEL ARMORY','place');add('An older woman with scarred hands checks a blade against the light. MARA > Buy something that keeps you alive. Keep the speeches short.');showEquipmentShop();add('SMALL TALK   SELL ITEMS   TOWN','system');}
const v50OldNpcTalk=npcTalk;
const v50OldSmallTalk=smallTalk;
smallTalk=function(name){townWandererFocus=null;mercyLocation=name;if(name==='mara'){add('MARA > A good edge does not care how brave you feel. Keep it clean. Keep your armor patched.','bright');showEquipmentShop();return;}if(['tim','murphy'].includes(name)&&player.flags[name+'Quest']==='locked'){v50OldSmallTalk(name);return;}v50OldSmallTalk(name);v50OldNpcTalk(name);if(name==='wayne')offerHouseQuest();};
const v50OldSolace=handleSolace;
handleSolace=function(cmd,raw=cmd){
 if(v50ClaimLoot(cmd))return;if(v50TradeCommand(cmd))return;
 if(player.flags.pendingQuestOffer||player.flags.pendingQuest)return v50OldSolace(cmd,raw);
 const aliases={"the rusty lantern tavern":'bar',"johnny's trading post":'trader',"murphy's motor works":'workshop',"last chance clinic":'clinic',"solace savings & loan":'bank',"scrap & steel armory":'armory'};cmd=aliases[cmd]||cmd;
 if(['armory','mara'].includes(cmd)){v50Armory();return;}
 if(mercyLocation==='mara'){
  if(cmd==='small talk'){smallTalk('mara');return;}
  if(cmd==='continue shopping'||cmd==='buy'||cmd==='browse equipment'){showEquipmentShop();return;}
  if(cmd.startsWith('buy ')){ensureVendorStock();const item=player.vendorStock.find(n=>n.toLowerCase()===cmd.slice(4));if(item)buyJohnny(item);else add('Not in stock.','system');return;}
  if(cmd==='sell items'){v48SaleMenu();return;}
  if(cmd.startsWith('sell ')){v48Sell(cmd.slice(5).split(' ×')[0]);return;}
  if(cmd==='confirm sale'){if(player.flags.v48Sale)v48Sell(player.flags.v48Sale.name,true);return;}
  if(['back','b','town','return to town'].includes(cmd)){delete player.flags.v48Shop;mercyLocation='town';mercyMenu();return;}
 }
 const named=cmd.match(/^(?:talk to|talk|small talk) (jen|johnny|murphy|wayne|amii|tim)$/);if(named){smallTalk(named[1]);return;}
 if(cmd==='trade'||cmd.startsWith('trade ')){const w=wandererByName(currentTownWanderer);if(w&&(townWandererFocus===w.name||cmd===`trade ${w.name.toLowerCase()}`)){v50Trade(w);return;}}
 return v50OldSolace(cmd,raw);
};
const v50OldRoad=handleRoadWanderer;
handleRoadWanderer=function(cmd){if(v50ClaimLoot(cmd))return;if(v50TradeCommand(cmd))return;if(cmd==='trade'){v50Trade(wandererByName(currentRoadWanderer));return;}return v50OldRoad(cmd);};
const v50OldShowWanderer=showWanderer;
showWanderer=function(w,context){v50Profile(w);v50OldShowWanderer(w,context);if(!v50Profile(w).hostile)add(context==='road'?'TRADE   MOVE ON':`TRADE ${w.name.toUpperCase()}   TOWN`,'system');};
const v50OldChoices=renderCurrentChoices;
renderCurrentChoices=function(){if(stage==='wandererRoad'&&currentRoadWanderer){const w=wandererByName(currentRoadWanderer);add(`SMALL TALK   INSPECT${v50Profile(w).hostile?'':'   TRADE'}   FIGHT   MOVE ON`,'system');return;}if(stage==='mercy'&&mercyLocation==='mara'){showEquipmentShop();add('SMALL TALK   SELL ITEMS   TOWN','system');return;}return v50OldChoices();};
async function flashRelayStatic(){const canvas=document.createElement('canvas');canvas.width=240;canvas.height=140;const ctx=canvas.getContext('2d'),data=ctx.createImageData(240,140);for(let i=0;i<data.data.length;i+=4){const c=Math.floor(Math.random()*256);data.data[i]=data.data[i+1]=data.data[i+2]=c;data.data[i+3]=255;}ctx.putImageData(data,0,0);canvas.style.cssText='width:100%;height:100%;object-fit:cover;image-rendering:pixelated';const img=transmission.querySelector('img');img.hidden=true;transmission.append(canvas);transmission.classList.add('live');transmission.style.animation='none';transmission.style.opacity='1';try{await sleep(300);}finally{transmission.classList.remove('live');canvas.remove();img.hidden=false;transmission.style.animation='';transmission.style.opacity='';}}

function v50ClaimLoot(cmd){if(!cmd.startsWith('claim wanderer loot'))return false;const w=wandererByName(cmd.slice('claim wanderer loot'.length).trim());if(!w){add('Type CLAIM WANDERER LOOT followed by their name.','system');return true;}if(!ws(w.name).profile?.pendingLoot){add('No saved weapon to recover.','system');return true;}v50WandererLoot(w.name);return true;}

const v50OldTownWanderer=handleTownWanderer;
handleTownWanderer=function(cmd){const w=wandererByName(currentTownWanderer);if(w)v50Profile(w);const result=v50OldTownWanderer(cmd);if(result&&w&&townWandererFocus===w.name&&!v50Profile(w).hostile&&stage==='mercy')add(`TRADE ${w.name.toUpperCase()}   TOWN`,'system');return result;};

const v50OldFactory=v49FactoryCommand;
v49FactoryCommand=function(cmd){if(stage==='factoryWorkshop'){const aliases={'1':'terminal','2':'talk to forge','3':'workbench','4':'sealed door','5':'exit factory'};cmd=aliases[cmd]||cmd;}return v50OldFactory(cmd);};
// Preserve legacy hand-in handlers when the conversation entry point changes.
const v50Conversation=smallTalk;
smallTalk=function(name){if(['tim','murphy'].includes(name)&&player.flags[name+'Quest']==='found'){v50OldSolace('talk to '+name);v50OldNpcTalk(name);return;}return v50Conversation(name);};
