
module.exports=function combatRenderer(hull){
 const at=hull.lastIndexOf('<script>');if(at<0)throw Error('Missing prototype script');
 hull=hull.slice(0,at)+'<script type="module">\nimport {HULL_MASK,maskPixels} from "/src/hull-mask.js";\nimport {stationPosition,SHIP_LADDER} from "/src/ballistics.js";\nimport {stationAnchors} from "/src/ship-config.js";\nimport {gunnerImage} from "/src/gunner-art.js";\nimport {ShipArtRenderer} from "/src/ship-art-renderer.js";'+hull.slice(at+8);
 hull=hull.replace('const COMMON_GLSL =',"\nconst gameSurface=new Float32Array(32).fill(-.29),gameFoam=new Float32Array(32).fill(.3);\nlet gameFoamLook=1;\nlet lastMaterialBits=null;\nconst gameMaterialTexture=gl.createTexture();\nfunction uploadMaterial(f){\n const pixels=maskPixels(f);if(lastMaterialBits===f.hullMask.bits)return;\n gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,gameMaterialTexture);\n gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);\n gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);\n gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,HULL_MASK.width,HULL_MASK.height,0,gl.RED,gl.UNSIGNED_BYTE,pixels);\n lastMaterialBits=f.hullMask.bits;gl.activeTexture(gl.TEXTURE0);\n}\nuploadMaterial({});\n"+'\nconst COMMON_GLSL =');
 const uniforms="\nuniform float uFoamLook;\nuniform float uOceanSurface[32];\nuniform float uOceanFoam[32];\nfloat oceanAt(float x,bool foam){float q=clamp((x+1.35)/2.7*31.0,0.0,31.0);int a=int(floor(q)),b=min(31,a+1);return foam?mix(uOceanFoam[a],uOceanFoam[b],fract(q)):mix(uOceanSurface[a],uOceanSurface[b],fract(q));}\nuniform sampler2D uMaterial;\nuniform vec4 uMaterialBounds;\nfloat materialAt(vec2 p){\n ivec2 size=textureSize(uMaterial,0);\n ivec2 cell=ivec2(floor((p-uMaterialBounds.xy)/uMaterialBounds.zw*vec2(size)));\n if(any(lessThan(cell,ivec2(0)))||any(greaterThanEqual(cell,size)))return 0.0;\n return texelFetch(uMaterial,cell,0).r;\n}\n";
 for(const id of ['fs-hull','fs-inner']){
  const start=hull.indexOf('id="'+id+'"'),end=hull.indexOf('</script>',start);let shader=hull.slice(start,end);
  shader=shader.replace('void main() {',uniforms+'void main() {');
  shader=shader.replace('vec2 p = vShip;','vec2 p = vShip;\n  if(materialAt(p)<0.5)discard;');
  if(id==='fs-inner')shader=shader.replace('if (st.w >= 0.0 && uCrew[i].z < 0.5)','if (false)');
  else{
   // GPU scatter remains a cosmetic char/splinter effect. Only the shared bitmap removes wood.
   shader=shader.replace('float gone = smoothstep(0.62, 0.72, dRel);','float gone = 0.0;');
   const foam="\n  // Climbing foam / wet wood adapted from the supplied ocean prototype.\n  float x=p.x, ax=abs(x);\n  float waterY=oceanAt(x,false);\n  float dy=(p.y-waterY)/uUnit;\n  float foamHere=max(0.18,oceanAt(x,true));\n  float climb=smoothstep(0.35,1.0,ax)*(x>0.0?1.4:0.6);\n  float torn=0.65+0.7*fbm(vec2(x*17.0,uTime*1.4));\n  float foamH=uFoamLook*max(2.5,(3.0+(5.0+16.0*foamHere)*(0.6+1.6*climb))*torn*0.55);\n  float band=clamp(foamH-dy+0.5,0.0,1.0)*clamp(dy+1.5,0.0,1.0);\n  float foamA=band*min(1.0,uFoamLook*10.0)*smoothstep(-aa,aa,inside);\n  vec3 foamCol=mix(vec3(0.87,0.97,0.95),vec3(0.40,0.70,0.73),clamp(1.0-dy/max(foamH,1.0),0.0,1.0)*0.45);\n  float bubble=step(0.76,fbm(vec2(x*180.0,dy*2.0+uTime)));\n  foamCol=mix(foamCol,vec3(0.32,0.63,0.67),bubble*0.7);\n  float wet=clamp(foamH+3.0-dy,0.0,1.0)*step(0.0,dy);\n  col=mix(col,col*0.72,wet*0.8);\n  col=mix(col,foamCol,foamA);\n  col=mix(col,vec3(0.07,0.37,0.43),smoothstep(0.0,0.12,waterY-p.y)*0.65);\n";
   shader=shader.replace('outColor = vec4(col * a, a);',()=>foam+'\n  outColor = vec4(col * a, a);');
  }
  hull=hull.slice(0,start)+shader+hull.slice(end);
 }
 hull=hull.replaceAll('setCam(L, QUAD_HULL);','setCam(L, QUAD_HULL);\n      if(L.uOceanSurface){gl.uniform1fv(L.uOceanSurface,gameSurface);gl.uniform1fv(L.uOceanFoam,gameFoam);if(L.uFoamLook)gl.uniform1f(L.uFoamLook,gameFoamLook);}if(L.uMaterial){gl.uniform1i(L.uMaterial,2);gl.uniform4f(L.uMaterialBounds,HULL_MASK.left,HULL_MASK.bottom,HULL_MASK.spanX,HULL_MASK.spanY);}');
 hull=hull.replace(/    \{\s+const L = crewProg\.loc;[\s\S]*?gl\.drawArrays\(gl\.TRIANGLES, 0, 6\);\s+\}/,'    // Supplied crew sprites have their own health; port crew render behind the masked hull.');
 hull=hull.replace('applyRigDamage(pts, a);','// Rig health comes from game model.').replace('applyCrewDamage(pts);','// Crew health comes from game model.');
 hull=hull.replace('if (showInner) {','if (showInner && !gameCutaway) {').replace('{\n      const L = hullProg.loc;','if (!gameCutaway) {\n      const L = hullProg.loc;');
 hull=hull.replace('if (showInner && !gameCutaway) {','if (!artRenderer.ready && showInner && !gameCutaway) {').replace('if (!gameCutaway) {','if (!artRenderer.ready && !gameCutaway) {');
 hull=hull.replaceAll('if (showRig) drawRig(', 'if (!artRenderer.ready && showRig) drawRig(');
 hull=hull.replace('    resize();\n    gl.bindFramebuffer', '    resize();\n    artRenderer.paint(cam,canvas,now,gameSurface,gameFoam);\n    gl.bindFramebuffer');
 hull=hull.replace('cam.ppu = Math.min(canvas.width / 3.5, canvas.height / 3.3);',"cam.ppu = document.body.dataset.preview==='true'?Math.min(canvas.width/3.1,canvas.height/(document.body.dataset.previewClose==='true'?1.45:2.3)):Math.min(canvas.width/3.5,canvas.height/3.3);").replace('cam.y = .85;',"cam.y = document.body.dataset.preview==='true'?(document.body.dataset.previewClose==='true'?-.06:.39):.85;");
 hull=hull.replace('float r = uDebrisSize *','float r = 2.0 * uDebrisSize *');
 hull=hull.replace(':not(#pirateMark)',':not(#pirateMark):not(#gameCrew):not(#gamePorts)');
 return hull.replace(/[ \t]+$/gm,'');
};
