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
// DEVTEST visual-only repair for accidentally flattened white/checkerboard PNG backgrounds.
// Keep GitHub originals untouched. Only named problem assets are processed;
// transparently encoded source PNGs are left unchanged.
const alphaRepairNames=new Set([
 'Painted Arrows - Knife Scavenger.png',
 'Lone Scavenger - Suspicious Scavenger.png',
 'The Bone Collector.png',
 'The Curator.png'
]);
const alphaRepairCache=new Map();
function repairFlattenedBackground(img,name){
 if(!alphaRepairNames.has(name)||!img?.naturalWidth||!img?.naturalHeight)return;
 const key=img.currentSrc||img.src;
 if(alphaRepairCache.has(key)){const repaired=alphaRepairCache.get(key);if(repaired)img.src=repaired;return;}
 try{
  const w=img.naturalWidth,h=img.naturalHeight,canvas=document.createElement('canvas');
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(img,0,0);
  const pixels=ctx.getImageData(0,0,w,h),p=pixels.data,n=w*h;
  // A genuinely transparent asset never needs white-background removal.
  let hasAlpha=false;
  for(let k=3;k<p.length;k+=4){if(p[k]<248){hasAlpha=true;break;}}
  if(hasAlpha){alphaRepairCache.set(key,null);return;}
  const white=(pos)=>{const i=pos*4,r=p[i],g=p[i+1],b=p[i+2];return r>=215&&g>=215&&b>=215&&Math.max(r,g,b)-Math.min(r,g,b)<=23;};
  const corners=[0,w-1,(h-1)*w,n-1].filter(white).length;
  if(corners<2){alphaRepairCache.set(key,null);return;}
  let edgeHits=0,edgeTotal=0;
  for(let x=0;x<w;x+=Math.max(1,Math.floor(w/64))){edgeTotal+=2;edgeHits+=Number(white(x))+Number(white((h-1)*w+x));}
  for(let y=0;y<h;y+=Math.max(1,Math.floor(h/64))){edgeTotal+=2;edgeHits+=Number(white(y*w))+Number(white(y*w+w-1));}
  if(edgeHits/edgeTotal<.45){alphaRepairCache.set(key,null);return;}
  // Remove only near-white regions connected to the actual image perimeter.
  // This retains enclosed whites on clothing, eyes and equipment.
  const seen=new Uint8Array(n),stack=[];
  const push=i=>{if(i<0||i>=n||seen[i]||!white(i))return;seen[i]=1;stack.push(i);};
  for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}
  for(let y=0;y<h;y++){push(y*w);push(y*w+w-1);}
  let removed=0;
  while(stack.length){
   const i=stack.pop(),x=i%w,y=(i/w)|0;
   p[i*4+3]=0;removed++;
   if(x>0)push(i-1);if(x<w-1)push(i+1);
   if(y>0)push(i-w);if(y<h-1)push(i+w);
  }
  if(removed<n*.12){alphaRepairCache.set(key,null);return;}
  ctx.putImageData(pixels,0,0);
  canvas.toBlob(blob=>{
   if(!blob)return;
   const url=URL.createObjectURL(blob);alphaRepairCache.set(key,url);
   if(img.isConnected)img.src=url;
   console.info('DEVTEST PNG alpha repair',name,{removed,percent:Math.round(100*removed/n)});
  },'image/png');
 }catch(error){console.warn('DEVTEST PNG alpha repair skipped:',name,error);alphaRepairCache.set(key,null);}
}
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
   for(const f of scene.items){const img=document.createElement('img');img.src=asset(f.name,f.root);img.alt='';img.onerror=()=>{img.hidden=true;console.warn('Missing DEVTEST encounter art',f.name)};img.addEventListener('load',()=>{if(img.src.startsWith('blob:'))return;repairFlattenedBackground(img,f.name)},{once:true});layer.append(img)}
   e.figure.append(layer);
  }
 }catch(error){console.warn('DEVTEST roadside art:',error)}
 return result;
};
})();
