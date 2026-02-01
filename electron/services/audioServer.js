import express from 'express';
import cors from 'cors';
import path from 'path';
import ip from 'ip';
import { app } from 'electron';

const serverApp = express();
const PORT = 3456; // Porta fixa para áudio interno
const AUDIO_DIR = path.join(app.getPath('userData'), 'temp_audio');

serverApp.use(cors());

// Servir arquivos estáticos da pasta de áudio
serverApp.use('/audio', express.static(AUDIO_DIR));

let server = null;

export function startAudioServer() {
  if (server) return;

  server = serverApp.listen(PORT, () => {
    console.log(`[AudioServer] Running at http://localhost:${PORT}`);
    console.log(`[AudioServer] Serving files from: ${AUDIO_DIR}`);
  });
}

export function getAudioUrl(filename) {
  const localIp = ip.address(); // Pega IP local da rede (ex: 192.168.1.X)
  return `http://${localIp}:${PORT}/audio/${filename}`;
}
