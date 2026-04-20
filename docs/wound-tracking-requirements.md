# Requisitos Wound Tracking - Sistema de Acompanhamento de Curativos

## 1. Visão Geral

O Wound Tracking é uma feature que permite aos profissionais de saúde acompanhar a evolução de feridas/curativos de pacientes, registrando fotografias, medidas, medicações e observações clínicas em um histórico evolutivo visualizável em timeline interativa.

---

## 2. Usuários e Papéis

- **Enfermeiro/Técnico de Enfermagem**: Registra evoluções, captura fotos, prescreve coberturas
- **Médico**: Visualiza histórico, analisa progresso, muda plano terapêutico
- **Paciente**: Pode visualizar próprio histórico (futura integração)

---

## 3. Requisitos Funcionais Principais

### 3.1 Gestão de Pacientes com Feridas

**RF3.1.1** O sistema deve listar todos os pacientes que possuem feridas em acompanhamento

**RF3.1.2** O sistema deve permitir selecionar um paciente para ver todas suas feridas ativas

**RF3.1.3** O sistema deve exibir o status de cada ferida (ativa, cicatrizada, acompanhamento)

**RF3.1.4** O sistema deve permitir filtrar feridas por localização anatômica

**RF3.1.5** O sistema deve permitir visualizar feridas encerradas com motivo de fechamento

---

### 3.2 Encerramento/Fechamento de Curativo

**RF3.2.0** O sistema deve permitir encerrar o acompanhamento de uma ferida registrando o tipo de fechamento:

- **Alta**: Ferida cicatrizada completamente, alta gerenciada pelo profissional
- **Curativo pelo Próprio Paciente**: Paciente já consegue fazer autocuidado, sem necessidade de acompanhamento profissional
- **Curativo na UBS**: Transferência para continuidade de cuidado na Unidade Básica de Saúde (UBS)

**RF3.2.0.1** Ao selecionar encerramento, o sistema deve exigir:
- Tipo de fechamento (radio/select)
- Data de fechamento
- Motivo/observações (textarea obrigatória)
- Foto final (opcional)
- Profissional que finalizou (automático)

**RF3.2.0.2** O sistema deve exibir na lista de feridas o status "Encerrada" com indicador visual do tipo de fechamento

**RF3.2.0.3** O sistema deve permitir visualizar histórico completo de uma ferida encerrada

**RF3.2.0.4** O sistema deve permitir reabrir uma ferida encerrada (com justificativa) se necessário

**RF3.2.0.5** Ao encerrar com "Curativo na UBS", o sistema deve permitir gerar referência/documento para UBS

---

### 3.3 Registro Inicial de Ferida

**RF3.3.1** Ao iniciar acompanhamento de nova ferida, o profissional deve:
- Selecionar o paciente
- Definir localização anatômica através de Body Diagram (seleção clicável do corpo)
- Registrar data de início da lesão
- Informar etiologia (úlcera varicosa, pé diabético, úlcera de pressão, pós-cirúrgica, traumática, outra)
- Informar classificação/grau (ex: Grau II, Estágio 3)
- Capturar foto inicial

**RF3.3.2** O sistema deve permitir registrar comorbidades associadas (DM, HAS, IVC, tabagismo, obesidade, outra)

**RF3.3.3** O sistema deve permitir descrever o aspecto inicial do leito da ferida (granulação, epitelização, esfacelo, necrose, misto)

**RF3.3.4** O sistema deve permitir classificar as bordas (regulares, irregulares, descoladas, maceradas, hiperqueratóticas)

---

### 3.4 Medições da Ferida

**RF3.4.1** O sistema deve capturar e armazenar medidas em centímetros:
- Comprimento (C)
- Largura (L)
- Profundidade (P)

**RF3.3.2** O sistema deve permitir atualizar medidas a cada follow-up

**RF3.3.3** O sistema deve calcular automaticamente a redução percentual de área (C x L)

**RF3.3.4** O sistema deve estimar taxa de cicatrização baseada na curva de redução

---

### 3.4 Avaliação Clínica Completa

**RF3.4.1** A cada registro de evolução, o profissional deve informar:

- **Exsudato**: ausente, seroso, sanguinolento, serossanguinolento, purulento
- **Odor**: ausente, discreto, fétido
- **Pele perilesional**: íntegra, eritematosa, macerada, descamativa, edemaciada
- **Dor**: escala 0-10 (slider)

**RF3.4.2** O sistema deve permitir selecionar múltiplas categorias para um mesmo campo quando aplicável

