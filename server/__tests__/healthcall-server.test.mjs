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

async function jsonApi(pathname, init) {
  const response = await api(pathname, init);
  const body = response.status === 204 ? null : await response.json();
  return { response, body };
}

test('starts in local mode v2 without a cloud account', async () => {
  const response = await api('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, mode: 'local', version: '2' });
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

test('persists shared profile and global voice setting', async () => {
  const profileUpdate = await jsonApi('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify({ full_name: 'Equipe UBS Centro', department: 'UBS Centro', default_destination: 'Consultório' }),
  });
  assert.equal(profileUpdate.response.status, 200);
  assert.equal(profileUpdate.body.full_name, 'Equipe UBS Centro');

  const profile = await api('/api/profile').then((response) => response.json());
  assert.equal(profile.department, 'UBS Centro');

  const settings = await jsonApi('/api/global-settings', {
    method: 'PATCH',
    body: JSON.stringify({ useBrowserVoice: false }),
  });
  assert.equal(settings.response.status, 200);
  assert.equal(settings.body.useBrowserVoice, false);
});

test('creates and reschedules appointments transactionally', async () => {
  const created = await jsonApi('/api/appointments', {
    method: 'POST',
    body: JSON.stringify({
      scheduled_date: '2026-09-07',
      slot_number: 1,
      patient_name: 'Paciente Agenda',
      document_type: 'CPF',
      document_value: '12345678900',
      acs_name: 'ACS Teste',
      status: 'Agendado',
    }),
  });
  assert.equal(created.response.status, 201);

  const rescheduled = await jsonApi(`/api/appointments/${created.body.id}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ scheduledDate: '2026-09-14', slotNumber: 2 }),
  });
  assert.equal(rescheduled.response.status, 200);
  assert.equal(rescheduled.body.scheduled_date, '2026-09-14');
  assert.equal(rescheduled.body.slot_number, 2);
  assert.equal(rescheduled.body.rescheduled_from_id, created.body.id);

  const oldDay = await api('/api/appointments?date=2026-09-07').then((response) => response.json());
  assert.equal(oldDay[0].status, 'Remarcado');
  assert.equal(oldDay[0].rescheduled_to_id, rescheduled.body.id);
});

test('persists warnings and operational pending items locally', async () => {
  const warning = await jsonApi('/api/warnings', {
    method: 'POST',
    body: JSON.stringify({ text: 'Campanha de vacinação', active: true, media_type: 'image', priority_order: 1 }),
  });
  assert.equal(warning.response.status, 201);
  assert.equal(warning.body.text, 'Campanha de vacinação');

  const pending = await jsonApi('/api/pendencias', {
    method: 'POST',
    body: JSON.stringify({ nome_paciente: 'Paciente Pendência', cns_cpf: '123', tipo: 'Exame', prioridade: 'alta' }),
  });
  assert.equal(pending.response.status, 201);
  assert.equal(pending.body.status, 'aberto');

  const resolved = await jsonApi(`/api/pendencias/${pending.body.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'resolvido' }),
  });
  assert.equal(resolved.body.status, 'resolvido');
  assert.ok(resolved.body.resolved_at);
});

test('stores reception messages without authenticated users', async () => {
  const sent = await jsonApi('/api/reception/messages', {
    method: 'POST',
    body: JSON.stringify({ content: 'Paciente chegou para triagem', senderName: 'Recepção' }),
  });
  assert.equal(sent.response.status, 201);
  assert.equal(sent.body.sender_name, 'Recepção');

  const messages = await api('/api/reception/messages').then((response) => response.json());
  assert.ok(messages.some((message) => message.content === 'Paciente chegou para triagem'));
});

test('stores prescription metadata and updates its workflow locally', async () => {
  const created = await jsonApi('/api/prescriptions', {
    method: 'POST',
    body: JSON.stringify({ patient_name: 'Paciente Receita', document_type: 'CPF', document_value: '123.456.789-00', flags: [] }),
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.body.status, 'pending');

  const ready = await jsonApi(`/api/prescriptions/${created.body.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ready' }),
  });
  assert.equal(ready.body.status, 'ready');
});

test('creates wound patient, case and evolution with local versioning', async () => {
  const patient = await jsonApi('/api/wounds/patients', {
    method: 'POST',
    body: JSON.stringify({ full_name: 'Paciente Curativo', document_type: 'CPF', document_value: '99999999999' }),
  });
  assert.equal(patient.response.status, 201);

  const wound = await jsonApi('/api/wounds/cases', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: patient.body.id,
      started_at: '2026-09-01',
      etiology: 'Traumática',
      anatomical_code: 'lower-leg',
      comorbidities: [],
    }),
  });
  assert.equal(wound.response.status, 201);
  assert.equal(wound.body.version, 1);

  const entry = await jsonApi('/api/wounds/entries', {
    method: 'POST',
    body: JSON.stringify({ wound_id: wound.body.id, measure_length_cm: 2, measure_width_cm: 3, bed_aspect: [], edges: [] }),
  });
  assert.equal(entry.response.status, 201);
  assert.equal(entry.body.area_cm2, 6);

  const context = await api(`/api/wounds/cases/${wound.body.id}`).then((response) => response.json());
  assert.equal(context.patient.full_name, 'Paciente Curativo');
  assert.equal(context.wound.version, 2);
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
