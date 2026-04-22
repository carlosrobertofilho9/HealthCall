---
name: HealthCall Design System
brand:
  product: HealthCall
  category: clinical-operating-system
  domain: APS/UBS
  tone: calm, institutional, operational, premium
  principles:
    - real-time clinical operation
    - institutional clarity
    - quiet organization
    - low cognitive friction
    - discreet sophistication
colors:
  navy: "#001B3D"
  blue: "#1466F5"
  teal: "#00BB94"
  teal_dark: "#007A65"
  teal_soft: "#E6F7F2"
  blue_soft: "#EAF3FF"
  background: "#F4F6F8"
  surface: "#FFFFFF"
  surface_soft: "#F8FAFC"
  border: "#DCE5EE"
  border_soft: "#E5ECF3"
  text: "#001B3D"
  text_muted: "#64748B"
  text_soft: "#94A3B8"
  success: "#22C55E"
  warning: "#F59E0B"
  error: "#D9474F"
backgrounds:
  app: "#F4F6F8"
  page: "#F4F6F8"
  card: "#FFFFFF"
  section: "#F8FAFC"
  sidebar: "linear-gradient(180deg, #FFFFFF 0%, #F8FBFF 54%, #F3F8F7 100%)"
  overlay: "rgba(0, 27, 61, 0.28)"
text:
  primary: "#001B3D"
  secondary: "#64748B"
  tertiary: "#94A3B8"
  inverse: "#FFFFFF"
  action: "#007A65"
  link: "#1466F5"
  error: "#D9474F"
borders:
  default: "1px solid #DCE5EE"
  soft: "1px solid #E5ECF3"
  active: "1px solid rgba(0, 187, 148, 0.45)"
  danger: "1px solid rgba(217, 71, 79, 0.40)"
  focus: "2px solid rgba(0, 187, 148, 0.45)"
typography:
  family: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  display_weight: 800
  title_weight: 700
  body_weight: 500
  label_weight: 700
  number_weight: 800
  line_height_tight: 1.1
  line_height_body: 1.5
  tracking: "0"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  "2xl": "2rem"
  "3xl": "3rem"
  page_mobile: "1rem"
  page_desktop: "1.5rem"
  section_gap: "1rem"
radius:
  control: "0.75rem"
  section: "1rem"
  card: "1.5rem"
  hero: "2rem"
  pill: "9999px"
shadows:
  none: "none"
  subtle: "0 12px 30px rgba(0, 27, 61, 0.06)"
  card: "0 24px 70px rgba(0, 27, 61, 0.08)"
  sidebar: "18px 0 55px rgba(0, 27, 61, 0.08)"
  modal: "0 30px 80px rgba(0, 27, 61, 0.18)"
icons:
  library: lucide-react
  style: outline
  stroke: "2px"
  sizes: ["16px", "20px", "24px", "32px"]
  color_default: "#64748B"
  color_active: "#00BB94"
motion:
  duration_fast: "150ms"
  duration_base: "200ms"
  duration_slow: "300ms"
  easing: "ease-out"
  hover_transform: "translateY(-1px)"
  active_transform: "scale(0.98)"
layout:
  shell: responsive-sidebar
  max_width: "100%"
  mobile_header_height: "4rem"
  desktop_sidebar_collapsed: "5.5rem"
  desktop_sidebar_expanded: "19rem"
  desktop_behavior: contained-operational-workspace
  mobile_behavior: document-flow-with-sticky-priority-actions
components:
  button:
    radius: pill-or-section
    height: "48px"
    primary: "solid #00BB94 with white text"
    secondary: "soft #E6F7F2 with #001B3D text"
    destructive: "solid #D9474F with white text"
    icon_gap: "0.5rem"
  input:
    radius: pill
    height: "44px to 48px"
    background: "#FFFFFF or #F8FAFC"
    border: "#DCE5EE"
    focus: "border #00BB94 with soft teal ring"
    icon_position: left
  card:
    radius: "1.5rem to 2rem"
    background: "#FFFFFF"
    border: "soft clinical border"
    shadow: subtle-to-card
    padding: "1rem to 1.5rem"
  badge:
    radius: pill
    weight: 700
    size: compact
    variants: [default, secondary, success, warning, destructive, muted]
  tabs:
    radius: pill
    container: "white surface with border and inner padding"
    active: "solid teal with white text"
    inactive: "muted text with soft hover surface"
  navbar:
    type: sidebar-first
    background: "white to cool operational gradient"
    active: "teal accent with clear icon and label"
    mobile: "top bar plus full-height drawer"
  modal:
    overlay: "navy translucent backdrop with blur"
    panel: "white card, large radius, soft border"
    positions: [center, bottom-sheet-mobile]
  table:
    wrapper: "rounded section with horizontal overflow"
    header: "muted semibold labels"
    row: "soft border with subtle hover"
    density: comfortable
  metric-card:
    radius: "1.5rem"
    number: "large bold navy"
    label: "muted operational context"
    accent: "teal or blue icon surface"
  empty-state:
    radius: "1.75rem"
    border: "dashed #CBD5E1"
    background: "#F8FAFC"
    icon: "soft teal or blue tile"
