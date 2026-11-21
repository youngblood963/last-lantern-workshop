/* DEVTEST — shared modification catalog, installation and combat effects. */
const EquipmentMods=(()=>{
 const definitions={
  serrated:['Serrated Edge','weapon','15% Bleed',{'Small Animal Bones':3,'Scrap Metal':1,Wire:1}],
  precision:['Precision','weapon','+3 percentage points critical chance',{'Scrap Metal':2,Wire:2,Electronics:1}],
  circuit:['Overcharged Circuit','weapon','15% electrical hit (+5, or +20 against machines)',{'Uncommon Electrical Parts':2,Wire:2,'Scrap Metal':1}],
  incendiary:['Incendiary','weapon','15% Burn',{'Scrap Metal':2,Cloth:1,Electronics:1}],
  poison:['Poison','weapon','15% Poison',{'Animal Bones':2,'Clean Water':1,'Scrap Metal':1}],
  piercing:['Armor Piercing','weapon','Ignores 10% of defense',{'Scrap Metal':3,Wire:2}],
  bone:['Bone Plating','armor','10% chance to reduce a hit by 15%',{'Animal Bones':3,Cloth:2}],
  impact:['Impact Reinforcement','armor','Reduces melee damage by 5%',{'Scrap Metal':3,Cloth:2}],
  padding:['Reinforced Padding','armor','Halves Bleed damage',{Cloth:3,'Scrap Metal':1}],
  filter:['Toxin Filter','armor','Halves Poison damage',{Cloth:2,Electronics:1,'Clean Water':1}],
  insulation:['Insulated Wiring','armor','Halves electrical damage',{Wire:2,Electronics:1,Cloth:1}],
  fireproof:['Fireproof Lining','armor','Halves Burn damage',{Cloth:3,'Scrap Metal':2}]
 };
 const catalog=Object.fromEntries(Object.entries(definitions).map(([key,[name,type,effect,materials]])=>[key,{key,name,type,effect,materials}]));
 const learned=key=>!!player.flags.modBlueprints?.[key];
 function learn(key){
  if(!catalog[key]||learned(key))return false;
  (player.flags.modBlueprints||={})[key]=true;
  add('MOD BLUEPRINT LEARNED — '+catalog[key].name,'reward');
  return true;
 }
 function purchase(key,cost,material){
  if(learned(key)){add('You already know that modification.','system');return;}
  if(material?!r6ConsumeMaterial(material,cost):player.bolts<cost){add('Required: '+cost+' '+(material||'Bolts')+'.','system');return;}
  if(!material)player.bolts-=cost;
  learn(key);updateHud();v49Autosave();
 }
 const records=()=>player.flags.equipmentMods||{};
 const upgradeSuffix=/ \+[1-5]$/;
 const modRecord=name=>records()[String(name||'').replace(upgradeSuffix,'')];
 const installed=name=>modRecord(name)?.key;
 function hydrate(){
  for(const [name,entry] of Object.entries(records())){
   if(!GEAR[entry.base]||!catalog[entry.key])continue;
   Object.defineProperty(GEAR,name,{value:{...GEAR[entry.base],name},enumerable:false,writable:true,configurable:true});
  }
 }
 function compatible(mod,name){
  const gear=GEAR[name];
  if(!mod||!gear||gear.type!==mod.type)return false;
  const identity=(gear.subtype||'')+' '+(modRecord(name)?.base||name);
  if(mod.key==='serrated')return /knife|machete|blade|sword|hatchet|tomahawk|\baxe\b|cleaver|reaper|shiv/i.test(identity);
  if(mod.key==='circuit')return /rifle|pistol|revolver|shotgun|smg|pipe|wrench|hammer|crowbar|knife|machete|blade|sword|hatchet|\baxe\b|cleaver|reaper|shiv/i.test(identity)&&!/bone|wooden/i.test(identity);
  return true;
 }
 function options(name){return Object.values(catalog).filter(mod=>learned(mod.key)&&compatible(mod,name));}
 function cost(mod){return Object.entries(mod.materials).map(([name,qty])=>({name,qty,have:r6MaterialCount(name)}));}
 function install(target,key){
  const mod=catalog[key],{name,kind,equipped,item}=target;
  if(!learned(key)||!compatible(mod,name)||installed(name)===key)return 'That modification cannot be installed.';
  if(equipped?player[kind]!==name:!player.pack.includes(item)||item.name!==name||item.type!==kind||item.qty<1)return 'That equipment is no longer available.';
  if(player.flags.r127UpgradeJob?.name===name)return 'Collect the equipment upgrade first.';
  if(item?.qty>1&&packSlotsUsed()>=player.packMax)return 'Free one pack slot to separate this piece from its stack.';
  const requirements=cost(mod);
  if(requirements.some(row=>row.have<row.qty))return 'Missing crafting materials.';
  const upgrades=player.flags.r127EquipmentUpgrades||={};
  const prior=upgrades[name],base=modRecord(name)?.base||prior?.base||name;
  if(!GEAR[base])return 'The equipment definition is unavailable.';
  // Each installed item has its own persisted inventory key. All existing transfer
  // and trade paths already move that key, including when they only move a name.
  const serial=(player.flags.equipmentModSerial||0)+1;
  const root=base+' ['+mod.name+' #'+serial+']';
  const result=root+(name.match(upgradeSuffix)?.[0]||'');
  for(const row of requirements)r6ConsumeMaterial(row.name,row.qty);
  player.flags.equipmentModSerial=serial;
  (player.flags.equipmentMods||={})[root]={base,key};
  hydrate();
  if(prior){
   upgrades[result]={base:root,bonus:prior.bonus};
   const gear=GEAR[root],bonus=prior.bonus;
   Object.defineProperty(GEAR,result,{value:{...gear,...(kind==='weapon'?{min:gear.min+bonus,max:gear.max+bonus}:{def:gear.def+bonus})},enumerable:false,writable:true,configurable:true});
  }
  if(equipped)player[kind]=result;
  else if(item.qty>1){item.qty--;player.pack.push({...item,name:result,qty:1});}
  else item.name=result;
  updateHud();v49Autosave();
  return mod.name+' installed.';
 }
 const machine=(c,e=c)=>c.regionalCombatLoot?.type==='machine'||c.r18RoadEater||c.r18HarvestMachine||
  /DRONE|ROBOT|SECURITY (?:UNIT|HOUND)|COUNTY UNIT 07|CLEANER|FORKLIFT|AUTONOMOUS TAXI|PAYMENT REQUIRED/i.test(e.name||'');
 const weapon=()=>installed(player.weapon);
 const armor=()=>installed(player.armor);
 const statusLabel={bleed:'Bleed',poison:'Poison',burn:'Burn'};
 function apply(target,kind){
  (target.modStatuses||={})[kind]=2;
  add(statusLabel[kind]+' applied.','danger');
 }
 function tick(target,maxHp,isPlayer=false){
  let damage=0;
  const resist={bleed:'padding',poison:'filter',burn:'fireproof'};
  for(const [kind,rounds] of Object.entries(target.modStatuses||{})){
   if(rounds<=1)delete target.modStatuses[kind];else target.modStatuses[kind]--;
   const value=Math.min(8,Math.max(1,Math.ceil(maxHp*.02)));
   const amount=isPlayer&&armor()===resist[kind]?Math.floor(value/2):value;
   if(amount){damage+=amount;add(statusLabel[kind]+' deals '+amount+' HP.','danger');}
  }
  return damage;
 }
 function attack(c,target){
  if(c.r18Bare)return 0;
  const key=weapon(),kind={serrated:'bleed',poison:'poison',incendiary:'burn'}[key];
  if(key!=='circuit'&&!kind)return 0;
  const mechanical=machine(c,target);
  if(mechanical&&(kind==='bleed'||kind==='poison'))return 0;
  if(Math.random()>=.15)return 0;
  if(kind){apply(target,kind);return 0;}
  const damage=mechanical?20:5;
  add('Overcharged Circuit — '+damage+' electrical damage.','reward');return damage;
 }
 function enemyEffect(c,e,special){
  if(c.r18Bare)return 0;
  const name=e.name||'',kind=c.modBoss?.effect||(machine(c,e)?'electrical':
   /CONTAMINATED|CHEMICAL BURNER|THE CHEMIST|TOXIC ATTACKER/i.test(name)?'poison':
   /SCRAP TORCHER/i.test(name)?'burn':
   /KNIFE|MACHETE|SPEAR|CLAW|WOLF|MOUNTAIN LION|WILD BEAR/i.test(name)?'bleed':null);
  if(!kind||(!special&&Math.random()>=.15))return 0;
  if(kind==='electrical'){
   const damage=special?12:6;
   const resisted=armor()==='insulation'?damage/2:damage;
   add('Electrical discharge — '+resisted+' HP.','danger');return resisted;
  }
  apply(c.modPlayer||(c.modPlayer={}),kind);return 0;
 }
 const minibosses={
  'THE ROAD EATER':{key:'piercing',scale:1.08,hp:104,min:8,max:15,def:4,effect:'electrical',special:'The control unit charges an electrical strike.'},
  'MR PICKENS':{key:'filter',scale:.86,hp:82,min:7,max:12,def:2,effect:'poison',special:'Pickens winds up his tire iron, its edge wet with poison.'},
  'INDUSTRIAL SECURITY DRONE':{key:'insulation',scale:.98,hp:92,min:8,max:14,def:4,effect:'electrical',special:'The drone diverts power to its discharge coils.'},
  'CHAIR MAN':{key:'poison',scale:.82,hp:78,min:7,max:12,def:2,effect:'poison',special:'Chair Man raises a salt-crusted, poisoned blade.'},
  'THE CURATOR':{key:'fireproof',scale:.93,hp:86,min:8,max:13,def:3,effect:'burn',special:'The Curator tilts a ladle of burning wax.'}
 };
 function scaleBoss(spec){
  if(spec.name==='INDUSTRIAL SECURITY DRONE'&&spec.wo7Id!=='I14')return spec;
  const modBoss=minibosses[spec.name];if(!modBoss)return spec;
  const level=Math.max(1,Math.min(50,Number(player.level)||1)),extra=Math.floor((level-1)*.5);
  const hp=Math.max(modBoss.hp,Math.round(baseHpForLevel(level)*modBoss.scale));
  const enemies=spec.enemies?.map((enemy,i)=>({...enemy,hp:Math.floor(hp/spec.enemies.length)+(i===0?hp%spec.enemies.length:0),
   r18Min:modBoss.min+extra,r18Max:modBoss.max+extra}));
  return {...spec,level,hp,min:modBoss.min+extra,max:modBoss.max+extra,
   armorDef:modBoss.def+Math.floor((level-1)/7),xp:Math.max(spec.xp||0,Math.round(55+level*13)),enemies,modBoss};
 }
 function defense(c){
  let value=c.armorDef||0;
  if(c.r18RoadEater&&!c.enemies?.some(e=>e.name==='HYDRAULICS'&&e.hp>0))value=Math.floor(value/2);
  return value*(c.r18Bare||weapon()!=='piercing'?1:.9);
 }
 function victory(c){
  const boss=minibosses[c.name];
  if(boss&&(c.name!=='INDUSTRIAL SECURITY DRONE'||c.wo7Id==='I14'))return learn(boss.key);
  return c.r18PowderBlueprint?learn('incendiary'):false;
 }
 return {catalog,learned,learn,purchase,installed,hydrate,options,cost,install,attack,enemyEffect,tick,scaleBoss,defense,victory,weapon,armor};
})();
