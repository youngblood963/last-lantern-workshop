const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
(async()=>{
 let browser=await chromium.launch({executablePath:process.env.R11_CHROMIUM,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const errors=[];
 try{
 const context=await browser.newContext({ignoreHTTPSErrors:true});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const old=setTimeout;window.setTimeout=(f,ms,...a)=>old(f,ms<=600?0:ms,...a);});
 await page.goto('https://localhost:8787');
 const login='r13_'+randomUUID().slice(0,18),password=randomUUID();
 await page.locator('[name=login]').fill(login);await page.locator('[name=password]').fill(password);await page.locator('[value=register]').click();await page.locator('#cloud-link').waitFor({state:'visible'});
 await page.evaluate(()=>localStorage.setItem(SAVE_KEYS[1],'legacy sentinel'));await page.locator('#cloud-link').click();await page.waitForFunction(()=>stage==='wake'&&!busy);
 async function command(s){await page.locator('#command').fill(s);await page.locator('#command').press('Enter');await page.waitForFunction(()=>!commandProcessing&&!busy);}
 await command('stand up');await command('Ranger');await command('yes');await page.waitForFunction(()=>/Cloud character loaded/.test(document.getElementById('cloud-status').textContent));
 const id=await page.evaluate(()=>player.characterId);assert.match(id,/^char-/);console.log('PASS registration, actual opening, automatic character creation');
 const cookie=(await context.cookies()).find(c=>c.name==='__Host-r127dev');assert(cookie.secure&&cookie.httpOnly&&cookie.sameSite==='Strict');
 await command('search room');await page.waitForFunction(()=>/Cloud backup saved/.test(document.getElementById('cloud-status').textContent));const bolts=await page.evaluate(()=>player.bolts);
 await page.reload();await page.waitForFunction(()=>/Cloud character loaded/.test(document.getElementById('cloud-status').textContent));assert.equal(await page.evaluate(()=>player.bolts),bolts);console.log('PASS real command save and session reload');
 await page.evaluate(()=>{player.pack.push({name:'Test salvage',type:'material',qty:3});player.level=4;player.xp=250;player.flags.relayQuest='complete';v49Autosave();});await page.waitForFunction(()=>/Cloud backup saved/.test(document.getElementById('cloud-status').textContent));
 await context.setOffline(true);await page.evaluate(()=>{player.bolts=777;v49Autosave();});await page.waitForFunction(()=>/Cloud unavailable/.test(document.getElementById('cloud-status').textContent));await page.evaluate(()=>{player.bolts=778;v49Autosave();});
 page.on('dialog',d=>d.accept());await page.close();await context.setOffline(false);
 const returned=await context.newPage();returned.on('pageerror',e=>errors.push(e.message));await returned.goto('https://localhost:8787');await returned.waitForFunction(()=>/Cloud character loaded/.test(document.getElementById('cloud-status').textContent));
 assert.equal(await returned.evaluate(()=>player.bolts),778);assert.equal(await returned.evaluate(()=>player.level),4);assert.equal(await returned.evaluate(()=>player.flags.relayQuest),'complete');assert(await returned.evaluate(()=>player.pack.some(i=>i.name==='Test salvage'&&i.qty===3)));assert.equal(await returned.evaluate(()=>localStorage.getItem(SAVE_KEYS[1])),'legacy sentinel');console.log('PASS outage close/reopen, latest progress, inventory, quest, progression, legacy preservation');
 await returned.locator('#cloud-out').click();await returned.locator('#cloud-auth').waitFor({state:'visible'});await returned.locator('[name=login]').fill(login);await returned.locator('[name=password]').fill(password);await returned.locator('[value=login]').click();await returned.waitForFunction(()=>/Cloud character loaded/.test(document.getElementById('cloud-status').textContent));assert.equal(await returned.evaluate(()=>player.characterId),id);console.log('PASS returning account login');
 await returned.goto('https://localhost:8787/?offline=1');assert.equal(await returned.locator('#cloud-dev').count(),0);assert.equal(await returned.evaluate(()=>localStorage.getItem(SAVE_KEYS[1])),'legacy sentinel');assert.equal(await returned.evaluate(()=>typeof saveGame),'function');console.log('PASS offline QA');
 const state=await context.storageState();await context.close();await browser.close();
 browser=await chromium.launch({executablePath:process.env.R11_CHROMIUM,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const fresh=await browser.newContext({ignoreHTTPSErrors:true,storageState:state});const resumed=await fresh.newPage();resumed.on('pageerror',e=>errors.push(e.message));
 await resumed.goto('https://localhost:8787');await resumed.waitForFunction(()=>/Cloud character loaded/.test(document.getElementById('cloud-status').textContent));assert.equal(await resumed.evaluate(()=>player.bolts),778);assert.equal(await resumed.evaluate(()=>player.characterId),id);await fresh.close();console.log('PASS full browser process restart with persisted cookie and storage');
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS no browser errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
