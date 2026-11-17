// Build a private asset bundle from a full checkout of the WO61 candidate.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const gateway=dirname(fileURLToPath(import.meta.url));
const root=resolve(gateway,'../..');
const output=process.argv[2]&&resolve(process.argv[2]);
if(!output)throw Error('Usage: node prepare-wo61.mjs /path/outside/checkout/new-directory');
const offset=relative(root,output);
if(!isAbsolute(offset)&&offset!=='..'&&!offset.startsWith('../'))throw Error('Bundle must be outside the checkout');

const files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0');
const runtimeFile=/\.(?:js|css|json|png|webp|gif|svg|jpe?g|woff2?|mp3|ogg|wav)$/i;
const rootArt=/^(?:the_fighting_ring|the_forgotten_arena|roach_nest_aggressive_swarm|roach_nest_ordinary|feral_dog_aggressive_lone|feral_dog_hungry_lone|feral_dog_pack_concept|seaport_crab_racing_track)\.png$/;
const clientFile=/^route127\/(?:devtest|playtest)\/(?:[^/]+|(?:runtime|assets)\/.+)$/;
function allowed(file){
 if(rootArt.test(file)||file==='route127/devtest/index.html')return true;
 if(file==='route127/online-game/index.html')return true;
 if(/^route127\/online-game\/[^/]+$/.test(file))return runtimeFile.test(file);
 if(/^route127\/(?:assets|runtime)\//.test(file))return runtimeFile.test(file);
 return clientFile.test(file)&&runtimeFile.test(file);
}
const html=readFileSync(join(root,'route127/devtest/index.html'),'utf8').replace(/\r\n?/g,'\n');
const scriptBodies=markup=>[...markup.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
 .filter(match=>! /(?:^|\s)src\s*=/.test(match[1])).map(match=>match[2]);
const inline=scriptBodies(html);
const emitted=html.match(/else\{document\.write\(("(?:[^"\\]|\\.)*")\);\}/);
if(!emitted||!html.includes('cloud-save-bootstrap.js'))throw Error('DEVTEST entry does not match the staged loader');
inline.push(...scriptBodies(JSON.parse(emitted[1])));
const hashes=[...new Set(inline.map(body=>'sha256-'+createHash('sha256').update(body).digest('base64')))];

mkdirSync(output);
const assets=join(output,'assets');
for(const file of files.filter(allowed)){
 const target=join(assets,file);
 mkdirSync(dirname(target),{recursive:true});
 copyFileSync(join(root,file),target);
 if(file.startsWith('route127/online-game/'))copyFileSync(target,join(assets,file.split('/').at(-1)));
}
const config=JSON.parse(readFileSync(join(gateway,'wrangler.jsonc'),'utf8'));
config.main='./worker.mjs';
config.assets.directory='./assets';
config.vars.WO61_DEVTEST_SCRIPT_HASHES=hashes.join(' ');
copyFileSync(join(gateway,'worker.mjs'),join(output,'worker.mjs'));
writeFileSync(join(output,'wrangler.json'),JSON.stringify(config,null,2)+'\n');
console.log('Private DEVTEST package prepared at '+output);
