// Comparable deterministic payloads: original object JSON, shipped tuple JSON, binary/bit-packed.
import * as M from '../src/model.js';
import {challengeSnapshot} from '../src/challenges.js';
import {packShipChallenge} from '../src/challenge-wire.js';
import {encodeLinkPayload} from '../src/link-codec.js';
const prefix='https://rburnett66.github.io/pirate-bash/?challenge=';
const json=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
for(const level of [1,6]){
 const s=M.fresh();s.shipLevel=level;
 if(level===6){s.sailLevel=5;s.levels=Object.fromEntries(M.PIRATES.map(p=>[p.id,12]));s.slots=Object.fromEntries(M.positions(s).map((slot,i)=>[slot,i+1]));}
 const c={...challengeSnapshot(s,1234567890),id:'7fb5439281a74c9b90b6ed3e1f26347a'};
 const old=[2,c.seed,c.id,Object.entries(c.ship).map(([k,v])=>k==='levels'?M.PIRATES.map(p=>v[p.id]):v)];
 const original=json(c).length,previous=json(old).length,compressed=encodeLinkPayload(packShipChallenge(c)).length;
 console.log(JSON.stringify({shipLevel:level,payloadCharacters:{originalJSON:original,previousTupleJSON:previous,compressed},fullURLCharacters:prefix.length+compressed,reductionFromOriginal:Math.round(100*(1-compressed/original))+'%'}));
}
