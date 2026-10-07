const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const E=require('./tetris.js'),model=JSON.parse(fs.readFileSync(path.join(__dirname,'model.json'))),activity=JSON.parse(fs.readFileSync(path.join(__dirname,'activity.json'))),compiled=JSON.parse(fs.readFileSync(path.join(__dirname,'connectome.json')));
compiled.transform.forEach((row,i)=>row.forEach((v,j)=>assert(Math.abs(v-model.connectome.transform[i][j])<1e-12)));
assert.equal(activity.cells.length,1000);assert.equal(activity.response_basis.length,8);
activity.cells.forEach(c=>assert(c.position.length===3&&c.root_id&&c.group));
activity.output_basis.flat().forEach((row,i)=>row.forEach((v,j)=>assert(Math.abs(v-model.connectome.transform[i][j])<1e-8)));
// Exercise the actual UI state machine: every rotation/column/drop sequence,
// colored-cell lock, clear, and preview must match the evaluated game.
const canvas=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}}),elements={};
const document={getElementById(id){return elements[id]??=( {value:id==='seed'?'314159':'1',getContext:()=>canvas,classList:{toggle(){}},style:{},getBoundingClientRect:()=>({left:0,top:0,width:420,height:435})});}};
let audioEvents=[];
let context=vm.createContext({FlyTetris:E,FlyAudio:{play:name=>audioEvents.push(name),setRunning(){}},MODEL:model,ACTIVITY:activity,document,requestAnimationFrame(){},performance:{now:()=>0},console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'theater.js'),'utf8'),context);
let expected=E.play(model.effectiveWeights,314159,300,true),frame=0,seen=new Set();
for(let step=0;frame<300&&step<10000;step++){
 let before=vm.runInContext('({phase,press,activeX,activeRotation})',context);
 if(before.phase===2){seen.add(before.press);let n=audioEvents.length;vm.runInContext('applyCommand(); applyCommand();',context);assert.equal(audioEvents.length,n+1);let after=vm.runInContext('({activeX,activeRotation})',context);assert.equal(after.activeX,before.activeX+(before.press==='left'?-1:before.press==='right'?1:0));assert.equal(after.activeRotation,before.activeRotation+(before.press==='rotate'?1:0));}
 vm.runInContext('advance();',context);
 let state=vm.runInContext('({board,lines,pieces,cellColors,phase,activeX,activeRotation,choice})',context);
 if(state.pieces>frame){let actual=JSON.parse(JSON.stringify(state));assert.deepStrictEqual(actual.board,expected.frames[frame].board);assert.equal(actual.lines,expected.frames[frame].totalLines);
  let colored=actual.cellColors.map(row=>row.reduce((bits,c,x)=>bits|(c?1<<x:0),0));assert.deepStrictEqual(colored,actual.board);frame++;
 }
 if(state.phase===3){assert.equal(state.activeX,state.choice.x);assert.equal(state.activeRotation,state.choice.rotation);}
}
assert.equal(frame,300);
assert.deepStrictEqual([...seen].sort(),['drop','left','right','rotate']);
vm.runInContext('reset();',context);
let base=vm.runInContext('gravityInterval()',context),reaction=vm.runInContext('duration()',context);assert.equal(vm.runInContext('gameLevel()',context),1);
vm.runInContext('activePlayMs=30000;',context);assert.equal(vm.runInContext('gameLevel()',context),2);assert(vm.runInContext('gravityInterval()',context)<base);assert.equal(vm.runInContext('duration()',context),reaction);
vm.runInContext('activePlayMs=90000;',context);assert.equal(vm.runInContext('gameLevel()',context),4);
vm.runInContext('paused=true;lastFrameTime=100;tick(150);',context);assert.equal(vm.runInContext('activePlayMs',context),90000);
vm.runInContext('activePlayMs=0;lines=20;',context);assert.equal(vm.runInContext('gameLevel()',context),3);
// Gravity runs while evaluating, without any key commands.
vm.runInContext('reset();',context);let initialY=vm.runInContext('activeY',context);
vm.runInContext('updateGravity(900);',context);assert.equal(vm.runInContext('activeY',context),initialY-1);assert.equal(vm.runInContext('phase',context),0);
// An unfinished command cannot hold a grounded piece forever.
vm.runInContext('activeY=landingY();groundedMs=0;updateGravity(349);',context);assert.notEqual(vm.runInContext('phase',context),3);
vm.runInContext('updateGravity(1);',context);assert.equal(vm.runInContext('phase',context),3);assert(vm.runInContext('board.some(Boolean)',context));
// Collision blocks sideways movement and rotation; commands cannot overlap blocks.
vm.runInContext("reset();activeY=0;activeX=0;phase=2;queue=['left'];qi=0;commandApplied=false;applyCommand();",context);assert.equal(vm.runInContext('activeX',context),0);assert.equal(vm.runInContext('blockedCommand',context),'left');
vm.runInContext("reset();board=Array(20).fill(1023);evaluate();",context);assert.equal(vm.runInContext('ended',context),true);
// With no controller phases advanced, gravity alone must eventually top out.
vm.runInContext('reset();draw=()=>{};let passiveTime=0;for(let n=0;n<1000&&!ended;n++){if(phase===3)commit();else updateGravity(900);}',context);assert.equal(vm.runInContext('ended',context),true);
// Play the real time-driven loop: the controller stays fixed as gravity accelerates.
const realTime=[];
for(let seed of [1,2,3]){elements.seed.value=String(seed);vm.runInContext('reset();draw=()=>{};for(let time=16;time<=600000&&!ended;time+=16)tick(time);',context);realTime.push(JSON.parse(JSON.stringify(vm.runInContext('({lines,pieces,ended,level:gameLevel(),elapsedMs:activePlayMs})',context))));}
assert(realTime.some(g=>g.ended&&g.pieces<2000),'Accelerated gravity never challenged the controller');
for(let name of ['rotate','move','drop','lock','clear','level','over'])assert(audioEvents.includes(name),'Missing sound event '+name);
let n=audioEvents.length;vm.runInContext('endGame(); endGame();',context);assert.equal(audioEvents.length,n,'Repeated game-over sound');
fs.writeFileSync(path.join(__dirname,'gravity-evaluation.json'),JSON.stringify(realTime,null,2));
console.log('PASS: planned moves still reproduce 300 baseline placements; independent gravity, ground lock, collisions, spawn top-out, passive loss, increasing difficulty, and pause verified. Live results:',realTime);
