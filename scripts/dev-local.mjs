import { spawn } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const server = spawn(process.execPath, ['server/healthcall-server.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, HEALTHCALL_PORT: '8787' },
});

const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const vite = spawn(process.execPath, [viteBin, '--host', '0.0.0.0'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VITE_DATA_MODE: 'local' },
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  server.kill('SIGTERM');
  vite.kill('SIGTERM');
  setTimeout(() => process.exit(code), 100).unref();
}

server.on('exit', (code) => {
  if (!stopping && code) stop(code);
});
vite.on('exit', (code) => {
  if (!stopping && code) stop(code);
});
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
