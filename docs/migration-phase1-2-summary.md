# Resumo da Migração - Fases 1 a 4

## Visão Geral

Migração do HealthCall de uma arquitetura baseada em Supabase (cloud) para uma arquitetura 100% local usando SQLite e IPC do Electron.

## Fase 1: Infraestrutura do Backend

### 1.1 Banco de Dados SQLite

**Arquivos criados:**
- `electron/database/schema.sql` - Schema do banco de dados com tabelas:
  - `patients` - Pacientes na fila
  - `calls` - Histórico de chamadas
  - `warnings` - Avisos/Anúncios
  - `settings` - Configurações key-value

- `electron/database/db.js` - Gerenciador de conexão do banco
  - `initDatabase()` - Inicializa o banco
  - `getDatabase()` - Retorna instância do banco
  - `closeDatabase()` - Fecha conexão
  - `generateUUID()` - Gera UUIDs
  - `getUploadsPath()` - Caminho para uploads

### 1.2 Repositórios

**Arquivos criados:**
- `electron/database/repo/patients.js`
  - `listPatients()`, `addPatient()`, `callPatient()`, `removePatient()`
  - `clearAllPatients()`, `getCallHistory()`, `getLastCall()`
  - `getWaitingPatients()`, `getLastCalled()`, `getDestinations()`

- `electron/database/repo/warnings.js`
  - `listWarnings()`, `listActiveWarnings()`, `addWarning()`
  - `updateWarning()`, `removeWarning()`, `toggleWarningActive()`
  - `reorderWarnings()`, `saveMediaFile()`

- `electron/database/repo/settings.js`
  - `getSetting()`, `getAllSettings()`, `setSetting()`
  - `setMultipleSettings()`

- `electron/database/index.js` - Barrel export

### 1.3 IPC Handlers

**Arquivo modificado:** `electron/main.js`
- 30+ handlers IPC para comunicação com renderer:
  - `db:patient:*` - Operações de pacientes
  - `db:warning:*` - Operações de avisos
  - `db:settings:*` - Operações de configurações
  - `rss:fetch` - Busca de feeds RSS
- `broadcastUpdate()` - Broadcast de atualizações para todas as janelas

### 1.4 Preload Script

**Arquivo modificado:** `electron/preload.cjs`
- Exposição segura das APIs:
  - `window.electron.db.patients.*`
  - `window.electron.db.warnings.*`
  - `window.electron.db.settings.*`
  - `window.electron.rss.fetch()`
  - `window.electron.on('data:updated', callback)`

### 1.5 Serviço RSS Local

**Arquivo criado:** `electron/services/rssService.js`
- Substituição da Edge Function do Supabase
- Parsing de RSS 2.0 e Atom
- Usa `fast-xml-parser` para parsing

## Fase 2: Serviços do Frontend

### 2.1 Wrapper TypeScript

**Arquivo criado:** `src/services/localDatabase.ts`
- Encapsula chamadas IPC com tipagem TypeScript
- Funções para todas as operações CRUD
- Sistema de realtime via eventos IPC:
  - `onDataUpdate(callback)` - Registra listener
  - `offDataUpdate(callback)` - Remove listener

### 2.2 Serviços Refatorados

**Arquivos modificados:**
- `src/features/dashboard/services/patientService.ts` - Usa localDb
- `src/features/display/services/displayService.ts` - Usa localDb
- `src/features/settings/services/settingsService.ts` - Usa localDb

### 2.3 Hooks Refatorados

**Arquivos modificados:**
- `src/features/dashboard/hooks/usePatientQueue.ts`
  - Substituiu Supabase Realtime por `localDb.onDataUpdate`
- `src/features/display/hooks/useDisplay.ts`
  - Removido `useAuth` dependency
  - Usa `localDb.onDataUpdate` para atualizações
- `src/hooks/useAuth.ts`
  - Retorna sessão local simulada (sempre autenticado)
- `src/hooks/useTextToSpeech.ts`
  - Removido fallback Supabase
  - Apenas modo Electron TTS

### 2.4 Componentes Refatorados

