import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const MAX_BODY_BYTES = 64 * 1024;
const VALID_STATUSES = new Set(['Em Atendimento', 'Aguardando', 'Atendimento Finalizado', 'Chamado']);
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function json(res, status, value) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(value));
}

function empty(res, status = 204) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end();
}

async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('INVALID_JSON');
  }
}

function patientFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    destination: row.destination,
    status: row.status,
    callCount: Number(row.callCount ?? 0),
    queue_order: Number(row.queue_order ?? 0),
  };
}

function callFromRow(row) {
  return {
    id: row.id,
    patientId: row.patientId,
    patientName: row.patientName,
    destination: row.destination,
    callCount: Number(row.callCount ?? 0),
    calledAt: row.calledAt,
    station: {
      name: row.stationName || '',
      role: row.stationRole || 'Outro',
      room: row.stationRoom || '',
    },
  };
}

function initDatabase(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      destination TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Aguardando',
      call_count INTEGER NOT NULL DEFAULT 0,
      queue_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      destination TEXT NOT NULL,
      call_count INTEGER NOT NULL,
      called_at TEXT NOT NULL,
      station_name TEXT NOT NULL DEFAULT '',
      station_role TEXT NOT NULL DEFAULT 'Outro',
      station_room TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS counters (
      key TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO counters(key, value) VALUES ('ficha', 0);
    INSERT OR IGNORE INTO settings(key, value) VALUES ('notices_enabled', '1');
  `);
}

export function createHealthCallServer({ dataDir, distDir } = {}) {
  if (!dataDir) throw new Error('dataDir is required');
  fs.mkdirSync(dataDir, { recursive: true });

  const db = new DatabaseSync(path.join(dataDir, 'healthcall.sqlite'));
  initDatabase(db);
  const sseClients = new Set();

  const listPatients = db.prepare(`
    SELECT id, name, destination, status, call_count AS callCount, queue_order
    FROM patients
    ORDER BY queue_order ASC, created_at ASC
  `);
  const getPatient = db.prepare(`
    SELECT id, name, destination, status, call_count AS callCount, queue_order
    FROM patients WHERE id = ?
  `);

  const broadcast = (payload) => {
    const line = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of sseClients) client.write(line);
  };

  const getDisplaySettings = () => ({
    noticesEnabled: db.prepare("SELECT value FROM settings WHERE key = 'notices_enabled'").get()?.value !== '0',
  });

  async function handleApi(req, res, url) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      });
      res.end();
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      json(res, 200, { ok: true, mode: 'local', version: '1' });
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(': healthcall connected\n\n');
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/patients') {
      json(res, 200, listPatients.all().map(patientFromRow));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/patients') {
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      const destination = String(body.destination || '').trim();
      if (!name || !destination) {
        json(res, 400, { error: 'Nome e destino são obrigatórios.' });
        return true;
      }
      const nextOrder = Number(db.prepare('SELECT COALESCE(MAX(queue_order), 0) + 1 AS value FROM patients').get().value);
      const id = randomUUID();
      db.prepare(`
        INSERT INTO patients(id, name, destination, status, call_count, queue_order, created_at)
        VALUES (?, ?, ?, 'Aguardando', 0, ?, ?)
      `).run(id, name, destination, nextOrder, new Date().toISOString());
      const patient = patientFromRow(getPatient.get(id));
      broadcast({ type: 'patients-changed' });
      json(res, 201, patient);
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/patients/ficha') {
      const body = await readBody(req);
      const destination = String(body.destination || '').trim();
      if (!destination) {
        json(res, 400, { error: 'Destino é obrigatório.' });
        return true;
      }
      db.exec('BEGIN IMMEDIATE');
      try {
        const counter = Number(db.prepare("SELECT value FROM counters WHERE key = 'ficha'").get().value) + 1;
        db.prepare("UPDATE counters SET value = ? WHERE key = 'ficha'").run(counter);
        const nextOrder = Number(db.prepare('SELECT COALESCE(MAX(queue_order), 0) + 1 AS value FROM patients').get().value);
        const id = randomUUID();
        db.prepare(`
          INSERT INTO patients(id, name, destination, status, call_count, queue_order, created_at)
          VALUES (?, ?, ?, 'Aguardando', 0, ?, ?)
        `).run(id, `Ficha ${counter}`, destination, nextOrder, new Date().toISOString());
        db.exec('COMMIT');
        const patient = patientFromRow(getPatient.get(id));
        broadcast({ type: 'patients-changed' });
        json(res, 201, patient);
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return true;
    }

    const patientMatch = url.pathname.match(/^\/api\/patients\/([^/]+)$/);
    if (patientMatch && req.method === 'PATCH') {
      const id = decodeURIComponent(patientMatch[1]);
      const current = patientFromRow(getPatient.get(id));
      if (!current) {
        json(res, 404, { error: 'Paciente não encontrado.' });
        return true;
      }
      const body = await readBody(req);
      const next = {
        ...current,
        name: body.name === undefined ? current.name : String(body.name).trim(),
        destination: body.destination === undefined ? current.destination : String(body.destination).trim(),
        status: body.status === undefined ? current.status : String(body.status),
        callCount: body.callCount === undefined ? current.callCount : Math.max(0, Number(body.callCount) || 0),
        queue_order: body.queue_order === undefined ? current.queue_order : Math.max(0, Number(body.queue_order) || 0),
      };
      if (!next.name || !next.destination || !VALID_STATUSES.has(next.status)) {
        json(res, 400, { error: 'Dados do paciente são inválidos.' });
        return true;
      }
      db.prepare(`
        UPDATE patients SET name = ?, destination = ?, status = ?, call_count = ?, queue_order = ? WHERE id = ?
      `).run(next.name, next.destination, next.status, next.callCount, next.queue_order, id);
      broadcast({ type: 'patients-changed' });
      json(res, 200, patientFromRow(getPatient.get(id)));
      return true;
    }

    if (patientMatch && req.method === 'DELETE') {
      const id = decodeURIComponent(patientMatch[1]);
      db.prepare('DELETE FROM patients WHERE id = ?').run(id);
      broadcast({ type: 'patients-changed' });
      empty(res);
      return true;
    }

    const callMatch = url.pathname.match(/^\/api\/patients\/([^/]+)\/call$/);
    if (callMatch && req.method === 'POST') {
      const id = decodeURIComponent(callMatch[1]);
      const body = await readBody(req);
      const destination = String(body.destination || '').trim();
      const station = {
        name: String(body.station?.name || '').trim(),
        role: String(body.station?.role || 'Outro').trim(),
        room: String(body.station?.room || '').trim(),
      };
      if (!destination || !station.room) {
        json(res, 400, { error: 'Configure a sala deste posto antes de chamar.' });
        return true;
      }
      const current = patientFromRow(getPatient.get(id));
      if (!current) {
        json(res, 404, { error: 'Paciente não encontrado.' });
        return true;
      }

      const callId = randomUUID();
      const calledAt = new Date().toISOString();
      const nextCount = current.callCount + 1;
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`
          UPDATE patients SET status = 'Chamado', destination = ?, call_count = ? WHERE id = ?
        `).run(destination, nextCount, id);
        db.prepare(`
          INSERT INTO calls(
            id, patient_id, patient_name, destination, call_count, called_at,
            station_name, station_role, station_room
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(callId, id, current.name, destination, nextCount, calledAt, station.name, station.role, station.room);
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }

      const patient = patientFromRow(getPatient.get(id));
      const call = {
        id: callId,
        patientId: id,
        patientName: current.name,
        destination,
        callCount: nextCount,
        calledAt,
        station,
      };
      broadcast({ type: 'patients-changed' });
      broadcast({ type: 'call', call });
      json(res, 200, patient);
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/queue/reorder') {
      const body = await readBody(req);
      if (!Array.isArray(body.items)) {
        json(res, 400, { error: 'Ordem da fila inválida.' });
        return true;
      }
      db.exec('BEGIN IMMEDIATE');
      try {
        const statement = db.prepare('UPDATE patients SET queue_order = ? WHERE id = ?');
        for (const item of body.items) {
          if (!item?.id) continue;
          statement.run(Math.max(0, Number(item.queue_order) || 0), String(item.id));
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      broadcast({ type: 'patients-changed' });
      empty(res);
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/queue/clear') {
      db.exec('BEGIN IMMEDIATE');
      try {
        db.exec('DELETE FROM patients; DELETE FROM calls;');
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      broadcast({ type: 'patients-changed' });
      empty(res);
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/calls') {
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 10));
      const rows = db.prepare(`
        SELECT id, patient_id AS patientId, patient_name AS patientName, destination,
          call_count AS callCount, called_at AS calledAt, station_name AS stationName,
          station_role AS stationRole, station_room AS stationRoom
        FROM calls ORDER BY called_at DESC LIMIT ?
      `).all(limit);
      json(res, 200, rows.map(callFromRow));
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/settings') {
      json(res, 200, getDisplaySettings());
      return true;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/settings') {
      const body = await readBody(req);
      if (typeof body.noticesEnabled === 'boolean') {
        db.prepare("INSERT INTO settings(key, value) VALUES ('notices_enabled', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
          .run(body.noticesEnabled ? '1' : '0');
      }
      const settings = getDisplaySettings();
      broadcast({ type: 'settings-changed', settings });
      json(res, 200, settings);
      return true;
    }

    return false;
  }

  function serveStatic(res, pathname) {
    if (!distDir || !fs.existsSync(distDir)) return false;
    const requested = pathname === '/' ? '/index.html' : pathname;
    const absolute = path.normalize(path.join(distDir, requested));
    if (!absolute.startsWith(path.normalize(distDir))) {
      json(res, 403, { error: 'Caminho inválido.' });
      return true;
    }

    let filePath = absolute;
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    if (!fs.existsSync(filePath)) return false;

    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=3600',
    });
    fs.createReadStream(filePath).pipe(res);
    return true;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      if (url.pathname.startsWith('/api/')) {
        const handled = await handleApi(req, res, url);
        if (!handled) json(res, 404, { error: 'Endpoint não encontrado.' });
        return;
      }
      if (req.method === 'GET' && serveStatic(res, decodeURIComponent(url.pathname))) return;
      json(res, 404, { error: 'HealthCall ainda não foi compilado. Execute npm run build.' });
    } catch (error) {
      console.error('[HealthCall Local]', error);
      if (!res.headersSent) {
        const message = error?.message === 'BODY_TOO_LARGE'
          ? 'Requisição muito grande.'
          : error?.message === 'INVALID_JSON'
            ? 'JSON inválido.'
            : 'Erro interno do servidor local.';
        json(res, error?.message === 'BODY_TOO_LARGE' ? 413 : 500, { error: message });
      } else {
        res.end();
      }
    }
  });

  const heartbeat = setInterval(() => {
    for (const client of sseClients) client.write(': ping\n\n');
  }, 25_000);
  heartbeat.unref();

  return {
    server,
    db,
    close() {
      clearInterval(heartbeat);
      for (const client of sseClients) client.end();
      sseClients.clear();
      if (server.listening) server.close();
      db.close();
    },
  };
}
