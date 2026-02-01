import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

const serverApp = express();
const PORT = 3456; // Porta fixa para mídia interna
const UPLOADS_DIR = path.join(app.getPath('userData'), 'uploads', 'warnings');
const WARNING_AUDIO_DIR = path.join(app.getPath('userData'), 'warning_audio');
const PATIENT_AUDIO_DIR = path.join(app.getPath('userData'), 'patient_audio');

// Garante que os diretórios existem
[UPLOADS_DIR, WARNING_AUDIO_DIR, PATIENT_AUDIO_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

serverApp.use(cors());

// Servir arquivos de mídia (imagens/vídeos) dos uploads
serverApp.use('/media', express.static(UPLOADS_DIR, {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (['.mp4', '.webm', '.mov'].includes(ext)) {
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }
}));

// Servir áudios pré-gerados para avisos
serverApp.use('/warning-audio', express.static(WARNING_AUDIO_DIR));

// Servir áudios pré-gerados para chamadas de pacientes
serverApp.use('/patient-audio', express.static(PATIENT_AUDIO_DIR));

let server = null;

export function startAudioServer() {
  if (server) return;

  server = serverApp.listen(PORT, () => {
    console.log(`[AudioServer] Running at http://localhost:${PORT}`);
    console.log(`[AudioServer] /media         -> ${UPLOADS_DIR}`);
    console.log(`[AudioServer] /warning-audio -> ${WARNING_AUDIO_DIR}`);
    console.log(`[AudioServer] /patient-audio -> ${PATIENT_AUDIO_DIR}`);
  });
}

/**
 * Converte URL local:// para URL HTTP servida pelo servidor local
 */
export function getMediaUrl(localUrl) {
  if (!localUrl) return localUrl;
  
  // Se já é uma URL HTTP, retorna como está
  if (localUrl.startsWith('http://') || localUrl.startsWith('https://')) {
    return localUrl;
  }
  
  // Se é URL local://, converte para HTTP
  if (localUrl.startsWith('local://')) {
    const filename = localUrl.replace('local://', '');
    return `http://localhost:${PORT}/media/${filename}`;
  }
  
  return localUrl;
}

/**
 * Retorna URL HTTP para um áudio pré-gerado de aviso
 */
export function getWarningAudioUrl(filename) {
  if (!filename) return null;
  return `http://localhost:${PORT}/warning-audio/${filename}`;
}

/**
 * Retorna URL HTTP para um áudio pré-gerado de paciente
 */
export function getPatientAudioUrl(filename) {
  if (!filename) return null;
  return `http://localhost:${PORT}/patient-audio/${filename}`;
}
