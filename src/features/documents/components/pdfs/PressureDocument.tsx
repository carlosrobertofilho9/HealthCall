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
    color: '#ffffff',
    textAlign: 'center',
    paddingVertical: 3,
  },
  subHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f0fdfa',
    borderBottomWidth: 1,
    borderBottomColor: '#0d9488',
    height: 22,
    alignItems: 'center',
  },
  subHeaderText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#0f766e',
    textAlign: 'center',
  },
  instructionBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f0fdfa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  instructionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  instructionText: {
    fontSize: 7,
    color: '#334155',
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
    color: '#475569',
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
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f766e',
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
    color: '#334155',
    lineHeight: 1.4,
  },
  listText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.4,
  },
  examItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  examIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  examText: {
    fontSize: 9,
    color: '#334155',
    flex: 1,
  },
  footerNote: {
    fontSize: 8,
    color: '#64748b',
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
                <NotebookIcon size={20} color="#0f766e" />
                <Text style={pressureStyles.cardTitle}>Instruções para Medição no Ambulatório</Text>
              </View>
              <Text style={[pressureStyles.listText, { marginBottom: 8 }]}>
                Compareça ao posto ou ambulatório nos períodos indicados. O profissional registrará <Text style={{ fontWeight: 'bold' }}>2 medições</Text> em cada comparecimento.
              </Text>
              <View>
                <View style={pressureStyles.listItem}>
                  <InstructionIcon size={12} color="#0f766e" />
                  <Text style={pressureStyles.listItemText}><Text style={{ fontWeight: 'bold' }}>Manhã:</Text> Comparecer antes do desjejum ou da primeira medicação.</Text>
                </View>
                <View style={pressureStyles.listItem}>
                  <InstructionIcon size={12} color="#0f766e" />
                  <Text style={pressureStyles.listItemText}><Text style={{ fontWeight: 'bold' }}>Tarde:</Text> Comparecer preferencialmente antes do almoço ou entre 13h e 15h.</Text>
                </View>
                <View style={pressureStyles.listItem}>
                  <InstructionIcon size={12} color="#0f766e" />
                  <Text style={pressureStyles.listItemText}><Text style={{ fontWeight: 'bold' }}>Noite:</Text> Comparecer antes do jantar ou conforme orientação da equipe.</Text>
                </View>
              </View>
            </View>

            <View style={pressureStyles.card}>
              <View style={pressureStyles.cardHeader}>
                <WarningLightIcon size={20} color="#ca8a04" />
                <Text style={[pressureStyles.cardTitle, { color: '#ca8a04' }]}>Como realizar a medida corretamente</Text>
              </View>
              <View style={pressureStyles.listItem}>
                <CheckmarkIcon size={12} color="#059669" />
                <Text style={pressureStyles.listItemText}>Bexiga vazia (urinar antes de iniciar as medições).</Text>
              </View>
              <View style={pressureStyles.listItem}>
                <CheckmarkIcon size={12} color="#059669" />
                <Text style={pressureStyles.listItemText}>Repouso de 5 min antes de iniciar.</Text>
              </View>
              <View style={pressureStyles.listItem}>
                <CheckmarkIcon size={12} color="#059669" />
                <Text style={pressureStyles.listItemText}>Não cruzar pernas, pés no chão, braço na mesa na altura do coração. Manguito colocado livre de roupas.</Text>
              </View>
              <View style={pressureStyles.listItem}>
                <CheckmarkIcon size={12} color="#059669" />
                <Text style={pressureStyles.listItemText}>Silêncio. É importante não falar ou se mover.</Text>
              </View>
            </View>
          </View>

          {/* Coluna 2: Exames */}
          <View style={pressureStyles.coverCol}>
             <View style={pressureStyles.card}>
              <View style={pressureStyles.cardHeader}>
                <FlaskIcon size={20} color="#7c3aed" />
                <Text style={[pressureStyles.cardTitle, { color: '#7c3aed' }]}>Exames a trazer com o Diário</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: '#fef3c7' }]}><DropIcon size={12} color="#d97706" /></View>
                <Text style={pressureStyles.examText}>Análise de urina</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: '#fee2e2' }]}><DropIcon size={12} color="#ef4444" /></View>
                <Text style={pressureStyles.examText}>Potássio plasmático e Creatinina plasmática</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: '#e0e7ff' }]}><FlaskIcon size={12} color="#4f46e5" /></View>
                <Text style={pressureStyles.examText}>Estimativa da TFGe pelo CKD-EPI*</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: '#ecfdf5' }]}><FlaskIcon size={12} color="#10b981" /></View>
                <Text style={pressureStyles.examText}>Razão proteinúria/creatininúria</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: '#fae8ff' }]}><DropIcon size={12} color="#c026d3" /></View>
                <Text style={pressureStyles.examText}>Glicemia de jejum e hemoglobina glicada</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: '#ffedd5' }]}><DropIcon size={12} color="#ea580c" /></View>
                <Text style={pressureStyles.examText}>Colesterol e triglicerídeos plasmáticos**</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: '#ccfbf1' }]}><DropIcon size={12} color="#14b8a6" /></View>
                <Text style={pressureStyles.examText}>Ácido úrico plasmático</Text>
              </View>

              <View style={pressureStyles.examItem}>
                <View style={[pressureStyles.examIconBg, { backgroundColor: '#ffe4e6' }]}><HeartPulseIcon size={12} color="#e11d48" /></View>
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
               <View style={[pressureStyles.legendColor, { backgroundColor: '#fbbf24' }]} />
              <Text style={pressureStyles.legendText}>Manhã (PSF / Casa)</Text>
            </View>
            <View style={pressureStyles.legendItem}>
              <View style={[pressureStyles.legendColor, { backgroundColor: '#f97316' }]} />
              <Text style={pressureStyles.legendText}>Tarde (PSF / Casa)</Text>
            </View>
            <View style={pressureStyles.legendItem}>
              <View style={[pressureStyles.legendColor, { backgroundColor: '#6366f1' }]} />
              <Text style={pressureStyles.legendText}>Noite (Hospital / Casa)</Text>
            </View>
          </View>
  
          <View style={{ marginTop: 12 }} />
  
          {/* Main Table */}
          <View style={tableStyles.table}>
            {/* Row 1: Period Group Headers */}
            <View style={[tableStyles.row, { height: 26, backgroundColor: '#f8fafc' }]}>
              <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: '#0d9488' }]}>
                <Text style={pressureStyles.periodTitle}>DIA</Text>
              </View>
              <View style={[tableStyles.col, { width: morningGroupWidth, backgroundColor: '#f59e0b', borderRightColor: '#e2e8f0' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <HeaderIcon icon="sun" color="#ffffff" />
                  <Text style={pressureStyles.periodTitle}>MANHÃ</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: afternoonGroupWidth, backgroundColor: '#ea580c', borderRightColor: '#e2e8f0' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <HeaderIcon icon="coffee" color="#ffffff" />
                  <Text style={pressureStyles.periodTitle}>TARDE</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: nightGroupWidth, backgroundColor: '#4f46e5', borderRightColor: '#e2e8f0' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <HeaderIcon icon="moon" color="#ffffff" />
                  <Text style={pressureStyles.periodTitle}>NOITE</Text>
                </View>
              </View>
              <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: '#64748b' }]}>
                <Text style={pressureStyles.periodTitle}>OBS</Text>
              </View>
            </View>
  
            {/* Row 2: Sub-column Headers (Med 1, Med 2 with PAS/PAD) */}
            <View style={[pressureStyles.subHeaderRow, { height: 34 }]}>
              <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: '#f0fdfa' }]}>
                <Text style={pressureStyles.subHeaderText}>Data</Text>
              </View>
              <View style={[tableStyles.col, { width: '15%', backgroundColor: '#fffbeb' }]}>
                <Text style={[pressureStyles.subHeaderText, { color: '#92400e' }]}>1ª Medição</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, width: '100%' }}>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#b45309', fontSize: 5 }]}>PAS</Text>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#b45309', fontSize: 5 }]}>PAD</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: '15%', backgroundColor: '#fffbeb' }]}>
                <Text style={[pressureStyles.subHeaderText, { color: '#92400e' }]}>2ª Medição</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, width: '100%' }}>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#b45309', fontSize: 5 }]}>PAS</Text>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#b45309', fontSize: 5 }]}>PAD</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: '15%', backgroundColor: '#fff7ed' }]}>
                <Text style={[pressureStyles.subHeaderText, { color: '#9a3412' }]}>1ª Medição</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, width: '100%' }}>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#c2410c', fontSize: 5 }]}>PAS</Text>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#c2410c', fontSize: 5 }]}>PAD</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: '15%', backgroundColor: '#fff7ed' }]}>
                <Text style={[pressureStyles.subHeaderText, { color: '#9a3412' }]}>2ª Medição</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, width: '100%' }}>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#c2410c', fontSize: 5 }]}>PAS</Text>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#c2410c', fontSize: 5 }]}>PAD</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: '12%', backgroundColor: '#eef2ff' }]}>
                <Text style={[pressureStyles.subHeaderText, { color: '#3730a3' }]}>1ª Medição</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, width: '100%' }}>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#4338ca', fontSize: 5 }]}>PAS</Text>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#4338ca', fontSize: 5 }]}>PAD</Text>
                </View>
              </View>
              <View style={[tableStyles.col, { width: '12%', backgroundColor: '#eef2ff' }]}>
                <Text style={[pressureStyles.subHeaderText, { color: '#3730a3' }]}>2ª Medição</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, width: '100%' }}>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#4338ca', fontSize: 5 }]}>PAS</Text>
                  <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#4338ca', fontSize: 5 }]}>PAD</Text>
                </View>
              </View>
              <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: '#f8fafc' }]}>
                <Text style={pressureStyles.subHeaderText}></Text>
              </View>
            </View>
  
            {/* Data Rows - 7 days */}
            {Array.from({ length: DAYS }).map((_, i) => {
              const isEven = i % 2 === 0;
              const bgColor = isEven ? '#ffffff' : '#f8fafc';
              const isLast = i === DAYS - 1;
              return (
                <View style={[tableStyles.row, { backgroundColor: bgColor, height: 45 }, isLast ? { borderBottomWidth: 0 } : {}]} key={i}>
                  <View style={[tableStyles.col, { width: dateColWidth }]}>
                    <Text style={[tableStyles.cellText, { fontSize: 8 }]}>___/___</Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffcf5' : '#fff7ed' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffcf5' : '#fff7ed' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffcf5' : '#fff7ed' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffcf5' : '#fff7ed' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? '#f5f5ff' : '#eef2ff' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? '#f5f5ff' : '#eef2ff' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? '#f5f5ff' : '#eef2ff' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? '#f5f5ff' : '#eef2ff' }]}>
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
              <HeaderIcon icon="clipboard" color="#0f766e" />
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
