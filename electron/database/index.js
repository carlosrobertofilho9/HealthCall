// Database module exports
export { initDatabase, getDatabase, closeDatabase, generateUUID, getUploadsPath, getTTSAudioPath, cleanupOrphanedTTSAudio } from './db.js';
export * as patientsRepo from './repo/patients.js';
export * as warningsRepo from './repo/warnings.js';
export * as settingsRepo from './repo/settings.js';
export * as authRepo from './repo/auth.js';
