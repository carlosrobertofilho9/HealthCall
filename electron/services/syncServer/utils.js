import os from 'os';
import { SYNC_PORT } from './config.js';

/**
 * Obtém todos os IPs da máquina na rede
 */
export function getNetworkAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Pula endereços internos e IPv6
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({
                    interface: name,
                    address: iface.address,
                    url: `http://${iface.address}:${SYNC_PORT}`
                });
            }
        }
    }
    
    // Adiciona localhost também
    addresses.unshift({
        interface: 'localhost',
        address: '127.0.0.1',
        url: `http://127.0.0.1:${SYNC_PORT}`
    });
    
    return addresses;
}

/**
 * Helper: Input Validation
 */
export const validate = (schema, data) => {
    const errors = [];
    for (const [key, rules] of Object.entries(schema)) {
        if (rules.required && (data[key] === undefined || data[key] === null || data[key] === '')) {
            errors.push(`${key} is required`);
            continue;
        }
        if (data[key] !== undefined) {
            if (rules.type && typeof data[key] !== rules.type) {
                errors.push(`${key} must be of type ${rules.type}`);
            }
            if (rules.maxLength && data[key].length > rules.maxLength) {
                errors.push(`${key} must be at most ${rules.maxLength} characters`);
            }
        }
    }
    return errors;
};
