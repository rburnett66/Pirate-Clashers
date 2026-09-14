const {chromium}=require('@playwright/test'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).hostname==='127.0.0.1')errors.push(r.status()+' '+r.url());});
 fs.mkdirSync('test-results/menu-art',{recursive:true});
 const shot=async name=>{await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});await page.screenshot({path:'test-results/menu-art/'+name+'.png',fullPage:true});};
 const nav=async name=>page.locator('#rail [data-id="'+name+'"]').click();
 const fits=async name=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflows viewport');
 await page.goto('http://127.0.0.1:4173');
 await page.evaluate(async()=>{const M=await import('/src/model.js'),s=M.fresh();s.onboarded=true;s.settings.motion=false;localStorage.setItem('pirate-clashers-v1',JSON.stringify(s));});await page.reload();
 for(const name of ['battle','crew','ports','booty','store','settings']){await nav(name);await shot(name);await fits(name);}
 await nav('crew');
 for(const tab of ['collection','yard','equipment']){await page.locator('[data-action=tab][data-id='+tab+']').click();await shot('crew-'+tab);await fits(tab);}
 await page.locator('[data-action=tab][data-id=collection]').click();
 assert.equal(await page.locator('.pirate-card').count(),36);
 await page.locator('.pirate-card[data-id="1"]').click();await shot('crew-detail');await page.locator('[data-action=close]').click();
 await nav('battle');await page.locator('[data-action=scenery]').click();await page.locator('[data-action=harbor][data-id=locker]').click();await page.reload();await page.locator('[data-action=scenery]').click();
 assert.equal(await page.locator('[data-action=harbor][data-id=locker]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-action=harbor][data-id=hawaii]').click();
 await page.locator('.wallet-add').click();assert.equal(await page.locator('body').getAttribute('data-page'),'store');
 await nav('crew');await page.locator('[data-action=tab][data-id=ship]').click();await page.locator('.pirate-card[data-id="10"]').click();await page.locator('[data-action=slot][data-id=d0]').click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).slots.d0),10);
 await nav('battle');await page.locator('[data-action=start]').click();await shot('combat');
 await page.locator('[data-action=retreat]').click();await page.locator('[data-action=confirm-retreat]').click();await shot('defeat');
 assert.ok(await page.locator('.result-illustration img').count());
 await page.locator('[data-action=return]').click();
 await nav('ports');await page.getByRole('button',{name:'Previous city',exact:true}).click();assert.equal(await page.locator('#portName').innerText(),'Hawaii');assert.equal(await page.locator('.world-map-art').count(),1);await shot('leaders-hawaii');
 await nav('battle');
 // A saved, settled victory exercises the actual result/reward UI without a long match.
 await page.evaluate(async()=>{const M=await import('/src/model.js'),s=M.fresh();s.onboarded=true;s.settings.motion=false;M.startBattle(s);s.battle.phase='result';s.battle.won=true;M.settle(s);localStorage.setItem('pirate-clashers-v1',JSON.stringify(s));});await page.reload();
 await page.locator('[data-action=last-result]').click();await shot('victory');
 assert.match(await page.locator('.result-title').innerText(),/VICTORY/);
 await page.locator('[data-action=return]').click();
 const beforeChest=await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).gold);
 await page.locator('[data-action=chest]').first().click();await shot('chest-rewards');
 assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).gold)>beforeChest);
 await page.locator('[data-action=close]').click();
 // Primary layouts must fit desktop, phone landscape and phone portrait.
 for(const size of [{width:844,height:390},{width:390,height:844}]){
  await page.setViewportSize(size);
  for(const name of ['battle','crew','ports','booty','store','settings']){await nav(name);await fits(name+' '+size.width);await shot(name+'-'+size.width);}
 }
 await nav('battle');const goldBeforeReview=await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).gold);
 await page.locator('[data-action=last-result]').click();await shot('victory-390');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).gold),goldBeforeReview,'Reopening results must not pay twice');
 await page.locator('[data-action=close]').click();
 const plus=await page.locator('.wallet-add').boundingBox();assert.ok(plus.width>=44&&plus.height>=44);
 await page.locator('.wallet-add').click();assert.equal(await page.locator('body').getAttribute('data-page'),'store');
 assert.deepEqual(errors,[]);console.log('Menu art: six screens, crew tabs/details, persisted scenery, wallet, crew placement, combat/defeat, desktop and mobile layouts passed.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
