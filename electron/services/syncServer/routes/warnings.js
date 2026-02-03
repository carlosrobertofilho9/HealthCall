import { warningsRepo } from '../../../database/index.js';
import { validate } from '../utils.js';
import { notifyDataUpdate } from '../socket.js';
import { generateWarningAudio, deleteWarningAudio } from '../../ttsService.js';
import { getMediaUrl, getWarningAudioUrl } from '../../audioServer.js';

export default function setupWarningsRoutes(app) {
    app.get('/api/warnings', (req, res) => {
        try {
            const warnings = warningsRepo.listWarnings();
            // Converte URLs locais para HTTP
            const processedWarnings = warnings.map(w => ({
                ...w,
                media_url: getMediaUrl(w.media_url),
                audio_url: w.audio_url ? getWarningAudioUrl(w.audio_url.split('/').pop()) : null
            }));
            res.json({ success: true, data: processedWarnings });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/warnings/active', (req, res) => {
        try {
            const warnings = warningsRepo.listActiveWarnings();
            // Converte URLs locais para HTTP
            const processedWarnings = warnings.map(w => ({
                ...w,
                media_url: getMediaUrl(w.media_url),
                audio_url: w.audio_url ? getWarningAudioUrl(w.audio_url.split('/').pop()) : null
            }));
            res.json({ success: true, data: processedWarnings });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/warnings/:id', (req, res) => {
        try {
            const warning = warningsRepo.getWarningById(req.params.id);
            if (!warning) {
                return res.status(404).json({ success: false, error: 'Aviso não encontrado' });
            }
            res.json({ 
                success: true, 
                data: {
                    ...warning,
                    media_url: getMediaUrl(warning.media_url),
                    audio_url: warning.audio_url ? getWarningAudioUrl(warning.audio_url.split('/').pop()) : null
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/warnings', (req, res) => {
        try {
            // Validation (loose for warnings as structures vary, but text/priority checks help)
            const errors = validate({
                text: { required: true, type: 'string', maxLength: 500 },
                priority: { type: 'number' }
            }, req.body);

            if (errors.length > 0) {
                return res.status(400).json({ success: false, error: errors.join(', ') });
            }

            // Pass request body directly to support preserving ID during sync
            const warning = warningsRepo.addWarning(req.body);

            // Generate Audio if text exists
            if (warning.text) {
                generateWarningAudio(warning.text, warning.id)
                    .then(audioFilename => {
                        if (audioFilename) {
                            warningsRepo.updateWarning(warning.id, { audio_url: audioFilename });
                            // Notify again with audio so clients get the audio URL
                            notifyDataUpdate('warnings', 'update', { id: warning.id, audio_url: audioFilename });
                        }
                    })
                    .catch(err => console.error('[SyncServer] TTS generation failed:', err));
            }

            notifyDataUpdate('warnings', 'insert', warning);
            res.json({ success: true, data: warning });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.put('/api/warnings/:id', (req, res) => {
        try {
            const currentWarning = warningsRepo.getWarningById(req.params.id);
            const warning = warningsRepo.updateWarning(req.params.id, req.body);
            if (!warning) {
                return res.status(404).json({ success: false, error: 'Aviso não encontrado' });
            }

            // Regenerate audio if text changed
            if (req.body.text && currentWarning && req.body.text !== currentWarning.text) {
                 deleteWarningAudio(req.params.id);
                 generateWarningAudio(req.body.text, req.params.id)
                    .then(audioFilename => {
                        if (audioFilename) {
                            warningsRepo.updateWarning(warning.id, { audio_url: audioFilename });
                            notifyDataUpdate('warnings', 'update', { id: warning.id, audio_url: audioFilename });
                        }
                    })
                    .catch(err => console.error('[SyncServer] TTS regeneration failed:', err));
            }

            notifyDataUpdate('warnings', 'update', warning);
            res.json({ success: true, data: warning });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.delete('/api/warnings/:id', (req, res) => {
        try {
            const success = warningsRepo.removeWarning(req.params.id);
            if (!success) {
                return res.status(404).json({ success: false, error: 'Aviso não encontrado' });
            }
            notifyDataUpdate('warnings', 'delete', { id: req.params.id });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/warnings/:id/toggle', (req, res) => {
        try {
            const warning = warningsRepo.toggleWarningActive(req.params.id);
            if (!warning) {
                return res.status(404).json({ success: false, error: 'Aviso não encontrado' });
            }
            notifyDataUpdate('warnings', 'update', warning);
            res.json({ success: true, data: warning });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/warnings/reorder', (req, res) => {
        try {
            const { ids } = req.body;
            if (!Array.isArray(ids)) {
                return res.status(400).json({ success: false, error: 'Ids must be an array' });
            }
            const warnings = warningsRepo.reorderWarnings(ids);
            notifyDataUpdate('warnings', 'reorder', warnings);
            res.json({ success: true, data: warnings });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/upload', (req, res) => {
        try {
            const { buffer, filename } = req.body;
            if (!buffer || !filename) {
                return res.status(400).json({ success: false, error: 'Buffer and filename are required' });
            }
            // Decode base64 buffer
            const fileBuffer = Buffer.from(buffer, 'base64');
            const url = warningsRepo.saveMediaFile(fileBuffer, filename);
            const fullUrl = getMediaUrl(url); // Return the serving URL
            
            res.json({ success: true, data: fullUrl, localPath: url }); // localPath might be useful for internal logic
        } catch (error) {
            console.error('[SyncServer] Upload error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
}
