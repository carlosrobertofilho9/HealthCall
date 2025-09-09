# Guia de Organização do Projeto HealthCall

Este guia propõe uma estrutura clara para escalar o app, separando páginas, componentes, ações (lógica de aplicação), hooks, tipos e constantes. Inclui um checklist passo a passo para migrar do estado atual para a nova organização com segurança.

> Objetivo: padronizar a estrutura em `src/`, facilitar manutenção, testes e futuras features (rotas, persistência, serviços externos, i18n).

---

## Estrutura alvo (proposta)

```
src/
  app/
    router.tsx                # Rotas da aplicação
    providers.tsx             # Providers globais (Toast, Theme, etc.)
  pages/
    Home/
      HomePage.tsx            # Página principal com a fila
      index.ts                # Re-export
    Display/
      DisplayPage.tsx         # Tela de exibição/chamada
      index.ts
  components/
    AddPatientForm/
      AddPatientForm.tsx
      index.ts
    PatientQueue/
      PatientQueue.tsx
      PatientCard.tsx
      PatientStatusBadge.tsx
      index.ts
    Header/
      Header.tsx
      index.ts
  actions/
    patients.ts               # Ações puras relacionadas a pacientes
    storage.ts                # Leitura/escrita no localStorage
    audio.ts                  # Lógica de áudio/speech
  hooks/
    useSpeechSynthesis.ts
  lib/
    toast.ts                  # Wrapper para react-toastify
  types/
    index.ts                  # Tipos (Patient, CallRecord, etc.)
  constants/
    index.ts                  # Salas, chaves de storage, limites, etc.
  styles/
    index.css
  main.tsx                    # bootstrap (substitui index.tsx na raiz)
  App.tsx                     # layout e composição principal

public/
  bell.mp3
```

Observações:
- `pages/` contém páginas de rota (Home, Display). Cada pasta pode ter seus componentes locais.
- `components/` abriga componentes compartilháveis entre páginas.
- `actions/` centraliza regras de negócio puras (sem JSX), facilitando testes.
- `lib/` e `hooks/` guardam utilitários reutilizáveis.
- `constants/` concentra strings e números usados em muitos lugares.
- `types/` mantém contratos/structs usados em todo o app.

---

## Checklist de migração (passo a passo)

Cada etapa tem um checkbox. Siga na ordem. Sempre rode o app após blocos grandes para garantir que nada quebrou.

1. Criar pastas base em `src/`
   - [ ] Criar diretórios: `src/app`, `src/pages/Home`, `src/pages/Display`, `src/components/...`, `src/actions`, `src/hooks`, `src/lib`, `src/types`, `src/constants`, `src/styles`.
   - [ ] Mover `index.css` para `src/styles/index.css` e ajustar import no HTML ou no bundler.

   Como fazer:
   - Mover arquivo: `index.css -> src/styles/index.css`.
   - No `index.html`, manter `<link rel="stylesheet" href="/src/styles/index.css" />` ou importar via `main.tsx`.

2. Criar ponto de entrada em `src/main.tsx`
   - [ ] Criar `src/main.tsx` com `createRoot` e renderização de `<App />`.
   - [ ] Atualizar `index.html` para apontar para `/src/main.tsx`.

   Como fazer:
   - Copiar conteúdo de `index.tsx` atual para `src/main.tsx`.
   - Em `index.html`, trocar `index.tsx` por `/src/main.tsx` no script `type="module"`.

3. Mover e ajustar `App.tsx`
   - [ ] Mover `App.tsx` para `src/App.tsx`.
   - [ ] Extrair providers globais (ToastContainer, Router) para `src/app/providers.tsx` (opcional, recomendado).
   - [ ] Criar `src/app/router.tsx` com as rotas: `/` -> `HomePage`, `/display` -> `DisplayPage`.

   Como fazer:
   - Em `App.tsx`, deixe apenas layout e `<Outlet />` se usar `createBrowserRouter`, ou mantenha `<Routes>` simples e importe as páginas.

4. Mover páginas
   - [ ] Criar `src/pages/Home/HomePage.tsx` com a lógica da fila (estado de pacientes, modal, filtros) que hoje está em `MainApp` dentro de `App.tsx`.
   - [ ] Mover `components/DisplayPage.tsx` para `src/pages/Display/DisplayPage.tsx`.
   - [ ] Exportar por `index.ts` dentro de cada pasta de página.

   Como fazer:
   - Copiar o componente `MainApp` de `App.tsx` para `HomePage.tsx` e exportar default.
   - Ajustar imports relativos (ex.: `../../types`, `../../constants`).

5. Reorganizar componentes compartilhados
   - [ ] Criar pastas por componente em `src/components` (AddPatientForm, PatientQueue, PatientStatusBadge, Header, PatientCard dentro de PatientQueue).
   - [ ] Adicionar `index.ts` reexportando `default` para imports limpos (`import { AddPatientForm } from '@/components/AddPatientForm'`).

   Como fazer:
   - Mover arquivos atuais de `components/` para as novas pastas, ajustando imports.

