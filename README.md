<div align="center">
  <img width="128" height="128" alt="HealthCall Logo" src="https://healthcall-23d13.web.app/healthcall-logo.png" />
  <h1>HealthCall</h1>
  <p><strong>Sistema Avançado de Gestão de Clínicas e Chamada de Pacientes</strong></p>
</div>

---

O **HealthCall** é uma solução completa e moderna desenvolvida para otimizar o fluxo de atendimento em clínicas e unidades de saúde. Mais do que um simples gerenciador de filas, ele integra agendamentos, geração de documentos médicos e um sistema de avisos multimídia, tudo em tempo real.

Projetado com foco na experiência do usuário e eficiência, o sistema permite que a equipe médica e recepcionistas gerenciem pacientes de forma ágil, enquanto oferece uma experiência clara e profissional para os pacientes na sala de espera.

## ✨ Funcionalidades Principais

### 🏥 Gestão de Fila e Chamada

- **Chamada em Tempo Real:** Convocação instantânea de pacientes para consultórios ou triagem.
- **Display Público (Painel):** Interface dedicada para TVs e monitores na sala de espera.
- **Voz Sintetizada (TTS):** Anúncios de voz claros ("Paciente Fulano, comparecer à Sala 1") com suporte otimizado para Chromecast.
- **Drag & Drop:** Reorganização fácil da fila de espera.

### 📅 Agendamentos Inteligentes

- **Gestão por Turnos:** Organização automática de pacientes por turnos (Manhã/Tarde).
- **Busca Rápida:** Localização instantânea de agendamentos e pacientes.
- **Integração com Fila:** Adicione pacientes agendados diretamente à fila de triagem com um clique.

### 📝 Documentação Clínica (PDF)

- **Geração Automática:** Crie e imprima documentos médicos instantaneamente.
- **Modelos Personalizados:**
  - Receitas e Prescrições.
  - Controle Glicêmico e de Pressão Arterial (MRPA/MAPA).
  - Solicitações de Fórmulas e Exames.
- **Layout Otimizado:** Documentos formatados profissionalmente com cabeçalhos e rodapés institucionais.

### 📢 Sistema de Avisos

- **Comunicados Multimídia:** Exiba avisos importantes, vídeos educativos ou campanhas de saúde no Display Público.
- **Gerenciamento de Mídia:** Upload e agendamento de conteúdos visuais e sonoros.

### 🎨 Experiência do Usuário

- **Interface Moderna:** Design limpo, intuitivo e responsivo.
- **Tema Escuro (Dark Mode):** Suporte nativo para conforto visual.
- **PWA (Progressive Web App):** Instalação como aplicativo em desktops e dispositivos móveis.

---

## 🛠️ Stack Tecnológico

Este projeto utiliza as tecnologias mais recentes do ecossistema web para garantir performance, segurança e manutenibilidade.

### Frontend

- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) + [Tailwind Merge](https://github.com/dcastil/tailwind-merge)
- **Componentes:** [Radix UI](https://www.radix-ui.com/) / [shadcn/ui](https://ui.shadcn.com/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **PDF:** [React-PDF](https://react-pdf.org/)
- **Drag & Drop:** [dnd-kit](https://dndkit.com/)

### Backend & Serviços

- **BaaS:** [Supabase](https://supabase.com/)
  - **Database:** PostgreSQL
  - **Auth:** Autenticação segura
  - **Realtime:** Atualizações instantâneas via WebSockets
  - **Storage:** Armazenamento de arquivos (avisos, mídias)

### Qualidade & Ferramentas

- **Testes:** [Vitest](https://vitest.dev/) + React Testing Library
- **Linting:** ESLint

---

## 🚀 Como Executar

### Pré-requisitos

- Node.js (v18+)
- NPM ou Yarn
- Conta no Supabase

### 1. Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/carlosrobertofilho9/healthcall.git
cd healthcall
npm install
```

### 2. Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 3. Executando Localmente

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:5173`.

### 4. Scripts Úteis

- `npm run build`: Compila o projeto para produção.
- `npm run preview`: Visualiza a versão de produção localmente.
- `npm test`: Executa a suíte de testes.

---

## 📂 Estrutura do Projeto

A arquitetura é baseada em **Features**, agrupando lógica e componentes por domínio de negócio para facilitar a escalabilidade.

```
src/
├── app/               # Configurações globais (Router, Providers)
├── components/        # Componentes de UI genéricos (Design System)
├── features/          # Módulos principais do sistema
│   ├── appointments/  # Agendamentos e Turnos
│   ├── authentication/# Login e Sessão
│   ├── dashboard/     # Fila de espera e Triagem
│   ├── display/       # Tela pública (TV)
│   ├── documents/     # Gerador de PDFs médicos
│   ├── settings/      # Configurações do sistema
│   └── warnings/      # Avisos e Mídias
├── hooks/             # Hooks globais
├── lib/               # Utilitários e configurações de liberarias (Supabase, Utils)
└── styles/            # Estilos globais (Tailwind)
```

---

<div align="center">
  <p>Desenvolvido com ❤️ para modernizar a saúde.</p>
</div>
