import React from 'react';
import { Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { HeaderIcon, tableStyles, BaseDocument } from './PdfCommon';

const s = StyleSheet.create({
  container: { width: '100%' },
  sectionBox: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f766e',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBody: {
    padding: 10,
    backgroundColor: '#ffffff',
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
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    height: 18,
    justifyContent: 'center',
  },
  fieldLineText: {
    fontSize: 9,
    color: '#334155',
  },
  diagramBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  diagramLabel: {
    fontSize: 7,
    color: '#94a3b8',
    textAlign: 'center',
  },
  photoBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  photoLabel: {
    fontSize: 7,
    color: '#94a3b8',
    textAlign: 'center',
  },
  colHeader: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#0f766e',
    textAlign: 'center',
  },
  colHeaderAlt: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#ffffff',
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
    borderColor: '#94a3b8',
    borderRadius: 2,
  },
  checkLabel: {
    fontSize: 7.5,
    color: '#334155',
  },
  infoBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 3,
  },
  infoText: {
    fontSize: 7,
    color: '#334155',
    lineHeight: 1.4,
    marginBottom: 2,
  },
  pageBreakLabel: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

interface WoundCareDocumentProps {
  visibleParagraphs: string[];
  photoUrl?: string;
}

export const WoundCareDocument: React.FC<WoundCareDocumentProps> = ({ visibleParagraphs, photoUrl }) => {
  const ROWS = 12;

  return (
    <BaseDocument title="Ficha de Evolução de Curativos" visibleParagraphs={visibleParagraphs}>
      {/* Page 1: Dados da Lesão + Foto Inicial */}
      
      {/* Section 1: Dados da Lesão */}
      <View style={s.sectionBox}>
        <View style={s.sectionHeader}>
          <HeaderIcon icon="clipboard" color="#ffffff" />
          <Text style={s.sectionHeaderText}>Dados da Lesão</Text>
        </View>
        <View style={s.sectionBody}>
          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Localização da Lesão</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
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
              <View style={s.fieldLine}><Text style={s.fieldLineText}>___/___/______</Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Classificação (Grau / Estágio)</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Medida Inicial (C x L x P em cm)</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>______ x ______ x ______</Text></View>
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
        <View style={[s.sectionHeader, { backgroundColor: '#7c3aed' }]}>
          <HeaderIcon icon="activity" color="#ffffff" />
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
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Cobertura Inicial Utilizada</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Observações / Plano Terapêutico</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
              <View style={[s.fieldLine, { marginTop: 2 }]}><Text style={s.fieldLineText}></Text></View>
            </View>
          </View>
        </View>
      </View>

      {/* Indicação de continuação na próxima página */}
      <Text style={s.pageBreakLabel}>▼ Tabela de Evolução na próxima página ▼</Text>

      {/* Page 2: Tabela de Evolução — usa break para forçar para próxima página */}
      <View style={[s.sectionBox, { marginTop: 10 }]} break>
        <View style={[s.sectionHeader, { backgroundColor: '#7c3aed' }]}>
          <HeaderIcon icon="activity" color="#ffffff" />
          <Text style={s.sectionHeaderText}>Evolução dos Curativos</Text>
        </View>
        <View style={{ padding: 0 }}>
          <View style={tableStyles.table}>
            {/* Header */}
            <View style={[tableStyles.row, { height: 32, backgroundColor: '#f5f3ff' }]}>
              <View style={[tableStyles.col, { width: '8%' }]}>
                <Text style={s.colHeader}>Data</Text>
              </View>
              <View style={[tableStyles.col, { width: '8%' }]}>
                <Text style={s.colHeader}>Medida</Text>
                <Text style={[s.colHeader, { fontSize: 5, color: '#64748b' }]}>C x L x P</Text>
              </View>
              <View style={[tableStyles.col, { width: '10%' }]}>
                <Text style={s.colHeader}>Aspecto</Text>
                <Text style={[s.colHeader, { fontSize: 5, color: '#64748b' }]}>do Leito</Text>
              </View>
              <View style={[tableStyles.col, { width: '10%' }]}>
                <Text style={s.colHeader}>Bordas</Text>
              </View>
              <View style={[tableStyles.col, { width: '10%' }]}>
                <Text style={s.colHeader}>Exsudato</Text>
                <Text style={[s.colHeader, { fontSize: 5, color: '#64748b' }]}>Tipo/Qtd</Text>
              </View>
              <View style={[tableStyles.col, { width: '8%' }]}>
                <Text style={s.colHeader}>Odor</Text>
              </View>
              <View style={[tableStyles.col, { width: '8%' }]}>
                <Text style={s.colHeader}>Dor</Text>
                <Text style={[s.colHeader, { fontSize: 5, color: '#64748b' }]}>0-10</Text>
              </View>
              <View style={[tableStyles.col, { width: '14%' }]}>
                <Text style={s.colHeader}>Cobertura</Text>
                <Text style={[s.colHeader, { fontSize: 5, color: '#64748b' }]}>Utilizada</Text>
              </View>
              <View style={[tableStyles.col, { width: '12%' }]}>
                <Text style={s.colHeader}>Observações</Text>
              </View>
              <View style={[tableStyles.col, tableStyles.lastCol, { width: '12%' }]}>
                <Text style={s.colHeader}>Profissional</Text>
                <Text style={[s.colHeader, { fontSize: 5, color: '#64748b' }]}>Nome/COREN</Text>
              </View>
            </View>

            {/* Data Rows */}
            {Array.from({ length: ROWS }).map((_, i) => {
              const isEven = i % 2 === 0;
              const isLast = i === ROWS - 1;
              return (
                <View style={[tableStyles.row, { height: 28, backgroundColor: isEven ? '#ffffff' : '#faf5ff' }, isLast ? { borderBottomWidth: 0 } : {}]} key={i}>
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
          <HeaderIcon icon="heart" color="#1e40af" />
          <Text style={s.infoTitle}>Coberturas Mais Utilizadas:</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {[
            'AGE (Ácidos Graxos)', 'Alginato de Cálcio', 'Hidrogel', 'Hidrocolóide',
            'Carvão Ativado c/ Prata', 'Espuma de Poliuretano', 'Colagenase', 'Papaína',
            'Sulfadiazina de Prata', 'Bota de Unna', 'Curativo a Vácuo (VAC)',
          ].map((item) => (
            <View key={item} style={{ backgroundColor: '#dbeafe', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 }}>
              <Text style={{ fontSize: 6.5, color: '#1e40af' }}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </BaseDocument>
  );
};
