import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHealthCallServer } from './app.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = process.env.HEALTHCALL_DATA_DIR || path.join(rootDir, 'data');
const distDir = process.env.HEALTHCALL_DIST_DIR || path.join(rootDir, 'dist');
const port = Number(process.env.HEALTHCALL_PORT || 3000);
const host = process.env.HEALTHCALL_HOST || '0.0.0.0';

const app = createHealthCallServer({ dataDir, distDir });

app.server.listen(port, host, () => {
  console.log(`\nHealthCall Local iniciado.`);
  console.log(`Abra neste computador: http://localhost:${port}`);
  console.log(`Outros dispositivos da UBS podem acessar pelo IP deste computador na porta ${port}.\n`);
});

function shutdown() {
  try {
    app.close();
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
