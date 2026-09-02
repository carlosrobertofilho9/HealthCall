import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { createHealthCallServer } from '../app.mjs';

let app;
let baseUrl;
let dataDir;

before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'healthcall-'));
  app = createHealthCallServer({ dataDir });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const address = app.server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
  app?.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

async function api(pathname, init) {
  return fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
}

test('starts in local mode without Supabase', async () => {
  const response = await api('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, mode: 'local', version: '1' });
});

test('persists a patient and calls from a configured room', async () => {
  const createdResponse = await api('/api/patients', {
    method: 'POST',
    body: JSON.stringify({ name: 'Maria Teste', destination: 'Fila geral' }),
  });
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  assert.equal(created.name, 'Maria Teste');
  assert.equal(created.callCount, 0);

  const invalidCall = await api(`/api/patients/${created.id}/call`, {
    method: 'POST',
    body: JSON.stringify({ destination: 'Sala 3', station: { role: 'Médico', room: '' } }),
  });
  assert.equal(invalidCall.status, 400);

  const callResponse = await api(`/api/patients/${created.id}/call`, {
    method: 'POST',
    body: JSON.stringify({
      destination: 'Sala 3',
      station: { name: 'Dr. Teste', role: 'Médico', room: '3' },
    }),
  });
  assert.equal(callResponse.status, 200);
  const called = await callResponse.json();
  assert.equal(called.status, 'Chamado');
  assert.equal(called.destination, 'Sala 3');
  assert.equal(called.callCount, 1);

  const historyResponse = await api('/api/calls?limit=5');
  const history = await historyResponse.json();
  assert.equal(history.length, 1);
  assert.equal(history[0].patientName, 'Maria Teste');
  assert.equal(history[0].station.room, '3');
  assert.equal(history[0].station.role, 'Médico');
});

test('generates sequential tickets', async () => {
  const first = await api('/api/patients/ficha', {
    method: 'POST',
    body: JSON.stringify({ destination: 'Fila geral' }),
  }).then((response) => response.json());
  const second = await api('/api/patients/ficha', {
    method: 'POST',
    body: JSON.stringify({ destination: 'Fila geral' }),
  }).then((response) => response.json());
  assert.equal(first.name, 'Ficha 1');
  assert.equal(second.name, 'Ficha 2');
});

test('can disable institutional notices globally', async () => {
  const response = await api('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify({ noticesEnabled: false }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { noticesEnabled: false });

  const readBack = await api('/api/settings').then((result) => result.json());
  assert.equal(readBack.noticesEnabled, false);
});

test('clears queue and call history', async () => {
  const response = await api('/api/queue/clear', { method: 'POST' });
  assert.equal(response.status, 204);
  const patients = await api('/api/patients').then((result) => result.json());
  const calls = await api('/api/calls').then((result) => result.json());
  assert.deepEqual(patients, []);
  assert.deepEqual(calls, []);
});