states:
  default:
    opacity: 1
    shadow: subtle
  hover:
    background_shift: "slightly lighter or tinted"
    transform: "translateY(-1px) only for raised controls"
  active:
    transform: "scale(0.98)"
    contrast: stronger
  focus:
    ring: "2px rgba(0, 187, 148, 0.45)"
    outline: none
  disabled:
    opacity: 0.5
    cursor: not-allowed
  loading:
    indicator: "small spinner or skeleton"
    text: "short operational label"
  success:
    color: "#22C55E"
    background: "rgba(34, 197, 94, 0.10)"
  warning:
    color: "#F59E0B"
    background: "rgba(245, 158, 11, 0.12)"
  error:
    color: "#D9474F"
    background: "rgba(217, 71, 79, 0.10)"
  selected:
    color: "#00BB94"
    background: "rgba(0, 187, 148, 0.12)"
    border: "rgba(0, 187, 148, 0.45)"
---

## Overview

O HealthCall é um sistema operacional clínico para APS/UBS. A interface deve parecer feita para uma unidade de saúde em funcionamento real: fila, chamada, recepção, pendências, documentos, avisos e display precisam ser lidos rapidamente por pessoas sob demanda contínua.

Use este documento como fonte única de verdade visual. Agentes devem priorizar os tokens do YAML e, quando houver conflito, seguir a intenção operacional descrita aqui: clareza primeiro, ação principal evidente, baixa fricção cognitiva e sofisticação discreta.

A estética não deve buscar impacto promocional. O produto deve transmitir presença clínica em tempo real, organização silenciosa e confiança institucional. Cada tela deve responder em poucos segundos: onde estou, o que está acontecendo, o que precisa de atenção e qual ação devo tomar agora.

## Brand Personality

O HealthCall deve ser claro, calmo, seguro, profissional, acolhedor e eficiente. A sensação correta é de um centro de comando clínico premium, não de um dashboard SaaS genérico.

Use linguagem visual institucional sem burocracia. Os elementos devem parecer sólidos o bastante para um ambiente público de saúde e leves o bastante para uso durante turnos longos. Evite dramatização visual, excesso de decoração e qualquer aparência futurista abstrata.

A personalidade deve aparecer em decisões pequenas: labels objetivos, ícones úteis, estados de erro que orientam, cards com respiro, métricas legíveis e navegação que se comporta como infraestrutura operacional. Quando precisar escolher entre expressividade e entendimento imediato, escolha entendimento.

## Color System

O azul profundo `#001B3D` sustenta identidade, títulos fortes, texto principal e áreas institucionais. Use-o para dar seriedade clínica e estrutura, nunca como uma massa escura opressiva.

O verde clínico `#00BB94` é a cor de ação principal, confirmação, presença ativa e progresso operacional. Use em CTAs, estados selecionados, foco, indicadores online e destaques de fluxo. Não use verde vivo como decoração gratuita; ele deve significar ação ou estado útil.

O azul tecnológico `#1466F5` apoia navegação, informação, ícones de contexto e estados que comunicam sistema, display ou inteligência operacional. Use com superfícies claras como `#EAF3FF` para manter contraste suave.

Fundos devem ser claros ou frios: `#F4F6F8` para a aplicação, `#FFFFFF` para superfícies principais e `#F8FAFC` para campos, filtros e blocos internos. Esta separação cria hierarquia sem depender de sombras pesadas.

Cores semânticas precisam ser elegantes. Sucesso usa verde com fundo translúcido; aviso usa âmbar com contenção; erro usa vermelho controlado, sem alarmismo visual. Vermelho só aparece para risco, exclusão, falha ou validação crítica.

