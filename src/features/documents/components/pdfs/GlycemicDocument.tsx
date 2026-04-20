import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { HeaderIcon, tableStyles, BaseDocument, type DocumentFormData, PageFooter, DocTitle, commonStyles, pdfTheme } from './PdfCommon';
import { 
  InstructionIcon, CheckmarkIcon, DropIcon,
  NotebookIcon, WarningLightIcon, FlaskIcon, HeartPulseIcon
} from './PressureGraphics';

const glycemicStyles = StyleSheet.create({
  container: { width: '100%' },
  periodTitle: { fontSize: 7, fontWeight: 'bold', color: pdfTheme.colors.text.white, textAlign: 'center', paddingVertical: 3 },
  subHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: pdfTheme.colors.primaryDark, height: 24, alignItems: 'center' },
  subHeaderText: { fontSize: 6.5, fontWeight: 'bold', textAlign: 'center' },
  legendRow: { flexDirection: 'row', marginTop: 6, gap: 16, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendColor: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 7, color: pdfTheme.colors.text.muted },
  refBox: { marginTop: 6, padding: 6, backgroundColor: pdfTheme.colors.warning.bg, borderRadius: 4, borderWidth: 1, borderColor: pdfTheme.colors.warning.border },
  refTitle: { fontSize: 8, fontWeight: 'bold', color: pdfTheme.colors.warning.text, marginBottom: 3 },
  refRow: { flexDirection: 'row', gap: 20 },
  refText: { fontSize: 7, color: pdfTheme.colors.warning.dark },
  coverContainer: { flexDirection: 'row', gap: 14, flex: 1, marginTop: 8 },
  coverCol: { flex: 1, gap: 14 },
  card: { backgroundColor: pdfTheme.colors.text.white, borderRadius: 8, borderWidth: 1, borderColor: pdfTheme.colors.border, padding: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: pdfTheme.colors.bgLight, paddingBottom: 8 },
  cardTitle: { fontSize: 12, fontWeight: 'bold', color: pdfTheme.colors.primary },
  listItem: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
  listItemText: { flex: 1, fontSize: 10, color: pdfTheme.colors.text.main, lineHeight: 1.4 },
  listText: { fontSize: 10, color: pdfTheme.colors.text.main, lineHeight: 1.4 },
  examItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, backgroundColor: pdfTheme.colors.bgLight, padding: 6, borderRadius: 6, borderWidth: 1, borderColor: pdfTheme.colors.bgLight },
  examIconBg: { width: 20, height: 20, borderRadius: 10, backgroundColor: pdfTheme.colors.exam.indigoBg, alignItems: 'center', justifyContent: 'center' },
  examText: { fontSize: 9, color: pdfTheme.colors.text.main, flex: 1 },
});

