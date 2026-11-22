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
 helper._compile(source,helperPath);return helper.exports();
};
