// Explicit development-write acceptance. Uses three disposable game accounts.
// Gate credential and browser profile stay outside Git and are never logged.
const {chromium,request}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {randomUUID}=require('node:crypto');
const origin=process.env.R127_ACCEPTANCE_ORIGIN||'https://route127-r14-private-playtest.youngblood963.workers.dev';
assert(['https://route127-r14-private-playtest.youngblood963.workers.dev','https://localhost:8787'].includes(origin),'Development targets only');
const local=origin==='https://localhost:8787';
console.log(local?'LOCAL acceptance only; no hosted result implied':'LIVE hosted development acceptance');
const gate=JSON.parse(fs.readFileSync(process.env.R127_TESTER_CREDENTIAL_FILE,'utf8'));
const credentials={username:gate.username,password:gate.password};
const profile=process.env.R127_BROWSER_PROFILE;
assert(profile&&!profile.includes('/last-lantern-workshop/'),'Private browser profile must be outside repository');
const options={executablePath:process.env.R11_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(!local&&process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})};
const errors=[];
async function prepare(page){
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>d.accept());
 page.setDefaultTimeout(45000);
 await page.addInitScript(()=>{const old=setTimeout;window.setTimeout=(f,ms,...a)=>{if(ms<=600){queueMicrotask(()=>f(...a));return 0;}return old(f,ms,...a);};});
}
async function status(page,pattern){await page.waitForFunction(source=>new RegExp(source).test(document.getElementById('cloud-status')?.textContent||'')&&(source!=='Cloud backup saved'||!Object.keys(localStorage).some(k=>/^r127-dev-pending:[^:]+(:latest)?$/.test(k))),pattern,{timeout:45000}).catch(async()=>{throw Error('Waiting for '+pattern+'; status: '+await page.locator('#cloud-status').innerText());});}
async function command(page,s){await page.locator('#command').fill(s);await page.locator('#command').press('Enter');await page.waitForFunction(()=>!commandProcessing&&!busy);}
async function account(page,index){
 const login='r14_'+randomUUID().replaceAll('-','').slice(0,18),password=randomUUID()+randomUUID();
 await page.goto(origin);
 await page.locator('[name=login]').fill(login);await page.locator('[name=password]').fill(password);await page.locator('[value=register]').click();await page.locator('#cloud-link').waitFor({state:'visible'});
 await page.locator('#cloud-link').click();await page.waitForFunction(()=>stage==='wake'&&!busy);
 await command(page,'stand up');await command(page,'Ranger '+String.fromCharCode(65+index));await command(page,'yes');await status(page,'Cloud character loaded');
 return {login,password,id:await page.evaluate(()=>player.characterId)};
}
async function state(page){return page.evaluate(()=>({id:player.characterId,stage,bolts:player.bolts,xp:player.xp,level:player.level,pack:player.pack,flags:player.flags,turns:player.turns}));}
async function api(page,path,data){return page.evaluate(async({path,data})=>{const r=await fetch('/api/'+path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});return {status:r.status,body:await r.json()};},{path,data});}
(async()=>{
 let main,browser,others=[];
 try{
 const probe=await request.newContext({...options.proxy?{proxy:options.proxy}:{},ignoreHTTPSErrors:local,userAgent:'Route127-Development-Verification/1.0'});
 for(const path of ['/','/index.html','/app.js','/transmission.png','/?offline=1','/api/health','/api/me','/api/save']){
  const r=await probe.get(origin+path);assert.equal(r.status(),401);assert.match(r.headers()['www-authenticate'],/^Basic/);
 }
 await probe.dispose();console.log('PASS private gate: unauthenticated assets and all tested API paths denied');
 main=await chromium.launchPersistentContext(profile,{...options,httpCredentials:credentials,ignoreHTTPSErrors:local,viewport:{width:1365,height:900}});
 let page=await main.newPage();await prepare(page);
 const a=await account(page,0);assert.match(a.id,/^char-/);
 const cookie=(await main.cookies()).find(c=>c.name==='__Host-r127dev');assert(cookie.secure&&cookie.httpOnly&&cookie.sameSite==='Strict');
 console.log('PASS A: registration and real opening create permanent cloud character');
 await command(page,'search room');await command(page,'check cabinet');await command(page,'inspect computer');await command(page,'hello');await command(page,'listen');await command(page,'log coordinates');
 const turnStart=await page.evaluate(()=>player.turns);
 // Seed uneventful road segments so this smoke path is deterministic.
 await page.evaluate(()=>{window.r14OriginalRandom=Math.random;Math.random=()=>0.99;});
 await command(page,'road');await command(page,'continue');await command(page,'continue');
 await page.evaluate(()=>{Math.random=window.r14OriginalRandom;});
 assert(await page.evaluate(()=>player.turns)<=turnStart-3);await status(page,'Cloud backup saved');
 const before=await state(page);await page.reload();await status(page,'Cloud character loaded');const after=await state(page);assert.equal(after.id,a.id);assert.equal(after.bolts,before.bolts);
 console.log('PASS A: gameplay commands, automatic cloud save and session reload');
 // Deterministic serialization fixture supplements real commands; it is not earned campaign progress.
 await page.evaluate(()=>{player.pack.push({name:'R14 Test salvage',type:'material',qty:3});player.level=4;player.xp=250;player.flags.r14Probe='complete';v49Autosave();});await status(page,'Cloud backup saved');
 const saved=await state(page);
 await main.close();main=null;
 main=await chromium.launchPersistentContext(profile,{...options,httpCredentials:credentials,ignoreHTTPSErrors:local,viewport:{width:1365,height:900}});
 page=await main.newPage();await prepare(page);await page.goto(origin);await status(page,'Cloud character loaded');
 let recovered=await state(page);for(const key of ['id','stage','xp','level','pack'])assert.deepEqual(recovered[key],saved[key]);assert.equal(recovered.flags.r14Probe,'complete');
 await page.locator('#cloud-out').click();await page.locator('#cloud-auth').waitFor({state:'visible'});
 await page.locator('[name=login]').fill(a.login);await page.locator('[name=password]').fill(a.password);await page.locator('[value=login]').click();await status(page,'Cloud character loaded');assert.equal(await page.evaluate(()=>player.characterId),a.id);
 console.log('PASS B: full browser process close/reopen, persisted profile recovery and returning login; location/xp/inventory/progress preserved');
 browser=await chromium.launch(options);
 const players=[{page,account:a}];
 for(let i=1;i<3;i++){
  const ctx=await browser.newContext({httpCredentials:credentials,ignoreHTTPSErrors:local});others.push(ctx);const p=await ctx.newPage();await prepare(p);players.push({page:p,account:await account(p,i)});
 }
 assert.equal(new Set(players.map(x=>x.account.id)).size,3);
 for(let i=0;i<players.length;i++){
  const p=players[i].page;await p.evaluate(i=>{player.bolts=500+i;v49Autosave();},i);await status(p,'Cloud backup saved');
 }
 for(let i=0;i<players.length;i++){
  const p=players[i].page;const r=await api(p,'save');assert.equal(r.status,200);assert.equal(r.body.character.id,players[i].account.id);assert.equal(r.body.snapshot.player.bolts,500+i);
  const other=players[(i+1)%3].account.id;
  const read=await api(p,'save?characterId='+other);assert.equal(read.body.character.id,players[i].account.id);
  const bad=structuredClone(r.body.snapshot);bad.player.characterId=other;
  assert.equal((await api(p,'save',{revision:r.body.revision,requestId:randomUUID(),snapshot:bad})).status,403);
 }
 console.log('PASS C: three accounts, independent characters/saves, cross-player read and overwrite protection');
 await main.setOffline(true);await page.evaluate(()=>{player.bolts=777;v49Autosave();});await status(page,'Cloud unavailable');
 await page.evaluate(()=>{player.bolts=778;v49Autosave();});await page.close();await main.setOffline(false);
 page=await main.newPage();await prepare(page);await page.goto(origin);await status(page,'Cloud character loaded');
 assert.equal(await page.evaluate(()=>player.bolts),778);assert.equal((await api(page,'save')).body.snapshot.player.bolts,778);
 console.log('PASS D: offline save failure, newer pending progress, tab close/reopen and reconnect recovery');
 // Authentication failure is visible and prevents further cloud writes.
 const bpage=players[1].page;const bctx=others[0];await bctx.clearCookies();await bpage.evaluate(()=>{player.bolts++;v49Autosave();});await status(bpage,'Session expired|Sign in required|Sign in again');
 console.log('PASS authentication error: expired/revoked browser cookie surfaces a sign-in error');
 // Representative system checks on an authorized, disposable account, with explicit fixtures.
 await page.evaluate(async()=>{await outputQueue;Object.assign(player,{hp:100,maxHp:170,bolts:5000,turns:150,pack:[],stash:[],houseStorage:[],weapon:'Rusted Pipe',armor:'Worn Jacket',accessory:null,packMax:20});player.flags.seaport55={freed:true,stage:'done'};player.flags.portRoadCleared=true;player.flags.worldHour=8;r11Migrate();});
 await page.evaluate(()=>{rollDamage=()=>28;startCombat({name:'R14 SOLO',level:5,hp:58,min:1,max:1,xp:0,bolts:0},'encounter');});await command(page,'attack');assert.equal(await page.evaluate(()=>combatState.hp),30);
 await page.evaluate(()=>{combatState=null;stage='mercy';mercyLocation='mara';player.pack=[{name:'Claw Hammer',type:'weapon',qty:1}];});const wallet=await page.evaluate(()=>player.bolts);await command(page,'sell claw hammer');assert.equal(await page.evaluate(()=>!!findItem('Claw Hammer')),false);assert(await page.evaluate(()=>player.bolts)>wallet);
 console.log('PASS E: combat damage and inventory sale commands (seeded fixtures)');
 await page.evaluate(()=>{player.flags.factoryDungeon=undefined;factoryState().weaponAwards={};player.pack=[];factoryAwardBossWeapon(0);factoryAwardBossWeapon(0);});assert.equal(await page.evaluate(()=>player.pack.filter(i=>GEAR[i.name]?.type==='weapon').length),1);
 await page.evaluate(()=>{stage='factoryWorkshop';v49FactoryRoom();});await command(page,'1');assert.equal(await page.evaluate(()=>stage),'factoryTerminal');
 await page.evaluate(()=>{player.flags.seaport55.freed=true;r5Docks();});await command(page,'dock bulletin board');assert.match(await page.locator('#screen').innerText(),/TOP 3 MOST WANTED/);
 await page.evaluate(()=>{r11QuestState().shipment='active';r6Begin('coast',1);r6Road().pos=3;r6RoadMenu();});await command(page,'search freight spur');assert.equal(await page.evaluate(()=>r11QuestState().shipment),'ready');
 await page.evaluate(()=>r11QuestMenu('shipment'));const questBolts=await page.evaluate(()=>player.bolts);await command(page,'complete quest');assert.equal(await page.evaluate(()=>player.bolts),questBolts+75);
 console.log('PASS E: Factory menu/reward uniqueness, Seaport board and quest completion commands (seeded fixtures)');
 await page.evaluate(()=>{stage='mercy';mercyLocation='amii';player.bolts=1000;player.bankBolts=0;});await command(page,'deposit 100');assert.equal(await page.evaluate(()=>player.bankBolts),100);await command(page,'withdraw 40');assert.equal(await page.evaluate(()=>player.bankBolts),60);
 await page.evaluate(()=>{player.turns=150;player.flags.portRoadCleared=true;r6Begin('coast',1);});const turns=await page.evaluate(()=>player.turns);await page.evaluate(()=>r6Move());assert.equal(await page.evaluate(()=>player.turns),turns-1);
 await page.evaluate(()=>{combatState=null;stage='mercy';player.flags.seaport55.freed=false;currentRoadWanderer=wanderers[0].name;stage='wandererRoad';showWanderer(wanderers[0],'road');});assert.match(await page.locator('#screen').innerText(),/WANDERER/);await command(page,'small talk');
 console.log('PASS E: banking, coast travel turn charging and wanderer encounter rendering (seeded fixtures)');
 await page.evaluate(()=>v49Autosave());await status(page,'Cloud backup saved');assert.equal((await api(page,'save')).status,200);
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));console.log('PASS mobile viewport: no horizontal overflow');
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS no browser script errors');
 for(const p of [page,players[2].page])await api(p,'logout',{});
 console.log('PASS '+(local?'local':'hosted')+' R14 acceptance complete; credentials not logged; generated development records retained');
 }finally{for(const ctx of others)await ctx.close();if(browser)await browser.close();if(main)await main.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
