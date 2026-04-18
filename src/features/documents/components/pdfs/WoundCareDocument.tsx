import React from 'react';
import { Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { HeaderIcon, tableStyles, BaseDocument, formatDate, pdfTheme, type DocumentFormData } from './PdfCommon';
import { SmartSection, CriticalSection } from './PdfBreakSystem';
const s = StyleSheet.create({
  container: { width: '100%' },
  sectionBox: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: pdfTheme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBody: {
    padding: 10,
    backgroundColor: pdfTheme.colors.text.white,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 12,
  },
  fieldGroup: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.secondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldLine: {
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.borderDark,
    height: 18,
    justifyContent: 'center',
  },
  fieldLineText: {
    fontSize: 9,
    color: pdfTheme.colors.text.main,
  },
  diagramBox: {
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 4,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: pdfTheme.colors.neutral.bg,
    overflow: 'hidden',
  },
  diagramLabel: {
    fontSize: 7,
    color: pdfTheme.colors.text.light,
    textAlign: 'center',
  },
  photoBox: {
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 4,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: pdfTheme.colors.neutral.bg,
    overflow: 'hidden',
  },
  photoLabel: {
    fontSize: 7,
    color: pdfTheme.colors.text.light,
    textAlign: 'center',
  },
  colHeader: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
    textAlign: 'center',
  },
  colHeaderAlt: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.white,
    textAlign: 'center',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  checkBox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: pdfTheme.colors.text.light,
    borderRadius: 2,
  },
  checkLabel: {
    fontSize: 7.5,
    color: pdfTheme.colors.text.main,
  },
  infoBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: pdfTheme.colors.info.bg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: pdfTheme.colors.info.border,
  },
  infoTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: pdfTheme.colors.info.text,
    marginBottom: 3,
  },
  infoText: {
    fontSize: 7,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.4,
    marginBottom: 2,
  },
  pageBreakLabel: {
    fontSize: 8,
    color: pdfTheme.colors.text.light,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

interface WoundCareDocumentProps {
  visibleParagraphs: string[];
  photoUrl?: string;
  formData?: DocumentFormData;
}

export const WoundCareDocument: React.FC<WoundCareDocumentProps> = ({ visibleParagraphs, photoUrl, formData }) => {
  const ROWS = 12;

  return (
    <BaseDocument title="Ficha de Evolução de Curativos" visibleParagraphs={visibleParagraphs} nomePaciente={formData?.nomePaciente} cnsCpf={formData?.cnsCpf}>
      {/* Page 1: Dados da Lesão + Foto Inicial */}
      
      {/* Section 1: Dados da Lesão */}
      <View style={s.sectionBox}>
        <View style={s.sectionHeader}>
          <HeaderIcon icon="clipboard" color={pdfTheme.colors.text.white} />
          <Text style={s.sectionHeaderText}>Dados da Lesão</Text>
        </View>
        <View style={s.sectionBody}>
          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Localização da Lesão</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.localizacaoLesao || ''}</Text></View>
            </View>
            <View style={[s.fieldGroup, { flex: 0.6 }]}>
              <Text style={s.fieldLabel}>Etiologia</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                {['Úlcera Varicosa', 'Pé Diabético', 'Úlcera por Pressão', 'Pós-cirúrgica', 'Traumática', 'Outra'].map((item) => (
                  <View key={item} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Data de Início da Lesão</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formatDate(formData?.dataInicioLesao)}</Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Classificação (Grau / Estágio)</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.classificacaoLesao || ''}</Text></View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Medida Inicial (C x L x P em cm)</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.medidaLesao || '______ x ______ x ______'}</Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Comorbidades</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                {['DM', 'HAS', 'IVC', 'Tabagismo', 'Obesidade', 'Outra'].map((item) => (
                  <View key={item} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Section 2: Registro Fotográfico Inicial + Desenho */}
      <View style={s.sectionBox}>
        <View style={[s.sectionHeader, { backgroundColor: pdfTheme.colors.purple.text }]}>
          <HeaderIcon icon="activity" color={pdfTheme.colors.text.white} />
          <Text style={s.sectionHeaderText}>Registro Visual Inicial da Lesão</Text>
        </View>
        <View style={s.sectionBody}>
          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Foto Inicial da Lesão</Text>
              <View style={s.photoBox}>
                {photoUrl ? (
                  <Image src={photoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <Text style={s.photoLabel}>Inserir foto inicial da lesão{'\n'}(capturada pelo formulário)</Text>
                )}
              </View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Desenho / Localização Anatômica</Text>
              <View style={s.diagramBox}>
                <Text style={s.diagramLabel}>Desenhar localização{'\n'}da lesão aqui</Text>
              </View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Aspecto Inicial do Leito</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                {['Granulação', 'Epitelização', 'Esfacelo', 'Necrose', 'Misto'].map((item) => (
                  <View key={item} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Bordas</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                {['Regulares', 'Irregulares', 'Descoladas', 'Maceradas', 'Hiperqueratóticas'].map((item) => (
                  <View key={item} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Exsudato</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                {['Ausente', 'Seroso', 'Sanguinolento', 'Serossanguinolento', 'Purulento'].map((item) => (
                  <View key={item} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Pele Perilesional</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                {['Íntegra', 'Eritematosa', 'Macerada', 'Descamativa', 'Edemaciada'].map((item) => (
                  <View key={item} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Odor</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
                {['Ausente', 'Discreto', 'Fétido'].map((item) => (
                  <View key={item} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Dor (Escala 0-10)</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.dorEscala || ''}</Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Cobertura Inicial Utilizada</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.coberturaInicial || ''}</Text></View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Observações / Plano Terapêutico</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.observacoesPlano || ''}</Text></View>
              <View style={[s.fieldLine, { marginTop: 2 }]}><Text style={s.fieldLineText}></Text></View>
            </View>
          </View>
        </View>
      </View>

      {/* Page 2: Tabela de Evolução — usa break para forçar para próxima página */}

      {/* Page 2: Tabela de Evolução — usa break para forçar para próxima página */}
      <View style={[s.sectionBox, { marginTop: 10 }]} break>
        <View style={[s.sectionHeader, { backgroundColor: pdfTheme.colors.purple.text }]}>
          <HeaderIcon icon="activity" color={pdfTheme.colors.text.white} />
          <Text style={s.sectionHeaderText}>Evolução dos Curativos</Text>
        </View>
        <View style={{ padding: 0 }}>
          <View style={tableStyles.table}>
            {/* Header */}
            <View style={[tableStyles.row, { height: 32, backgroundColor: pdfTheme.colors.purple.bg }]}>
              <View style={[tableStyles.col, { width: '8%' }]}>
                <Text style={s.colHeader}>Data</Text>
              </View>
              <View style={[tableStyles.col, { width: '8%' }]}>
                <Text style={s.colHeader}>Medida</Text>
                <Text style={[s.colHeader, { fontSize: 5, color: pdfTheme.colors.text.secondary }]}>C x L x P</Text>
              </View>
              <View style={[tableStyles.col, { width: '10%' }]}>
                <Text style={s.colHeader}>Aspecto</Text>
                <Text style={[s.colHeader, { fontSize: 5, color: pdfTheme.colors.text.secondary }]}>do Leito</Text>
              </View>
              <View style={[tableStyles.col, { width: '10%' }]}>
                <Text style={s.colHeader}>Bordas</Text>
              </View>
              <View style={[tableStyles.col, { width: '10%' }]}>
                <Text style={s.colHeader}>Exsudato</Text>
                <Text style={[s.colHeader, { fontSize: 5, color: pdfTheme.colors.text.secondary }]}>Tipo/Qtd</Text>
              </View>
              <View style={[tableStyles.col, { width: '8%' }]}>
                <Text style={s.colHeader}>Odor</Text>
              </View>
              <View style={[tableStyles.col, { width: '8%' }]}>
                <Text style={s.colHeader}>Dor</Text>
                <Text style={[s.colHeader, { fontSize: 5, color: pdfTheme.colors.text.secondary }]}>0-10</Text>
              </View>
              <View style={[tableStyles.col, { width: '14%' }]}>
                <Text style={s.colHeader}>Cobertura</Text>
                <Text style={[s.colHeader, { fontSize: 5, color: pdfTheme.colors.text.secondary }]}>Utilizada</Text>
              </View>
              <View style={[tableStyles.col, { width: '12%' }]}>
                <Text style={s.colHeader}>Observações</Text>
              </View>
              <View style={[tableStyles.col, tableStyles.lastCol, { width: '12%' }]}>
                <Text style={s.colHeader}>Profissional</Text>
                <Text style={[s.colHeader, { fontSize: 5, color: pdfTheme.colors.text.secondary }]}>Nome/COREN</Text>
              </View>
            </View>

            {/* Data Rows */}
            {Array.from({ length: ROWS }).map((_, i) => {
              const isEven = i % 2 === 0;
              const isLast = i === ROWS - 1;
              return (
                <View style={[tableStyles.row, { height: 28, backgroundColor: isEven ? pdfTheme.colors.text.white : pdfTheme.colors.purple.bg }, isLast ? { borderBottomWidth: 0 } : {}]} key={i}>
                  <View style={[tableStyles.col, { width: '8%' }]}>
                    <Text style={[tableStyles.cellText, { fontSize: 7 }]}>__/__</Text>
                  </View>
                  <View style={[tableStyles.col, { width: '8%' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '10%' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '10%' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '10%' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '8%' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '8%' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '14%' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, { width: '12%' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                  <View style={[tableStyles.col, tableStyles.lastCol, { width: '12%' }]}>
                    <Text style={tableStyles.cellText}></Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Coberturas de Referência */}
      <View style={s.infoBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <HeaderIcon icon="heart" color={pdfTheme.colors.info.text} />
          <Text style={s.infoTitle}>Coberturas Mais Utilizadas:</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {[
            'AGE (Ácidos Graxos)', 'Alginato de Cálcio', 'Hidrogel', 'Hidrocolóide',
            'Carvão Ativado c/ Prata', 'Espuma de Poliuretano', 'Colagenase', 'Papaína',
            'Sulfadiazina de Prata', 'Bota de Unna', 'Curativo a Vácuo (VAC)',
          ].map((item) => (
            <View key={item} style={{ backgroundColor: pdfTheme.colors.info.bgStrong, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 }}>
              <Text style={{ fontSize: 6.5, color: pdfTheme.colors.info.text }}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </BaseDocument>
  );
};
