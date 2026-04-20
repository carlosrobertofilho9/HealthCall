import React from 'react';
import { Text, View, StyleSheet, Svg, Path, Circle } from '@react-pdf/renderer';
import {
  BaseDocument,
  type DocumentFormData,
  pdfTheme,
} from './PdfCommon';

// --- Ícones Estilo Lucide (Desenhados para React PDF) ---
const ClockIcon = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2" />
    <Path d="M12 6v6l4 2" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MoonIcon = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CoffeeIcon = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M17 8h1a4 4 0 1 1 0 8h-1" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 2v2 M10 2v2 M14 2v2" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SunIcon = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="4" fill="none" stroke={color} strokeWidth="2" />
    <Path d="M12 2v2 M12 20v2 m-7.07-7.07 1.41 1.41 m12.72 12.72 1.41 1.41 M2 12h2 M20 12h2 m-5.66 5.66-1.41 1.41 m12.72-12.72-1.41 1.41" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartPulseIcon = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 5.5v13" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12h6" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BulletPointIcon = ({ size = 10, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="6" fill={color} />
  </Svg>
);

const WindIcon = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M17.7 7.7a2.5 2.5 0 1 1-1.3 4.8H2 M20.2 16.7a2.5 2.5 0 1 0-1.8-4.2H2 M14.7 12.2a2.5 2.5 0 1 1-1.4 4.7H2" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const AlertTriangleIcon = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 9v4 M12 17h.01" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
// --------------------------------------------------------

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
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  cardTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    flex: 1,
  },
  bodyText: {
    fontSize: 8,
    lineHeight: 1.45,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 8,
    lineHeight: 1.45,
  },
  bulletBold: {
    fontWeight: 'bold',
  },
  highlightPill: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    marginVertical: 4,
  },
  highlightText: {
    fontSize: 8,
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 7,
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
  // Paleta de Cores AAA misturada com fundos sólidos suaves no estilo MAPA
  const cPurple = '#4c1d95'; // purple-900 
  const bgPurple = pdfTheme.colors.purple.bg; 

  const cTeal = '#0f766e'; // teal-700
  const bgTeal = pdfTheme.colors.success.softBg;

  const cRed = '#7f1d1d'; // red-900 
  const bgRed = pdfTheme.colors.danger.bg;

  const cOrange = '#78350f'; // amber-900 
  const bgOrange = pdfTheme.colors.warning.softBg;

  const cBlue = '#1e3a8a'; // blue-900
  const bgBlue = pdfTheme.colors.info.bg;
  
  const cIndigo = '#312e81'; // indigo-900
  const bgIndigo = pdfTheme.colors.exam.indigoBg;

  return (
    <BaseDocument
      title="Guia Direto: Higiene do Sono e Saúde Mental"
      visibleParagraphs={visibleParagraphs}
      wrap={false}
      nomePaciente={formData?.nomePaciente}
      cnsCpf={formData?.cnsCpf}
    >
      <View style={S.twoCol}>
        {/* ---- COLUNA ESQUERDA ---- */}
        <View style={S.col}>
          {/* Card 1 – Rotina do Sono */}
          <View style={[S.card, { backgroundColor: bgPurple, borderColor: '#ddd6fe' }]}>
            <View style={[S.cardHeader, { borderBottomColor: '#c4b5fd' }]}>
              <ClockIcon size={16} color={cPurple} />
              <Text style={[S.cardTitle, { color: cPurple }]}>
                1. O Relógio de Dormir
              </Text>
            </View>
            <View style={S.bulletRow}>
              <BulletPointIcon size={6} color={cPurple} />
              <Text style={[S.bulletText, { color: cPurple }]}>Tente <Text style={S.bulletBold}>dormir e acordar sempre na mesma hora</Text>.</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletPointIcon size={6} color={cPurple} />
              <Text style={[S.bulletText, { color: cPurple }]}>Vá para a cama só quando a vontade de dormir chegar.</Text>
            </View>
            <View style={[S.highlightPill, { borderColor: '#c4b5fd' }]}>
              <Text style={[S.highlightText, { color: cPurple }]}>
                Sem sono? Levante. Leia um papel ou ouça uma rádio calma em meia luz, e só volte pra cama ao sentir sono.
              </Text>
            </View>
          </View>

          {/* Card 2 – Ambiente e Luz */}
          <View style={[S.card, { backgroundColor: bgTeal, borderColor: '#a7f3d0' }]}>
            <View style={[S.cardHeader, { borderBottomColor: '#6ee7b7' }]}>
              <MoonIcon size={16} color={cTeal} />
              <Text style={[S.cardTitle, { color: cTeal }]}>
                2. A "Caverna" do Sono
              </Text>
            </View>
            <View style={S.bulletRow}>
              <BulletPointIcon size={6} color={cTeal} />
              <Text style={[S.bulletText, { color: cTeal }]}>Desligue a TV no quarto e fique longe do <Text style={S.bulletBold}>celular</Text> 1 hora antes de dormir. A luz do celular afasta o sono.</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletPointIcon size={6} color={cTeal} />
              <Text style={[S.bulletText, { color: cTeal }]}>Evite ver notícias tristes ou violentas à noite.</Text>
            </View>
          </View>

          {/* Card 3 – Pneumologia e Ronco */}
          <View style={[S.card, { backgroundColor: bgIndigo, borderColor: '#c7d2fe' }]}>
            <View style={[S.cardHeader, { borderBottomColor: '#a5b4fc' }]}>
              <WindIcon size={16} color={cIndigo} />
              <Text style={[S.cardTitle, { color: cIndigo }]}>
                3. Ronco e Apneia Não São Normais
              </Text>
            </View>
            <View style={S.bulletRow}>
              <BulletPointIcon size={6} color={cIndigo} />
              <Text style={[S.bulletText, { color: cIndigo }]}><Text style={S.bulletBold}>Ronco alto ou acordar engasgado</Text> significa que falta ar no cérebro. Procure o posto (UBS).</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletPointIcon size={6} color={cIndigo} />
              <Text style={[S.bulletText, { color: cIndigo }]}><Text style={S.bulletBold}>Obesidade e travesseiros:</Text> Deitar de lado melhora o ronco. Perder peso ajuda na respiração noturna.</Text>
            </View>
          </View>
          
          {/* Card 4 – O que evitar (Estimulantes) */}
          <View style={[S.card, { backgroundColor: bgRed, borderColor: '#fecaca' }]}>
            <View style={[S.cardHeader, { borderBottomColor: '#fca5a5' }]}>
              <CoffeeIcon size={16} color={cRed} />
              <Text style={[S.cardTitle, { color: cRed }]}>
                4. O Que Rouba Seu Sono
              </Text>
            </View>
            <View style={S.bulletRow}>
              <BulletPointIcon size={6} color={cRed} />
              <Text style={[S.bulletText, { color: cRed }]}><Text style={S.bulletBold}>Café e chás:</Text> Nada de café ou chimarrão depois das 3 da tarde.</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletPointIcon size={6} color={cRed} />
              <Text style={[S.bulletText, { color: cRed }]}><Text style={S.bulletBold}>Álcool e Comida:</Text> Cerveja piora o sono. Jante leve à noite!</Text>
            </View>
          </View>
        </View>

        {/* ---- COLUNA DIREITA ---- */}
        <View style={S.col}>
          {/* Card 5 – Hábitos de Dia */}
          <View style={[S.card, { backgroundColor: bgOrange, borderColor: '#fde68a' }]}>
            <View style={[S.cardHeader, { borderBottomColor: '#fcd34d' }]}>
              <SunIcon size={16} color={cOrange} />
              <Text style={[S.cardTitle, { color: cOrange }]}>
                5. O Dia Ajuda a Noite
              </Text>
            </View>
            <View style={S.bulletRow}>
              <BulletPointIcon size={6} color={cOrange} />
              <Text style={[S.bulletText, { color: cOrange }]}><Text style={S.bulletBold}>Luz do Sol:</Text> Tome 15 minutos de sol logo cedo. Isso avisa o corpo que o dia começou.</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletPointIcon size={6} color={cOrange} />
              <Text style={[S.bulletText, { color: cOrange }]}><Text style={S.bulletBold}>Cansaço bom:</Text> Faça esporte de dia, mas evite no final do dia perto de dormir!</Text>
            </View>
          </View>

          {/* Card 6 – Acalmando o Pensamento */}
          <View style={[S.card, { backgroundColor: bgBlue, borderColor: '#bfdbfe' }]}>
            <View style={[S.cardHeader, { borderBottomColor: '#93c5fd' }]}>
              <HeartPulseIcon size={16} color={cBlue} />
              <Text style={[S.cardTitle, { color: cBlue }]}>
                6. Mente Calma
              </Text>
            </View>
            <Text style={[S.bodyText, { color: cBlue }]}>
              Use a técnica do <Text style={S.bulletBold}>Diário da Preocupação</Text>:
            </Text>
            <View style={[S.highlightPill, { borderColor: '#93c5fd' }]}>
              <Text style={[S.highlightText, { color: cBlue }]}>
                Se o problema martelar, anote no papel e pense: "Vou olhar isso amanhã às 9h". E tire da cabeça!
              </Text>
            </View>
            <View style={S.bulletRow}>
              <BulletPointIcon size={6} color={cBlue} />
              <Text style={[S.bulletText, { color: cBlue }]}>Respire fundo 3 vezes antes de dormir e solte o ar devagar pela boca.</Text>
            </View>
          </View>

          {/* Card 7 – Sinais de Alerta */}
          <View style={[S.card, { backgroundColor: '#fff1f2', borderColor: '#fecaca' }]}>
            <View style={[S.cardHeader, { borderBottomColor: '#fca5a5' }]}>
              <AlertTriangleIcon size={16} color={cRed} />
              <Text style={[S.cardTitle, { color: cRed }]}>
                7. Cuidado com Remédios e Mente Triste
              </Text>
            </View>
            <View style={[S.highlightPill, { borderColor: cRed }]}>
              <Text style={[S.highlightText, { color: cRed }]}>
                NUNCA tome remédios "tarja preta" de outras pessoas. Eles viciam e pioram o sono.
              </Text>
            </View>
            <View style={S.chipRow}>
              {['Isolamento', 'Irritação Forte', 'Falta de Vontade'].map((f) => (
                <View key={f} style={[S.chip, { borderColor: cRed }]}>
                  <Text style={[S.chipText, { color: cRed }]}>{f}</Text>
                </View>
              ))}
            </View>
            <Text style={[S.bodyText, { color: cRed, marginTop: 4, fontWeight: 'bold' }]}>
              Busque a UBS com urgência se sentir os itens acima!
            </Text>
          </View>

          {/* Footer banner */}
          <View style={{ marginTop: 6, backgroundColor: pdfTheme.colors.primaryDark, padding: 8, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MoonIcon size={18} color="#fff" />
            <Text style={{ flex: 1, fontSize: 8, color: '#fff' }}>
              <Text style={{ fontWeight: 'bold' }}>Dormir não é luxo, é remédio!</Text> O cérebro precisa do sono para curar sua saúde.
            </Text>
          </View>
        </View>

      </View>
    </BaseDocument>
  );
};
