const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '../../src/Turnos.Web/wwwroot');
function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (pathname.startsWith('/api/')) { res.writeHead(503, {'Content-Type':'application/json'}); res.end(JSON.stringify({detail:'El backend todavía no está conectado. Consulta el contrato de integración.'})); return; }
      const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
      const body = await fs.readFile(file);
      res.writeHead(200, {'Content-Type':{'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'}[path.extname(file)] || 'application/octet-stream'}); res.end(body);
    } catch { res.writeHead(404).end(); }
  });
}
module.exports = {createServer};
if (require.main === module) createServer().listen(5080, '127.0.0.1', () => console.log('Frontend: http://127.0.0.1:5080 (requiere API .NET)'));
