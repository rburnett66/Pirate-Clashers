const {chromium}=require('@playwright/test'),assert=require('node:assert/strict');
const BASE=process.env.PIRATE_TEST_URL||'http://127.0.0.1:4173/';
const health=f=>{const {pose,...rest}=f;return rest;};
const read=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle);
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const p=await browser.newPage({viewport:{width:932,height:430},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
async function seed(id,width=932,motion=true){await p.setViewportSize({width,height:width===932?430:844});await p.goto(BASE);await p.evaluate(async({id,motion})=>{const M=await import('/src/model.js'),s=M.fresh();s.onboarded=true;s.shipLevel=6;s.sailLevel=5;s.moves=M.FINISHERS.map(m=>m.id);s.move=id;s.settings.motion=motion;s.settings.sound=false;s.slots={};M.positions(s).forEach((slot,i)=>{s.slots[slot]=i+1;s.levels[i+1]=1;});const b=M.startBattle(s);b.charged=true;b.streak=4;localStorage.setItem('pirate-clashers-v1',JSON.stringify(s));},{id,motion});await p.reload();await p.locator('[data-action=start]').click();await p.locator('#finisherCharge .finisher').waitFor();await p.waitForFunction(()=>document.querySelector('#enemyShip')?.contentDocument?.body?.dataset.shipArt==='ready');}
for(let [id,width]of [[0,390],[1,932],[5,390],[2,932],[6,390]]){
 if(process.env.ATTACK_ID!==undefined&&id!==Number(process.env.ATTACK_ID))continue;
 if(process.env.FLIP_VIEWPORTS)width=width===390?932:390;
 await seed(id,width);const before=await read(p);await p.screenshot({path:`test-results/special-${id}-ready-${width}.png`});
 const boxes=await p.evaluate(()=>['finisherCharge','shipWheel'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,b:r.bottom};}));assert.ok(boxes[0].r<=boxes[1].l||boxes[0].b<=boxes[1].t,'charge clear of wheel');
 await p.locator('[data-action=finisher]').click();await p.waitForFunction(()=>document.querySelector('#combatField')?.dataset.specialStage==='anticipation');
 const started=await read(p);assert.equal(started.phase,'special');assert.deepEqual(health(started.enemy),health(before.enemy));assert.equal(await p.locator('[data-action=finisher]').isEnabled(),false);
 await p.waitForTimeout(1200);await p.screenshot({path:`test-results/special-${id}-anticipation.png`});
 await p.waitForFunction(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.special?.applied,{},{timeout:30000});const impacted=await read(p);assert.equal(impacted.phase,'special');assert.equal(impacted.seconds,started.seconds);assert.notDeepEqual(impacted.enemy,before.enemy);
 await p.waitForTimeout(550);await p.screenshot({path:`test-results/special-${id}-impact.png`});
 if(id===1){await p.waitForTimeout(750);await p.screenshot({path:`test-results/special-kraken-falling-rig-${width}.png`});}
 if(id===5){await p.waitForTimeout(2100);assert.equal(await p.locator('#playerShip').evaluate(n=>n.contentDocument.body.dataset.reaction),'dance');await p.screenshot({path:`test-results/special-gull-celebration-${width}.png`});}
 await p.waitForFunction(()=>!JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.special,{},{timeout:30000});const done=await read(p);assert.deepEqual(health(done.enemy),health(impacted.enemy));assert.equal(done.streak,0);assert.equal(done.charged,false);console.log('PASS attack',id,'viewport',width);
}
// Resume both sides of the saved impact boundary with reduced motion.
for(const applied of [false,true]){await seed(0,390,false);await p.evaluate(async applied=>{const M=await import('/src/model.js'),s=JSON.parse(localStorage.getItem('pirate-clashers-v1'));M.finishMove(s);if(applied)M.resolveFinishMove(s);localStorage.setItem('pirate-clashers-v1',JSON.stringify(s));},applied);const pending=await read(p);await p.reload();await p.locator('[data-action=start]').click();await p.waitForFunction(()=>!JSON.parse(localStorage.getItem('pirate-clashers-v1')).battle.special,{},{timeout:30000});const done=await read(p);assert.equal(done.enemy.crew.filter(g=>g.hp>0).length,pending.special.before.crew.filter(g=>g.hp>0).length-1);console.log('PASS reload',applied?'after impact':'before impact');}
assert.deepEqual(errors,[]);console.log('PASS all five attacks, controls, persistent impact, clock lock, reduced-motion reload.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});

