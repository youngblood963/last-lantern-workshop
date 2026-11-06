const path=require('node:path'),assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module');
const name=process.argv[2];assert(['wo18','wo19','wo21','playthrough_repairs'].includes(name));
const helper=require.resolve('../../playtest/tests/helpers/game.cjs');require(helper);require.cache[helper].exports=require('./helpers/wo33_dom.cjs');
const filename=path.resolve(__dirname,'../../playtest/tests/'+name+'.cjs');
if(['wo18','wo21'].includes(name)){
 const source=fs.readFileSync(filename,'utf8'),body=source.slice(source.indexOf('(async()=>{'));
 const test=new Module(filename,module);test.filename=filename;test.paths=module.paths;
 test._compile(`const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const gameDir=path.resolve(__dirname,'..');const {run,flush,ids,storage,events,ctx}=require(${JSON.stringify(path.resolve(__dirname,'helpers/wo33_dom.cjs'))})();\n`+body,filename);
}else require(filename);
