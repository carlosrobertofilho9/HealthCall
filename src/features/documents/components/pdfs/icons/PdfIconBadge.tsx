import React from 'react';
import { Circle, G, Svg } from '@react-pdf/renderer';
import { renderPdfIconNodes } from './PdfIcon';
import type { PdfIconName } from './lucideIconNodes.generated';
import type { PdfIconBadgeProps } from './types';

type StrictPdfIconBadgeProps = PdfIconBadgeProps<PdfIconName>;

export const PdfIconBadge = ({
  name,
  size = 24,
  iconSize,
  color = '#000000',
  fill = 'none',
  strokeWidth = 2,
  backgroundColor = '#ffffff',
  borderColor,
  style,
}: StrictPdfIconBadgeProps) => {
  const scale = iconSize ? iconSize / size : 1;
  const offset = (24 - 24 * scale) / 2;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Circle
        cx="12"
        cy="12"
        r="10"
        fill={backgroundColor}
        stroke={borderColor ?? backgroundColor}
        strokeWidth={1}
      />
      <G transform={iconSize ? `translate(${offset} ${offset}) scale(${scale})` : undefined}>
        {renderPdfIconNodes({ name, color, fill, strokeWidth })}
      </G>
    </Svg>
  );
};
