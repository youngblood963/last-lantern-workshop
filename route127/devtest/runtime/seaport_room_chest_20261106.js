/* DEVTEST — Rusty Anchor room chest: item-selectable Backpack-style storage.
 * Preserve existing chest array, stacks, capacity, inventory and persistence.
 * Classic BBS continues to use the original handleInnRoom commands.
 */
(()=>{
'use strict';
if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof r6RoomCommand!=='function'||
   typeof GraphicalUI==='undefined')return;
const inRoom=()=>stage==='r6Room'&&player.flags?.r6AnchorRoomOwned&&
    typeof portRecruitUnlocked==='function'&&portRecruitUnlocked();
const graphics=()=>GraphicalUI.preference()==='graphics';
const seaport={
 valid:inRoom,get:()=>player.flags.r6AnchorRoomChest||(player.flags.r6AnchorRoomChest=[]),
 capacity:10,title:'ROOM CHEST',label:'Rusty Anchor room chest',
 onOpen:()=>{player.flags.r6RoomChestOpen=false;},
 onClose:()=>{player.flags.r6RoomChestOpen=false;}
};
let container=seaport;
const chest=()=>container.get();
const capacity=()=>container.capacity;
const validQty=x=>Number.isSafeInteger(x)&&x>0;
const el=(tag,cls,txt)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;return node;};
const style=document.createElement('style');style.dataset.r127SeaportChest='v1';
style.textContent=`
.r127-chest-dialog{box-sizing:border-box;width:min(1080px,96vw);height:min(730px,90dvh);max-width:96vw;
 max-height:90dvh;overflow:hidden;margin:auto;border:2px solid #8b6547;border-radius:7px;padding:16px;
 color:#eddec5;background:#11110f url('/route127/playtest/assets/ui/industrial-backing.png') center/100% 100% no-repeat;
 box-shadow:0 15px 75px #000d;font:14px Georgia,serif}
.r127-chest-dialog[open]{display:flex;flex-direction:column;gap:10px}
.r127-chest-dialog::backdrop{background:#000c}
.r127-chest-dialog button{cursor:pointer;border:1px solid #8b6948;border-radius:3px;background:#241c14;color:#f6dec0;
 padding:9px;font:inherit;text-align:left}
.r127-chest-dialog button:hover,.r127-chest-dialog button:focus-visible{border-color:#e6b97c;outline:1px solid #e6b97c}
.r127-chest-dialog button:disabled{cursor:not-allowed;opacity:.48}
.r127-chest-head{display:flex;gap:16px;justify-content:space-between;align-items:center;
 border-bottom:1px solid #8b6547;padding-bottom:10px}
.r127-chest-head h2{font:700 clamp(23px,3vw,38px) Impact,'Arial Narrow',sans-serif;letter-spacing:2px;margin:0}
.r127-chest-close{font-weight:bold;font-size:18px!important;min-width:45px;text-align:center!important}
.r127-chest-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;flex:1;min-height:0}
.r127-chest-pane{min-width:0;min-height:0;display:flex;flex-direction:column;gap:7px;padding:10px;
 background:#080b09d9;border:1px solid #6c4b32}
.r127-chest-pane h3{color:#e7be87;margin:0;font:700 18px Georgia,serif}
.r127-chest-list{overflow:auto;flex:1;min-height:0;display:flex;flex-direction:column;gap:5px}
.r127-chest-row{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px}
.r127-chest-row[aria-pressed="true"]{border-color:#e8b673;background:#49301d}
.r127-chest-row em{font-size:11px;font-style:normal;color:#a4c3a5}
.r127-chest-empty{opacity:.75;padding:12px;margin:0}
.r127-chest-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;
 border-top:1px solid #60442e;padding-top:8px}
.r127-chest-controls input{min-width:65px;width:95px;background:#111;border:1px solid #94714f;
 color:#f7e8d7;padding:8px;font:inherit}
.r127-chest-controls button{background:#53331e}
.r127-chest-feedback{min-height:20px;margin:0;color:#d9b889;font-size:13px}
@media(max-width:680px){
 .r127-chest-dialog{padding:9px;height:94dvh;max-height:94dvh}
 .r127-chest-body{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) minmax(0,1fr);gap:6px}
 .r127-chest-pane{padding:6px}
 .r127-chest-pane h3{font-size:15px}
}
`;
document.head.appendChild(style);
let dialog=null,selection=null,side='pack',quantity=1,note='',focusBefore=null;
const key=i=>i.name+'\u0000'+i.type+'\u0000'+(i.stolen?'stolen':'clean');
const available=()=>side==='pack'?player.pack:chest();
function close(){
 if(!dialog)return;
 dialog.close();dialog.remove();dialog=null;
 container.onClose?.();container=seaport;
 selection=null;note='';side='pack';
 if(focusBefore?.isConnected)focusBefore.focus();focusBefore=null;
}
function current(){
 if(!selection)return null;
 return available().find(i=>i===selection)||null;
}
function message(text){note=text;render();}
function transfer(){
 if(!container.valid()){close();return;}
 const item=current(),qty=Number(quantity);
 if(!item){message('Select an item from either list first.');return;}
 if(!validQty(qty)||!validQty(item.qty)||qty>item.qty){message('Choose a valid quantity up to the available stack.');return;}
 const depositing=side==='pack',src=depositing?player.pack:chest(),dst=depositing?chest():player.pack;
 if(depositing&&['quest','key'].includes(item.type)){message('Quest and key items cannot be stored.');return;}
 if(depositing&&(item.name===player.weapon||item.name===player.armor||item.name===player.accessory)){message('Unequip that item before storing it.');return;}
 const same=dst.find(i=>i.name===item.name&&i.type===item.type&&!!i.stolen===!!item.stolen);
 if(!same&&depositing&&dst.length>=capacity()){message('Storage full: '+capacity()+' stacks maximum.');return;}
 if(!same&&!depositing&&packSlotsUsed()>=player.packMax){message('Backpack has no free slots.');return;}
 if(same&&(!validQty(same.qty)||!Number.isSafeInteger(same.qty+qty))){message('Invalid stack quantity.');return;}
 // Transaction: validate both sides before mutating either list.
 if(same)same.qty+=qty;else dst.push({...item,qty});
 item.qty-=qty;if(item.qty===0)src.splice(src.indexOf(item),1);
 const name=item.name;selection=null;quantity=1;
 note=(depositing?'Stored ':'Retrieved ')+name+' ×'+qty+'.';
 v49Autosave();
 if(activeSaveSlot)saveGame(activeSaveSlot);
 updateHud();
 render();
}
function row(item,from){
 const btn=el('button','r127-chest-row');btn.type='button';
 const labels=el('span');labels.append(el('strong','',item.name),el('br'));
 labels.append(el('em','',String(item.type||'ITEM').toUpperCase()+(item.stolen?' · STOLEN':'')));
 btn.append(labels,el('span','', '×'+item.qty));
 btn.setAttribute('aria-pressed',String(side===from&&selection===item));
 btn.addEventListener('click',()=>{side=from;selection=item;quantity=item.qty;note='';render();});
 return btn;
}
function pane(title,items,from){
 const p=el('section','r127-chest-pane');p.append(el('h3','',title));
 const list=el('div','r127-chest-list');list.setAttribute('aria-label',title);
 if(!items.length)list.append(el('p','r127-chest-empty','Nothing here yet.'));
 else for(const item of items)list.append(row(item,from));
 p.append(list);return p;
}
function render(){
 if(!dialog)return;
 const head=dialog.querySelector('.r127-chest-head');
 const caption=head.querySelector('.r127-chest-caption');
 caption.textContent='Backpack '+packSlotsUsed()+'/'+player.packMax+' slots · Storage '+chest().length+'/'+capacity()+' stacks';
 const body=dialog.querySelector('.r127-chest-body');
 body.replaceChildren(pane('BACKPACK',player.pack,'pack'),pane(container.title,chest(),'chest'));
 const bar=dialog.querySelector('.r127-chest-controls');bar.replaceChildren();
 const picked=current();
 if(picked){
  bar.append(el('span','',picked.name+' ×'+picked.qty));
  const label=el('label','', 'Quantity ');
  const input=el('input');input.type='number';input.min='1';input.max=String(picked.qty);input.step='1';
  input.value=String(Math.min(quantity,picked.qty));input.setAttribute('aria-label','Quantity to transfer');
  input.addEventListener('input',()=>{quantity=Number(input.value);});
  label.append(input);bar.append(label);
  const action=el('button','');action.type='button';
  const updateAction=()=>{const n=Number(input.value);action.textContent=(side==='pack'?'DEPOSIT ':'WITHDRAW ')+(validQty(n)?n:'?');};
  updateAction();
  input.addEventListener('input',updateAction);
  action.addEventListener('click',transfer);bar.append(action);
  const all=el('button','','ALL');all.type='button';
  all.addEventListener('click',()=>{quantity=picked.qty;input.value=String(quantity);updateAction();});bar.append(all);
 }else bar.append(el('span','','Select an item to deposit or withdraw.'));
 dialog.querySelector('.r127-chest-feedback').textContent=note;
}
function openFor(config=seaport){
 if(!config.valid()||!graphics()||dialog||document.querySelector('dialog[open]'))return false;
 container=config;
 focusBefore=document.activeElement;
 config.onOpen?.(); // legacy submenu is not used in graphical mode
 selection=null;side='pack';quantity=1;note='';
 const d=el('dialog','r127-chest-dialog');d.setAttribute('aria-label',container.label);
 const head=el('header','r127-chest-head');
 const titles=el('div');titles.append(el('h2','',container.title),el('div','r127-chest-caption'));
 const exit=el('button','r127-chest-close','X');exit.type='button';
 exit.setAttribute('aria-label','Close chest');exit.addEventListener('click',close);
 head.append(titles,exit);
 d.append(head,el('main','r127-chest-body'),el('div','r127-chest-controls'),el('p','r127-chest-feedback'));
 d.addEventListener('cancel',e=>{e.preventDefault();close();});
 document.body.append(d);dialog=d;render();d.showModal();exit.focus();
 return true;
}
const previous=r6RoomCommand;
r6RoomCommand=function(cmd){
 if(inRoom()&&graphics()&&String(cmd).trim().toLowerCase()==='chest'){
  if(openFor(seaport))return true;
  return true; // never fall into the legacy, random-item chest navigation
 }
 return previous.apply(this,arguments);
};
globalThis.SeaportRoomChest=Object.freeze({open:()=>openFor(seaport),openFor,close});
})();
