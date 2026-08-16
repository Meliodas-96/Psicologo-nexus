// Genera config.js desde .env (local) o variables de entorno
// Uso: npm run build
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const CHAT_SECRET = process.env.CHAT_SECRET;

if (!WEBHOOK_URL || !CHAT_SECRET) {
  console.error('Faltan WEBHOOK_URL o CHAT_SECRET. Revisa tu .env (o las variables en Vercel).');
  process.exit(1);
}

const out = '// GENERADO automaticamente por scripts/build-config.js - no editar ni subir\n'
  + 'var CONFIG = {\n'
  + '  WEBHOOK_URL: ' + JSON.stringify(WEBHOOK_URL) + ',\n'
  + '  CHAT_SECRET: ' + JSON.stringify(CHAT_SECRET) + '\n'
  + '};\n';

fs.writeFileSync(path.join(root, 'config.js'), out);
console.log('config.js generado OK');
