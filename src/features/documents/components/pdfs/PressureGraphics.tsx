import React from 'react';
import { Svg, Path, Circle, Rect } from '@react-pdf/renderer';

export const InstructionIcon = ({ size = 24, color = "#0f766e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#ccfbf1" />
    <Path 
      d="M12 16v-4 M12 8h.01" 
      stroke={color} 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </Svg>
);

export const CheckmarkIcon = ({ size = 24, color = "#059669" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#d1fae5" />
    <Path 
      d="M8 12.5l3 3 5-6" 
      stroke={color} 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </Svg>
);

export const DropIcon = ({ size = 24, color = "#2563eb" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#dbeafe" />
    <Path 
      d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" 
      stroke={color} 
      strokeWidth={1.5} 
      fill={color}
    />
  </Svg>
);

export const HeartPulseIcon = ({ size = 24, color = "#e11d48" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#ffe4e6" />
    <Path 
      d="M2 12h5l2.5-4 4 10 3-6 2 2h3.5" 
      stroke={color} 
      strokeWidth={1.5} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      fill="none"
    />
  </Svg>
);

export const FlaskIcon = ({ size = 24, color = "#7c3aed" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#ede9fe" />
    <Path 
      d="M9 3h6 M10 3v5l-4 10h12l-4-10V3" 
      stroke={color} 
      strokeWidth={1.5} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      fill="none"
    />
  </Svg>
);

export const WarningLightIcon = ({ size = 24, color = "#ca8a04" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#fef08a" />
    <Path 
      d="M12 8v4 M12 16h.01" 
      stroke={color} 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </Svg>
);

export const NotebookIcon = ({ size = 24, color = "#334155" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#f1f5f9" />
    <Path 
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" 
      stroke={color} 
      strokeWidth={1.5} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      fill="none"
    />
  </Svg>
);
