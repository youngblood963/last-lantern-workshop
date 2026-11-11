const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {ctx,run}=require('./helpers/devtest.cjs')({skipScripts:['environmental_effects_wo46.js']});
let now=1000,reduced=false,rafId=0,frames=new Map(),disconnected=0,draws=0;
function node(tag='div',box={left:0,top:0,width:800,height:600}){
 const listeners=new Map(),classes=new Set();
 return {tag,dataset:{},style:{},children:[],hidden:false,isConnected:true,
  classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},
  getBoundingClientRect:()=>({...box,right:box.left+box.width,bottom:box.top+box.height}),
  append(...xs){for(const x of xs){this.children.push(x);x.parentElement=this;}},
  remove(){this.isConnected=false;if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);},
  setAttribute(){},getContext:()=>({setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},save(){},restore(){},rect(){},clip(){},ellipse(){draws++;},fill(){draws++;},stroke(){draws++;},fillRect(){draws++;},createRadialGradient(){return {addColorStop(){}};}}),
  addEventListener(k,fn){if(!listeners.has(k))listeners.set(k,new Set());listeners.get(k).add(fn);},
  removeEventListener(k,fn){listeners.get(k)?.delete(fn);},
  fire(k,e={}){for(const f of listeners.get(k)||[])f(e);},
  listenerCount:()=>[...listeners.values()].reduce((n,s)=>n+s.size,0),
  querySelectorAll(selector){return ['button','.gfx-choice'].includes(selector)?this.buttons||[]:[];},
  closest(selector){return tag==='button'&&selector==='button'?this:null;}
 };
}
ctx.document.createElement=tag=>node(tag);const visibility=node();
ctx.document.addEventListener=visibility.addEventListener.bind(visibility);ctx.document.removeEventListener=visibility.removeEventListener.bind(visibility);
ctx.matchMedia=()=>Object.assign(node(),{matches:reduced});ctx.devicePixelRatio=2;
ctx.ResizeObserver=class{observe(){}disconnect(){disconnected++;}};
ctx.performance={now:()=>now};ctx.requestAnimationFrame=fn=>{frames.set(++rafId,fn);return rafId;};ctx.cancelAnimationFrame=id=>frames.delete(id);
vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../runtime/environmental_effects_wo46.js'),'utf8'),ctx);
const Controller=run('Route127Environment.Controller'),records=run('Route127Environment.records()');
assert.equal(records.length,2);
assert.equal(records.find(x=>x.effect==='rain').entry.classification,'GLOBAL');
assert(records.find(x=>x.effect==='fog').entry.regions.includes('LOWLANDS'));
const expected={rain:['SPRINT TO SHELTER','COVER WITH ARMOR','PUSH THROUGH FOR SALVAGE','BACK AWAY'],fog:['COVER FACE WITH CLOTH','WAIT FOR THE WIND','SEARCH THE PLANT STASH','BACK AWAY']};
for(const record of records)assert.deepEqual(Array.from(record.entry.encounter.choices.split(/\s{2,}/)),expected[record.effect]);
const before=run('JSON.stringify(player)'),logic=records.map(r=>r.entry.encounter.resolve);
const root=node(),scene=node('figure',{left:0,top:0,width:800,height:400}),button=node('button',{left:250,top:450,width:220,height:50});root.buttons=[button];root.append(scene);
for(const effect of ['rain','fog'])for(const period of ['dawn','day','dusk','night']){
 const e=new Controller(root,scene,{effect,period});assert.equal(e.layers.length,2);assert.equal(frames.size,1);
 const frame=[...frames.values()][0];frames.clear();frame(now);assert(draws>0);
 e.pause();assert.equal(frames.size,0);e.play();assert.equal(frames.size,1);e.restart();assert.equal(e.elapsed,0);
 const replacement=new Controller(root,scene,{effect,period});assert(e.stopped);replacement.stop();replacement.stop();assert.equal(frames.size,0);assert.equal(root.listenerCount(),0);assert.equal(scene.children.length,0);
}
const fog=new Controller(root,scene,{effect:'fog'});
root.fire('pointermove',{clientX:230,clientY:470,pointerType:'mouse'});for(let i=0;i<8;i++)fog.draw(.05);assert(fog.pointer.strength>.8);
root.fire('pointermove',{clientX:20,clientY:20,pointerType:'mouse'});fog.draw(.1);assert.equal(fog.pointer.target,0);
root.fire('pointerdown',{clientX:300,clientY:470,pointerType:'touch'});root.fire('focusin',{target:button});assert.equal(fog.pointer.focused,false);now+=2000;fog.draw(.1);assert.equal(fog.pointer.target,0,'Touch clearing must expire even if button retains focus');
now+=500;root.fire('focusin',{target:button});assert.equal(fog.pointer.focused,true);assert.equal(fog.pointer.target,1);root.fire('focusout');assert.equal(fog.pointer.target,0);
ctx.document.hidden=true;visibility.fire('visibilitychange');assert.equal(frames.size,0);ctx.document.hidden=false;visibility.fire('visibilitychange');assert.equal(frames.size,1);fog.stop();
reduced=true;const still=new Controller(root,scene,{effect:'rain'});assert.equal(frames.size,0);assert(still.reduced);still.stop();
for(let i=0;i<60;i++){const e=new Controller(root,scene,{effect:i%2?'rain':'fog'});e.stop();}
assert.equal(frames.size,0);assert.equal(root.listenerCount(),0);assert.equal(visibility.listenerCount(),0);assert(disconnected>=60);
assert.equal(run('JSON.stringify(player)'),before);records.forEach((r,i)=>assert.equal(r.entry.encounter.resolve,logic[i]));
run('GraphicalUI.active=()=>true;stage="encounter";combatState=null;');ctx.__rain=records[0].entry.encounter;run('currentEncounter=()=>__rain;');assert.equal(run('Route127Environment.liveEffect().effect'),'rain');run('stage="lanternRoad";');assert.equal(run('Route127Environment.liveEffect()'),null);run('stage="encounter";TravelerPanels.dialog={};');assert.equal(run('Route127Environment.liveEffect()'),null);
console.log('PASS WO46: authoritative registry/choices/classifications; 8 effect/time combinations; canvas draws; mouse/touch/focus clearing; pause/play/restart/stop; visibility/reduced motion; replacement and 60 cleanup cycles; no player/resolver mutations; live encounter and unrelated-menu gating');

