# Design System Prompt — HealthCall

Você está trabalhando no HealthCall, um sistema operacional clínico para APS/UBS.  
Toda interface criada, ajustada ou refinada deve seguir este sistema de design com consistência rigorosa.

## Essência da marca

O HealthCall não deve parecer apenas “um sistema médico”.  
Ele deve transmitir a sensação de:

- operação clínica em tempo real
- confiança institucional
- organização silenciosa
- fluidez operacional
- clareza visual para ambientes de alta demanda
- tecnologia aplicada à realidade da atenção primária

A interface deve equilibrar:

- **solidez clínica**
- **leveza operacional**
- **sofisticação discreta**
- **alta legibilidade**
- **baixa fricção cognitiva**

O resultado visual deve parecer um **sistema clínico premium**, moderno, humano e confiável, pensado para uso contínuo em unidades de saúde reais.

---

## Direção visual

A linguagem visual do HealthCall deve seguir estes princípios:

- visual limpo, respirado e modular
- aparência premium, mas sem exagero estético
- sensação de dashboard clínico contemporâneo
- prioridade para legibilidade e hierarquia
- uso de cards grandes, bem definidos e com cantos amplamente arredondados
- contraste suave, evitando aparência agressiva ou “tech demais”
- composição baseada em blocos organizados, não em telas poluídas
- interface com estética próxima de software operacional moderno, não de app genérico de hospital antigo

---

## Personalidade da interface

A UI do HealthCall deve ser percebida como:

- clara
- calma
- segura
- profissional
- acolhedora
- inteligente
- eficiente
- institucional sem parecer burocrática

Evite qualquer visual que pareça:

- datado
- hospitalar demais
- excessivamente frio
- genérico
- carregado
- com cara de template comum
- neon futurista
- escuro opressivo sem contraste funcional

---

## Paleta de cores

Use a paleta da marca como base principal.

### Cores principais
- Azul profundo institucional
- Azul médio tecnológico
- Verde/teal clínico
- Tons claros frios para superfícies de apoio
- Branco ou off-white para respiro visual

### Intenção cromática
- **Azul:** confiança, sistema, inteligência, estabilidade
- **Verde/teal:** saúde, fluxo, confirmação, cuidado
- **Fundos claros ou claros-tintados:** clareza e leveza
- **Cores semânticas:** devem ser elegantes, nunca gritantes

### Regras
- verde vivo deve ser usado para CTA principal, sucesso e destaques de ação
- azul profundo deve sustentar branding, títulos fortes e áreas institucionais
- teal e azul claro devem aparecer como apoio visual em ícones, métricas e estados
- evite excesso de saturação
- evite vermelho agressivo
- evite grandes massas escuras sem função clara

---

## Tipografia

A tipografia deve ser moderna, altamente legível e neutra.

### Direção tipográfica
- fonte sem serifa contemporânea
- aparência limpa e profissional
- excelente leitura em mobile e desktop
- títulos fortes e curtos
- textos de apoio com ótima respirabilidade

### Hierarquia
- títulos grandes, firmes e com peso semibold ou bold
- subtítulos claros, com menor contraste que o título
- labels objetivos e simples
- números de métricas com forte destaque
- textos auxiliares discretos, porém legíveis

### Regras
- nunca usar tipografia ornamental
- nunca usar pesos excessivamente finos em contextos clínicos
- priorizar clareza acima de estilo
- evitar blocos longos com pouco espaçamento

---

## Layout e composição

Toda tela deve ser construída como um sistema de blocos operacionais.

### Estrutura esperada
- header funcional e limpo
- hero operacional ou bloco principal de contexto
- cards de métricas ou resumo
- bloco principal de ação
- blocos secundários de suporte
- navegação claramente separada do conteúdo

### Regras de composição
- trabalhar com bastante espaçamento
- evitar agrupamentos apertados
- usar grids simples e previsíveis
- reforçar hierarquia com tamanho, peso, cor e espaçamento
- cada bloco deve parecer intencional
- sempre deixar claro o que é:
  - contexto
  - status
  - ação principal
  - ação secundária
  - apoio informacional

---

## Estilo dos componentes

