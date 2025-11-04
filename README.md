<div align="center">
  <img width="1200" height="475" alt="HealthCall Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# HealthCall - Sistema de Gerenciamento de Fila de Pacientes

O HealthCall é um sistema moderno para gerenciamento e chamada de pacientes em tempo real, projetado para clínicas e hospitais. Ele permite que a equipe gerencie uma lista de espera, chame pacientes para salas específicas e exiba as chamadas em uma tela pública, completa com anúncios de voz.

## ✨ Funcionalidades

-   **Gerenciamento de Pacientes:** Adicione, edite e remova pacientes da fila de espera.
-   **Acompanhamento de Status:** Acompanhe o status do paciente de "Aguardando" para "Em Atendimento" e "Atendimento Finalizado".
-   **Chamada em Tempo Real:** Chame pacientes para destinos específicos com atualizações instantâneas.
-   **Display Público:** Uma visualização dedicada (`/display`) mostra o último paciente chamado em tempo real.
-   **Síntese de Voz:** Anuncia o nome e o destino do paciente na página de exibição.
-   **Autenticação:** Login seguro para membros da equipe.
-   **Filtragem e Pesquisa:** Encontre facilmente pacientes na fila.
-   **Configurações Persistentes:** As preferências do usuário, como o destino padrão, são salvas.

## 🛠️ Stack de Tecnologias

-   **Frontend:** React, TypeScript, Vite
-   **Backend & Banco de Dados:** Supabase (PostgreSQL, Auth, Realtime)
-   **Estilização:** Tailwind CSS
-   **Componentes de UI:** shadcn/ui, Radix UI
-   **Roteamento:** React Router DOM
-   **Notificações:** Sonner

## 📋 Pré-requisitos

Antes de começar, certifique-se de que você tem o seguinte instalado:
-   [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
-   [npm](https://www.npmjs.com/) (gerenciador de pacotes)
-   [Supabase CLI](https://supabase.com/docs/guides/cli) (para gerenciamento do banco de dados local e remoto)

## 🚀 Começando

Siga estes passos para configurar e executar o projeto em sua máquina local.

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

Este projeto requer um backend Supabase para autenticação, banco de dados e funcionalidades em tempo real.

#### a. Crie um Projeto no Supabase

-   Vá para [supabase.com](https://supabase.com/) e crie um novo projeto.
-   Guarde a **URL do Projeto** e a chave **`anon` (pública)**.

#### b. Configure as Variáveis de Ambiente

Crie um arquivo chamado `.env` na raiz do projeto (você pode copiar o `.env.example`, se existir) e adicione suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=SUA_URL_DO_PROJETO_SUPABASE
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_SUPABASE
```

#### c. Aplique as Migrações do Banco de Dados

Com a [Supabase CLI](https://supabase.com/docs/guides/cli) instalada e configurada, você pode aplicar todas as migrações de esquema de banco de dados necessárias com um único comando. Isso criará todas as tabelas, funções e políticas de segurança.

**Importante:** Para ambientes de CI/CD ou não interativos, você precisará configurar a variável de ambiente `SUPABASE_ACCESS_TOKEN`.

```bash
npx supabase db push
```

### 4. Execute a Aplicação

Com as dependências instaladas e as variáveis de ambiente configuradas, você pode iniciar o servidor de desenvolvimento.

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

## 📂 Estrutura do Projeto

O projeto segue uma arquitetura baseada em features, onde a lógica de negócio é organizada por domínio.

```
/
├── public/                # Assets estáticos
├── src/
│   ├── app/               # Configuração central (roteador, providers)
│   ├── actions/           # (Legado) Funções de interação com o Supabase
│   ├── components/        # Componentes de UI reutilizáveis (ex: botões, modais)
│   ├── contexts/          # Contextos React para estado global
│   ├── features/          # Diretório principal da lógica de negócio
│   │   ├── authentication/ # Lógica de autenticação
│   │   ├── dashboard/      # Lógica da fila de pacientes
│   │   ├── display/        # Lógica da tela de exibição pública
│   │   └── settings/       # Lógica da página de configurações
│   ├── hooks/             # Hooks React customizados e globais
│   ├── lib/               # Instanciação de bibliotecas (cliente Supabase, utils)
│   ├── styles/            # Estilos globais
│   └── types/             # Definições de tipos TypeScript
├── supabase/
│   └── migrations/        # Migrações do esquema do banco de dados
├── .env                   # Arquivo de variáveis de ambiente (não versionado)
├── package.json           # Dependências e scripts do projeto
└── README.md              # Este arquivo
```

## 📜 Scripts Disponíveis

-   `npm run dev`: Inicia o servidor de desenvolvimento.
-   `npm run build`: Compila a aplicação para produção.
-   `npm run preview`: Serve a build de produção localmente para pré-visualização.
```