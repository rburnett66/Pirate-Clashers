const {chromium}=require('@playwright/test'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173');
  await page.evaluate(async()=>{const M=await import('/src/model.js'),s=M.fresh();s.onboarded=true;s.settings.sound=false;localStorage.setItem('pirate-clashers-v1',JSON.stringify(s));});await page.reload();
  const closeSize=async()=>{const r=await page.locator('#sheet>.close').boundingBox();assert.ok(Math.abs(r.width-r.height)<1&&r.width>=59&&r.width<=61,'consistent 60px square close');assert.equal(await page.locator('#sheet>.close').innerText(),'X');};
  await page.locator('[data-action=scenery]').click();await closeSize();await page.locator('#sheet>.close').click();
  await page.locator('[data-action=start]').click();await closeSize();await page.waitForSelector('.match-intro');
  await page.waitForFunction(()=>{const frames=[...document.querySelectorAll('[data-preview]')];return frames.length===2&&frames.every(f=>f.contentDocument?.body.dataset.shipArt==='ready'&&getComputedStyle(f).opacity==='1');});
  for(const [width,height] of [[320,568],[390,844],[932,430]]){await page.setViewportSize({width,height});await closeSize();assert.ok(await page.locator('#sheet').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'intro has no horizontal overflow');await page.screenshot({path:`test-results/dialog-intro-${width}.png`});}
  await page.locator('[data-action=begin-battle]').click();await page.locator('[data-action=retreat]').click();await closeSize();await page.locator('[data-action=confirm-retreat]').click();await page.locator('.battle-result.defeat').waitFor();await closeSize();
  assert.deepEqual(errors,[]);console.log('PASS: intro ships survive dialog transition with reduced motion; consistent square close buttons in scenery, search, intro, retreat and result dialogs.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
