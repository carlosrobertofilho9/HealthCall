import type React from 'react';

export type PdfIconElementName =
  | 'circle'
  | 'ellipse'
  | 'g'
  | 'line'
  | 'path'
  | 'polygon'
  | 'polyline'
  | 'rect';

export type PdfIconElementAttributes = Readonly<Record<string, string>>;

export type PdfIconNode = readonly (readonly [
  PdfIconElementName,
  PdfIconElementAttributes,
])[];

export interface PdfIconProps<TName extends string = string> {
  name: TName;
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
  style?: React.ComponentProps<any>['style'];
}

export interface PdfIconBadgeProps<TName extends string = string> extends PdfIconProps<TName> {
  backgroundColor?: string;
  iconSize?: number;
  borderColor?: string;
}
