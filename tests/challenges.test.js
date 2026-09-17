import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import {challengeSnapshot,challengeURL,readChallenge,practiceGame,issueChallenge,completeChallenge,resultsURL,readChallengeResult,claimChallengeResult} from '../src/challenges.js';
import {stationPosition} from '../src/ballistics.js';

test('text challenge round-trips a Unicode captain and ship without wallet or progress',()=>{
 const s=M.fresh();s.name='Capitán ☠';const before=structuredClone(s),link=challengeURL(s,'https://example.com/play/',81),c=readChallenge(link);
 assert.equal(c.ship.name,s.name);assert.equal(c.ship.gold,undefined);assert.equal(c.ship.chests,undefined);assert.deepEqual(s,before);
 const practice=practiceGame(c,s);assert.equal(practice.battle.enemyName,s.name);assert.deepEqual(practice.battle.enemy.crew.map(g=>g.id),Object.values(s.slots));assert.equal(practice.battle.player.crew.length,4);
 assert.equal(practice.battle.enemy.cosmetic,1);assert.equal(practice.battle.enemy.x,8.4);assert.equal(practice.battle.player.x,2.8);
});
test('every full ship receives one distinct, positioned bonus gunner including a ninth crew member',()=>{
 for(let shipLevel=1;shipLevel<=6;shipLevel++){
  const s=M.fresh();s.shipLevel=shipLevel;s.slots={};M.positions(s).forEach((slot,i)=>{s.slots[slot]=i+1;s.levels[i+1]=1;});
  const p=practiceGame(challengeSnapshot(s,12),s),b=p.battle;
  assert.equal(b.player.crew.length,b.enemy.crew.length+1);assert.equal(new Set(b.player.crew.map(g=>g.id)).size,b.player.crew.length);
  const positions=b.player.crew.map(g=>stationPosition(b.player,g.slot));assert.ok(positions.every(p=>p.width>0&&p.height>0));assert.equal(new Set(positions.map(p=>p.x+':'+p.y)).size,positions.length);
  assert.deepEqual(practiceGame(challengeSnapshot(s,12),s).battle.player.crew,b.player.crew);
 }
});
test('malformed, oversized and invalid ship challenge links are rejected',()=>{
 for(const hash of ['#challenge=!','#challenge='+ 'a'.repeat(12001),'#challenge=eyJ2Ijo5OX0'])assert.throws(()=>readChallenge(hash));
 const c=challengeSnapshot(M.fresh());c.ship.slots.d0=999;assert.throws(()=>practiceGame(c));
 assert.equal(readChallenge('#elsewhere'),null);
});

test('recipients keep their own ship and new captains get repeatable randomized ships',()=>{const sender=M.fresh(),recipient=M.fresh();recipient.shipLevel=4;recipient.name='Friend';recipient.cosmetics=[3];recipient.cosmetic=3;const before=structuredClone(recipient),c=challengeSnapshot(sender,413),p=practiceGame(c,recipient);assert.equal(p.battle.player.shipLevel,4);assert.equal(p.battle.player.cosmetic,3);assert.equal(p.battle.enemy.shipLevel,1);assert.equal(p.battle.player.crew.length,Object.keys(recipient.slots).length+1);assert.deepEqual(recipient,before);const a=practiceGame(c),b=practiceGame(c);assert.deepEqual(a.battle.player,b.battle.player);assert.equal(a.battle.player.crew.length,M.positions(a).length+1);assert.ok(a.battle.bonusGunner);});

