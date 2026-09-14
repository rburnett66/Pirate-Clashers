const {chromium}=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto('http://127.0.0.1:4173');await page.waitForTimeout(1200);
if(await page.locator('[data-action=onboard]').isVisible())await page.locator('[data-action=onboard]').click();
const results={home:await page.locator('main').innerText().catch(()=>page.locator('body').innerText()),errors};
fs.mkdirSync('test-results',{recursive:true});
await page.screenshot({path:'test-results/home.png'});
for(const id of ['crew','ports','booty','store']){
await page.locator('#rail [data-action=nav][data-id='+id+']').click();
results[id]={text:(await page.locator('body').innerText()).slice(0,250),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
}
await page.locator('#rail [data-action=nav][data-id=battle]').click();
await page.locator('[data-action=start]').click();await page.waitForTimeout(1800);
await page.screenshot({path:'test-results/battle.png'});
results.frames=page.frames().map(f=>f.url());
for(let i=0;i<2;i++){await page.locator('[data-action=fire]').click();await page.waitForTimeout(1800)}
results.battle=await page.locator('body').innerText();
await page.locator('[data-action=retreat]').click();await page.locator('[data-action=confirm-retreat]').click();
results.result=await page.locator('#sheet').innerText();
await page.locator('[data-action=return]').click();await page.reload();await page.waitForTimeout(500);
results.persistence=await page.evaluate(()=>JSON.parse(localStorage.getItem('pirate-clashers-v1')));
await page.setViewportSize({width:960,height:540});
await page.screenshot({path:'test-results/landscape.png'});
results.landscapeOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
fs.writeFileSync('test-results/browser-report.json',JSON.stringify(results,null,2));
console.log(JSON.stringify({errors,frames:results.frames,battle:results.battle,result:results.result,landscapeOverflow:results.landscapeOverflow}));
await browser.close();if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});