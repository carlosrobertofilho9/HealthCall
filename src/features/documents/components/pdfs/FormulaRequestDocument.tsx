import React from 'react';
import { Text, View, StyleSheet, Svg, Line } from '@react-pdf/renderer';
import { HeaderIcon, BaseDocument, pdfTheme, type DocumentFormData } from './PdfCommon';

const s = StyleSheet.create({
  container: { 
    flex: 1,
    flexDirection: 'column',
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: pdfTheme.colors.info.bg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.info.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: pdfTheme.colors.info.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  solicitoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.main,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.border,
  },
  itemRowAlt: {
    backgroundColor: pdfTheme.colors.bgLight,
  },
  itemNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
    width: 24,
  },
  itemName: {
    flex: 1,
    fontSize: 11,
    color: pdfTheme.colors.text.main,
  },
  itemDots: {
    flex: 2,
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.borderDark,
    borderStyle: 'dotted',
    marginHorizontal: 8,
    height: 12,
  },
  itemQty: {
    fontSize: 11,
    fontWeight: 'bold',
    color: pdfTheme.colors.info.text,
    textAlign: 'right',
    minWidth: 60,
  },
  listBox: {
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  listHeader: {
    flexDirection: 'row',
    backgroundColor: pdfTheme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  listHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.border,
  },
  emptyLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.borderDark,
    height: 16,
  },

  signatureRow: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 30,
    justifyContent: 'center',
  },
  signatureBlock: {
    alignItems: 'center',
    width: 200,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.text.main,
    width: '100%',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 7,
    color: pdfTheme.colors.text.secondary,
    textAlign: 'center',
  },
  dateField: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    marginBottom: 6,
  },
  dateLabel: {
    fontSize: 9,
    color: pdfTheme.colors.text.secondary,
  },
  dateLine: {
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.borderDark,
    width: 120,
    marginLeft: 6,
  },
  noteBox: {
    marginTop: 12,
    padding: 8,
    backgroundColor: pdfTheme.colors.warning.softBg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: pdfTheme.colors.warning.border,
  },
  noteTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: pdfTheme.colors.warning.text,
    marginBottom: 3,
  },
  noteText: {
    fontSize: 7,
    color: pdfTheme.colors.warning.dark,
    lineHeight: 1.4,
  },
});

export interface FormulaItem {
  name: string;
  quantity: string;
}

interface FormulaRequestDocumentProps {
  visibleParagraphs: string[];
  formulaItems?: FormulaItem[];
  formData?: DocumentFormData;
}

const VoidPattern = () => (
  <View style={{ 
    flex: 1, 
    flexGrow: 1,
    minHeight: 100,
    marginVertical: 12, 
    borderRadius: 6, 
    backgroundColor: pdfTheme.colors.bgLight,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    position: 'relative',
    overflow: 'hidden'
  }}>
    <Svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
       <Line x1="0" y1="0" x2="100%" y2="100%" stroke={pdfTheme.colors.border} strokeWidth={1.5} />
       <Line x1="100%" y1="0" x2="0" y2="100%" stroke={pdfTheme.colors.border} strokeWidth={1.5} />
    </Svg>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
       <Text style={{ fontSize: 9, color: pdfTheme.colors.text.light, fontWeight: 'bold', letterSpacing: 3, textTransform: 'uppercase' }}>
          — Sem Mais Itens —
       </Text>
    </View>
  </View>
);

export const FormulaRequestDocument: React.FC<FormulaRequestDocumentProps> = ({ visibleParagraphs, formulaItems = [], formData }) => {
  return (
    <BaseDocument title="Solicitação de Fórmula Láctea" visibleParagraphs={visibleParagraphs} nomePaciente={formData?.nomePaciente} cnsCpf={formData?.cnsCpf} wrap={false}>
      <View style={s.container}>
        {/* Badge */}
        <View style={s.badge}>
          <HeaderIcon icon="clipboard" color={pdfTheme.colors.info.text} />
          <Text style={s.badgeText}>Solicitação de Fórmula Láctea</Text>
        </View>

        {/* Solicito */}
        <Text style={s.solicitoText}>Solicito o fornecimento da(s) fórmula(s) láctea(s) abaixo relacionada(s):</Text>

        {/* Lista de itens */}
        <View style={s.listBox}>
          <View style={s.listHeader}>
            <Text style={[s.listHeaderText, { width: 24 }]}>Nº</Text>
            <Text style={[s.listHeaderText, { flex: 1 }]}>Fórmula</Text>
            <Text style={[s.listHeaderText, { minWidth: 80, textAlign: 'right' }]}>Quantidade</Text>
          </View>
          {/* Itens preenchidos */}
          {formulaItems.map((item, index) => (
            <View key={index} style={[s.itemRow, index % 2 === 1 && s.itemRowAlt]}>
              <Text style={s.itemNumber}>{index + 1}.</Text>
              <Text style={s.itemName}>{item.name}</Text>
              <View style={s.itemDots} />
              <Text style={s.itemQty}>{item.quantity} Lata(s)</Text>
            </View>
          ))}

          {/* Linhas vazias para preenchimento manual caso necessário */}
          {formulaItems.length === 0 && (
            <>
              {[1, 2, 3, 4, 5].map((n) => (
                <View key={`empty-${n}`} style={[s.emptyRow, n % 2 === 0 && s.itemRowAlt]}>
                  <Text style={s.itemNumber}>{n}.</Text>
                  <View style={[s.emptyLine, { marginRight: 8 }]} />
                  <View style={[s.emptyLine, { flex: 0, width: 80 }]} />
                </View>
              ))}
            </>
          )}
        </View>

        {/* Espaço bloqueado visualmente */}
        <VoidPattern />

        {/* Data */}
        <View style={s.dateField}>
          <Text style={s.dateLabel}>Data: ___/___/______</Text>
        </View>

        {/* Assinaturas */}
        <View style={s.signatureRow}>
          <View style={s.signatureBlock}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>Assinatura e Carimbo do Profissional</Text>
          </View>
          <View style={s.signatureBlock}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>Assinatura do Responsável</Text>
          </View>
        </View>

        {/* Observação */}
        <View style={s.noteBox}>
          <Text style={s.noteTitle}>Observações:</Text>
          <Text style={s.noteText}>- Este documento deve ser apresentado na farmácia ou setor de dispensação da unidade.</Text>
          <Text style={s.noteText}>- A quantidade solicitada é referente ao período mensal de consumo.</Text>
          <Text style={s.noteText}>- A fórmula láctea só será dispensada mediante prescrição médica válida.</Text>
        </View>
      </View>
    </BaseDocument>
  );
};
