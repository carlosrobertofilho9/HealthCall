/**
 * Serviço de Túnel Público
 * 
 * Permite acesso ao servidor HealthCall de qualquer lugar do mundo,
 * não apenas na rede local.
 * 
 * Usa localtunnel.me para criar uma URL pública gratuita.
 * 
 * Exemplo: https://healthcall-clinica-abc.loca.lt
 */

import localtunnel from 'localtunnel';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const TUNNEL_CONFIG_FILE = 'tunnel-config.json';

let tunnel = null;
let tunnelUrl = null;
let tunnelSubdomain = null;

/**
 * Obtém o caminho do arquivo de configuração do túnel
 */
function getTunnelConfigPath() {
  return path.join(app.getPath('userData'), TUNNEL_CONFIG_FILE);
}

/**
 * Salva a configuração do túnel
 */
function saveTunnelConfig(config) {
  try {
    const configPath = getTunnelConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('[Tunnel] Configuração salva:', config);
  } catch (error) {
    console.error('[Tunnel] Erro ao salvar configuração:', error);
  }
}

/**
 * Carrega a configuração do túnel
 */
function loadTunnelConfig() {
  try {
    const configPath = getTunnelConfigPath();
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[Tunnel] Erro ao carregar configuração:', error);
  }
  return null;
}

/**
 * Gera um subdomínio único baseado no nome da clínica ou ID da máquina
 */
function generateSubdomain(clinicName = '') {
  // Limpar nome da clínica para usar como subdomínio
  let subdomain = clinicName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9-]/g, '-') // Substitui caracteres especiais
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens no início/fim
  
  // Se não tiver nome, usar ID aleatório
  if (!subdomain || subdomain.length < 3) {
    const machineId = require('os').hostname().toLowerCase().replace(/[^a-z0-9]/g, '');
    subdomain = `healthcall-${machineId.substring(0, 8)}`;
  } else {
    subdomain = `healthcall-${subdomain}`;
  }
  
  // Garantir tamanho máximo (localtunnel limita)
  if (subdomain.length > 63) {
    subdomain = subdomain.substring(0, 63);
  }
  
  return subdomain;
}

/**
 * Inicia o túnel público
 * 
 * @param {number} port - Porta local para expor
 * @param {string} subdomain - Subdomínio desejado (opcional)
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
async function startTunnel(port = 3457, subdomain = null) {
  // Se já existe um túnel, fechar primeiro
  if (tunnel) {
    await stopTunnel();
  }
  
  try {
    // Carregar subdomínio salvo ou gerar novo
    const config = loadTunnelConfig();
    tunnelSubdomain = subdomain || (config && config.subdomain) || generateSubdomain();
    
    console.log(`[Tunnel] Iniciando túnel na porta ${port}...`);
    console.log(`[Tunnel] Subdomínio solicitado: ${tunnelSubdomain}`);
    
    tunnel = await localtunnel({
      port,
      subdomain: tunnelSubdomain,
      // Usando servidor padrão (localtunnel.me)
      // Pode configurar servidor próprio se quiser mais estabilidade
    });
    
    tunnelUrl = tunnel.url;
    
    // O subdomínio real pode ser diferente do solicitado se já estiver em uso
    const actualSubdomain = new URL(tunnelUrl).hostname.split('.')[0];
    tunnelSubdomain = actualSubdomain;
    
    console.log('[Tunnel] ========================================');
    console.log('[Tunnel] Túnel público iniciado!');
    console.log(`[Tunnel] URL: ${tunnelUrl}`);
    console.log(`[Tunnel] Subdomínio: ${tunnelSubdomain}`);
    console.log('[Tunnel] ========================================');
    
    // Salvar configuração para próximas execuções
    saveTunnelConfig({
      subdomain: tunnelSubdomain,
      lastUrl: tunnelUrl,
      port,
      createdAt: new Date().toISOString()
    });
    
    // Handlers de eventos
    tunnel.on('close', () => {
      console.log('[Tunnel] Túnel fechado');
      tunnelUrl = null;
    });
    
    tunnel.on('error', (err) => {
      console.error('[Tunnel] Erro:', err);
    });
    
    return {
      success: true,
      url: tunnelUrl,
      subdomain: tunnelSubdomain,
      wsUrl: tunnelUrl.replace('https://', 'wss://').replace('http://', 'ws://')
    };
    
  } catch (error) {
    console.error('[Tunnel] Erro ao iniciar túnel:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Para o túnel público
 */
async function stopTunnel() {
  if (tunnel) {
    console.log('[Tunnel] Fechando túnel...');
    tunnel.close();
    tunnel = null;
    tunnelUrl = null;
    return { success: true };
  }
  return { success: false, error: 'Nenhum túnel ativo' };
}

/**
 * Obtém informações do túnel ativo
 */
function getTunnelInfo() {
  if (!tunnel || !tunnelUrl) {
    return null;
  }
  
  return {
    url: tunnelUrl,
    subdomain: tunnelSubdomain,
    wsUrl: tunnelUrl.replace('https://', 'wss://').replace('http://', 'ws://'),
    active: true
  };
}

/**
 * Verifica se o túnel está ativo
 */
function isTunnelActive() {
  return tunnel !== null && tunnelUrl !== null;
}

/**
 * Obtém a configuração salva do túnel
 */
function getSavedTunnelConfig() {
  return loadTunnelConfig();
}

/**
 * Define um subdomínio personalizado
 */
function setCustomSubdomain(subdomain) {
  const config = loadTunnelConfig() || {};
  config.subdomain = subdomain;
  saveTunnelConfig(config);
  tunnelSubdomain = subdomain;
}

export {
  startTunnel,
  stopTunnel,
  getTunnelInfo,
  isTunnelActive,
  getSavedTunnelConfig,
  setCustomSubdomain,
  generateSubdomain,
  saveTunnelConfig,
  loadTunnelConfig
};
