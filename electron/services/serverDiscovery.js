/**
 * Serviço de Descoberta de Servidor
 * 
 * Responsável por:
 * 1. Descobrir servidores HealthCall na rede local
 * 2. Verificar se já existe um servidor rodando
 * 3. Decidir se esta instância deve ser servidor ou cliente
 */

import http from 'http';
import os from 'os';
import net from 'net';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const SYNC_PORT = 3457;
const DISCOVERY_TIMEOUT = 2000; // 2 segundos por IP
const CONFIG_FILE = 'sync-config.json';

/**
 * Obtém o caminho do arquivo de configuração
 */
function getConfigPath() {
  return path.join(app.getPath('userData'), CONFIG_FILE);
}

/**
 * Salva a configuração de sincronização
 */
function saveConfig(config) {
  try {
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('[Discovery] Configuração salva:', config);
  } catch (error) {
    console.error('[Discovery] Erro ao salvar configuração:', error);
  }
}

/**
 * Carrega a configuração de sincronização
 */
function loadConfig() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[Discovery] Erro ao carregar configuração:', error);
  }
  return null;
}

/**
 * Verifica se um servidor HealthCall está rodando em um IP específico
 */
function checkServer(ip, port = SYNC_PORT) {
  return new Promise((resolve) => {
    const url = `http://${ip}:${port}/api/status`;
    
    const req = http.get(url, { timeout: DISCOVERY_TIMEOUT }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const status = JSON.parse(data);
          if (status.success && status.server === 'HealthCall Sync Server') {
            resolve({
              found: true,
              ip,
              port,
              url: `http://${ip}:${port}`,
              wsUrl: `ws://${ip}:${port}`,
              version: status.version,
              clients: status.clients
            });
          } else {
            resolve({ found: false });
          }
        } catch {
          resolve({ found: false });
        }
      });
    });

    req.on('error', () => resolve({ found: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ found: false });
    });
  });
}

/**
 * Obtém todos os IPs da rede local para varredura
 */
function getLocalNetworkRange() {
  const interfaces = os.networkInterfaces();
  const ranges = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Pular loopback e IPv6
      if (iface.family === 'IPv4' && !iface.internal) {
        const parts = iface.address.split('.');
        const baseIP = parts.slice(0, 3).join('.');
        ranges.push({
          interface: name,
          localIP: iface.address,
          baseIP,
          // Vamos escanear apenas alguns IPs comuns (não toda a faixa /24)
          // para não demorar muito
          scanIPs: generateScanIPs(baseIP, iface.address)
        });
      }
    }
  }

  return ranges;
}

/**
 * Gera lista de IPs para varredura (otimizada)
 */
function generateScanIPs(baseIP, localIP) {
  const ips = [];
  const localLast = parseInt(localIP.split('.')[3]);
  
  // Prioridade 1: IPs próximos ao local (±10)
  for (let i = Math.max(1, localLast - 10); i <= Math.min(254, localLast + 10); i++) {
    const ip = `${baseIP}.${i}`;
    if (ip !== localIP) {
      ips.push(ip);
    }
  }
  
  // Prioridade 2: IPs comuns de servidores/roteadores
  const commonIPs = [1, 2, 100, 101, 102, 200, 254];
  for (const i of commonIPs) {
    const ip = `${baseIP}.${i}`;
    if (!ips.includes(ip) && ip !== localIP) {
      ips.push(ip);
    }
  }
  
  return ips;
}

/**
 * Descobre servidores HealthCall na rede local
 */
