// WO12: deterministic item values and explicit reward/service policies. No XP/HP curve edits.
const Economy={
 version:12,
 goods:{'Energy Bars':8,Bandage:18,'Emergency Trauma Kit':45,Tent:24,'Battered Flashlight':20,'Scrap Metal':8,Wire:8,Cloth:6,Rope:8,Fuel:12,Electronics:18,Chemicals:12},
 regions:{NORTH:3,WEST:4,CENTRAL:5,INDUSTRIAL:9,LOWLANDS:10,EAST:12,SEAPORT:14},
 subtype:{pipe:10,club:8,bat:12,hatchet:18,knife:14,machete:24,axe:32,hammer:28,rifle:80,revolver:55,pistol:48,shotgun:70,smg:85,crossbow:40},
 value(name){const g=GEAR[name];if(!g)return this.goods[name]||0;const def=EQUIPMENT_CATALOG.find(x=>x.id===g.id||x.name===g.name||x.name===name),level=Math.max(1,Number(g.level)||def?.minLevel||1),rarity={common:1,uncommon:1.65,rare:3.6,epic:4.6,legendary:0}[g.rarity]||0;if(!rarity)return 0;let identity=0;for(const ch of String(g.id||name))identity=(identity*31+ch.charCodeAt(0))%23;const stats=g.type==='weapon'?((Number(g.min)||0)+(Number(g.max)||0))*6:(Number(g.def)||0)*45;let bonuses=0;for(const [k,v]of Object.entries(g))if(typeof v==='number'&&/bonus|chance|resist/i.test(k))bonuses+=Math.abs(v)*(/chance/i.test(k)?200:12);return Math.max(20,Math.round((35+10*Math.pow(level,1.8)+stats+(this.subtype[g.subtype]||15)+identity+bonuses)*rarity*(1+identity*.003)*({rifle:1.24,smg:1.3,shotgun:1.18,club:.94,pipe:.96}[g.subtype]||1)));},
 entry(){return typeof currentEncounter==='function'?LegacyEncounterRewards.entry(currentEncounter()):null;},
 regionLevel(){const g=typeof lanternState==='function'?lanternState():null;const region=typeof lanternEdge==='function'?lanternEdge()?.primaryRegion:null;return this.regions[region]||Math.max(3,...(this.entry()?.regions||[]).map(r=>this.regions[r]||3));},
 generated(mult=1){const entry=this.entry(),cmd=this.action||'';if(/STEAL THE PAYMENT STASH|ROB GIDEON/.test(cmd))return Math.max(2,Math.round((3+WO7.level()*.5)*(.32/.3)))*mult;const kind=/SALVAGE|STRIP|SORT|SCRAP/.test(cmd)?'salvage':/SEARCH|DISCOVER|INVESTIGATE|EXPLORE/.test(cmd)?'exploration':/^(FIGHT|ATTACK)\b/.test(cmd)?'combat':entry?.category==='wanderer'?'wanderer':'environment';const factor=kind==='salvage'?.5:kind==='combat'?1:kind==='wanderer'?1:.75;return Math.max(1,Math.round((35+.10*baseHpForLevel(WO7.level())+1.8*Math.pow(WO7.level(),1.6))*(.9+Math.min(14,this.regionLevel())*.01)*mult*factor));},
 legacyActionPurse(q,old){const entry=RoadScenarioRegistry.regionalById.get(q.id),spec=entry?.encounter?.combat||combatSpecs[r10CanonicalTitle(entry?.encounter?.title||'')];if(!spec)return old;return spec.enemies?.length?spec.enemies.filter(e=>e.bolts>0).reduce((n,e)=>n+this.purse(spec,e),0):spec.bolts>0?this.purse(spec,spec):old;},
 purse(c,e,count=1){const level=Math.max(1,Number(e.level)||Number(c.level)||1),hp=Number(e.maxHp)||Number(e.hp)||Number(c.maxHp)||1,attack=((Number(e.r18Min)||Number(c.min)||1)+(Number(e.r18Max)||Number(c.max)||2))/2,name=String(e.name||c.name);const wealth=/WARDEN|FOREMAN|SERGEANT|BOSS|CAPTAIN|ENFORCER/i.test(name)?1.4:/SCAVENGER|BEGGAR|LOOTER/i.test(name)?.7:1;return Math.max(5,Math.round((15+.55*hp+2*Math.pow(level,1.6)+4*attack )*wealth*.6*(c.r18LevelPressure?1.8:1)));},
 machine(c){return c.regionalCombatLoot?.type==='machine'||c.regionalCombatLoot?.type==='animal'||/DRONE|ROBOT|CLEANER|SECURITY UNIT|FACTORY RAT|CONTAMINATED RAT|FORKLIFT|AUTONOMOUS|CRAB|ROACH|RAT PACK|WILD BEAR|LION|FERAL DOG|SPIDER|MOSQUITO/i.test(c.name);},
 prepare(c){if(!c)return;const machine=this.machine(c);if(c.enemies?.length){let changed=!c.wo12Economy;for(const e of c.enemies)if(e.bolts>0&&!e.wo12Purse){e.bolts=machine?e.bolts:this.purse(c,e,c.enemies.length);e.wo12Purse=true;changed=true;}if(changed)c.bolts=c.enemies.reduce((n,e)=>n+(Number(e.bolts)||0),0);}else if(!c.wo12Economy&&c.bolts>0&&!machine)c.bolts=this.purse(c,c);if(c.wo10Rewards?.callbackBolts!==undefined&&!c.wo12Callback){c.wo10Rewards.callbackBolts=this.purse(c,c);c.wo12Callback=true;}
 const q=player.flags.wo7Scene;if(c.wo7Id&&q?.key===c.wo7Key&&q.combatReward?.bolts>0&&!c.wo12Economy){q.combatReward.bolts=this.purse(c,{...c,maxHp:c.maxHp},1);}
 c.wo12Economy=true;},
 medicalRate(rating=1){return Math.max(5,Math.ceil(player.maxHp*.02))*(1+(Math.max(1,rating)-1)*.05);},
 treat(rating=1){const missing=Math.max(0,player.maxHp-player.hp),rate=this.medicalRate(rating),cost=Math.min(Math.ceil(missing/rate),player.bolts);if(!missing){add('You are already at full health.','system');return false;}if(cost<=0){add('Not enough Bolts.','system');return false;}const healed=Math.min(missing,Math.floor(cost*rate));player.bolts-=cost;player.hp+=healed;if(player.hp===player.maxHp)player.deathStreak=0;updateHud();add(`TREATMENT — +${healed} HP / -${cost} BOLTS`,'reward');v49Autosave();return true;},
 drink(d){const rate={BEER:.05,SHOT:.09,'HOUSE SPECIAL':.15}[d[0]],heal=Math.min(Math.max(0,player.maxHp-player.hp),Math.max(d[2],Math.ceil(player.maxHp*rate)));if(!heal){add('You are already at full health.','system');return false;}if(player.bolts<d[1]){add('Not enough Bolts.','system');return false;}player.bolts-=d[1];player.hp+=heal;updateHud();add(`${d[0]} — +${heal} HP / -${d[1]} BOLTS`,'reward');v49Autosave();return true;}
};
Object.assign(VENDOR_BASE,Economy.goods);
for(const [n,p]of Object.entries({'Scrap Rat':600,'Wasteland Crow':650,'Stray Cat':800,'Rust Hound':1500,Ferret:3000,'Pack Mule':6500}))if(PORT55_PETS[n])PORT55_PETS[n].price=p;
// Discount follows stable instance valuation. Does not grant new stock/rarity access.
johnnyPrice=function(name){const base=GEAR[name]?Economy.value(name):(VENDOR_BASE[name]||0);return player.dailyDeal===name?Math.max(1,Math.round(base*.72)):base;};
regionalEquipmentPrice=function(name,region){if(!GEAR[name]?.id)return 0;const rating=region==='seaport'?Math.max(1,portStaffRating('general store')):1;return Math.max(1,Math.round(Economy.value(name)*(1-(rating-1)*.02)));};
const wo12Sell=v48SellPrice;v48SellPrice=function(item){if(!v48Ordinary(item)||protectedUniqueEquipment(item.name))return 0;const g=GEAR[item.name];if(g&&['weapon','armor','accessory'].includes(g.type)){if(g.rarity==='legendary')return 0;return Math.floor(Economy.value(item.name)*.08);}return wo12Sell(item);};
// Saved finite vendor stock retains quantity/sold state; prices migrate once per policy.
const wo12Profile=v50Profile;v50Profile=function(w){const p=wo12Profile(w);if(p.wo12PriceVersion!==12){for(const i of p.stock||[])i.price=GEAR[i.name]?Economy.value(i.name):Economy.goods[i.name]||i.price;p.wo12PriceVersion=12;}return p;};
const wo12Pete=r18PeteStock;r18PeteStock=function(){const s=wo12Pete();if(s.equipment)s.equipment.price=Economy.value(s.equipment.name);return s;};
const wo12Start=startCombat;startCombat=function(...args){const result=wo12Start(...args);Economy.prepare(combatState);return result;};
const wo12Combat=handleCombat;handleCombat=function(...args){Economy.prepare(combatState);const result=wo12Combat(...args);Economy.prepare(combatState);return result;};
const wo12Act=WO7.act;WO7.act=function(id,cmd){const prior=Economy.action;Economy.action=String(cmd).toUpperCase();try{return wo12Act.call(this,id,cmd);}finally{Economy.action=prior;}};
// Only generated WO7 units change. XP, literal finds, wagers, bribes and quest grants don't.
WO7.bolts=function(mult=1){return Economy.generated(mult);};

// Factory markup and funds use the same individual valuation; stock persists.
r5RustyPrice=function(name){return Math.ceil((GEAR[name]?Economy.value(name):Economy.goods[name]||VENDOR_BASE[name]||50)*1.2);};
const wo12RustyStock=r5RustyStock;r5RustyStock=function(){const s=wo12RustyStock();if(s.wo12Version!==12){s.bolts=Math.max(s.bolts,12000);s.wo12Version=12;}return s;};

const wo12Inventory=v52Inventory;v52Inventory=function(w){const inv=wo12Inventory(w);if(inv.wo12PriceVersion!==12){for(const i of inv.items)if(i.trade)i.price=GEAR[i.name]?Economy.value(i.name):Economy.goods[i.name]||i.price;inv.wo12PriceVersion=12;}return inv;};
