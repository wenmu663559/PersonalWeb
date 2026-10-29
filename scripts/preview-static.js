import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const files = { '/': ['index.html', 'text/html'], '/index.html':['index.html','text/html'], '/app.js':['app.js','text/javascript'], '/content.js':['content.js','text/javascript'], '/giscus-config.js':['giscus-config.js','text/javascript'], '/style.css':['style.css','text/css'], '/favicon.svg':['favicon.svg','image/svg+xml'] };
createServer(async (req,res) => {
  const file=files[new URL(req.url,'http://localhost').pathname];
  if (!file) {res.writeHead(404);return res.end('Not found');}
  try { const body=await readFile(`dist/${file[0]}`);res.writeHead(200,{'Content-Type':file[1]+'; charset=utf-8'});res.end(body); }
  catch {res.writeHead(500);res.end('Run npm run build first.');}
}).listen(3001,'127.0.0.1',()=>console.log('Static preview: http://localhost:3001'));
