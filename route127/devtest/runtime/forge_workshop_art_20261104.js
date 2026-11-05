/* DEVTEST-only: location-state artwork for Forge, Boulder Junction and Seaport. No gameplay changes. */
(function(){
 if(typeof GraphicalUI==='undefined')return;
 const oldContext=GraphicalUI.context.bind(GraphicalUI);
 GraphicalUI.context=function(){
  const overlayStages=new Set(['inventory','inventoryItem','confirmDrop','quests','interfaceStatus','interfaceMap','interfaceSave','combatItems','r5Loot','r18HorseTravel','corvetteRescue']);
  const place=overlayStages.has(stage)?returnStage:stage;
  if(['factoryWorkshop','factoryTerminal','factoryForge','factoryBench'].includes(place))return 'factory-workshop';
  const g=typeof lanternState==='function'?lanternState():null;
  if(place==='lanternNode'&&g?.nodeId==='boulder-junction'&&!g.currentEdgeId)return 'boulder-junction-art';
  return oldContext();
 };
 const oldModel=GraphicalUI.model.bind(GraphicalUI);
 GraphicalUI.model=function(){
  const model=oldModel();
  if(model.location==='factory-workshop'){
   model.title="Forge's Workshop";
   model.art='../devtest/assets/locations/forge_workshop.png';
  }
  if(model.location==='boulder-junction-art'){
   const cleared=!!player?.flags?.portRoadCleared;
   model.title=cleared?'Boulder Junction — Road Cleared':'Boulder Junction — Road Blocked';
   model.art='../devtest/assets/locations/seaport_boulder_'+(cleared?'cleared':'blocked')+'.png';
  }
  // Seaport occupation ends only after the prisoners are freed, not merely when the fighters fall.
  const g=typeof lanternState==='function'?lanternState():null;
  const atSeaport=g?.nodeId==='seaport'&&!g.currentEdgeId;
  const currentStage=String(stage||'');
  const inSeaportMenu=currentStage==='seaport'||/^port55(?!Road)/.test(currentStage)||
   ['portMarket','portClinic','portDocks','portWatch'].includes(currentStage);
  if(model.location==='seaport'&&(atSeaport||inSeaportMenu)){
   const liberated=!!player.flags?.seaport55?.freed;
   // Only the Harbor Docks use the existing sunset waterfront after liberation.
   // A neutral scene remains elsewhere until dedicated liberated-town art is approved.
   const atDocks=currentStage==='port55Docks'||
    (currentStage==='port55Stop'&&player.flags?.port55CurrentStop==='Docks');
   if(!liberated){
    model.art='../devtest/assets/locations/seaport_occupied.png';
    model.title='Seaport — Occupied Harbor';
   }else if(atDocks){
    model.art='assets/locations/seaport.png';
    model.title='Seaport — Harbor Docks';
   }else{
    model.art='';
    model.title='Seaport';
   }
  }
  // Kaiden's approved dialogue portrait appears only during his post-liberation conversation.
  // Patrol routing and dialogue stay in the original game code.
  if(currentStage==='port55Kaiden'&&!!player.flags?.seaport55?.freed){
   model.art='../devtest/assets/locations/sheriff_kaiden.png';
   model.title='Sheriff Kaiden';
  }
  return model;
 };
 if(typeof GraphicalUI.schedule==='function')GraphicalUI.schedule();
})();