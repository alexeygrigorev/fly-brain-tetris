const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const E=require('./tetris.js'),MODEL=require('./model.json'),ACTIVITY=require('./activity.json');
const elements={},canvas=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
const document={getElementById(id){return elements[id]??={value:id==='brain-mode'?'live':'1',style:{},classList:{toggle(){}},getContext:()=>canvas};}};
const c=vm.createContext({FlyTetris:E,MODEL,ACTIVITY,document,FlyAudio:{play(){},setRunning(){}},performance:{now:()=>0},requestAnimationFrame(){}});
const run=s=>vm.runInContext(s,c),vector=()=>Array.from(run('liveActivity'));
vm.runInContext(fs.readFileSync(path.join(__dirname,'theater.js'),'utf8'),c);
run('for(let i=0;i<8;i++)updateLiveActivity(100);');
assert(run('liveActivity.every((v,i)=>Math.abs(v-scalar(ACTIVITY.response_basis[7][i],liveInputs))<1e-12)'),'Constant input must reproduce step response');
function change(s,label){let before=vector();run(s+';updateLiveActivity();');assert(vector().some((v,i)=>Math.abs(v-before[i])>1e-8),label+' did not change activity');}
change('activeX--','Left');change('activeX++','Right');change('gravityStep()','Gravity');
run("choice.piece=2;activeRotation=0;activeY=18;phase=2;queue=['rotate'];qi=0;commandApplied=false;");
change('applyCommand()','Rotate');assert.equal(run('liveInputs[5]'),1/3);
run("queue=['drop'];qi=0;commandApplied=false;");change('applyCommand()','Drop');
change('finishLock()','Lock');change('commit()','New piece');
let oldX=run('activeX');run("manualDeviceKey('left');");assert.equal(run('activeX'),oldX-1,'Handheld button must move the actual game piece');let before=vector(),updates=run('liveUpdates');run('paused=true;lastFrameTime=100;tick(200);');assert.equal(run('liveUpdates'),updates);assert.deepStrictEqual(vector(),before);
run("document.getElementById('brain-mode').value='planned';drawBrain();");assert(run('shownActivity().every((v,i)=>v===scalar(ACTIVITY.response_basis[phase===0?0:stage][i],choice.features))'));
console.log('PASS: left, right, rotation, gravity, drop, lock, spawn, pause, planned view, and impulse/step-response equivalence.');
