import test from 'node:test';
import assert from 'node:assert/strict';
import {WATER_DEFAULTS,waterValues,parseWater,exportWater,waterLibrary,activeWater} from '../src/ocean-settings.js';
import {PROTOTYPE_DEFAULTS} from '../src/ocean-catalog.js';
import {fresh,restore} from '../src/model.js';
test('every prototype water value survives named JSON export and import',()=>{
 assert.deepEqual(waterValues(PROTOTYPE_DEFAULTS),PROTOTYPE_DEFAULTS);
 const values={...WATER_DEFAULTS,swellAmp:1.12,rock:0,splashSize:.8};
 assert.deepEqual(parseWater(exportWater('Open sea',values)),{name:'Open sea',values});
 assert.equal(parseWater('{"noise":0.2}').values.noise,.2);
});
test('invalid imported settings cannot become saved looks',()=>{
 for(const raw of ['null','[]','{}','{"noise":"0.2"}','{"speed":999}','{"__proto__":{}}','{"octaves":2.5}','{"crestLo":0.8,"crestHi":0.2}','{"horizon":-0.2,"front":-0.2}','alert(1)','{"format":"other","version":1}'])assert.throws(()=>parseWater(raw),raw);
 assert.throws(()=>waterValues({noise:NaN}));
 assert.throws(()=>parseWater(' '.repeat(30001)));
});
test('old captain backups migrate and named water libraries persist',()=>{
 const s=fresh(),legacy=restore(JSON.stringify(s));assert.equal(activeWater(legacy.settings.water).id,'default');
 s.settings.water={selected:'look-test',presets:[{id:'look-test',name:'Rolling blue',values:{...WATER_DEFAULTS,rock:1.1}}]};
 const next=restore(JSON.stringify(s));assert.deepEqual(next.settings.water,s.settings.water);assert.equal(activeWater(next.settings.water).values.rock,1.1);
 next.settings.water.selected='missing';assert.throws(()=>restore(JSON.stringify(next)));
 assert.throws(()=>waterLibrary({selected:'default',presets:Array(25).fill(s.settings.water.presets[0])}));
});