---

### 3.5 Medicações e Conformidade

**RF3.5.1** O sistema deve registrar se há uso de:
- Antibiótico: sim/não + tipo (ex: Sulfadiazina de Prata, Neomicina, Colagenase)
- Pomada: sim/não + tipo (ex: Dermazina, Nebacetin, AGE)

**RF3.5.2** O sistema deve permitir registrar não-conformidades detectadas:
- Tipo: pomada inadequada, ATB não prescrito, outro produto não permitido, sem cobertura adequada, outro
- Descrição: O que foi encontrado indevidamente?
- Ação tomada: Como foi corrigido?

**RF3.5.3** O sistema deve exibir alertas visuais quando não-conformidade for detectada

---

### 3.6 Gestão de Coberturas

**RF3.6.1** O sistema deve permitir selecionar cobertura utilizada em cada registro com opções pré-definidas:
- AGE (Ácidos Graxos)
- Alginato de Cálcio
- Hidrogel
- Hidrocolóide
- Carvão Ativado com Prata
- Espuma de Poliuretano
- Colagenase
- Papaína
- Sulfadiazina de Prata
- Bota de Unna
- Curativo a Vácuo (VAC)
- Outra (campo texto)

**RF3.6.2** O sistema deve permitir anotações sobre a cobertura utilizada

---

### 3.7 Captura e Armazenamento de Fotos

**RF3.7.1** O sistema deve permitir capturar foto via câmera do dispositivo (mobile)

**RF3.7.2** O sistema deve permitir fazer upload de múltiplas fotos em um único registro

**RF3.7.3** O sistema deve armazenar fotos em Supabase Storage com cache local via IndexedDB (offline-first)

**RF3.7.4** Cada foto deve ter associada: data/hora de captura, ordem, descrição opcional

**RF3.7.5** O sistema deve exibir a foto principal como thumbnail na listagem

---

### 3.9 Observações e Anotações

**RF3.9.1** O sistema deve permitir campo de observações/anotações livres em cada registro

**RF3.9.2** O sistema deve registrar automaticamente profissional, data e hora de cada registro

**RF3.9.3** O sistema deve permitir visualizar histórico de quem fez cada registro (profissional + data)

---

### 3.10 Galeria e Timeline de Fotos

**RF3.10.1** O sistema deve exibir todas as fotos de uma ferida em galeria ordenada por data

**RF3.10.2** O sistema deve permitir expandir/ampliar foto individual

**RF3.10.3** O sistema deve exibir data, hora e profissional para cada foto

**RF3.10.4** O sistema deve permitir deletar foto individual (com confirmação)

**RF3.10.5** O sistema deve permitir navegar entre fotos de forma intuitiva (thumbs laterais ou cards)

---

### 3.11 Comparação de Fotos (Slider)

**RF3.11.1** O sistema deve permitir selecionar 2 fotos para comparação lado-a-lado

**RF3.11.2** O sistema deve exibir slider vertical/horizontal para comparar antes/depois

**RF3.11.3** O sistema deve exibir datas das fotos comparadas

**RF3.11.4** O sistema deve permitir trocar ordem (qual é "antes" e qual é "depois")

---

### 3.12 Tabela de Evolução

**RF3.12.1** O sistema deve exibir tabela com histórico completo contendo:
- Data do registro
- Medidas (C x L x P)
- Aspecto do leito
- Bordas
- Exsudato
- Odor
- Dor (0-10)
- Cobertura utilizada
- ATB + Pomada
- Não-conformidade (sim/não)
- Observações
- Profissional que registrou

**RF3.12.2** O sistema deve permitir expandir linha da tabela para ver detalhes completos

**RF3.12.3** O sistema deve permitir ordenar tabela por data (ascendente/descendente)

**RF3.12.4** O sistema deve permitir rolagem horizontal em mobile para ver todas colunas

---

### 3.13 Gráficos e Analytics

**RF3.13.1** O sistema deve exibir gráfico de evolução de medidas (C, L, P) ao longo do tempo

**RF3.13.2** O sistema deve calcular e exibir redução percentual de área (C x L)

**RF3.13.3** O sistema deve estimar e exibir taxa de cicatrização em dias (baseado em curva)

**RF3.13.4** O sistema deve permitir filtrar gráfico por período (últimas 2 semanas, mês, etc)

**RF3.13.5** O sistema deve exibir alertas na timeline quando detectar:
- Aumento de medidas (piora)
- Aumento de exsudato
- Aparecimento de odor fétido
- Aumento de dor
- Mudança de aspecto para esfacelo/necrose

