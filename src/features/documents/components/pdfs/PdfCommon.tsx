import React from 'react';
import { StyleSheet, Svg, Path, View, Text } from '@react-pdf/renderer';
import type { DocumentFormData } from '../DocumentPdf';
import { formatCPF, formatCNS } from '@/lib/utils';
import { PdfIcon, type PdfIconName } from './icons';

// --- 1. Design System Theme ---
export const pdfTheme = {
  colors: {
    primary: '#0f766e',
    primaryDark: '#0d9488',
    secondary: '#14b8a6',
    tertiary: '#5eead4',
    softBg: '#99f6e4',
    text: {
      main: '#334155',
      dark: '#1e293b',
      muted: '#475569',
      secondary: '#64748b',
      light: '#94a3b8',
      white: '#ffffff',
      accent: '#99f6e4'
    },
    border: '#e2e8f0',
    borderDark: '#cbd5e1',
    bgLight: '#f8fafc',
    info: {
      bg: '#eff6ff',
      bgStrong: '#dbeafe',
      border: '#bfdbfe',
      borderStrong: '#93c5fd',
      text: '#1e40af',
      strong: '#0369a1',
    },
    success: {
      softBg: '#ecfdf5',
      bg: '#dcfce7',
      bgStrong: '#d1fae5',
      border: '#86efac',
      borderStrong: '#6ee7b7',
      text: '#166534',
      strong: '#059669',
      dark: '#047857',
    },
    warning: {
      softBg: '#fffbeb',
      bg: '#fefce8',
      border: '#fde68a',
      text: '#92400e',
      strong: '#ca8a04',
      dark: '#78350f',
    },
    danger: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#991b1b',
      strong: '#dc2626',
      dark: '#7f1d1d',
    },
    neutral: {
      bg: '#fafafa',
    },
    purple: {
      bg: '#f5f3ff',
      bgSoft: '#faf8ff',
      border: '#ddd6fe',
      text: '#7c3aed',
      textDark: '#5b21b6',
      icon: '#6d28d9',
      iconDark: '#4c1d95',
      strong: '#7c3aed',
    },
    period: {
      morning: '#f59e0b',
      morningIcon: '#d97706',
      morningText: '#b45309',
      morningSoft: '#fffbeb',
      morningAlt: '#fffef5',
      afternoon: '#ea580c',
      afternoonText: '#c2410c',
      afternoonDark: '#9a3412',
      afternoonSoft: '#fff7ed',
      afternoonAlt: '#fffcf5',
      lunch: '#0ea5e9',
      lunchText: '#0c4a6e',
      lunchSoft: '#f0f9ff',
      lunchAlt: '#f5fbff',
      night: '#4f46e5',
      nightText: '#4338ca',
      nightDark: '#3730a3',
      nightSoft: '#eef2ff',
      nightAlt: '#f5f5ff',
    },
    exam: {
      yellowBg: '#fef3c7',
      yellow: '#fbbf24',
      orangeBg: '#ffedd5',
      orange: '#f97316',
      redBg: '#fee2e2',
      red: '#ef4444',
      indigoBg: '#e0e7ff',
      indigo: '#6366f1',
      indigoDark: '#4f46e5',
      green: '#10b981',
      magentaBg: '#fae8ff',
      magenta: '#c026d3',
      tealBg: '#ccfbf1',
      teal: '#14b8a6',
      roseBg: '#ffe4e6',
      rose: '#e11d48',
    },
    lifestyle: {
      foodBg: '#fef9c3',
      foodBorder: '#fde047',
      foodText: '#713f12',
      positiveBg: '#f0fdf4',
      positiveBorder: '#bbf7d0',
      positiveText: '#15803d',
      activityText: '#1d4ed8',
      cyanText: '#0891b2',
    },
  },
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
    xxl: 25
  },
  fontSize: {
    xxs: 5,
    xs: 7,
    sm: 9,
    base: 10,
    lg: 13,
    xl: 18
  }
};

// --- 2. Typography Components ---

export const DocTitle: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <Text style={[{ 
    fontSize: pdfTheme.fontSize.lg, 
    fontWeight: 'bold', 
    color: pdfTheme.colors.primary, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  }, style]}>
    {children}
  </Text>
);

export const DocLabel: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <Text style={[{ 
    fontSize: pdfTheme.fontSize.xs, 
    color: pdfTheme.colors.text.light, 
    marginBottom: pdfTheme.spacing.xs 
  }, style]}>
    {children}
  </Text>
);

export const DocValue: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <Text style={[{ 
    fontSize: pdfTheme.fontSize.sm, 
    color: pdfTheme.colors.text.main 
  }, style]}>
    {children}
  </Text>
);

