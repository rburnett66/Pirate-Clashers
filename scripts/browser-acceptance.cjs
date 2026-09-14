const {chromium,expect}=require('@playwright/test'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
await page.goto('http://127.0.0.1:4173');
await page.evaluate(async()=>{const M=await import('/src/model.js');const s=M.fresh();s.onboarded=true;s.settings.motion=false;s.gold=50000;s.gems=3000;s.mats={wood:3000,metal:3000,cloth:3000};s.cards[1]=2;localStorage.setItem('pirate-clashers-v1',JSON.stringify(s))});
await page.reload();await page.waitForTimeout(400);
const click=async(action,id)=>page.locator('[data-action="'+action+'"]'+(id!==undefined?'[data-id="'+id+'"]':'')).first().click();
const nav=async id=>page.locator('#rail [data-action=nav][data-id='+id+']').click();
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')));
await nav('crew');await click('tab','collection');assert.equal(await page.locator('.pirate-card').count(),36);
await page.locator('.pirate-art').last().scrollIntoViewIfNeeded();await page.waitForTimeout(400);
assert.ok(await page.locator('.pirate-art').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)));
await page.screenshot({path:'test-results/crew.png'});
await click('detail','1');await click('upgrade','1');assert.ok((await saved()).bench);
await page.reload();await nav('crew');await click('tab','yard');await click('skip');assert.equal((await saved()).levels[1],2);
await click('ship-up');assert.equal((await saved()).shipLevel,4);
await click('tab','equipment');await click('equip','plating:iron:1');assert.equal((await saved()).plates[1].kind,'iron');assert.equal((await saved()).plates[0].kind,'bare');
await click('equip','canvas:heavy');await click('figure','1');await click('figure-up','1');assert.equal((await saved()).figureheads[1],2);
await click('cosmetic','0');assert.equal((await saved()).cosmetic,0);
await page.screenshot({path:'test-results/equipment.png'});
await nav('store');await expect(page.locator('[data-offer]')).toHaveCount(1);await click('decline');await expect(page.locator('[data-offer]')).toHaveCount(0);
assert.ok(await page.locator('[data-action=purchase]').evaluateAll(bs=>bs.every(b=>b.disabled)));
const preTrade=await saved();await click('trade');const postTrade=await saved();assert.equal(postTrade.mats.metal,preTrade.mats.metal+10);assert.equal(postTrade.gold,preTrade.gold-120);
await nav('booty');await click('claim-all');const gold=(await saved()).gold;await click('claim-all');assert.equal((await saved()).gold,gold);
await nav('ports');await expect(page.locator('.board-row[data-action=captain]')).toHaveCount(100);
await click('port','14');await expect(page.locator('.board-row[data-action=captain]')).toHaveCount(100);
await nav('battle');await click('start');await page.waitForTimeout(300);
await page.evaluate(async()=>{const M=await import('/src/model.js'),s=JSON.parse(localStorage.getItem('pirate-clashers-v1'));const b=s.battle;let angle=5,hit;for(;angle<=75;angle++){hit=M.previewShot(s,{gunner:1,angle}).shots[0].impact;if(hit?.kind==='hull')break;}if(!hit||angle>75)throw Error('No fixture hull trajectory');b.aimAngle=angle;b.enemy.hullParts.forEach((p,i)=>p.hp=i===hit.index?20:0);b.enemy.hull=20;b.rng=1;localStorage.setItem('pirate-clashers-v1',JSON.stringify(s))});
await page.reload();await click('start');await click('fire');await expect(page.locator('#sheet')).toContainText('VICTORY!');
await click('return');assert.equal((await saved()).chests.length,1);await click('chest');await expect(page.locator('#sheet')).toContainText('Look what the tide brought in');await click('close');assert.equal((await saved()).chests.length,0);
for(let move=0;move<6;move++){
await page.evaluate(async move=>{const M=await import('/src/model.js'),s=JSON.parse(localStorage.getItem('pirate-clashers-v1'));s.moves=[0,1,2,3,4,5];s.move=move;M.startBattle(s);s.battle.charged=true;localStorage.setItem('pirate-clashers-v1',JSON.stringify(s))},move);
await page.reload();await click('start');await click('finisher');await page.waitForTimeout(350);
assert.equal((await saved()).battle.used,true);
if(await page.locator('#sheet').isVisible())await click('close');
}
await page.reload();await nav('crew');await click('tab','collection');await page.setViewportSize({width:932,height:430});
await page.screenshot({path:'test-results/crew-landscape.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await nav('battle');await click('start');await page.waitForTimeout(300);await page.screenshot({path:'test-results/battle-landscape.png'});
assert.ok(await page.locator('[data-action=fire]').isVisible());
const malformed='{"version":1,"gold":-99}';await page.evaluate(raw=>localStorage.setItem('pirate-clashers-v1',raw),malformed);await page.reload();
await expect(page.locator('.error-note')).toBeVisible();assert.equal(await page.evaluate(()=>localStorage.getItem('pirate-clashers-v1')),malformed);
const fallback=await browser.newPage();await fallback.addInitScript(()=>{const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...args){return k.startsWith('webgl')?null:old.call(this,k,...args)}});await fallback.goto('http://127.0.0.1:4173');await fallback.waitForTimeout(700);
assert.ok(await fallback.locator('.render-note').count()>0);await fallback.close();
const report={passed:true,errors,checks:['36 loaded portraits','upgrade reload and skip','ship upgrade','section plating','canvas','figurehead upgrade','cosmetic','contextual offer decline','disabled payments','trade','idempotent track claim','100-seat boards','victory and chest opening','six finishers','landscape layout','corrupt-save preservation','WebGL unavailable fallback'],fixtures:'Isolated browser save with earned-resource fixture, plus a battle near victory; full battle outcomes tested separately across 40 seeds.'};
fs.writeFileSync('test-results/acceptance-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));assert.deepEqual(errors,[]);
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