---

### 3.14 Body Diagram (Seletor Anatômico)

**RF3.14.1** O sistema deve exibir representação visual do corpo humano (frente e costas)

**RF3.14.2** O sistema deve permitir clicar em regiões:
- Cabeça
- Pescoço
- Tórax
- Abdômen
- Membro Superior Direito
- Membro Superior Esquerdo
- Membro Inferior Direito
- Membro Inferior Esquerdo

**RF3.14.3** Ao clicar em região, deve abrir sub-seleção de áreas específicas da região

**RF3.14.4** O sistema deve salvar localização selecionada em formato padronizado (ex: "MaleoloLE")

**RF3.14.5** O sistema deve exibir histórico de feridas filtradas pela localização selecionada

**RF3.14.6** O sistema deve permitir visualizar todas feridas do paciente sobreposto no body diagram

---

### 3.15 Responsividade Mobile vs Desktop

**RF3.15.1** Em Mobile (xl:hidden):
- Exibir tabs para navegação entre seções
- Formulário com campos empilhados verticalmente
- Fotos em galeria scrollável horizontal
- Tabela com scroll horizontal
- Gráficos responsivos

**RF3.15.2** Em Desktop (xl:flex):
- Layout com múltiplos painéis lado-a-lado
- Body diagram na esquerda
- Timeline/fotos no centro superior
- Formulário inline no centro
- Tabela/gráficos abaixo

---

### 3.16 Offline-First e Sincronização

**RF3.16.1** O sistema deve permitir preenchimento de formulário e captura de fotos sem conexão

**RF3.16.2** O sistema deve armazenar dados localmente via IndexedDB

**RF3.16.3** O sistema deve sincronizar automaticamente com Supabase quando conexão restaurada

**RF3.16.4** O sistema deve indicar visualmente quando há dados em pendência de sincronização

**RF3.16.5** O sistema deve preservar draft de formulário não submetido

---

### 3.17 Agenda de Trocas (Future)

**RF3.17.1** O sistema deve permitir registrar próxima data sugerida para próximo curativo

**RF3.17.2** O sistema deve integrar com feature de Appointments para marcar consulta

**RF3.17.3** O sistema deve enviar notificação 24h antes da próxima troca recomendada

---

### 3.18 Relatório e Exportação (Future)

**RF3.18.1** O sistema deve permitir exportar histórico de ferida em PDF

**RF3.18.2** O PDF deve incluir: dados iniciais, timeline de fotos, tabela de evolução, gráficos

**RF3.18.3** O sistema deve permitir exportar dentro de um padrão de documento legal

---

## 4. Requisitos Não-Funcionais

### 4.1 Performance

**RNF4.1.1** Carregamento da lista de feridas deve ser < 2 segundos

**RNF4.1.2** Exibição de galeria com 50+ fotos deve ser fluida (lazy-load)

**RNF4.1.3** Gráficos devem renderizar em < 1 segundo

---

### 4.2 Segurança

**RNF4.2.1** Apenas profissional logado pode visualizar dados de feridas

**RNF4.2.2** Dados de pacientes não devem ficar expostos em cache do navegador desprotegido

**RNF4.2.3** Uploads de foto devem validar tipo e tamanho (máximo 5MB para imagem)

**RNF4.2.4** Acesso a fotos deve ser controlado por permissões do paciente/unidade

---

### 4.3 Confiabilidade

**RNF4.3.1** Sincronização offline deve estar 100% confiável (nenhum dado perdido)

**RNF4.3.2** Deletar um registro deve exigir confirmação

**RNF4.3.3** Fotografia deletada deve ser removida também do storage

---

### 4.4 Usabilidade

**RNF4.4.1** Interface deve ser intuitiva para profissionais com pouca experiência digital

**RNF4.4.2** Campos obrigatórios devem estar claramente marcados

**RNF4.4.3** Feedback visual (toast/validação) deve ser claro e em português

**RNF4.4.4** Captura de foto deve funcionar em navegadores mobile com acesso a câmera

---

### 4.5 Acessibilidade

**RNF4.5.1** Todos inputs devem ter labels associados

**RNF4.5.2** Cores não devem ser o único indicador de informação

**RNF4.5.3** Contraste entre texto e fundo deve ser >= 4.5:1

---

### 4.6 Compatibilidade

**RNF4.6.1** Deve funcionar em Chrome, Safari e Firefox