export const DocText: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <Text style={[{ 
    fontSize: pdfTheme.fontSize.base, 
    color: pdfTheme.colors.text.main,
    lineHeight: 1.4
  }, style]}>
    {children}
  </Text>
);

// --- 3. Helpers & Utilities ---

export const FieldValue: React.FC<{
  value?: string;
  fallback?: string;
  style?: object;
}> = ({ value, fallback = '', style }) => (
  <DocValue style={style}>
    {value || fallback}
  </DocValue>
);

export const formatDate = (value?: string, fallback = '___/___/______'): string => {
  if (!value) return fallback;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return value;
};

export { type DocumentFormData };

// --- 4. Icons ---

export const HeaderIcon = ({ icon, color = pdfTheme.colors.primary }: { icon: PdfIconName, color?: string }) => (
  <PdfIcon name={icon} size={12} color={color} />
);

export const HealthLogo = () => (
  <Svg width={36} height={36} viewBox="0 0 40 40">
    <Path d="M7 16v-3a6 6 0 0 1 6-6h5" stroke="#00A8A8" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 7h5a6 6 0 0 1 6 6v3" stroke="#00A8A8" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 24v3a6 6 0 0 0 6 6h5" stroke="#1466F5" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 33h5a6 6 0 0 0 6-6v-3" stroke="#1466F5" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13 12h5v7h4v-7h5v16h-5v-7h-4v7h-5z" fill="#001B3D" />
  </Svg>
);

// --- 5. Structural Components ---

export const PageHeader = ({ unitName = "PSF 5 Maria Lucia da Silva" }: { unitName?: string }) => (
  <View>
    <View style={commonStyles.headerBanner}>
      <View style={commonStyles.headerLogo}>
        <HealthLogo />
      </View>
      <View style={commonStyles.headerTextGroup}>
        <Text style={commonStyles.headerPsfName}>{unitName}</Text>
        <Text style={commonStyles.headerUbs}>Unidade Básica de Saúde • Atenção Primária</Text>
      </View>
      <View style={commonStyles.headerBadge}>
        <Text style={commonStyles.headerBadgeText}>SUS</Text>
        <Text style={commonStyles.headerBadgeSub}>Sistema Único de Saúde</Text>
      </View>
    </View>

    {/* Accent Gradient Line */}
    <View style={commonStyles.accentLine}>
      <View style={{ flex: 2, backgroundColor: pdfTheme.colors.primaryDark, borderRadius: 2 }} />
      <View style={{ flex: 1, backgroundColor: pdfTheme.colors.secondary, marginLeft: 2, borderRadius: 2 }} />
      <View style={{ flex: 1, backgroundColor: pdfTheme.colors.tertiary, marginLeft: 2, borderRadius: 2 }} />
      <View style={{ flex: 3, backgroundColor: pdfTheme.colors.softBg, marginLeft: 2, borderRadius: 2 }} />
    </View>
  </View>
);

export const PatientInfoBar = ({ nome, cns }: { nome?: string, cns?: string }) => {
  const formatDocument = (doc?: string) => {
    if (!doc) return '';
    const digits = doc.replace(/\D/g, '');
    if (digits.length === 11) return formatCPF(doc);
    if (digits.length === 15) return formatCNS(doc);
    return doc;
  };

  return (
    <View style={commonStyles.patientInfoCard}>
      <View style={{ flex: 2, minWidth: 200 }}>
        <DocLabel style={commonStyles.patientInfoLabelEmphasis}>Nome do Paciente</DocLabel>
        <View style={commonStyles.patientInfoValueLine}>
          <DocValue style={commonStyles.patientInfoValueName}>{nome || ''}</DocValue>
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 120 }}>
        <DocLabel style={commonStyles.patientInfoLabelEmphasis}>CNS ou CPF</DocLabel>
        <View style={commonStyles.patientInfoValueLine}>
          <DocValue style={commonStyles.patientInfoValueDocument}>{formatDocument(cns)}</DocValue>
        </View>
      </View>
    </View>
  );
};

export const PageFooter = () => (
  <View style={commonStyles.footer}>
    <Text style={commonStyles.footerText}>
      Impresso em {new Date().toLocaleDateString('pt-BR')}
    </Text>
    <Text style={commonStyles.footerDot}>•</Text>
    <Text style={commonStyles.footerBrand}>HealthCall</Text>
    <Text style={commonStyles.footerDot}>•</Text>
    <Text style={commonStyles.footerText}>Documento gerado eletronicamente</Text>
  </View>
);

// --- 6. Base Document ---

