
module.exports=function oceanRenderer(water){
 water=water.replace('Math.min(window.devicePixelRatio || 1, 2)',"Math.min(window.devicePixelRatio || 1, matchMedia('(pointer:coarse)').matches ? 1.5 : 2)");
 const fs=require('node:fs');
 water=water.replace('<script>','<script type="module">\nimport {waterValues,WATER_DEFAULTS} from "/src/ocean-settings.js";\nimport {createSkyScenery} from "/src/sky-scenery.js";');
 water=water.replace('</head>','<link rel="stylesheet" href="/src/sky-scenery.css"></head>');
 let a=water.indexOf('id="fs-sim"'),b=water.indexOf('</script>',a),shader=water.slice(a,b);
 shader=shader.replace('uniform vec4 uHull;', 'uniform vec4 uCombatHulls[2];\nuniform float uCombatDirs[2];\nuniform vec4 uHull;');
 const ls=shader.indexOf('void hullLevels('),le=shader.indexOf('// One impact record',ls);
 shader=shader.slice(0,ls)+shader.slice(ls,le).replace('void hullLevels(', 'void hullLevels(vec4 hull, ').replace(/\buHull\b/g,'hull')+shader.slice(le);
 const hs=shader.indexOf('  if (uHull.x > 0.5)'),he=shader.indexOf('  // Implicit damping',hs);
 let block=shader.slice(hs,he).replace(/\buHull\b/g,'hull').replace('hullLevels(mid, bow, stern)','hullLevels(hull, mid, bow, stern)');
 block=block.replace('float cb = (cell.x - (hull.z + halfS + 0.7)', 'float cb = ((cell.x - hull.z)*uCombatDirs[boat] - (halfS + 0.7)')
 .replace('float tb = (cell.x - (hull.z + halfS * 0.45)', 'float tb = ((cell.x - hull.z)*uCombatDirs[boat] - (halfS * 0.45)')
 .replace('float sb = (cell.x - (hull.z - halfS - 1.0))', 'float sb = ((cell.x - hull.z)*uCombatDirs[boat] + halfS + 1.0)');
 shader=shader.slice(0,hs)+'  for(int boat=0;boat<2;boat++) { vec4 hull=uCombatHulls[boat];\n'+block+'  }\n'+shader.slice(he);
 water=water.slice(0,a)+shader+water.slice(b);
 water=water.replace('  function updateCamera() {','  function updateCamera() {\n    if(gameCamera())return;');
 water=water.replace('    const horizonNdc =','    gameRows();\n    const horizonNdc =');
 water=water.replace('    ballsDirtySim = true;\n    simDirty = false;','    gl.uniform4fv(L.uCombatHulls,gameHulls);gl.uniform1fv(L.uCombatDirs,gameDirections);\n    ballsDirtySim = true;\n    simDirty = false;');
 water=water.replace('    acc += dtF;','    applyGameImpacts();\n    acc += dtF;').replace('    render();','    render();\n    sampleGameContacts(now);');
 const end=water.lastIndexOf('  resize();');
 water=water.slice(0,end)+fs.readFileSync(require('node:path').join(__dirname,'ocean-adapter.txt'),'utf8')+'\n  Object.assign(P,WATER_DEFAULTS,{hullOn:false});\n'+water.slice(end);
 return water;
};
