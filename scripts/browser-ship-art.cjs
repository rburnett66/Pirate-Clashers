const {chromium}=require('@playwright/test'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:932,height:430}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/favicon.ico',r=>r.fulfill({status:204}));
  await page.goto('http://127.0.0.1:4173/public/ship.html?side=player');
  await page.evaluate(async()=>{const M=await import('/src/model.js');const s=M.fresh();s.sailLevel=5;window.fixture=M.startBattle(s).player;});
  const configure=async(cosmetic,level=3)=>{
   await page.evaluate(({cosmetic,level})=>{document.body.dataset.shipArt='loading';window.postMessage({type:'pirate-render',action:'configure',level,cosmetic,parts:window.fixture,crew:[],motion:false,preview:true},location.origin);},{cosmetic,level});
   await page.waitForFunction(()=>document.body.dataset.shipArt==='ready');await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.body.dataset.sailCount),'5');assert.equal(await page.evaluate(()=>document.body.dataset.flagCount),'2');
  };
  const pixels=id=>page.evaluate(id=>{const c=document.querySelector(id),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let alpha=0,hash=0;for(let i=0;i<d.length;i+=4){alpha+=d[i+3];hash=(hash*31+d[i]+d[i+1]*3+d[i+2]*7+d[i+3]*11)>>>0;}return {alpha,hash};},id);
  const styles=['IMG_7254','IMG_7255','IMG_7256','IMG_7257','IMG_7258','IMG_7261'],hashes=[];
  for(let i=0;i<6;i++){await configure(i);assert.equal(await page.evaluate(()=>document.body.dataset.sailArt),styles[i]);hashes.push((await pixels('#gameRigArt')).hash);}
  assert.equal(new Set(hashes).size,6);
  await configure(3,6);assert.equal(await page.evaluate(()=>document.body.dataset.hullArt),'IMG_7287');await page.screenshot({path:'test-results/ship-art-white-sails.png'});
  await configure(1,6);await page.screenshot({path:'test-results/ship-art-template-red.png'});
  const intact=await pixels('#gameRigArt'),closed=await pixels('#gameHullArt');assert.ok(intact.alpha>0&&closed.alpha>0);
  await page.evaluate(()=>{window.fixture.sailParts.forEach(p=>p.hp=p.maxHp*.3);window.postMessage({type:'pirate-render',action:'sync',parts:window.fixture,crew:[]},location.origin);});await page.waitForTimeout(200);
  const torn=await pixels('#gameRigArt');assert.ok(torn.alpha<intact.alpha);assert.notEqual(torn.hash,intact.hash);
  await page.evaluate(()=>{window.fixture.mastParts.forEach(p=>p.hp=0);window.postMessage({type:'pirate-render',action:'sync',parts:window.fixture,crew:[]},location.origin);});await page.waitForTimeout(200);
  assert.equal((await pixels('#gameRigArt')).alpha,0);await page.screenshot({path:'test-results/ship-art-masts-destroyed.png'});
  await page.evaluate(()=>window.postMessage({type:'pirate-render',action:'view',cutaway:true,hideRig:true},location.origin));await page.waitForTimeout(200);assert.equal((await pixels('#gameHullArt')).alpha,0);assert.ok((await pixels('#gameInterior')).alpha>0);await page.screenshot({path:'test-results/ship-art-new-interior.png'});
  await page.evaluate(()=>window.postMessage({type:'pirate-render',action:'view',cutaway:false},location.origin));await page.waitForTimeout(200);assert.equal((await pixels('#gameHullArt')).alpha,closed.alpha);
  assert.deepEqual(errors,[]);console.log('Ship art checks passed: six distinct sail sets, level-six hull, visible sail damage, all mast/sail/flag groups removed together, and reversible interior reveal.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
