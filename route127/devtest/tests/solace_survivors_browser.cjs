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
 const world='/route127/devtest/api/world/';
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
   player.handle='Solace QA';
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
  await page.evaluate(()=>GraphicalUI.setMode('graphical'));
  const before=await page.evaluate(async prefix=>(await fetch(prefix+'save')).json(),prefix);
  const request=async(path,data)=>page.evaluate(async({path,data})=>{
   const response=await fetch(path,data?{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data)}:undefined);
   return {status:response.status,body:await response.json()};
  },{path:world+path,data});
  const click=name=>page.getByRole('button',{name,exact:true}).click();
  return {context,page,id:setup.character.id,before,request,click,save:()=>page.evaluate(async prefix=>
   (await fetch(prefix+'save')).json(),prefix)};
 }
 try{
  const [a,b]=await Promise.all([playerClient(1),playerClient(2)]);
  console.log('QA sessions use separate accounts and permanent IDs',session);
  assert.notEqual(a.id,b.id);
  for(const c of [a,b]){
   assert.equal((await c.request('survivors')).status,409);
   await c.click('Shared Expedition');
   await c.click('Join expedition');
   assert.equal((await c.request('survivors')).status,403);
   await c.click('Depart for Western Road');
   await c.click('Enter Solace');
   await c.page.getByRole('button',{name:'Leave Solace',exact:true}).waitFor();
   assert.equal((await c.request('survivors/'+c.id)).status,404);
  }
  for(const [c,other] of [[a,b],[b,a]]){
   const card=c.page.locator('[data-character-id="'+other.id+'"]');
   assert.equal(await c.page.locator('[data-character-id="'+c.id+'"]').count(),0);
   await card.waitFor({timeout:25000});
   assert.equal(await card.getAttribute('aria-label'),'Inspect Solace QA');
   assert.match(await card.locator('img').getAttribute('src'),/player_survivor_default\.png$/);
   await card.locator('img').evaluate(img=>img.decode());
   await card.click();
   const details=c.page.getByRole('dialog',{name:'Solace shared expedition'});
   await details.getByText('Rusted Pipe, Worn Jacket',{exact:true}).waitFor();
   assert.deepEqual(await details.locator('dd').allTextContents(),['1','Solace','Rusted Pipe, Worn Jacket','100','3–6','1']);
   const after=await c.save();
   assert.equal(after.revision,c.before.revision);
   assert.deepEqual(after.snapshot,c.before.snapshot);
  }
  console.log('PASS mutual roster and Inspect, identical names, portrait, self exclusion, server-gated travel, unchanged saves');
  await b.click('Leave Solace');
  await b.page.getByRole('button',{name:'Enter Solace',exact:true}).waitFor();
  assert.equal((await a.request('survivors/'+b.id)).status,404);
  await b.click('Enter Solace');
  await b.page.getByRole('button',{name:'Leave Solace',exact:true}).waitFor();
  await b.context.close();
  if(process.env.R127_SURVIVOR_SKIP_EXPIRY!=='1'){
   await a.page.waitForFunction(id=>!document.querySelector('[data-character-id="'+id+'"]'),b.id,{timeout:150000});
   assert.equal((await a.request('survivors/'+b.id)).status,404);
   console.log('PASS disconnected survivor expires');
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