// Issue #19: first-button preview proof, reusing the existing rain canvas/loop.
reduced=false;const second=node('button',{left:500,top:450,width:220,height:50});root.buttons=[button,second];
const wet=new Controller(root,scene,{effect:'rain',buttonDroplets:true,buttonLimit:1});
assert.equal(wet.state.drops.length,110);
assert(wet.state.drops.every(d=>d.length>=17&&d.length<=57.8),'Rain streak dimensions should grow 1.7x without adding particles');
assert.equal(button.dataset.wetBeads,'0');assert.equal(second.dataset.wetBeads,undefined);
for(let i=0;i<240;i++)wet.draw(.05);
assert(Number(button.dataset.wetBeads)>0);assert(Number(button.dataset.wetBeads)<=14);
let water=wet.wetButtons.get(button);
water.beads=[{x:.5,y:.08,radius:3.5,age:4,slide:0,trail:0},{x:.501,y:.08,radius:3.5,age:4,slide:0,trail:0}];
wet.draw(0);assert.equal(water.beads.length,1);assert(water.beads[0].radius>2);
const random=wet.random;wet.random=()=>0;wet.draw(.05);wet.random=random;
assert(water.beads[0].slide>0);assert(water.beads[0].trail>0);
assert(water.beads.every(b=>b.radius<=6.5));
const drawing=wet.layers.find(l=>l.canvas.dataset.layer==='interface').context;let beadCenter;
drawing.ellipse=(x,y)=>{if(!beadCenter)beadCenter=[x,y];};
button.getBoundingClientRect=()=>({left:20,top:430,width:340,height:50,right:360,bottom:480});
wet.draw(0);assert(Math.abs(beadCenter[0]-(20+water.beads[0].x*340))<.001);
// Scroll moves the canvas and button together; local bead position stays attached.
root.getBoundingClientRect=()=>({left:0,top:-200,width:390,height:600});
button.getBoundingClientRect=()=>({left:20,top:230,width:340,height:50,right:360,bottom:280});
beadCenter=null;wet.draw(0);assert(Math.abs(beadCenter[1]-(430+water.beads[0].y*50))<.001);
const moistureBeforeInput=JSON.stringify(water.beads);
root.fire('pointermove',{clientX:190,clientY:240,pointerType:'mouse',preventDefault(){throw Error('Input consumed');}});
root.fire('pointerdown',{clientX:190,clientY:240,pointerType:'touch',preventDefault(){throw Error('Touch consumed');}});
assert.equal(JSON.stringify(water.beads),moistureBeforeInput);
now+=500;root.fire('focusin',{target:button});assert.equal(JSON.stringify(water.beads),moistureBeforeInput);
wet.pause();const elapsed=wet.elapsed;wet.draw(0);assert.equal(wet.elapsed,elapsed);assert.equal(frames.size,0);
wet.restart();assert.equal(wet.wetButtons.size,0);wet.draw(.05);assert.equal(button.dataset.wetBeads,'0');
const strokes=draws;wet.setButtonDroplets(false);assert.equal(wet.wetButtons.size,0);assert.equal(button.dataset.wetBeads,undefined);assert(draws>strokes,'Rain must continue while beads are off');wet.stop();
reduced=true;const staticWet=new Controller(root,scene,{effect:'rain',buttonDroplets:true});assert(Number(button.dataset.wetBeads)>0);assert.equal(frames.size,0);
const staticBefore=JSON.stringify(staticWet.wetButtons.get(button).beads);
root.fire('pointerdown',{clientX:190,clientY:240,pointerType:'touch'});root.fire('pointerleave');root.fire('focusin',{target:button});root.fire('focusout');
assert.equal(JSON.stringify(staticWet.wetButtons.get(button).beads),staticBefore);staticWet.stop();
const unaffected=new Controller(root,scene,{effect:'fog',buttonDroplets:true});assert.equal(unaffected.buttonDroplets,false);unaffected.stop();
assert.equal(button.dataset.wetBeads,undefined);assert.equal(root.listenerCount(),0);assert.equal(frames.size,0);assert.equal(run('JSON.stringify(player)'),before);
console.log('PASS #19 prototype: gradual capped accumulation, first button only, merging, heavy slide/trail, resize/390px/scroll anchoring, no input-driven bead motion, pause/restart, toggle-off rain preservation, static reduced motion, fog exclusion and complete cleanup');
reduced=false;root.buttons=[button,second,node('button'),node('button')];
const gameplayWet=new Controller(root,scene,{effect:'rain',buttonDroplets:true,buttonLimit:4});
for(let i=0;i<120;i++)gameplayWet.draw(.05);
assert.equal(root.buttons.filter(b=>Number(b.dataset.wetBeads)>0).length,4);
gameplayWet.stop();assert(root.buttons.every(b=>b.dataset.wetBeads===undefined));assert.equal(frames.size,0);
console.log('PASS #19 rollout: all four Red Rain choices accumulate independently and dispose together');