**Arquivos modificados:**
- `src/features/dashboard/routes/WarningsPage.tsx` - Usa localDb
- `src/features/display/components/NewsTicker.tsx` - Usa localDb.fetchRssFeed
- `src/features/display/components/NewsHeadline.tsx` - Usa localDb
- `src/components/Header/Header.tsx` - Removido logout, usa settings local
- `src/components/ConnectionMonitor.tsx` - Mostra "Banco Local"
- `src/components/ProtectedRoute/ProtectedRoute.tsx` - Simplificado para modo local

### 2.5 Contextos Refatorados

**Arquivos modificados:**
- `src/contexts/SettingsContext.tsx` - Usa localDb
- `src/contexts/UserProfileContext.tsx` - Usa localDb

### 2.6 Outros Arquivos

**Arquivos modificados:**
- `src/features/authentication/services/authService.ts` - Modo local simulado
- `src/lib/audioTelemetry.ts` - Removido envio para Supabase
- `src/actions/patients.ts` - Wrapper de compatibilidade
- `src/actions/user.ts` - Wrapper de compatibilidade
- `src/types/index.ts` - Adicionado tipo `UserProfile`

### 2.7 Testes Atualizados

**Arquivos modificados:**
- `src/features/display/hooks/__tests__/useDisplay.test.ts` - Mocks atualizados
- `src/hooks/__tests__/useTextToSpeech.test.ts` - Mocks atualizados
- `src/hooks/__tests__/useTextToSpeech.simplified.test.ts` - Mocks atualizados

## Dependências Instaladas

```json
{
  "better-sqlite3": "^11.x",
  "fs-extra": "^11.x",
  "fast-xml-parser": "^4.x"
}
```

## Arquivos Supabase Removidos/Não Utilizados

O arquivo `src/lib/supabaseClient.ts` ainda existe mas não é mais importado em nenhum arquivo de produção. Pode ser removido em uma fase futura.

## Fase 3 e 4: Autenticação Local

### 3.1 Sistema de Autenticação

**Arquivos criados:**
- `electron/database/repo/auth.js` - Repositório de autenticação local
  - `authenticate(email, password)` - Valida credenciais
  - `createUser()`, `updateCredentials()` - Gerenciamento de usuários
  - `ensureDefaultUser()` - Cria usuário padrão se não existir
  - Hash de senhas com SHA-256 + salt

### 3.2 Credenciais Padrão

```
Email: admin@healthcall.local
Senha: admin123
```

No primeiro login, o usuário é solicitado a configurar suas próprias credenciais (nome, email, senha).

### 3.3 Arquivos Modificados

**Schema do banco:**
- `electron/database/schema.sql` - Adicionada tabela `users`

**IPC Handlers:**
- `electron/main.js` - Adicionados handlers:
  - `auth:login` - Autenticação
  - `auth:updateCredentials` - Atualização de credenciais
  - `auth:getUser` - Busca usuário
  - `auth:isFirstLogin` - Verifica primeiro login

**Preload:**
- `electron/preload.cjs` - Exposta API `window.electron.auth.*`

**Frontend:**
- `src/features/authentication/services/authService.ts` - Refatorado para usar IPC
- `src/features/authentication/hooks/useAuthentication.ts` - Atualizado com novas funções
- `src/features/authentication/routes/LoginPage.tsx` - Fluxo de primeiro login
- `src/hooks/useAuth.ts` - Integração com autenticação local
- `src/components/ProtectedRoute/ProtectedRoute.tsx` - Verifica sessão real
- `src/components/Header/Header.tsx` - Botão de logout restaurado

### 3.4 Fluxo de Autenticação

1. Usuário acessa a aplicação
2. Se não autenticado → Redireciona para `/auth/login`
3. Login com credenciais padrão ou personalizadas
4. Se primeiro login → Tela de configuração de credenciais
5. Sessão salva no localStorage
6. Logout disponível no menu do header

## Verificação Final

Build concluído com sucesso:
```
✓ 1823 modules transformed
✓ built in 1.78s
```

Nenhum erro de TypeScript encontrado.
