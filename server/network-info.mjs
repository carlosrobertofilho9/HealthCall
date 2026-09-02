import { hostname, networkInterfaces } from 'node:os';

function isIpv4Family(family) {
  return family === 'IPv4' || family === 4;
}

function isPrivateIpv4(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  return parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
}

export function getLocalNetworkInfo() {
  const seen = new Set();
  const addresses = [];

  for (const [interfaceName, entries] of Object.entries(networkInterfaces())) {
    for (const entry of entries || []) {
      if (!isIpv4Family(entry.family) || entry.internal || !entry.address || entry.address === '0.0.0.0') continue;
      if (seen.has(entry.address)) continue;
      seen.add(entry.address);
      addresses.push({
        interface: interfaceName,
        address: entry.address,
        private: isPrivateIpv4(entry.address),
      });
    }
  }

  addresses.sort((left, right) => {
    if (left.private !== right.private) return left.private ? -1 : 1;
    return left.interface.localeCompare(right.interface) || left.address.localeCompare(right.address);
  });

  return {
    hostname: hostname(),
    addresses: addresses.map(({ interface: interfaceName, address }) => ({ interface: interfaceName, address })),
  };
}

export function installNetworkInfoEndpoint(server) {
  const requestHandlers = server.listeners('request');
  if (requestHandlers.length !== 1) {
    throw new Error(`HealthCall esperava 1 handler HTTP antes de instalar a rota de rede, encontrou ${requestHandlers.length}.`);
  }

  const appHandler = requestHandlers[0];
  server.removeListener('request', appHandler);

  server.on('request', (req, res) => {
    let pathname = '/';
    try {
      pathname = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname;
    } catch {
      pathname = '/';
    }

    if (req.method === 'GET' && pathname === '/api/system/network') {
      const payload = getLocalNetworkInfo();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(payload));
      return;
    }

    Promise.resolve(appHandler.call(server, req, res)).catch((error) => {
      console.error('[HealthCall Local] Falha no handler HTTP:', error);
      if (!res.headersSent) {
        res.writeHead(500, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end(JSON.stringify({ error: 'Erro interno do servidor local.' }));
      } else if (!res.writableEnded) {
        res.end();
      }
    });
  });
}
