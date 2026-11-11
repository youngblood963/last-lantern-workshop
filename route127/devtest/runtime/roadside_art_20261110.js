/* DEVTEST-only approved 2026-11-09 roadside encounter art. Visual-only; no scenario, RNG, reward or combat mutations. */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)||typeof GraphicalUI==='undefined')return;
const asset=(name,root=false)=>new URL(root?'../../'+encodeURIComponent(name):'../devtest/assets/enemies/'+encodeURIComponent(name),document.baseURI).href;
const file=(name,root=false)=>({name,root});
const scenes={
 'ROACH NEST':()=>[file('roach_nest_ordinary.png',true),file('roach_nest_contaminated.png'),file('roach_nest_aggressive_swarm.png',true)][typeof r18RoachVariant==='function'?r18RoachVariant():0],
 'ROACH SWARM':()=>scenes['ROACH NEST'](),
 'TUNNEL RATS':()=>typeof player!=='undefined'&&player.flags?.r18TunnelBoarPending?file('Tunnel Rats - Wild Boar.png'):file('Tunnel Rats.png'),
 'FERAL DOG':()=>[file('feral_dog_mother_pups.png'),file('feral_dog_hungry_lone.png',true),file('feral_dog_aggressive_lone.png',true),file('feral_dog_pack_concept.png',true)][typeof r18DogVariant==='function'?r18DogVariant():0],
 'LONE SCAVENGER':()=>[file('Lone Scavenger - Suspicious Scavenger.png'),file('Lone Scavenger - Friendly Scrapper.png'),file('Lone Scavenger - Weary Trader.png')][typeof r18ScavengerVariant==='function'?r18ScavengerVariant():0],
 'THE STRAY':()=>file('The Stray.png'),
 'THE CRAWLER':()=>file('The Crawler.png'),
 'THE BIG MAN':()=>file('The Big Man.png'),
 'THE BONE COLLECTOR':()=>file('The Bone Collector.png'),
 // These two case-sensitive assets are different characters. Keep the Warden on the original art.
 'THE WARDEN':()=>file('Sentry.png'),
 'THE SENTRY':()=>file('sentry.png'),
 'SECURITY DRONE':()=>file('Security Drone.png'),
 'SOMETHING IN THE DRAIN':()=>file('Something in the Drain - Grate and Claw.png'),
 'THE WAX MUSEUM':()=>file('The Curator.png'),
 'THE CURATOR':()=>file('The Curator.png'),
 'THE WRECKERS':()=>[file('The Wreckers - Pipe.png'),file('The Wreckers - Chain.png')],
 // The arrow-choice scene is a mystery: reveal these ambushers only after FOLLOW RED ARROW starts combat.
 'ARROW AMBUSH':()=>[file('Painted Arrows - Club Scavenger.png'),file('Painted Arrows - Knife Scavenger.png')],
 'HIGHWAY ROBBERS':()=>[file('Tire Iron Robber.png'),file('Spear Robber.png')],
 'RATS IN THE PANTRY':()=>file('Snarling Rats at a Rusted Sewer Drain.png')
};
const normalize=s=>String(s||'').toUpperCase().replace(/^EAST ROAD — /,'').trim();
function current(){
 if(typeof stage==='undefined')return null;
 const combat=typeof combatState!=='undefined'?combatState:null;
 const encounter=stage==='encounter'&&typeof currentEncounter==='function'?currentEncounter():null;
 const origin=typeof currentEncounter==='function'&&['encounter','combat','combatItems'].includes(stage)?currentEncounter():null;
 const aliases={'SCAVENGER':'LONE SCAVENGER','WRECKERS':'THE WRECKERS','DRAIN CREATURE':'SOMETHING IN THE DRAIN',
 'FERAL BOAR':'TUNNEL RATS','PANTRY RAT PACK':'RATS IN THE PANTRY','LARGE CONTAMINATED ROACHES':'ROACH NEST','AGGRESSIVE ROACH SWARM':'ROACH NEST'};
 const raw=normalize(combat?.name||encounter?.title);
 const title=aliases[raw]||raw;
 if(!title)return null;
 if(['HIGHWAY ROBBERS','LOOTERS','PARKING LOT RAIDERS','GANG LOOKOUT','THE HOLLOWED',
 'THE SQUATTERS','GUNSHOP OWNER','RABID RACCOONS','BAT COLONY',
 'SILAS CROWE','RIVET AND CREW'].includes(title))return null;
 let spec=combat?.r18WardenId?scenes['THE WARDEN']:raw==='FERAL BOAR'?()=>file('Tunnel Rats - Wild Boar.png'):scenes[title]||scenes[normalize(origin?.title)];
 if(!combat&&normalize(origin?.title)==='THE PAINTED ARROWS')return null;
 if(!spec&&/CHEMICAL BURNER/.test(title))spec=()=>[file('Chemical Burner 1.png'),file('Chemical Burner 2.png')];
 if(!spec&&/SENTRY/.test(title))spec=()=>file('sentry.png');
 if(!spec&&/PIPE ROBBER/.test(title))spec=()=>file('Pipe Robber.png');
 return spec?{title,items:[].concat(spec()).filter(Boolean),combat}:null;
}
const css=document.createElement('style');
css.textContent=`
.gfx-art .r127-road-art{position:absolute;inset:0;z-index:4;pointer-events:none;display:flex;align-items:end;justify-content:space-evenly;overflow:hidden}
.gfx-art .r127-road-art img{width:46%;height:94%;object-fit:contain;object-position:center bottom;filter:drop-shadow(3px 7px 6px #000a)}
.gfx-art .r127-road-art.single img{width:94%;height:98%}
`;
document.head.append(css);

