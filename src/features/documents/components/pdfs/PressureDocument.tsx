import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { 
  InstructionIcon, CheckmarkIcon, DropIcon, HeartPulseIcon, 
  FlaskIcon, NotebookIcon, WarningLightIcon 
} from './PressureGraphics';
import { HeaderIcon, tableStyles, BaseDocument, type DocumentFormData, PageHeader, PatientInfoBar, PageFooter, DocTitle, DocText, commonStyles, pdfTheme } from './PdfCommon';
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
}

export const PressureDocument: React.FC<PressureDocumentProps> = ({ visibleParagraphs, formData }) => {
  const DAYS = 7;
  const dateColWidth = '8%';
  const morningGroupWidth = '30%';
  const afternoonGroupWidth = '30%';
  const nightGroupWidth = '24%';
  const obsColWidth = '8%';

  return (
    <React.Fragment>
      {/* === PRIMEIRA PÁGINA (CAPA) === */}
      <BaseDocument title="Monitorização Ambulatorial da Pressão Arterial (MAPA)" visibleParagraphs={visibleParagraphs} wrap={false} nomePaciente={formData?.nomePaciente} cnsCpf={formData?.cnsCpf}>
        <View style={pressureStyles.coverContainer}>
          
          {/* Coluna 1: Como realizar a medida corretamente */}
          <View style={pressureStyles.coverCol}>
            <View style={pressureStyles.card}>
              <View style={pressureStyles.cardHeader}>
                <NotebookIcon size={20} color={pdfTheme.colors.primary} />
                <Text style={pressureStyles.cardTitle}>Instruções para Medição no Ambulatório</Text>
              </View>
              <Text style={[pressureStyles.listText, { marginBottom: 8 }]}>
                Compareça ao posto ou ambulatório nos períodos indicados. O profissional registrará <Text style={{ fontWeight: 'bold' }}>2 medições</Text> em cada comparecimento.
              </Text>
              <View>
                <View style={pressureStyles.listItem}>
                  <InstructionIcon size={12} color={pdfTheme.colors.primary} />
                  <Text style={pressureStyles.listItemText}><Text style={{ fontWeight: 'bold' }}>Manhã:</Text> Comparecer antes do desjejum ou da primeira medicação.</Text>
                </View>
                <View style={pressureStyles.listItem}>
                  <InstructionIcon size={12} color={pdfTheme.colors.primary} />
                  <Text style={pressureStyles.listItemText}><Text style={{ fontWeight: 'bold' }}>Tarde:</Text> Comparecer preferencialmente antes do almoço ou entre 13h e 15h.</Text>
                </View>
                <View style={pressureStyles.listItem}>
                  <InstructionIcon size={12} color={pdfTheme.colors.primary} />
                  <Text style={pressureStyles.listItemText}><Text style={{ fontWeight: 'bold' }}>Noite:</Text> Comparecer antes do jantar ou conforme orientação da equipe.</Text>
                </View>
              </View>
            </View>

            <View style={pressureStyles.card}>
              <View style={pressureStyles.cardHeader}>
                <WarningLightIcon size={20} color={pdfTheme.colors.warning.strong} />
                <Text style={[pressureStyles.cardTitle, { color: pdfTheme.colors.warning.strong }]}>Como realizar a medida corretamente</Text>
              </View>
              <View style={pressureStyles.listItem}>
                <CheckmarkIcon size={12} color={pdfTheme.colors.success.strong} />
                <Text style={pressureStyles.listItemText}>Bexiga vazia (urinar antes de iniciar as medições).</Text>
              </View>
              <View style={pressureStyles.listItem}>
                <CheckmarkIcon size={12} color={pdfTheme.colors.success.strong} />
                <Text style={pressureStyles.listItemText}>Repouso de 5 min antes de iniciar.</Text>
              </View>
              <View style={pressureStyles.listItem}>
                <CheckmarkIcon size={12} color={pdfTheme.colors.success.strong} />
                <Text style={pressureStyles.listItemText}>Não cruzar pernas, pés no chão, braço na mesa na altura do coração. Manguito colocado livre de roupas.</Text>
              </View>
              <View style={pressureStyles.listItem}>
                <CheckmarkIcon size={12} color={pdfTheme.colors.success.strong} />
                <Text style={pressureStyles.listItemText}>Silêncio. É importante não falar ou se mover.</Text>
              </View>
            </View>
          </View>

          {/* Coluna 2: Exames */}
          <View style={pressureStyles.coverCol}>
             <View style={pressureStyles.card}>
              <View style={pressureStyles.cardHeader}>
                <FlaskIcon size={20} color={pdfTheme.colors.purple.text} />
                <Text style={[pressureStyles.cardTitle, { color: pdfTheme.colors.purple.text }]}>Exames a trazer com o Diário</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.yellowBg }]}><DropIcon size={12} color={pdfTheme.colors.period.morningIcon} /></View>
                <Text style={pressureStyles.examText}>Análise de urina</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.redBg }]}><DropIcon size={12} color={pdfTheme.colors.exam.red} /></View>
                <Text style={pressureStyles.examText}>Potássio plasmático e Creatinina plasmática</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.indigoBg }]}><FlaskIcon size={12} color={pdfTheme.colors.period.night} /></View>
                <Text style={pressureStyles.examText}>Estimativa da TFGe pelo CKD-EPI*</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.success.softBg }]}><FlaskIcon size={12} color={pdfTheme.colors.exam.green} /></View>
                <Text style={pressureStyles.examText}>Razão proteinúria/creatininúria</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.magentaBg }]}><DropIcon size={12} color={pdfTheme.colors.exam.magenta} /></View>
                <Text style={pressureStyles.examText}>Glicemia de jejum e hemoglobina glicada</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.orangeBg }]}><DropIcon size={12} color={pdfTheme.colors.period.afternoon} /></View>
                <Text style={pressureStyles.examText}>Colesterol e triglicerídeos plasmáticos**</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.tealBg }]}><DropIcon size={12} color={pdfTheme.colors.exam.teal} /></View>
                <Text style={pressureStyles.examText}>Ácido úrico plasmático</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: pdfTheme.colors.exam.roseBg }]}><HeartPulseIcon size={12} color={pdfTheme.colors.exam.rose} /></View>
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

      {/* === SEGUNDA PÁGINA (TABELA) === */}
      <View style={[commonStyles.page, { paddingBottom: pdfTheme.spacing.xxl, paddingTop: pdfTheme.spacing.xl }]} wrap={false}>
        
        <View style={[commonStyles.mainTitleContainer, { marginBottom: 16 }]}>
          <View style={commonStyles.mainTitleLine} />
          <DocTitle>Diário de Pressão Arterial (MAPA)</DocTitle>
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
                  <HeaderIcon icon="coffee" color={pdfTheme.colors.text.white} />
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
  
            {/* Row 2: Sub-column Headers (Med 1, Med 2 with PAS/PAD) */}
            <View style={[pressureStyles.subHeaderRow, { height: 34 }]}>
              <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: pdfTheme.colors.softBg }]}>
                <Text style={pressureStyles.subHeaderText}>Data</Text>
              </View>
              <View style={[tableStyles.col, { width: '15%', backgroundColor: pdfTheme.colors.warning.softBg }]}>
                <Text style={[pressureStyles.subHeaderText, { color: pdfTheme.colors.warning.text }]}>1ª Medição</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, width: '100%' }}>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: pdfTheme.colors.period.morningText, fontSize: 5 }]}>PAS</Text>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: pdfTheme.colors.period.morningText, fontSize: 5 }]}>PAD</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: '15%', backgroundColor: pdfTheme.colors.warning.softBg }]}>
                <Text style={[pressureStyles.subHeaderText, { color: pdfTheme.colors.warning.text }]}>2ª Medição</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, width: '100%' }}>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: pdfTheme.colors.period.morningText, fontSize: 5 }]}>PAS</Text>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: pdfTheme.colors.period.morningText, fontSize: 5 }]}>PAD</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: '15%', backgroundColor: pdfTheme.colors.period.afternoonSoft }]}>
                <Text style={[pressureStyles.subHeaderText, { color: pdfTheme.colors.period.afternoonDark }]}>1ª Medição</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, width: '100%' }}>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: pdfTheme.colors.period.afternoonText, fontSize: 5 }]}>PAS</Text>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: pdfTheme.colors.period.afternoonText, fontSize: 5 }]}>PAD</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: '15%', backgroundColor: pdfTheme.colors.period.afternoonSoft }]}>
                <Text style={[pressureStyles.subHeaderText, { color: pdfTheme.colors.period.afternoonDark }]}>2ª Medição</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, width: '100%' }}>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: pdfTheme.colors.period.afternoonText, fontSize: 5 }]}>PAS</Text>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: pdfTheme.colors.period.afternoonText, fontSize: 5 }]}>PAD</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: '12%', backgroundColor: pdfTheme.colors.period.nightSoft }]}>
                <Text style={[pressureStyles.subHeaderText, { color: pdfTheme.colors.period.nightDark }]}>1ª Medição</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, width: '100%' }}>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: pdfTheme.colors.period.nightText, fontSize: 5 }]}>PAS</Text>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: pdfTheme.colors.period.nightText, fontSize: 5 }]}>PAD</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: '12%', backgroundColor: pdfTheme.colors.period.nightSoft }]}>
                <Text style={[pressureStyles.subHeaderText, { color: pdfTheme.colors.period.nightDark }]}>2ª Medição</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, width: '100%' }}>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: pdfTheme.colors.period.nightText, fontSize: 5 }]}>PAS</Text>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: pdfTheme.colors.period.nightText, fontSize: 5 }]}>PAD</Text>
                </View>
              </View>
              <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: pdfTheme.colors.bgLight }]}>
                <Text style={pressureStyles.subHeaderText}></Text>
              </View>
            </View>
  
            {/* Data Rows - 7 days */}
            {Array.from({ length: DAYS }).map((_, i) => {
              const isEven = i % 2 === 0;
              const bgColor = isEven ? pdfTheme.colors.text.white : pdfTheme.colors.bgLight;
              const isLast = i === DAYS - 1;
              return (
                <View style={[tableStyles.row, { backgroundColor: bgColor, height: 45 }, isLast ? { borderBottomWidth: 0 } : {}]} key={i}>
                  <View style={[tableStyles.col, { width: dateColWidth }]}>
                    <Text style={[tableStyles.cellText, { fontSize: 8 }]}>___/___</Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? pdfTheme.colors.period.morningAlt : pdfTheme.colors.warning.softBg }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? pdfTheme.colors.period.morningAlt : pdfTheme.colors.warning.softBg }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? pdfTheme.colors.period.morningAlt : pdfTheme.colors.warning.softBg }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? pdfTheme.colors.period.morningAlt : pdfTheme.colors.warning.softBg }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? pdfTheme.colors.period.afternoonAlt : pdfTheme.colors.period.afternoonSoft }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? pdfTheme.colors.period.afternoonAlt : pdfTheme.colors.period.afternoonSoft }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? pdfTheme.colors.period.afternoonAlt : pdfTheme.colors.period.afternoonSoft }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? pdfTheme.colors.period.afternoonAlt : pdfTheme.colors.period.afternoonSoft }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? pdfTheme.colors.period.nightAlt : pdfTheme.colors.period.nightSoft }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? pdfTheme.colors.period.nightAlt : pdfTheme.colors.period.nightSoft }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? pdfTheme.colors.period.nightAlt : pdfTheme.colors.period.nightSoft }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? pdfTheme.colors.period.nightAlt : pdfTheme.colors.period.nightSoft }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                </View>
              );
            })}
          </View>
  
          {/* Instructions Box (Simplified) */}
          <View style={[pressureStyles.card, { marginTop: 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <HeaderIcon icon="clipboard" color={pdfTheme.colors.primary} />
              <Text style={[pressureStyles.cardTitle, { fontSize: 10 }]}>Lembretes ao Profissional:</Text>
            </View>
            <Text style={pressureStyles.listText}>- Anotar detalhadamente a PAS (sistólica) e PAD (diastólica) Ex: 120 / 80.</Text>
            <Text style={pressureStyles.listText}>- Usar a coluna OBS para relatar sintomas aferidos ou faltas/esquecimentos do paciente.</Text>
          </View>
        </View>

        <PageFooter />
      </View>
    </React.Fragment>
  );
};