// Execute the shipped live-owner hook, rather than only constructing controllers.
const integration=require('./helpers/devtest.cjs')({skipScripts:['environmental_effects_wo46.js']});
integration.ctx.document.createElement=tag=>node(tag);integration.ctx.matchMedia=()=>Object.assign(node(),{matches:false});integration.ctx.devicePixelRatio=1;
integration.ctx.ResizeObserver=ctx.ResizeObserver;integration.ctx.performance={now:()=>now};integration.ctx.requestAnimationFrame=ctx.requestAnimationFrame;integration.ctx.cancelAnimationFrame=ctx.cancelAnimationFrame;
const liveRoot=node(),liveFigure=node('figure');liveRoot.buttons=Array.from({length:4},()=>node('button'));liveRoot.append(liveFigure);
integration.ctx.__frame=liveRoot;integration.ctx.__figure=liveFigure;
integration.run(`GraphicalUI.sync=()=>{};GraphicalUI.active=()=>true;GraphicalUI.element={frame:__frame,figure:__figure};stage='encounter';combatState=null;currentEncounter=()=>RoadScenarioRegistry.entries.find(e=>e.encounter.title==='THE RED RAIN').encounter;loadGame=()=>{stage='lanternRoad';return true;};`);
const liveBefore=integration.run('JSON.stringify(player)');
vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../runtime/environmental_effects_wo46.js'),'utf8'),integration.ctx);
integration.run('GraphicalUI.sync()');assert.equal(integration.run('Route127Environment.diagnostics().effect'),'rain');
for(let i=0;i<200;i++){now+=20;const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(now);}
assert.equal(liveRoot.buttons.filter(b=>Number(b.dataset.wetBeads)>0).length,4,'All four live choices collect beads');
integration.run('stage="lanternRoad";GraphicalUI.sync();');assert(liveRoot.buttons.every(b=>b.dataset.wetBeads===undefined));assert.equal(frames.size,0);
integration.run('stage="encounter";GraphicalUI.sync();loadGame();');assert(liveRoot.buttons.every(b=>b.dataset.wetBeads===undefined));assert.equal(frames.size,0);
assert.equal(integration.run('JSON.stringify(player)'),liveBefore);
console.log('PASS #19 shipped live hook: rainfall retained, pooling on all four live choices, unrelated-stage/load cleanup, unchanged player data');