test('both captains earn exactly 100 wood through a persistent return receipt, win or loss',()=>{
 for(const won of [true,false]){
  let sender=M.fresh(),friend=M.fresh();friend.name='Amígo 🏴';
  const challenge=readChallenge(issueChallenge(sender,'https://example.com/pirate-bash/')),game=practiceGame(challenge,friend);
  assert.throws(()=>completeChallenge(friend,challenge,game));
  game.battle.phase='result';game.battle.won=won;
  const before=structuredClone(friend),{result,awarded}=completeChallenge(friend,challenge,game);
  assert.equal(awarded,true);assert.equal(friend.mats.wood,before.mats.wood+100);assert.equal(friend.gold,before.gold);assert.deepEqual(friend.slots,before.slots);
  friend=M.restore(JSON.stringify(friend));assert.equal(completeChallenge(friend,challenge,game).awarded,false);assert.equal(friend.mats.wood,260);
  const replay=practiceGame(challenge,friend);replay.battle.phase='result';replay.battle.won=!won;
  assert.deepEqual(completeChallenge(friend,challenge,replay).result,result);assert.equal(friend.mats.wood,260);
  const url=resultsURL(result,'https://example.com/pirate-bash/#challenge=old');assert.equal(new URL(url).pathname,'/pirate-bash/');
  const receipt=readChallengeResult(url);assert.deepEqual(receipt,result);
  assert.throws(()=>claimChallengeResult(friend,receipt));assert.throws(()=>claimChallengeResult(M.fresh(),receipt));
  sender=M.restore(JSON.stringify(sender));assert.equal(claimChallengeResult(sender,receipt),true);assert.equal(sender.mats.wood,260);
  sender=M.restore(JSON.stringify(sender));assert.equal(claimChallengeResult(sender,receipt),false);assert.equal(sender.mats.wood,260);
 }
});
test('generated captains keep their ship and reward without saving the temporary bonus battle',()=>{
 const sender=M.fresh(),c=readChallenge(issueChallenge(sender,'https://example.com/')),game=practiceGame(c);
 const captain=structuredClone(game);captain.battle=null;M.validate(captain);
 game.battle.phase='result';game.battle.won=true;completeChallenge(captain,c,game);
 const saved=M.restore(JSON.stringify(captain));assert.equal(saved.mats.wood,260);assert.equal(saved.shipLevel,game.shipLevel);assert.deepEqual(saved.slots,game.slots);assert.equal(saved.onboarded,true);
 assert.throws(()=>completeChallenge(sender,c,game));
});
test('malformed receipts, mismatched battles and damaged reward ledgers are rejected',()=>{
 for(const hash of ['#challenge-result=!','#challenge-result='+ 'a'.repeat(2001),'#challenge-result=eyJ2Ijo5OX0'])assert.throws(()=>readChallengeResult(hash));
 assert.equal(readChallengeResult('#challenge=x'),null);
 const s=M.fresh(),c=readChallenge(issueChallenge(s,'https://example.com/')),g=practiceGame(c),friend=M.fresh();g.battle.phase='result';g.battle.won=true;g.battle.challengeId='0'.repeat(32);assert.throws(()=>completeChallenge(friend,c,g));
 assert.throws(()=>resultsURL({v:1,id:c.id,friend:'Friend',won:true,turns:-1},'https://example.com/'));
 s.friendChallenges.claimed.push('not-an-id');assert.throws(()=>M.restore(JSON.stringify(s)));
});

test('compact query links retain every ship field and old fragment links still decode',()=>{
 const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
 for(let level=1;level<=6;level++){
  const s=M.fresh();s.name='Capitán ⚓';s.shipLevel=level;s.sailLevel=5;s.levels[36]=12;
  const expected=challengeSnapshot(s,123),url=challengeURL(s,'https://example.com/play/?challenge=old#challenge-result=old',123);
  assert.equal(new URL(url).hash,'');assert.equal([...new URL(url).searchParams].length,1);
  assert.deepEqual(readChallenge(url),expected);assert.deepEqual(readChallenge(new URL(url).search),expected);
  const legacy='#challenge='+encode(expected);assert.deepEqual(readChallenge(legacy),expected);assert.deepEqual(readChallenge('https://example.com/play/'+legacy),expected);
  assert.ok(url.length<('https://example.com/play/'+legacy).length*.7);
 }
 const r={v:1,id:'a'.repeat(32),friend:'José 🏴',won:false,turns:25};
 assert.deepEqual(readChallengeResult('#challenge-result='+encode(r)),r);
 assert.deepEqual(readChallengeResult(resultsURL(r,'https://example.com/play/?challenge=old')),r);
 const url=challengeURL(M.fresh(),'https://example.com/');assert.throws(()=>readChallenge(url+'&challenge=duplicate'));
 assert.throws(()=>readChallenge('?challenge='+encode([2,1,null,[]])));
 assert.throws(()=>readChallengeResult('?challenge-result='+encode([2,r.id,'Friend',5,2])));
});
