import fs from 'fs';
import path from 'path';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo de credenciais
const CREDENTIALS_PATH = path.join(__dirname, '../../electron/credentials/google-tts-key.json');
// Caminho para salvar áudios temporários
const AUDIO_TEMP_DIR = path.join(process.cwd(), 'temp/audio');

// Garantir que diretório temp existe
if (!fs.existsSync(AUDIO_TEMP_DIR)) {
  fs.mkdirSync(AUDIO_TEMP_DIR, { recursive: true });
}

let ttsClient = null;

// Inicializa o cliente TTS se as credenciais existirem
export function initializeTTS() {
  if (fs.existsSync(CREDENTIALS_PATH)) {
    try {
      ttsClient = new TextToSpeechClient({
        keyFilename: CREDENTIALS_PATH,
      });
      console.log('[TTS] Google Cloud TTS initialized successfully');
      return true;
    } catch (error) {
      console.error('[TTS] Failed to initialize Google Cloud TTS:', error);
      return false;
    }
  } else {
    console.warn('[TTS] Creating placeholder credentials file at:', CREDENTIALS_PATH);
    console.warn('[TTS] Please replace this file with your actual Google Cloud credentials JSON.');
    return false;
  }
}

/**
 * Gera áudio a partir de texto usando Google Cloud TTS
 * @param {string} text - Texto para falar
 * @returns {Promise<string>} - Caminho relativo do arquivo gerado (ex: 'call_123.mp3')
 */
export async function generateSpeech(text) {
  if (!ttsClient) {
    if (!initializeTTS()) {
      throw new Error('Google Cloud TTS not configured. Please add credentials.');
    }
  }

  const request = {
    input: { text: text },
    // Select the language and SSML voice gender (optional)
    voice: { languageCode: 'pt-BR', name: 'pt-BR-Wavenet-A' }, // Voz Neural Feminina A
    // select the type of audio encoding
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    // Performs the text-to-speech request
    const [response] = await ttsClient.synthesizeSpeech(request);
    
    // Nome único para o arquivo
    const filename = `call_${Date.now()}.mp3`;
    const filepath = path.join(AUDIO_TEMP_DIR, filename);

    // Salvar arquivo
    await fs.promises.writeFile(filepath, response.audioContent, 'binary');
    console.log(`[TTS] Generated audio file: ${filename}`);
    
    // Limpar arquivos antigos (opcional: manter apenas últimos 10 min)
    cleanupOldFiles();

    return filename; // Retorna apenas o nome para ser servido via HTTP
  } catch (error) {
    console.error('[TTS] Error generating speech:', error);
    throw error;
  }
}

async function cleanupOldFiles() {
  try {
    const files = await fs.promises.readdir(AUDIO_TEMP_DIR);
    const now = Date.now();
    const MAX_AGE = 10 * 60 * 1000; // 10 minutos

    for (const file of files) {
      if (!file.endsWith('.mp3')) continue;
      
      const filepath = path.join(AUDIO_TEMP_DIR, file);
      const stats = await fs.promises.stat(filepath);
      
      if (now - stats.mtimeMs > MAX_AGE) {
        await fs.promises.unlink(filepath);
        console.log(`[TTS] Cleaned up old file: ${file}`);
      }
    }
  } catch (err) {
    console.error('[TTS] Cleanup error:', err);
  }
}