interface BaseDocumentProps {
  title: string;
  children: React.ReactNode;
  visibleParagraphs?: string[]; // Mantido para compatibilidade, mas opcional
  orientation?: 'portrait' | 'landscape';
  showFooter?: boolean;
  wrap?: boolean;
  nomePaciente?: string;
  cnsCpf?: string;
  hidePatientInfo?: boolean;
  hideHeader?: boolean;
}

export const BaseDocument: React.FC<BaseDocumentProps> = ({ 
  title, 
  children, 
  showFooter = true,
  wrap = true,
  nomePaciente,
  cnsCpf,
  hidePatientInfo = false,
  hideHeader = false,
}) => (
  <View style={[commonStyles.page, { paddingBottom: showFooter ? pdfTheme.spacing.xxl : 0 }]} wrap={wrap}>
    {!hideHeader && <PageHeader />}
    
    {!hidePatientInfo && <PatientInfoBar nome={nomePaciente} cns={cnsCpf} />}

    {/* Document Title */}
    <View style={commonStyles.mainTitleContainer}>
      <View style={commonStyles.mainTitleLine} />
      <DocTitle>{title}</DocTitle>
      <View style={commonStyles.mainTitleLine} />
    </View>

    {/* Main Content */}
    <View style={{ flex: 1, width: '100%' }}>
      {children}
    </View>

    {showFooter && <PageFooter />}
  </View>
);

// --- 7. Styles ---
// Mantendo uma versão atualizada do commonStyles usando o tema
export const commonStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: pdfTheme.colors.text.white,
    padding: pdfTheme.spacing.xl,
    fontFamily: 'Helvetica',
    flex: 1,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: pdfTheme.colors.primary,
    borderRadius: 8,
    padding: pdfTheme.spacing.lg,
    marginBottom: pdfTheme.spacing.lg,
  },
  headerLogo: { marginRight: pdfTheme.spacing.lg },
  headerTextGroup: { flex: 1 },
  headerPsfName: {
    fontSize: pdfTheme.fontSize.xl,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.white,
    letterSpacing: 0.5,
  },
  headerUbs: {
    fontSize: pdfTheme.fontSize.sm,
    color: pdfTheme.colors.text.accent,
    marginTop: pdfTheme.spacing.xs,
    letterSpacing: 0.3,
  },
  headerBadge: {
    backgroundColor: pdfTheme.colors.text.white,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: pdfTheme.fontSize.xs,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
  },
  headerBadgeSub: {
    fontSize: 5,
    color: pdfTheme.colors.text.secondary,
    marginTop: 1,
  },
  accentLine: {
    height: 3,
    marginBottom: 10,
    flexDirection: 'row',
  },
  mainTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: pdfTheme.spacing.lg,
    gap: pdfTheme.spacing.md,
  },
  mainTitleLine: {
    flex: 1,
    height: 1,
    backgroundColor: pdfTheme.colors.borderDark,
  },
  patientInfoCard: {
    marginBottom: pdfTheme.spacing.lg,
    padding: pdfTheme.spacing.md,
    backgroundColor: pdfTheme.colors.bgLight,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  patientInfoLabel: { // Mantido para compatibilidade, mas usar DocLabel preferencialmente
    fontSize: pdfTheme.fontSize.xs,
    color: pdfTheme.colors.text.light,
    marginBottom: 1,
  },
  patientInfoLabelEmphasis: {
    color: pdfTheme.colors.text.secondary,
    fontWeight: 'bold',
  },
  patientInfoValueLine: {
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.borderDark,
    height: 20,
    justifyContent: 'center',
  },
  patientInfoValueName: {
    fontSize: pdfTheme.fontSize.base,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.dark,
  },
  patientInfoValueDocument: {
    fontSize: pdfTheme.fontSize.base,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.dark,
    letterSpacing: 0.8,
  },
  patientInfoItem: { // Mantido para compatibilidade, mas usar DocValue preferencialmente
    fontSize: pdfTheme.fontSize.base,
    color: pdfTheme.colors.text.main,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: pdfTheme.colors.border,
    paddingTop: 6,
    gap: 6,
  },
  footerText: {
    fontSize: pdfTheme.fontSize.xs,
    color: pdfTheme.colors.text.light,
  },
  footerBrand: {
    fontSize: pdfTheme.fontSize.xs,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
  },
  footerDot: {
    fontSize: pdfTheme.fontSize.xs,
    color: pdfTheme.colors.borderDark,
  },
});

export const tableStyles = StyleSheet.create({
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.borderDark,
    height: 24,
    alignItems: 'center',
  },
  col: {
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: pdfTheme.colors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastCol: { borderRightWidth: 0 },
  cellText: {
    fontSize: pdfTheme.fontSize.sm,
    color: pdfTheme.colors.text.main,
  },
});
