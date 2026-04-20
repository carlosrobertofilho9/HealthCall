import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { HeaderIcon, tableStyles, BaseDocument, type DocumentFormData, PageHeader, PatientInfoBar, PageFooter, DocTitle, DocText, commonStyles, pdfTheme } from './PdfCommon';
import { PdfIconBadge, type PdfIconName } from './icons';
import { buildSequentialDayMonthDates } from '../../utils/dateSequence';
const pressureStyles = StyleSheet.create({
  container: {
    width: '100%',
  },
  periodTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.white,
    textAlign: 'center',
    paddingVertical: 3,
  },
  subHeaderRow: {
    flexDirection: 'row',
    backgroundColor: pdfTheme.colors.softBg,
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.primaryDark,
    height: 22,
    alignItems: 'center',
  },
  subHeaderText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
    textAlign: 'center',
  },
  instructionBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: pdfTheme.colors.softBg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: pdfTheme.colors.softBg,
  },
  instructionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
  },
  instructionText: {
    fontSize: 7,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.5,
    marginBottom: 2,
  },
  legendRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 7,
    color: pdfTheme.colors.text.muted,
  },
  coverContainer: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
    marginTop: 8,
  },
  coverCol: {
    flex: 1,
    gap: 16,
  },
  card: {
    backgroundColor: pdfTheme.colors.text.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.bgLight,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  listItemText: {
    flex: 1,
    fontSize: 10,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.4,
  },
  listText: {
    fontSize: 10,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.4,
  },
  examItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    backgroundColor: pdfTheme.colors.bgLight,
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: pdfTheme.colors.bgLight,
  },
  examIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: pdfTheme.colors.exam.indigoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examText: {
    fontSize: 9,
    color: pdfTheme.colors.text.main,
    flex: 1,
  },
  footerNote: {
    fontSize: 8,
    color: pdfTheme.colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 12,
  }
});

interface PressureDocumentProps {
  visibleParagraphs: string[];
  formData?: DocumentFormData;
  values?: Record<string, string>;
}

const PressureBadge = ({
  name,
  size = 20,
  color,
  backgroundColor,
}: {
  name: PdfIconName;
  size?: number;
  color: string;
  backgroundColor: string;
}) => (
  <PdfIconBadge
    name={name}
    size={size}
    color={color}
    backgroundColor={backgroundColor}
    strokeWidth={1.7}
  />
);

