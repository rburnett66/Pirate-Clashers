const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..');
const privateIP=ip=>/^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(ip);
const interfaces=Object.entries(os.networkInterfaces()).sort(([a],[b])=>Number(/wi.?fi/i.test(b))-Number(/wi.?fi/i.test(a)));
const addresses=interfaces.flatMap(([,rows])=>rows.filter(r=>r.family==='IPv4'&&!r.internal&&privateIP(r.address)).map(r=>r.address));
const hostIndex=process.argv.indexOf('--host'),host=hostIndex<0?addresses[0]:process.argv[hostIndex+1];
if(!host||!addresses.includes(host)){console.error('Connect this computer to Wi-Fi, then run npm run start:phone. --host must be a private IPv4 address assigned to this computer.');process.exit(1);}
const types={'.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
function allowed(relative){
 if(relative==='index.html')return true;
 if(relative.startsWith('src/'))return /\.(js|css)$/.test(relative);
 if(relative.startsWith('public/'))return /\.(html|js|css|png|jpg|svg|webmanifest)$/i.test(relative);
 return relative.startsWith('Pirate Art/pirate_segments/')&&relative.endsWith('.png');
}
const server=http.createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
 try{
  const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replaceAll('\\','/');
  if(route.includes('\0')||route.split('/').some(part=>part==='..'||part.startsWith('.'))){res.writeHead(404).end();return;}
  const relative=route==='/'?'index.html':route.slice(1);
  if(!allowed(relative)){res.writeHead(404).end();return;}
  const file=await fs.realpath(path.join(root,relative)),resolved=path.relative(root,file).replaceAll('\\','/');
  if(resolved.startsWith('../')||path.isAbsolute(resolved)||!allowed(resolved)){res.writeHead(404).end();return;}
  const data=await fs.readFile(file),ext=path.extname(file).toLowerCase();
  res.writeHead(200,{'Content-Type':types[ext],'Content-Length':data.length,'X-Content-Type-Options':'nosniff','Cache-Control':['.png','.svg'].includes(ext)?'private, max-age=3600':'no-store'});
  res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404).end();}
});
server.on('error',e=>{console.error('Phone preview could not start: '+e.message);process.exitCode=1;});
server.listen(4174,host,()=>console.log(`Phone preview: http://${host}:4174\nUse the same Wi-Fi as this computer. Keep this process running; Ctrl+C stops it.\nThis serves only the game runtime. Phone progress is saved separately in its browser.`));
