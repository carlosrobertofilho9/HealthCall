import React from 'react';
import { StyleSheet, Svg, Path, Circle, View, Text } from '@react-pdf/renderer';

// --- Icons (SVG Paths) ---
export const icons = {
  calendar: "M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z M16 2V6 M8 2V6 M3 10H21",
  sun: "M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z M12 1V3 M12 21V23 M4.22 4.22L5.64 5.64 M18.36 18.36L19.78 19.78 M1 12H3 M21 12H23 M4.22 19.78L5.64 18.36 M18.36 5.64L19.78 4.22",
  coffee: "M18 8h1a4 4 0 0 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z M6 1v3 M10 1v3 M14 1v3",
  utensils: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
  clock: "M12 22A10 10 0 0 0 12 2a10 10 0 0 0 0 20z M12 6v6l4 2",
  soup: "M12 21a9 9 0 0 0 9-9h-2a7 7 0 0 1-7 7 7 7 0 0 1-7-7H3a9 9 0 0 0 9 9z M12 6v6 M12 3v0",
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  bed: "M2 4v16 M2 8h18a2 2 0 0 1 2 2v10 M2 17h20 M6 8v9",
  clipboard: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 2h6v4H9z",
  heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  scissors: "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M20 4L8.12 15.88 M14.47 14.48L20 20 M8.12 8.12L12 12",
  syringe: "M18 2l4 4 M17 7l3-3 M2 22l4-4 M15 5L5 15l4 4L19 9z M12 8l4 4",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  ruler: "M16 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z M6 6h4 M6 10h2 M6 14h4 M6 18h2",
  droplet: "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z",
  fileText: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  checkCircle: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3",
  alertTriangle: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  ear: "M6 8.5a6.5 6.5 0 0 1 13 0c0 6-6 6-6 10.5 M17 18.5a2 2 0 0 1-4 0",
};

export const HeaderIcon = ({ icon, color = "#0f766e" }: { icon: keyof typeof icons, color?: string }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24">
    <Path d={icons[icon]} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Ícone de saúde grande para o header
const HealthLogo = () => (
  <Svg width={36} height={36} viewBox="0 0 40 40">
    {/* Círculo de fundo */}
    <Circle cx="20" cy="20" r="19" fill="#0d9488" stroke="#0f766e" strokeWidth={1} />
    {/* Cruz médica */}
    <Path d="M15 12h10v6h6v10h-6v6H15v-6H9V18h6z" fill="#ffffff" />
    {/* Batimento cardíaco */}
    <Path d="M9 23h4l2-4 3 8 2-4h4" stroke="#0d9488" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const commonStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  // --- Header Banner ---
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  headerLogo: {
    marginRight: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerPsfName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerUbs: {
    fontSize: 9,
    color: '#99f6e4',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  headerBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  headerBadgeSub: {
    fontSize: 5,
    color: '#64748b',
    marginTop: 1,
  },
  // --- Accent line under header ---
  accentLine: {
    height: 3,
    borderRadius: 2,
    marginBottom: 10,
    flexDirection: 'row',
  },
  // --- Document Title ---
  mainTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  mainTitleLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  mainTitleText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f766e',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 10,
  },
  // --- Patient Info ---
  patientInfoCard: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  patientInfoItem: {
    fontSize: 10,
    color: '#334155',
  },
  patientInfoLabel: {
    fontSize: 7,
    color: '#94a3b8',
    marginBottom: 1,
  },
  // --- Footer ---
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    gap: 6,
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
  footerBrand: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  footerDot: {
    fontSize: 7,
    color: '#cbd5e1',
  },
});

export const tableStyles = StyleSheet.create({
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    height: 24,
    alignItems: 'center',
  },
  col: {
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastCol: {
    borderRightWidth: 0,
  },
  cellText: {
    fontSize: 9,
    color: '#334155',
  },
});

interface BaseDocumentProps {
  title: string;
  visibleParagraphs: string[];
  children: React.ReactNode;
  orientation?: 'portrait' | 'landscape';
  showFooter?: boolean;
}

export const BaseDocument: React.FC<BaseDocumentProps> = ({ 
  title, 
  visibleParagraphs, 
  children, 
  showFooter = true,
}) => (
  <View style={{ flex: 1 }}>
    {/* Header Banner */}
    <View style={commonStyles.headerBanner}>
      <View style={commonStyles.headerLogo}>
        <HealthLogo />
      </View>
      <View style={commonStyles.headerTextGroup}>
        <Text style={commonStyles.headerPsfName}>PSF 5 Maria Lucia da Silva</Text>
        <Text style={commonStyles.headerUbs}>Unidade Básica de Saúde • Atenção Primária</Text>
      </View>
      <View style={commonStyles.headerBadge}>
        <Text style={commonStyles.headerBadgeText}>SUS</Text>
        <Text style={commonStyles.headerBadgeSub}>Sistema Único de Saúde</Text>
      </View>
    </View>

    {/* Accent gradient line */}
    <View style={commonStyles.accentLine}>
      <View style={{ flex: 2, backgroundColor: '#0d9488', borderRadius: 2 }} />
      <View style={{ flex: 1, backgroundColor: '#14b8a6', marginLeft: 2, borderRadius: 2 }} />
      <View style={{ flex: 1, backgroundColor: '#5eead4', marginLeft: 2, borderRadius: 2 }} />
      <View style={{ flex: 3, backgroundColor: '#99f6e4', marginLeft: 2, borderRadius: 2 }} />
    </View>

    {/* Patient Info Card */}
    {visibleParagraphs.length > 0 && (
      <View style={commonStyles.patientInfoCard}>
        {visibleParagraphs.map((para, index) => {
          const parts = para.split(':');
          const hasLabel = parts.length > 1;
          return (
            <View key={index}>
              {hasLabel && (
                <Text style={commonStyles.patientInfoLabel}>{parts[0].trim()}</Text>
              )}
              <Text style={commonStyles.patientInfoItem}>
                {hasLabel ? parts.slice(1).join(':').trim() : para}
              </Text>
            </View>
          );
        })}
      </View>
    )}

    {/* Document Title with decorative lines */}
    <View style={commonStyles.mainTitleContainer}>
      <View style={commonStyles.mainTitleLine} />
      <Text style={commonStyles.mainTitleText}>{title}</Text>
      <View style={commonStyles.mainTitleLine} />
    </View>

    {/* Content */}
    <View>{children}</View>

    {/* Footer */}
    {showFooter && (
      <View style={commonStyles.footer}>
        <Text style={commonStyles.footerText}>
          Impresso em {new Date().toLocaleDateString('pt-BR')}
        </Text>
        <Text style={commonStyles.footerDot}>•</Text>
        <Text style={commonStyles.footerBrand}>HealthCall</Text>
        <Text style={commonStyles.footerDot}>•</Text>
        <Text style={commonStyles.footerText}>Documento gerado eletronicamente</Text>
      </View>
    )}
  </View>
);
