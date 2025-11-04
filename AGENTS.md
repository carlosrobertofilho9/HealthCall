# AGENTS.md

Este documento fornece diretrizes para agentes de IA que trabalham neste repositório.

## Visão Geral do Projeto

Este é um aplicativo de front-end construído com React, Vite e TypeScript. Ele usa o Supabase para o backend, incluindo banco de dados e autenticação.

## Configuração do Ambiente

1.  **Instalar dependências:**
    ```bash
    npm install
    ```
2.  **Iniciar o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

## Arquitetura

O projeto segue uma arquitetura baseada em features. O código para cada feature está localizado em um diretório dedicado em `src/features`. Cada diretório de feature contém subdiretórios para `hooks`, `services` e `routes`.

## Banco de Dados

O banco de dados é gerenciado pelo Supabase. As migrações de esquema estão localizadas em `supabase/migrations` e seguem a convenção de nomenclatura `YYYYMMDDHHMMSS_description.sql`.

Para aplicar migrações ao banco de dados remoto, use o comando:
```bash
npx supabase db push
```
**Importante:** Em ambientes não interativos, a variável de ambiente `SUPABASE_ACCESS_TOKEN` deve ser configurada.

## Estilo

O estilo é implementado com Tailwind CSS. O projeto utiliza componentes de UI reutilizáveis localizados em `src/components/ui`, seguindo o padrão shadcn/ui.

## Comunicação

O usuário se comunica em português. Mantenha toda a comunicação nesse idioma.
