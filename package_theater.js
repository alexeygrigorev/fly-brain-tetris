const fs=require('fs'),path=require('path'),dir=__dirname;
const model=JSON.parse(fs.readFileSync(path.join(dir,'model.json')));delete model.replay;
let text=fs.readFileSync(path.join(dir,'theater-template.html'),'utf8');
const soundNames=['move','rotate','drop','lock','clear','level','over','fly','music'];
const sounds=Object.fromEntries(soundNames.map(name=>[name,fs.readFileSync(path.join(dir,'sounds',(name==='music'?'music-original.ogg':name+'.mp3'))).toString('base64')]));
text=text.replace('__ENGINE__',()=>fs.readFileSync(path.join(dir,'tetris.js'),'utf8'))
 .replace('__MODEL__',()=>JSON.stringify(model))
 .replace('__ACTIVITY__',()=>fs.readFileSync(path.join(dir,'activity.json'),'utf8'))
 .replace('__SOUND_DATA__',()=>JSON.stringify(sounds))
 .replace('__SOUNDS__',()=>fs.readFileSync(path.join(dir,'sounds.js'),'utf8'))
 .replace('__THEATER__',()=>fs.readFileSync(path.join(dir,'theater.js'),'utf8'));
fs.writeFileSync(path.join(dir,'fly-at-controls.html'),text);console.log('Saved fly-at-controls.html');
