const {chromium}=require('@playwright/test'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:932,height:430}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173');
  await page.evaluate(async()=>{const M=await import('/src/model.js'),s=M.fresh();s.onboarded=true;s.settings.motion=false;s.settings.sound=false;M.startBattle(s,1900000000000);localStorage.setItem('pirate-clashers-v1',JSON.stringify(s));});await page.reload();await page.locator('[data-action=start]').click();
  await page.waitForTimeout(500);
  const frame=page.frames().find(f=>f.url().endsWith('ship.html?side=player'));await frame.evaluate(()=>window.addEventListener('message',e=>{if(e.data?.type==='pirate-render'&&'cutaway'in e.data)window.testCutaway=e.data.cutaway;}));
  const enemyFrame=page.frames().find(f=>f.url().endsWith('ship.html?side=enemy'));await enemyFrame.evaluate(()=>window.addEventListener('message',e=>{if(e.data?.type==='pirate-render'&&'cutaway'in e.data)window.testCutaway=e.data.cutaway;}));
  const shot=await page.evaluate(async()=>{const M=await import('/src/model.js'),s=JSON.parse(localStorage.getItem('pirate-clashers-v1'));for(const g of M.active(s.battle.player))for(let angle=5;angle<=75;angle++){const f=M.previewShot(s,{gunner:g.id,angle});if(f.shots.some(q=>q.impact?.kind==='hull'))return {gunner:g.id,angle};}throw Error('No hull-hit fixture');});
  await page.locator('#guns [data-id="'+shot.gunner+'"]').click();await page.waitForFunction(()=>document.querySelector('#combatField').dataset.view==='wide');await page.locator('#aimAngle').fill(String(shot.angle));await page.locator('[data-action=fire]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.events.length===1,null,{timeout:15000});const hitAt=Date.now();
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.events[0].hit));
  const seconds=await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.seconds);
  await page.waitForTimeout(2100);assert.equal(await page.locator('#combatField').getAttribute('data-view'),'impact');assert.ok(await page.locator('#guns button').first().isDisabled());assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.seconds),seconds);
  await page.waitForFunction(()=>!document.querySelector('#guns button').disabled);assert.ok(Date.now()-hitAt>=2850);assert.equal(await page.locator('#combatField').getAttribute('data-view'),'impact');
  await page.locator('#guns [data-id="'+shot.gunner+'"]').click();await page.locator('#aimAngle').fill(String(shot.angle));await page.locator('[data-action=fire]').click();
  await page.waitForFunction(()=>{const b=JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle;return b.pending?.side==='enemy';},null,{timeout:15000});await page.waitForTimeout(100);assert.equal(await frame.evaluate(()=>window.testCutaway),false);assert.equal(await enemyFrame.evaluate(()=>window.testCutaway),false);
  await page.waitForFunction(()=>{const b=JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle;return b.turn===2&&b.phase==='player'&&!document.querySelector('#guns button').disabled;},null,{timeout:25000});assert.equal(await frame.evaluate(()=>window.testCutaway),true);assert.equal(await page.locator('#combatField').getAttribute('data-view'),'impact');
  await page.screenshot({path:'test-results/camera-hold-after-enemy.png'});assert.deepEqual(errors,[]);console.log('Camera tests passed: immediate selection zoom-out, 3-second hit hold, paused turn clock, retained wide view, and both hulls closed during enemy shots.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
