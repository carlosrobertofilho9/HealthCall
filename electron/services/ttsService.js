import fs from 'fs';
import path from 'path';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
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
  // Legacy initialization
  if (fs.existsSync(CREDENTIALS_PATH)) {
    try {
      ttsClient = new TextToSpeechClient({
        keyFilename: CREDENTIALS_PATH,
      });
      console.log('[TTS] Google Cloud TTS (Legacy) initialized successfully');
    } catch (error) {
      console.error('[TTS] Failed to initialize Google Cloud TTS (Legacy):', error);
    }
  } else {
    console.warn('[TTS] Legacy credentials not found at:', CREDENTIALS_PATH);
  }

  // GenAI check
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[TTS] GEMINI_API_KEY not found in environment variables. GenAI TTS will fail if used.');
  } else {
     console.log('[TTS] Google GenAI TTS ready (using GEMINI_API_KEY)');
  }
}

/**
 * Gera áudio a partir de texto usando Google GenAI (Gemini)
 * @param {string} text - Texto para falar
 * @returns {Promise<string>} - Caminho relativo do arquivo gerado (ex: 'call_123.wav')
 */
export async function generateSpeech(text) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[TTS] GEMINI_API_KEY missing, falling back to legacy TTS...');
    return generateSpeechLegacy(text);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const config = {
      temperature: 1,
      responseModalities: ['audio'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Charon',
          }
        }
      },
    };

    const model = 'gemini-2.5-flash-preview-tts';
    const contents = [
      {
        role: 'user',
        parts: [{ text }],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let combinedBuffer = Buffer.alloc(0);
    let fileExtension = 'wav'; // Default to wav if strictly audio

    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }

      const part = chunk.candidates[0].content.parts[0];
      if (part.inlineData) {
        const checkExt = mime.getExtension(part.inlineData.mimeType || '');
        if (checkExt) fileExtension = checkExt;

        let buffer = Buffer.from(part.inlineData.data || '', 'base64');
        
        // If it seems to be raw PCM or similar that needs header (based on user snippet logic)
        // actually user snippet says: if !fileExtension (meaning unknown mime), treat as wav and convert.
        // GenAI usually returns 'audio/wav' or 'audio/mp3' in mimeType.
        // If it sends raw PCM without mime, we might need the convertToWav logic.
        // Let's rely on mime type first.
        
        if (!checkExt && !part.inlineData.mimeType) {
           // Fallback logic from user snippet for raw data
           fileExtension = 'wav';
           buffer = convertToWav(part.inlineData.data || '', part.inlineData.mimeType || '');
        } else if (!checkExt && part.inlineData.mimeType) {
            // Mime exists but extension unknown?
            // Try to force wav if audio/wav
             if (part.inlineData.mimeType.includes('wav')) fileExtension = 'wav';
             else if (part.inlineData.mimeType.includes('mp3')) fileExtension = 'mp3';
        }

        combinedBuffer = Buffer.concat([combinedBuffer, buffer]);
      } 
    }

    if (combinedBuffer.length === 0) {
      throw new Error('No audio data received from GenAI');
    }

    const filename = `call_${Date.now()}.${fileExtension}`;
    const filepath = path.join(AUDIO_TEMP_DIR, filename);

    await fs.promises.writeFile(filepath, combinedBuffer);
    console.log(`[TTS] Generated GenAI audio file: ${filename}`);

    cleanupOldFiles();
    return filename;

  } catch (error) {
    console.error('[TTS] GenAI Error, trying legacy:', error);
    return generateSpeechLegacy(text);
  }
}

/**
 * Gera áudio a partir de texto usando Google Cloud TTS (Legacy)
 * @param {string} text - Texto para falar
 * @returns {Promise<string>} - Caminho relativo do arquivo gerado
 */
export async function generateSpeechLegacy(text) {
  if (!ttsClient) {
    // Tenta inicializar novamente
    initializeTTS();
    if (!ttsClient) {
       // Se ainda falhar, lança erro
       throw new Error('Google Cloud TTS legacy client not available.');
    }
  }

  const request = {
    input: { text: text },
    voice: { languageCode: 'pt-BR', name: 'pt-BR-Wavenet-A' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    const [response] = await ttsClient.synthesizeSpeech(request);
    
    const filename = `call_${Date.now()}.mp3`;
    const filepath = path.join(AUDIO_TEMP_DIR, filename);

    await fs.promises.writeFile(filepath, response.audioContent, 'binary');
    console.log(`[TTS] Generated Legacy audio file: ${filename}`);
    
    cleanupOldFiles();

    return filename;
  } catch (error) {
    console.error('[TTS] Error generating legacy speech:', error);
    throw error;
  }
}

async function cleanupOldFiles() {
  try {
    const files = await fs.promises.readdir(AUDIO_TEMP_DIR);
    const now = Date.now();
    const MAX_AGE = 10 * 60 * 1000; // 10 minutos

    for (const file of files) {
      if (!file.match(/\.(mp3|wav)$/)) continue;
      
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

// Helpers from User Snippet for WAV conversion if needed

function convertToWav(rawData, mimeType) {
  const options = parseMimeType(mimeType)
  const wavHeader = createWavHeader(rawData.length, options);
  const buffer = Buffer.from(rawData, 'base64');

  return Buffer.concat([wavHeader, buffer]);
}

function parseMimeType(mimeType) {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [_, format] = fileType.split('/');

  const options = {
    numChannels: 1,
    sampleRate: 24000, // Default if not found
    bitsPerSample: 16  // Default if not found
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options;
}

function createWavHeader(dataLength, options) {
  const {
    numChannels,
    sampleRate,
    bitsPerSample,
  } = options;

  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);                      // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
  buffer.write('WAVE', 8);                      // Format
  buffer.write('fmt ', 12);                     // Subchunk1ID
  buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);        // NumChannels
  buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
  buffer.writeUInt32LE(byteRate, 28);           // ByteRate
  buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
  buffer.write('data', 36);                     // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size

  return buffer;
}
