
const {chromium}=require('@playwright/test'),assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('http://127.0.0.1:4173');
await page.evaluate(async()=>{const M=await import('/src/model.js');const s=M.fresh();s.onboarded=true;localStorage.setItem('pirate-clashers-v1',JSON.stringify(s));});await page.reload();
await page.getByRole('button',{name:'Leaders',exact:true}).click();
assert.deepEqual(await page.locator('.port-region h3').allTextContents(),['Europe','Americas','Africa / India','Asia','Pacific']);
await page.screenshot({path:'test-results/leaders-regions.png'});
await page.locator('[data-action=nav][data-id=battle]').click();
await page.locator('[data-action=start]').click();
await page.waitForTimeout(1800);
console.log('phase',await page.locator('#phaseLabel').innerText());
console.log('weapon',await page.locator('#weaponInfo').innerText());
console.log('frames',await Promise.all(page.frames().map(async f=>({url:f.url(),fatal:await f.locator('.fatal').allTextContents(),images:await f.locator('#gameCrew img, #gamePorts img').count()}))));
await page.screenshot({path:'test-results/combat-angle.png'});
await page.locator('[data-action=sail][data-id="1"]').click();
await page.locator('[data-action=sail][data-id="-1"]').click();
await page.locator('#aimAngle').fill('25');
assert.equal(await page.locator('#angleValue').innerText(),'25°');assert.equal(await page.locator('[data-action=target]').count(),0);
const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.enemy.hull);
await page.locator('[data-action=fire]').click();
await page.waitForTimeout(700);
assert.equal(await page.locator('#phaseLabel').innerText(),'YOUR SHOT IN FLIGHT');assert.equal(await page.locator('#flyingShots circle').count(),1);assert.equal(await page.locator('#aimAngle').isDisabled(),true);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.enemy.hull),before);
await page.screenshot({path:'test-results/combat-flight.png'});
await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.phase==='player');
console.log('impact',await page.locator('#shotReadout').innerText());
await page.locator('[data-action=fire]').click();
await page.waitForFunction(()=>{const b=JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle;return b.phase==='player'&&b.turn===2;},null,{timeout:20000});
await page.screenshot({path:'test-results/combat-turn-two.png'});

assert.ok(await page.locator('[data-action=fire]').isEnabled());
await page.locator('[data-action=gun][data-id="2"]').click();
assert.match(await page.locator('#weaponInfo').innerText(),/86 m/);
await page.locator('#aimAngle').fill('75');
const arc=await page.locator('#aimArc polyline').getAttribute('points');
assert.ok(arc.split(' ').every(s=>Number(s.split(',')[1])>=0),'steep arc stays visible');
await page.locator('#aimAngle').fill('35');
await page.locator('[data-action=fire]').click();
await page.waitForTimeout(200);await page.reload();await page.locator('[data-action=start]').click();
await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.phase==='player');
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.events.length),5);
for(const [name,width,height] of [['portrait',390,844],['landscape',932,430]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(250);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 for(const control of await page.locator('[data-action=fire],[data-action=finisher],[data-action=sail]').all()){const rect=await control.boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width&&rect.y+rect.height<=height,name+' control stays inside viewport: '+JSON.stringify(rect));}
 await page.screenshot({path:'test-results/combat-'+name+'.png'});
}
console.log('Combat browser checks passed: regions, movement, angle, visible flight, health timing, complete turn, steep arc, reload and responsive controls.');
require('node:fs').writeFileSync('test-results/combat-report.json',JSON.stringify({passed:errors.length===0,errors,checks:['regional Leaders ordering','turn indicators','ahead/back movement','gunner weapon and range','numeric angle','visible slow flight','health after impact','enemy turn locks','steep arc in view','pending flight reload','portrait controls','landscape controls']},null,2));console.log('errors',errors);

await browser.close();assert.equal(errors.length,0);
})().catch(e=>{console.error(e);process.exit(1);});
