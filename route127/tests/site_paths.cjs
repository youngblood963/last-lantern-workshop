// Static entry/dependency checks only. No browser, mobile, network or game execution.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const tracked=cp.execFileSync('git',['ls-files'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>fs.existsSync(path.join(root,f)));
function resolve(from,raw){
 const value=raw.trim().split(/[?#]/)[0];
 if(!value||/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value))return null;
 let result=value.startsWith('/')?path.join(root,value):path.resolve(root,path.dirname(from),value);
 if(fs.existsSync(result)&&fs.statSync(result).isDirectory())result=path.join(result,'index.html');
 return result;
}
const mandatory=['index.html','privacy.html','support.html','route127/index.html','metalkeep/index.html','veiled-moon/index.html','lantern/index.html','route127/playtest/index.html'];
let checked=0;
function check(file,seen=new Set()){
 if(seen.has(file))return;seen.add(file);
 const source=fs.readFileSync(path.join(root,file),'utf8');
 const refs=file.endsWith('.css')?[...source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)|@import\s+["']([^"']+)["']/g)].map(m=>m[1]||m[2]):[...source.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)].map(m=>m[1]);
 for(const raw of refs){const full=resolve(file,raw);if(!full)continue;assert(fs.existsSync(full),`${file}: missing ${raw}`);checked++;if(full.endsWith('.css'))check(path.relative(root,full),seen);}
}
mandatory.forEach(f=>check(f));
// Any other HTML version must not depend on one of the removed root copies.
const report=JSON.parse(fs.readFileSync(path.join(root,'route127/docs/root_cleanup_files.json'),'utf8'));
const removed=new Set(report.removed);
for(const file of tracked.filter(f=>/\.(?:html|css)$/.test(f))){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 for(const m of source.matchAll(/(?:\b(?:src|href)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^"')]+))/g)){
  const full=resolve(file,m[1]||m[2]);if(full)assert(!removed.has(path.relative(root,full)),`${file} still references removed root copy ${full}`);
 }
}
for(const f of report.removed)assert(!fs.existsSync(path.join(root,f)),`Root copy remains: ${f}`);
// Dynamic game artwork/font references used by the active playtest.
const graphics=fs.readFileSync(path.join(root,'route127/playtest/graphics.js'),'utf8');
for(const m of graphics.matchAll(/file:'([^']+)'/g))assert(fs.existsSync(path.join(root,'route127/playtest/assets/locations',m[1])),m[1]);
for(const f of ['Route127_Approved_Map_WO5D.png','Route127_Approved_Master_WO5B.png','transmission.png','seaport_liberation.png'])assert(fs.existsSync(path.join(root,'route127/playtest',f)),f);
assert.equal(fs.readFileSync(path.join(root,'CNAME'),'utf8').trim(),'lastlanternworkshop.com');
console.log(`PASS ${mandatory.length} live entry points, ${checked} local paths, CSS dependencies, active game artwork, all HTML/CSS removal references and ${removed.size} root removals`);
