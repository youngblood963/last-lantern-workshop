/* Devtest hotfix: local companion panel, never enter the legacy Seaport pets stage.
 * Does not touch quests, map position, inventory contents, casino ledgers or saves.
 */
(() => {
  'use strict';
  if(globalThis.ROUTE127_ENV?.name !== 'DEVTEST' ||
      !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname) ||
      typeof TravelerPanels === 'undefined') return;
  const panel=TravelerPanels;
  const legacyHandoff=panel.handoff;
  const legacyRender=panel.render;
  const petName=id=>id==='Rescued Hound'&&player.flags.r18HoundName
    ?player.flags.r18HoundName+' (Rescued Hound)':id;
  const pets=()=>Array.isArray(player.flags.ownedPets)?[...new Set(player.flags.ownedPets)]:[];
  const info=id=>typeof PORT55_PETS!=='undefined'?PORT55_PETS[id]:null;
  panel.handoff=function(command){
    if(command!=='manage pets')return legacyHandoff.call(this,command);
    if(!this.dialog||!this.snapshot||this.working)return;
    // This changes only the visible tab of the existing Character overlay.
    this.which='companions';this.render();
  };
  panel.render=function(){
    if(this.which!=='companions')return legacyRender.call(this);
    if(!this.dialog)return;
    this.body.replaceChildren();
    this.capacity.textContent=(player.handle||'Traveler')+' · '+pets().length+' owned';
    this.footer.textContent='Companions are separate from backpack items. Viewing this page costs no turns.';
    const detail=this.node('section','traveler-detail');
    detail.appendChild(this.node('h2','','COMPANIONS'));
    detail.appendChild(this.node('p','traveler-note',
      'Choose a companion to equip or inspect. Your current location does not change.'));
    const owned=pets();
    if(!owned.length)detail.appendChild(this.node('p','traveler-note',
      'You do not currently have any registered companions.'));
    for(const id of owned){
      const row=this.node('div','traveler-pet-entry');
      const title=petName(id)+(player.flags.equippedPet===id?' — EQUIPPED':'');
      row.appendChild(this.node('h3','',title));
      const def=info(id);
      row.appendChild(this.node('p','traveler-note',
        (def?.rarity||'Companion')+' · '+(def?.ability||'No ability description recorded.')));
      const actions=this.node('div','traveler-actions');
      if(player.flags.equippedPet!==id){
        const button=this.button('Equip',()=>{
          if(combatState){this.footer.textContent='Cannot change companions during combat.';return;}
          if(!pets().includes(id))return;
          player.flags.equippedPet=id;
          if(typeof r5Capacity==='function')r5Capacity();
          updateHud();this.render();
        });
        actions.appendChild(button);
      }else{
        actions.appendChild(this.button('Unequip',()=>{
          if(combatState){this.footer.textContent='Cannot change companions during combat.';return;}
          player.flags.equippedPet=null;
          if(typeof r5Capacity==='function')r5Capacity();
          updateHud();this.render();
        }));
      }
      row.appendChild(actions);detail.appendChild(row);
    }
    const bar=this.node('div','traveler-actions');
    bar.appendChild(this.button('Back to Character',()=>{this.which='status';this.render();}));
    bar.appendChild(this.button('Close',()=>this.close()));
    detail.appendChild(bar);this.body.appendChild(detail);
    this.closeButton.disabled=false;
  };
  const css=document.createElement('style');
  css.textContent='.traveler-pet-entry{padding:8px 0;border-bottom:1px solid #65462c}' +
    '.traveler-pet-entry h3{margin:0 0 4px;color:#e8c58d;font:700 15px Georgia,serif}'+
    '.traveler-pet-entry .traveler-actions{margin:5px 0 0}';
  document.head.appendChild(css);
  // Recovery for old "port55Pets" snapshots. The physical world graph was
  // never moved by the pet screen; the invalid UI stage alone caused the
  // Seaport art and missing actions. Never rewrite the world graph.
  function recoverPetStage(){
    if(typeof stage==='undefined'||stage!=='port55Pets'||panel.dialog)return false;
    const overlays=new Set(['port55Pets','inventory','inventoryItem','interfaceStatus',
      'interfaceMap','interfaceSave','quests','confirmDrop','title','']);
    const original=typeof returnStage==='string'?returnStage:'';
    let restore=!overlays.has(original)?original:null;
    if(!restore){
      const graph=typeof lanternState==='function'?lanternState():null;
      if(graph?.currentEdgeId)restore='lanternRoad';
      else if(graph?.nodeId==='solace')restore='mercy';
      else if(graph?.nodeId==='house')restore='house';
      else if(graph?.nodeId==='factory')restore='eastEnd';
      else if(graph?.nodeId==='seaport')restore='seaport';
      else if(graph?.nodeId)restore='lanternNode';
    }
    if(!restore)restore='between';
    stage=restore;returnStage=restore;
    screen.replaceChildren();
    renderCurrentChoices();
    updateHud();
    GraphicalUI.sync();
    return true;
  }
  // This handles returning to an older saved pet screen; it does not invent a
  // nonexistent save or overwrite the player's existing autosave.
  const previousSync=GraphicalUI.sync;
  GraphicalUI.sync=function(...args){
    if(!this.rendering&&stage==='port55Pets'&&!panel.dialog)recoverPetStage();
    return previousSync.apply(this,args);
  };
  globalThis.Route127CompanionRepair=Object.freeze({recoverPetStage});
})();