export const PressureDocument: React.FC<PressureDocumentProps> = ({ visibleParagraphs, formData, values }) => {
  const DAYS = 7;
  const dateColWidth = '6%';
  const morningGroupWidth = '28%';
  const afternoonGroupWidth = '28%';
  const nightGroupWidth = '28%';
  const obsColWidth = '10%';
  const sequentialDates = buildSequentialDayMonthDates(values?.MAPA_DATA_INICIAL, DAYS);

  const renderTablePage = (isExample: boolean) => (
      <View style={[commonStyles.page, { paddingBottom: pdfTheme.spacing.xxl, paddingTop: pdfTheme.spacing.xl }]} wrap={false}>
        
        <View style={[commonStyles.mainTitleContainer, { marginBottom: 16 }]}>
          <View style={commonStyles.mainTitleLine} />
          <DocTitle>Diário de Pressão Arterial (MAPA){isExample ? " - EXEMPLO DE PREENCHIMENTO" : ""}</DocTitle>
          <View style={commonStyles.mainTitleLine} />
        </View>

        <View style={pressureStyles.container}>
          {/* Legend */}
          <View style={[pressureStyles.legendRow, { marginTop: 16 }]}>
            <View style={pressureStyles.legendItem}>
               <View style={[pressureStyles.legendColor, { backgroundColor: pdfTheme.colors.exam.yellow }]} />
              <Text style={pressureStyles.legendText}>Manhã (PSF / Casa)</Text>
            </View>
            <View style={pressureStyles.legendItem}>
              <View style={[pressureStyles.legendColor, { backgroundColor: pdfTheme.colors.exam.orange }]} />
              <Text style={pressureStyles.legendText}>Tarde (PSF / Casa)</Text>
            </View>
            <View style={pressureStyles.legendItem}>
              <View style={[pressureStyles.legendColor, { backgroundColor: pdfTheme.colors.exam.indigo }]} />
              <Text style={pressureStyles.legendText}>Noite (Hospital / Casa)</Text>
            </View>
          </View>
  
          <View style={{ marginTop: 12 }} />
  
          {/* Main Table */}
          <View style={tableStyles.table}>
            {/* Row 1: Period Group Headers */}
            <View style={[tableStyles.row, { height: 26, backgroundColor: pdfTheme.colors.bgLight }]}>
              <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: pdfTheme.colors.primaryDark }]}>
                <Text style={pressureStyles.periodTitle}>DIA</Text>
              </View>
              <View style={[tableStyles.col, { width: morningGroupWidth, backgroundColor: pdfTheme.colors.period.morning, borderRightColor: pdfTheme.colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <HeaderIcon icon="sun" color={pdfTheme.colors.text.white} />
                  <Text style={pressureStyles.periodTitle}>MANHÃ</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: afternoonGroupWidth, backgroundColor: pdfTheme.colors.period.afternoon, borderRightColor: pdfTheme.colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <HeaderIcon icon="sun" color={pdfTheme.colors.text.white} />
                  <Text style={pressureStyles.periodTitle}>TARDE</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: nightGroupWidth, backgroundColor: pdfTheme.colors.period.night, borderRightColor: pdfTheme.colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <HeaderIcon icon="moon" color={pdfTheme.colors.text.white} />
                  <Text style={pressureStyles.periodTitle}>NOITE</Text>
                </View>
              </View>
              <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: pdfTheme.colors.text.secondary }]}>
                <Text style={pressureStyles.periodTitle}>OBS</Text>
              </View>
             </View>
  
            {/* Row 2: Sub-column Headers */}
            <View style={[pressureStyles.subHeaderRow, { height: 34 }]}>
              <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: pdfTheme.colors.softBg }]}>
                <Text style={pressureStyles.subHeaderText}>Data</Text>
              </View>
              {['warning.softBg', 'period.afternoonSoft', 'period.nightSoft'].map((bg, periodIdx) => {
                const colors = [
                  { bg: pdfTheme.colors.warning.softBg, text: pdfTheme.colors.warning.text, val: pdfTheme.colors.period.morningText },
                  { bg: pdfTheme.colors.period.afternoonSoft, text: pdfTheme.colors.period.afternoonDark, val: pdfTheme.colors.period.afternoonText },
                  { bg: pdfTheme.colors.period.nightSoft, text: pdfTheme.colors.period.nightDark, val: pdfTheme.colors.period.nightText }
                ][periodIdx];
                return ['1ª aferição', '2ª aferição', '3ª aferição', 'Média'].map((med, i) => {
                  const isMedia = i === 3;
                  return (
                  <View key={`${periodIdx}-${i}`} style={[tableStyles.col, { width: '7%', backgroundColor: isMedia ? '#e2e8f0' : colors.bg }]}>
                    <Text style={[pressureStyles.subHeaderText, { color: isMedia ? pdfTheme.colors.text.dark : colors.text, fontSize: 5 }]}>{med}</Text>
                    <View style={{ flexDirection: 'row', marginTop: 4, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={[pressureStyles.subHeaderText, { color: isMedia ? pdfTheme.colors.text.muted : colors.val, fontSize: 4.5 }]}>PAS  x  PAD</Text>
                    </View>
                  </View>
                )});
              })}
              <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: pdfTheme.colors.bgLight }]}>
                <Text style={pressureStyles.subHeaderText}></Text>
              </View>
            </View>
  
            {/* Data Rows - 3 or 7 days based on isExample */}
            {Array.from({ length: isExample ? 3 : DAYS }).map((_, i) => {
              const isEven = i % 2 === 0;
              const bgColor = isEven ? pdfTheme.colors.text.white : pdfTheme.colors.bgLight;
              const isLast = i === (isExample ? 3 : DAYS) - 1;
              
              // Example Data
              const mockExamples = [
                { 
                  date: "15/05", 
                  vals: { m: ["120 x 80", "118 x 78", "122 x 80"], t: ["130 x 85", "128 x 82", "125 x 80"], n: ["118 x 75", "115 x 75", "115 x 78"] }, 
                  meds: { m: "120 x 79", t: "127 x 82", n: "116 x 76" }, 
                  obs: "Senti leve tontura de manhã" 
                },
                { 
                  date: "16/05", 
                  vals: { m: ["135 x 85", "130 x 82", "132 x 80"], t: ["140 x 90", "138 x 88", "—"], n: ["130 x 85", "128 x 80", "125 x 80"] }, 
                  meds: { m: "132 x 82", t: "139 x 89", n: "127 x 81" }, 
                  obs: "Esqueci a 3ª medida da tarde e o remédio" 
                },
                { 
                  date: "17/05", 
                  vals: { m: ["115 x 75", "112 x 75", "115 x 72"], t: ["120 x 80", "118 x 78", "118 x 80"], n: ["112 x 70", "115 x 75", "110 x 72"] }, 
                  meds: { m: "114 x 74", t: "118 x 79", n: "112 x 72" }, 
                  obs: "Sem intercorrências" 
                }
              ];
              const showEx = isExample;
              const exData = showEx ? mockExamples[i] : null;
              const dateTxt = showEx ? exData.date : sequentialDates[i] || "___/___";
              const obsTxt = showEx ? exData.obs : "";
              const txtStyles = showEx ? { color: pdfTheme.colors.text.main, fontSize: 6, fontWeight: 'bold' } : { color: pdfTheme.colors.text.muted, opacity: 0.4 };

              const getCellData = (period: 'm' | 't' | 'n', j: number) => {
                if (!showEx) return "x";
                if (j === 3) return exData?.meds[period];
                return exData?.vals[period][j];
              };

              return (
                <View style={[tableStyles.row, { backgroundColor: bgColor, height: 45 }, isLast ? { borderBottomWidth: 0 } : {}]} key={i}>
                  <View style={[tableStyles.col, { width: dateColWidth }]}>
                    <Text style={[tableStyles.cellText, { fontSize: showEx ? 6 : 8 }]}>{dateTxt}</Text>
                  </View>
                  {/* Manhã (4 sub-cols) */}
                  {Array.from({ length: 4 }).map((_, j) => {
                    const isMedia = j === 3;
                    const cellBg = isMedia ? (isEven ? '#f1f5f9' : '#e2e8f0') : (isEven ? pdfTheme.colors.period.morningAlt : pdfTheme.colors.warning.softBg);
                    return (
                    <View key={`m-${j}`} style={[tableStyles.col, { width: '7%', backgroundColor: cellBg }]}>
                      <Text style={[tableStyles.cellText, txtStyles as any]}>{getCellData('m', j)}</Text>
                    </View>
                  )})}
                  {/* Tarde (4 sub-cols) */}
                  {Array.from({ length: 4 }).map((_, j) => {
                    const isMedia = j === 3;
                    const cellBg = isMedia ? (isEven ? '#f1f5f9' : '#e2e8f0') : (isEven ? pdfTheme.colors.period.afternoonAlt : pdfTheme.colors.period.afternoonSoft);
                    return (
                    <View key={`t-${j}`} style={[tableStyles.col, { width: '7%', backgroundColor: cellBg }]}>
                      <Text style={[tableStyles.cellText, txtStyles as any]}>{getCellData('t', j)}</Text>
                    </View>
                  )})}
                  {/* Noite (4 sub-cols) */}
                  {Array.from({ length: 4 }).map((_, j) => {
                    const isMedia = j === 3;
                    const cellBg = isMedia ? (isEven ? '#f1f5f9' : '#e2e8f0') : (isEven ? pdfTheme.colors.period.nightAlt : pdfTheme.colors.period.nightSoft);
                    return (
                    <View key={`n-${j}`} style={[tableStyles.col, { width: '7%', backgroundColor: cellBg }]}>
                      <Text style={[tableStyles.cellText, txtStyles as any]}>{getCellData('n', j)}</Text>
                    </View>
                  )})}
                  <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth }]}>
                    <Text style={[tableStyles.cellText, showEx ? { fontSize: 5, color: pdfTheme.colors.text.main, lineHeight: 1.2 } : {}]}>
                      {obsTxt}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
  
          {/* Instructions Box / FAQ */}
          {!isExample ? (
            <View style={[pressureStyles.card, { marginTop: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <HeaderIcon icon="clipboard" color={pdfTheme.colors.primary} />
                <Text style={[pressureStyles.cardTitle, { fontSize: 10 }]}>Lembretes ao Profissional:</Text>
              </View>
              <Text style={pressureStyles.listText}>- Anotar detalhadamente a PAS (sistólica) e PAD (diastólica) substituindo o 'x' central. Ex: 120 x 80.</Text>
              <Text style={pressureStyles.listText}>- Usar a coluna OBS para relatar sintomas aferidos ou faltas/esquecimentos do paciente.</Text>
            </View>
          ) : (
            <View style={{ marginTop: 20, gap: 12 }}>
              <View style={[pressureStyles.card, { backgroundColor: pdfTheme.colors.neutral.bg }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <PressureBadge name="clipboard-list" size={16} color={pdfTheme.colors.primary} backgroundColor={pdfTheme.colors.softBg} />
                  <Text style={[pressureStyles.cardTitle, { fontSize: 12, color: pdfTheme.colors.primary }]}>Como preencher corretamente o seu diário</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                     <View style={{ marginBottom: 10 }}>
                       <Text style={[pressureStyles.listText, { fontSize: 9, lineHeight: 1.4 }]}><Text style={{ fontWeight: 'bold' }}>1. O que devo anotar?</Text> {"\n"}Anote sempre o valor "maior" e o "menor" do aparelho. Se marcou "12" por "8", anote <Text style={{ fontWeight: 'bold' }}>120 x 80</Text>.</Text>
                     </View>
                     <View style={{ marginBottom: 4 }}>
                       <Text style={[pressureStyles.listText, { fontSize: 9, lineHeight: 1.4 }]}><Text style={{ fontWeight: 'bold' }}>2. E a coluna de "OBS" (Observação)?</Text> {"\n"}Escreva lá se sentiu alguma dor de cabeça, tontura ou se esqueceu de tomar o remédio.</Text>
                     </View>
                  </View>
                  <View style={{ flex: 1, paddingLeft: 10 }}>
                     <View style={{ marginBottom: 10 }}>
                       <Text style={[pressureStyles.listText, { fontSize: 9, lineHeight: 1.4 }]}><Text style={{ fontWeight: 'bold' }}>3. Quando anotar?</Text> {"\n"}Faça <Text style={{ fontWeight: 'bold' }}>3 medições seguidas</Text>, com 1 ou 2 minutos de descanso entre elas, de manhã, tarde e noite.</Text>
                     </View>
                     <View style={{ marginBottom: 4 }}>
                       <Text style={[pressureStyles.listText, { fontSize: 9, lineHeight: 1.4 }]}><Text style={{ fontWeight: 'bold' }}>4. Esqueceu de medir?</Text> {"\n"}Não tem problema! Deixe aquele quadrinho em branco ou risque e continue anotando depois.</Text>
                     </View>
                  </View>
                </View>
              </View>

              <View style={[pressureStyles.card, { backgroundColor: pdfTheme.colors.warning.softBg, borderColor: pdfTheme.colors.warning.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <PressureBadge name="calculator" size={16} color={pdfTheme.colors.warning.text} backgroundColor={pdfTheme.colors.warning.bg} />
                  <Text style={[pressureStyles.cardTitle, { fontSize: 12, color: pdfTheme.colors.warning.text }]}>Como calcular o quadradinho cinza da "Média"</Text>
                </View>
                <Text style={[pressureStyles.listText, { fontSize: 9, marginBottom: 8 }]}>
                  Você (ou o enfermeiro/médico) precisa somar os três valores da primeira parte (pressão alta) e dividir por 3. Depois faz a mesma coisa com a segunda parte (pressão baixa). Aquele número é o principal!
                </Text>
                
                <View style={{ flexDirection: 'row', backgroundColor: pdfTheme.colors.text.white, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', gap: 16 }}>
                  <View style={{ flex: 1 }}>
                     <Text style={[pressureStyles.listText, { fontWeight: 'bold', color: pdfTheme.colors.primary, marginBottom: 6, fontSize: 10 }]}>Passo 1: Somar as 3 medidas</Text>
                     <Text style={[pressureStyles.listText, { fontSize: 9 }]}>1ª Aferição: <Text style={{ fontWeight: 'bold' }}>120</Text> x 80</Text>
                     <Text style={[pressureStyles.listText, { fontSize: 9 }]}>2ª Aferição: <Text style={{ fontWeight: 'bold', color: '#1d4ed8' }}>135</Text> x 85</Text>
                     <Text style={[pressureStyles.listText, { fontSize: 9 }]}>3ª Aferição: <Text style={{ fontWeight: 'bold' }}>115</Text> x 75</Text>
                     <Text style={[pressureStyles.listText, { fontSize: 9, marginTop: 4 }]}><Text style={{ fontStyle: 'italic' }}>Total ALTA</Text> = 120 + 135 + 115 = <Text style={{ fontWeight: 'bold', color: pdfTheme.colors.warning.strong }}>370</Text></Text>
                     <Text style={[pressureStyles.listText, { fontSize: 9 }]}><Text style={{ fontStyle: 'italic' }}>Total BAIXA</Text> = 80 + 85 + 75 = <Text style={{ fontWeight: 'bold', color: pdfTheme.colors.warning.strong }}>240</Text></Text>
                  </View>
                  <View style={{ flex: 1 }}>
                     <Text style={[pressureStyles.listText, { fontWeight: 'bold', color: pdfTheme.colors.primary, marginBottom: 6, fontSize: 10 }]}>Passo 2: Dividir por três (3)</Text>
                     <Text style={[pressureStyles.listText, { fontSize: 9 }]}>ALTA (370 dividido por 3) = <Text style={{ fontWeight: 'bold' }}>123</Text></Text>
                     <Text style={[pressureStyles.listText, { fontSize: 9 }]}>BAIXA (240 dividido por 3) = <Text style={{ fontWeight: 'bold' }}>80</Text></Text>
                     
                     <View style={{ marginTop: 8, padding: 8, backgroundColor: pdfTheme.colors.success.softBg, borderRadius: 4, borderWidth: 1, borderColor: pdfTheme.colors.success.border }}>
                       <Text style={[pressureStyles.listText, { fontSize: 10, fontWeight: 'bold', textAlign: 'center', color: pdfTheme.colors.success.strong }]}>
                         Resultado na Média: Anote "123 x 80"
                       </Text>
                     </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        <PageFooter />
      </View>
  );

  return (
    <React.Fragment>
      {/* === PRIMEIRA PÁGINA (CAPA) === */}
      <BaseDocument title="Monitorização Ambulatorial da Pressão Arterial (MAPA)" visibleParagraphs={visibleParagraphs} wrap={false} nomePaciente={formData?.nomePaciente} cnsCpf={formData?.cnsCpf}>
        <View style={pressureStyles.coverContainer}>
          
          {/* Coluna 1: Como realizar a medida corretamente */}
          <View style={pressureStyles.coverCol}>
            <View style={pressureStyles.card}>
              <View style={pressureStyles.cardHeader}>
                <PressureBadge name="stethoscope" color={pdfTheme.colors.primary} backgroundColor={pdfTheme.colors.softBg} />
                <Text style={pressureStyles.cardTitle}>Instruções para Medição no Ambulatório</Text>
              </View>
              <Text style={[pressureStyles.listText, { marginBottom: 8 }]}>
                Compareça ao posto ou ambulatório nos períodos indicados. O profissional registrará <Text style={{ fontWeight: 'bold' }}>3 medições</Text> em cada comparecimento e fará a média.
              </Text>
              <View>
                <View style={pressureStyles.listItem}>
                  <PressureBadge name="sun" size={12} color={pdfTheme.colors.primary} backgroundColor={pdfTheme.colors.softBg} />
                  <Text style={pressureStyles.listItemText}><Text style={{ fontWeight: 'bold' }}>Manhã:</Text> Comparecer antes do desjejum ou da primeira medicação.</Text>
                </View>
                <View style={pressureStyles.listItem}>
                  <PressureBadge name="clock" size={12} color={pdfTheme.colors.primary} backgroundColor={pdfTheme.colors.softBg} />
                  <Text style={pressureStyles.listItemText}><Text style={{ fontWeight: 'bold' }}>Tarde:</Text> Comparecer preferencialmente antes do almoço ou entre 13h e 15h.</Text>
                </View>
                <View style={pressureStyles.listItem}>
                  <PressureBadge name="moon" size={12} color={pdfTheme.colors.primary} backgroundColor={pdfTheme.colors.softBg} />
                  <Text style={pressureStyles.listItemText}><Text style={{ fontWeight: 'bold' }}>Noite:</Text> Comparecer antes do jantar ou conforme orientação da equipe.</Text>
                </View>
              </View>
            </View>

            <View style={pressureStyles.card}>
              <View style={pressureStyles.cardHeader}>
                <PressureBadge name="gauge" color={pdfTheme.colors.warning.strong} backgroundColor={pdfTheme.colors.warning.bg} />
                <Text style={[pressureStyles.cardTitle, { color: pdfTheme.colors.warning.strong }]}>Como realizar a medida corretamente</Text>
              </View>
              <View style={pressureStyles.listItem}>
                <PressureBadge name="droplets" size={12} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
                <Text style={pressureStyles.listItemText}>Bexiga vazia (urinar antes de iniciar as medições).</Text>
              </View>
              <View style={pressureStyles.listItem}>
                <PressureBadge name="timer" size={12} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
                <Text style={pressureStyles.listItemText}>Repouso de 5 min antes de iniciar.</Text>
              </View>
              <View style={pressureStyles.listItem}>
                <PressureBadge name="sofa" size={12} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
                <Text style={pressureStyles.listItemText}>Não cruzar pernas, pés no chão, braço na mesa na altura do coração. Manguito colocado livre de roupas.</Text>
              </View>
              <View style={pressureStyles.listItem}>
                <PressureBadge name="message-circle-warning" size={12} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
                <Text style={pressureStyles.listItemText}>Silêncio. É importante não falar ou se mover.</Text>
              </View>
            </View>
          </View>

          {/* Coluna 2: Exames */}
          <View style={pressureStyles.coverCol}>
             <View style={pressureStyles.card}>
              <View style={pressureStyles.cardHeader}>
                <PressureBadge name="clipboard-check" color={pdfTheme.colors.purple.text} backgroundColor={pdfTheme.colors.purple.bg} />
                <Text style={[pressureStyles.cardTitle, { color: pdfTheme.colors.purple.text }]}>Exames a trazer com o Diário</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.yellowBg }]}><PressureBadge name="test-tube" size={12} color={pdfTheme.colors.period.morningIcon} backgroundColor={pdfTheme.colors.exam.yellowBg} /></View>
                <Text style={pressureStyles.examText}>Análise de urina</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.redBg }]}><PressureBadge name="zap" size={12} color={pdfTheme.colors.exam.red} backgroundColor={pdfTheme.colors.exam.redBg} /></View>
                <Text style={pressureStyles.examText}>Potássio plasmático e Creatinina plasmática</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.indigoBg }]}><PressureBadge name="chart-spline" size={12} color={pdfTheme.colors.period.night} backgroundColor={pdfTheme.colors.exam.indigoBg} /></View>
                <Text style={pressureStyles.examText}>Estimativa da TFGe pelo CKD-EPI*</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.success.softBg }]}><PressureBadge name="waves" size={12} color={pdfTheme.colors.exam.green} backgroundColor={pdfTheme.colors.success.softBg} /></View>
                <Text style={pressureStyles.examText}>Razão proteinúria/creatininúria</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.magentaBg }]}><PressureBadge name="droplet" size={12} color={pdfTheme.colors.exam.magenta} backgroundColor={pdfTheme.colors.exam.magentaBg} /></View>
                <Text style={pressureStyles.examText}>Glicemia de jejum e hemoglobina glicada</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.orangeBg }]}><PressureBadge name="chart-no-axes-combined" size={12} color={pdfTheme.colors.period.afternoon} backgroundColor={pdfTheme.colors.exam.orangeBg} /></View>
                <Text style={pressureStyles.examText}>Colesterol e triglicerídeos plasmáticos**</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.tealBg }]}><PressureBadge name="activity" size={12} color={pdfTheme.colors.exam.teal} backgroundColor={pdfTheme.colors.exam.tealBg} /></View>
                <Text style={pressureStyles.examText}>Ácido úrico plasmático</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.roseBg }]}><PressureBadge name="scan-heart" size={12} color={pdfTheme.colors.exam.rose} backgroundColor={pdfTheme.colors.exam.roseBg} /></View>
                <Text style={pressureStyles.examText}>Eletrocardiograma convencional</Text>
              </View>

              <Text style={pressureStyles.footerNote}>
                * Fórmula recomendada para estimar a Taxa de Filtração Glomerular.
              </Text>
              <Text style={[pressureStyles.footerNote, { marginTop: 4 }]}>
                ** Podem ser calculados em jejum ou não (depende do laboratório).
              </Text>
            </View>
          </View>
        </View>
      </BaseDocument>
      {/* === SEGUNDA PÁGINA (EXEMPLO PREENCHIDO) === */}
      {renderTablePage(true)}

      {/* === TERCEIRA PÁGINA (TABELA EM BRANCO) === */}
      {renderTablePage(false)}
    </React.Fragment>
  );
};
