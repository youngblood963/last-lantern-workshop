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
 await flush();run('GraphicalUI.mount();resetPlayer();player.flags.interfaceUnlocked=true;player.flags.mercyDiscovered=true;lanternMigrate();stage="lanternNode";');
 assert.equal(run('gearLabel("Canvas Work Coat (L02 COMMON)")'),'Canvas Work Coat [COMMON]');
 assert.equal(run('PlaythroughRepairs.cleanLabel("Pipe Forge Common04")'),'Pipe');
 for(const max of [100,150,200,310])for(const [name,rate] of [['Bandage',.25],['Energy Bars',.1]]){
  run('player.maxHp='+max+';player.hp=1;player.pack=[{name:'+JSON.stringify(name)+',type:"consumable",qty:2}];combatState=null;stage="inventory";');
  run('useItem('+JSON.stringify(name)+')');
  assert.equal(run('player.hp'),1+Math.ceil(max*rate));assert.equal(run('player.pack[0].qty'),1);
 }
 run('player.hp=199;player.maxHp=200;player.pack=[{name:"Bandage",type:"consumable",qty:1}];useItem("Bandage");');assert.equal(run('player.hp'),200);
 run('player.pack=[];player.weapon="Rusted Pipe";player.armor="Worn Jacket";stage="lanternNode";addPack("Iron Reaper","weapon");');
 assert.equal(run('player.weapon'),'Iron Reaper');assert(run('hasItem("Rusted Pipe")'));
 run('addPack("Rusted Pipe","weapon");');assert.equal(run('player.weapon'),'Iron Reaper');
 run('addPack("Iron Reaper","weapon");');assert.equal(run('player.pack.find(i=>i.name==="Iron Reaper").qty'),1);
 run('routeKeepGear("Iron Reaper","weapon");');assert.equal(run('player.pack.find(i=>i.name==="Iron Reaper").qty'),2);
 run('player.pack=[];player.armor="Worn Jacket";addPack("Reinforced Jacket","armor",1,false,true);');assert.equal(run('player.armor'),'Reinforced Jacket');assert(run('player.flags.r18EquippedStolen.armor'));assert(run('hasItem("Worn Jacket")'));
 run('var enemyResponses=0;combatRetaliation=()=>{enemyResponses++};player.hp=1;player.maxHp=200;player.pack=[{name:"Bandage",type:"consumable",qty:2}];combatState={name:"TEST",hp:100,maxHp:100,level:1,min:1,max:1};stage="combat";');
 run('handleCombat("use bandage")');assert.equal(run('enemyResponses'),0);assert.equal(run('player.hp'),51);
 run('handleCombat("attack")');assert.equal(run('enemyResponses'),1);run('enemyResponses=0;');
 run('showCombatItems()');await run('handleCommandCore("1")');assert.equal(run('enemyResponses'),0);assert.equal(run('player.hp'),101);
 run('combatState=null;player.flags.wo3Corvette={active:true};stage="mercy";mercyLocation="murphy";');
 assert.equal(run('RoadScenarioRegistry.wo3Needs("battery")'),false);assert.equal(run('CorvetteRestoration.options().length'),0);
 run('CorvetteRestoration.discover()');assert.equal(run('RoadScenarioRegistry.wo3Needs("battery")'),true);
 run('player.flags.relayPartsRevealed=true;player.flags.relayQuest="stabilize";');assert(run('PlaythroughRepairs.relayDirections().some(t=>t.includes("Signal Cabinet Road"))'));
 assert.equal(run('LANTERN_WORLD_GRAPH.edges.length'),54);assert(run('LANTERN_WORLD_GRAPH.edges.every(e=>e.name)'));
 assert.equal(run('LG_EDGES["solace--works-junction"].name'),'Route 127');
 run('Object.assign(lanternState(),{nodeId:"works-junction",currentEdgeId:null});');assert.equal(run('routeChoiceLabel("take road to scrap yard","")'),'Scrap Yard Road — toward Scrap Yard');
 run('combatState=null;stage="lanternNode";player.pack=[{name:"Scrap Metal",type:"material",qty:1}];player.packMax=1;player.weapon="Rusted Pipe";addPack("Iron Reaper","weapon");');assert.equal(run('player.weapon'),'Iron Reaper');assert(run('player.flags.r5LootQueue.some(i=>i.name==="Rusted Pipe")'));assert.equal(run('player.pack.length'),1);
 run('player.flags.relayPartsRevealed=true;player.flags.relayQuest="stabilize";stage="lanternNode";TravelerPanels.open("quests");');await run('TravelerPanels.journalOutput()');assert(run('TravelerPanels.questEntries[0].details.some(t=>t.includes("Johnny Briggs"))'));run('TravelerPanels.close();');
 assert(run('routeDiagnostic("> nudge")'));assert(!run('routeDiagnostic("Traveler Nudge found a bandage")'));
 for(const [name,rate] of Object.entries(run('HEALING_ITEM_RATES'))){
  for(const menu of [false,true]){
   run('player.hp=1;player.maxHp=400;player.pack=[{name:'+JSON.stringify(name)+',type:"consumable",qty:1}];combatState={name:"TEST",hp:100,maxHp:100,level:1,min:1,max:1};stage="combat";enemyResponses=0;');
   if(menu){run('showCombatItems()');await run('handleCommandCore("1")');}else run('handleCombat('+JSON.stringify('use '+name.toLowerCase())+')');
   assert.equal(run('player.hp'),1+Math.ceil(400*rate),name);assert.equal(run('enemyResponses'),0,name);assert.equal(run('player.pack.length'),0,name);
  }
 }
 await flush();console.log('PASS WO18: healing percentages/caps, no item retaliation, upgrades, stolen gear, quest gates, road labels, diagnostic cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1});
