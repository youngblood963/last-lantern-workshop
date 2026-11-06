// Minimal browser/bootstrap support for the legacy headless Devtest audits.
// The real environment guard and parser-emitted engine scripts execute unchanged.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
module.exports=function createDevtest({pathname='/route127/devtest/index.html',skipScripts=[]}={}){
 const root=path.resolve(__dirname,'../../..'),entry=fs.readFileSync(path.join(root,'devtest/index.html'),'utf8');
 const location=new URL(pathname,'http://localhost');
 const baseURI=new URL(entry.match(/<base\s+href="([^"]+)"/i)?.[1]||'.',location).href;
 const el=()=>({classList:{add(){},remove(){},toggle(){},contains(){return false}},style:{setProperty(){},removeProperty(){}},dataset:{},childNodes:[],children:[],appendChild(){},append(){},remove(){},replaceChildren(){},addEventListener(){},setAttribute(){},removeAttribute(){},getAttribute(){return null},querySelector(){return el()},querySelectorAll(){return []},focus(){},scrollIntoView(){},innerHTML:'',textContent:'',value:''});
 const storage=new Map(),localStorage={get length(){return storage.size;},key:i=>[...storage.keys()][i]??null,getItem:k=>storage.get(String(k))??null,setItem:(k,v)=>storage.set(String(k),String(v)),removeItem:k=>storage.delete(String(k)),clear:()=>storage.clear()};
 const document={baseURI,currentScript:null,head:el(),querySelector:()=>el(),querySelectorAll:()=>[],getElementById:()=>el(),createElement:()=>el(),createTextNode:text=>({textContent:String(text)}),createDocumentFragment:()=>el(),addEventListener(){},body:el(),documentElement:el(),hidden:false};
 const ctx=vm.createContext({document,console,Math:Object.create(Math),Date,Set,Map,JSON,Promise,URL,URLSearchParams,location,localStorage,setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},MutationObserver:class{observe(){} disconnect(){}},performance:{now:()=>0},requestAnimationFrame(){},addEventListener(){},matchMedia:()=>({matches:false}),navigator:{},confirm:()=>true});
 const run=s=>vm.runInContext(s,ctx);
 run('window=globalThis');
 const scripts=[];
 function loadScripts(html){
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
   const src=match[1].match(/\bsrc="([^"]+)"/i)?.[1];
   const previous=document.currentScript;
   try{
    if(src){
     const url=new URL(src,baseURI);
     if(skipScripts.some(name=>url.pathname.endsWith('/'+name)))continue;
     assert.equal(url.origin,location.origin,'Test entry must use local scripts');
     const file=path.resolve(root,'..'+url.pathname);
     assert(file.startsWith(root+path.sep),'Script must stay under route127');
     document.currentScript={src:url.href};scripts.push(path.relative(root,file));
     vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
    }else{document.currentScript=null;run(match[2]);}
   }finally{document.currentScript=previous;}
  }
 }
 // Execute document.write while evaluating the real inline environment gate.
 // Resolve all emitted URLs against the entry's base, just as the browser does.
 document.write=html=>loadScripts(String(html));
 loadScripts(entry);
 assert.equal(run('ROUTE127_ENV.name'),'DEVTEST');
 assert.equal(run('ROUTE127_ENV.qa'),false);
 assert.equal(run('ROUTE127_QA_BUILD'),false);
 assert(scripts.includes('playtest/app.js'),'Parser-emitted shared engine was not loaded');
 assert(scripts.includes('devtest/runtime/presentation_formatting.js'),'Current Devtest patches were not loaded');
 return {ctx,run,scripts,storage};
};
