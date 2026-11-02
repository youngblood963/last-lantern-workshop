/* Focused graphical text/number entry. All commits retain the existing command
 * handlers and confirmations. The legacy input remains available in Classic BBS. */
const FocusedEntry={
 dialog:null,field:null,request:null,working:false,scheduled:false,dismissed:null,manual:null,keyboard:'',
 enabled(){return GraphicalUI.preference()==='graphics';},
 context(){return [stage,mercyLocation,player.flags.portStaffUI?.page,player.flags.v48BankPage,combatState?.source].join('|');},
 describe(){
  const f=player.flags,number=(key,title,max,cancel='back')=>({key,title,label:'Exact amount',numeric:true,min:1,max,cancel,format:v=>v});
  if(stage==='handle')return {key:'traveler-name',title:'Create your traveler',label:'Traveler name',maxLength:16,hint:'Up to 16 characters. RANDOM gives a suggestion.',cancel:()=>titleScreen(),format:v=>v};
  if(stage==='r7Name'&&!f.r7ProposedName)return {key:'rename',title:'Change traveler name',label:'New name',maxLength:20,hint:'3–20 characters. The existing 500-Bolt fee, risks, and final confirmation still apply.',cancel:'cancel',format:v=>v};
  if(stage==='encounter'&&f.r18HoundNaming)return {key:'hound-name',title:'Name your companion',label:'Hound name',maxLength:24,cancel:'cancel',format:v=>v};
  if(stage==='mercy'&&mercyLocation==='murphy'&&typeof CorvetteRestoration!=='undefined'){
   const q=CorvetteRestoration.state();
   if(q.naming&&q.complete&&!q.name)return {key:'corvette-name',title:'Name the Corvette',label:'Corvette name',maxLength:30,cancel:()=>{delete q.naming;murphyTalkMenu();},format:v=>'name corvette '+v};
  }
  if(f.v53Sale?.mode==='custom')return number('sale:'+f.v53Sale.name,'Choose sale quantity',f.v53Sale.available,'cancel sale');
  if(stage==='mercy'&&mercyLocation==='amii'&&f.v49BankCustom)return number('bank:'+f.v49BankCustom,f.v49BankCustom==='deposit'?'Deposit Bolts':'Withdraw Bolts',f.v49BankCustom==='deposit'?player.bolts:player.bankBolts);
  if(stage==='port55Service'&&f.portStaffUI?.role==='bank'&&f.portStaffUI.page==='money')return number('seaport:'+f.portStaffUI.action,f.portStaffUI.action==='deposit'?'Deposit Bolts':'Withdraw Bolts',f.portStaffUI.action==='deposit'?player.bolts:player.bankBolts);
  const round=stage==='r6Casino'&&typeof r6Round==='function'?r6Round():stage==='mercy'&&mercyLocation==='casinoGame'?player.flags.casino?.round:null;
  if(round?.status==='waiting'&&round.custom)return {...number('wager:'+stage+':'+round.id,'Custom wager',player.bolts),hint:round.game==='blackjack'?'Blackjack requires an even whole-Bolt wager.':'Enter an affordable whole-Bolt wager.'};
  if(f.v53BoardEntry)return {key:'solace-message',title:'Write a bulletin-board message',label:'Message',maxLength:BOARD_MAX_CHARS,cancel:'cancel',format:v=>v};
  if(stage==='r11Board'&&f.r11BoardPosting)return {key:'seaport-message',title:'Write a bulletin-board message',label:'Message',maxLength:BOARD_MAX_CHARS,cancel:()=>{delete f.r11BoardPosting;r11PortBoard();},format:v=>'post '+v};
  if(stage==='hello')return {key:'terminal-reply',title:'Reply to the terminal',label:'Your reply',maxLength:120,hint:'The terminal is waiting for a response.',format:v=>v};
  if(QA_BUILD&&stage==='testingCode')return {key:'qa-code',title:'Testing access',label:'Access code',password:true,maxLength:100,cancel:'cancel',format:v=>v};
  return null;
 },
 schedule(){
  if(this.scheduled)return;this.scheduled=true;
  Promise.resolve().then(async()=>{await outputQueue;await Promise.resolve();await outputQueue;this.scheduled=false;this.sync();}).catch(error=>{this.scheduled=false;console.error('Focused entry:',error);});
 },
 sync(){
  const on=this.enabled();document.body.classList.toggle('graphical-input-mode',on);
  if(!on){if(this.dialog&&!this.working)this.close();if(this.legacy)this.legacy.hidden=true;return;}
  if(busy||commandProcessing||this.working)return;
  if(this.manual&&this.manual.origin!==this.context())this.manual=null;
  const d=this.manual||this.describe();
  if(this.dialog){if(!d||d.key!==this.request.key)this.close();else return;}
  const bindings=this.context()+'|'+JSON.stringify(numberedChoices)+'|'+JSON.stringify(currentHotkeys);if(this.keyboardContext!==bindings){this.keyboard='';this.keyboardContext=bindings;}
  this.actions(d);
  if(d&&this.dismissed!==d.key&&!TravelerPanels.dialog&&!Route127MapOverlay.dialog?.open&&!r5Credits)this.open(d);
  if(!d)this.dismissed=null;
 },
 button(label,fn){return GraphicalUI.button(label,fn,'traveler-button entry-action');},
 async dispatch(raw){
  if(busy||commandProcessing||this.working||this.dialog)return;
  commandProcessing=true;setInputWaiting(true);
  try{await handleCommand(raw);await outputQueue;}
  finally{commandProcessing=false;setInputWaiting(false);this.schedule();}
 },
 extras(){
  const out=[],f=player.flags;
  if(stage==='r6Casino'&&r6Round()?.game==="PIRATE'S POKER"&&r6Round()?.status==='active')out.push(['Choose cards to draw',()=>this.openManual({key:'poker-draw',title:'Choose cards to draw',label:'Card numbers',hint:'Enter up to three different card numbers from 1 to 5, separated by spaces.',maxLength:5,validate:v=>{const a=v.split(/\s+/);return a.length>3||new Set(a).size!==a.length||a.some(n=>! /^[1-5]$/.test(n))?'Choose 1–3 different card numbers from 1 to 5.':'';},format:v=>'draw '+v})]);
  const chest=stage==='mercy'&&mercyLocation==='jenRoomChest'?player.rustyRoomChest:stage==='r6Room'&&f.r6RoomChestOpen?f.r6AnchorRoomChest:null;
  if(chest){for(const deposit of [true,false]){
   const items=(deposit?player.pack:chest).filter(i=>!deposit||!['key','quest'].includes(i.type)&&![player.weapon,player.armor].includes(i.name));
   if(items.length)out.push([deposit?'Store an exact quantity':'Withdraw an exact quantity',()=>this.openManual({key:'chest:'+deposit,title:deposit?'Store items':'Withdraw items',label:'Quantity',numeric:true,min:1,items:items.map(i=>({label:r18ItemLabel(i)+' ×'+i.qty,name:r18ItemLabel(i),max:i.qty})),format:(v,i)=>(deposit?'deposit ':'withdraw ')+i.name+' x'+v})]);
  }}
  return out;
 },
 actions(d){
  if(!this.legacy){const shell=document.querySelector('.terminal-shell');if(!shell)return;this.legacy=GraphicalUI.node('nav','entry-legacy-actions');this.legacy.setAttribute('aria-label','Available game actions');shell.insertBefore(this.legacy,form);}
  this.legacy.hidden=GraphicalUI.active();this.legacy.replaceChildren();
  if(!GraphicalUI.active()&&!d){
   let choices=GraphicalUI.choices().map(c=>[c.command,()=>this.dispatch(c.key)]);
   if(stage==='title')choices=[['New Game',()=>this.dispatch('new game')],['Skip Intro',()=>this.dispatch('skip intro')],...(newestSave()?[['Continue',()=>this.dispatch('continue')],...[1,2,3].filter(n=>getSaveData(n)).map(n=>['Load '+n,()=>this.dispatch('load '+n)])]:[])];
   if(stage==='listen')choices=[['Listen',()=>this.dispatch('listen')]];
   if(stage==='savecoords')choices=[['Log Coordinates',()=>this.dispatch('log coordinates')]];
   if(stage==='confirmHandle')choices=[['Confirm '+pendingHandle,()=>this.dispatch('yes')],['Change Name',()=>this.dispatch('no')]];
   if(['confirmNewSlot','confirmNewOverwrite','confirmSaveOverwrite'].includes(stage))choices=[['Confirm',()=>this.dispatch('yes')],['Cancel',()=>this.dispatch('no')]];
   if(stage==='selectNewOverwrite')choices=[...[1,2,3].map(n=>['Replace Save '+n,()=>this.dispatch('save '+n)]),['Cancel',()=>this.dispatch('cancel')]];
   for(const [label,fn]of choices)this.legacy.appendChild(this.button(label,fn));
  }
  const host=GraphicalUI.active()?GraphicalUI.element?.choices:this.legacy;
  if(!host)return;
  for(const choice of host.children)if(choice.classList.contains('gfx-choice')&&/<ITEM NAME>/i.test(choice.textContent))choice.hidden=true;
  for(const old of [...host.children].filter(n=>n.classList.contains('entry-action')))if(host!==this.legacy)old.remove();
  if(d){const b=this.button(d.numeric?'Enter exact amount':d.title,()=>{this.dismissed=null;this.open(d);});host.appendChild(b);}
  else for(const [label,fn]of this.extras())host.appendChild(this.button(label,fn));
  if(host!==this.legacy)host.style.setProperty('--gfx-choice-rows',String(Math.max(1,Math.ceil(host.children.length/2))));
 },
 openManual(d){if(this.dialog||busy||commandProcessing)return;this.manual={...d,origin:this.context()};this.open(this.manual);},
 open(d){
  if(this.dialog||this.working||busy)return;
  this.request=d;this.previousFocus=document.activeElement;this.startContext=this.context();
  const dialog=GraphicalUI.node('dialog','traveler-overlay traveler-entry-dialog');dialog.setAttribute('aria-label',d.title);
  const header=GraphicalUI.node('header','traveler-header');header.appendChild(GraphicalUI.node('h2','',d.title));
  const close=this.button('X',()=>this.cancel());close.setAttribute('aria-label','Close input');header.appendChild(close);dialog.appendChild(header);
  const ownForm=GraphicalUI.node('form','entry-form');
  if(d.items){const label=GraphicalUI.node('label','','Item');const select=GraphicalUI.node('select');select.id='entry-item';for(const [i,item]of d.items.entries()){const option=GraphicalUI.node('option','',item.label);option.value=String(i);select.appendChild(option);}select.value='0';label.appendChild(select);ownForm.appendChild(label);this.itemSelect=select;}else this.itemSelect=null;
  const label=GraphicalUI.node('label','',d.label),field=GraphicalUI.node('input');field.id='focused-game-entry';field.type=d.password?'password':'text';field.autocomplete='off';field.spellcheck=false;field.required=true;field.setAttribute('aria-describedby','focused-entry-help focused-entry-feedback');
  if(d.numeric){field.inputMode='numeric';field.pattern='[0-9]+';}if(d.maxLength)field.maxLength=d.maxLength;label.appendChild(field);ownForm.appendChild(label);
  const help=GraphicalUI.node('p','traveler-note',d.hint||(d.numeric?`Enter a whole number${Number.isSafeInteger(d.max)?' from 1 to '+d.max:''}.`:'Enter the name you want to use.'));help.id='focused-entry-help';ownForm.appendChild(help);
  const feedback=GraphicalUI.node('p','entry-feedback');feedback.id='focused-entry-feedback';feedback.setAttribute('role','status');ownForm.appendChild(feedback);
  const actions=GraphicalUI.node('div','traveler-actions'),submit=this.button('Continue',()=>{});submit.type='submit';actions.appendChild(submit);
  if(d.numeric)actions.appendChild(this.button('All',()=>{const max=d.items?.[Number(this.itemSelect?.value||0)]?.max??d.max;if(Number.isSafeInteger(max)&&max>0)field.value=String(max);}));
  actions.appendChild(this.button('Cancel',()=>this.cancel()));ownForm.appendChild(actions);
  ownForm.addEventListener('submit',e=>{e.preventDefault();this.submit();});dialog.appendChild(ownForm);dialog.addEventListener('cancel',e=>{e.preventDefault();this.cancel();});
  document.body.appendChild(dialog);this.dialog=dialog;this.field=field;this.feedback=feedback;this.submitButton=submit;this.closeButton=close;dialog.showModal();field.focus();
 },
 close(){
  if(!this.dialog)return;this.dialog.close();this.dialog.remove();this.dialog=null;this.request=null;this.field=null;this.manual=null;
  if(this.previousFocus?.isConnected)this.previousFocus.focus();
 },
 async cancel(){
  if(!this.dialog||this.working)return;const d=this.request;this.dismissed=d.key;this.working=true;
  try{this.close();if(typeof d.cancel==='function')d.cancel();else if(d.cancel)await entryPreviousCommand(d.cancel);await outputQueue;}
  finally{this.working=false;this.schedule();}
 },
 async submit(){
  if(!this.dialog||this.working||busy||commandProcessing)return;
  const d=this.request,value=this.field.value.trim(),item=d.items?.[Number(this.itemSelect?.value||0)];
  const current=this.manual||this.describe();
  if(this.startContext!==this.context()||!current||current.key!==d.key){this.close();this.schedule();return;}
  let error=!value?'Enter a value to continue.':'';
  if(d.items&&!item)error='Choose an item first.';
  if(d.numeric){const n=Number(value),max=item?.max??d.max;if(!/^\d+$/.test(value)||!Number.isSafeInteger(n)||n<(d.min||1)||Number.isSafeInteger(max)&&n>max)error='Enter a whole number from '+(d.min||1)+(Number.isSafeInteger(max)?' to '+max:'')+'.';}
  if(!error&&d.validate)error=d.validate(value);
  if(error){this.feedback.textContent=error;this.field.focus();return;}
  this.working=true;this.submitButton.disabled=true;this.closeButton.disabled=true;
  const oldNodes=new Set(screen.children),wallet=player.bolts,board=JSON.stringify(getBoardPosts());
  try{
   // Numeric entry is data, never a stale numbered menu action.
   numberedChoices={};currentHotkeys={};
   await entryPreviousCommand(d.format(value,item));await outputQueue;await Promise.resolve();await outputQueue;
   if(d.key==='seaport-message'&&JSON.stringify(getBoardPosts())!==board)delete player.flags.r11BoardPosting;
   const after=this.manual?null:this.describe();
   if(!after||after.key!==d.key||d.key.startsWith('seaport:')&&player.bolts!==wallet){this.dismissed=after?.key||null;this.close();}
   else{const rows=[...screen.children].filter(n=>!oldNodes.has(n)&&!n.classList.contains('ui-choice-output')&&!n.textContent.startsWith('>'));this.feedback.textContent=rows.slice(-3).map(n=>n.textContent).join(' ')||'Check the value and try again.';}
  }catch(error){if(this.feedback)this.feedback.textContent=error.message||'The entry could not be processed.';}
  finally{this.working=false;if(this.dialog){this.submitButton.disabled=false;this.closeButton.disabled=false;this.field.focus();}this.schedule();}
 },
 key(event){
  if(!this.enabled())return;
  if(this.dialog){if(event.key==='Escape'){event.preventDefault();this.cancel();}event.stopImmediatePropagation();return;}
  if(TravelerPanels.dialog||Route127MapOverlay.dialog?.open||r5Credits||busy||commandProcessing||event.ctrlKey||event.altKey||event.metaKey)return;
  if(['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName)||event.target?.isContentEditable)return;
  if(event.key==='Tab'||event.key===' ')return;
  if(event.repeat)return;
  if(/^\d$/.test(event.key)){event.preventDefault();this.keyboard=(this.keyboard+event.key).slice(-2);return;}
  if(event.key==='Backspace'){event.preventDefault();this.keyboard=this.keyboard.slice(0,-1);return;}
  if(event.key==='Escape'){this.keyboard='';return;}
  if(event.key==='Enter'&&this.keyboard){event.preventDefault();const raw=this.keyboard;this.keyboard='';return this.dispatch(raw);}
  if(event.key==='Enter'&&event.target?.tagName==='BUTTON')return;
  const key=event.key.toLowerCase();
  if(player.flags.interfaceUnlocked&&['i','s','m','q','v'].includes(key)||currentHotkeys[key]){event.preventDefault();this.keyboard='';this.dispatch(key);}
 }
};
// Room-chest quantities belong to the inn, before generic bank-word routing.
const entryPreviousCore=handleCommandCore;
handleCommandCore=async function(raw){
 const cmd=r5Mapped(raw);
 if(!busy&&stage==='mercy'&&mercyLocation==='jenRoomChest'&&/^(?:deposit |withdraw )/.test(cmd))return handleInnRoom(cmd);
 return entryPreviousCore(raw);
};
const entryPreviousCommand=handleCommand;
handleCommand=async function(raw){
 if(FocusedEntry.dialog&&!FocusedEntry.working)return;
 try{return await entryPreviousCommand(raw);}finally{FocusedEntry.keyboard='';FocusedEntry.schedule();}
};
const entryGraphicsSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){const result=entryGraphicsSync.apply(this,args);FocusedEntry.schedule();return result;};
const entryWaiting=setInputWaiting;
setInputWaiting=function(waiting){entryWaiting(waiting);if(!waiting)FocusedEntry.schedule();};
addEventListener('keydown',event=>FocusedEntry.key(event),true);
addEventListener('DOMContentLoaded',()=>FocusedEntry.schedule());
