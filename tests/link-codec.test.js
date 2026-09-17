import {packShipChallenge,unpackShipChallenge} from '../src/challenge-wire.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeLinkPayload,decodeLinkPayload} from '../src/link-codec.js';
import * as M from '../src/model.js';
import {challengeSnapshot,challengeURL,readChallenge,resultsURL,readChallengeResult} from '../src/challenges.js';
const base='https://rburnett66.github.io/pirate-bash/';
const oldToken=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const packed=c=>[2,c.seed,c.id??null,Object.entries(c.ship).map(([k,v])=>k==='levels'?M.PIRATES.map(p=>v[p.id]):v)];
test('binary codec preserves Unicode, exact numeric values, absent values and nested data',()=>{
 let seed=124;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 for(let i=0;i<200;i++){
  const v=[null,undefined,true,false,'\ud800','\udc00',-0,Number.MAX_SAFE_INTEGER,-Number.MAX_SAFE_INTEGER,random()/37,'Capitán 🏴‍☠️ 海賊',i%2?'a'.repeat(32):'f'.repeat(32),{d0:random()%36,plates:[0.01,100,99.875],nested:{value:'repeat '.repeat(i%30)}}];
  assert.deepEqual(decodeLinkPayload(encodeLinkPayload(v)),v);
 }
});
test('binary links reject truncation, corrupt bytes, trailing data and unbounded expansion',()=>{
 const token=encodeLinkPayload(['repeat '.repeat(100),{name:'Captain'}]);
 for(let n=3;n<token.length;n++)assert.throws(()=>decodeLinkPayload(token.slice(0,n)));
 const bytes=Buffer.from(token.slice(3),'base64url');
 for(let i=0;i<bytes.length;i++){const bad=Buffer.from(bytes);bad[i]^=128;assert.throws(()=>decodeLinkPayload('b3_'+bad.toString('base64url')));}
 assert.throws(()=>decodeLinkPayload(token+'AAAA'));
 const huge=Buffer.from(bytes);huge.writeUInt16BE(65535,1);assert.throws(()=>decodeLinkPayload('b3_'+huge.toString('base64url')));
 assert.throws(()=>encodeLinkPayload('x'.repeat(20000)));
 let deep=0;for(let i=0;i<40;i++)deep=[deep];assert.throws(()=>encodeLinkPayload(deep));
});
test('all ship tiers retain every field and support both old compact and new links',()=>{
 for(let level=1;level<=6;level++){
  const s=M.fresh();s.name='Capitán ⚓';s.shipLevel=level;s.sailLevel=5;s.levels=Object.fromEntries(M.PIRATES.map(p=>[p.id,p.id%12+1]));s.slots=Object.fromEntries(M.positions(s).map((slot,i)=>[slot,i+1]));s.durability=71.375;s.canvasDurability=86.125;
  const c=challengeSnapshot(s,2147483647),legacy=base+'?challenge='+oldToken(packed(c)),url=challengeURL(s,base,c.seed);
  assert.deepEqual(readChallenge(legacy),c);assert.deepEqual(readChallenge(url),c);
  assert.ok(new URL(url).searchParams.get('challenge').startsWith('b3_'));
  assert.ok(url.length<legacy.length*.8,`level ${level}: ${url.length}/${legacy.length}`);
 }
 const r={v:1,id:'7fb5439281a74c9b90b6ed3e1f26347a',friend:'Amígo 🏴',won:true,turns:25};
 assert.deepEqual(readChallengeResult(base+'?challenge-result='+oldToken([2,r.id,r.friend,1,r.turns])),r);
 assert.deepEqual(readChallengeResult(resultsURL(r,base)),r);
});

test('bit-packed crew and inventory fields preserve ordering, boundaries and exact defaults',()=>{
 for(let n=0;n<36;n++){
  const c=challengeSnapshot(M.fresh(),n),s=c.ship;
  s.name='Captain '+n;s.levels=Object.fromEntries(Array.from({length:36},(_,i)=>[i+1,(i+n)%13]));
  s.slots={h7:36,d0:1,d7:18,h0:2};s.flags=[33,7,2,1];s.cosmetics=[5,0,3];s.moves=[6,0,2];
  s.plates=s.plates.map((p,i)=>({kind:i%2?'iron':'bare',durability:99.125-i}));
  assert.deepEqual(unpackShipChallenge(decodeLinkPayload(encodeLinkPayload(packShipChallenge(c)))),c);
 }
 const c=challengeSnapshot(M.fresh(),1);c.ship.levels[3]=-0;c.ship.cosmetics=undefined;
 assert.deepEqual(unpackShipChallenge(decodeLinkPayload(encodeLinkPayload(packShipChallenge(c)))),c);
});
test('packed ship rejects corrupt masks, field counts, bit padding and duplicate stations',()=>{
 for(const c of [[3,1,null,2**19,[]],[3,1,null,1,[]],[3,1,null,0,[1]],[3,1,null,16,[new Uint8Array([36])]]])assert.throws(()=>unpackShipChallenge(c));
 const duplicate=new Uint8Array([2,16,64,0]);assert.throws(()=>unpackShipChallenge([3,1,null,8,[duplicate]]));
 const padding=new Uint8Array([1,128]);assert.throws(()=>unpackShipChallenge([3,1,null,64,[padding]]));
});

test('bit-packed results retain every victory flag and turn count; older receipts remain valid',()=>{
 for(const won of [true,false])for(let turns=1;turns<=25;turns++){
  const r={v:1,id:'7fb5439281a74c9b90b6ed3e1f26347a',friend:'Friend',won,turns};assert.deepEqual(readChallengeResult(resultsURL(r,base)),r);
 }
 for(const bits of [-1,50,1.5])assert.throws(()=>readChallengeResult(base+'?challenge-result='+encodeLinkPayload([3,'a'.repeat(32),'Friend',bits])));
});
