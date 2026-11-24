/* Execute the real public entry in the existing isolated offline DOM fixture. */
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
module.exports=function(){
 const filename=path.resolve(__dirname,'wo33_dom.cjs'),m=new Module(filename,module);m.filename=filename;m.paths=module.paths;
 let source=fs.readFileSync(filename,'utf8').replace("path.resolve(__dirname,'../../index.html')","path.resolve(__dirname,'../../../playtest/index.html')").replace("pathname:'/route127/devtest/index.html'","pathname:'/route127/playtest/index.html'");
 source=source.split('\n').map(line=>line.startsWith(' let expanded=')?' let expanded=entry;':line).join('\n');
 m._compile(source,filename);return m.exports();
};
