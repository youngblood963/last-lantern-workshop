// Run against isolated DEVTEST staging by default. Set R127_SURVIVOR_URL to test a hosted DEVTEST.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');

async function main(){
 const url=new URL(process.env.R127_SURVIVOR_URL||'https://localhost:8787/route127/devtest/');
 const hosted=url.origin==='https://lastlanternworkshop.com';
 assert.equal(url.pathname,'/route127/devtest/');
 assert(hosted||url.origin==='https://localhost:8787');
 const prefix=hosted?'/route127/devtest/api/':'/api/';
 const world='/route127/devtest/api/presence/';
 const browser=await chromium.launch({executablePath:process.env.R11_CHROMIUM,headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 const ignoreHTTPSErrors=!hosted||process.env.R127_SURVIVOR_IGNORE_TLS==='1';
 const session='mpqa_'+randomUUID().slice(0,8);
 const errors=[];
 async function playerClient(index){
  const context=await browser.newContext({ignoreHTTPSErrors,bypassCSP:!hosted});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url.href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof saveSnapshot==='function'&&!!document.getElementById('cloud-auth'));
  const setup=await page.evaluate(async({prefix,login,password})=>{
   const register=await fetch(prefix+'register',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({login,password})});
   if(!register.ok)throw Error('Register QA account '+register.status);
   // Seed only this newly registered character at main street to skip the single-player intro.
   resetPlayer();
   player.handle='Main Street QA';
   const wanderer=wanderers.find(w=>!w.dead);
   if(wanderer)wandererLocations[wanderer.name]='mercy';
   player.flags.mercyDiscovered=true;
   stage='mercy';
   mercyLocation='town';
   Object.assign(lanternMigrate(),{nodeId:'solace',currentEdgeId:null,solaceAdmitted:true});
   mercyMenu();
   const snapshot=saveSnapshot();
   const create=await fetch(prefix+'character',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({snapshot})});
   if(!create.ok)throw Error('Create QA character '+create.status);
   return create.json();
  },{prefix,login:session+'_'+index,password:randomUUID()});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(id=>player.characterId===id,setup.character.id);
  await page.waitForFunction(()=>/Cloud character loaded/.test(document.getElementById("cloud-status").textContent));
  await page.evaluate(()=>GraphicalUI.setMode('graphics'));
  const before=await page.evaluate(async prefix=>(await fetch(prefix+'save')).json(),prefix);
  const request=async(path,data)=>page.evaluate(async({path,data})=>{
   const response=await fetch(path,data?{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data)}:undefined);
   return {status:response.status,body:await response.json()};
  },{path:world+path,data});
  const command=cmd=>page.evaluate(async cmd=>{await handleCommand(cmd);await outputQueue;},cmd);
  return {context,page,id:setup.character.id,before,request,command,save:()=>page.evaluate(async prefix=>
   (await fetch(prefix+'save')).json(),prefix)};
 }
 try{
  const [a,b]=await Promise.all([playerClient(1),playerClient(2)]);
  console.log('QA sessions use separate accounts and permanent IDs',session);
  assert.notEqual(a.id,b.id);
  for(const [c,other] of [[a,b],[b,a]]){
   const target=c.page.locator('[data-cloud-survivor-id="'+other.id+'"]');
   await target.waitFor({timeout:45000});
   assert.equal(await c.page.locator('[data-cloud-survivor-id="'+c.id+'"]').count(),0);
   assert.equal(await target.innerText(),'Talk to Main Street QA');
   assert.equal((await c.request('survivors/'+c.id)).status,404);
   await target.locator('img').evaluate(img=>img.decode());
   await target.click();
   const profile=c.page.getByRole('dialog',{name:'Cloud survivor profile'});
   await profile.getByText('Client-reported cloud save',{exact:true}).waitFor();
   assert.deepEqual(await profile.locator('dt').allTextContents(),['Level','HP','Attack','Defense','Equipment','Location']);
   assert.equal(await profile.locator('dd').last().textContent(),'Solace Main Street');
   await profile.getByRole('button',{name:'Close',exact:true}).click();
   await c.page.getByRole('button',{name:'Shared Expedition',exact:true}).waitFor();
   const after=await c.save();
   assert.equal(after.revision,c.before.revision);
   assert.deepEqual(after.snapshot,c.before.snapshot);
  }
  const visitor=await a.page.evaluate(()=>Object.values(numberedChoices).find(cmd=>/^talk to /i.test(cmd)));
  assert.ok(visitor,'NPC wanderer remains in the existing menu');
  await a.command(visitor);
  assert.ok(await a.page.evaluate(()=>townWandererFocus),'NPC talk still uses the usual handler');
  await a.command('leave');
  await a.page.waitForFunction(()=>!townWandererFocus);
  await b.command('gates');
  await b.command('west gate');
  await b.page.waitForFunction(()=>stage==='lanternGate');
  await b.page.waitForFunction(async prefix=>(await (await fetch(prefix+'save',{cache:'no-store'})).json())
   .snapshot.stage==='lanternGate',prefix,{polling:500});
  assert.equal((await a.request('survivors/'+b.id)).status,404);
  await b.command('return to town');
  await b.page.waitForFunction(()=>stage==='mercy'&&mercyLocation==='town');
  await a.page.locator('[data-cloud-survivor-id="'+b.id+'"]').waitFor({timeout:45000});
  await b.page.locator('[data-cloud-survivor-id="'+a.id+'"]').waitFor({timeout:45000});

  await b.command('gates');
  await b.command('west gate');
  const road=await b.page.evaluate(()=>Object.values(numberedChoices).find(cmd=>/^take road to /i.test(cmd)));
  assert.ok(road);
  await b.command(road);
  await b.page.waitForFunction(()=>!!lanternState().currentEdgeId);
  await b.page.waitForFunction(async prefix=>!!(await (await fetch(prefix+'save',{cache:'no-store'})).json())
   .snapshot.player.flags.lanternTravel.currentEdgeId,prefix,{polling:500});
  assert.equal((await a.request('survivors/'+b.id)).status,404);
  console.log('PASS mutual Main Street Inspect, duplicate names, self exclusion, unchanged saves, NPC talk, gate return and normal road departure');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
