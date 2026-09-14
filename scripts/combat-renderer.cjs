
module.exports=function combatRenderer(hull){
 const at=hull.lastIndexOf('<script>');if(at<0)throw Error('Missing prototype script');
 hull=hull.slice(0,at)+'<script type="module">\nimport {HULL_MASK,maskPixels} from "/src/hull-mask.js";\nimport {stationPosition} from "/src/ballistics.js";\nimport {paintShipInterior} from "/src/ship-interior.js";'+hull.slice(at+8);
 hull=hull.replace('const COMMON_GLSL =',"\nlet lastMaterialBits=null;\nconst gameMaterialTexture=gl.createTexture();\nfunction uploadMaterial(f){\n const pixels=maskPixels(f);if(lastMaterialBits===f.hullMask.bits)return;\n gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,gameMaterialTexture);\n gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);\n gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);\n gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,HULL_MASK.width,HULL_MASK.height,0,gl.RED,gl.UNSIGNED_BYTE,pixels);\n lastMaterialBits=f.hullMask.bits;gl.activeTexture(gl.TEXTURE0);\n}\nuploadMaterial({});\n"+'\nconst COMMON_GLSL =');
 const uniforms="\nuniform sampler2D uMaterial;\nuniform vec4 uMaterialBounds;\nfloat materialAt(vec2 p){\n ivec2 size=textureSize(uMaterial,0);\n ivec2 cell=ivec2(floor((p-uMaterialBounds.xy)/uMaterialBounds.zw*vec2(size)));\n if(any(lessThan(cell,ivec2(0)))||any(greaterThanEqual(cell,size)))return 0.0;\n return texelFetch(uMaterial,cell,0).r;\n}\n";
 for(const id of ['fs-hull','fs-inner']){
  const start=hull.indexOf('id="'+id+'"'),end=hull.indexOf('</script>',start);let shader=hull.slice(start,end);
  shader=shader.replace('void main() {',uniforms+'void main() {');
  shader=shader.replace('vec2 p = vShip;','vec2 p = vShip;\n  if(materialAt(p)<0.5)discard;');
  if(id==='fs-inner')shader=shader.replace('if (st.w >= 0.0 && uCrew[i].z < 0.5)','if (false)');
  else{
   // GPU scatter remains a cosmetic char/splinter effect. Only the shared bitmap removes wood.
   shader=shader.replace('float gone = smoothstep(0.62, 0.72, dRel);','float gone = 0.0;');
   const foam="\n  // Climbing foam / wet wood adapted from the supplied ocean prototype.\n  float x=p.x, ax=abs(x);\n  float waterY=-0.29+0.025*sin(x*8.0+uTime*1.4);\n  float dy=(p.y-waterY)/uUnit;\n  float foamHere=0.3+0.2*sin(x*12.0-uTime*1.7);\n  float climb=smoothstep(0.35,1.0,ax)*(x>0.0?1.4:0.6);\n  float torn=0.65+0.7*fbm(vec2(x*17.0,uTime*1.4));\n  float foamH=(3.0+(5.0+16.0*foamHere)*(0.6+1.6*climb))*torn*0.36;\n  float band=clamp(foamH-dy+0.5,0.0,1.0)*clamp(dy+1.5,0.0,1.0);\n  float foamA=band*smoothstep(-aa,aa,inside);\n  vec3 foamCol=mix(vec3(0.87,0.97,0.95),vec3(0.40,0.70,0.73),clamp(1.0-dy/max(foamH,1.0),0.0,1.0)*0.45);\n  float bubble=step(0.76,fbm(vec2(x*180.0,dy*2.0+uTime)));\n  foamCol=mix(foamCol,vec3(0.32,0.63,0.67),bubble*0.7);\n  float wet=clamp(foamH+3.0-dy,0.0,1.0)*step(0.0,dy);\n  col=mix(col,col*0.72,wet*0.8);\n  col=mix(col,foamCol,foamA);\n  col=mix(col,vec3(0.07,0.37,0.43),smoothstep(0.0,0.12,waterY-p.y)*0.65);\n";
   shader=shader.replace('outColor = vec4(col * a, a);',()=>foam+'\n  outColor = vec4(col * a, a);');
  }
  hull=hull.slice(0,start)+shader+hull.slice(end);
 }
 hull=hull.replaceAll('setCam(L, QUAD_HULL);','setCam(L, QUAD_HULL);\n      if(L.uMaterial){gl.uniform1i(L.uMaterial,2);gl.uniform4f(L.uMaterialBounds,HULL_MASK.left,HULL_MASK.bottom,HULL_MASK.spanX,HULL_MASK.spanY);}');
 hull=hull.replace(/    \{\s+const L = crewProg\.loc;[\s\S]*?gl\.drawArrays\(gl\.TRIANGLES, 0, 6\);\s+\}/,'    // Supplied crew sprites have their own health; port crew render behind the masked hull.');
 hull=hull.replace('applyRigDamage(pts, a);','// Rig health comes from game model.').replace('applyCrewDamage(pts);','// Crew health comes from game model.');
 hull=hull.replace(':not(#pirateMark)',':not(#pirateMark):not(#gameCrew):not(#gamePorts)');
 return hull.replace(/[ \t]+$/gm,'');
};
