// Local HTTPS integration only. Requires the local-server.mjs runner and Playwright.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.R11_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 try {
 const errors=[];
 async function client(){
  const c=await browser.newContext({ignoreHTTPSErrors:true});
  const p=await c.newPage();p.on('dialog',d=>d.accept());p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{const original=setTimeout;window.setTimeout=(fn,ms,...args)=>{if(ms<=300){queueMicrotask(()=>fn(...args));return 0;}return original(fn,ms,...args);};});
  await p.goto('https://localhost:8787');await p.waitForFunction(()=>typeof saveSnapshot==='function');
  return {c,p};
 }
 const a=await client(), login='browser_'+randomUUID().replaceAll('-','').slice(0,16),password=randomUUID();
 await a.p.locator('[name=login]').fill(login);await a.p.locator('[name=password]').fill(password);await a.p.locator('button[value=register]').click();
 await a.p.locator('#cloud-link').waitFor({state:'visible'});
 const cookies=await a.c.cookies();const auth=cookies.find(c=>c.name==='__Host-r127dev');assert(auth&&auth.secure&&auth.httpOnly&&auth.sameSite==='Strict');
 assert(!(await a.p.evaluate(()=>document.cookie)).includes('__Host-r127dev'));
 console.log('PASS: actual browser registration and protected session cookie');
 await a.p.evaluate(()=>{player.handle='Browser Ranger';player.characterId='local-'+crypto.randomUUID();player.level=3;player.bolts=200;stage='mercy';});
 await a.p.locator('#cloud-link').click();
 await a.p.waitForFunction(()=>document.getElementById('cloud-status').textContent.includes('Cloud character loaded'));
 const id=await a.p.evaluate(()=>player.characterId);assert.match(id,/^char-/);
 await a.p.evaluate(()=>{player.bolts=237;saveGame(1);});
 await a.p.waitForFunction(()=>/Cloud backup saved/.test(document.getElementById('cloud-status').textContent),{},{timeout:20000});
 console.log('PASS: link current character, retain server identity, automatic cloud backup');
 const b=await client();await b.p.locator('[name=login]').fill(login);await b.p.locator('[name=password]').fill(password);await b.p.locator('button[value=login]').click();
 await b.p.locator('#cloud-resume').waitFor({state:'visible'});await b.p.locator('#cloud-resume').click();
 await b.p.waitForFunction(()=>document.getElementById('cloud-status').textContent.includes('Cloud character loaded')).catch(async e=>{console.error('Recovery status:',await b.p.locator('#cloud-status').textContent());console.error('Browser errors:',errors);throw e;});
 assert.deepEqual(await b.p.evaluate(()=>({id:player.characterId,bolts:player.bolts,handle:player.handle})),{id,bolts:237,handle:'Browser Ranger'});
 console.log('PASS: independent browser session login and full cloud recovery');
 await b.p.reload();await b.p.locator('#cloud-resume').waitFor({state:'visible'});console.log('PASS: cookie session survives page reload');
 await b.p.setViewportSize({width:390,height:844});
 assert(await b.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile overflow');
 console.log('PASS: online development client mobile width');
 await b.p.locator('#cloud-out').click();await b.p.locator('#cloud-auth').waitFor({state:'visible'});
 const denied=await b.p.evaluate(async()=> (await fetch('/api/me')).status);assert.equal(denied,401);
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS: browser logout and no JavaScript errors');
 await a.c.close();await b.c.close();
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
