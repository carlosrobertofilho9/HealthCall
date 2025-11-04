# HealthCall - Sistema de Gerenciamento de Fila de Pacientes

O HealthCall é um sistema moderno de chamada e gerenciamento de filas de pacientes em tempo real, projetado para clínicas e hospitais. Ele permite que a equipe gerencie uma lista de espera de pacientes, chame pacientes para salas específicas e exiba as chamadas em uma tela pública, com anúncios de voz.

## ✨ Funcionalidades

-   **Gerenciamento de Pacientes:** Adicione, edite e remova pacientes da fila de espera.
-   **Acompanhamento de Status:** Acompanhe o status do paciente de "Aguardando" para "Em Atendimento" e "Atendimento Finalizado".
-   **Chamada em Tempo Real:** Chame pacientes para destinos específicos.
-   **Exibição Pública:** Uma visualização de exibição dedicada (`/display`) mostra o último paciente chamado em tempo real.
-   **Síntese de Voz:** Anuncia o nome e o destino do paciente na página de exibição.
-   **Autenticação:** Login seguro para membros da equipe.
-   **Filtragem e Pesquisa:** Encontre facilmente pacientes na fila.
-   **Estado Persistente:** As preferências do usuário e o estado da fila são salvos.

## 🛠️ Tecnologias

-   **Frontend:** React, TypeScript, Vite
-   **Backend & Banco de Dados:** Supabase (PostgreSQL, Auth, Realtime)
-   **Estilização:** Tailwind CSS
-   **Roteamento:** React Router DOM

## 🚀 Começando

Siga estas etapas para colocar o projeto em funcionamento em sua máquina local.

### 1. Clone o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd healthcall
```

### 2. Instale as Dependências

Instale os pacotes npm necessários.

```bash
npm install
```

### 3. Configure o Supabase

Este projeto requer um backend Supabase para autenticação, banco de dados e recursos em tempo real.

#### a. Crie um Projeto Supabase

-   Acesse [supabase.com](https://supabase.com/) e crie um novo projeto.
-   Salve o **URL do seu projeto** e a chave **`anon` (pública)**.

#### b. Configure as Variáveis de Ambiente

Crie um arquivo chamado `.env` na raiz do projeto e adicione suas credenciais do Supabase:

```
VITE_SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_SUPABASE
```

### 4. Execute a Aplicação

Depois que as dependências estiverem instaladas e as variáveis de ambiente configuradas, você pode executar o servidor de desenvolvimento.

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

## 📂 Estrutura do Projeto

O projeto segue uma arquitetura baseada em funcionalidades, projetada para escalabilidade e manutenibilidade.

```
/
├── public/              # Ativos estáticos
├── src/
│   ├── app/             # Configuração principal da aplicação (roteador, provedores)
│   ├── components/      # Componentes de UI reutilizáveis (Botão, Input, etc.)
│   ├── features/        # Módulos de funcionalidades (autenticação, dashboard, etc.)
│   │   ├── authentication/
│   │   ├── dashboard/
│   │   └── ...
│   ├── hooks/           # Hooks globais
│   ├── lib/             # Inicializações de bibliotecas (cliente Supabase, utils)
│   ├── styles/          # Estilos globais
│   └── types/           # Definições de tipos TypeScript
├── .env                 # Variáveis de ambiente
├── package.json         # Dependências e scripts do projeto
└── README.md            # Este arquivo
```

## 📜 Scripts Disponíveis

-   `npm run dev`: Inicia o servidor de desenvolvimento.
-   `npm run build`: Compila a aplicação para produção.
-   `npm run preview`: Serve a compilação de produção localmente para visualização.
