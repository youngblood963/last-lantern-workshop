// Run existing DOM-aware suites against the real Devtest entry without editing
// the protected Playtest helper or assertions.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const helperPath=path.resolve(__dirname,'../../../playtest/tests/helpers/game.cjs');
module.exports=function(){
 const helper=new Module(helperPath,module);helper.filename=helperPath;helper.paths=module.paths;
 let source=fs.readFileSync(helperPath,'utf8').replace('const document={body,','const document={baseURI:"https://example.test/route127/playtest/",head:new E("head"),body,')
  .replace("this._text=t;}}","this._text=t;}appendData(text){this._text+=text;}}")
  .replace("location:{search:","location:{pathname:'/route127/devtest/index.html',search:")
  .replace("layout.className='game-layout';shell.append(layout);","layout.className='game-layout';shell.append(layout);shell.querySelector=s=>s==='.game-layout'?layout:null;")
  .replace(' append(...xs)', ' before(node){this.parentNode.insertBefore(node,this);} prepend(...xs){for(const x of xs.reverse())this.insertBefore(x,this.firstChild);} append(...xs)')
  .replace('style={setProperty(){}}','style={setProperty(){},removeProperty(){},getPropertyValue(){return ""}}')
  .replace('currentScript:{src:', 'currentScript:{dataset:{},src:')
  .replace('vm.createContext({document,','vm.createContext({document,Image:class {},')
  .replace('performance:{now:()=>0}', 'MutationObserver:class{observe(){} disconnect(){}},performance:{now:()=>0}');
 const entry=fs.readFileSync(path.resolve(__dirname,'../../index.html'),'utf8');
 let expanded=entry.replace(/<script>\s*if\(globalThis.ROUTE127_ENV[\s\S]*?<\/script>/,tag=>JSON.parse(tag.match(/else\{document.write\(([\s\S]*?)\);\}/)[1]));
 // The offline DOM fixture does not mount the hosted cloud adapter.
 expanded=expanded.replace(/<script>\s*if\(!globalThis\.ROUTE127_ENV\?\.terminalPreview[^]*?cloud-save-bootstrap[^]*?<\/script>/,'');
 if(process.env.WO33_BASELINE)expanded=expanded.replace(/<script src="[^" ]*enemy_(?:scaling|reward_compat)_wo33\.js[^" ]*"><\/script>/g,'');
 source=source.replace("fs.readFileSync(path.join(gameDir,'index.html'),'utf8')",JSON.stringify(expanded));
 // Match the browser's classic script tags regardless of attribute order, IDs,
 // cache query strings, and data-* attributes. Preserve currentScript metadata.
 source=source.split('\n').map(line=>line.startsWith('for(const match of index.matchAll(')?String.raw`for(const match of index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
 const attrs=match[1],src=attrs.match(/\bsrc="([^"]+)"/i)?.[1],type=attrs.match(/\btype="([^"]+)"/i)?.[1];
 if(type&&!['text/javascript','application/javascript'].includes(type))continue;
 const previous=document.currentScript,file=src&&src.split('?')[0];
 document.currentScript=src?{src:new URL(src,document.baseURI).href,id:attrs.match(/\bid="([^"]+)"/i)?.[1]||'',dataset:Object.fromEntries([...attrs.matchAll(/data-([\w-]+)="([^"]*)"/g)].map(([,key,value])=>[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),value]))}:null;
 try{run(file?fs.readFileSync(path.join(gameDir,file),'utf8'):match[2]);}catch(e){throw new Error((file||'inline')+': '+e.stack);}finally{document.currentScript=previous;}
}`:line).join('\n');

 helper._compile(source,helperPath);return helper.exports();
};
