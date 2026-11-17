/* DEVTEST ONLY — inspect any active courier parcel in Backpack > Quest Items
 * and tamper outside the post office. Reuses both offices' exact-once crime,
 * sealed-item removal, suspension and loot logic; never changes map position.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST')return;
 const sources=()=>[
  globalThis.Route127PostOfficeRoutes,
  globalThis.Route127HarborDispatch
 ].filter(api=>api&&typeof api.activeMail==='function'&&typeof api.tamperCarriedMail==='function');
 const current=()=>sources().map(api=>({api,mail:api.activeMail()})).find(x=>x.mail);
 const matching=item=>{
  if(!item||item.type!=='quest'||!item.qty)return null;
  return sources().map(api=>({api,mail:api.activeMail()})).find(x=>x.mail?.item===item.name)||null;
 };
 // Only augment the existing graphical Quest Items detail screen.
 if(typeof TravelerPanels!=='undefined'){
  const orig=TravelerPanels.inventory;
  TravelerPanels.inventory=function(...args){
   const result=orig.apply(this,args);
   if(this.which!=='inventory'||!this.selected)return result;
   const selected=this.selected,found=matching(selected);
   if(!found)return result;
   const actions=this.body.querySelector('.traveler-detail .traveler-actions');
   if(!actions)return result;
   // Existing quest items still use no normal backpack slots.
   const armed=this._r127MailConfirm===selected.name;
   if(!armed){
    actions.appendChild(this.button('Tamper With Mail',()=>{
     if(this.working)return;
     this._r127MailConfirm=selected.name;
     this.footer.textContent='Opening this sealed delivery destroys the assignment, reports a Mail Tampering bounty (100 Bolts), and suspends new postal jobs for three game days. Possible contents are not guaranteed.';
     this.render();
    },'danger'));
   }else{
    actions.appendChild(this.button('Confirm Mail Tampering',async()=>{
     if(this.working)return;
     this._r127MailConfirm=null;
     const active=matching(selected);
     if(!active){this.footer.textContent='That sealed delivery is no longer active.';this.selected=null;this.render();return;}
     this.working=true;this.closeButton.disabled=true;
     try{
      await this.settle();
      const was=screen.children.length;
      const success=active.api.tamperCarriedMail();
      await this.settle();
      if(success){
       const lines=[...screen.children].slice(was).map(n=>n.textContent.trim()).filter(Boolean);
       this.footer.textContent=lines.slice(-3).join(' ')||
        'MAIL TAMPERED — Sealed delivery consumed, postal job cancelled, bounty recorded and deliveries suspended.';
       this.selected=null;
       if(typeof updateHud==='function')updateHud();
      }else this.footer.textContent='Could not open that mail. No parcel was consumed.';
     }catch(err){
      this.footer.textContent='Mail opening failed. Check your existing assignment before retrying.';
      console.error('Route 127 mail-tampering action',err);
     }finally{
      this.working=false;this.closeButton.disabled=false;this.render();
     }
    },'danger'));
    actions.appendChild(this.button('Cancel',()=>{
     if(this.working)return;
     this._r127MailConfirm=null;
     this.footer.textContent='The sealed mail remains intact.';
     this.render();
    }));
   }
   return result;
  };
  const prevSelect=TravelerPanels.select;
  TravelerPanels.select=async function(item,...args){
   this._r127MailConfirm=null;
   return prevSelect.call(this,item,...args);
  };
  const prevClose=TravelerPanels.close;
  TravelerPanels.close=function(...args){this._r127MailConfirm=null;return prevClose.apply(this,args);};
 }
 // Classic BBS: allow mail tampering from the Inventory screen, including
 // a separate explicit confirmation, without opening either office's menu.
 if(typeof handleCommandCore==='function'){
  const prior=handleCommandCore;
  let classicPending=null;
  handleCommandCore=async function(raw){
   const cmd=String(raw||'').trim().toLowerCase();
   if(stage!=='inventory')classicPending=null;
   if(stage==='inventory'&&GraphicalUI.preference()==='classic'){
    if(cmd==='tamper mail'){
     const entry=current();
     if(!entry){add('No active sealed courier delivery to open.','system');return;}
     classicPending=entry.mail.item;
     add('OPEN SEALED MAIL? This cancels the delivery, adds a Mail Tampering bounty and suspends postal work for three game days.','danger');
     add('Type CONFIRM MAIL TAMPERING or CANCEL MAIL TAMPERING.','system');return;
    }
    if(cmd==='cancel mail tampering'&&classicPending){
     classicPending=null;add('The seal remains intact.','system');return;
    }
    if(cmd==='confirm mail tampering'&&classicPending){
     const item=classicPending;classicPending=null;
     const entry=current();
     if(!entry||entry.mail.item!==item){add('Mail assignment changed. Nothing opened.','system');return;}
     const success=entry.api.tamperCarriedMail();
     add(success?'MAIL TAMPERING RESOLVED.':'Mail could not be opened; check your parcel.','system');
     if(typeof v49Autosave==='function')v49Autosave();
     showInventory();return;
    }
   }
   return prior.apply(this,arguments);
  };
  const priorInventory=showInventory;
  showInventory=function(...args){
   const result=priorInventory.apply(this,args);
   if(GraphicalUI.preference()==='classic'&&current())add('TAMPER MAIL — Open your current sealed postal delivery (crime).','system');
   return result;
  };
 }
})();
