# Master Prompt: Integração WhatsApp HealthCall

Este prompt foi desenvolvido para ser utilizado com uma IA (como a Antigravity ou similar) para implementar a integração completa do `whatsapp-web.js` no sistema HealthCall.

---

## 🤖 Prompt para IA

"Aja como um Engenheiro de Software Sênior especialista em Node.js, Supabase e Integrações. O objetivo é implementar um sistema de envio de mensagens de confirmação via WhatsApp para a plataforma **HealthCall**, utilizando a biblioteca `whatsapp-web.js`.

### 1. Contexto e Objetivos
*   **Sistema:** HealthCall (Gestão de Saúde built with React/Vite/Supabase).
*   **Bibliotecas:** `whatsapp-web.js`, `qrcode-terminal` (opcional), `supabase-js`.
*   **Funcionalidade Principal:** Enviar mensagens automáticas de confirmação de agendamento e lembretes para pacientes.
*   **UX:** O administrador deve conseguir vincular o WhatsApp escaneando um QR Code gerado pelo sistema.

### 2. Arquitetura Sugerida
*   Como o `whatsapp-web.js` exige uma instância do Puppeteer persistente, não podemos usar Supabase Edge Functions diretamente. 
*   Devemos criar um **Node.js Gateway Service** (pode ser uma subpasta `/services/whatsapp-gateway` no projeto ou um serviço separado).
*   O serviço deve se conectar ao Supabase e monitorar uma tabela de 'fila de mensagens' (`whatsapp_queue`).

### 3. Requisitos Técnicos (Desenvolva o código):

#### A. Schema do Banco de Dados (SQL Supabase)
Crie o SQL para:
*   Tabela `whatsapp_config`: Armazenar o status da conexão, o QR Code atual (em base64 ou string) e informações da sessão.
*   Tabela `whatsapp_messages`: Log de mensagens enviadas, status (pendente, enviado, erro) e relação com o `appointment_id`.

#### B. Serviço Gateway (Node.js/TypeScript)
Implemente o código do servidor que:
1.  Inicializa o `whatsapp-web.js` com `LocalAuth` (ou `RemoteAuth` usando Supabase Storage).
2.  Gera o evento `qr` e salva a string na tabela `whatsapp_config`.
3.  Lida com o evento `ready`, atualizando o status para 'online'.
4.  Monitora (via `supabase.channel` ou polling) a tabela `whatsapp_messages` para enviar mensagens pendentes.
5.  Formata as mensagens usando templates dinâmicos (ex: "Olá {nome}, confirmamos seu agendamento para o dia {data} às {hora}").

#### C. Integração Front-end (React/Vite)
Desenvolva um componente `WhatsAppConnectionCard` seguindo o design system do HealthCall (`AGENTS.md`):
*   Exiba o QR Code vindo do banco de dados enquanto o status for 'desconectado'.
*   Exiba o status da conexão em tempo real (Online/Offline/Aguardando QR).
*   Use `framer-motion` para animações de carregamento e estados.

### 4. Critérios de Excelência:
*   **Segurança:** Use variáveis de ambiente para chaves do Supabase.
*   **Resiliência:** O serviço deve se reconectar automaticamente se o WhatsApp cair.
*   **UX Premium:** O feedback visual deve ser instantâneo e amigável para o pessoal da recepção.
*   **Português (PT-BR):** Todas as mensagens enviadas aos pacientes e textos da interface devem ser em Português. O código deve ser em Inglês."

---

## 🚀 Como usar este prompt?

1.  **Escolha o Ambiente:** Se você for rodar o gateway na mesma máquina que o sistema, crie uma pasta `whatsapp-gateway` na raiz.
2.  **Chame a IA:** Cole o prompt acima.
3.  **Refinamento:** Peça para a IA focar primeiro no **Schema do Banco de Dados**, depois no **Servidor Node.js** e por fim no **Componente React**.

> **Dica:** Para produção, recomendo rodar este gateway Node.js em um container Docker ou serviço como Render/Railway, já que ele precisa estar rodando 24/7 para processar as mensagens.
