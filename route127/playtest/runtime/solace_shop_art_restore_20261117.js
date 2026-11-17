/* DEVTEST ONLY — restore Solace's existing shop/interior artwork.
 * The live DEVTEST graphics loader is ../devtest/graphics.js (not the shared
 * playtest/graphics.js). The DEVTEST context table lacks many Solace interiors,
 * and relative "assets/locations" lookups then target devtest/ where these
 * canonical image files do not exist. Keep the gameplay/menus/save untouched.
 */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST'||typeof GraphicalUI==='undefined')return;
 const shared=new URL('../playtest/assets/locations/',location.href);
 const shops={
  jen:{file:'rusty_lantern_bar.png',title:'The Rusty Lantern — Jen’s Bar'},
  jenTalk:{file:'rusty_lantern_bar.png',title:'The Rusty Lantern — Jen’s Bar'},
  jenDrinks:{file:'rusty_lantern_bar.png',title:'The Rusty Lantern — Jen’s Bar'},
  bar:{file:'rusty_lantern_bar.png',title:'The Rusty Lantern — Jen’s Bar'},
  johnny:{file:'solace_johnny_shop.png',title:"Johnny's Trading Post"},
  trader:{file:'solace_johnny_shop.png',title:"Johnny's Trading Post"},
  murphy:{file:'solace_murphy_garage.png',title:"Murphy's Motor Works"},
  workshop:{file:'solace_murphy_garage.png',title:"Murphy's Motor Works"},
  wayne:{file:'solace_wayne_clinic.png',title:'Last Chance Clinic'},
  clinic:{file:'solace_wayne_clinic.png',title:'Last Chance Clinic'},
  amii:{file:'solace_amii_bank.png',title:'Solace Savings & Loan'},
  bank:{file:'solace_amii_bank.png',title:'Solace Savings & Loan'},
  mara:{file:'solace_mara_armory.png',title:'Scrap & Steel Armory'},
  armory:{file:'solace_mara_armory.png',title:'Scrap & Steel Armory'},
  tim:{file:'solace_tim.png',title:'Tim — Solace Lawman'},
  relay:{file:'solace_relay_station.png',title:'Relay Station'}
 };
 const prior=GraphicalUI.model;
 GraphicalUI.model=function(...args){
  const model=prior.apply(this,args);
  if(!model?.active||stage!=='mercy'||player.flags?.port55Casino)return model;
  const locationKey=String(mercyLocation||'');
  const menuKey=String(player.flags?.solaceMenu||'');
  // When the legacy town submenu has not yet updated mercyLocation, use the
  // specifically selected interior menu. Never replace the actual town scene.
  const key=shops[locationKey]?locationKey:
    locationKey==='town'&&shops[menuKey]?menuKey:null;
  if(!key)return model;
  const row=shops[key];
  model.art=new URL(row.file,shared).href;
  model.title=row.title;
  model.regionalSky=null;
  return model;
 };
 GraphicalUI.schedule?.();
})();
