const fs=require('fs'),path=require('path'),assert=require('assert');
const E=require('./tetris.js'),C=JSON.parse(fs.readFileSync(path.join(__dirname,'connectome.json')));
const random=E.rng(20261007);
function gaussian(){return Math.sqrt(-2*Math.log(Math.max(1e-12,random())))*Math.cos(2*Math.PI*random());}
const T=C.transform;
// Optimize the readout in six independent reservoir coordinates; a pseudoinverse
// maps these coordinates to the actual 32 descending-neuron/time outputs.
const pinv=C.pseudoinverse;assert(pinv,'Build connectome first');
function readout(w){return T.map((_,i)=>w.reduce((s,v,j)=>s+pinv[j][i]*v,0));}
function actual(w){return E.effectiveWeights(readout(w),T);}
let mean=Array(6).fill(0),std=Array(6).fill(1),best=null,history=[];
const initial=actual(Array.from({length:6},gaussian));
for(let gen=0;gen<24;gen++){
 let seeds=Array.from({length:4},(_,i)=>10000+gen*37+i*997),population=[];
 for(let k=0;k<64;k++){let params=mean.map((m,j)=>m+std[j]*gaussian()),norm=Math.hypot(...params);params=params.map(x=>x/norm);let weights=actual(params),games=seeds.map(s=>E.play(weights,s,400));let score=games.reduce((a,g)=>a+g.lines+g.pieces*0.01,0)/games.length;population.push({params,score,meanLines:games.reduce((a,g)=>a+g.lines,0)/4});}
 population.sort((a,b)=>b.score-a.score);let elite=population.slice(0,10);
 mean=mean.map((m,j)=>0.25*m+0.75*elite.reduce((s,v)=>s+v.params[j],0)/elite.length);
 std=std.map((s,j)=>Math.max(0.025,0.25*s+0.75*Math.sqrt(elite.reduce((a,v)=>a+(v.params[j]-mean[j])**2,0)/elite.length)));
 best=population[0];history.push({generation:gen+1,bestTrainingLines:best.meanLines,mean:mean.slice(),std:std.slice()});console.log(JSON.stringify(history.at(-1)));
}
const trained=actual(mean),heldout=Array.from({length:30},(_,i)=>900000+i*1013);
function evaluate(weights,random=false){let games=heldout.map(s=>E.play(weights,s,2000,false,random));return{meanLines:games.reduce((a,g)=>a+g.lines,0)/games.length,meanPieces:games.reduce((a,g)=>a+g.pieces,0)/games.length,games};}
const trainedEval=evaluate(trained),initialEval=evaluate(initial),randomEval=evaluate(null,true);
const shuffledReadout=readout(mean).slice().reverse();
const ablationEval=evaluate(E.effectiveWeights(shuffledReadout,T));
const model={readout:readout(mean),effectiveWeights:trained,initialWeights:initial,trainingSeed:20261007,history,training:{generations:24,population:64,elites:10,gamesPerCandidate:4,pieceCap:400,objective:'lines + 0.01 * placed pieces',method:'cross-entropy evolutionary optimization, no demonstrations'},evaluation:{trained:trainedEval,untrained:initialEval,random:randomEval,reversedReadout:ablationEval},connectome:{...C,input_root_ids:undefined,output_root_ids:undefined,pseudoinverse:undefined}};
// Choose the median held-out run for a representative replay, not the best run.
let median=trainedEval.games.slice().sort((a,b)=>a.lines-b.lines)[15];model.replay=E.play(trained,median.seed,2000,true);
fs.writeFileSync(path.join(__dirname,'model.json'),JSON.stringify(model));
assert(trainedEval.meanLines>randomEval.meanLines*5+10,'Learning has not met the performance target');
assert(trainedEval.meanLines>initialEval.meanLines+10,'Training failed to improve on initialization');
console.log('FINAL',JSON.stringify({trained:trainedEval.meanLines,untrained:initialEval.meanLines,random:randomEval.meanLines,reversedReadout:ablationEval.meanLines}));
