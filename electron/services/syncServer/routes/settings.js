import { settingsRepo } from '../../../database/index.js';
import { notifyDataUpdate } from '../socket.js';

export default function setupSettingsRoutes(app) {
    app.get('/api/settings', (req, res) => {
        try {
            const settings = settingsRepo.getAllSettings();
            res.json({ success: true, data: settings });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/settings/:key', (req, res) => {
        try {
            const value = settingsRepo.getSetting(req.params.key);
            res.json({ success: true, data: { key: req.params.key, value } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.put('/api/settings/:key', (req, res) => {
        try {
            const { value } = req.body;
            settingsRepo.setSetting(req.params.key, value);
            notifyDataUpdate('settings', 'update', { key: req.params.key, value });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
}
