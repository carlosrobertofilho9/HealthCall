import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import {
  SleepIcon,
} from './LifestyleGraphics';
import {
  MindIcon,
  FoodIcon,
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
    backgroundColor: pdfTheme.colors.purple.bg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.purple.border,
    borderRadius: 6,
    padding: 6,
    marginVertical: 5,
    gap: 6,
  },
  highlightText: {
    fontSize: 7.5,
    color: pdfTheme.colors.purple.text,
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
    backgroundColor: pdfTheme.colors.softBg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 6.5,
    color: pdfTheme.colors.primary,
    fontWeight: 'bold',
  },
  alertStrip: {
    flexDirection: 'row',
    backgroundColor: pdfTheme.colors.warning.bg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.warning.border,
    borderRadius: 6,
    padding: 6,
    marginTop: 5,
    gap: 6,
    alignItems: 'flex-start',
  },
  alertText: {
    flex: 1,
    fontSize: 7.5,
    color: pdfTheme.colors.warning.text,
    lineHeight: 1.45,
  },
  positiveStrip: {
    flexDirection: 'row',
    backgroundColor: pdfTheme.colors.softBg,
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
    backgroundColor: pdfTheme.colors.purple.text,
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

interface MentalHealthDocumentProps {
  visibleParagraphs: string[];
  formData?: DocumentFormData;
}

export const MentalHealthDocument: React.FC<MentalHealthDocumentProps> = ({
  visibleParagraphs,
  formData,
}) => {
  return (
    <BaseDocument
      title="Guia Completo: Higiene do Sono e Saúde Mental"
      visibleParagraphs={visibleParagraphs}
      wrap={false}
      nomePaciente={formData?.nomePaciente}
      cnsCpf={formData?.cnsCpf}
    >
      <View style={S.twoCol}>
        {/* ---- COLUNA ESQUERDA ---- */}
        <View style={S.col}>
          {/* Card 1 – A Regra de Ouro 3-2-1 */}
          <View style={[S.card, { borderColor: pdfTheme.colors.purple.text }]}>
            <View style={S.cardHeader}>
              <SleepIcon size={18} color={pdfTheme.colors.purple.text} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.purple.text }]}>
                1. A Regra de Ouro: 3 - 2 - 1
              </Text>
            </View>
            <Text style={S.bodyText}>
              Para que seu cérebro produza Melatonina (o hormônio do sono), você precisa de uma transição:
            </Text>
            <View style={S.bulletRow}>
              <BulletIcon size={8} color={pdfTheme.colors.purple.text} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>3 horas antes:</Text> Pare de comer refeições pesadas.</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletIcon size={8} color={pdfTheme.colors.purple.text} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>2 horas antes:</Text> Pare de trabalhar ou estudar.</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletIcon size={8} color={pdfTheme.colors.purple.text} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>1 hora antes:</Text> <Text style={{ color: pdfTheme.colors.danger.text }}>SEM TELAS</Text> (celular e TV).</Text>
            </View>
          </View>

          {/* Card 2 – Ambiente e Temperatura */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <LeafIcon size={18} color={pdfTheme.colors.primary} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.primary }]}>
                2. Prepare a sua "Caverna"
              </Text>
            </View>
            <Text style={S.bodyText}>
              O corpo precisa baixar a temperatura interna para dormir fundo.
            </Text>
            <View style={S.bulletRow}>
              <BulletIcon size={10} color={pdfTheme.colors.primary} />
              <Text style={S.bulletText}>Mantenha o quarto <Text style={S.bulletBold}>fresco e ventilado</Text>.</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletIcon size={10} color={pdfTheme.colors.primary} />
              <Text style={S.bulletText}>Use lâmpadas de cor <Text style={S.bulletBold}>amarelada/quente</Text> à noite.</Text>
            </View>
            <View style={[S.positiveStrip, { marginTop: 4 }]}>
              <TipBulletIcon size={10} color={pdfTheme.colors.primary} />
              <Text style={S.positiveText}>
                Se houver ruído externo, use um ventilador ou som de chuva para mascarar o barulho.
              </Text>
            </View>
          </View>

          {/* Card 3 – O poder da Luz Solar */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <MindIcon size={18} color={pdfTheme.colors.warning.strong} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.warning.strong }]}>
                3. O Sono começa de Manhã
              </Text>
            </View>
            <Text style={S.bodyText}>
              Seu relógio biológico se ajusta pela luz que entra nos seus olhos logo cedo.
            </Text>
            <View style={S.positiveStrip}>
              <TipBulletIcon size={10} color={pdfTheme.colors.warning.strong} />
              <Text style={S.positiveText}>
                Procure receber <Text style={{ fontWeight: 'bold' }}>15 min de luz natural</Text> assim que acordar (mesmo se estiver nublado). Isso "liga" seu corpo para o dia e prepara o sono da noite.
              </Text>
            </View>
          </View>

          {/* Card 4 – Bebidas e Estimulantes */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <FoodIcon size={18} color={pdfTheme.colors.danger.strong} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.danger.strong }]}>
                4. Cuidado com Extras
              </Text>
            </View>
            <View style={S.bulletRow}>
              <AlertBulletIcon size={10} color={pdfTheme.colors.danger.strong} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>Cafeína:</Text> O efeito dura até 8 horas. Evite após as 14h-15h.</Text>
            </View>
            <View style={S.bulletRow}>
              <AlertBulletIcon size={10} color={pdfTheme.colors.danger.strong} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>Álcool:</Text> Ajuda a pegar no sono, mas <Text style={S.bulletBold}>estraga</Text> a qualidade dele. Você acorda mais cansado.</Text>
            </View>
          </View>
        </View>

        {/* ---- COLUNA DIREITA ---- */}
        <View style={S.col}>
          {/* Card 5 – Faxina Mental: Técnica 4-7-8 */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <MindIcon size={18} color={pdfTheme.colors.purple.text} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.purple.text }]}>
                5. Acalmando o Pensamento
              </Text>
            </View>
            <Text style={S.bodyText}>
              Se a mente não para, use a técnica de respiração <Text style={S.bulletBold}>4-7-8</Text>:
            </Text>
            <View style={S.highlightPill}>
              <Text style={S.highlightText}>
                Inale por 4 seg. Segure por 7 seg. Solte o ar (fazendo barulho) por 8 seg. Repita 4 vezes.
              </Text>
            </View>
            <View style={S.positiveStrip}>
              <TipBulletIcon size={10} color={pdfTheme.colors.purple.text} />
              <Text style={[S.positiveText, { color: pdfTheme.colors.purple.textDark }]}>
                <Text style={{ fontWeight: 'bold' }}>Diário da Preocupação:</Text> Se o problema martela na cabeça, anote-o em um papel com a frase: "Vou resolver isso amanhã às 09h".
              </Text>
            </View>
          </View>

          {/* Card 6 – Sinais de Alerta */}
          <View style={[S.card, { backgroundColor: '#fff5f5' }]}>
            <View style={S.cardHeader}>
              <AlertBulletIcon size={18} color={pdfTheme.colors.danger.strong} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.danger.strong }]}>
                6. Quando Buscar Ajuda Profissional?
              </Text>
            </View>
            <Text style={S.bodyText}>
              Não sofra em silêncio. Procure o postinho se sentir:
            </Text>
            <View style={S.chipRow}>
              {['Tristeza Constante', 'Falta de Ar', 'Irritação Forte', 'Medo Excessivo', 'Perda de Vontade'].map((f) => (
                <View key={f} style={[S.chip, { backgroundColor: '#fff', borderColor: '#feb2b2' }]}>
                  <Text style={[S.chipText, { color: '#e53e3e' }]}>{f}</Text>
                </View>
              ))}
            </View>
            <View style={[S.alertStrip, { backgroundColor: '#fff' }]}>
              <AlertBulletIcon size={10} color={pdfTheme.colors.danger.strong} />
              <Text style={[S.alertText, { fontSize: 7 }]}>
                <Text style={{ fontWeight: 'bold' }}>Automedicação:</Text> Nunca use remédios "faixa preta" de vizinhos. Eles causam vício e pioram a memória.
              </Text>
            </View>
          </View>

          {/* Banner de Saúde Mental */}
          <View style={[S.card, { backgroundColor: pdfTheme.colors.softBg, borderColor: pdfTheme.colors.primary }]}>
             <Text style={[S.bodyText, { textAlign: 'center', fontStyle: 'italic' }]}>
               "Cuidar da mente é o primeiro passo para o corpo não adoecer."
             </Text>
          </View>

          {/* Footer reminder */}
          <View style={S.reminderBanner}>
            <SleepIcon size={22} color={pdfTheme.colors.text.white} />
            <Text style={S.reminderText}>
              <Text style={S.reminderBold}>Sono é prioridade, não luxo!</Text> Enquanto você dorme, seu cérebro limpa toxinas e fixa o aprendizado. Priorize seu descanso hoje.
            </Text>
          </View>
        </View>
      </View>
    </BaseDocument>
  );
};
