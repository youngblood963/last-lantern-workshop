const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 try{
  for(const mode of ['graphics','classic']){
   const context=await browser.newContext({viewport:mode==='graphics'?{width:390,height:844}:{width:1365,height:900}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:8765/route127/devtest/');
   await page.waitForFunction(()=>Boolean(globalThis.Route127ScenarioResults));
   await page.evaluate(async mode=>{
    await outputQueue;
    GraphicalUI.setMode(mode);
    player.handle='WO52 browser fixture'; player.level=9; player.turns=19;
    player.flags.interfaceUnlocked=true;player.flags.portRoadCleared=true;player.pack=[];
    const g=lanternMigrate();
    const region=['seaport','coast','east','early'].find(r=>r10Pool(r).some(e=>e.title==='ROACH NEST'));
    Object.assign(g,{nodeId:'boulder-junction',currentEdgeId:'boulder-junction--seaport',
     stepIndex:4,direction:1,pending:true,sceneId:'wo52-fixture:4',encounterRegion:region,
     encounterIndex:r10Pool(region).findIndex(e=>e.title==='ROACH NEST')});
    lanternProject();
    resumeSavedEncounter=true;
    showEncounter();
    await outputQueue;
   },mode);
   if(mode==='graphics'){
    await page.getByRole('button',{name:'Options',exact:true}).click();
    await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();
    await page.getByRole('button',{name:/SEARCH VAN/i}).click();
   }else{
    const command=page.locator('#command');
    await command.fill('search van');
    await command.press('Enter');
   }
   const dialog=page.getByRole('dialog',{name:'ROACH NEST'});
   await dialog.waitFor({state:'visible',timeout:45000});
   assert.match(await dialog.innerText(),/Scrap Metal \+1/);
   const proceed=dialog.getByRole('button',{name:'Continue',exact:true});
   assert.equal(await dialog.getByRole('button').count(),1);
   await proceed.click();
   await dialog.waitFor({state:'hidden'});
   const status=await page.evaluate(()=>[stage,lanternState().stepIndex,player.turns,player.pack.find(i=>i.name==='Scrap Metal')?.qty]);
   assert.deepEqual(status,['lanternRoad',4,19,1]);
   assert.deepEqual(errors,[]);
   console.log('PASS',mode,'visible results, acknowledgment and exact-once salvage');
   await context.close();
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
