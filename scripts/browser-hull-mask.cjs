
const {chromium}=require('@playwright/test'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:800,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  // The isolated renderer has no document favicon; supply one only for this harness.
  await page.route('**/favicon.ico',r=>r.fulfill({status:204}));
  await page.goto('http://127.0.0.1:4173/public/ship.html?side=enemy');await page.waitForTimeout(500);
  const configure=async damaged=>page.evaluate(async damaged=>{
   const M=await import('/src/model.js'),H=await import('/src/hull-mask.js');
   const s=M.fresh(),b=M.startBattle(s);if(damaged){H.chipHull(b.enemy,-.4,-.25,16);H.chipHull(b.enemy,-.07,-.3,12);}
   window.fixture=b.enemy;window.hullAPI=H;
   window.postMessage({type:'pirate-render',action:'configure',level:3,parts:b.enemy,crew:b.enemy.crew.map(g=>({...g,name:M.PIRATES.find(p=>p.id===g.id).name}))},location.origin);
  },damaged);
  const read=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{
   const H=window.hullAPI,c=document.querySelector('#ship'),gl=c.getContext('webgl2'),ppu=Math.min(c.width/3.5,c.height/3.3),points=[[-.4,-.25],[-.4,-.1],[-.07,-.3]];
   const alphas=points.map(([x,y])=>{const art=document.querySelector('#gameHullArt');return Array.from(art.getContext('2d').getImageData(Math.floor(c.width/2+x*ppu),Math.floor(c.height/2-(y-.85)*ppu),1,1).data);});
   const interior=document.querySelector('#gameInterior'),ctx=interior.getContext('2d');
   const insidePixels=points.map(([x,y])=>Array.from(ctx.getImageData(Math.floor(c.width/2+x*ppu),Math.floor(c.height/2-(y-.85)*ppu),1,1).data));
   const outsideAlpha=ctx.getImageData(0,0,1,1).data[3];
   const layers=['#gameInterior','#gamePorts','#gameHullArt'].map(id=>Number(getComputedStyle(document.querySelector(id)).zIndex));
   const active=gl.getParameter(gl.ACTIVE_TEXTURE),old=gl.getParameter(gl.FRAMEBUFFER_BINDING);gl.activeTexture(gl.TEXTURE2);
   const texture=gl.getParameter(gl.TEXTURE_BINDING_2D),fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
   const status=gl.checkFramebufferStatus(gl.FRAMEBUFFER),pixels=new Uint8Array(H.HULL_MASK.width*H.HULL_MASK.height*4);
   gl.readPixels(0,0,H.HULL_MASK.width,H.HULL_MASK.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   const cpu=H.maskPixels(window.fixture);let mismatches=0;for(let i=0;i<cpu.length;i++)if(pixels[i*4]!==cpu[i])mismatches++;
   const error=gl.getError();gl.bindFramebuffer(gl.FRAMEBUFFER,old);gl.deleteFramebuffer(fbo);gl.activeTexture(active);
   resolve({alphas,insidePixels,outsideAlpha,layers,status,complete:gl.FRAMEBUFFER_COMPLETE,mismatches,error,portraits:document.querySelectorAll('#gamePorts img').length});
  })));
  await configure(false);await page.waitForFunction(()=>document.body.dataset.shipArt==='ready');await page.waitForTimeout(250);const intact=await read();console.log('intact',intact);
  await configure(true);await page.waitForTimeout(250);const chipped=await read();console.log('chipped',chipped);
  assert.ok(chipped.insidePixels.every(p=>p[3]===255));assert.equal(chipped.outsideAlpha,0);
  assert.ok(chipped.layers[0]<chipped.layers[1]&&chipped.layers[1]<chipped.layers[2]);
  assert.equal(intact.error,0);assert.equal(chipped.error,0);assert.equal(chipped.status,chipped.complete);
  assert.equal(intact.mismatches,0);assert.equal(chipped.mismatches,0);
  assert.ok(intact.alphas[0][3]>200);assert.equal(chipped.alphas[0][3],0);
  assert.ok(chipped.alphas[1][3]>200);assert.equal(chipped.alphas[2][3],0);assert.equal(chipped.portraits,1);
  const sizes=await page.locator('#gameCrew img, #gamePorts img').evaluateAll(imgs=>imgs.map(i=>({width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height})));
  assert.equal(sizes.length,3);assert.ok(sizes.every(s=>Math.abs(s.width-sizes[0].width)<.1&&Math.abs(s.height-sizes[0].height)<.1));
  await page.screenshot({path:'test-results/hull-pixel-mask.png'});
  assert.deepEqual(errors,[]);
  const report={passed:true,intact,chipped,errors,checks:['all 163840 GPU mask texels equal saved collision mask','supplied exterior art is transparent inside the collision breach','nearby surviving wood remains opaque','port crew in independent layer behind wood','above and below deck crew have equal sprite dimensions','interior image remains opaque behind open breaches and crew','interior is clipped outside ship silhouette']};
  fs.writeFileSync('test-results/hull-mask-report.json',JSON.stringify(report,null,2));console.log('Hull mask browser checks passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
