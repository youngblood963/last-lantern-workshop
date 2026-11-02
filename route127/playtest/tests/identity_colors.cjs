const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const gameDir=path.join(__dirname,'..');
class E{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.childNodes=[];this.parentNode=null;this.attrs={};this.dataset={};this._text='';this._class='';this.style={setProperty(){}};this.events={};this.hidden=false;this.scrollTop=0;this.scrollHeight=100;this.clientHeight=100;this.value='';this.isConnected=true;this.classList={add:(...xs)=>{for(const x of xs)if(!this._class.split(' ').includes(x))this._class+=' '+x;},remove:(...xs)=>{this._class=this._class.split(' ').filter(x=>!xs.includes(x)).join(' ');},contains:x=>this._class.split(' ').includes(x),toggle:(x,on)=>{if(on===undefined)on=!this.classList.contains(x);on?this.classList.add(x):this.classList.remove(x);return on;}};}
 get children(){return this.childNodes.filter(n=>n.tagName!=='#TEXT');}get firstChild(){return this.childNodes[0]||null;}get lastElementChild(){return this.children.at(-1);}get className(){return this._class;}set className(x){this._class=x;}
 get textContent(){return this._text+this.childNodes.map(n=>n.textContent).join('');}set textContent(t){this._text=String(t);this.childNodes=[];}get innerHTML(){return this.textContent;}set innerHTML(t){this._text=t;this.childNodes=[];}
 appendChild(n){if(n.tagName==='FRAGMENT'){while(n.firstChild)this.appendChild(n.firstChild);return n;}if(n.parentNode)n.remove();this.childNodes.push(n);n.parentNode=this;return n;}
 append(...xs){for(const x of xs)this.appendChild(typeof x==='string'?new T(x):x);}remove(){if(this.parentNode){const a=this.parentNode.childNodes;a.splice(a.indexOf(this),1);this.parentNode=null;}}replaceChildren(...xs){for(const n of this.childNodes)n.parentNode=null;this.childNodes=[];this._text='';this.append(...xs);}insertBefore(n,b){if(n.parentNode)n.remove();const i=this.childNodes.indexOf(b);if(i<0)return this.appendChild(n);this.childNodes.splice(i,0,n);n.parentNode=this;return n;}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}addEventListener(k,f){(this.events[k]??=[]).push(f);}focus(){document.activeElement=this;}scrollIntoView(){}showModal(){this.open=true;}close(){this.open=false;}cloneNode(deep){const e=new E(this.tagName);e._text=this._text;e._class=this._class;e.attrs={...this.attrs};if(deep)for(const c of this.childNodes)e.appendChild(c.cloneNode(true));return e;}querySelector(){return null;}querySelectorAll(){return [];}contains(n){return this===n||this.children.some(c=>c.contains(n));}
}
class T extends E{constructor(t){super('#TEXT');this._text=t;}}
const ids={};const body=new E('body'),shell=new E('main');shell.className='terminal-shell';body.append(shell);
for(const name of ['screen','command-form','command','signal','transmission','hud','utility-panel','live-map','hud-level','hud-hp','hud-xp','hud-bolts','hud-turns','hud-refill','hud-pack','hud-time','side-level','side-hp','side-xp','side-bolts','side-inv','side-turns','side-time','side-refill']){ids[name]=new E();ids[name].id=name;shell.append(ids[name]);}
const utilityName=new E();utilityName.append(new T(''));
const layout=new E();layout.className='game-layout';shell.append(layout);layout.append(ids.screen);const events={};
const document={body,documentElement:new E('html'),activeElement:ids.command,currentScript:{src:'https://example.test/route127/playtest/graphics.js'},hidden:false,querySelector:s=>s==='.terminal-shell'?shell:s==='.utility-name'?utilityName:s.startsWith('#')?ids[s.slice(1)]||null:null,querySelectorAll:()=>[],getElementById:s=>ids[s]||null,createElement:t=>new E(t),createElementNS:(_,t)=>new E(t),createTextNode:t=>new T(t),createDocumentFragment:()=>new E('fragment'),addEventListener(){}};
const storage=new Map();const ctx=vm.createContext({document,console,Math:Object.create(Math),Date,Set,Map,JSON,Promise,URL,URLSearchParams,location:{search:'',href:'https://example.test/route127/playtest/index.html'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout:f=>{queueMicrotask(f);return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},performance:{now:()=>0},requestAnimationFrame(){},addEventListener:(k,f)=>(events[k]??=[]).push(f),window:{addEventListener(){},matchMedia:()=>({matches:false})},navigator:{},confirm:()=>true,crypto:require('crypto').webcrypto});
const run=s=>vm.runInContext(s,ctx);const index=fs.readFileSync(path.join(gameDir,'index.html'),'utf8');
for(const match of index.matchAll(/<script(?: src="([^"?]+)[^"]*")?>([\s\S]*?)<\/script>/g)){const file=match[1];try{run(file?fs.readFileSync(path.join(gameDir,file),'utf8'):match[2]);}catch(e){throw new Error((file||'inline')+': '+e.stack);}}
async function flush(){for(let i=0;i<6;i++)await run('outputQueue');}
(async()=>{
 await flush();run('GraphicalUI.mount()');
 run("GraphicalUI.preferred='graphics';player.level=1;player.lifetimeTurns=0");
 run("globalThis.sample=document.createElement('div');applyLevelEvolution(sample,'TIM > Welcome, traveler.','npc-blue')");
 assert.equal(run('sample.textContent'),'TIM MERCER > Welcome, traveler.');assert.equal(run('sample.children[0].className'),'route-color-npc');
 run("applyLevelEvolution(sample,'Talk to Tess','')");assert.equal(run('sample.textContent'),'Talk to Tess Arden');assert(run("sample.children.some(n=>n.className==='route-color-wanderer')"));
 assert.equal(run("RouteIdentity.display('Ash Cemetery has moss and a patch of grass in June.')"),'Ash Cemetery has moss and a patch of grass in June.');
 assert.equal(run("RouteIdentity.display('TIM MERCER > Hello')"),'TIM MERCER > Hello');
 assert.equal(run("wandererByName('Tess Arden').name"),'Tess');
 run("globalThis.choice=document.createElement('button');choice.textContent='Talk to Tess';globalThis.choices=document.createElement('div');choices.appendChild(choice);RouteIdentity.decorate(choices)");
 const once=run('choices.textContent');for(let i=0;i<8;i++)run('RouteIdentity.decorate(choices)');assert.equal(run('choices.textContent'),once);assert.equal(run('choice.children[0].children.length'),0);
 assert.equal(run("RouteIdentity.display('Johnny’s Ledger')"),'Johnny’s Ledger');
 run("GraphicalUI.preferred='classic';RouteIdentity.sync()");assert(run('sample.children.length>0'));run("GraphicalUI.preferred='graphics';RouteIdentity.sync()");assert(!run("sample.children.some(n=>n.className==='evo-yellow')"));
 const item=run("Object.keys(GEAR).find(n=>GEAR[n].rarity==='uncommon')");
 run(`applyLevelEvolution(sample,${JSON.stringify(item+' [UNCOMMON]')},'')`);assert(run("sample.children.some(n=>n.className==='route-color-uncommon')"));
 const rare=run("Object.keys(GEAR).find(n=>GEAR[n].rarity==='rare')");
 run(`applyLevelEvolution(sample,${JSON.stringify(rare+' [RARE]')},'')`);assert(run("sample.children.some(n=>n.className==='route-color-rare')"));
 run("player.level=20;applyLevelEvolution(sample,'Ordinary road narrative.','')");assert.equal(run('sample.children.length'),0);assert.equal(run('sample.textContent'),'Ordinary road narrative.');
 run("GraphicalUI.preferred='classic';applyLevelEvolution(sample,'Ordinary road narrative.','')");assert(run('sample.children.length>0'));
 console.log('PASS stable colors at low/high levels, full names, ordinary words, save-key lookup, and Classic evolution');
})().catch(e=>{console.error(e);process.exitCode=1;});
