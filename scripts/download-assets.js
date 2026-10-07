const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),manifest=require('../assets.json'),flags=new Set(process.argv.slice(2));
async function main(){for(const asset of manifest.assets){
 if(flags.has('--weights-only')&&asset.kind!=='weights')continue;
 if(flags.has('--music-only')&&asset.kind!=='music')continue;
 const dest=path.join(root,asset.path);
 try{const current=await fs.readFile(dest);if(crypto.createHash('sha256').update(current).digest('hex')===asset.sha256){console.log('Already available:',asset.path);continue;}if(!flags.has('--force'))throw Error(asset.path+' differs from the release; back it up or use --force.');}catch(e){if(e.code!=='ENOENT')throw e;}
 const response=await fetch(asset.url,{signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error('Download failed ('+response.status+'): '+asset.path);
 const bytes=Buffer.from(await response.arrayBuffer());if(crypto.createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('Checksum mismatch: '+asset.path);
 await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest+'.tmp',bytes);await fs.rename(dest+'.tmp',dest);console.log('Downloaded:',asset.path);
}}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
