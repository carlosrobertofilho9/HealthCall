# AGENTS.md

Este documento define as diretrizes essenciais para agentes de IA que colaboram no desenvolvimento do **HealthCall**. Siga estas instruções rigorosamente para manter a consistência e a excelência do projeto.

## 🚀 Visão Geral do Projeto

O HealthCall é uma plataforma de gestão em saúde focada em alta performance e experiência do usuário (UX) premium. O objetivo é fornecer ferramentas clínicas que pareçam modernas, rápidas e extremamente confiáveis.

## 🎨 Design System e Estética (Referência: Documents Page)

A página de referência absoluta para design e comportamento é `src/features/documents/pages/DocumentsPage.tsx`.

### 1. Layout e Estrutura
- **Shells e Containers:** Use sempre o `PageShell` para envolver as páginas.
- **Multi-Painéis:** No desktop, utilize layouts de múltiplos painéis (sidebars de configuração + área principal de conteúdo) usando `SectionCard`.
- **Responsividade:** No mobile, os painéis devem ser convertidos em um sistema de `Tabs` fluido.

### 2. Estética Visual (Premium Feel)
- **Glassmorphism:** Use fundos levemente transparentes (`bg-background/60`, `backdrop-blur`) e bordas sutis.
- **Sombra e Profundidade:** Utilize sombras suaves e camadas bem definidas para dar profundidade à interface.
- **Tipografia:** Foco em legibilidade com pesos de fonte bem definidos (Inter/Outfit).
- **Cores:** Paletas sóbrias (Slate, Zinc, Purple, Primary) com badges e indicadores de status refinados.

### 3. Micro-interações e Animações (Obrigatório)
O HealthCall deve parecer "vivo". Integre `framer-motion` em todos os elementos interativos:
- **Entradas:** Animações de `presence` (fade-in, slide-up) ao carregar componentes.
- **Haptic Feedback:** Efeitos de `scale` (ex: `whileTap={{ scale: 0.97 }}`) em botões.
- **Estados de Feedback:** Botões que tremem em caso de erro, pulsação em indicadores de progresso e transições suaves entre estados de vazio (Empty States) e conteúdo.

## 🛠 Stack Tecnológica

- **Core:** React 18, Vite, TypeScript.
- **Estilização:** Tailwind CSS.
- **Componentes:** shadcn/ui (customizado para o design system local).
- **Iconografia:** Lucide React.
- **Animações:** Framer Motion.
- **Dados/Backend:** Supabase (Auth, Database, Storage).
- **PDF/Documentos:** @react-pdf/renderer.

## 📁 Arquitetura do Código

Siga a arquitetura baseada em **Features**:
- `src/features/[feature-name]/`:
  - `components/`: Componentes específicos da funcionalidade.
  - `hooks/`: Lógica de business e estado (ex: `useDocumentsComposer`).
  - `pages/`: Componentes de página que montam a feature.
  - `services/`: Integração com Supabase/APIs externas.
  - `utils/`: Helpers específicos.

## ⚠️ Regras de Ouro

1.  **Sem Placeholders:** Nunca use imagens de exemplo ou textos "Lorem Ipsum". Use `generate_image` para assets reais ou crie dados fictícios contextuais (Mock Data).
2.  **UX First:** Se uma ação demora mais que 200ms, use skeletons ou estados de carregamento elegantes.
3.  **Consistência de Idioma:** Toda a interface e comunicação com o usuário deve ser em **Português (PT-BR)**. O código (variáveis, funções, comentários técnicos) deve ser em **Inglês**.
4.  **Acessibilidade e SEO:** Garanta tags semânticas e IDs únicos para testes automatizados.

---
*Este documento é a "alma" do projeto. Ao criar qualquer nova funcionalidade, pergunte-se: "Isso está no nível de polimento da página de Documentos?"*
