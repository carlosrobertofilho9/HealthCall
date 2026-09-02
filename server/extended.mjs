import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const MAX_JSON_BODY_BYTES = 16 * 1024 * 1024;
const LOCAL_PROFILE_ID = 'local-profile';
const ACTIVE_APPOINTMENT_STATUSES = new Set(['Agendado', 'Compareceu', 'Faltou']);
const MEDIA_KINDS = new Set(['warnings', 'prescriptions', 'wounds', 'avatars']);

function nowIso() {
  return new Date().toISOString();
}

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stringify(value) {
  return JSON.stringify(value ?? null);
}

function sendJson(res, status, value) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(value));
}

function sendEmpty(res, status = 204) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end();
}

async function readJson(req, limit = MAX_JSON_BODY_BYTES) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > limit) throw new Error('BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('INVALID_JSON');
  }
}

function rowJson(row) {
  return row ? parseJson(row.data_json, null) : null;
}

function sanitizeFileName(value) {
  const base = path.basename(String(value || 'arquivo'));
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  return safe || 'arquivo';
}

function safeJoin(root, ...segments) {
  const absoluteRoot = path.resolve(root);
  const candidate = path.resolve(root, ...segments);
  if (candidate !== absoluteRoot && !candidate.startsWith(`${absoluteRoot}${path.sep}`)) {
    throw new Error('INVALID_PATH');
  }
  return candidate;
}

function writeBase64File({ dataDir, kind, fileName, mimeType, dataBase64 }) {
  if (!MEDIA_KINDS.has(kind)) throw new Error('INVALID_MEDIA_KIND');
  const safeName = `${Date.now()}-${randomUUID()}-${sanitizeFileName(fileName)}`;
  const directory = safeJoin(dataDir, 'media', kind);
  fs.mkdirSync(directory, { recursive: true });
  const absolutePath = safeJoin(directory, safeName);
  const buffer = Buffer.from(String(dataBase64 || ''), 'base64');
  if (!buffer.length) throw new Error('EMPTY_FILE');
  fs.writeFileSync(absolutePath, buffer, { flag: 'wx' });
  const storagePath = `${kind}/${safeName}`;
  return {
    storagePath,
    url: `/api/media/${encodeURIComponent(kind)}/${encodeURIComponent(safeName)}`,
    mimeType: String(mimeType || 'application/octet-stream'),
    size: buffer.length,
  };
}

function deleteMediaFile(dataDir, storagePath) {
  if (!storagePath) return;
  const [kind, ...rest] = String(storagePath).split('/');
  if (!MEDIA_KINDS.has(kind) || rest.length === 0) return;
  const filePath = safeJoin(dataDir, 'media', kind, rest.join('/'));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
}

function serveMediaFile(req, res, url, dataDir) {
  if (req.method !== 'GET') return false;
  const match = url.pathname.match(/^\/api\/media\/([^/]+)\/([^/]+)$/);
  if (!match) return false;
  const kind = decodeURIComponent(match[1]);
  const fileName = decodeURIComponent(match[2]);
  if (!MEDIA_KINDS.has(kind)) {
    sendJson(res, 404, { error: 'Arquivo não encontrado.' });
    return true;
  }
  const filePath = safeJoin(dataDir, 'media', kind, sanitizeFileName(fileName));
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendJson(res, 404, { error: 'Arquivo não encontrado.' });
    return true;
  }
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.pdf' ? 'application/pdf'
    : ext === '.png' ? 'image/png'
    : ext === '.webp' ? 'image/webp'
    : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.mp4' ? 'video/mp4'
    : ext === '.webm' ? 'video/webm'
    : 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': mime,
    'Content-Length': fs.statSync(filePath).size,
    'Cache-Control': 'private, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
  });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function selectJsonRecords(db, sql, ...params) {
  return db.prepare(sql).all(...params).map(rowJson).filter(Boolean);
}

function getJsonRecord(db, table, id) {
  return rowJson(db.prepare(`SELECT data_json FROM ${table} WHERE id = ?`).get(id));
}

function updateJsonRecord(db, table, id, record, extraSql = '', extraParams = []) {
  db.prepare(`UPDATE ${table} SET data_json = ?${extraSql} WHERE id = ?`).run(stringify(record), ...extraParams, id);
}

