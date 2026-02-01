import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para salvar áudios de pacientes (pré-gerados)
const PATIENT_AUDIO_DIR = path.join(app.getPath('userData'), 'patient_audio');
// Caminho para áudios de avisos (persistentes)
const WARNING_AUDIO_DIR = path.join(app.getPath('userData'), 'warning_audio');

// Garantir que diretórios existem
[PATIENT_AUDIO_DIR, WARNING_AUDIO_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Inicializa o TTS (agora usa sistema nativo)
export function initializeTTS() {
  const platform = process.platform;
  const platformName = platform === 'darwin' ? 'macOS (say)' : 
                       platform === 'win32' ? 'Windows (SAPI)' : 
                       'Linux (espeak)';
  console.log(`[TTS] Using native ${platformName} TTS`);
  console.log('[TTS] Patient audio dir:', PATIENT_AUDIO_DIR);
  console.log('[TTS] Warning audio dir:', WARNING_AUDIO_DIR);
}

/**
 * Gera áudio para chamada de paciente (pré-gerado quando paciente entra na fila)
 * @param {string} patientId - ID do paciente
 * @param {string} name - Nome do paciente
 * @param {string} destination - Destino da chamada
 * @returns {Promise<string>} - Nome do arquivo gerado
 */
export async function generatePatientAudio(patientId, name, destination) {
  const text = `Chamando ${name}, para ${destination}`;
  const filename = `patient_${patientId}.aiff`;
  const filepath = path.join(PATIENT_AUDIO_DIR, filename);
  
  try {
    // Se já existe, não regenera
    if (fs.existsSync(filepath)) {
      console.log(`[TTS] Patient audio already exists: ${filename}`);
      return filename;
    }
    
    await generateAudioFile(text, filepath);
    console.log(`[TTS] Generated patient audio: ${filename} ("${text}")`);
    
    return filename;
  } catch (error) {
    console.error('[TTS] Error generating patient audio:', error);
    return null;
  }
}

/**
 * Remove o arquivo de áudio de um paciente
 * @param {string} patientId - ID do paciente
 */
export function deletePatientAudio(patientId) {
  const filename = `patient_${patientId}.aiff`;
  const filepath = path.join(PATIENT_AUDIO_DIR, filename);
  
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`[TTS] Deleted patient audio: ${filename}`);
    }
  } catch (error) {
    console.error('[TTS] Error deleting patient audio:', error);
  }
}

/**
 * Gera áudio para um aviso (armazenado permanentemente até exclusão do aviso)
 * @param {string} text - Texto do aviso
 * @param {string} warningId - ID do aviso (usado como nome do arquivo)
 * @returns {Promise<string>} - Nome do arquivo gerado
 */
export async function generateWarningAudio(text, warningId) {
  if (!text || !text.trim()) {
    console.log('[TTS] No text provided for warning audio');
    return null;
  }
  
  const filename = `warning_${warningId}.aiff`;
  const filepath = path.join(WARNING_AUDIO_DIR, filename);
  
  try {
    // Se já existe, não regenera
    if (fs.existsSync(filepath)) {
      console.log(`[TTS] Warning audio already exists: ${filename}`);
      return filename;
    }
    
    await generateAudioFile(text, filepath);
    console.log(`[TTS] Generated warning audio: ${filename}`);
    
    return filename;
  } catch (error) {
    console.error('[TTS] Error generating warning audio:', error);
    return null;
  }
}

/**
 * Remove o arquivo de áudio de um aviso
 * @param {string} warningId - ID do aviso
 */
export function deleteWarningAudio(warningId) {
  const filename = `warning_${warningId}.aiff`;
  const filepath = path.join(WARNING_AUDIO_DIR, filename);
  
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`[TTS] Deleted warning audio: ${filename}`);
    }
  } catch (error) {
    console.error('[TTS] Error deleting warning audio:', error);
  }
}

/**
 * Gera arquivo de áudio usando TTS nativo do sistema
 * @param {string} text - Texto para converter
 * @param {string} outputPath - Caminho completo do arquivo de saída
 */
async function generateAudioFile(text, outputPath) {
  const platform = process.platform;
  
  // Escapa aspas no texto de forma mais robusta
  const escapedText = text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
  
  if (platform === 'darwin') {
    // macOS: usa comando 'say' com voz em português
    const voice = 'Luciana'; // Voz feminina brasileira
    const command = `say -v "${voice}" -o "${outputPath}" "${escapedText}"`;
    
    await execAsync(command);
    
  } else if (platform === 'win32') {
    // Windows: usa PowerShell com System.Speech (SAPI)
    // Escapa para PowerShell
    const psEscapedText = text.replace(/"/g, '""').replace(/'/g, "''");
    const psOutputPath = outputPath.replace(/\\/g, '\\\\');
    
    const psScript = `
      Add-Type -AssemblyName System.Speech;
      $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
      $voices = $synth.GetInstalledVoices();
      $ptVoice = $voices | Where-Object { $_.VoiceInfo.Culture.Name -like 'pt-*' } | Select-Object -First 1;
      if ($ptVoice) { $synth.SelectVoice($ptVoice.VoiceInfo.Name) };
      $synth.SetOutputToWaveFile('${psOutputPath}');
      $synth.Speak('${psEscapedText}');
      $synth.Dispose();
    `.replace(/\n/g, ' ');
    
    await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`);
    
  } else {
    // Linux: usa espeak (mais comum) ou pico2wave
    // espeak gera wav direto
    const linuxEscaped = text.replace(/"/g, '\\"');
    const command = `espeak -v pt-br -w "${outputPath}" "${linuxEscaped}" 2>/dev/null || pico2wave -l pt-BR -w "${outputPath}" "${linuxEscaped}"`;
    
    await execAsync(command);
  }
}

/**
 * Retorna o caminho do diretório de áudios de pacientes
 */
export function getPatientAudioDir() {
  return PATIENT_AUDIO_DIR;
}

/**
 * Retorna o caminho do diretório de áudios de avisos
 */
export function getWarningAudioDir() {
  return WARNING_AUDIO_DIR;
}