const scopeRegions=new Set(['CENTRAL','INDUSTRIAL','SEAPORT']);
function inScope(){
 if(typeof combatState!=='undefined'&&combatState&&combatState.source!=='encounter')return false;
 return typeof route127CurrentRegion==='function'&&scopeRegions.has(route127CurrentRegion(lanternState()));
}
function scenarioChoices(){
 if(stage!=='encounter'||!inScope()||player.flags?.r18HoundNaming)return null;
 const encounter=currentEncounter();if(!encounter)return null;
 const labels=encounterChoices(encounter).split(/\s{2,}/).filter(Boolean);
 if(typeof questRoadMarkers==='function')labels.push(...questRoadMarkers().map(row=>row[1]));
 const exits=/^(BACK AWAY|MOVE ON|KEEP MOVING|WALK AWAY|LEAVE|WITHDRAW|RETREAT|BACK DOWN)$/i;
 const exit=labels.find(label=>/^(BACK AWAY|MOVE ON|WALK AWAY|LEAVE|KEEP MOVING)$/i.test(label))||labels.find(label=>exits.test(label))||'LEAVE';
 const actions=labels.filter(label=>label!==exit);
 // Generic LEAVE is already supported by resolveEncounter.
 actions.push(exit);
 return actions.map((label,i)=>({key:String(i+1),command:choiceCommand(label),label}));
}
globalThis.Route127RoadsidePresentation=Object.freeze({choices:scenarioChoices,current,inScope});
Route127MenuAuthority.register('roadside-scenarios',{
 supports:()=>stage==='encounter'&&inScope()&&!player.flags?.r18HoundNaming,
 choices:context=>context.base
});
const presentation=document.createElement('style');
presentation.textContent=`
.gfx-frame.r127-route-scene .r127-road-art{padding:0 0 5%;box-sizing:border-box;align-items:flex-end}
.gfx-frame.r127-route-scene .r127-road-unit{height:82%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0!important;margin:0;border:0!important;border-image:none!important;background:transparent!important;box-shadow:none!important;min-height:0!important;pointer-events:auto;cursor:pointer}
.gfx-frame.r127-route-scene .r127-road-art img,.gfx-frame.r127-route-scene .r127-road-art.single img{width:100%;height:calc(100% - 31px);object-fit:contain;object-position:center bottom}
.gfx-frame.r127-route-scene .r127-road-unit[hidden]{display:none}
.gfx-frame.r127-route-scene :is(.r127-bat-unit,.r127-raccoon-unit,.r127-human-unit,.r127-npc-combat){display:flex;flex-direction:column;align-items:center;gap:3px}
.gfx-frame.r127-route-scene :is(.r127-bat-unit,.r127-raccoon-unit,.r127-human-unit,.r127-npc-combat)>img{height:calc(100% - 31px)!important;flex:1;min-height:0;object-position:center bottom}
.gfx-frame.r127-route-scene :is(.r127-bat-hp,.r127-raccoon-label,.r127-human-hp,.r127-npc-label,.r127-road-hp){position:static!important;transform:none!important;left:auto;bottom:auto;display:block;flex:none;z-index:2;white-space:nowrap;color:#ffaaa4;background:#32100e;border:1px solid #aa413b;border-radius:4px;padding:3px 6px;font:700 clamp(13.5px,1.5vw,18px)/1.15 sans-serif}
.gfx-frame.r127-route-scene button.r127-raccoon-unit{width:24%;height:42%}
.gfx-frame.r127-route-scene .r127-raccoon-unit img{object-position:center bottom}
.gfx-frame.r127-route-scene :is(.r127-bat-unit,.r127-raccoon-unit,.r127-human-unit)[aria-hidden="true"]::after,
.gfx-frame.r127-route-scene div.r127-road-unit::after,.gfx-frame.r127-route-scene .r127-road-unit[data-no-hp='true']::after{content:'';height:31px;flex:none}
.gfx-frame.r127-route-scene .r127-npc-figure:not(.cage){height:calc(94% - 31px);top:calc(52% - 15.5px)}

.gfx-frame.r127-road-combat-active .gfx-combat{display:none!important}
.gfx-frame.r127-route-scene .gfx-combat{border:0!important;border-image:none!important;box-shadow:none!important;background:transparent!important;padding:4px 0;display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
.gfx-frame.r127-route-scene .gfx-combat[hidden]{display:none!important}
.gfx-frame.r127-route-scene .gfx-enemy{border:1px solid #aa413b;border-radius:4px;background:#32100e;color:#ffaaa4;padding:3px 6px;gap:5px;flex-wrap:nowrap}
.gfx-frame.r127-route-scene .gfx-enemy .gfx-stat{max-width:110px}
.gfx-frame.r127-route-scene.r127-npc-partial .gfx-enemy:first-child{display:none}
.gfx-frame.r127-route-scene .gfx-enemy strong,.gfx-frame.r127-route-scene .gfx-enemy .gfx-stat{font:700 clamp(13.5px,1.5vw,18px)/1.15 sans-serif}

.gfx-frame.r127-route-scene:is(.r127-human-combat-active,.r127-bat-combat-active,.r127-raccoon-combat-active,.r127-npc-combat-active,.r127-road-combat-active) .gfx-combat{display:none!important}
.gfx-frame.r127-route-scene.r127-sprite-failed .gfx-combat{display:flex!important}
.gfx-frame.r127-route-scene .gfx-art-caption{top:8px;bottom:auto;font-size:16px}

.gfx-frame.r127-route-scene .r127-road-art[data-key^="TUNNEL RATS"] .r127-road-unit{width:46%!important;height:49%}
.gfx-frame.r127-route-scene .r127-road-art[data-key^="SOMETHING IN THE DRAIN"] .r127-road-unit{width:48%!important;height:30%}
.gfx-frame.r127-route-scene .r127-road-art[data-key^="FERAL DOG"] .r127-road-unit{width:52%!important;height:60%}

.gfx-frame.r127-route-scene :is(.r127-bat-layer,.r127-raccoon-layer,.r127-human-layer,.r127-npc-scene){bottom:6%}
.gfx-frame.r127-route-scene .r127-road-art{top:0;bottom:0}
`;
document.head.append(presentation);
const old=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=old.apply(this,args);
 try{
  const e=this.element;if(!e?.figure)return result;
  e.frame.classList.toggle('r127-route-scene',inScope()&&['encounter','combat','combatItems'].includes(stage));
  e.frame.classList.toggle('r127-sprite-failed',!!e.figure.querySelector('img[data-failed="true"]'));
  if(inScope()&&stage==='encounter')e.caption.textContent=currentEncounter()?.displayName||currentEncounter()?.title||e.caption.textContent;
  let layer=e.figure.querySelector('.r127-road-art');
  const scene=inScope()&&!e.frame.hidden&&this.preference()==='graphics'?current():null;
  // Dedicated HP-linked sprite layers already own these combat visuals.
  const combat=typeof combatState!=='undefined'?combatState:null;
  if(scene&&combat&&['HIGHWAY ROBBERS'].includes(scene.title))scene.items=[];
  const completeUnits=!scene?.combat?.enemies?.length||scene.combat.enemies.length===scene.items.length;
  e.frame.classList.toggle('r127-road-combat-active',!!scene?.combat&&completeUnits);
  if(!scene||!scene.items.length){layer?.remove();return result}
  const key=scene.title+':'+scene.items.map(x=>x.name).join('|')+':'+!!scene.combat;
  if(layer?.dataset.key!==key){
   layer?.remove();layer=document.createElement('div');layer.className='r127-road-art'+(scene.items.length===1?' single':'');layer.dataset.key=key;
   scene.items.forEach((f,i)=>{
    const unit=document.createElement(scene.combat?'button':'div');
    unit.className='r127-road-unit';unit.style.width=(scene.items.length===1?'54%':'38%');
    if(scene.combat){
     unit.type='button';
     unit.addEventListener('click',()=>{if(!busy)handleCommand(scene.combat.enemies?.length?'attack '+(i+1):'attack')});
    }
    const img=document.createElement('img');img.src=asset(f.name,f.root)+'?v=road-repair-1';img.alt='';
    img.onerror=()=>{img.hidden=true;img.dataset.failed='true';e.frame.classList.add('r127-sprite-failed');e.frame.classList.remove('r127-road-combat-active');console.warn('Missing DEVTEST encounter art',f.name)};
    unit.append(img);layer.append(unit);
   });
   e.figure.append(layer);
  }
  if(scene.combat&&completeUnits){
   const units=[...layer.children],fighters=scene.combat.enemies?.length?scene.combat.enemies:[scene.combat];
   // Composite artwork retains its composition; individual fighters still have
   // associated indicators below the picture, without inventing missing sprites.
   units.forEach((unit,i)=>{
    const fighter=fighters[Math.min(i,fighters.length-1)];
    const alive=fighter?.hp>0;
    unit.hidden=!alive;
    if(!scene.combat.enemies?.length&&i>0){
     unit.dataset.noHp='true';
     unit.querySelector('.r127-road-hp')?.remove();
     return;
    }
    let label=unit.querySelector('.r127-road-hp');
    if(!label){label=document.createElement('span');label.className='r127-road-hp';unit.append(label);}
    label.textContent=Math.max(0,fighter?.hp||0)+'/'+Math.max(1,fighter?.maxHp||fighter?.hp||1)+' HP';
    unit.setAttribute('aria-label','Attack '+(fighter?.name||scene.combat.name));
   });
  }
 }catch(error){console.warn('DEVTEST roadside art:',error)}
 return result;
};
})();
