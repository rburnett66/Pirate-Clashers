const {chromium}=require('@playwright/test'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.argv[2]||'http://127.0.0.1:4173';
(async()=>{
 const manifestResponse=await fetch(base+'/public/game.webmanifest');assert.match(manifestResponse.headers.get('content-type'),/application\/manifest\+json/);
 const manifest=await manifestResponse.json();assert.equal(manifest.display,'fullscreen');assert.equal((await fetch(base+manifest.icons[0].src)).status,200);
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.evaluate(async()=>{const M=await import('/src/model.js'),s=M.fresh();s.onboarded=true;s.settings.motion=false;localStorage.setItem('pirate-clashers-v1',JSON.stringify(s));});await page.reload();
 assert.equal(await page.locator('meta[name=apple-mobile-web-app-capable]').getAttribute('content'),'yes');
 const fullscreen=page.locator('#topbar [data-action=fullscreen]');
 await fullscreen.click();await page.waitForFunction(()=>!!document.fullscreenElement);assert.equal(await fullscreen.getAttribute('aria-label'),'Exit full screen');
 await page.locator('[data-action=start]').click();await page.waitForSelector('#aimAngle');
 await page.locator('#aimAngle').fill('30');await page.evaluate(()=>window.originalShip=document.querySelector('#playerShip'));
 await page.locator('.battle-top [data-action=fullscreen]').click();await page.waitForFunction(()=>!document.fullscreenElement);
 assert.ok(await page.evaluate(()=>window.originalShip===document.querySelector('#playerShip')),'Fullscreen exit preserves the live renderer');assert.equal(await page.locator('#aimAngle').inputValue(),'30');
 fs.mkdirSync('test-results/fullscreen',{recursive:true});
 for(const [width,height,safe] of [[844,390,0],[844,390,21],[844,320,0],[667,375,0]]){
  await page.setViewportSize({width,height});await page.evaluate(safe=>{const s=document.documentElement.style;s.setProperty('--safe-bottom',safe+'px');s.setProperty('--safe-left',safe?'44px':'0px');s.setProperty('--safe-right',safe?'44px':'0px');},safe);
  const bounds=await page.evaluate(()=>{const r=document.querySelector('.battle-bottom').getBoundingClientRect(),field=document.querySelector('#combatField').getBoundingClientRect(),b=document.querySelector('.battle-top button').getBoundingClientRect();return {bottom:r.bottom,field:field.height,button:b.width,overflow:document.documentElement.scrollWidth>innerWidth+1};});
  assert.ok(bounds.bottom<=height-safe+1,JSON.stringify({width,height,safe,bounds}));assert.ok(bounds.field>=59);assert.ok(bounds.button>=44);assert.ok(!bounds.overflow);
  await page.screenshot({path:`test-results/fullscreen/battle-${width}x${height}-safe${safe}.png`});
 }
 // Feature absence and rejection are distinct browser paths. Neither may lose the battle.
 await page.evaluate(()=>{document.documentElement.requestFullscreen=()=>Promise.reject(new TypeError('Denied'));});
 await page.locator('.battle-top [data-action=fullscreen]').click();await page.waitForSelector('#sheet[open]');assert.match(await page.locator('#sheet').innerText(),/could not enter full screen/);
 await page.locator('#sheet [data-action=close]').click();
 await page.evaluate(()=>{document.documentElement.requestFullscreen=undefined;Object.defineProperty(navigator,'userAgent',{configurable:true,value:'iPhone Safari'});});
 await page.locator('.battle-top [data-action=fullscreen]').click();assert.match(await page.locator('#sheet').innerText(),/Add to Home Screen/);assert.match(await page.locator('#sheet').innerText(),/Export captain/);
 await page.screenshot({path:'test-results/fullscreen/iphone-instructions.png'});await page.locator('#sheet [data-action=close]').click();
 await page.evaluate(()=>{Object.defineProperty(navigator,'standalone',{value:true});});
 await page.locator('.battle-top [data-action=fullscreen]').click();assert.match(await page.locator('#sheet').innerText(),/without browser bars/);
 assert.deepEqual(errors,[]);console.log('Fullscreen enters/exits via clicks, retains battle/aim, fits short landscapes and simulated safe areas; denial, iPhone instructions and standalone fallback pass. Manifest and icon served. Physical Safari/Chrome verification remains on device.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
