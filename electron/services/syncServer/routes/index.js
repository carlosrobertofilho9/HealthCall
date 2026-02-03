import setupPatientsRoutes from './patients.js';
import setupCallsRoutes from './calls.js';
import setupWarningsRoutes from './warnings.js';
import setupSettingsRoutes from './settings.js';
import state from '../state.js';
import { getNetworkAddresses } from '../utils.js';

export default function setupRoutes(app) {
    // Status Route
    app.get('/api/status', (req, res) => {
        res.json({
            success: true,
            server: 'HealthCall Sync Server',
            version: '1.0.0',
            clients: state.connectedClients.size,
            addresses: getNetworkAddresses(),
            timestamp: Date.now()
        });
    });

    setupPatientsRoutes(app);
    setupCallsRoutes(app);
    setupWarningsRoutes(app);
    setupSettingsRoutes(app);
}