**RNF4.6.2** Deve funcionar como PWA (Progressive Web App) com offline

**RNF4.6.3** Deve funcionar em iOS e Android

---

## 5. Fluxos Principais

### 5.1 Fluxo: Registrar Nova Ferida

1. Profissional acessa página Wound Tracking
2. Clica em "Nova Ferida"
3. Seleciona paciente
4. Usa Body Diagram para clicar em localização
5. Preenche: etiologia, data início, classificação
6. Marca comorbidades
7. Descreve aspecto inicial (checkboxes múltiplas)
8. Captura foto via câmera
9. Registra medidas iniciais (C, L, P)
10. Sistema salva ferida em estado "ativa"

### 5.2 Fluxo: Registrar Evolução de Ferida Existente

1. Profissional seleciona ferida do paciente
2. Clica em "Novo Registro de Evolução"
3. Captura nova foto
4. Preenche avaliação: aspecto, bordas, exsudato, odor, dor
5. Registra medicações (ATB, pomada) + conformidade
6. Seleciona cobertura utilizada
7. Adiciona observações
8. Sistema calcula automaticamente mudança de medidas e taxa cicatrização
9. Sincroniza com Supabase (ou fica em cache se offline)

### 5.3 Fluxo: Analisar Progresso

1. Profissional seleciona ferida
2. Visualiza timeline de fotos
3. Vê gráfico de evolução (C x L x P)
4. Compara 2 fotos com slider
5. Consulta tabela de evolução
6. Avalia se há alertas de piora/complicação

---

## 6. Dados Esperados por Registro

Cada registro de evolução deve conter:

- wound_id (referência)
- data_registro (timestamp)
- profissional_id (quem registrou)
- foto_url(s)
- medida_c, medida_l, medida_p (cm)
- aspecto_leito (array de strings)
- bordas (array de strings)
- exsudato (enum)
- odor (enum)
- pele_perilesional (array de strings)
- dor_escala (0-10)
- uso_antibiotico (boolean)
- antibiotico_tipo (string)
- uso_pomada (boolean)
- pomada_tipo (string)
- cobertura_utilizada (string)
- nao_conformidade_detectada (boolean)
- nao_conformidade_tipo (enum)
- nao_conformidade_descricao (texto)
- nao_conformidade_acao (texto)
- observacoes (texto livre)

---

## 7. Dependências e Integrações

### 7.1 Internas (HealthCall)

- Feature `dashboard`: Listar pacientes
- Feature `appointments`: Integração com agenda
- Componentes shadcn/ui: Tabs, Select, Buttons, Cards
- Hook `useAuth()`: Identificar profissional
- Supabase: Banco de dados + Storage

### 7.2 Externas

- Recharts: Gráficos de evolução
- Framer Motion: Animações (slider, comparação)
- Browser API: Geolocation (location), Camera (getUserMedia)

---

## 8. Roadmap de Fases

### Fase 1 (MVP - Essencial)
- ✅ CRUD de feridas
- ✅ Captura de foto
- ✅ Registro de evolução (campos principais)
- ✅ Galeria + Timeline
- ✅ Body Diagram
- ✅ Comparator Slider
- ✅ Tabela de Evolução
- ✅ Offline-first com IndexedDB

### Fase 2 (Analytics)
- 📊 Gráfico de progresso (C x L x P)
- 📉 Taxa de cicatrização
- ⚠️ Alertas inteligentes de piora

### Fase 3 (Impressão e Exportação)
- 📄 Geração de referência para UBS
- 📊 Relatório PDF exportável
- 📁 impressão direta do histórico de ferida


---

## 9. Critérios de Aceição

Uma funcionalidade está completa quando:

1. ✅ Código escrito e testado (unit + integration)
2. ✅ Requisitos RFs implementados
3. ✅ Responsivo em mobile e desktop
4. ✅ Offline-first funcionando
5. ✅ Sem erros no console/network
6. ✅ Feedback visual claro ao usuário
7. ✅ Documentação de componentes criada
8. ✅ Integrado com router principal

---

## 10. Notas Importantes

- **Priorizar mobile first**: Profissionais usarão primariamente em campo com tablets/phones
- **Validação em tempo real**: Campos devem validar enquanto digita/seleciona
- **Toast feedback**: Cada ação deve gerar feedback visual (sucesso/erro)
- **Dark mode**: Suportar para captura de fotos em ambientes escuros
- **Performance**: Lazy-load de fotos essencial com 50+ registros
- **Body diagram**: Deve ser reutilizável para outras features futuras