export const GlycemicDocument: React.FC<{ visibleParagraphs: string[]; formData?: DocumentFormData }> = ({ visibleParagraphs, formData }) => {
  const DAYS = 16;
  const dateColWidth = '8%';
  const morningGroupWidth = '23%';
  const afternoonGroupWidth = '23%';
  const nightGroupWidth = '23%';
  const madrugadaColWidth = '11.5%';
  const obsColWidth = '11.5%';

  const renderTablePage = (isExample: boolean) => (
    <View style={[commonStyles.page, { paddingBottom: pdfTheme.spacing.xxl, paddingTop: pdfTheme.spacing.xl }]} wrap={false}>
      <View style={[commonStyles.mainTitleContainer, { marginBottom: 16 }]}>
        <View style={commonStyles.mainTitleLine} />
        <DocTitle>Monitoramento de Glicemia {isExample ? " - EXEMPLO DE PREENCHIMENTO" : ""}</DocTitle>
        <View style={commonStyles.mainTitleLine} />
      </View>
      <View style={glycemicStyles.container}>
        <View style={glycemicStyles.legendRow}>
          <View style={glycemicStyles.legendItem}>
            <View style={[glycemicStyles.legendColor, { backgroundColor: pdfTheme.colors.period.morning }]} />
            <Text style={glycemicStyles.legendText}>Manhã (Jejum + Pós Café)</Text>
          </View>
          <View style={glycemicStyles.legendItem}>
            <View style={[glycemicStyles.legendColor, { backgroundColor: pdfTheme.colors.period.lunch }]} />
            <Text style={glycemicStyles.legendText}>Tarde (Pré + Pós Almoço)</Text>
          </View>
          <View style={glycemicStyles.legendItem}>
            <View style={[glycemicStyles.legendColor, { backgroundColor: pdfTheme.colors.purple.strong }]} />
            <Text style={glycemicStyles.legendText}>Noite (Pré + Pós Jantar)</Text>
          </View>
          <View style={glycemicStyles.legendItem}>
            <View style={[glycemicStyles.legendColor, { backgroundColor: pdfTheme.colors.text.dark }]} />
            <Text style={glycemicStyles.legendText}>Madrugada (3h)</Text>
          </View>
        </View>

        <View style={{ marginTop: 12 }} />

        <View style={tableStyles.table}>
          <View style={[tableStyles.row, { height: 26, backgroundColor: pdfTheme.colors.bgLight }]}>
            <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: pdfTheme.colors.primaryDark }]}>
              <Text style={glycemicStyles.periodTitle}>DIA</Text>
            </View>
            <View style={[tableStyles.col, { width: morningGroupWidth, backgroundColor: pdfTheme.colors.period.morning, borderRightColor: pdfTheme.colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="sun" color={pdfTheme.colors.text.white} />
                <Text style={glycemicStyles.periodTitle}>MANHÃ</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: afternoonGroupWidth, backgroundColor: pdfTheme.colors.period.lunch, borderRightColor: pdfTheme.colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="utensils" color={pdfTheme.colors.text.white} />
                <Text style={glycemicStyles.periodTitle}>TARDE</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: nightGroupWidth, backgroundColor: pdfTheme.colors.purple.text, borderRightColor: pdfTheme.colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="moon" color={pdfTheme.colors.text.white} />
                <Text style={glycemicStyles.periodTitle}>NOITE</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: madrugadaColWidth, backgroundColor: pdfTheme.colors.text.dark, borderRightColor: pdfTheme.colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <HeaderIcon icon="bed" color={pdfTheme.colors.text.white} />
                <Text style={glycemicStyles.periodTitle}>3:00h</Text>
              </View>
            </View>
            <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: pdfTheme.colors.text.secondary }]}>
              <Text style={glycemicStyles.periodTitle}>OBS</Text>
            </View>
          </View>

          <View style={glycemicStyles.subHeaderRow}>
            <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: pdfTheme.colors.softBg }]}>
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.primary }]}>Data</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: pdfTheme.colors.warning.softBg }]}>
              <HeaderIcon icon="sun" color={pdfTheme.colors.warning.text} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.warning.text, marginTop: 1 }]}>Jejum</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: pdfTheme.colors.warning.softBg }]}>
              <HeaderIcon icon="coffee" color={pdfTheme.colors.warning.text} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.warning.text, marginTop: 1 }]}>2h pós Café</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: pdfTheme.colors.period.lunchSoft }]}>
              <HeaderIcon icon="utensils" color={pdfTheme.colors.period.lunchText} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.period.lunchText, marginTop: 1 }]}>Pré Almoço</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: pdfTheme.colors.period.lunchSoft }]}>
              <HeaderIcon icon="clock" color={pdfTheme.colors.period.lunchText} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.period.lunchText, marginTop: 1 }]}>2h pós Almoço</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: pdfTheme.colors.purple.bg }]}>
              <HeaderIcon icon="utensils" color={pdfTheme.colors.purple.iconDark} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.purple.iconDark, marginTop: 1 }]}>Pré Jantar</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: pdfTheme.colors.purple.bg }]}>
              <HeaderIcon icon="clock" color={pdfTheme.colors.purple.iconDark} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.purple.iconDark, marginTop: 1 }]}>2h pós Jantar</Text>
            </View>
            <View style={[tableStyles.col, { width: madrugadaColWidth, backgroundColor: pdfTheme.colors.bgLight }]}>
              <HeaderIcon icon="bed" color={pdfTheme.colors.text.dark} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.text.dark, marginTop: 1 }]}>Madrugada</Text>
            </View>
            <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: pdfTheme.colors.bgLight }]}>
              <Text style={glycemicStyles.subHeaderText}></Text>
            </View>
          </View>

          {Array.from({ length: isExample ? 5 : DAYS }).map((_, i) => {
            const isEven = i % 2 === 0;
            const bgColor = isEven ? pdfTheme.colors.text.white : pdfTheme.colors.bgLight;
            const isLast = i === (isExample ? 5 : DAYS) - 1;
            
            const mockExamples = [
              { date: "15/05", vals: ["110", "150", "", "", "", "145", "", "Comi pão doce"] },
              { date: "16/05", vals: ["95", "", "115", "130", "", "120", "", "Tudo normal"] },
              { date: "17/05", vals: ["102", "140", "", "165", "100", "", "85", "Suando muito(3h)"] },
              { date: "18/05", vals: ["65", "", "120", "145", "", "135", "", "Tremor antes almoço"] },
              { date: "19/05", vals: ["90", "130", "", "", "105", "", "", "Caminhei 20min"] }
            ];
            
            const exData = isExample ? mockExamples[i] : null;
            const dateTxt = isExample ? exData.date : "___/___";
            const obsTxt = isExample ? exData.vals[7] : "";
            const txtStyles = isExample ? { color: pdfTheme.colors.text.main, fontSize: 8, fontWeight: 'bold' } : { color: pdfTheme.colors.text.muted, opacity: 0.4 };
            const getVal = (idx: number) => isExample ? (exData?.vals[idx] || "—") : " ";

            return (
              <View style={[tableStyles.row, { backgroundColor: bgColor, height: isExample ? 30 : 27 }, isLast ? { borderBottomWidth: 0 } : {}]} key={i}>
                <View style={[tableStyles.col, { width: dateColWidth }]}>
                  <Text style={[tableStyles.cellText, { fontSize: isExample ? 8 : 8 }]}>{dateTxt}</Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? pdfTheme.colors.period.morningAlt : pdfTheme.colors.warning.softBg }]}>
                  <Text style={[tableStyles.cellText, txtStyles as any]}>{getVal(0)}</Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? pdfTheme.colors.period.morningAlt : pdfTheme.colors.warning.softBg }]}>
                  <Text style={[tableStyles.cellText, txtStyles as any]}>{getVal(1)}</Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? pdfTheme.colors.period.lunchAlt : pdfTheme.colors.period.lunchSoft }]}>
                  <Text style={[tableStyles.cellText, txtStyles as any]}>{getVal(2)}</Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? pdfTheme.colors.period.lunchAlt : pdfTheme.colors.period.lunchSoft }]}>
                  <Text style={[tableStyles.cellText, txtStyles as any]}>{getVal(3)}</Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? pdfTheme.colors.purple.bgSoft : pdfTheme.colors.purple.bg }]}>
                  <Text style={[tableStyles.cellText, txtStyles as any]}>{getVal(4)}</Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? pdfTheme.colors.purple.bgSoft : pdfTheme.colors.purple.bg }]}>
                  <Text style={[tableStyles.cellText, txtStyles as any]}>{getVal(5)}</Text>
                </View>
                <View style={[tableStyles.col, { width: madrugadaColWidth, backgroundColor: isEven ? pdfTheme.colors.bgLight : pdfTheme.colors.bgLight }]}>
                  <Text style={[tableStyles.cellText, txtStyles as any]}>{getVal(6)}</Text>
                </View>
                <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth }]}>
                  <Text style={[tableStyles.cellText, isExample ? { fontSize: 6, color: pdfTheme.colors.text.main, lineHeight: 1.2 } : {}]}>{obsTxt}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {isExample && (
          <View style={{ marginTop: 16, gap: 12 }}>
            <View style={glycemicStyles.refBox}>
              <Text style={glycemicStyles.refTitle}>Metas e Orientações (SBD):</Text>
              <View style={glycemicStyles.refRow}>
                <Text style={glycemicStyles.refText}>• Jejum e antes de comer: <Text style={{fontWeight: 'bold'}}>80 a 130 mg/dL</Text></Text>
                <Text style={glycemicStyles.refText}>• 2h após a refeição: <Text style={{fontWeight: 'bold'}}>Menor que 180 mg/dL</Text></Text>
                <Text style={glycemicStyles.refText}>• <Text style={{fontStyle: 'italic'}}>Idosos e gestantes possuem metas diferentes.</Text></Text>
              </View>
            </View>

            <View style={[glycemicStyles.card, { backgroundColor: pdfTheme.colors.neutral?.bg || '#f8fafc' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <NotebookIcon size={16} color={pdfTheme.colors.primary} />
                <Text style={[glycemicStyles.cardTitle, { fontSize: 12, color: pdfTheme.colors.primary }]}>Dicas de Ouro pro Dia a Dia</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                   <View style={{ marginBottom: 8 }}>
                     <Text style={[glycemicStyles.listText, { fontSize: 9, lineHeight: 1.4 }]}><Text style={{ fontWeight: 'bold' }}>1. Não fure toda hora!</Text> {"\n"}Siga o combinado. "3x na semana"? Tá ótimo. Esqueceu? Só não anotar.</Text>
                   </View>
                   <View style={{ marginBottom: 4 }}>
                     <Text style={[glycemicStyles.listText, { fontSize: 9, lineHeight: 1.4 }]}><Text style={{ fontWeight: 'bold' }}>2. "2h após comer"</Text> {"\n"}Conta o tempo logo da <Text style={{ fontWeight: 'bold' }}>primeira garfada</Text>. O açúcar já começa a subir ali.</Text>
                   </View>
                </View>
                <View style={{ flex: 1, paddingLeft: 10 }}>
                   <View style={{ marginBottom: 8 }}>
                     <Text style={[glycemicStyles.listText, { fontSize: 9, lineHeight: 1.4 }]}><Text style={{ fontWeight: 'bold' }}>3. Coluna OBS de Ouro</Text> {"\n"}Anotar o que mudou sua rotina (tomou suco, dormiu mal, comeu bolo).</Text>
                   </View>
                   <View style={{ marginBottom: 4 }}>
                     <Text style={[glycemicStyles.listText, { fontSize: 9, lineHeight: 1.4 }]}><Text style={{ fontWeight: 'bold' }}>4. Açúcar passou de 180?</Text> {"\n"}Beba muita água pura e tente caminhar. Ajuda o corpo a baixar o valor.</Text>
                   </View>
                </View>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[glycemicStyles.card, { flex: 1, backgroundColor: pdfTheme.colors.info.bg, borderColor: pdfTheme.colors.info.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <HeartPulseIcon size={16} color={pdfTheme.colors.info.strong} />
                  <Text style={[glycemicStyles.cardTitle, { fontSize: 10, color: pdfTheme.colors.info.strong }]}>Cuidados com os Pés</Text>
                </View>
                <Text style={[glycemicStyles.listText, { fontSize: 9, lineHeight: 1.4 }]}>
                  Seque <Text style={{ fontWeight: 'bold' }}>entre os dedos</Text> após o banho. Nunca ande descalço. Cuidado gigante com unha encravada: não tente arrancar em casa, o diabetes diminui a sensibilidade e piora a cicatrização.
                </Text>
              </View>

              <View style={[glycemicStyles.card, { flex: 1, backgroundColor: pdfTheme.colors.success.softBg, borderColor: pdfTheme.colors.success.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <FlaskIcon size={16} color={pdfTheme.colors.success.strong} />
                  <Text style={[glycemicStyles.cardTitle, { fontSize: 10, color: pdfTheme.colors.success.strong }]}>O Poder da Água</Text>
                </View>
                <Text style={[glycemicStyles.listText, { fontSize: 9, lineHeight: 1.4 }]}>
                  Glicemia alta deixa o sangue "grosso" e te resseca. Beber <Text style={{ fontWeight: 'bold' }}>2 a 3 litros de água limpa</Text> todo dia dilui a glicose para o rim ajudar na limpeza pelo xixi.
                </Text>
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
      {/* PÁGINA 1: INSTRUÇÃO E EXAMES */}
      <BaseDocument title="Programa de Monitoramento do Diabetes" visibleParagraphs={visibleParagraphs} wrap={false} nomePaciente={formData?.nomePaciente} cnsCpf={formData?.cnsCpf}>
        <View style={glycemicStyles.coverContainer}>
          <View style={glycemicStyles.coverCol}>
            <View style={glycemicStyles.card}>
              <View style={glycemicStyles.cardHeader}>
                <WarningLightIcon size={20} color={pdfTheme.colors.warning.strong} />
                <Text style={[glycemicStyles.cardTitle, { color: pdfTheme.colors.warning.strong }]}>Segredos do Furo Perfeito</Text>
              </View>
              <Text style={[glycemicStyles.listText, { marginBottom: 8 }]}>Evite valores errados no glicosímetro:</Text>
              <View style={glycemicStyles.listItem}>
                <CheckmarkIcon size={12} color={pdfTheme.colors.success.strong} />
                <Text style={glycemicStyles.listItemText}><Text style={{ fontWeight: 'bold' }}>Seca Bem:</Text> Lave com água e sabão e seque. Dedo molhado abaixa o valor real no aparelho.</Text>
              </View>
              <View style={glycemicStyles.listItem}>
                <CheckmarkIcon size={12} color={pdfTheme.colors.success.strong} />
                <Text style={glycemicStyles.listItemText}><Text style={{ fontWeight: 'bold' }}>Agite o Braço:</Text> Deixe o braço pendurado pra balançar o sangue para a ponta dos dedos antes.</Text>
              </View>
              <View style={glycemicStyles.listItem}>
                <CheckmarkIcon size={12} color={pdfTheme.colors.success.strong} />
                <Text style={glycemicStyles.listItemText}><Text style={{ fontWeight: 'bold' }}>Fure de Lado:</Text> A lateral da ponta do dedo sente muito menos dor que o centro. E mude o dedo sempre!</Text>
              </View>
            </View>

            <View style={[glycemicStyles.card, { marginTop: -2, backgroundColor: pdfTheme.colors.warning.softBg, borderColor: pdfTheme.colors.warning.border }]}>
              <View style={glycemicStyles.cardHeader}>
                <InstructionIcon size={20} color={pdfTheme.colors.warning.text} />
                <Text style={[glycemicStyles.cardTitle, { color: pdfTheme.colors.warning.text }]}>Alerta Vermelho: Queda de Açúcar</Text>
              </View>
              <Text style={[glycemicStyles.listText, { fontSize: 9, color: pdfTheme.colors.warning.dark }]}>Menor que 70 mg/dL (Hipoglicemia = Apagão)</Text>
              <Text style={[glycemicStyles.listText, { fontSize: 9, marginTop: 4 }]}>Sintomas Rápidos: Fome gigante, suor super frio na nuca, tremedeira fina, visão escura repentina.</Text>
              <Text style={[glycemicStyles.listText, { fontSize: 9, marginTop: 4, fontWeight: 'bold' }]}>
                Ação Salva-Vidas: Coma 1 colher de sopa pura e rasa de açúcar, ou beba meio copo de refri NÃO ZERO ou suco de caixinha. Depois de 15 minutos de repouso, aí o senhor(a) come algo sólido, como um pão ou biscoito.
              </Text>
            </View>
          </View>

          <View style={glycemicStyles.coverCol}>
            <View style={glycemicStyles.card}>
              <View style={glycemicStyles.cardHeader}>
                <FlaskIcon size={20} color={pdfTheme.colors.purple.text} />
                <Text style={[glycemicStyles.cardTitle, { color: pdfTheme.colors.purple.text }]}>Exames de Revisão SBD</Text>
              </View>
              <Text style={[glycemicStyles.listText, { fontSize: 9, marginBottom: 8 }]}>Leve no Postinho ou Médico na consulta de revisão:</Text>
              
              <View style={glycemicStyles.examItem}>
                <View style={[glycemicStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.magentaBg }]}><DropIcon size={12} color={pdfTheme.colors.exam.magenta} /></View>
                <Text style={glycemicStyles.examText}>Hemoglobina Glicada (HbA1c) <Text style={{ fontSize: 8, fontStyle: 'italic', color: pdfTheme.colors.text.secondary }}>(Média de açúcar dos últimos 3 meses antes do exame)</Text></Text>
              </View>

              <View style={glycemicStyles.examItem}>
                <View style={[glycemicStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.orangeBg }]}><DropIcon size={12} color={pdfTheme.colors.period.afternoon} /></View>
                <Text style={glycemicStyles.examText}>Colesterol e Triglicerídeos <Text style={{ fontSize: 8, fontStyle: 'italic', color: pdfTheme.colors.text.secondary }}>(Perfil Lipídico para ver gordura do sangue)</Text></Text>
              </View>

              <View style={glycemicStyles.examItem}>
                <View style={[glycemicStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.redBg }]}><DropIcon size={12} color={pdfTheme.colors.exam.red} /></View>
                <Text style={glycemicStyles.examText}>Avaliação Renal <Text style={{ fontSize: 8, fontStyle: 'italic', color: pdfTheme.colors.text.secondary }}>(Uréia, Creatinina, Ritmo de Filtração - TFG)</Text></Text>
              </View>

              <View style={glycemicStyles.examItem}>
                <View style={[glycemicStyles.examIconBg, { backgroundColor: pdfTheme.colors.success.softBg }]}><FlaskIcon size={12} color={pdfTheme.colors.exam.green} /></View>
                <Text style={glycemicStyles.examText}>Relação Albuminúria e Urina 1 <Text style={{ fontSize: 8, fontStyle: 'italic', color: pdfTheme.colors.text.secondary }}>(Detecta mais no começo a fraqueza do rim vazando proteína)</Text></Text>
              </View>

              <View style={glycemicStyles.examItem}>
                <View style={[glycemicStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.tealBg }]}><HeartPulseIcon size={12} color={pdfTheme.colors.exam.teal} /></View>
                <Text style={glycemicStyles.examText}>Mapeamento de Retina <Text style={{ fontSize: 8, fontStyle: 'italic', color: pdfTheme.colors.text.secondary }}>(Fundo de Olho - Avaliado por oftalmologista 1x ao ano)</Text></Text>
              </View>
              
              <View style={glycemicStyles.examItem}>
                <View style={[glycemicStyles.examIconBg, { backgroundColor: pdfTheme.colors.warning.bg }]}><InstructionIcon size={12} color={pdfTheme.colors.warning.text} /></View>
                <Text style={glycemicStyles.examText}>Avaliação de Risco para os Pés (Sensibilidade) <Text style={{ fontSize: 8, fontStyle: 'italic', color: pdfTheme.colors.text.secondary }}>(Com a enfermagem)</Text></Text>
              </View>
            </View>

            <View style={[glycemicStyles.card, { marginTop: -2 }]}>
              <View style={glycemicStyles.cardHeader}>
                <NotebookIcon size={20} color={pdfTheme.colors.primary} />
                <Text style={glycemicStyles.cardTitle}>Guarde bem as fitas</Text>
              </View>
              <Text style={glycemicStyles.listText}>Pote de fita aberto muito tempo no ar úmido <Text style={{ fontWeight: 'bold' }}>vence as fitas antes do tempo</Text>. Feche sempre!</Text>
            </View>
          </View>
        </View>
      </BaseDocument>

      {/* PÁGINA 2: EXEMPLO PREENCHIDO COM DICAS ABAIXO */}
      {renderTablePage(true)}

      {/* PÁGINA 3: TABELA VAZIA PARA ANOTAÇÕES */}
      {renderTablePage(false)}
    </React.Fragment>
  );
};
