/* WO33: Playtest combat normalization promoted from the Devtest-verified adapter. */
(()=>{
 'use strict';
 if(!/^\/route127\/playtest\/(?:index\.html)?$/.test(location.pathname))throw Error('WO33 requires Playtest');
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const api=globalThis.WO33Combat={
  version:1, hpTurns:3.6, attackRate:.075,
  weights:[5,10,20,30,20,10,5],
  level(n){return clamp(Math.floor(Number(n)||1),1,50);},
  distribution(level,region='CENTRAL'){
   const result=new Map(),tilt={NORTH:-.08,WEST:-.05,CENTRAL:0,INDUSTRIAL:.06,LOWLANDS:.09,EAST:.09,SEAPORT:.12}[region]||0;
   this.weights.forEach((w,i)=>{const offset=i-3,l=this.level(level+offset);result.set(l,(result.get(l)||0)+w*(1+tilt*offset));});
   const total=[...result.values()].reduce((a,b)=>a+b,0);return [...result].map(([level,weight])=>({level,probability:weight/total}));
  },
  sample(level,region){let roll=Math.random();const d=this.distribution(this.level(level),region);for(const x of d){roll-=x.probability;if(roll<0)return x.level;}return d.at(-1).level;},
  region(source){
   if(source==='factoryFight')return 'INDUSTRIAL';if(['seaportRoadFight','seaportLiberation'].includes(source))return 'SEAPORT';
   const edge=typeof lanternEdge==='function'?lanternEdge():null;
   if(edge?.primaryRegion)return edge.primaryRegion;
   return typeof roadGoal!=='undefined'&&roadGoal==='east'?'INDUSTRIAL':'NORTH';
  },
  exception(s,source){
   if(['roadWanderer','townWanderer'].includes(source))return 'wanderer systems excluded';
   if(source==='r11Elephant')return 'scripted one-HP comic encounter';
   if(source==='serviceBoss')return 'Yardman level 2 tutorial, telegraphed swings and miss chance';
   if(source==='r18TournamentFight')return 'scripted arena, bare fists/no healing and last stand';
   if(source==='r18StationFight')return 'scripted generator defense timer tied to original HP';
   return null;
  },
  tier(s,source){
   if(s.r18WardenId||s.r18RoadEater||s.r18HarvestMachine||source==='seaportLiberation'||s.name==='THE FOREMAN')return 'boss';
   if((source==='factoryFight'&&['SALVAGE KING','GRINDER','THE CHEMIST'].includes(s.name))||['jenBoss','terribleBilly','r18AshFight','r18RedFight'].includes(source))return 'miniboss';
   return 'ordinary';
  },
  normalize(s,source='encounter',fixedLevel){
   if(this.exception(s,source)||s.wo33)return s;
   const authored=this.level(s.level),region=this.region(source),tier=this.tier(s,source);
   // Scripted Wardens retain their documented +8/minimum-12 level exception.
   const level=fixedLevel??(s.r18WardenId?authored:tier==='ordinary'?this.sample(player.level,region):this.level(Math.max(authored,this.level(player.level)+1)));
   const units=s.enemies?.length?s.enemies:[s],total=units.reduce((n,e)=>n+Math.max(1,Number(e.hp)||1),0);
   const identity=clamp(total/(baseHpForLevel(authored)*.30),.75,1.4);
   const regionHp={NORTH:.9,WEST:.94,CENTRAL:1,INDUSTRIAL:1.04,LOWLANDS:1.07,EAST:1.07,SEAPORT:1.10}[region]||1;
   const warden=s.r18WardenId?clamp(.35+.6*(level-12)/38,.35,.95):1;
   const wardenAttack=s.r18WardenId?clamp(.30+.70*(level-12)/38,.30,1):1;
   const turns=tier==='boss'?8:tier==='miniboss'?6:this.hpTurns;
   // Canonical uncommon weapon, independent of the player's current equipment.
   const hit=9+Math.floor((level-1)*.8),armor=Number(s.armorDef)||0;
   const budget=Math.max(units.length,Math.round(Math.max(2,hit-armor)*turns*(tier==='ordinary'?identity:clamp(identity,.85,1.1))*regionHp*warden));
   const factor=baseHpForLevel(level)/(100+10*(level-1)),referenceArmor=3+Math.floor((level-1)*.35);
   const attacks=units.length===1||s.r18RoadEater||s.r18HarvestMachine?1:units.filter(e=>!e.r18WallGun).length;
   const rate=this.attackRate*(.80+.20*Math.min(1,(level-1)/7))*(tier==='boss'?.85:tier==='miniboss'?.85:1)*wardenAttack/Math.pow(Math.max(1,attacks),.65);
   const adjust=(e)=>{
    const lo=Number(e.r18Min??s.min)||1,hi=Math.max(lo,Number(e.r18Max??s.max)||lo);
    const strength=clamp((lo+hi)/14,.65,1.35),mean=referenceArmor+baseHpForLevel(level)*rate*strength/factor;
    const spread=clamp((hi-lo)/Math.max(2,lo+hi),.12,.45);
    return {...e,level,hp:Math.max(1,Math.round(budget*Math.max(1,Number(e.hp)||1)/total)),r18Min:Math.max(1,Math.round(mean*(1-spread))),r18Max:Math.max(1,Math.round(mean*(1+spread)))};
   };
   const scaled=units.map(adjust),original={...s,enemies:s.enemies?.map(e=>({...e,maxHp:e.hp})),maxHp:s.hp};
   const result={...s,level,hp:scaled.reduce((n,e)=>n+e.hp,0),min:scaled[0].r18Min,max:scaled[0].r18Max,r18LevelPressure:false,
    wo33:{version:this.version,tier,region,authored,identity,original},...(s.enemies?{enemies:scaled}:{})};
   return result;
  }
 };
 const start=startCombat;
 startCombat=function(spec,source='encounter',...rest){return start.call(this,api.normalize(spec,source),source,...rest);};
 // The lookout spawns two new attackers inside handleCombat. Apply a shared
 // reinforcement budget before their first retaliation; never re-roll the level.
 const retaliate=combatRetaliation;
 combatRetaliation=function(c){
  if(c?.wo33&&c.reinforcementsArrived&&c.enemies?.some(e=>e.level==null)){
   const original={...c.wo33.original,hp:48,maxHp:48,enemies:c.enemies.map(e=>({...e})),reinforcementsArrived:true};
   const wave=api.normalize(original,'encounter',c.level);
   c.wo33.original=original;
   c.enemies=wave.enemies.map(e=>({...e,maxHp:e.hp}));
   c.hp=c.maxHp=c.enemies.reduce((n,e)=>n+e.hp,0);c.min=wave.min;c.max=wave.max;
  }
  return retaliate.apply(this,arguments);
 };
})();
