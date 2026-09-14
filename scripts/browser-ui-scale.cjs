const {chromium}=require('@playwright/test'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 fs.mkdirSync('test-results/ui-scale',{recursive:true});
 await page.goto('http://127.0.0.1:4173');
 await page.evaluate(async()=>{const M=await import('/src/model.js'),s=M.fresh();s.onboarded=true;localStorage.setItem('pirate-clashers-v1',JSON.stringify(s));});await page.reload();
 const selectors=['#rail','#topbar','.screen-heading','.harbor-scene','.crew-overview','.orders-card','.hold-panel','.nav-art','.screen-title-art','.wallet-plaque'];
 let baseline;
 for(const [width,height] of [[1792,1008],[1920,1080],[2560,1440],[3840,2160],[1280,720],[2560,1080],[1600,1200]]){
  await page.setViewportSize({width,height});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  const measurements=await page.evaluate(selectors=>{
   const scale=Number(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale')),app=document.querySelector('#app').getBoundingClientRect();
   const rectangles=Object.fromEntries(selectors.map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,{x:(r.x-app.x)/scale,y:(r.y-app.y)/scale,w:r.width/scale,h:r.height/scale}];}));
   const main=document.querySelector('#main');return{scale,app:{x:app.x,y:app.y,w:app.width,h:app.height},rectangles,overflow:main.scrollHeight>main.clientHeight+1||main.scrollWidth>main.clientWidth+1};
  },selectors);
  assert.ok(!measurements.overflow,`Menu overflows at ${width}×${height}`);
  assert.ok(Math.abs(measurements.app.w/measurements.app.h-16/9)<.001,'Stage aspect ratio');
  assert.ok(Math.abs(measurements.app.x-(width-measurements.app.w)/2)<1,'Stage horizontally centered');
  assert.ok(Math.abs(measurements.app.y-(height-measurements.app.h)/2)<1,'Stage vertically centered');
  if(!baseline)baseline=measurements.rectangles;
  for(const selector of selectors)for(const axis of ['x','y','w','h'])assert.ok(Math.abs(measurements.rectangles[selector][axis]-baseline[selector][axis])<1,`${selector} ${axis} changes logical size at ${width}×${height}: ${measurements.rectangles[selector][axis]} vs ${baseline[selector][axis]}`);
  assert.ok(Math.abs(measurements.rectangles['#rail'].w-244)<1,'Mockup rail width');
  assert.ok(Math.abs(measurements.rectangles['.harbor-scene'].x-264)<1,'Mockup central panel x');
  assert.ok(Math.abs(measurements.rectangles['.crew-overview'].x-1288)<1,'Mockup right panel x');
  assert.ok(Math.abs(measurements.rectangles['.wallet-plaque'].w/measurements.rectangles['.wallet-plaque'].h-1758/464)<.001,'Header preserves original art ratio');
  await page.screenshot({path:`test-results/ui-scale/menu-${width}x${height}.png`});
 }
 await page.setViewportSize({width:2560,height:1440});
 for(const id of ['crew','ports','booty','store','settings']){
  await page.locator(`#rail [data-id="${id}"]`).click();
  assert.ok(await page.evaluate(()=>document.querySelector('#main').scrollWidth<=document.querySelector('#main').clientWidth+1),id+' has horizontal overflow');
  await page.screenshot({path:`test-results/ui-scale/${id}-2560.png`});
 }
 await page.locator('#rail [data-id=battle]').click();await page.locator('.wallet-add').click();assert.equal(await page.locator('body').getAttribute('data-page'),'store');
 assert.deepEqual(errors,[]);console.log('Uniform reference geometry verified at 720p, native mockup size, 1080p, 1440p, 4K, ultrawide and 4:3. Other main screens fit at 1440p.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
