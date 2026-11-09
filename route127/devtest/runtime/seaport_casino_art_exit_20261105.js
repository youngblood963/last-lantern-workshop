/* WO48 — DEVTEST only: Rusty Anchor casino hall art and one working exit.
 * The Seaport-specific casino runs at stage 'r6Casino', not 'mercy':
 * WO47's artwork selector missed its actual menu state.
 * Never alter the games, wagers, rounds, odds or save ledger.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST' ||
    typeof GraphicalUI==='undefined')return;

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

 if(typeof GraphicalUI.schedule==='function')GraphicalUI.schedule();
})();
