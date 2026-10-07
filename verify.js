const assert=require('assert'),fs=require('fs'),path=require('path'),E=require('./tetris.js');
assert.deepStrictEqual(E.PIECES.map(p=>p.length),[2,1,4,2,2,4,4]);
for(const variants of E.PIECES)for(const p of variants){assert.equal(p.rows.reduce((s,r)=>s+r.toString(2).replace(/0/g,'').length,0),4);}
for(let seed=0;seed<20;seed++){let next=E.bagStream(seed);for(let b=0;b<10;b++)assert.equal(new Set(Array.from({length:7},next)).size,7);}
const empty=Array(20).fill(0);
assert.equal(E.candidates(empty,0).length,17);
assert.equal(E.candidates(empty,1).length,9);
// An I piece must complete exactly one bottom row and leave an empty board.
let board=empty.slice();board[0]=1023^15;
let clear=E.candidates(board,0).find(c=>c.rotation===0&&c.x===0);
assert.equal(clear.lines,1);assert(clear.board.every(r=>r===0));
assert.equal(E.candidates(Array(20).fill(1023),1).length,0);
for(let seed=0;seed<10;seed++){let next=E.bagStream(seed),b=empty.slice(),totalCleared=0;for(let n=0;n<100;n++){let moves=E.candidates(b,next());if(!moves.length)break;for(let move of moves){assert.equal(move.board.length,20);assert(move.board.every(r=>r>=0&&r<1023));let before=b.reduce((s,r)=>s+r.toString(2).replace(/0/g,'').length,0),after=move.board.reduce((s,r)=>s+r.toString(2).replace(/0/g,'').length,0);assert.equal(after,before+4-10*move.lines);}let m=moves[n%moves.length];b=m.board;totalCleared+=m.lines;}}
const model=JSON.parse(fs.readFileSync(path.join(__dirname,'model.json')));
let decoded=E.effectiveWeights(model.readout,model.connectome.transform);
decoded.forEach((w,i)=>assert(Math.abs(w-model.effectiveWeights[i])<1e-10));
assert.deepStrictEqual(E.play(decoded,model.replay.seed,2000,true),model.replay);
let r=E.rng(987);for(let k=0;k<100;k++){let features=Array.from({length:6},r),activity=model.connectome.transform.map(row=>row.reduce((s,v,j)=>s+v*features[j],0)),full=activity.reduce((s,v,j)=>s+v*model.readout[j],0),compiled=features.reduce((s,v,j)=>s+v*decoded[j],0);assert(Math.abs(full-compiled)<1e-10);}
console.log('PASS: tetromino geometry, 7-bag generator, legal placements, row clearing, block conservation, top-out, neural compilation, replay reproducibility.');
