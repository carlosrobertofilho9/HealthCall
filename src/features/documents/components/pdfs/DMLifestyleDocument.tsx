import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import {
  BloodSugarIcon,
  FootIcon,
} from './LifestyleGraphics';
import {
  FoodIcon,
  MindIcon,
  BulletIcon,
  AlertBulletIcon,
  TipBulletIcon,
  LeafIcon,
} from './HASLifestyleGraphics';
import {
  BaseDocument,
  type DocumentFormData,
  pdfTheme,
} from './PdfCommon';

const S = StyleSheet.create({
  twoCol: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    marginTop: 10,
  },
  col: {
    flex: 1,
    gap: 12,
  },
  card: {
    backgroundColor: pdfTheme.colors.text.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.bgLight,
    paddingBottom: 6,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
    flex: 1,
  },
  subTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.main,
    marginTop: 6,
    marginBottom: 3,
  },
  bodyText: {
    fontSize: 7.5,
    color: pdfTheme.colors.text.muted,
    lineHeight: 1.45,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 5,
  },
  bulletText: {
    flex: 1,
    fontSize: 7.5,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.45,
  },
  bulletBold: {
    fontWeight: 'bold',
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: pdfTheme.colors.lifestyle.foodBg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.lifestyle.foodBorder,
    borderRadius: 6,
    padding: 6,
    marginVertical: 5,
    gap: 6,
  },
  highlightText: {
    fontSize: 7.5,
    color: pdfTheme.colors.lifestyle.foodText,
    fontWeight: 'bold',
    flex: 1,
    lineHeight: 1.4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  chip: {
    backgroundColor: pdfTheme.colors.lifestyle.positiveBg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.lifestyle.positiveBorder,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 6.5,
    color: pdfTheme.colors.lifestyle.positiveText,
    fontWeight: 'bold',
  },
  alertStrip: {
    flexDirection: 'row',
    backgroundColor: pdfTheme.colors.danger.bg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.danger.border,
    borderRadius: 6,
    padding: 6,
    marginTop: 5,
    gap: 6,
    alignItems: 'flex-start',
  },
  alertText: {
    flex: 1,
    fontSize: 7.5,
    color: pdfTheme.colors.danger.text,
    lineHeight: 1.45,
  },
  positiveStrip: {
    flexDirection: 'row',
    backgroundColor: pdfTheme.colors.softBg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.softBg,
    borderRadius: 6,
    padding: 6,
    marginTop: 5,
    gap: 6,
    alignItems: 'flex-start',
  },
  positiveText: {
    flex: 1,
    fontSize: 7.5,
    color: pdfTheme.colors.primary,
    lineHeight: 1.45,
  },
  reminderBanner: {
    marginTop: 10,
    backgroundColor: pdfTheme.colors.primary,
    borderRadius: 6,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderText: {
    fontSize: 7.5,
    color: pdfTheme.colors.text.white,
    flex: 1,
    lineHeight: 1.5,
  },
  reminderBold: {
    fontWeight: 'bold',
  },
});

interface DMLifestyleDocumentProps {
  visibleParagraphs: string[];
  formData?: DocumentFormData;
}

