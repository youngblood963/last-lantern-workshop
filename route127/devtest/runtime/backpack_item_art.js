/* Selected-item portraits. Presentation only; inventory and save data remain owned
 * by TravelerPanels and the existing item command pipeline. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof TravelerPanels==='undefined')return;
 const root=new URL('../assets/items/',document.currentScript.src);
 const manifest=globalThis.Route127ItemArtworkManifest||{};
 const byId=new Map(),byName=new Map();
 for(const entry of manifest.entries||[]){
  if(entry.id)byId.set(entry.id,entry);
  for(const name of [entry.name,...(entry.aliases||[])])if(name)byName.set(name,entry);
 }
 function lookup(item){
  if(!item||item.qty<=0)return null;
  // Catalog instances retain their ID across levels and modifications. Legacy
  // named equipment uses an explicit name mapping, never a guessed filename.
  let name=item.name;const visited=new Set();
  while(name&&!visited.has(name)){
   visited.add(name);
   const entry=byId.get(GEAR[name]?.id)||byName.get(name)||
    byName.get(typeof narrativeGearName==='function'?narrativeGearName(name):name);
   if(entry?.file)return {...entry,url:new URL(entry.file,root).href};
   // These are the existing upgrade/modification records, not another saved
   // identity or tracking system. Following them preserves older named gear.
   name=player.flags.r127EquipmentUpgrades?.[name]?.base||
    player.flags.equipmentMods?.[name.replace(/ \+[1-5]$/,'')]?.base;
  }
  return null;
 }
 const css=document.createElement('style');
 css.textContent=`
 .traveler-art.r127-item-portrait{position:relative;align-items:center;
  background:radial-gradient(ellipse at center,#312b20,#090b09 80%);overflow:hidden}
 .traveler-art.r127-item-portrait::before{display:none}
 .r127-item-portrait>img{display:block;width:100%;height:100%;min-width:0;
  padding:12px;box-sizing:border-box;object-fit:contain;object-position:center}
 `;
 document.head.appendChild(css);
 const originalArt=TravelerPanels.art;
 TravelerPanels.art=function(kind){
  const frame=originalArt.call(this,kind);
  if(kind!=='inventory'||this.which!=='inventory'||!player.pack.includes(this.selected))return frame;
  const entry=lookup(this.selected);
  if(!entry)return frame;
  const image=document.createElement('img');image.alt=this.selected.name;image.decoding='async';
  frame.classList.add('r127-item-portrait');frame.dataset.itemArtId=entry.id||entry.name;
  frame.setAttribute('aria-label',this.selected.name+' — item artwork');
  image.addEventListener('error',()=>{
   image.remove();frame.classList.remove('r127-item-portrait');delete frame.dataset.itemArtId;
   frame.setAttribute('aria-label','Weathered traveler backpack');
  },{once:true});
  image.src=entry.url;frame.appendChild(image);return frame;
 };
 globalThis.Route127ItemArtwork=Object.freeze({lookup,entries:Object.freeze([...(manifest.entries||[])])});
})();