### Cards
- grandes
- arredondados
- premium
- com bordas suaves ou contraste delicado
- sensação de superfície organizada e modular
- devem parecer blocos operacionais confiáveis

### Botões
- CTA principal largo, dominante e muito claro
- visual sólido, simples e extremamente legível
- cantos arredondados
- ícone opcional à esquerda
- alto contraste com o fundo
- devem parecer “ação segura e direta”

### Inputs
- visual limpo, alto conforto de leitura
- bordas suaves ou preenchimento sutil
- ícones discretos e úteis
- labels acima do campo quando necessário
- placeholder claro, nunca com contraste excessivamente baixo
- foco visual elegante e perceptível

### Métricas e KPIs
- números grandes
- contexto sempre visível
- ícone de apoio opcional
- organização em cards curtos e fáceis de escanear
- leitura imediata em poucos segundos

### Ícones
- outline moderno ou duotone discreto
- traço limpo
- sem excesso de detalhe
- aparência coerente com software clínico contemporâneo

---

## Experiência mobile

No mobile, o HealthCall deve parecer um produto nativo e refinado, não uma adaptação apertada do desktop.

### Princípios
- priorizar leitura rápida
- toque confortável
- spacing generoso
- blocos bem separados
- CTA principal sempre evidente
- navegação simples
- conteúdo com forte escaneabilidade

### Regras
- evitar excesso de elementos por dobra
- evitar cards pequenos demais
- evitar texto excessivamente denso
- usar seções com hierarquia muito clara
- métricas devem ser lidas instantaneamente
- formulários devem parecer leves e rápidos

---

## Hierarquia de informação

Sempre priorizar esta ordem:

1. contexto da tela
2. estado atual ou resumo operacional
3. ação principal
4. ações complementares
5. conteúdo de apoio
6. navegação secundária

Ao desenhar qualquer interface, o usuário deve entender em poucos segundos:

- onde ele está
- o que está acontecendo
- o que exige atenção
- qual a próxima ação recomendada

---

## Microinterações

As microinterações devem ser discretas, elegantes e funcionais.

### Devem transmitir
- resposta imediata
- fluidez
- precisão
- segurança

### Exemplos esperados
- hover suave
- focus states claros
- transições curtas
- feedback visual em toque/press
- mudanças de estado sem brusquidão

### Evitar
- animações chamativas
- efeitos exagerados
- delays desnecessários
- comportamento ornamental sem função

---

## Estados visuais

Todo componente deve prever estados consistentes:

- default
- hover
- active
- focus
- disabled
- loading
- success
- warning
- error
- empty

### Regras
- estados devem ser visíveis, mas elegantes
- feedback deve ser imediato
- erro deve orientar, não assustar
- sucesso deve ser claro e calmo
- loading deve transmitir progresso sem poluição

---

## Semântica visual do produto

O HealthCall deve comunicar visualmente:

- fluxo
- triagem
- organização de atendimento
- presença e chamada
- suporte clínico
- operação em tempo real
- confiabilidade de sistema
- inteligência aplicada à rotina

Não criar interfaces que pareçam:
- landing page de startup genérica
- app fitness
- app de banco
- software hospitalar ultrapassado
- painel futurista abstrato sem utilidade prática

---

## Regras de ouro

1. Clareza sempre vem antes de decoração.
2. A interface deve parecer operacional, não promocional.
3. Toda tela precisa ter uma ação principal óbvia.
4. O sistema deve respirar visualmente.
5. O usuário deve escanear a tela em segundos.
6. O visual deve parecer premium, mas realista para APS/UBS.
7. Tudo deve reforçar confiança, fluidez e organização.
8. O HealthCall deve ter consistência entre branding, produto e operação clínica.

---

## Instrução final para qualquer agente

Ao criar telas, componentes, fluxos ou refinamentos visuais para o HealthCall:

- preserve a identidade clínica premium da marca
- mantenha consistência entre cor, tipografia, espaçamento e componentes
- priorize legibilidade, hierarquia e eficiência operacional
- desenhe como se fosse um sistema central da unidade de saúde
- faça a interface parecer moderna, humana e extremamente confiável
- toda decisão visual deve melhorar o entendimento, a rapidez e a segurança de uso