## Typography

Use uma fonte sem serifa contemporânea e neutra, seguindo a pilha definida no YAML. A tipografia deve favorecer leitura rápida em recepção, triagem e atendimento, inclusive em telas pequenas e monitores públicos.

Títulos são curtos, fortes e objetivos. Use peso 700 ou 800 para nomes de módulos, cards principais e números de métricas. Texto de apoio deve usar peso médio, cor secundária e linha mais aberta para reduzir fadiga visual.

Labels e badges devem ser firmes, mas compactos. Evite pesos finos, tracking negativo e textos longos em áreas operacionais. Números de fila, totais, prazos e contadores devem ser visualmente dominantes e sempre acompanhados de contexto.

Não use tipografia ornamental. O HealthCall precisa parecer confiável durante trabalho clínico, não estilizado para campanha.

## Spacing and Rhythm

Construa telas com respiro generoso e ritmo previsível. Use gaps consistentes entre módulos, filtros, cards e listas. Em desktop, prefira painéis bem separados e colunas claras; em mobile, empilhe blocos com espaçamento suficiente para toque e leitura.

Cards principais devem usar padding entre `1rem` e `1.5rem`, aumentando quando o conteúdo for de decisão clínica ou operacional. Listas podem ser mais densas, mas cada item ainda precisa ter área de toque confortável, separação clara e hierarquia interna.

Evite agrupamentos apertados. Quando muitos controles forem necessários, organize em header de seção, filtros compactos e bloco de ação separado. A tela deve parecer modular, não acumulada.

O ritmo visual deve guiar a sequência natural: contexto, resumo, ação principal, ações complementares e apoio informacional. Não coloque ações secundárias competindo com o CTA principal.

## Layout Principles

O layout base é um workspace operacional com sidebar no desktop e navegação superior com drawer no mobile. A navegação é parte do sistema, não uma decoração: deve informar módulo ativo, status de operação e acesso rápido aos fluxos principais.

Cada tela deve ter um bloco dominante de contexto ou operação. Exemplos: fila do dia, criação de pendência, lista de pacientes, painel de display ou formulário clínico. Ao lado ou abaixo, use blocos secundários para filtros, métricas e suporte.

No desktop, favoreça áreas contidas quando o fluxo exige foco contínuo, como fila, recepção e painéis de acompanhamento. Use rolagem interna somente quando ela preservar o contexto principal visível. Para páginas documentais ou formulários longos, rolagem vertical é aceitável.

No mobile, a tela deve parecer nativa e não uma versão apertada do desktop. Priorize uma coluna, tabs fixas quando houver alternância importante, CTA visível e cards maiores. Evite múltiplas colunas estreitas e não force tabelas complexas onde uma lista operacional funciona melhor.

## Component Rules

Botões devem parecer ações seguras e diretas. O CTA principal usa verde sólido, texto branco, peso alto e altura confortável. Use ícone à esquerda quando ele acelerar reconhecimento. Botões secundários usam superfícies suaves; ações destrutivas usam vermelho apenas quando a intenção for crítica.

Inputs devem ser limpos, arredondados e fáceis de escanear. Use labels quando o contexto não for óbvio, placeholder claro e foco em teal com anel suave. Ícones de busca, filtro ou calendário devem ajudar o usuário a reconhecer o campo antes de ler.

Cards são blocos operacionais premium. Use raio grande, borda suave, fundo branco e sombra contida. Um card deve conter uma unidade clara de decisão ou leitura. Não aninhe cards dentro de cards; para subdivisões, use seções internas com fundo claro ou separadores.

Badges comunicam estado, prioridade, sala, prazo ou categoria. Devem ser pequenos, arredondados e legíveis. Não use badges como enfeite: cada badge precisa reduzir o tempo de leitura.

Tabs devem funcionar como troca de modo ou visão. O estado ativo precisa ser inequívoco com fundo teal ou contraste forte. Em mobile, tabs podem ficar fixas quando alternam entre criação e lista, ou entre visões essenciais.

Navbar e sidebar devem reforçar orientação. Mostre ícone, label e descrição quando houver espaço. No modo compacto, use tooltip claro. O item ativo precisa aparecer como localização operacional, não apenas como link destacado.

