---
title: "Especificação Técnica: Automação Profissional da Ficha Perinatal"
description: "Arquitetura escalável e requisitos detalhados para preenchimento automatizado de PDF no HealthCall."
---

# 🤰 Documento Mestre: Automação Médica de PDFs

Este documento define a estratégia de implementação para o módulo de Pré-Natal, focando na digitalização integral e preenchimento profissional da **Ficha Perinatal de Ambulatório**.

---

## 🎯 Objetivo
Transformar o PDF original em uma interface digital de alta performance, garantindo que 100% dos campos sejam preenchíveis via sistema e exportados com precisão cirúrgica para o documento oficial.

---

## 🛠 Arquitetura Técnica Recomendada (Escalável)

Para garantir que a implementação seja profissional e fácil de manter, o Agente de Codificação deve seguir esta estrutura:

### 1. Separação de Responsabilidades
- **Template Físico:** Armazenado em `docs/ficha_perinatal_ambulatorio.pdf`.
- **Mapeamento (The Map):** Criado o arquivo inicial em `src/features/prenatal/services/fichaPerinatal.map.ts`. Este arquivo contém as coordenadas normalizadas (0-1000) e deve ser expandido.
- **Schema Único:** Definir um `interface` TypeScript que represente 100% dos dados da ficha, servindo como a "Única Fonte de Verdade".

### 2. Helpers de Desenho (Service Registry)
Implementar um serviço de desenho reutilizável utilizando `pdf-lib` que abstraia a complexidade das coordenadas:
- `drawTextField`: Para campos de texto simples e alinhamento de strings.
- `drawMultilineText`: Para observações e condutas.
- `drawDate`: Tratamento especializado para máscaras de data.
- `drawRadio / drawCheckbox`: Funções que posicionam o "X" ou a marcação no centro do box/círculo definido no mapeamento.
- `drawMonthMarker`: Para a grade de suplementação mensal.

### 3. Estratégia de Calibração
Dado que o PDF possui muitos campos pequenos e botões de opção:
- **Mapeamento por Retângulos:** Não utilizar apenas pontos `x,y`. Definir áreas (rects) para garantir que o texto não "vaze" do box.
- **Modo Calibração (Opcional/Recomendado):** Uma ferramenta interna para clicar e arrastar caixas sobre uma versão rasterizada (imagem) do PDF para salvar as coordenadas em um JSON de configuração.

---

## 📋 Inventário Exaustivo de Dados (Schema)

Abaixo estão todos os campos que devem ser contemplados no Schema e na Interface de entrada:

### Seção I: Identificação e Cabeçalho
- Unidade de Saúde, Nome da Gestante, Nome Social, Endereço Completo, Cidade.
- Idade, Sinalização de Idade Extrema (<15 e >35), Estado Civil, Escolaridade.
- Peso Pré-gestacional, Altura, IMC Inicial, Classificação de Risco, Gravidez Planejada.

### Seção II: Antecedentes (Checklist Sim/Não)
- **Familiares:** Diabetes, Hipertensão, Gemelaridade, Outros.
- **Pessoais:** Diabetes, Infecção Urinária, Infertilidade, Cardiopatia, Tromboembolismo, Hipertensão, Cirurgias Pélvicas, Outros.

### Seção III: História Obstétrica Anterior
- numérico: Gestas, Partos (Vaginais/Cesáreas), Abortos, Ectópicas, Nascidos (Vivos/Mortos/Óbitos 1ª sem), Peso RN (<2500g / >4500g).
- Alertas: 3+ Abortos, 2+ Cesáreas, Pré-eclâmpsia prévia, Intervalo interpartal < 1 ano.

### Seção IV: Gestação Atual e Intercorrências
- Hábitos: Fumo (nº cigarros), Álcool, Drogas, Violência.
- Intercorrências (Checklist completo): Hospitalização (dias/motivo), HIV, Sífilis, Toxoplasmose, Anemia, Incompetência Istmocervical, DPP, Isoimunização, Oligo/Polidrâmnio, Rotura Membrana, CIUR, Pós-datismo, Febre, Hipertensão, Pré-eclâmpsia, Cardiopatia, Diabetes Gestacional, Hemorragias (1º, 2º e 3º Tri), Exantema.

### Seção V: Exames, Vacinas e Suplementação
- **Laboratório (1ª e 2ª Rotina):** Data e Resultado para ABO-RH, Glicemia, TOTG, Sífilis Rápido/VDRL, HIV Rápido, HBsAg, Toxoplasmose, Hb/Ht, EAS/Urocultura, Streptococcus B, Malária.
- **Tratamento Sífilis:** Doses Penicilina (1, 2, 3), Parceiro Tratado.
- **Vacinação:** Influenza, dTpa, dT (1, 2, 3, Reforço), Hep B (1, 2, 3).
- **Ultrassom (x4):** Data, Peso Fetal, Placenta, Líquido.
- **Suplementação (Mensal):** Sulfato Ferroso e Ácido Fólico (Meses 1 a 9).

### Seção VI: Acompanhamento de Consultas (Grade 1 a 10)
Campos por consulta: Data, Queixa, IG, Peso, IMC, Edema, PA, AU, Apresentação, BCF, Mov. Fetal, Conduta.

### Seção VII: Parto e Nascimento (Verso da Ficha)
- Dados do Parto (Tipo, IG, Medicamentos), Dados do RN (Sexo, Peso, Estatura, PC, APGAR 1/5, Reanimação), Desfecho Materno e do RN (Alta/Transferência/Óbito).

---

## 🎨 Layout e Estética (Design System)
- **Multi-Painéis:** Utilizar `SectionCard` para separar as abas de preenchimento.
- **Preview Dinâmico:** Se possível, renderizar um canvas que mostre o PDF sendo preenchido em tempo real.
- **Fluidez:** Framer Motion em todas as transições de abas e modais de confirmação.

---
*Este documento é a diretriz final de engenharia para o módulo de Pré-Natal no HealthCall.*
