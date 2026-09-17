import test from 'node:test';
import assert from 'node:assert/strict';
import {sailTearEdge} from '../src/sail-damage.js';
const outline=[[0,0],[200,20],[190,200],[10,180]];
test('half-health tear crosses the middle and retreats upward with further damage',()=>{
 const half=sailTearEdge(outline,.5,2),quarter=sailTearEdge(outline,.25,2);
 assert.ok(half.every(([x,y])=>y>=79&&y<=121));
 assert.ok(quarter.every(([x,y],i)=>y<half[i][1]));
 assert.ok(new Set(half.map(p=>p[1])).size>20);
 assert.deepEqual(sailTearEdge(outline,.5,2),half);
});