export function initExtendedSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles_local (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments_local (
      id TEXT PRIMARY KEY,
      scheduled_date TEXT NOT NULL,
      slot_number INTEGER NOT NULL,
      status TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_appointments_local_date ON appointments_local(scheduled_date, slot_number);
    CREATE INDEX IF NOT EXISTS idx_appointments_local_status ON appointments_local(status);

    CREATE TABLE IF NOT EXISTS warnings_local (
      id TEXT PRIMARY KEY,
      active INTEGER NOT NULL DEFAULT 1,
      priority_order INTEGER NOT NULL DEFAULT 0,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pendencias_local (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pendencias_local_status ON pendencias_local(status);

    CREATE TABLE IF NOT EXISTS reception_messages_local (
      id TEXT PRIMARY KEY,
      sender_id TEXT,
      sender_name TEXT,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reception_messages_local_created ON reception_messages_local(created_at);

    CREATE TABLE IF NOT EXISTS prescriptions_local (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_prescriptions_local_created ON prescriptions_local(created_at DESC);

    CREATE TABLE IF NOT EXISTS wound_patients_local (
      id TEXT PRIMARY KEY,
      active INTEGER NOT NULL DEFAULT 1,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS wound_cases_local (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      status TEXT NOT NULL,
      anatomical_code TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(patient_id) REFERENCES wound_patients_local(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_wound_cases_local_patient ON wound_cases_local(patient_id, updated_at DESC);
    CREATE TABLE IF NOT EXISTS wound_entries_local (
      id TEXT PRIMARY KEY,
      wound_id TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(wound_id) REFERENCES wound_cases_local(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_wound_entries_local_wound ON wound_entries_local(wound_id, recorded_at DESC);
    CREATE TABLE IF NOT EXISTS wound_photos_local (
      id TEXT PRIMARY KEY,
      wound_id TEXT NOT NULL,
      entry_id TEXT,
      storage_path TEXT NOT NULL,
      deleted_at TEXT,
      captured_at TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(wound_id) REFERENCES wound_cases_local(id) ON DELETE CASCADE,
      FOREIGN KEY(entry_id) REFERENCES wound_entries_local(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_wound_photos_local_wound ON wound_photos_local(wound_id, captured_at DESC);
    CREATE TABLE IF NOT EXISTS wound_status_events_local (
      id TEXT PRIMARY KEY,
      wound_id TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(wound_id) REFERENCES wound_cases_local(id) ON DELETE CASCADE
    );
  `);

  const existing = db.prepare('SELECT id FROM profiles_local WHERE id = ?').get(LOCAL_PROFILE_ID);
  if (!existing) {
    const timestamp = nowIso();
    const profile = {
      id: LOCAL_PROFILE_ID,
      updated_at: timestamp,
      default_destination: 'Consultório',
      full_name: 'Profissional da unidade',
      specialty: null,
      department: null,
      avatar_url: null,
    };
    db.prepare('INSERT INTO profiles_local(id, data_json, updated_at) VALUES (?, ?, ?)')
      .run(LOCAL_PROFILE_ID, stringify(profile), timestamp);
  }

  db.prepare("INSERT OR IGNORE INTO settings(key, value) VALUES ('use_browser_voice', '1')").run();
}

function currentProfile(db) {
  return getJsonRecord(db, 'profiles_local', LOCAL_PROFILE_ID);
}

function ensureAppointmentSlotFree(db, date, slot, ignoreId = null) {
  const rows = db.prepare('SELECT id, status FROM appointments_local WHERE scheduled_date = ? AND slot_number = ?').all(date, slot);
  const conflict = rows.find((row) => row.id !== ignoreId && ACTIVE_APPOINTMENT_STATUSES.has(row.status));
  if (conflict) {
    const error = new Error('Este slot já está ocupado para esta data');
    error.statusCode = 409;
    throw error;
  }
}

function normalizeAppointment(input, existing = null) {
  const timestamp = nowIso();
  const merged = {
    ...(existing || {}),
    ...input,
  };
  return {
    ...merged,
    id: existing?.id || input.id || randomUUID(),
    scheduled_date: String(merged.scheduled_date || ''),
    slot_number: Number(merged.slot_number || 0),
    patient_name: String(merged.patient_name || '').trim(),
    document_type: merged.document_type || 'CPF',
    document_value: String(merged.document_value || '').trim(),
    acs_name: String(merged.acs_name || '').trim(),
    home_visit_address: merged.home_visit_address ?? null,
    home_visit_reference: merged.home_visit_reference ?? null,
    home_visit_reason: merged.home_visit_reason ?? null,
    status: merged.status || 'Agendado',
    status_updated_at: input.status && input.status !== existing?.status ? timestamp : (merged.status_updated_at || timestamp),
    rescheduled_from_id: merged.rescheduled_from_id ?? null,
    rescheduled_to_id: merged.rescheduled_to_id ?? null,
    created_at: existing?.created_at || merged.created_at || timestamp,
    updated_at: timestamp,
  };
}

function saveAppointment(db, appointment, exists = false) {
  if (ACTIVE_APPOINTMENT_STATUSES.has(appointment.status)) {
    ensureAppointmentSlotFree(db, appointment.scheduled_date, appointment.slot_number, exists ? appointment.id : null);
  }
  if (exists) {
    db.prepare(`UPDATE appointments_local SET scheduled_date = ?, slot_number = ?, status = ?, data_json = ?, updated_at = ? WHERE id = ?`)
      .run(appointment.scheduled_date, appointment.slot_number, appointment.status, stringify(appointment), appointment.updated_at, appointment.id);
  } else {
    db.prepare(`INSERT INTO appointments_local(id, scheduled_date, slot_number, status, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(appointment.id, appointment.scheduled_date, appointment.slot_number, appointment.status, stringify(appointment), appointment.created_at, appointment.updated_at);
  }
}

function profileName(db, id) {
  if (!id) return null;
  const profile = id === LOCAL_PROFILE_ID ? currentProfile(db) : getJsonRecord(db, 'profiles_local', id);
  return profile?.full_name || null;
}

function hydrateProfile(record, idKey) {
  return record;
}

export function createExtendedApiHandler({ db, dataDir, broadcast }) {
  initExtendedSchema(db);

  const changed = (domain) => broadcast({ type: `${domain}-changed` });

  return async function handleExtendedApi(req, res, url) {
    if (serveMediaFile(req, res, url, dataDir)) return true;

    if (req.method === 'POST' && url.pathname === '/api/media') {
      const body = await readJson(req);
      const result = writeBase64File({
        dataDir,
        kind: String(body.kind || ''),
        fileName: String(body.fileName || 'arquivo'),
        mimeType: String(body.mimeType || 'application/octet-stream'),
        dataBase64: String(body.dataBase64 || ''),
      });
      sendJson(res, 201, result);
      return true;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/media') {
      const body = await readJson(req);
      deleteMediaFile(dataDir, body.storagePath);
      sendEmpty(res);
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/profile') {
      sendJson(res, 200, currentProfile(db));
      return true;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/profile') {
      const body = await readJson(req);
      const profile = { ...currentProfile(db), ...body, id: LOCAL_PROFILE_ID, updated_at: nowIso() };
      db.prepare('UPDATE profiles_local SET data_json = ?, updated_at = ? WHERE id = ?')
        .run(stringify(profile), profile.updated_at, LOCAL_PROFILE_ID);
      broadcast({ type: 'profile-changed', profile });
      sendJson(res, 200, profile);
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/destinations') {
      const rows = db.prepare("SELECT DISTINCT destination FROM patients WHERE TRIM(destination) <> '' ORDER BY destination COLLATE NOCASE").all();
      sendJson(res, 200, rows.map((row) => row.destination));
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/global-settings') {
      const voice = db.prepare("SELECT value FROM settings WHERE key = 'use_browser_voice'").get()?.value !== '0';
      sendJson(res, 200, { useBrowserVoice: voice });
      return true;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/global-settings') {
      const body = await readJson(req);
      if (typeof body.useBrowserVoice === 'boolean') {
        db.prepare("INSERT INTO settings(key, value) VALUES ('use_browser_voice', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
          .run(body.useBrowserVoice ? '1' : '0');
      }
      const value = db.prepare("SELECT value FROM settings WHERE key = 'use_browser_voice'").get()?.value !== '0';
      const settings = { useBrowserVoice: value };
      broadcast({ type: 'global-settings-changed', settings });
      sendJson(res, 200, settings);
      return true;
    }

    // Appointments ----------------------------------------------------------
    if (req.method === 'GET' && url.pathname === '/api/appointments') {
      const date = url.searchParams.get('date');
      const start = url.searchParams.get('start');
      const end = url.searchParams.get('end');
      let rows;
      if (date) {
        rows = selectJsonRecords(db, 'SELECT data_json FROM appointments_local WHERE scheduled_date = ? ORDER BY slot_number ASC', date);
      } else if (start && end) {
        rows = selectJsonRecords(db, 'SELECT data_json FROM appointments_local WHERE scheduled_date >= ? AND scheduled_date <= ? ORDER BY scheduled_date ASC, slot_number ASC', start, end);
      } else {
        rows = selectJsonRecords(db, 'SELECT data_json FROM appointments_local ORDER BY scheduled_date ASC, slot_number ASC');
      }
      sendJson(res, 200, rows);
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/appointments') {
      const body = await readJson(req);
      const appointment = normalizeAppointment(body);
      if (!appointment.scheduled_date || !appointment.slot_number || !appointment.patient_name || !appointment.document_value || !appointment.acs_name) {
        sendJson(res, 400, { error: 'Dados obrigatórios da marcação não foram informados.' });
        return true;
      }
      saveAppointment(db, appointment, false);
      changed('appointments');
      sendJson(res, 201, appointment);
      return true;
    }

    const appointmentMatch = url.pathname.match(/^\/api\/appointments\/([^/]+)$/);
    if (appointmentMatch && req.method === 'PATCH') {
      const id = decodeURIComponent(appointmentMatch[1]);
      const existing = getJsonRecord(db, 'appointments_local', id);
      if (!existing) {
        sendJson(res, 404, { error: 'Marcação não encontrada.' });
        return true;
      }
      const body = await readJson(req);
      const appointment = normalizeAppointment(body, existing);
      saveAppointment(db, appointment, true);
      changed('appointments');
      sendJson(res, 200, appointment);
      return true;
    }
    if (appointmentMatch && req.method === 'DELETE') {
      db.prepare('DELETE FROM appointments_local WHERE id = ?').run(decodeURIComponent(appointmentMatch[1]));
      changed('appointments');
      sendEmpty(res);
      return true;
    }

    const rescheduleMatch = url.pathname.match(/^\/api\/appointments\/([^/]+)\/reschedule$/);
    if (rescheduleMatch && req.method === 'POST') {
      const id = decodeURIComponent(rescheduleMatch[1]);
      const original = getJsonRecord(db, 'appointments_local', id);
      if (!original) {
        sendJson(res, 404, { error: 'Marcação original não encontrada.' });
        return true;
      }
      const body = await readJson(req);
      ensureAppointmentSlotFree(db, String(body.scheduledDate || ''), Number(body.slotNumber || 0));
      const replacement = normalizeAppointment({
        ...original,
        id: undefined,
        scheduled_date: String(body.scheduledDate || ''),
        slot_number: Number(body.slotNumber || 0),
        status: 'Agendado',
        rescheduled_from_id: original.id,
        rescheduled_to_id: null,
        created_at: undefined,
      });
      db.exec('BEGIN IMMEDIATE');
      try {
        const old = normalizeAppointment({ status: 'Remarcado', rescheduled_to_id: replacement.id }, original);
        saveAppointment(db, old, true);
        saveAppointment(db, replacement, false);
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      changed('appointments');
      sendJson(res, 200, replacement);
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/appointments/bulk-reschedule') {
      const body = await readJson(req);
      const sourceDate = String(body.sourceDate || '');
      const targetDate = String(body.targetDate || '');
      if (!sourceDate || !targetDate || sourceDate === targetDate) {
        sendJson(res, 400, { error: 'Datas de origem e destino são inválidas.' });
        return true;
      }
      const originals = selectJsonRecords(db, `SELECT data_json FROM appointments_local WHERE scheduled_date = ? AND status IN ('Agendado','Compareceu','Faltou') ORDER BY slot_number`, sourceDate);
      for (const item of originals) ensureAppointmentSlotFree(db, targetDate, item.slot_number);
      const movedSlots = [];
      db.exec('BEGIN IMMEDIATE');
      try {
        for (const original of originals) {
          const replacement = normalizeAppointment({
            ...original,
            id: undefined,
            scheduled_date: targetDate,
            status: 'Agendado',
            rescheduled_from_id: original.id,
            rescheduled_to_id: null,
            created_at: undefined,
          });
          const old = normalizeAppointment({ status: 'Remarcado', rescheduled_to_id: replacement.id }, original);
          saveAppointment(db, old, true);
          saveAppointment(db, replacement, false);
          movedSlots.push(Number(original.slot_number));
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      changed('appointments');
      sendJson(res, 200, { rescheduled_count: originals.length, source_date: sourceDate, target_date: targetDate, moved_slots: movedSlots });
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/appointments/slot-available') {
      const date = String(url.searchParams.get('date') || '');
      const slot = Number(url.searchParams.get('slot') || 0);
      const rows = db.prepare('SELECT status FROM appointments_local WHERE scheduled_date = ? AND slot_number = ?').all(date, slot);
      sendJson(res, 200, { available: !rows.some((row) => ACTIVE_APPOINTMENT_STATUSES.has(row.status)) });
      return true;
    }

    // Warnings --------------------------------------------------------------
    if (req.method === 'GET' && url.pathname === '/api/warnings') {
      const activeOnly = url.searchParams.get('active') === '1';
      const sql = activeOnly
        ? 'SELECT data_json FROM warnings_local WHERE active = 1 ORDER BY priority_order ASC, created_at DESC'
        : 'SELECT data_json FROM warnings_local ORDER BY priority_order ASC, created_at DESC';
      sendJson(res, 200, selectJsonRecords(db, sql));
      return true;
    }
    if (req.method === 'POST' && url.pathname === '/api/warnings') {
      const body = await readJson(req);
      const timestamp = nowIso();
      const warning = {
        id: randomUUID(),
        text: String(body.text || ''),
        background_url: body.background_url ?? null,
        active: body.active !== false,
        created_at: timestamp,
        media_type: body.media_type || 'image',
        qrcode_url: body.qrcode_url ?? null,
        start_time: body.start_time ?? null,
        end_time: body.end_time ?? null,
        audio_url: body.audio_url ?? null,
        duration: body.duration ?? null,
        priority: Boolean(body.priority),
        order: body.order ?? null,
        content_url: body.content_url ?? null,
        priority_order: Number(body.priority_order ?? 0),
        message: body.message ?? null,
      };
      db.prepare('INSERT INTO warnings_local(id, active, priority_order, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(warning.id, warning.active ? 1 : 0, warning.priority_order, stringify(warning), timestamp, timestamp);
      changed('warnings');
      sendJson(res, 201, warning);
      return true;
    }
    const warningMatch = url.pathname.match(/^\/api\/warnings\/([^/]+)$/);
    if (warningMatch && req.method === 'PATCH') {
      const id = decodeURIComponent(warningMatch[1]);
      const current = getJsonRecord(db, 'warnings_local', id);
      if (!current) { sendJson(res, 404, { error: 'Aviso não encontrado.' }); return true; }
      const body = await readJson(req);
      const warning = { ...current, ...body, id };
      db.prepare('UPDATE warnings_local SET active = ?, priority_order = ?, data_json = ?, updated_at = ? WHERE id = ?')
        .run(warning.active ? 1 : 0, Number(warning.priority_order ?? 0), stringify(warning), nowIso(), id);
      changed('warnings');
      sendJson(res, 200, warning);
      return true;
    }
    if (warningMatch && req.method === 'DELETE') {
      const id = decodeURIComponent(warningMatch[1]);
      const current = getJsonRecord(db, 'warnings_local', id);
      if (current?.content_url?.startsWith('/api/media/')) {
        const parts = current.content_url.split('/').slice(-2).map(decodeURIComponent);
        deleteMediaFile(dataDir, `${parts[0]}/${parts[1]}`);
      }
      db.prepare('DELETE FROM warnings_local WHERE id = ?').run(id);
      changed('warnings');
      sendEmpty(res);
      return true;
    }

    // Pendencias ------------------------------------------------------------
    if (req.method === 'GET' && url.pathname === '/api/pendencias') {
      const openOnly = url.searchParams.get('open') === '1';
      const sql = openOnly
        ? "SELECT data_json FROM pendencias_local WHERE status <> 'resolvido' ORDER BY created_at DESC"
        : 'SELECT data_json FROM pendencias_local ORDER BY created_at DESC';
      sendJson(res, 200, selectJsonRecords(db, sql));
      return true;
    }
    if (req.method === 'POST' && url.pathname === '/api/pendencias') {
      const body = await readJson(req);
      const timestamp = nowIso();
      const item = {
        id: randomUUID(),
        nome_paciente: String(body.nome_paciente || '').trim(),
        cns_cpf: String(body.cns_cpf || '').trim(),
        tipo: String(body.tipo || '').trim(),
        resumo: body.resumo?.trim() || null,
        status: 'aberto',
        prioridade: body.prioridade || 'normal',
        prazo: body.prazo || null,
        responsavel: body.responsavel?.trim() || null,
        created_by: LOCAL_PROFILE_ID,
        created_at: timestamp,
        updated_at: timestamp,
        resolved_at: null,
      };
      db.prepare('INSERT INTO pendencias_local(id, status, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(item.id, item.status, stringify(item), timestamp, timestamp);
      changed('pendencias');
      sendJson(res, 201, item);
      return true;
    }
    const pendenciaMatch = url.pathname.match(/^\/api\/pendencias\/([^/]+)$/);
    if (pendenciaMatch && req.method === 'PATCH') {
      const id = decodeURIComponent(pendenciaMatch[1]);
      const current = getJsonRecord(db, 'pendencias_local', id);
      if (!current) { sendJson(res, 404, { error: 'Pendência não encontrada.' }); return true; }
      const body = await readJson(req);
      const timestamp = nowIso();
      const status = body.status ?? current.status;
      const item = {
        ...current,
        ...body,
        id,
        resumo: body.resumo === undefined ? current.resumo : (body.resumo?.trim() || null),
        responsavel: body.responsavel === undefined ? current.responsavel : (body.responsavel?.trim() || null),
        prazo: body.prazo === undefined ? current.prazo : (body.prazo || null),
        status,
        updated_at: timestamp,
        resolved_at: status === 'resolvido' ? (current.resolved_at || timestamp) : null,
      };
      db.prepare('UPDATE pendencias_local SET status = ?, data_json = ?, updated_at = ? WHERE id = ?')
        .run(item.status, stringify(item), timestamp, id);
      changed('pendencias');
      sendJson(res, 200, item);
      return true;
    }
    if (pendenciaMatch && req.method === 'DELETE') {
      db.prepare('DELETE FROM pendencias_local WHERE id = ?').run(decodeURIComponent(pendenciaMatch[1]));
      changed('pendencias');
      sendEmpty(res);
      return true;
    }

    // Reception -------------------------------------------------------------
    if (req.method === 'GET' && url.pathname === '/api/reception/messages') {
      const rows = db.prepare('SELECT id, sender_id, sender_name, content, created_at FROM reception_messages_local ORDER BY created_at ASC LIMIT 200').all();
      sendJson(res, 200, rows);
      return true;
    }
    if (req.method === 'POST' && url.pathname === '/api/reception/messages') {
      const body = await readJson(req);
      const content = String(body.content || '').trim();
      if (!content) { sendEmpty(res); return true; }
      const profile = currentProfile(db);
      const message = {
        id: randomUUID(),
        sender_id: LOCAL_PROFILE_ID,
        sender_name: String(body.senderName || profile?.full_name || '').trim() || null,
        content,
        created_at: nowIso(),
      };
      db.prepare('INSERT INTO reception_messages_local(id, sender_id, sender_name, content, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(message.id, message.sender_id, message.sender_name, message.content, message.created_at);
      changed('reception');
      sendJson(res, 201, message);
      return true;
    }
    if (req.method === 'POST' && url.pathname === '/api/reception/reset') {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      db.prepare('DELETE FROM reception_messages_local WHERE created_at < ?').run(start);
      changed('reception');
      sendEmpty(res);
      return true;
    }
    if (req.method === 'GET' && url.pathname === '/api/reception/calls') {
      const date = String(url.searchParams.get('date') || '');
      const start = new Date(`${date}T00:00:00`).toISOString();
      const endDate = new Date(`${date}T00:00:00`);
      endDate.setDate(endDate.getDate() + 1);
      const end = endDate.toISOString();
      const rows = db.prepare(`SELECT id, patient_id AS patientId, patient_name AS patientName, destination, call_count AS callCount, called_at AS calledAt FROM calls WHERE called_at >= ? AND called_at < ? ORDER BY called_at DESC LIMIT 80`).all(start, end);
      sendJson(res, 200, rows);
      return true;
    }

    // Prescriptions ---------------------------------------------------------
    if (req.method === 'GET' && url.pathname === '/api/prescriptions') {
      sendJson(res, 200, selectJsonRecords(db, 'SELECT data_json FROM prescriptions_local ORDER BY created_at DESC'));
      return true;
    }
    if (req.method === 'POST' && url.pathname === '/api/prescriptions') {
      const body = await readJson(req);
      const timestamp = nowIso();
      const item = {
        id: randomUUID(),
        patient_name: String(body.patient_name || '').trim(),
        document_type: body.document_type || 'CPF',
        document_value: String(body.document_value || '').replace(/\D/g, ''),
        observation: body.observation?.trim() || null,
        address: body.address?.trim() || null,
        birth_date: body.birth_date || null,
        pdf_storage_path: null,
        pdf_url: null,
        status: 'pending',
        flags: Array.isArray(body.flags) ? body.flags : [],
        denial_reason: null,
        delivered_to: null,
        delivered_at: null,
        delivered_by: null,
        created_by: LOCAL_PROFILE_ID,
        created_at: timestamp,
        updated_at: timestamp,
      };
      db.prepare('INSERT INTO prescriptions_local(id, status, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(item.id, item.status, stringify(item), timestamp, timestamp);
      changed('prescriptions');
      sendJson(res, 201, item);
      return true;
    }
    const prescriptionMatch = url.pathname.match(/^\/api\/prescriptions\/([^/]+)$/);
    if (prescriptionMatch && req.method === 'PATCH') {
      const id = decodeURIComponent(prescriptionMatch[1]);
      const current = getJsonRecord(db, 'prescriptions_local', id);
      if (!current) { sendJson(res, 404, { error: 'Receita não encontrada.' }); return true; }
      const body = await readJson(req);
      const item = { ...current, ...body, id, updated_at: nowIso() };
      db.prepare('UPDATE prescriptions_local SET status = ?, data_json = ?, updated_at = ? WHERE id = ?')
        .run(item.status, stringify(item), item.updated_at, id);
      changed('prescriptions');
      sendJson(res, 200, item);
      return true;
    }
    if (prescriptionMatch && req.method === 'DELETE') {
      const id = decodeURIComponent(prescriptionMatch[1]);
      const current = getJsonRecord(db, 'prescriptions_local', id);
      deleteMediaFile(dataDir, current?.pdf_storage_path);
      db.prepare('DELETE FROM prescriptions_local WHERE id = ?').run(id);
      changed('prescriptions');
      sendEmpty(res);
      return true;
    }
    if (req.method === 'POST' && url.pathname === '/api/prescriptions/batch-delete') {
      const body = await readJson(req);
      const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
      db.exec('BEGIN IMMEDIATE');
      try {
        for (const id of ids) {
          const current = getJsonRecord(db, 'prescriptions_local', id);
          deleteMediaFile(dataDir, current?.pdf_storage_path);
          db.prepare('DELETE FROM prescriptions_local WHERE id = ?').run(id);
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      changed('prescriptions');
      sendEmpty(res);
      return true;
    }
    if (req.method === 'POST' && url.pathname === '/api/prescriptions/batch-status') {
      const body = await readJson(req);
      const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
      const status = String(body.status || 'pending');
      db.exec('BEGIN IMMEDIATE');
      try {
        for (const id of ids) {
          const current = getJsonRecord(db, 'prescriptions_local', id);
          if (!current) continue;
          const item = { ...current, status, updated_at: nowIso() };
          db.prepare('UPDATE prescriptions_local SET status = ?, data_json = ?, updated_at = ? WHERE id = ?')
            .run(status, stringify(item), item.updated_at, id);
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      changed('prescriptions');
      sendEmpty(res);
      return true;
    }

    // Wounds ---------------------------------------------------------------
    if (req.method === 'GET' && url.pathname === '/api/wounds/patients') {
      const search = String(url.searchParams.get('search') || '').toLocaleLowerCase('pt-BR');
      const anatomicalCode = String(url.searchParams.get('anatomicalCode') || '');
      const includeClosed = url.searchParams.get('includeClosed') === '1';
      const patients = selectJsonRecords(db, 'SELECT data_json FROM wound_patients_local WHERE active = 1 ORDER BY updated_at DESC');
      const result = patients
        .filter((patient) => !search || String(patient.full_name || '').toLocaleLowerCase('pt-BR').includes(search))
        .map((patient) => {
          let wounds = selectJsonRecords(db, 'SELECT data_json FROM wound_cases_local WHERE patient_id = ? ORDER BY updated_at DESC', patient.id);
          if (anatomicalCode) wounds = wounds.filter((wound) => wound.anatomical_code === anatomicalCode);
          if (!includeClosed) wounds = wounds.filter((wound) => wound.status !== 'encerrada');
          return {
            ...patient,
            wounds: wounds.map(({ id, status, anatomical_code, updated_at, closure_type }) => ({ id, status, anatomical_code, updated_at, closure_type })),
            open_wounds_count: wounds.filter((wound) => wound.status !== 'encerrada').length,
            latest_wound_updated_at: wounds.map((wound) => wound.updated_at).filter(Boolean).sort().reverse()[0] || null,
          };
        })
        .filter((patient) => patient.wounds.length > 0 || includeClosed);
      sendJson(res, 200, result);
      return true;
    }
    if (req.method === 'POST' && url.pathname === '/api/wounds/patients') {
      const body = await readJson(req);
      const timestamp = nowIso();
      const patient = {
        id: randomUUID(), unit_id: body.unit_id ?? null, full_name: String(body.full_name || '').trim(),
        document_type: body.document_type || 'CPF', document_value: String(body.document_value || '').trim(),
        created_by: LOCAL_PROFILE_ID, updated_by: null, created_at: timestamp, updated_at: timestamp, active: true,
      };
      db.prepare('INSERT INTO wound_patients_local(id, active, data_json, created_at, updated_at) VALUES (?, 1, ?, ?, ?)')
        .run(patient.id, stringify(patient), timestamp, timestamp);
      changed('wounds');
      sendJson(res, 201, patient);
      return true;
    }
    const woundPatientMatch = url.pathname.match(/^\/api\/wounds\/patients\/([^/]+)$/);
    if (woundPatientMatch && req.method === 'PATCH') {
      const id = decodeURIComponent(woundPatientMatch[1]);
      const current = getJsonRecord(db, 'wound_patients_local', id);
      if (!current) { sendJson(res, 404, { error: 'Paciente não encontrado.' }); return true; }
      const body = await readJson(req);
      const patient = { ...current, ...body, id, updated_by: LOCAL_PROFILE_ID, updated_at: nowIso() };
      db.prepare('UPDATE wound_patients_local SET active = ?, data_json = ?, updated_at = ? WHERE id = ?')
        .run(patient.active === false ? 0 : 1, stringify(patient), patient.updated_at, id);
      changed('wounds');
      sendJson(res, 200, patient);
      return true;
    }
    if (woundPatientMatch && req.method === 'DELETE') {
      const id = decodeURIComponent(woundPatientMatch[1]);
      const paths = db.prepare('SELECT storage_path FROM wound_photos_local WHERE wound_id IN (SELECT id FROM wound_cases_local WHERE patient_id = ?)').all(id);
      for (const row of paths) deleteMediaFile(dataDir, row.storage_path);
      db.prepare('DELETE FROM wound_patients_local WHERE id = ?').run(id);
      changed('wounds');
      sendEmpty(res);
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/wounds/cases') {
      const patientId = String(url.searchParams.get('patientId') || '');
      const status = String(url.searchParams.get('status') || 'all');
      let rows = selectJsonRecords(db, 'SELECT data_json FROM wound_cases_local WHERE patient_id = ? ORDER BY updated_at DESC', patientId);
      if (status !== 'all') rows = rows.filter((row) => row.status === status);
      sendJson(res, 200, rows);
      return true;
    }
    if (req.method === 'POST' && url.pathname === '/api/wounds/cases') {
      const body = await readJson(req);
      const timestamp = nowIso();
      const wound = {
        id: randomUUID(), patient_id: String(body.patient_id || ''), unit_id: body.unit_id ?? null,
        status: 'ativa', closure_type: null, closure_date: null, closure_reason: null, closed_by: null,
        started_at: body.started_at, etiology: String(body.etiology || '').trim(), classification: body.classification?.trim() || null,
        anatomical_region: body.anatomical_region || null, anatomical_subregion: body.anatomical_subregion || null,
        anatomical_code: String(body.anatomical_code || ''), comorbidities: body.comorbidities ?? [],
        initial_bed_aspect: body.initial_bed_aspect ?? [], initial_edges: body.initial_edges ?? [], version: 1,
        last_entry_at: null, created_by: LOCAL_PROFILE_ID, updated_by: null, created_at: timestamp, updated_at: timestamp,
      };
      db.prepare('INSERT INTO wound_cases_local(id, patient_id, status, anatomical_code, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(wound.id, wound.patient_id, wound.status, wound.anatomical_code, stringify(wound), timestamp, timestamp);
      changed('wounds');
      sendJson(res, 201, wound);
      return true;
    }
    const woundCaseMatch = url.pathname.match(/^\/api\/wounds\/cases\/([^/]+)$/);
    if (woundCaseMatch && req.method === 'GET') {
      const wound = getJsonRecord(db, 'wound_cases_local', decodeURIComponent(woundCaseMatch[1]));
      if (!wound) { sendJson(res, 404, { error: 'Ferida não encontrada.' }); return true; }
      const patient = getJsonRecord(db, 'wound_patients_local', wound.patient_id);
      sendJson(res, 200, { wound, patient: patient ? { full_name: patient.full_name, document_type: patient.document_type, document_value: patient.document_value } : null });
      return true;
    }
    if (woundCaseMatch && req.method === 'PATCH') {
      const id = decodeURIComponent(woundCaseMatch[1]);
      const current = getJsonRecord(db, 'wound_cases_local', id);
      if (!current) { sendJson(res, 404, { error: 'Ferida não encontrada.' }); return true; }
      const body = await readJson(req);
      const wound = { ...current, ...body, id, updated_by: LOCAL_PROFILE_ID, updated_at: nowIso(), version: Number(current.version || 1) + 1 };
      db.prepare('UPDATE wound_cases_local SET status = ?, anatomical_code = ?, data_json = ?, updated_at = ? WHERE id = ?')
        .run(wound.status, wound.anatomical_code, stringify(wound), wound.updated_at, id);
      changed('wounds');
      sendJson(res, 200, wound);
      return true;
    }

    const closeMatch = url.pathname.match(/^\/api\/wounds\/cases\/([^/]+)\/close$/);
    if (closeMatch && req.method === 'POST') {
      const id = decodeURIComponent(closeMatch[1]);
      const current = getJsonRecord(db, 'wound_cases_local', id);
      if (!current) { sendJson(res, 404, { error: 'Ferida não encontrada.' }); return true; }
      const body = await readJson(req);
      if (Number(body.expected_version) !== Number(current.version)) { sendJson(res, 409, { error: 'A ferida foi alterada em outro posto. Atualize a tela.' }); return true; }
      const timestamp = nowIso();
      const wound = { ...current, status: 'encerrada', closure_type: body.closure_type, closure_date: body.closure_date, closure_reason: body.closure_reason, closed_by: body.closed_by || LOCAL_PROFILE_ID, updated_by: LOCAL_PROFILE_ID, updated_at: timestamp, version: Number(current.version || 1) + 1 };
      const event = { id: randomUUID(), wound_id: id, event_type: 'closed', closure_type: wound.closure_type, reason: wound.closure_reason, event_date: wound.closure_date, performed_by: wound.closed_by, created_at: timestamp, payload: { previous_status: current.status } };
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('UPDATE wound_cases_local SET status = ?, data_json = ?, updated_at = ? WHERE id = ?').run(wound.status, stringify(wound), timestamp, id);
        db.prepare('INSERT INTO wound_status_events_local(id, wound_id, data_json, created_at) VALUES (?, ?, ?, ?)').run(event.id, id, stringify(event), timestamp);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
      changed('wounds');
      sendJson(res, 200, wound);
      return true;
    }
    const reopenMatch = url.pathname.match(/^\/api\/wounds\/cases\/([^/]+)\/reopen$/);
    if (reopenMatch && req.method === 'POST') {
      const id = decodeURIComponent(reopenMatch[1]);
      const current = getJsonRecord(db, 'wound_cases_local', id);
      if (!current) { sendJson(res, 404, { error: 'Ferida não encontrada.' }); return true; }
      const body = await readJson(req);
      if (Number(body.expected_version) !== Number(current.version)) { sendJson(res, 409, { error: 'A ferida foi alterada em outro posto. Atualize a tela.' }); return true; }
      const timestamp = nowIso();
      const performedBy = body.reopened_by || LOCAL_PROFILE_ID;
      const wound = { ...current, status: 'acompanhamento', closure_type: null, closure_date: null, closure_reason: null, closed_by: null, updated_by: LOCAL_PROFILE_ID, updated_at: timestamp, version: Number(current.version || 1) + 1 };
      const event = { id: randomUUID(), wound_id: id, event_type: 'reopened', closure_type: null, reason: String(body.reason || ''), event_date: timestamp.slice(0, 10), performed_by: performedBy, created_at: timestamp, payload: { previous_status: current.status } };
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('UPDATE wound_cases_local SET status = ?, data_json = ?, updated_at = ? WHERE id = ?').run(wound.status, stringify(wound), timestamp, id);
        db.prepare('INSERT INTO wound_status_events_local(id, wound_id, data_json, created_at) VALUES (?, ?, ?, ?)').run(event.id, id, stringify(event), timestamp);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
      changed('wounds');
      sendJson(res, 200, wound);
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/wounds/entries') {
      const woundId = String(url.searchParams.get('woundId') || '');
      const entries = selectJsonRecords(db, 'SELECT data_json FROM wound_entries_local WHERE wound_id = ? ORDER BY recorded_at DESC', woundId)
        .map((entry) => ({ ...entry, profiles: { full_name: profileName(db, entry.professional_id) } }));
      sendJson(res, 200, entries);
      return true;
    }
    if (req.method === 'POST' && url.pathname === '/api/wounds/entries') {
      const body = await readJson(req);
      const timestamp = nowIso();
      const length = body.measure_length_cm == null ? null : Number(body.measure_length_cm);
      const width = body.measure_width_cm == null ? null : Number(body.measure_width_cm);
      const entry = {
        id: randomUUID(), wound_id: String(body.wound_id || ''), recorded_at: body.recorded_at || timestamp,
        professional_id: body.professional_id || LOCAL_PROFILE_ID, measure_length_cm: length, measure_width_cm: width,
        measure_depth_cm: body.measure_depth_cm ?? null, area_cm2: length != null && width != null ? Number((length * width).toFixed(2)) : null,
        bed_aspect: body.bed_aspect ?? [], edges: body.edges ?? [], exudate: body.exudate ?? null, odor: body.odor ?? null,
        perilesional_skin: body.perilesional_skin ?? [], pain_scale: body.pain_scale ?? null,
        uses_antibiotic: Boolean(body.uses_antibiotic), antibiotic_type: body.antibiotic_type || null,
        uses_ointment: Boolean(body.uses_ointment), ointment_type: body.ointment_type || null,
        dressing_type: body.dressing_type || null, dressing_notes: body.dressing_notes || null,
        non_conformity_detected: Boolean(body.non_conformity_detected), non_conformity_type: body.non_conformity_type || null,
        non_conformity_description: body.non_conformity_description || null, non_conformity_action: body.non_conformity_action || null,
        observations: body.observations || null, next_change_date: body.next_change_date || null, created_at: timestamp,
      };
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT INTO wound_entries_local(id, wound_id, recorded_at, data_json, created_at) VALUES (?, ?, ?, ?, ?)').run(entry.id, entry.wound_id, entry.recorded_at, stringify(entry), timestamp);
        const wound = getJsonRecord(db, 'wound_cases_local', entry.wound_id);
        if (wound) {
          const updated = { ...wound, last_entry_at: entry.recorded_at, updated_at: timestamp, updated_by: LOCAL_PROFILE_ID, version: Number(wound.version || 1) + 1 };
          db.prepare('UPDATE wound_cases_local SET data_json = ?, updated_at = ? WHERE id = ?').run(stringify(updated), timestamp, entry.wound_id);
        }
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
      changed('wounds');
      sendJson(res, 201, { ...entry, profiles: { full_name: profileName(db, entry.professional_id) } });
      return true;
    }
    const woundEntryMatch = url.pathname.match(/^\/api\/wounds\/entries\/([^/]+)$/);
    if (woundEntryMatch && req.method === 'PATCH') {
      const id = decodeURIComponent(woundEntryMatch[1]);
      const current = getJsonRecord(db, 'wound_entries_local', id);
      if (!current) { sendJson(res, 404, { error: 'Evolução não encontrada.' }); return true; }
      const body = await readJson(req);
      const entry = { ...current, ...body, id };
      if (entry.measure_length_cm != null && entry.measure_width_cm != null) entry.area_cm2 = Number((Number(entry.measure_length_cm) * Number(entry.measure_width_cm)).toFixed(2));
      db.prepare('UPDATE wound_entries_local SET recorded_at = ?, data_json = ? WHERE id = ?').run(entry.recorded_at, stringify(entry), id);
      changed('wounds');
      sendJson(res, 200, { ...entry, profiles: { full_name: profileName(db, entry.professional_id) } });
      return true;
    }
    if (woundEntryMatch && req.method === 'DELETE') {
      const id = decodeURIComponent(woundEntryMatch[1]);
      const photos = db.prepare('SELECT storage_path FROM wound_photos_local WHERE entry_id = ?').all(id);
      for (const photo of photos) deleteMediaFile(dataDir, photo.storage_path);
      db.prepare('DELETE FROM wound_entries_local WHERE id = ?').run(id);
      changed('wounds');
      sendEmpty(res);
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/wounds/photos') {
      const woundId = String(url.searchParams.get('woundId') || '');
      sendJson(res, 200, selectJsonRecords(db, 'SELECT data_json FROM wound_photos_local WHERE wound_id = ? AND deleted_at IS NULL ORDER BY captured_at DESC, display_order ASC', woundId));
      return true;
    }
    if (req.method === 'POST' && url.pathname === '/api/wounds/photos') {
      const body = await readJson(req);
      const timestamp = nowIso();
      const photo = {
        id: randomUUID(), wound_id: String(body.wound_id || ''), entry_id: body.entry_id || null,
        storage_path: String(body.storage_path || ''), captured_at: body.captured_at || timestamp,
        display_order: Number(body.display_order ?? 0), description: body.description ?? null, is_primary: Boolean(body.is_primary),
        created_by: LOCAL_PROFILE_ID, created_at: timestamp, deleted_at: null, deleted_by: null,
        latitude: body.latitude ?? null, longitude: body.longitude ?? null, location_source: body.location_source ?? null,
        location_captured_at: body.location_captured_at ?? null,
        signed_url: body.url || `/api/media/${String(body.storage_path || '').split('/').map(encodeURIComponent).join('/')}`,
      };
      db.prepare('INSERT INTO wound_photos_local(id, wound_id, entry_id, storage_path, deleted_at, captured_at, display_order, data_json, created_at) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)')
        .run(photo.id, photo.wound_id, photo.entry_id, photo.storage_path, photo.captured_at, photo.display_order, stringify(photo), timestamp);
      changed('wounds');
      sendJson(res, 201, photo);
      return true;
    }
    const woundPhotoMatch = url.pathname.match(/^\/api\/wounds\/photos\/([^/]+)$/);
    if (woundPhotoMatch && req.method === 'DELETE') {
      const id = decodeURIComponent(woundPhotoMatch[1]);
      const current = getJsonRecord(db, 'wound_photos_local', id);
      if (!current) { sendEmpty(res); return true; }
      const timestamp = nowIso();
      const photo = { ...current, deleted_at: timestamp, deleted_by: LOCAL_PROFILE_ID, is_primary: false, signed_url: null };
      db.prepare('UPDATE wound_photos_local SET deleted_at = ?, data_json = ? WHERE id = ?').run(timestamp, stringify(photo), id);
      deleteMediaFile(dataDir, current.storage_path);
      changed('wounds');
      sendEmpty(res);
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/wounds/events') {
      const woundId = String(url.searchParams.get('woundId') || '');
      const events = selectJsonRecords(db, 'SELECT data_json FROM wound_status_events_local WHERE wound_id = ? ORDER BY created_at DESC', woundId)
        .map((event) => ({ ...event, profiles: { full_name: profileName(db, event.performed_by) } }));
      sendJson(res, 200, events);
      return true;
    }

    return false;
  };
}
