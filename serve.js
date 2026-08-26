// 极简静态文件服务器 — 仅为本地预览演示站
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const port = Number(process.env.PORT) || 8899;
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json'};
http.createServer((req,res)=>{
  let url = decodeURIComponent(req.url.split('?')[0]);
  if(url==='/') url='/demo/index.html';
  let fp = path.normalize(path.join(root, url));
  if(!fp.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}
  fs.stat(fp,(err,st)=>{
    if(err||st.isDirectory()){res.writeHead(404);res.end('not found');return;}
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','Cache-Control':'no-store'});
    fs.createReadStream(fp).pipe(res);
  });
}).listen(port, ()=>console.log('serving on http://localhost:'+port+'/demo/index.html'));
