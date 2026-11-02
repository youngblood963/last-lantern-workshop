/* WO17: graphical traveler overlays. Gameplay mutations use the existing command
 * pipeline. Closing restores the original view/bindings without regenerating it. */
const TravelerPanels={
 dialog:null,snapshot:null,working:false,selected:null,filter:'All',page:'active',questIndex:0,
 node(tag,cls,text){return GraphicalUI.node(tag,cls,text);},
 button(label,fn,cls=''){return GraphicalUI.button(label,fn,'traveler-button '+cls);},
 art(kind){const n=this.node('div','traveler-art traveler-art-'+kind);n.setAttribute('role','img');n.setAttribute('aria-label',({inventory:'Weathered traveler backpack',status:'Wasteland traveler',quests:'Leather field journal'})[kind]);return n;},
 async settle(){await outputQueue;await Promise.resolve();await outputQueue;},
 open(which){
  if(busy||this.dialog||!player.flags.interfaceUnlocked)return false;
  if(combatState?.r18Bare&&which==='inventory'){add('No inventory use during a bare-knuckle match.','system');return false;}
  // Ordinary combat retains its existing combat-item flow and retaliation rules.
  if(combatState)return wo17OpenInterface(which);
  const focus=document.activeElement,scroll=screen.scrollTop,layout=GraphicalUI.layout(),content=document.createDocumentFragment();
  while(screen.firstChild)content.appendChild(screen.firstChild);
  this.snapshot={stage,returnStage,inventoryMode,numberedChoices,currentHotkeys,usedHotkeys,reservedChoiceKeys,content,focus,scroll,layout};
  this.which=which;this.filter='All';this.selected=null;this.page='active';this.questIndex=0;
  stage=({inventory:'inventory',status:'interfaceStatus',quests:'quests'})[which]||this.snapshot.stage;returnStage=this.snapshot.stage;
  numberedChoices={};currentHotkeys={};inventoryMode=null;
  const d=this.node('dialog','traveler-overlay');d.setAttribute('aria-label',({inventory:'Backpack',status:'Character',quests:'Journal',options:'Interface options',menu:'Interface menu'})[which]);
  const h=this.node('header','traveler-header');const title=this.node('div');title.appendChild(this.node('h1','',({inventory:'BACKPACK',status:'CHARACTER',quests:'JOURNAL',options:'INTERFACE',menu:'TRAVELER MENU'})[which]));title.appendChild(this.node('p','traveler-eyebrow',({inventory:'FIELD INVENTORY',status:'TRAVELER RECORD',quests:'STORIES FROM THE ROAD',options:'DISPLAY OPTIONS',menu:'YOUR ROAD TOOLS'})[which]));h.appendChild(title);
  this.capacity=this.node('p','traveler-capacity');h.appendChild(this.capacity);
  this.closeButton=this.button('X',()=>this.close(),'traveler-close');this.closeButton.setAttribute('aria-label','Close '+which);h.appendChild(this.closeButton);d.appendChild(h);
  this.body=this.node('div','traveler-body');d.appendChild(this.body);
  this.footer=this.node('footer','traveler-footer','Select an entry to inspect it. Close with X or Escape.');d.appendChild(this.footer);
  d.addEventListener('cancel',e=>{e.preventDefault();this.close();});
  document.body.appendChild(d);this.dialog=d;document.body.classList.add('traveler-panel-open');
  this.render();d.showModal();this.closeButton.focus();return true;
 },
 close(){
  if(!this.dialog||this.working)return;
  const s=this.snapshot;this.dialog.close();this.dialog.remove();this.dialog=null;
  stage=s.stage;returnStage=s.returnStage;inventoryMode=s.inventoryMode;numberedChoices=s.numberedChoices;currentHotkeys=s.currentHotkeys;usedHotkeys=s.usedHotkeys;reservedChoiceKeys=s.reservedChoiceKeys;
  screen.replaceChildren(s.content);screen.scrollTop=s.scroll;this.snapshot=null;
  document.body.classList.remove('traveler-panel-open');updateHud();GraphicalUI.sync();
  if(s.focus?.isConnected)s.focus.focus();
 },
 render(){
  if(!this.dialog)return;
  this.capacity.textContent=this.which==='inventory'?`${packSlotsUsed()} / ${player.packMax} slots`:`${player.handle||'Traveler'} · LV ${player.level}`;
  this.body.replaceChildren();
  if(this.which==='inventory')this.inventory();else if(this.which==='status')this.character();else if(this.which==='quests')this.journal();else this.options();
 },
 tabs(labels,selected,fn){const nav=this.node('nav','traveler-tabs');nav.setAttribute('aria-label','Filter entries');for(const label of labels){const b=this.button(label,()=>fn(label));b.setAttribute('aria-pressed',String(label===selected));nav.appendChild(b);}return nav;},
 items(){return player.pack.filter(i=>this.filter==='All'||this.filter==='Equipment'&&['weapon','armor','accessory'].includes(i.type)||this.filter==='Supplies'&&['consumable','tool','supply','valuable'].includes(i.type)||this.filter==='Materials'&&i.type==='material'||this.filter==='Quest Items'&&['key','quest'].includes(i.type));},
 inventory(){
  const list=this.node('section','traveler-list-section');
  list.appendChild(this.tabs(['All','Equipment','Supplies','Materials','Quest Items'],this.filter,label=>{if(this.working)return;this.filter=label;this.render();}));
  const rows=this.node('div','traveler-list');rows.setAttribute('aria-label','Carried items');
  const items=this.items();
  if(!items.length)rows.appendChild(this.node('p','traveler-empty','No items in this category.'));
  items.forEach((item,index)=>{
   const rarity=GEAR[item.name]?.rarity||(item.name==='Wild Honey'?'uncommon':'common');
   const b=this.button('',()=>this.select(item),'traveler-item '+rarity);b.disabled=this.working;
   b.setAttribute('aria-pressed',String(this.selected===item));
   const icon=this.node('span','traveler-item-icon');icon.appendChild(GraphicalUI.icon(['weapon','armor','accessory'].includes(item.type)?'person':['key','quest'].includes(item.type)?'book':item.type==='material'?'tool':'pack'));b.appendChild(icon);
   const label=this.node('span','traveler-item-label');label.appendChild(this.node('strong','',gearLabel(item.name)));label.appendChild(this.node('small','',`${index+1} · ${item.stolen?'STOLEN · ':''}${item.type.toUpperCase()} · ${rarity.toUpperCase()}`));b.appendChild(label);b.appendChild(this.node('span','traveler-quantity','×'+item.qty));rows.appendChild(b);
  });list.appendChild(rows);list.appendChild(this.node('p','traveler-note','Key items and quest components use no backpack slots.'));
  this.body.appendChild(list);
  const detail=this.node('section','traveler-detail');detail.appendChild(this.art('inventory'));
  if(!this.selected||!player.pack.includes(this.selected)){this.selected=null;detail.appendChild(this.node('h2','','YOUR ROAD KIT'));detail.appendChild(this.node('p','','Choose an item to inspect, use, equip, or discard it.'));}
  else{
   const i=this.selected;detail.appendChild(this.node('h2','',gearLabel(i.name)));detail.appendChild(this.node('p','traveler-note',`Quantity: ${i.qty}${i.stolen?' · Stolen property':''}`));
   const log=this.node('div','traveler-item-description');log.setAttribute('aria-live','polite');
   for(const row of screen.children){if(row.classList.contains('ui-choice-output'))continue;const t=row.textContent.trim();if(t&&!/^>/.test(t))log.appendChild(row.cloneNode(true));}detail.appendChild(log);
   const actions=this.node('div','traveler-actions');
   const choices=stage==='confirmDrop'?[['Confirm Drop','yes'],['Cancel','no']]:Object.entries(currentHotkeys).filter(([key])=>['e','u','d'].includes(key)).map(([key,cmd])=>[key==='e'?'Equip':key==='u'?'Use':i.name==='Battered Flashlight'?'Dismantle':'Drop',key]);
   for(const [label,cmd]of choices){const b=this.button(label,()=>this.action(cmd),label==='Confirm Drop'?'danger':'');b.disabled=this.working;actions.appendChild(b);}detail.appendChild(actions);
  }
  this.body.appendChild(detail);
 },
 async select(item){
  if(this.working||!player.pack.includes(item)||!this.dialog)return;
  this.working=true;this.selected=item;this.closeButton.disabled=true;
  try{await this.settle();screen.replaceChildren();await showInventoryItem(r18ItemLabel(item));await this.settle();}
  finally{this.working=false;this.closeButton.disabled=false;this.render();}
 },
 async action(cmd){
  if(this.working||!this.selected||!player.pack.includes(this.selected))return;
  this.working=true;this.closeButton.disabled=true;
  try{
   await this.settle();screen.replaceChildren();
   await wo17PanelCommand(cmd);await this.settle();
   if(!['inventory','inventoryItem','confirmDrop'].includes(stage)){
    // A pending-loot flow owns control; dismiss the presentation without losing it.
    const current={stage,returnStage,inventoryMode,numberedChoices,currentHotkeys,usedHotkeys,reservedChoiceKeys};
    this.working=false;this.close();stage=current.stage;returnStage=current.returnStage;inventoryMode=current.inventoryMode;numberedChoices=current.numberedChoices;currentHotkeys=current.currentHotkeys;usedHotkeys=current.usedHotkeys;reservedChoiceKeys=current.reservedChoiceKeys;renderCurrentChoices();return;
   }
   const feedback=[...screen.children].filter(n=>/reward|danger/.test(n.className)).map(n=>n.textContent).slice(0,2).join(' ');
   if(feedback)this.footer.textContent=feedback;
   if(stage!=='confirmDrop'&&player.pack.includes(this.selected)){screen.replaceChildren();await showInventoryItem(r18ItemLabel(this.selected));await this.settle();}
  }finally{this.working=false;if(this.dialog){this.closeButton.disabled=false;this.render();}}
 },
 field(parent,label,value,cls=''){const n=this.node('div','traveler-field '+cls);n.appendChild(this.node('small','',label));n.appendChild(this.node('strong','',String(value)));parent.appendChild(n);},
 character(){
  const left=this.node('section','traveler-character-art');left.appendChild(this.art('status'));left.appendChild(this.node('h2','',player.handle||'Traveler'));
  const gear=this.node('div','traveler-equipment');
  for(const slot of ['weapon','armor','accessory'])this.field(gear,slot.toUpperCase(),player[slot]?gearLabel(player[slot]):'None',GEAR[player[slot]]?.rarity||'common');
  this.field(gear,'COMPANION',player.flags.equippedPet==='Rescued Hound'&&player.flags.r18HoundName?player.flags.r18HoundName:player.flags.equippedPet||'None');left.appendChild(gear);this.body.appendChild(left);
  const right=this.node('section','traveler-detail');right.appendChild(this.node('h2','','SURVIVOR STATUS'));right.appendChild(GraphicalUI.meter('HP',player.hp,player.maxHp,'hp'));right.appendChild(GraphicalUI.meter('XP',player.xp,player.nextXp,'xp'));
  const grid=this.node('div','traveler-stat-grid'),range=weaponRange();this.field(grid,'LEVEL',player.level);this.field(grid,'DAMAGE',range[0]+'–'+range[1]);this.field(grid,'DEFENSE',armorDefense());this.field(grid,'BOLTS',player.bolts);this.field(grid,'TURNS',player.turns+' / '+player.maxTurns);this.field(grid,'PACK',packSlotsUsed()+' / '+player.packMax);this.field(grid,'TIME',timePhase());this.field(grid,'TURN REFILL',refillText());right.appendChild(grid);
  right.appendChild(this.node('p','traveler-note','Equipment changes are available in Backpack.'));
  const actions=this.node('div','traveler-actions');actions.appendChild(this.button('Manage Companions',()=>this.handoff('manage pets')));
  if(player.flags.r18HorseOwned)actions.appendChild(this.button('Horse Travel',()=>this.handoff('horse travel')));
  right.appendChild(actions);this.body.appendChild(right);
 },
 async handoff(command){
  if(this.working)return;this.working=true;
  try{await this.settle();screen.replaceChildren();await wo17PanelCommand(command);await this.settle();
   this.dialog.close();this.dialog.remove();this.dialog=null;this.snapshot=null;document.body.classList.remove('traveler-panel-open');updateHud();GraphicalUI.sync();
  }finally{this.working=false;}
 },
 options(){
  this.body.classList.add('traveler-options-body');
  const panel=this.node('section','traveler-detail');panel.appendChild(this.node('h2','',this.which==='menu'?'WHERE TO?':'DISPLAY MODE'));
  panel.appendChild(this.node('p','traveler-note','Choose a screen, or close with X to return to your journey.'));
  if(this.which==='menu')for(const [command,label]of GraphicalUI.nav(GraphicalUI.model()))panel.appendChild(this.button(label,async()=>{this.close();await handleCommand(command);GraphicalUI.sync();}));
  panel.appendChild(this.button('Full Graphics',()=>{this.close();GraphicalUI.setMode('graphics');}));
  panel.appendChild(this.button('Classic BBS',()=>{this.close();GraphicalUI.setMode('classic');}));
  panel.appendChild(this.button('Close',()=>this.close()));this.body.appendChild(panel);
 },
 async journalPage(page){
  if(this.working)return;this.page=page;this.questIndex=0;await this.journalOutput();this.render();
 },
 async journalOutput(){
  this.working=true;this.closeButton.disabled=true;
  try{await this.settle();screen.replaceChildren();const old=player.flags.r5JournalPage;player.flags.r5JournalPage=this.page;try{showQuests();}finally{if(old===undefined)delete player.flags.r5JournalPage;else player.flags.r5JournalPage=old;}await this.settle();this.questEntries=[];this.mainObjective=portQuestObjective();
   let entry=null,skipDetail=false;
   for(const n of screen.children){const t=n.textContent.trim();if(!t||n.classList.contains('ui-choice-output')||/^\[|^\(B\)|^BACK$|^QUEST JOURNAL/.test(t))continue;
    if(/^(SIDE QUEST|COMPLETE) — /.test(t)){
     const complete=t.startsWith('COMPLETE');entry=complete===(this.page==='completed')?{title:t.replace(/^(SIDE QUEST|COMPLETE) — /,''),details:[]}:null;
     if(entry)this.questEntries.push(entry);skipDetail=!entry;
    }else if(skipDetail){skipDetail=false;}else if(n.classList.contains('place')){entry=null;}
    else if(entry){entry.details.push(t);entry=null;}
    else{const parts=t.split(' — ');this.questEntries.push({title:parts.length>1?parts[0]:t,details:[parts.length>1?parts.slice(1).join(' — '):t]});}
   }
   // Existing quest helper supplies the state-specific runner objective.
   const jen=this.questEntries.find(e=>e.title==='Last Call');if(jen&&this.page==='active')jen.details.push(jenQuestObjective());
   if(this.page==='active'&&player.flags.relayPartsRevealed&&player.flags.relayQuest!=='complete'){
    this.questEntries=this.questEntries.filter(e=>! /^(NEEDED|RECOVERED)$/.test(e.title));
    this.questEntries.unshift({title:'The Relay — Parts and directions',details:PlaythroughRepairs.relayDirections()});
   }}
  finally{this.working=false;this.closeButton.disabled=false;}
 },
 journal(){
  const left=this.node('section','traveler-list-section');left.appendChild(this.tabs(['Active','Completed'],this.page==='active'?'Active':'Completed',label=>this.journalPage(label.toLowerCase())));
  left.appendChild(this.node('p','traveler-main-objective','MAIN — '+(this.mainObjective||portQuestObjective())));
  const rows=this.node('div','traveler-list');const entries=this.questEntries||[];
  entries.forEach((entry,index)=>{const b=this.button(entry.title,()=>{this.questIndex=index;this.render();},'traveler-quest');b.setAttribute('aria-pressed',String(index===this.questIndex));b.disabled=this.working;rows.appendChild(b);});
  if(!entries.length)rows.appendChild(this.node('p','traveler-empty','No '+this.page+' entries discovered.'));left.appendChild(rows);this.body.appendChild(left);
  const right=this.node('section','traveler-detail');right.appendChild(this.art('quests'));right.appendChild(this.node('p','traveler-eyebrow','FIELD NOTES'));right.appendChild(this.node('h2','',entries[this.questIndex]?.title||'Your journey'));for(const text of entries[this.questIndex]?.details||[])right.appendChild(this.node('p','',text));
  right.appendChild(this.node('p','traveler-note','Objectives and entries come from your current quest journal.'));this.body.appendChild(right);
 },
 async command(raw){const cmd=String(raw).trim().toLowerCase();if(this.working)return;
  if(['x','escape','b','back','exit'].includes(cmd))return this.close();
  if(this.which==='inventory'){
   if(/^\d+$/.test(cmd)){const item=this.items()[Number(cmd)-1];if(item)return this.select(item);}
   if(stage==='confirmDrop'&&['y','yes','n','no','confirm drop','cancel'].includes(cmd))return this.action(cmd);
   if(stage==='inventoryItem'&&['e','equip','u','use','d','drop','dismantle'].includes(cmd))return this.action(cmd);
  }
 }
};
const wo17OpenInterface=openInterface;
openInterface=function(which,...args){
 if(GraphicalUI.active()&&['inventory','status','quests'].includes(which)){
  const opened=TravelerPanels.open(which);
  if(opened&&which==='quests'&&TravelerPanels.dialog)TravelerPanels.ready=TravelerPanels.journalOutput().then(()=>TravelerPanels.render());
  return opened;
 }
 return wo17OpenInterface(which,...args);
};
const wo17PanelCommand=handleCommand;
handleCommand=async function(raw){if(TravelerPanels.dialog)return TravelerPanels.command(raw);return wo17PanelCommand(raw);};
addEventListener('keydown',event=>{
 if(!TravelerPanels.dialog?.open)return;
 if(['Escape','x','X'].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();TravelerPanels.close();return;}
 if(event.key==='Tab'||event.key==='Enter'||event.key===' ')return;
 event.stopImmediatePropagation();
 if(event.ctrlKey||event.altKey||event.metaKey)return;
 if(/^[1-9eudynb]$/i.test(event.key)){event.preventDefault();if(!event.repeat)TravelerPanels.command(event.key);}
},true);

// Both Options and the compact side-menu selector use the same modal shell.
const wo17GraphicsSync=GraphicalUI.sync;
GraphicalUI.sync=function(){
 if(this.optionsOpen&&this.active()&&!TravelerPanels.dialog){this.optionsOpen=false;wo17GraphicsSync.call(this);TravelerPanels.open('options');return;}
 if(this.navOpen&&this.active()&&!TravelerPanels.dialog){this.navOpen=false;wo17GraphicsSync.call(this);TravelerPanels.open('menu');return;}
 return wo17GraphicsSync.call(this);
};

const wo17GraphicsLayout=GraphicalUI.layout;
GraphicalUI.layout=function(){return TravelerPanels.dialog?TravelerPanels.snapshot.layout:wo17GraphicsLayout.call(this);};

// Override the legacy purchase binding after registry installation.
v48BuyBackpack=buyTravelerBackpack;
