const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
 constructor(tag) { this.tag = tag; this.children = []; this.events = {}; this.classList = {add(){}}; }
 append(...children) { this.children.push(...children); }
 replaceChildren(...children) { this.children = children; }
 setAttribute() {}
 focus() {}
 showModal() { this.open = true; }
 close() { this.open = false; this.events.close?.(); }
 addEventListener(name, callback) { this.events[name] = callback; }
 querySelector(tag) { return this.children.find(node => node.tag === tag); }
 get options() { return this.children; }
}

(async () => {
 const body = new Element('body');
 const player = {turns:0,level:1,flags:{nextRefillAt:Date.now()+3600000}};
 const context = {
  ROUTE127_ENV:{name:'DEVTEST'}, player, stage:'lanternRoad', busy:false, testMode:false,
  URL, crypto:require('node:crypto'), document:{body,createElement:tag=>new Element(tag)},
  localStorage:{getItem(){},setItem(){}},
  fetch(){ assert.fail('Local camp must not access the network'); },
  GraphicalUI:{choices:()=>[{command:'devtest emergency one turn'}],dispatch(){}},
  TravelerPanels:{options(){}},
  handleCommand(){}, showBulletinBoard(){},
  mercyMenu(){ assert.fail('Camp must not return to town'); },
  noTurnsMenu(){ context.stage='zeroTurns'; }
 };
 vm.runInNewContext(fs.readFileSync(require.resolve('../runtime/community_board.js'),'utf8'),context);
 const nodes = function* (node) { yield node; for(const child of node.children)yield* nodes(child); };
 const find = text => [...nodes(body)].find(node=>node.textContent?.includes(text));
 const click = text => { const button=find(text); assert.ok(button,text); button.events.click(); };
 const settle = () => new Promise(resolve=>setImmediate(resolve));

 context.noTurnsMenu();
 assert.equal(body.children.length,0,'Waiting menu must not open the old camp popup');
 context.Route127Community.news();
 await settle();
 click('Important Notice');
 await settle();
 assert.ok(find('This sample notice'));
 click('Back');
 await settle();
 click('Return to Waiting for Dawn');
 context.Route127Community.discussions();
 await settle();
 assert.ok(find('turns replenish'));
 assert.equal(find('Leave a Test Note'),undefined);
 click('Stories from the road');
 await settle();
 assert.equal(find('Write a Test Response'),undefined);
 click('Back');
 await settle();
 click('Return to Waiting for Dawn');
 context.Route127Community.feedback();
 const form=[...nodes(body)].find(node=>node.tag==='form');
 await form.events.submit({preventDefault(){}});
 assert.ok(find('Feedback Preview Complete'));
 click('Return to Waiting for Dawn');
 assert.equal(context.stage,'zeroTurns');
 assert.equal(player.turns,0);
 context.testMode=true;context.Route127Community.discussions();await settle();
 assert.equal(find('Leave a Test Note'),undefined,'Unlimited testing mode does not bypass the zero-turn discussion gate');
 context.Route127Community.close();
 context.testMode=false;
 player.turns=30;
 context.stage='lanternRoad';
 context.showBulletinBoard();
 click('Community Discussions');
 await settle();
 click('Leave a Test Note');
 const editor=[...nodes(body)].find(node=>node.tag==='form');
 const fields=[...nodes(editor)];
 fields.find(node=>node.tag==='input').value='Local test note';
 fields.find(node=>node.tag==='textarea').value='Still no network writes.';
 await editor.events.submit({preventDefault(){}});
 await settle();
 assert.ok(find('Still no network writes.'));
 assert.ok(find('Write a Test Response'));
 assert.equal(player.turns,30);
 console.log('DEVTEST local board navigation, read-only discussion, isolated feedback and normal posting passed.');
})().catch(error=>{ console.error(error); process.exitCode=1; });
