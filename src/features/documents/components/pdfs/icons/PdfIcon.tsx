import React from 'react';
import {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Svg,
} from '@react-pdf/renderer';
import { pdfIconNodes, type PdfIconName } from './lucideIconNodes.generated';
import type { PdfIconElementAttributes, PdfIconElementName, PdfIconProps } from './types';

type StrictPdfIconProps = PdfIconProps<PdfIconName>;

export const SUPPORTED_PDF_ICON_ELEMENTS = [
  'circle',
  'ellipse',
  'g',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
] as const satisfies readonly PdfIconElementName[];

const ELEMENT_COMPONENTS: Record<PdfIconElementName, React.ComponentType<any>> = {
  circle: Circle,
  ellipse: Ellipse,
  g: G,
  line: Line,
  path: Path,
  polygon: Polygon,
  polyline: Polyline,
  rect: Rect,
};

const SVG_ATTR_ALIASES: Record<string, string> = {
  'clip-rule': 'clipRule',
  'fill-rule': 'fillRule',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-width': 'strokeWidth',
};

const normalizeSvgAttributes = (attributes: PdfIconElementAttributes) =>
  Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [SVG_ATTR_ALIASES[key] ?? key, value])
  );

export const isSupportedPdfIconElement = (elementName: string): elementName is PdfIconElementName =>
  SUPPORTED_PDF_ICON_ELEMENTS.includes(elementName as PdfIconElementName);

export const renderPdfIconNodes = ({
  name,
  color = '#000000',
  fill = 'none',
  strokeWidth = 2,
}: Omit<StrictPdfIconProps, 'size' | 'style'>) => {
  const iconNode = pdfIconNodes[name];

  if (!iconNode) {
    throw new Error(`Unknown PDF icon: ${name}`);
  }

  return iconNode.map(([elementName, attributes], index) => {
    if (!isSupportedPdfIconElement(elementName)) {
      throw new Error(`Unsupported PDF icon element "${elementName}" in "${name}"`);
    }

    const Component = ELEMENT_COMPONENTS[elementName];
    const normalizedAttributes = normalizeSvgAttributes(attributes);

    return (
      <Component
        key={`${name}-${elementName}-${index}`}
        fill={fill}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...normalizedAttributes}
      />
    );
  });
};

export const PdfIcon = ({
  name,
  size = 24,
  color = '#000000',
  fill = 'none',
  strokeWidth = 2,
  style,
}: StrictPdfIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    {renderPdfIconNodes({ name, color, fill, strokeWidth })}
  </Svg>
);
