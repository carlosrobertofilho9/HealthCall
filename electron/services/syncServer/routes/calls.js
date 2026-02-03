import { patientsRepo } from '../../../database/index.js';

export default function setupCallsRoutes(app) {
    app.get('/api/calls/last', (req, res) => {
        try {
            const lastCall = patientsRepo.getCallHistory(1)[0];
            if (!lastCall) {
                return res.json({ success: true, data: null });
            }
            const patient = patientsRepo.getPatientById(lastCall.id);
            res.json({ 
                success: true, 
                data: patient ? { 
                    patient, 
                    location: lastCall.destination 
                } : null 
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/calls/history', (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const history = patientsRepo.getCallHistory(limit);
            res.json({ success: true, data: history });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
}
