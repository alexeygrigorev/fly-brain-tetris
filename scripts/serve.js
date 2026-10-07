const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),port=Number(process.env.PORT||8765),host=process.env.HOST||'127.0.0.1';
const files=new Map([['/','fly-at-controls.html'],['/fly-at-controls.html','fly-at-controls.html'],['/demo.html','demo.html']]);
const server=http.createServer((req,res)=>{const file=files.get(new URL(req.url,'http://localhost').pathname);if(!file){res.writeHead(404);res.end('Not found');return;}fs.readFile(path.join(root,file),(err,data)=>{if(err){res.writeHead(503);res.end('Run npm run setup and npm run build first.');return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(data);});});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});server.listen(port,host,()=>console.log('Open http://'+host+':'+port));
