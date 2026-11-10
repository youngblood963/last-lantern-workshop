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
 'SECURITY DRONE':()=>file('Security Drone.png'),
 'SOMETHING IN THE DRAIN':()=>file('Something in the Drain - Grate and Claw.png'),
 'THE WAX MUSEUM':()=>file('The Curator.png'),
 'THE CURATOR':()=>file('The Curator.png'),
 'THE WRECKERS':()=>[file('The Wreckers - Pipe.png'),file('The Wreckers - Chain.png')],
 'THE PAINTED ARROWS':()=>[file('Painted Arrows - Club Scavenger.png'),file('Painted Arrows - Knife Scavenger.png')],
 'ARROW AMBUSH':()=>[file('Painted Arrows - Club Scavenger.png'),file('Painted Arrows - Knife Scavenger.png')],
 'HIGHWAY ROBBERS':()=>[file('Tire Iron Robber.png'),file('Spear Robber.png')],
 'EAST ROAD — RATS IN THE PANTRY':()=>file('Snarling Rats at a Rusted Sewer Drain.png')
};
const normalize=s=>String(s||'').toUpperCase().replace(/^EAST ROAD — /,'').trim();
function current(){
 if(typeof stage==='undefined')return null;
 const combat=typeof combatState!=='undefined'?combatState:null;
 const encounter=stage==='encounter'&&typeof currentEncounter==='function'?currentEncounter():null;
 const title=normalize(combat?.name||encounter?.title);
 if(!title)return null;
 let spec=scenes[title]||scenes[normalize(encounter?.title)];
 if(!spec&&/CHEMICAL BURNER/.test(title))spec=()=>[file('Chemical Burner 1.png'),file('Chemical Burner 2.png')];
 if(!spec&&/SENTRY/.test(title))spec=()=>file('Sentry.png');
 if(!spec&&/PIPE ROBBER/.test(title))spec=()=>file('Pipe Robber.png');
 return spec?{title,items:[].concat(spec()).filter(Boolean)}:null;
}
const css=document.createElement('style');
css.textContent=`
.gfx-art .r127-road-art{position:absolute;inset:0;z-index:4;pointer-events:none;display:flex;align-items:end;justify-content:space-evenly;overflow:hidden}
.gfx-art .r127-road-art img{width:46%;height:94%;object-fit:contain;object-position:center bottom;filter:drop-shadow(3px 7px 6px #000a)}
.gfx-art .r127-road-art.single img{width:94%;height:98%}
`;
document.head.append(css);
const old=GraphicalUI.sync;
GraphicalUI.sync=function(...args){
 const result=old.apply(this,args);
 try{
  const e=this.element;if(!e?.figure)return result;
  let layer=e.figure.querySelector('.r127-road-art');
  const scene=!e.frame.hidden&&this.preference()==='graphics'?current():null;
  // Dedicated HP-linked sprite layers already own these combat visuals.
  const combat=typeof combatState!=='undefined'?combatState:null;
  if(scene&&combat&&['HIGHWAY ROBBERS'].includes(scene.title))scene.items=[];
  if(!scene||!scene.items.length){layer?.remove();return result}
  const key=scene.title+':'+scene.items.map(x=>x.name).join('|');
  if(layer?.dataset.key!==key){
   layer?.remove();layer=document.createElement('div');layer.className='r127-road-art'+(scene.items.length===1?' single':'');layer.dataset.key=key;
   for(const f of scene.items){const img=document.createElement('img');img.src=asset(f.name,f.root);img.alt='';img.onerror=()=>{img.hidden=true;console.warn('Missing DEVTEST encounter art',f.name)};layer.append(img)}
   e.figure.append(layer);
  }
 }catch(error){console.warn('DEVTEST roadside art:',error)}
 return result;
};
})();
