/* WO25 Devtest adapter. Not loaded by Playtest or any production entry. */
(() => {
 'use strict';
 if(!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname))throw new Error('Devtest bootstrap refused outside its explicit entry');
 const environment=Object.freeze({name:'DEVTEST',engine:'../playtest/',backend:false,qa:false,storagePrefix:'route127:devtest:v1:'});
 Object.defineProperty(window,'ROUTE127_QA_BUILD',{value:false,writable:false,configurable:false});
 // Read old same-origin characters without modifying them. Every write, including
 // identity/ledger housekeeping by the unchanged engine, goes to the private fork.
 const original=globalThis.localStorage,prefix=environment.storagePrefix,removed=prefix+'removed:';
 const keys=()=>{
  const result=new Set();
  for(let i=0;i<original.length;i++){const key=original.key(i);if(key&&!key.startsWith(prefix))result.add(key);else if(key?.startsWith(prefix)&&!key.startsWith(removed))result.add(key.slice(prefix.length));}
  return [...result].filter(key=>original.getItem(removed+key)===null);
 };
 const storage=Object.freeze({
  get length(){return keys().length;},key(i){return keys()[i]??null;},
  getItem(key){key=String(key);if(original.getItem(removed+key)!==null)return null;return original.getItem(prefix+key)??original.getItem(key);},
  setItem(key,value){key=String(key);original.setItem(prefix+key,String(value));original.removeItem(removed+key);},
  removeItem(key){key=String(key);original.setItem(removed+key,'1');original.removeItem(prefix+key);},
  clear(){for(const key of keys())this.removeItem(key);}
 });
 // Storage replacement must succeed before any game script runs: fail closed.
 Object.defineProperty(globalThis,'localStorage',{value:storage,configurable:false,writable:false});
 if(window!==globalThis)Object.defineProperty(window,'localStorage',{value:storage,configurable:false,writable:false});
 Object.defineProperty(globalThis,'ROUTE127_ENV',{value:environment,writable:false,configurable:false});
})();
