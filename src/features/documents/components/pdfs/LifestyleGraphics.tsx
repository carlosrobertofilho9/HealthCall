import React from 'react';
import { Svg, Path, Circle } from '@react-pdf/renderer';

// 🩸 Glicemia / Diabetes
export const BloodSugarIcon = ({ size = 24, color = '#b91c1c' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#fee2e2" />
    <Path
      d="M12 7c-1.5 2.5-3 4-3 6.5s1.34 4.5 3 4.5 3-2 3-4.5S13.5 9.5 12 7z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// 👣 Cuidado com os Pés
export const FootIcon = ({ size = 24, color = '#0f766e' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#ccfbf1" />
    <Path
      d="M12 8c2.2 0 4 1.8 4 4v3a1 1 0 0 1-1 1h-2v1a1 1 0 0 1-2 0v-1H9a1 1 0 0 1-1-1v-3c0-2.2 1.8-4 4-4z"
      stroke={color}
      strokeWidth={1.5}
      fill="none"
    />
  </Svg>
);

// 🥐 Gorduras / Colesterol
export const CholesterolIcon = ({ size = 24, color = '#ca8a04' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#fef9c3" />
    <Path
      d="M8 11s1-2 4-2 4 2 4 2v4s-1 2-4 2-4-2-4-2v-4zM12 9V7M8 12H6M18 12h-2"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// 😴 Sono / Lua
export const SleepIcon = ({ size = 24, color = '#1e3a8a' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#dbeafe" />
    <Path
      d="M12 7a5 5 0 0 0 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 0 5-5z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// 🍎 Frutas e Fibras
export const FiberIcon = ({ size = 24, color = '#16a34a' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#dcfce7" />
    <Path
      d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 7V5M14 6l-1-1M10 6l1-1"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);
