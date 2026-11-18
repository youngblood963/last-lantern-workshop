const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'../runtime/solace_survivor_preview.js'),'utf8');

class Element {
 constructor(tag){this.tag=tag;this.children=[];this.events={};}
 append(...children){for(const child of children)this.insertBefore(child,null);}
 insertBefore(child,before){
  const index=this.children.indexOf(before);
  this.children.splice(index<0?this.children.length:index,0,child);
  child.parentNode=this;
 }
 remove(){
  if(!this.parentNode)return;
  this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);
  this.parentNode=null;
 }
 setAttribute(){}
 addEventListener(event,handler){this.events[event]=handler;}
 showModal(){this.open=true;}
 close(){this.open=false;this.events.close();}
}

function boot({environment='DEVTEST',search='?cloud=1&survivorPreview=1'}={}){
 const main=new Element('main'),choices=new Element('nav'),body=new Element('body');
 main.append(choices);
 const travel={nodeId:'solace',currentEdgeId:null};
 const player={characterId:'owner',flags:{solaceMenu:'town'}};
 const ctx={
  ROUTE127_ENV:{name:environment},location:{pathname:'/route127/devtest/',search},URL,URLSearchParams,
  document:{baseURI:'https://example.test/route127/playtest/',createElement:tag=>new Element(tag),body},
  GraphicalUI:{element:{main,choices,frame:{hidden:false}},sync(){},schedule(){}},
  player,stage:'mercy',mercyLocation:'town',townWandererFocus:null,combatState:null,lanternState:()=>travel
 };
 vm.runInNewContext(source,ctx);
 return {main,choices,body,travel,player,ctx,refresh:()=>ctx.GraphicalUI.sync()};
}

const demo=boot();
demo.refresh();
const roster=demo.main.children[0];
assert.match(roster.children[1].textContent,/simulation/i);
const cards=roster.children[2].children;
assert.deepEqual(cards.map(card=>card.children[1].textContent),['Forge QA','Road Scout QA']);
demo.refresh();
assert.equal(demo.main.children[0],roster);
for(const card of cards){
 assert.ok(card.children[0].src.endsWith('/devtest/assets/players/player_survivor_default.png'));
 card.events.click();
 assert.equal(demo.body.children.length,1);
 assert.equal(demo.body.children[0].children[0].textContent,card.children[1].textContent);
 assert.match(demo.body.children[0].children[3].textContent,/Level [13] · Solace/);
}
demo.travel.currentEdgeId='solace-road';
demo.refresh();
assert.deepEqual(demo.main.children,[demo.choices]);
assert.equal(demo.body.children.length,0);
demo.travel.currentEdgeId=null;
demo.player.characterId='wo68-qa-1';
demo.refresh();
assert.equal(demo.main.children[0].children[2].children.length,1);
assert.equal(demo.main.children[0].children[2].children[0].children[1].textContent,'Road Scout QA');
demo.ctx.stage='title';
demo.refresh();
assert.deepEqual(demo.main.children,[demo.choices]);
for(const options of [{search:'?cloud=1'},{environment:'PLAYTEST'}]){
 const disabled=boot(options);
 disabled.refresh();
 assert.deepEqual(disabled.main.children,[disabled.choices]);
}
assert.equal(boot().body.children.length,0);
console.log('PASS WO68 portrait, two distinct player cards, read-only inspection, self-filter, navigation and opt-in isolation');
