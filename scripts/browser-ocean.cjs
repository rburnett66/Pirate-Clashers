
const {chromium,expect}=require('@playwright/test'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173');
  const reset=async motion=>{await page.evaluate(async motion=>{const M=await import('/src/model.js'),s=M.fresh();s.onboarded=true;s.settings.motion=motion;localStorage.setItem('pirate-clashers-v1',JSON.stringify(s));},motion);await page.reload();await page.locator('[data-action=start]').click();};
  await reset(true);
  const ocean=()=>page.frames().find(f=>f.url().endsWith('/public/water.html'));
  await page.waitForTimeout(1600);
  await ocean().waitForFunction(()=>window.pirateOceanSnapshot?.().contacts.length===2);
  const snapshot=()=>ocean().evaluate(()=>window.pirateOceanSnapshot());
  const poses=()=>page.locator('.combat-ship').evaluateAll(es=>es.map(e=>e.style.transform));
  const first=await poses();await page.waitForTimeout(1000);const second=await poses(),sea=await snapshot();
  assert.ok(first.every((p,i)=>p!==second[i]),'both ships follow moving water');
  assert.ok(sea.hulls[0]===1&&sea.hulls[4]===1,'both hulls shape the sea');
  assert.ok(sea.contacts.every(c=>c.samples.some(p=>p.foam>.05)),'water simulation produces contact foam for both hulls');
  assert.ok(sea.contacts.every(c=>c.samples.every(p=>Number.isFinite(p.y)&&Number.isFinite(p.foam))));
  await page.screenshot({path:'test-results/ocean-combat.png'});
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.enemy.hull);
  await page.locator('#aimAngle').fill('5');await page.locator('[data-action=fire]').click();
  const pending=await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.pending);
  assert.equal(pending.plan[0].impact,null);const landing=pending.plan[0].end;
  const firingPose=await poses();await page.waitForTimeout(250);const laterPose=await poses();assert.ok(firingPose.every((p,i)=>p!==laterPose[i]),'both boats keep rocking during flight');
  assert.equal((await snapshot()).splashes,0,'no splash before sea contact');
  await ocean().waitForFunction(()=>window.pirateOceanSnapshot().splashes===1);
  await page.waitForTimeout(160);
  const splash=await snapshot(),record=splash.records.slice(0,4);
  assert.ok(Math.abs(record[0]-(landing.x*5+4))<1e-4);assert.ok(Math.abs(record[1]-landing.y*5)<1e-4);assert.ok(record[2]<1.25);
  await page.screenshot({path:'test-results/ocean-miss-splash.png'});
  await expect(page.locator('#shotReadout')).toContainText('SPLASH');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.enemy.hull),before);
  await page.waitForTimeout(1000);assert.equal((await snapshot()).splashes,1,'impact is emitted once');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
  await page.screenshot({path:'test-results/ocean-portrait.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await reset(false);await page.waitForTimeout(1200);const reduced=await poses();await page.waitForTimeout(600);assert.deepEqual(await poses(),reduced);
  assert.ok((await snapshot()).contacts.every(c=>c.pose.heave===0&&c.pose.roll===0));
  assert.deepEqual(errors,[]);
  const report={passed:true,errors,settings:sea.settings,first,second,landing,impact:record,checks:['both hulls coupled to ocean','visible rocking from water','foam sampled from simulation','both boats keep rocking during flight','miss splash at exact analytic landing','no splash before impact or duplicate after','miss leaves health unchanged','portrait water alignment','reduced motion stable']};
  fs.writeFileSync('test-results/ocean-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
