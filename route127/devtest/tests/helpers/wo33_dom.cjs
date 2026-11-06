// Run existing DOM-aware suites against the real Devtest entry without editing
// the protected Playtest helper or assertions.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const helperPath=path.resolve(__dirname,'../../../playtest/tests/helpers/game.cjs');
module.exports=function(){
 const helper=new Module(helperPath,module);helper.filename=helperPath;helper.paths=module.paths;
 let source=fs.readFileSync(helperPath,'utf8').replace('const document={body,','const document={baseURI:"https://example.test/route127/playtest/",head:new E("head"),body,')
  .replace("location:{search:","location:{pathname:'/route127/devtest/index.html',search:")
  .replace('style={setProperty(){}}','style={setProperty(){},removeProperty(){}}')
  .replace('performance:{now:()=>0}', 'MutationObserver:class{observe(){} disconnect(){}},performance:{now:()=>0}');
 const entry=fs.readFileSync(path.resolve(__dirname,'../../index.html'),'utf8');
 let expanded=entry.replace(/<script>\s*if\(globalThis.ROUTE127_ENV[\s\S]*?<\/script>/,tag=>JSON.parse(tag.match(/else\{document.write\(([\s\S]*?)\);\}/)[1]));
 if(process.env.WO33_BASELINE)expanded=expanded.replace(/<script src="[^" ]*enemy_(?:scaling|reward_compat)_wo33\.js[^" ]*"><\/script>/g,'');
 source=source.replace("fs.readFileSync(path.join(gameDir,'index.html'),'utf8')",JSON.stringify(expanded));
 helper._compile(source,helperPath);return helper.exports();
};
