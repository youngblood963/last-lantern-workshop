/* Browser storage isolation for DEVTEST and the opt-in local PLAYTEST staging entry. */
(() => {
 'use strict';
 const playtest=document.currentScript?.dataset.route127Environment==='playtest';
 const params=new URLSearchParams(location.search);
 if(playtest&&!/^\/route127\/playtest\/(?:index\.html)?$/.test(location.pathname))return;
 if(!playtest&&!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname))
  throw new Error('Devtest bootstrap refused outside its explicit entry');
 const releaseCloud=playtest&&params.get('offline')!=='1'&&(
  location.origin==='https://lastlanternworkshop.com'||
  (/^https:\/\/(?:localhost|127\.0\.0\.1):8788$/.test(location.origin)&&params.get('cloud')==='1'));
 const terminalPreview=!playtest&&params.get('tomorrow-preview')==='1';
 const scrapCombatPreview=!playtest&&params.get('scrap-combat-preview')==='1';
 const environment=Object.freeze({terminalPreview,scrapCombatPreview,name:playtest?'PLAYTEST':'DEVTEST',engine:'../playtest/',backend:releaseCloud,qa:false,
  storagePrefix:playtest?'route127:playtest:cloud:v1:':'route127:devtest:local:v1:'});
 if(playtest&&!releaseCloud){
  Object.defineProperty(globalThis,'ROUTE127_ENV',{value:environment,writable:false,configurable:false});
  return;
 }
 Object.defineProperty(window,'ROUTE127_QA_BUILD',{value:false,writable:false,configurable:false});
 // Standalone scene previews are ephemeral.
 if(terminalPreview||scrapCombatPreview){
  const entries=new Map();
  Object.defineProperty(globalThis,'localStorage',{value:Object.freeze({
   get length(){return entries.size;},key(i){return [...entries.keys()][i]??null;},
   getItem(key){return entries.get(String(key))??null;},
   setItem(key,value){entries.set(String(key),String(value));},
   removeItem(key){entries.delete(String(key));},clear(){entries.clear();}
  }),configurable:false,writable:false});
  Object.defineProperty(globalThis,'ROUTE127_ENV',{value:environment,writable:false,configurable:false});
  return;
 }
 const original=globalThis.localStorage,prefix=environment.storagePrefix,removed=prefix+'removed:';
 if(!playtest){
  const settingsPrefix='route127:devtest:v1:';
  const retainedSettings=new Set([
   'combat-visual-layouts-v1','tomorrow-project-layout-v1','route127-display-mode',
   'route127:devtest:landmark-layout:v1','route127:devtest:region-boundary-sketch:v1',
   'route127-sky-road-lab-v1'
  ]);
  const isSetting=key=>retainedSettings.has(key)||/^route127-scenario-reviews-v1(?:-|$)/.test(key);
  const physical=key=>(isSetting(key)?settingsPrefix:prefix)+key;
  const hidden=key=>settingsPrefix+'removed:'+key;
  const keys=()=>{
   const result=new Set();
   for(let i=0;i<original.length;i++){
    const raw=original.key(i);
    if(raw?.startsWith(prefix)){
     const key=raw.slice(prefix.length);
     if(!isSetting(key))result.add(key);
    }else if(raw){
     const key=raw.startsWith(settingsPrefix)?raw.slice(settingsPrefix.length):raw;
     if(isSetting(key)&&original.getItem(hidden(key))===null)result.add(key);
    }
   }
   return [...result];
  };
  const storage=Object.freeze({
   get length(){return keys().length;},
   key(i){return keys()[i]??null;},
   getItem(key){
    key=String(key);
    if(!isSetting(key))return original.getItem(physical(key));
    return original.getItem(hidden(key))!==null?null:original.getItem(physical(key))??original.getItem(key);
   },
   setItem(key,value){
    key=String(key);original.setItem(physical(key),String(value));
    if(isSetting(key))original.removeItem(hidden(key));
   },
   removeItem(key){
    key=String(key);
    if(isSetting(key)&&original.getItem(key)!==null)original.setItem(hidden(key),'1');
    original.removeItem(physical(key));
   },
   clear(){for(const key of keys())this.removeItem(key);}
  });
  Object.defineProperty(globalThis,'localStorage',{value:storage,configurable:false,writable:false});
  if(window!==globalThis)Object.defineProperty(window,'localStorage',{value:storage,configurable:false,writable:false});
  Object.defineProperty(globalThis,'ROUTE127_ENV',{value:environment,writable:false,configurable:false});
  return;
 }
 // Import old browser saves, while keeping cloud journals scoped to this client.
 const readsLegacy=key=>!key.startsWith('r127-dev-')&&!key.startsWith('r127-before-cloud-load:');
 const keys=()=>{
  const result=new Set();
  for(let i=0;i<original.length;i++){const key=original.key(i);if(key&&!key.startsWith(prefix))result.add(key);else if(key?.startsWith(prefix)&&!key.startsWith(removed))result.add(key.slice(prefix.length));}
  return [...result].filter(key=>original.getItem(removed+key)===null&&(readsLegacy(key)||original.getItem(prefix+key)!==null));
 };
 const storage=Object.freeze({
  get length(){return keys().length;},key(i){return keys()[i]??null;},
  getItem(key){key=String(key);if(original.getItem(removed+key)!==null)return null;return original.getItem(prefix+key)??(readsLegacy(key)?original.getItem(key):null);},
  setItem(key,value){key=String(key);original.setItem(prefix+key,String(value));original.removeItem(removed+key);},
  removeItem(key){
   key=String(key);
   original.setItem(removed+key,'1');original.removeItem(prefix+key);
  },
  clear(){for(const key of keys())this.removeItem(key);}
 });
 // Storage replacement must succeed before any game script runs: fail closed.
 Object.defineProperty(globalThis,'localStorage',{value:storage,configurable:false,writable:false});
 if(window!==globalThis)Object.defineProperty(window,'localStorage',{value:storage,configurable:false,writable:false});
 Object.defineProperty(globalThis,'ROUTE127_ENV',{value:environment,writable:false,configurable:false});
})();
