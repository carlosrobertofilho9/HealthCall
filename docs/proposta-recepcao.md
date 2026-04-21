---
title: "Proposta: Funcionalidade de Recepção"
description: "Documentação de requisitos e ideias para a nova central de atendimento e recepção do HealthCall."
---

# Central de Recepção HealthCall

Esta proposta detalha a criação de uma nova feature dedicada à recepção, permitindo a comunicação fluida entre a equipe médica/administrativa e a gestão ativa dos pacientes em tempo real.

## 1. Visão Geral

A funcionalidade de Recepção visa centralizar as interações do dia a dia da clínica, servindo como o "hub" de entrada do paciente e comunicação interna.

## 2. Funcionalidades Principais

### 2.1. Chat com a Recepção
*   **Comunicação em Tempo Real:** Canal de mensagens instantâneas entre consultórios e o balcão de recepção.
*   **Notificações:** Alertas sonoros e visuais para novas mensagens.
*   **Histórico:** Registro das conversas do dia para consultas rápidas.

### 2.2. Gestão de Fluxo de Pacientes
*   **Lista de Presença:** Visualização clara da lista de agendados para o dia atual.
*   **Status de Chegada:** Botões rápidos para marcar o paciente como:
    *   `Compareceu`: Ativa o paciente na fila de espera.
    *   `Faltou`: Registra a ausência e libera o horário.
*   **Fila de Espera:** Identificação de quem está na vez e quem é o próximo, baseada no horário de agendamento e ordem de chegada.

### 2.3. Impressão da Ficha do Dia
*   **Acesso Rápido:** Botão dedicado para gerar e imprimir a listagem completa de atendimentos do dia.
*   **Conteúdo Detalhado:** A ficha deve incluir nome do paciente, documento (CPF/SUS), ACS responsável, horário do slot e campos para notas manuais se necessário.
*   **Sincronização:** Refletir os status atuais (quem já compareceu, quem faltou) na versão impressa.

### 2.4. Controle de Chamadas (Painel)
*   **Último Chamado:** Destaque visual do último paciente chamado para o consultório.
*   **Chamada Simples:** Botão para a recepção ou médico "chamar" o próximo paciente, integrando com o sistema de `warnings` (avisos sonoros/visuais no painel da sala de espera).

## 3. Reuso de Lógica e Componentes

Para garantir consistência e agilidade, a funcionalidade de Recepção deve reutilizar as estruturas existentes:

*   **Serviços:** `appointmentService.ts` para atualizações de status (`updateAppointmentStatus`) e busca de dados.
*   **Hooks:** `useAppointments` para gerenciar o estado da agenda do dia, carregamento e filtragem.
*   **Impressão:**
    *   `printPatientList`: Reutilizar para a "Ficha do Dia".
    *   `printAppointmentReport`: Reutilizar para relatórios de fechamento de turno da recepção.
*   **Tipos:** Manter o uso do tipo `Appointment` e os enums de status (`Agendado`, `Compareceu`, `Faltou`).

## 4. Arquitetura Proposta

### 4.1. Estrutura de Pastas
```text
src/features/reception/
├── components/          # Componentes de Chat e Listas
├── hooks/               # useReception, useReceptionChat
├── services/            # receptionService.ts (integração Supabase)
├── routes/              # ReceptionPage.tsx
└── types/               # Interfaces específicas da recepção
```

### 3.2. Banco de Dados (Supabase)
*   **Tabela `reception_messages`:**
    *   `id`, `sender_id`, `content`, `created_at`.
*   **Aprimoramento na tabela `appointments`:**
    *   Garantir que os campos `status` e `status_updated_at` sejam usados para rastrear o tempo de espera.

## 4. Próximos Passos
1.  Definir o esquema da tabela de chat no Supabase.
2.  Criar a interface base da `ReceptionPage`.
3.  Implementar a lógica de tempo real para as mensagens.
4.  Integrar com o serviço de agendamentos existente para atualização de status.
