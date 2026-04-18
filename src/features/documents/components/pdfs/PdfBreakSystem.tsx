import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfTheme } from './PdfCommon';

export type SectionType = 'critical' | 'standard' | 'list' | 'signature' | 'header' | 'alert' | 'info';

/**
 * Configuração de quebra de página.
 * Valores em *pontos* (pt). Usar valores fracionados (0.5) não funciona bem para minPresenceAhead.
 * 1cm ≈ 28.35pt
 */
export const BREAK_CONFIG = {
  SECTION_HEADER: 40,  // ~1.4cm (Título + margem)
  ALERT_BLOCK: 60,     // ~2.1cm (Bloco de alerta médio)
  INFO_BLOCK: 50,      // ~1.8cm
  LIST_ITEMS: 30,      // ~1cm (Item de lista individual)
  CRITICAL: 100,       // ~3.5cm (Grandes blocos que não devem quebrar)
  DEFAULT: 40,         // Padrão de segurança
  SIGNATURE: 80,       // Espaço para assinatura
} as const;

interface SmartSectionProps {
  type: SectionType;
  children: React.ReactNode;
  style?: any;
  debug?: boolean; // Novo: Mostra bordas para debug visual
}

/**
 * Componente inteligente para gerenciar quebras de página.
 * Usa 'minPresenceAhead' para garantir que títulos não fiquem órfãos no fim da página.
 */
export const SmartSection: React.FC<SmartSectionProps> = ({ type, children, style, debug = false }) => {
  const typeConfig: Record<SectionType, { wrap: boolean; minPresenceAhead?: number }> = {
    critical: { wrap: false }, // Nunca quebra dentro
    signature: { wrap: false, minPresenceAhead: BREAK_CONFIG.SIGNATURE },
    standard: { wrap: true, minPresenceAhead: BREAK_CONFIG.DEFAULT },
    list: { wrap: true, minPresenceAhead: BREAK_CONFIG.LIST_ITEMS },
    header: { wrap: true, minPresenceAhead: BREAK_CONFIG.SECTION_HEADER },
    alert: { wrap: true, minPresenceAhead: BREAK_CONFIG.ALERT_BLOCK },
    info: { wrap: true, minPresenceAhead: BREAK_CONFIG.INFO_BLOCK },
  };
  
  const config = typeConfig[type];

  const debugStyle = debug ? {
    borderWidth: 1,
    borderColor: pdfTheme.colors.danger.strong,
    backgroundColor: pdfTheme.colors.warning.softBg,
    marginBottom: 2
  } : {};
  
  return (
    <View 
      style={[style, debugStyle]} 
      wrap={config.wrap}
      {...(config.wrap && config.minPresenceAhead ? { minPresenceAhead: config.minPresenceAhead } : {})}
    >
      {children}
    </View>
  );
};

interface CriticalSectionProps {
  children: React.ReactNode;
  style?: any;
  forceNewPage?: boolean;
}

/**
 * Seção que NUNCA deve ser quebrada. 
 * Se não couber na página atual, vai inteira para a próxima.
 */
export const CriticalSection: React.FC<CriticalSectionProps> = ({ 
  children, 
  style, 
  forceNewPage = false 
}) => (
  <View style={style} wrap={false} break={forceNewPage}>
    {children}
  </View>
);

interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
}

/**
 * Componente explícito para espaçamento vertical.
 * Evita o uso excessivo de margens arbitrárias nos estilos.
 */
export const Spacer: React.FC<SpacerProps> = ({ size = 'md' }) => {
  const sizes = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 32
  };
  
  const height = typeof size === 'number' ? size : sizes[size];
  
  return <View style={{ height, width: '100%' }} />;
};
