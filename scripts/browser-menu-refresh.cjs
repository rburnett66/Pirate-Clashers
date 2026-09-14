const {chromium}=require('@playwright/test'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith('http://127.0.0.1:4173'))errors.push(r.status()+' '+r.url());});
 fs.mkdirSync('test-results/menu-refresh',{recursive:true});await page.goto('http://127.0.0.1:4173');
 await page.evaluate(async()=>{const M=await import('/src/model.js'),s=M.fresh();s.onboarded=true;localStorage.setItem('pirate-clashers-v1',JSON.stringify(s));});await page.reload();
 for(const [width,height] of [[1792,1008],[844,390],[390,844]]){
  await page.setViewportSize({width,height});
  for(const [id,name] of [['battle','BATTLE'],['crew','CREW'],['ports','LEADERS'],['booty','BOOTY PASS'],['store','STORE'],['settings','SETTINGS']]){
   await page.locator(`#rail [data-id=${id}]`).click();await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
   assert.equal(await page.locator('#topbar h1').textContent(),name);assert.equal(await page.locator('.page-title').count(),0);assert.match(await page.locator('#topbar').innerText(),/PIRATE BASH/);
   const geometry=await page.evaluate(()=>{const m=document.querySelector('#main');return{pageWidth:document.documentElement.scrollWidth,mainWidth:m.scrollWidth-m.clientWidth,mainHeight:m.scrollHeight-m.clientHeight};});
   console.log(width,id,geometry);assert.ok(geometry.pageWidth<=width+1,id+' page overflow');assert.ok(geometry.mainWidth<=1,id+' content width overflow');
   if(width>650&&(['battle','ports','booty'].includes(id)||(width===1792&&id==='settings')))assert.ok(geometry.mainHeight<=1,id+' should fit without scrolling');
   await page.screenshot({path:`test-results/menu-refresh/${id}-${width}.png`,fullPage:width<650});
  }
 }
 await page.setViewportSize({width:844,height:390});await page.locator('#rail [data-id=ports]').click();
 const initial=await page.locator('#mapPlane').getAttribute('style');
 await page.getByRole('button',{name:'Next city',exact:true}).click();assert.equal(await page.locator('#portName').innerText(),'Calais');assert.match(await page.locator('#portCounter').innerText(),/2 \/ 15/);
 assert.notEqual(await page.locator('#mapPlane').getAttribute('style'),initial);
 await page.getByRole('button',{name:'Previous city',exact:true}).click();await page.getByRole('button',{name:'Previous city',exact:true}).click();assert.equal(await page.locator('#portName').innerText(),'Hawaii');assert.equal(await page.locator('#mapContinent').innerText(),'PACIFIC');
 await page.locator('#portMap').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#portName').innerText(),'London');
 assert.equal(await page.locator('#mapPlane').evaluate(e=>getComputedStyle(e).transitionDuration),'0.75s');
 const mapBox=await page.locator('#portMap').boundingBox();await page.mouse.move(mapBox.x+mapBox.width*.75,mapBox.y+mapBox.height*.65);await page.mouse.down();await page.mouse.move(mapBox.x+mapBox.width*.3,mapBox.y+mapBox.height*.65);await page.mouse.up();assert.equal(await page.locator('#portName').innerText(),'Calais');
 await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Next city',exact:true}).click();assert.equal(await page.locator('#mapPlane').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');await page.emulateMedia({reducedMotion:'no-preference'});
 for(let i=0;i<15;i++){
  await page.getByRole('button',{name:'Next city',exact:true}).click();assert.equal(await page.locator('#portBoard button').count(),100);
 }
 await page.locator('#portBoard button').first().click();assert.match(await page.locator('#sheet').innerText(),/CAPTAIN’S RECORD/);await page.locator('#sheet [data-action=close]').click();
 await page.locator('#rail [data-id=battle]').click();await page.locator('[data-action=scenery]').click();await page.locator('[data-action=harbor][data-id=locker]').click();await page.reload();assert.match(await page.locator('.harbor-image').getAttribute('src'),/davies-locker/);
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('pirate-clashers-v1'));s.quests.wins=5;localStorage.setItem('pirate-clashers-v1',JSON.stringify(s));});await page.reload();
 await page.locator('#rail [data-id=booty]').click();await page.locator('[data-action=weekly]').click();await page.locator('#sheet [data-action=quest]').click();
 assert.equal(await page.locator('#sheet').evaluate(e=>e.open),false);assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).quests.weeklyClaim));
 await page.locator('[data-action=weekly]').click();assert.ok(await page.locator('#sheet [data-action=quest]').isDisabled());await page.locator('#sheet [data-action=close]').click();
 assert.deepEqual(errors,[]);console.log('Headers, compact layouts, supplied map, 15-city cycling/wrap, board/scouting and scenery persistence pass.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