async function discoverServers(onProgress) {
  console.log('[Discovery] Iniciando varredura da rede...');
  const ranges = getLocalNetworkRange();
  const foundServers = [];
  
  for (const range of ranges) {
    console.log(`[Discovery] Varrendo interface ${range.interface} (${range.localIP})`);
    
    // Verificar IPs em paralelo (em lotes de 10)
    const batchSize = 10;
    for (let i = 0; i < range.scanIPs.length; i += batchSize) {
      const batch = range.scanIPs.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(ip => checkServer(ip)));
      
      for (const result of results) {
        if (result.found) {
          console.log(`[Discovery] Servidor encontrado: ${result.url}`);
          foundServers.push(result);
        }
      }
      
      if (onProgress) {
        onProgress({
          current: Math.min(i + batchSize, range.scanIPs.length),
          total: range.scanIPs.length,
          interface: range.interface
        });
      }
    }
  }
  
  console.log(`[Discovery] Varredura concluída. ${foundServers.length} servidor(es) encontrado(s).`);
  return foundServers;
}

/**
 * Verifica se a porta de sincronização está disponível
 */
function isPortAvailable(port = SYNC_PORT) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

/**
 * Verifica servidor salvo na configuração
 */
async function checkSavedServer() {
  const config = loadConfig();
  if (config && config.serverUrl) {
    console.log(`[Discovery] Verificando servidor salvo: ${config.serverUrl}`);
    try {
      const url = new URL(config.serverUrl);
      const result = await checkServer(url.hostname, parseInt(url.port) || SYNC_PORT);
      if (result.found) {
        console.log('[Discovery] Servidor salvo ainda está disponível');
        return result;
      }
    } catch (error) {
      console.log('[Discovery] Servidor salvo não está mais disponível');
    }
  }
  return null;
}

/**
 * Determina o modo de operação (servidor ou cliente)
 */
async function determineMode(forceServer = false) {
  console.log('[Discovery] Determinando modo de operação...');
  
  // Se forçar servidor, tentar iniciar como servidor
  if (forceServer) {
    const portAvailable = await isPortAvailable();
    if (portAvailable) {
      console.log('[Discovery] Modo: SERVIDOR (forçado)');
      return { mode: 'server' };
    } else {
      console.log('[Discovery] Porta não disponível, verificando se é nosso servidor...');
      const localServer = await checkServer('127.0.0.1');
      if (localServer.found) {
        console.log('[Discovery] Servidor local já rodando nesta máquina');
        return { mode: 'server-already-running', server: localServer };
      }
    }
  }
  
  // 1. Verificar servidor salvo
  const savedServer = await checkSavedServer();
  if (savedServer) {
    console.log('[Discovery] Modo: CLIENTE (servidor salvo)');
    return { mode: 'client', server: savedServer };
  }
  
  // 2. Verificar se porta está disponível localmente
  const portAvailable = await isPortAvailable();
  
  // 3. Se porta disponível, verificar se há outros servidores na rede
  if (portAvailable) {
    console.log('[Discovery] Porta disponível, verificando se há servidores na rede...');
    const servers = await discoverServers();
    
    if (servers.length > 0) {
      // Encontrou servidor na rede - perguntar ao usuário ou conectar automaticamente
      console.log('[Discovery] Modo: CLIENTE (servidor encontrado na rede)');
      return { mode: 'client', server: servers[0], allServers: servers };
    } else {
      // Nenhum servidor na rede - ser o servidor
      console.log('[Discovery] Modo: SERVIDOR (nenhum servidor na rede)');
      return { mode: 'server' };
    }
  } else {
    // Porta em uso - verificar se é um servidor HealthCall local
    console.log('[Discovery] Porta em uso, verificando servidor local...');
    const localServer = await checkServer('127.0.0.1');
    
    if (localServer.found) {
      console.log('[Discovery] Modo: CLIENTE (servidor local já rodando)');
      return { mode: 'client', server: localServer };
    } else {
      // Porta usada por outro serviço
      console.log('[Discovery] ERRO: Porta em uso por outro serviço');
      return { mode: 'error', error: 'Porta 3457 em uso por outro serviço' };
    }
  }
}

export {
  checkServer,
  discoverServers,
  determineMode,
  isPortAvailable,
  saveConfig,
  loadConfig,
  getLocalNetworkRange,
  SYNC_PORT
};
