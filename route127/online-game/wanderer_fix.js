// v54.1e — targeted wandering encounter menu stabilization.
// Keep the established combat, theft, stock, turn, and save implementations.
(function(){
 const previousAddImmediate=addImmediate;
 addImmediate=function(text='',cls=''){
  const s=String(text).toUpperCase();
  const encounter=(stage==='wandererRoad'||stage==='mercy'&&townWandererFocus);
  // Legacy direct-output paths bypassed v53's add() filter, producing a
  // second actionable menu alongside the authoritative v53Choices menu.
  if(encounter&&!v53OfficialMenu&&cls==='system'&&(
    v53LegacyMenu(s)||
    /^(?:STEAL(?: FROM)?|TRADE(?: |$))/.test(s)&&/(?:MOVE ON|TOWN|INSPECT)/.test(s)
  ))return;
  return previousAddImmediate(text,cls);
 };
 const previousTrade=v50Trade;
 v50Trade=function(w){
  if(!w||!wandererAlive(w))return previousTrade(w);
  // Preserve shared stock and transactions, but use one canonical numbered menu.
  const p=v50Profile(w);
  if(p.hostile)return previousTrade(w);
  player.flags.v50Trade=w.name;
  add(`${w.name.toUpperCase()} — ${p.occupation.toUpperCase()} — BROWSE WARES`,'place');
  p.stock.forEach(i=>add(`${i.name} — ${i.price} BOLTS — ${i.qty} remaining`));
  v53Choices([...p.stock.filter(i=>i.qty>0).map(i=>'BUY '+i.name.toUpperCase()),'SELL ITEMS','LEAVE BROWSE WARES']);
 };
 const previousCore=handleCommandCore;
 handleCommandCore=async function(raw){
  const entered=String(raw).trim().toLowerCase();
  const mapped=/^\d+$/.test(entered)?numberedChoices[entered]:null;
  const cmd=(mapped||entered).toLowerCase();
  if(player.flags.v50Trade&&['leave browse wares','leave trade','back','b'].includes(cmd)){
   delete player.flags.v50Trade;delete player.flags.v50Sale;delete player.flags.v48Shop;
   if(stage==='wandererRoad'&&currentRoadWanderer)v53WandererMenu(wandererByName(currentRoadWanderer),true);
   else if(stage==='mercy'&&currentTownWanderer){townWandererFocus=currentTownWanderer;v53WandererMenu(wandererByName(currentTownWanderer),false);}
   else renderCurrentChoices();
   return;
  }
  return previousCore(raw);
 };
 // Render the browse menu again after stock-changing interactions through v50Trade.
 // No new persistence fields are introduced.
})();