Modais devem interromper apenas para decisões focadas. Use overlay azul profundo translúcido, painel branco, raio grande e borda leve. Em mobile, prefira bottom sheet quando a ação for rápida; use modal central para confirmação, edição complexa ou alerta crítico.

Tabelas são para comparação e dados estruturados. Use cabeçalho discreto, linhas com hover suave e overflow horizontal controlado. Em mobile, converta para list-item quando a leitura linha a linha for mais segura.

Metric-cards devem dar leitura imediata. Número grande em azul profundo, label curta, ícone em tile teal ou azul e contexto visível. Métrica sem contexto não deve aparecer.

Empty-states devem orientar sem parecer erro. Use fundo claro, borda tracejada suave, ícone em superfície clínica e texto curto dizendo o estado atual e o próximo passo possível.

## Interaction and Motion

Microinterações devem ser rápidas, discretas e funcionais. Use transições de `150ms` a `300ms` com `ease-out`. Hover pode clarear superfície, mudar borda ou elevar um controle em `translateY(-1px)` quando ele for clicável.

Active states devem responder imediatamente, com leve `scale(0.98)` em botões e controles de toque. Focus states precisam ser visíveis com anel teal suave e sem depender apenas de cor.

Loading deve preservar confiança. Use spinner pequeno em botões, skeleton em listas ou estados textuais curtos como "Salvando" e "Carregando". Não use animações chamativas nem delays ornamentais.

Transições de entrada podem usar fade e deslocamento leve, especialmente em listas e modais. Evite movimento em excesso em telas de alta demanda, pois a interface precisa apoiar atenção, não disputar atenção.

## Responsive Behavior

No desktop, use sidebar fixa, áreas de trabalho amplas e grids previsíveis. O conteúdo principal deve se adaptar ao estado colapsado ou expandido da navegação sem quebrar hierarquia. Painéis operacionais podem ocupar a altura útil da viewport para manter o fluxo visível.

No tablet e mobile, simplifique a arquitetura: topo com identidade e módulo ativo, drawer para navegação, conteúdo em uma coluna e ações principais próximas do ponto de decisão. Mantenha alvos de toque com pelo menos `44px` de altura.

Métricas em mobile devem virar cards empilhados ou grid de duas colunas somente quando os textos couberem com folga. Filtros devem ocupar largura total ou virar controles segmentados quando forem alternâncias frequentes.

Tabelas complexas devem se transformar em cards/list-items no mobile. Preserve a informação mais importante no topo do item: nome, estado, prioridade, prazo ou destino. Ações secundárias ficam agrupadas no fim do item.

## Accessibility Rules

Garanta contraste suficiente entre texto e fundo. Texto principal usa `#001B3D`; texto secundário usa `#64748B` apenas em tamanhos legíveis e com peso adequado. Placeholder nunca deve ser a única instrução de um campo crítico.

Todo controle interativo precisa ter estado de foco visível, nome acessível e área de toque confortável. Ícones isolados exigem `aria-label` ou tooltip quando o significado não for universal.

Não comunique estado apenas por cor. Combine cor com texto, ícone, badge ou posição. Erros devem explicar como corrigir; sucesso deve confirmar de forma breve; avisos devem indicar urgência sem assustar.

Use HTML semântico para estruturar páginas: `main`, `section`, headings ordenados, botões reais para ações e links reais para navegação. Modais precisam usar `role="dialog"`, `aria-modal` e fechamento por Escape quando seguro.

## Design Guardrails

Não crie visual de landing page de startup, dashboard SaaS genérico, app fitness, app de banco, painel neon ou software hospitalar datado. A interface deve parecer ferramenta central de uma unidade de saúde.

Não use grandes massas escuras sem função, gradientes decorativos sem informação, sombras pesadas em excesso, bordas grossas ou efeitos que reduzam legibilidade. A sofisticação do HealthCall vem de proporção, clareza e consistência.

Não aumente densidade para mostrar tudo ao mesmo tempo. Em operação clínica, excesso de informação vira ruído. Mostre o que orienta a próxima ação e mova o restante para áreas secundárias, filtros ou detalhes progressivos.

Não use componentes fora de sua função: badge não é botão, card não é seção decorativa, modal não é página e CTA principal não deve competir com várias ações equivalentes.

Toda nova tela deve passar por este checklist: contexto evidente, status atual legível, ação principal clara, estados previstos, mobile confortável, contraste adequado e nenhuma decoração sem função operacional.
