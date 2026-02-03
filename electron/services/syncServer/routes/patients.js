import { patientsRepo } from '../../../database/index.js';
import { validate } from '../utils.js';
import { notifyDataUpdate } from '../socket.js';

export default function setupPatientsRoutes(app) {
    app.get('/api/patients', (req, res) => {
        try {
            const patients = patientsRepo.listPatients();
            res.json({ success: true, data: patients });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/patients/waiting', (req, res) => {
        try {
            const patients = patientsRepo.getWaitingPatients();
            res.json({ success: true, data: patients });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/patients/:id', (req, res) => {
        try {
            const patient = patientsRepo.getPatientById(req.params.id);
            if (!patient) {
                return res.status(404).json({ success: false, error: 'Paciente não encontrado' });
            }
            res.json({ success: true, data: patient });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/patients', (req, res) => {
        try {
            const errors = validate({
                name: { required: true, type: 'string', maxLength: 100 },
                destination: { required: true, type: 'string', maxLength: 100 }
            }, req.body);

            if (errors.length > 0) {
                return res.status(400).json({ success: false, error: errors.join(', ') });
            }

            const { name, destination } = req.body;
            const patient = patientsRepo.addPatient({ name, destination });
            notifyDataUpdate('patients', 'insert', patient);
            res.json({ success: true, data: patient });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/patients/ficha', (req, res) => {
        try {
            const { destination } = req.body;
            const patient = patientsRepo.addPatientByNumber(destination);
            notifyDataUpdate('patients', 'insert', patient);
            res.json({ success: true, data: patient });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.put('/api/patients/:id', (req, res) => {
        try {
            const patient = patientsRepo.updatePatient(req.params.id, req.body);
            if (!patient) {
                return res.status(404).json({ success: false, error: 'Paciente não encontrado' });
            }
            notifyDataUpdate('patients', 'update', patient);
            res.json({ success: true, data: patient });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/patients/:id/call', (req, res) => {
        try {
            const { destination } = req.body;
            const patient = patientsRepo.callPatient(req.params.id, destination);
            if (!patient) {
                return res.status(404).json({ success: false, error: 'Paciente não encontrado' });
            }
            // Notifica especificamente sobre a chamada
            notifyDataUpdate('calls', 'insert', { 
                patient, 
                location: destination,
                timestamp: Date.now()
            });
            res.json({ success: true, data: patient });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.delete('/api/patients/:id', (req, res) => {
        try {
            const success = patientsRepo.removePatient(req.params.id);
            if (!success) {
                return res.status(404).json({ success: false, error: 'Paciente não encontrado' });
            }
            notifyDataUpdate('patients', 'delete', { id: req.params.id });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.delete('/api/patients', (req, res) => {
        try {
            patientsRepo.clearAllPatients();
            notifyDataUpdate('patients', 'clear');
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Destinations route is related to patients
    app.get('/api/destinations', (req, res) => {
        try {
            const destinations = patientsRepo.listPatients()
                .map(p => p.destination)
                .filter((v, i, a) => v && a.indexOf(v) === i);
            res.json({ success: true, data: destinations });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
}
