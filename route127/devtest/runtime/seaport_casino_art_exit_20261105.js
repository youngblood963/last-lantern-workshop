/* WO48 — DEVTEST only: Rusty Anchor casino hall art and one working exit.
 * The Seaport-specific casino runs at stage 'r6Casino', not 'mercy':
 * WO47's artwork selector missed its actual menu state.
 * Never alter the games, wagers, rounds, odds or save ledger.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST' ||
    typeof GraphicalUI==='undefined' || typeof casinoMenu!=='function')return;

 const atAnchor=()=>stage==='r6Casino'&&!!player.flags?.port55Casino;
 const menuOnly=()=>atAnchor()&&!player.flags?.r6Game;

 // Run after existing Solace casino and Seaport art adapters. The dedicated
 // Seaport casino uses r6Casino, so checking the legacy mercy stage is insufficient.
 const previousModel=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=previousModel.apply(this,args);
  if(atAnchor() && (menuOnly() ||
      !/^casino-(?:blackjack|dice|slots|rps|rats)$/.test(String(model.layout)))){
   model.art='../devtest/assets/locations/seaport_gambling_hall.png?v=wo48-casino';
   model.title='The Rusty Anchor — Gambling Hall';
  }
  return model;
 };

 // The R6 menu already has 'RETURN TO MIA'. Its shared r5DirectChoices
 // producer also leaves the old B->back hotkey in currentHotkeys, which
 // surfaces as an extra non-working button. Remove only that redundant map
 // entry after the menu's deferred numeric bindings have been registered.
 const previousMenu=casinoMenu;
 casinoMenu=function(...args){
  const result=previousMenu.apply(this,args);
  if(menuOnly()){
   outputQueue=outputQueue.then(()=>{
    if(menuOnly() && currentHotkeys?.b==='back')delete currentHotkeys.b;
   });
  }
  return result;
 };

 // Also guard graphical rendering during async output-queue updates, before
 // the deferred B removal has completed. Other casinos and game tables retain
 // their own Back controls.
 const previousChoices=GraphicalUI.choices;
 GraphicalUI.choices=function(...args){
  const choices=previousChoices.apply(this,args);
  if(!menuOnly())return choices;
  return choices.filter(row=>!(String(row.key).toLowerCase()==='b'&&
      String(row.command).toLowerCase()==='back'));
 };
 if(typeof GraphicalUI.schedule==='function')GraphicalUI.schedule();
})();