6. Criar camada de actions
   - [ ] `src/actions/patients.ts`: funções puras para CRUD no array de pacientes (add, update, remove, updateStatus, callPatient) e composição de payloads para storage/histórico.
   - [ ] `src/actions/storage.ts`: get/set para `localStorage` com chaves centralizadas e JSON seguro (try/catch).
   - [ ] `src/actions/audio.ts`: função `playCall(patient)` orquestrando campainha + speech (utiliza `useSpeechSynthesis` fora ou recebe um `speak` como dependência).

   Como fazer:
   - Migrar lógica hoje presente em `App.tsx` e `DisplayPage.tsx` para funções puras. O componente apenas chama a action.

7. Consolidar tipos e constantes
   - [ ] Mover `types.ts` para `src/types/index.ts` sem alterar os tipos.
   - [ ] Mover `constants.ts` para `src/constants/index.ts` e:
     - [ ] Padronizar nomes (acentos, grafia): "Consultório Enfermagem", "Consultório Odontológico".
     - [ ] Centralizar chaves de storage: `STORAGE_KEYS = { calledPatient: 'calledPatient', nextPatients: 'nextPatients', callHistory: 'callHistory' }`.
     - [ ] Definir limites: `CALL_HISTORY_LIMIT = 20`.

8. Aliases e tsconfig
   - [ ] Configurar alias `@` para `src` no `vite.config.ts` e `tsconfig.json`.
   - [ ] Atualizar imports para usar alias (`@/components/...`, `@/pages/...`).

   Como fazer:
   - `vite.config.ts`:
     ```ts
     resolve: { alias: { '@': path.resolve(__dirname, 'src') } }
     ```
   - `tsconfig.json`:
     ```json
     {
       "compilerOptions": {
         "baseUrl": ".",
         "paths": { "@/*": ["src/*"] }
       }
     }
     ```

9. Providers globais (opcional, recomendado)
   - [ ] Criar `src/app/providers.tsx` contendo `<ToastContainer />` e demais providers.
   - [ ] Envolver `<App />` com esses providers no `main.tsx`.

10. Router
   - [ ] Criar `src/app/router.tsx` com `react-router-dom` v6+.
   - [ ] Rotas: `/` -> `HomePage`; `/display` -> `DisplayPage`.

11. Ajustes de build
   - [ ] Atualizar script do `package.json` se necessário. Vite já cobre `dev`, `build`, `preview`.
   - [ ] Verificar import do CSS: via `main.tsx` (`import '@/styles/index.css'`) ou pelo `index.html`.

12. Teste rápido de execução
   - [ ] Rodar `npm run dev` e acessar `/` e `/display` para validar.
   - [ ] Checar: chamadas tocam áudio, histórico atualiza, filtro funciona, e navegação entre páginas.

13. Limpeza
   - [ ] Remover arquivos antigos na raiz que foram movidos (index.tsx antigo, css antigo, etc.).
   - [ ] Conferir imports não usados e tipos.

---

## Especificação rápida das actions

Contrato sugerido (puro e testável):
- `addPatient(list, { name, destination }): Patient[]`
- `updatePatient(list, patient): Patient[]`
- `removePatient(list, id): Patient[]`
- `updateStatus(list, id, status): Patient[]`
- `callPatient(list, id): { updated: Patient[]; called: Patient; next: Patient[] }`
- `appendCallHistory(history, called, limit = CALL_HISTORY_LIMIT): CallRecord[]`
- `storage.get<T>(key): T | null` / `storage.set<T>(key, value): void`

Principais erros a tratar:
- Entrada inválida (nome/destino vazios) deve ser rejeitada antes de `addPatient`.
- JSON inválido no `localStorage` deve ser tolerado (retornar lista vazia e regravar).
- Duplicatas no histórico: filtrar entradas consecutivas iguais (id + callCount).

---

## Atualização das constantes

Em `src/constants/index.ts`:
- `export const DESTINATION_ROOMS = ["Triagem", "Consultório Enfermagem", "Consultório Médico", "Consultório Odontológico", "Sala de Vacinação"];`
- `export const STORAGE_KEYS = { calledPatient: 'calledPatient', nextPatients: 'nextPatients', callHistory: 'callHistory' } as const;`
- `export const CALL_HISTORY_LIMIT = 20;`

Faça os componentes usarem essas constantes via alias `@/constants`.

---

## Exemplo de import após migração

```tsx
// em HomePage.tsx
import { AddPatientForm } from '@/components/AddPatientForm';
import { PatientQueue } from '@/components/PatientQueue';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { DESTINATION_ROOMS, STORAGE_KEYS } from '@/constants';
import type { Patient } from '@/types';
```

---

## Dicas finais
- Mantenha componentes “burros” (sem regra de negócio) e centralize a lógica em actions/hooks.
- Prefira importar de `@/types` e `@/constants` para evitar caminhos relativos frágeis.
- Ao criar novas páginas, siga o padrão de pasta com `index.ts` para re-exports.
- Adicione testes unitários em `actions/` quando possível (ex.: vitest).

---

## Roadmap (opcional)
- Estado global com Zustand/Redux para sincronizar fila entre múltiplas abas sem depender apenas de `localStorage`.
- Internacionalização (i18n) para mensagens e fala.
- Tema claro/escuro com CSS vars.
- Integração com backend (persistência de pacientes e eventos).
