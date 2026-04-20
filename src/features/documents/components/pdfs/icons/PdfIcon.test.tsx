import React from 'react';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, Page, renderToString, View } from '@react-pdf/renderer';
import { describe, expect, it } from 'vitest';
import { HeaderIcon } from '../PdfCommon';
import {
  PdfIcon,
  PdfIconBadge,
  SUPPORTED_PDF_ICON_ELEMENTS,
  pdfIconNames,
  pdfIconNodes,
} from './index';

const expectedPdfIconNames = [
  'activity',
  'alarm-clock',
  'alert-triangle',
  'alertTriangle',
  'badge-check',
  'bandage',
  'bed',
  'brain',
  'calculator',
  'calendar',
  'chart-no-axes-combined',
  'chart-spline',
  'check',
  'checkCircle',
  'cigarette-off',
  'circle',
  'circle-alert',
  'circle-check',
  'clipboard',
  'clipboard-check',
  'clipboard-list',
  'clipboard-plus',
  'clock',
  'coffee',
  'croissant',
  'droplet',
  'droplets',
  'ear',
  'eye-off',
  'file-text',
  'fileText',
  'flask-conical',
  'footprints',
  'gauge',
  'hand',
  'hand-heart',
  'heart',
  'heart-handshake',
  'heart-pulse',
  'info',
  'leaf',
  'list-checks',
  'map',
  'message-circle-warning',
  'monitor-check',
  'moon',
  'notebook',
  'pill',
  'ruler',
  'scale',
  'scissors',
  'scan-heart',
  'shield',
  'siren',
  'sofa',
  'soup',
  'sparkles',
  'stethoscope',
  'sun',
  'syringe',
  'test-tube',
  'test-tube-diagonal',
  'timer',
  'triangle-alert',
  'utensils',
  'waves',
  'waypoints',
  'weight',
  'wind',
  'zap',
] as const;

const currentFile = fileURLToPath(import.meta.url);
const pdfsDir = resolve(dirname(currentFile), '..');

const collectSourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    if (entry.name.includes('.test.')) return [];
    if (/\.(ts|tsx)$/.test(entry.name)) return [entryPath];
    return [];
  });

describe('PDF icon system', () => {
  it('gera todos os ícones esperados', () => {
    expect([...pdfIconNames].sort()).toEqual([...expectedPdfIconNames].sort());
  });

  it('usa apenas elementos SVG suportados pelo renderer de PDF', () => {
    const supportedElements = new Set<string>(SUPPORTED_PDF_ICON_ELEMENTS);
    const generatedElements = Object.values(pdfIconNodes).flatMap((node) =>
      node.map(([elementName]) => elementName)
    );

    expect(generatedElements.length).toBeGreaterThan(0);
    expect(generatedElements.every((elementName) => supportedElements.has(elementName))).toBe(true);
  });

  it('renderiza PdfIcon, PdfIconBadge e HeaderIcon em um documento real', async () => {
    const pdf = await renderToString(
      <Document>
        <Page>
          <View>
            <PdfIcon name="calendar" size={12} color="#0f766e" />
            <PdfIconBadge name="heart-pulse" size={18} color="#dc2626" backgroundColor="#fef2f2" />
            <HeaderIcon icon="checkCircle" color="#059669" />
          </View>
        </Page>
      </Document>
    );

    expect(pdf).toContain('%PDF');
  });

  it('não importa lucide-react dentro dos PDFs', () => {
    const pdfSourceFiles = collectSourceFiles(pdfsDir);
    const offendingFiles = pdfSourceFiles.filter((filePath) =>
      readFileSync(filePath, 'utf8').includes('lucide-react')
    );

    expect(offendingFiles).toEqual([]);
  });
});
