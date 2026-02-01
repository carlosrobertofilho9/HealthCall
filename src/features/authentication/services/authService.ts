/**
 * Serviço de autenticação local (Electron)
 * Usa o banco de dados SQLite local para autenticação
 */

// Interface para o tipo de resposta IPC
interface IPCResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Interface para o usuário local
export interface LocalUser {
  id: string;
  email: string;
  name: string | null;
  default_destination: string | null;
  is_first_login: number;
  created_at: string;
  updated_at: string;
}

// Interface para a sessão local
export interface LocalSession {
  user: LocalUser;
  access_token: string;
}

// Verifica se estamos no Electron
function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electron;
}

// Obtém a API do Electron
function getElectronAPI() {
  if (!isElectron()) {
    throw new Error('Esta aplicação requer o Electron para funcionar');
  }
  return (window as any).electron;
}

// Chave para armazenar a sessão no localStorage
const SESSION_KEY = 'healthcall_session';

/**
 * Salva a sessão no localStorage
 */
function saveSession(session: LocalSession | null): void {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Recupera a sessão do localStorage
 */
function loadSession(): LocalSession | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Autentica um usuário usando email e senha.
 */
export async function signInWithPassword(credentials: { email: string; password: string }): Promise<LocalSession> {
  const electron = getElectronAPI();
  const response: IPCResponse<LocalUser> = await electron.auth.login(credentials.email, credentials.password);
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Falha na autenticação');
  }
  
  const session: LocalSession = {
    user: response.data,
    access_token: `local-token-${response.data.id}-${Date.now()}`,
  };
  
  saveSession(session);
  return session;
}

/**
 * Desconecta o usuário atualmente autenticado.
 */
export async function signOut(): Promise<void> {
  saveSession(null);
  console.log('[Auth] Usuário desconectado');
}

/**
 * Obtém a sessão de autenticação atual.
 */
export async function getSession(): Promise<LocalSession | null> {
  const session = loadSession();
  
  // Valida se o usuário ainda existe no banco
  if (session) {
    try {
      const electron = getElectronAPI();
      const response: IPCResponse<LocalUser> = await electron.auth.getUser(session.user.id);
      
      if (response.success && response.data) {
        // Atualiza a sessão com os dados mais recentes do usuário
        const updatedSession: LocalSession = {
          ...session,
          user: response.data,
        };
        saveSession(updatedSession);
        return updatedSession;
      }
    } catch {
      // Se falhar, limpa a sessão
    }
    saveSession(null);
    return null;
  }
  
  return null;
}

/**
 * Verifica se é o primeiro login do usuário
 */
export async function isFirstLogin(userId: string): Promise<boolean> {
  const electron = getElectronAPI();
  const response: IPCResponse<boolean> = await electron.auth.isFirstLogin(userId);
  return response.success && response.data === true;
}

/**
 * Atualiza as credenciais do usuário (usado no primeiro login)
 */
export async function updateCredentials(
  userId: string, 
  email: string, 
  password: string, 
  name: string
): Promise<LocalUser> {
  const electron = getElectronAPI();
  const response: IPCResponse<LocalUser> = await electron.auth.updateCredentials(userId, email, password, name);
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Falha ao atualizar credenciais');
  }
  
  // Atualiza a sessão com os novos dados
  const session = loadSession();
  if (session) {
    const updatedSession: LocalSession = {
      ...session,
      user: response.data,
    };
    saveSession(updatedSession);
  }
  
  return response.data;
}

/**
 * Atualiza o destino/setor de trabalho do usuário
 */
export async function updateUserDestination(userId: string, destination: string | null): Promise<LocalUser> {
  const electron = getElectronAPI();
  const response: IPCResponse<LocalUser> = await electron.auth.updateDestination(userId, destination);
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Falha ao atualizar destino');
  }
  
  // Atualiza a sessão com os novos dados
  const session = loadSession();
  if (session) {
    const updatedSession: LocalSession = {
      ...session,
      user: response.data,
    };
    saveSession(updatedSession);
  }
  
  return response.data;
}
