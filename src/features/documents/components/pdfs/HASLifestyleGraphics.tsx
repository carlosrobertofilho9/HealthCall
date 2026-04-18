import React from 'react';
import { Svg, Path, Circle, Rect } from '@react-pdf/renderer';

// ⚖️ Peso Saudável
export const ScaleIcon = ({ size = 24, color = '#0f766e' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#ccfbf1" />
    <Path
      d="M12 7v1M8 10h8M9 10l1 4h4l1-4M12 18v-4M9 18h6"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// 🍲 Alimentação
export const FoodIcon = ({ size = 24, color = '#ca8a04' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#fef9c3" />
    <Path
      d="M12 7c-2.76 0-5 1.79-5 4v1h10v-1c0-2.21-2.24-4-5-4zM7 13v1a5 5 0 0 0 10 0v-1H7zM9 7V5M12 7V4M15 7V5"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// 🚶 Atividade Física
export const WalkIcon = ({ size = 24, color = '#1d4ed8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#dbeafe" />
    <Circle cx="12" cy="7" r="1.5" fill={color} />
    <Path
      d="M10 10l1.5 2.5L10 17M14 10l-1.5 2.5L14 17M10.5 12.5h3"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// 🍺 Bebida e Fumo
export const NoSmokingIcon = ({ size = 24, color = '#dc2626' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#fee2e2" />
    <Path
      d="M18 12H6M16 10v4"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M6.34 6.34l11.32 11.32"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

// 🙏 Saúde Mental
export const MindIcon = ({ size = 24, color = '#7c3aed' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#ede9fe" />
    <Path
      d="M12 8c-1.66 0-3 1.34-3 3 0 .9.4 1.7 1.03 2.26L10.5 16h3l.47-2.74C14.6 12.7 15 11.9 15 11c0-1.66-1.34-3-3-3zM10.5 16v1a1.5 1.5 0 0 0 3 0v-1"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// Generic bullet checkmark
export const BulletIcon = ({ size = 10, color = '#059669' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#d1fae5" />
    <Path
      d="M8 12.5l3 3 5-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// Warning/alert bullet
export const AlertBulletIcon = ({ size = 10, color = '#dc2626' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#fee2e2" />
    <Path
      d="M12 8v4M12 16h.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Tip/pro bullet
export const TipBulletIcon = ({ size = 10, color = '#0f766e' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#ccfbf1" />
    <Path
      d="M12 8v4M12 16h.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Salt shaker icon
export const SaltIcon = ({ size = 24, color = '#0891b2' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#cffafe" />
    <Path
      d="M10 4h4v2a4 4 0 0 1 0 8v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-5a4 4 0 0 1 0-8V4zM9 9h6M9 11h6"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// Leaf/nature icon for potassium foods
export const LeafIcon = ({ size = 24, color = '#16a34a' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#dcfce7" />
    <Path
      d="M17 8C17 8 15 6 12 6C9 6 7 9 7 12C7 15 10 17 12 17C14 17 16 15.5 17 14C18 12.5 17 8 17 8ZM12 17L11 20"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);
