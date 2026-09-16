const {chromium}=require('@playwright/test'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith('http://127.0.0.1'))errors.push(r.status()+' '+r.url());});
 page.on('request',r=>{if(r.url().includes('/upgrade-audio/'))requests.push(r.url());});
 await page.goto('http://127.0.0.1:4173');
 const fixture=async({level=1,sails=1,result=null,motion=true}={})=>{await page.evaluate(async({level,sails,result,motion})=>{
  const M=await import('/src/model.js');const s=M.fresh();Object.assign(s,{onboarded:true,gold:100000,gems:10000,mats:{wood:100000,metal:100000,cloth:100000},shipLevel:level,sailLevel:sails});s.settings.motion=motion;s.settings.sound=true;
  for(const id of [1,2,3,4,5,6,7,8])s.levels[id]=1;s.slots=Object.fromEntries(M.positions(s).map((slot,i)=>[slot,i+1]));
  if(result!==null){s.chestRun=4;const b=M.startBattle(s);b.phase='result';b.won=result;b.enemyName=result?'Captain Current Victory':'Captain Current Defeat';if(result)b.enemy.crew.forEach(g=>g.hp=0);M.settle(s);s.battle=null;}
  localStorage.setItem('pirate-clashers-v1',JSON.stringify(s));
 },{level,sails,result,motion});await page.reload();};
 const readSave=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')));
 const crew=async()=>{const button=page.locator('#rail [data-id=crew]');await button.click();assert.equal((await button.innerText()).trim(),'Ship');};
 const ready=async()=>{const f=page.frameLocator('#homeShip');await f.locator('body[data-ship-art=ready]').waitFor();await f.locator('body').evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));return f;};
 await fixture();await crew();let f=await ready();assert.equal(await f.locator('body').getAttribute('data-sail-count'),'1');assert.equal(await f.locator('body').getAttribute('data-port-count'),'1');
 const before=await readSave();await page.locator('[data-action=ship-up]').click();await page.locator('.construction-cloud').waitFor();assert.equal(await page.locator('.construction-cloud i').count(),30);assert.equal(await page.locator('#app').getAttribute('inert'),'');
 await page.screenshot({path:'test-results/upgrades-smoke-start.png'});await page.waitForTimeout(1200);assert.equal(await page.locator('#homeShip').evaluate(n=>getComputedStyle(n).visibility),'hidden');await page.screenshot({path:'test-results/upgrades-smoke-covered.png'});
 await page.locator('.upgrade-rays').waitFor();await page.screenshot({path:'test-results/upgrades-reveal.png'});
 await page.locator('.upgrade-comparison').waitFor();assert.match(await page.locator('#sheet').innerText(),/Hull Level 2/);assert.match(await page.locator('#sheet').innerText(),/580/);const after=await readSave();assert.equal(after.shipLevel,2);assert.equal(after.mats.wood,before.mats.wood-260);assert.ok(requests.some(u=>u.endsWith('construction.m4a')));await page.screenshot({path:'test-results/upgrades-comparison.png'});await page.locator('#sheet [data-action=close]').last().click();
 await page.locator('[data-action=sail-up]').click();f=await ready();assert.equal(await f.locator('body').getAttribute('data-sail-count'),'2');
 await page.locator('[data-action=cosmetic][data-id="2"]').click();f=await ready();assert.equal(await f.locator('body').getAttribute('data-sail-art'),'IMG_7256');
 await page.locator('[role=tab][data-id=flags]').click();await page.locator('[data-action=flag][data-id="2"]').click();assert.equal((await readSave()).flag,2);assert.equal(await page.locator('.equipment-card.equipped').count(),1);
 await page.locator('[role=tab][data-id=figureheads]').click();await page.locator('[data-action=figure][data-id=dolphin]').click();assert.equal((await readSave()).figurehead,'dolphin');await page.reload();await crew();await page.locator('[role=tab][data-id=figureheads]').click();assert.match(await page.locator('.equipment-card.equipped').innerText(),/Dolphin/);
 for(const level of [1,2,3,4,5,6]){await fixture({level,sails:5,motion:false});await crew();f=await ready();assert.equal(await f.locator('body').getAttribute('data-port-count'),String([1,2,2,3,3,4][level-1]));await page.screenshot({path:`test-results/upgrades-hull-${level}.png`});
  await page.locator('[data-action=tab][data-id=gunners]').click();f=await ready();assert.equal(await f.locator('#gamePorts img').count(),[1,2,2,3,3,4][level-1]);assert.equal(await page.locator('.ship-diagram .slot').count(),level+2);
  assert.equal(await f.locator('#gameInterior').evaluate(n=>n.getContext('2d').getImageData(0,0,n.width,n.height).data.some((v,i)=>i%4===3&&v>0)),true);
  if(level===6)await page.screenshot({path:'test-results/upgrades-gunners-six.png'});
 }
 for(const result of [true,false]){await fixture({result,motion:false});const snapshot=await readSave();await page.locator('[data-action=last-result]').click();await page.locator('.battle-result').waitFor();await page.locator('.result-background').evaluate(img=>img.decode());assert.equal(await page.locator('[data-reward=Gold]').innerText(),'+'+snapshot.lastResult.gold.toLocaleString());assert.equal(await page.locator('[data-reward=Gems]').innerText(),'+'+snapshot.lastResult.gems.toLocaleString());
  assert.equal(await page.locator('.result-rematch img').count(),result?0:1);if(!result)assert.equal(await page.locator('.result-rematch img').getAttribute('src'),'/public/menu-art/rematch__e48b14f8.png');
  assert.equal(await page.locator('.result-port-button').count(),result?1:0);if(result)assert.match(await page.locator('.result-port-button').innerText(),/Return to port/i);assert.equal(await page.locator('.result-log').count(),0);assert.equal(await page.locator('[data-reward=Honor]').count(),0);if(!result)assert.match(await page.locator('.result-summary').innerText(),/turns/);
  for(const [width,height]of [[1440,1000],[844,390],[390,844]]){await page.setViewportSize({width,height});await page.screenshot({path:`test-results/upgrades-${result?'victory':'defeat'}-${width}.png`});assert.ok(await page.locator('#sheet').evaluate(n=>n.scrollWidth<=n.clientWidth+2));assert.ok(await page.locator('#sheet').evaluate(n=>n.scrollHeight<=n.clientHeight+2));}
  await page.locator(result?'[data-action=return]':'.battle-result-sheet > .close').click();assert.equal((await readSave()).gold,snapshot.gold);await page.locator('[data-action=last-result]').click();assert.equal((await readSave()).gold,snapshot.gold);await page.locator('.battle-result-sheet > .close').click();await page.setViewportSize({width:1440,height:1000});
 }
 for(const [width,height]of [[844,390],[390,844]]){await page.setViewportSize({width,height});await fixture({sails:5,motion:false});await crew();await ready();await page.screenshot({path:`test-results/upgrades-ship-${width}.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));}
 assert.deepEqual(errors,[]);fs.writeFileSync('test-results/ship-upgrades-browser.json',JSON.stringify({passed:true,audioRequests:requests,errors},null,2));console.log('Ship upgrades browser checks passed: smoke/swap/reveal, transactions, inventory persistence, six hull layouts, inner hull, live result values, reward replay and responsive bounds.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
