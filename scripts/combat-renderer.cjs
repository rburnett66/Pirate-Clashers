
module.exports=function combatRenderer(hull){
 hull=hull.replace('const COMMON_GLSL =','let gamePartCount=0;const gamePartHP=new Float32Array(8).fill(1);\n  const COMMON_GLSL =');
 const uniforms='uniform float uGamePartHP[8];\nuniform int uGamePartCount;\nfloat gameHP(vec2 p){if(uGamePartCount==0)return 1.0;int i=clamp(int(floor((p.x+1.08)/2.44*float(uGamePartCount))),0,uGamePartCount-1);return uGamePartHP[i];}\n';
 for(const id of ['fs-hull','fs-inner']){
  const start=hull.indexOf('id="'+id+'"'),end=hull.indexOf('</script>',start);let shader=hull.slice(start,end);
  shader=shader.replace('void main() {',uniforms+'void main() {');
  shader=shader.replace('vec2 p = vShip;','vec2 p = vShip;\n  if(gameHP(p)<=0.0)discard;');
  if(id==='fs-inner')shader=shader.replace('if (st.w >= 0.0 && uCrew[i].z < 0.5)','if (false)');
  else{
   shader=shader.replace('float gone = smoothstep(0.62, 0.72, dRel);','float gone = min(0.25, smoothstep(0.62, 0.72, dRel));\n  col *= mix(0.45,1.0,gameHP(p));');
   const foam="\n  // Climbing foam / wet wood adapted from the supplied ocean prototype.\n  float x=p.x, ax=abs(x);\n  float waterY=-0.29+0.025*sin(x*8.0+uTime*1.4);\n  float dy=(p.y-waterY)/uUnit;\n  float foamHere=0.3+0.2*sin(x*12.0-uTime*1.7);\n  float climb=smoothstep(0.35,1.0,ax)*(x>0.0?1.4:0.6);\n  float torn=0.65+0.7*fbm(vec2(x*17.0,uTime*1.4));\n  float foamH=(3.0+(5.0+16.0*foamHere)*(0.6+1.6*climb))*torn*0.36;\n  float band=clamp(foamH-dy+0.5,0.0,1.0)*clamp(dy+1.5,0.0,1.0);\n  float foamA=band*smoothstep(-aa,aa,inside);\n  vec3 foamCol=mix(vec3(0.87,0.97,0.95),vec3(0.40,0.70,0.73),clamp(1.0-dy/max(foamH,1.0),0.0,1.0)*0.45);\n  float bubble=step(0.76,fbm(vec2(x*180.0,dy*2.0+uTime)));\n  foamCol=mix(foamCol,vec3(0.32,0.63,0.67),bubble*0.7);\n  float wet=clamp(foamH+3.0-dy,0.0,1.0)*step(0.0,dy);\n  col=mix(col,col*0.72,wet*0.8);\n  col=mix(col,foamCol,foamA);\n  col=mix(col,vec3(0.07,0.37,0.43),smoothstep(0.0,0.12,waterY-p.y)*0.65);\n";
   shader=shader.replace('outColor = vec4(col * a, a);',()=>foam+'\n  outColor = vec4(col * a, a);');
  }
  hull=hull.slice(0,start)+shader+hull.slice(end);
 }
 hull=hull.replaceAll('setCam(L, QUAD_HULL);','setCam(L, QUAD_HULL);\n      if(L.uGamePartCount){gl.uniform1i(L.uGamePartCount,gamePartCount);gl.uniform1fv(L.uGamePartHP,gamePartHP);}');
 hull=hull.replace(/    \{\s+const L = crewProg\.loc;[\s\S]*?gl\.drawArrays\(gl\.TRIANGLES, 0, 6\);\s+\}/,'    // Crew use supplied sprites through the combat adapter.');
 hull=hull.replace('applyRigDamage(pts, a);','// Rig health comes from game model.').replace('applyCrewDamage(pts);','// Crew health comes from game model.');
 hull=hull.replace(':not(#pirateMark)',':not(#pirateMark):not(#gameCrew)');
 return hull.replace(/[ \t]+$/gm,'');
};
