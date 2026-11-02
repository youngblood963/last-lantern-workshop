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
 await flush();
 run('add=()=>{};addImmediate=()=>({});resultLine=()=>{};v49Autosave=()=>{};');
 const results=[];
 for(const level of [1,2])for(const night of [false,true]){
  let losses=0,total=0,min=999,max=0;
  for(let seed=1;seed<=500;seed++){
   run('resetPlayer();player.level='+level+';player.maxHp=baseHpForLevel(player.level);player.hp=player.maxHp;player.weapon="Rusted Pipe";player.armor="Worn Jacket";player.flags.worldHour='+(night?23:12)+';var seedValue='+seed+';Math.random=()=>{seedValue=(Math.imul(seedValue,1664525)+1013904223)>>>0;return seedValue/4294967296};startCombat({name:"THE YARDMAN",level:2,hp:55,min:5,max:8,xp:65,bolts:28},"serviceBoss");');
   let rounds=0;
   while(run('!!combatState')&&run('player.hp>0')&&rounds++<30)run('handleCombat("attack")');
   const hp=run('player.hp');if(!run("player.flags.serviceBossDead"))losses++;const spent=run('player.maxHp')-hp;total+=spent;min=Math.min(min,spent);max=Math.max(max,spent);await flush();
  }
  assert.equal(losses,0,'Full-health starting gear should reliably clear the required early boss');
  results.push({level,night,fights:500,losses,meanDamage:Math.round(total/500*10)/10,minDamage:min,maxDamage:max});
 }
 run('combatState={name:"THE YARDMAN",source:"serviceBoss",level:5,hp:41,maxHp:55,min:7,max:12,xp:65,bolts:28};tuneRelayYardman(combatState);');
 assert.equal(run('combatState.level'),2);assert.equal(run('combatState.hp'),41);assert.equal(run('combatState.maxHp'),55);assert.equal(run('combatState.xp'),65);
 run('var other={name:"THE FOREMAN",source:"factoryFight",level:8,min:15,max:22};tuneRelayYardman(other);');assert.equal(run('other.min'),15);
 run('resetPlayer();player.flags.interfaceUnlocked=true;player.flags.mercyDiscovered=true;lanternMigrate();Object.assign(lanternState(),{nodeId:"scrap-yard",currentEdgeId:null});player.flags.relayPartsRevealed=true;player.flags.serviceBossDead=true;stage="serviceRoad";serviceRoadDepth=3;');
 await run('handleCommandCore("search maintenance yard")');assert(run('ensureRelayParts().yard'));
 console.log(JSON.stringify(results));console.log('PASS saved Yardman HP/rewards preserved; Factory unaffected; Relay servo remains obtainable.');
})().catch(e=>{console.error(e);process.exitCode=1});