export const DMLifestyleDocument: React.FC<DMLifestyleDocumentProps> = ({
  visibleParagraphs,
  formData,
}) => {
  return (
    <BaseDocument
      title="Guia Completo: Controle e Estilo de Vida com Diabetes"
      visibleParagraphs={visibleParagraphs}
      wrap={false}
      nomePaciente={formData?.nomePaciente}
      cnsCpf={formData?.cnsCpf}
    >
      <View style={S.twoCol}>
        {/* ---- COLUNA ESQUERDA ---- */}
        <View style={S.col}>
          {/* Card 1 – O que é o Diabetes? */}
          <View style={[S.card, { borderColor: pdfTheme.colors.danger.strong }]}>
            <View style={S.cardHeader}>
              <BloodSugarIcon size={18} color={pdfTheme.colors.danger.strong} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.danger.strong }]}>
                1. O Açúcar fora do lugar
              </Text>
            </View>
            <Text style={S.bodyText}>
              No diabetes, o açúcar fica "morando" no seu sangue em vez de entrar nas células para dar energia. Isso oxida e machuca os seus vasos por dentro.
            </Text>
            <View style={S.positiveStrip}>
              <TipBulletIcon size={10} color={pdfTheme.colors.primary} />
              <Text style={S.positiveText}>
                Medir a <Text style={{ fontWeight: 'bold' }}>Hemoglobina Glicada (HbA1c)</Text> é como ver a "média" dos seus últimos 3 meses. É o exame mais importante!
              </Text>
            </View>
          </View>

          {/* Card 2 – O Prato Equilibrado */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <FoodIcon size={18} color={pdfTheme.colors.warning.strong} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.warning.strong }]}>
                2. Monte o Prato Inteligente
              </Text>
            </View>
            <Text style={S.bodyText}>Não é sobre "não comer nada", é sobre equilíbrio:</Text>
            <View style={S.bulletRow}>
              <BulletIcon size={8} color={pdfTheme.colors.success.strong} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>Metade do Prato (50%):</Text> Saladas cruas e legumes cozidos (fibras!).</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletIcon size={8} color={pdfTheme.colors.primary} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>Um Quarto (25%):</Text> Proteínas (ovo, frango, carne magra, feijão).</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletIcon size={8} color={pdfTheme.colors.warning.strong} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>Um Quarto (25%):</Text> Carboidrato complexo (batata-doce, arroz integral, macaxeira).</Text>
            </View>
          </View>

          {/* Card 3 – O Perigo Oculto */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <AlertBulletIcon size={18} color={pdfTheme.colors.danger.strong} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.danger.strong }]}>
                3. Cuidado com o Açúcar Invisível
              </Text>
            </View>
            <Text style={S.bodyText}>Muitos alimentos "salgados" ou industriais escondem açúcar:</Text>
            <View style={S.chipRow}>
              {['Maltodextrina', 'Xarope de Milho', 'Amido Modificado', 'Farinha de Trigo'].map((f) => (
                <View key={f} style={[S.chip, { backgroundColor: '#fff5f5', borderColor: '#feb2b2' }]}>
                  <Text style={[S.chipText, { color: '#c53030' }]}>{f}</Text>
                </View>
              ))}
            </View>
            <View style={[S.alertStrip, { marginTop: 6 }]}>
               <Text style={[S.alertText, { fontSize: 7 }]}>
                 Frutas são saudáveis, mas prefira comer a fruta inteira (com bagaço) do que tomar o suco. O suco perde a fibra e vira açúcar puro.
               </Text>
            </View>
          </View>
        </View>

        {/* ---- COLUNA DIREITA ---- */}
        <View style={S.col}>
          {/* Card 4 – Higiene dos Pés (Avançado) */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <FootIcon size={18} color={pdfTheme.colors.primary} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.primary }]}>
                4. Proteja Seus Pés Diariamente
              </Text>
            </View>
            <Text style={S.bodyText}>O diabetes "dorme" os nervos dos pés. Você pode se machucar e não sentir.</Text>
            <View style={S.bulletRow}>
              <BulletIcon size={8} color={pdfTheme.colors.primary} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>Auto-Exame:</Text> Use um espelho para olhar a sola dos pés todo dia.</Text>
            </View>
            <View style={S.bulletRow}>
              <AlertBulletIcon size={8} color={pdfTheme.colors.danger.strong} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>NÃO LIXE:</Text> Nunca use lixa nos pés. Use hidratante (menos entre os dedos).</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletIcon size={8} color={pdfTheme.colors.primary} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>Calçados:</Text> Sempre fechados, macios e com meias de algodão sem costura.</Text>
            </View>
          </View>

          {/* Card 5 – Identificando Crises */}
          <View style={[S.card, { backgroundColor: '#f0f9ff' }]}>
            <View style={S.cardHeader}>
              <MindIcon size={18} color={pdfTheme.colors.primary} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.primary }]}>
                5. Sinais de Alerta: Agir Rápido
              </Text>
            </View>
            <Text style={[S.subTitle, { marginTop: 0 }]}>Hipoglicemia (Açúcar Baixo):</Text>
            <Text style={[S.bodyText, { marginBottom: 4 }]}>Suor frio, tremedeira, tontura e fome súbita. <Text style={{ fontWeight: 'bold' }}>Ação: coma algo com açúcar na hora.</Text></Text>
            
            <Text style={S.subTitle}>Hiperglicemia (Açúcar Muito Alto):</Text>
            <Text style={S.bodyText}>Muita sede, urina excessiva, cansaço e visão embaçada. <Text style={{ fontWeight: 'bold' }}>Ação: beba muita água e procure o médico.</Text></Text>
          </View>

          {/* Card 6 – Exames de Rotina */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <LeafIcon size={18} color={pdfTheme.colors.success.strong} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.success.strong }]}>
                6. Checklist de Manutenção
              </Text>
            </View>
            <View style={S.bulletRow}>
              <BulletIcon size={10} color={pdfTheme.colors.success.strong} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>Olhos:</Text> Fundo de olho uma vez por ano.</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletIcon size={10} color={pdfTheme.colors.success.strong} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>Rins:</Text> Exame de microalbuminúria (urina).</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletIcon size={10} color={pdfTheme.colors.success.strong} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>Coração:</Text> Teste ergométrico ou ECG periódico.</Text>
            </View>
          </View>

          {/* Footer reminder */}
          <View style={S.reminderBanner}>
            <BloodSugarIcon size={22} color={pdfTheme.colors.text.white} />
            <Text style={S.reminderText}>
              <Text style={S.reminderBold}>Água é seu aliado!</Text> Beber água ajuda os rins a eliminarem o excesso de glicose. Mantenha seu corpo hidratado e ativo.
            </Text>
          </View>
        </View>
      </View>
    </BaseDocument>
  );
};
