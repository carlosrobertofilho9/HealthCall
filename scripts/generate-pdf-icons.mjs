import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = require.resolve('lucide-static/package.json');
const iconNodesPath = require.resolve('lucide-static/icon-nodes.json');

const lucideStaticPackage = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const lucideIconNodes = JSON.parse(readFileSync(iconNodesPath, 'utf8'));

const EXPECTED_LUCIDE_STATIC_VERSION = '1.8.0';

if (lucideStaticPackage.version !== EXPECTED_LUCIDE_STATIC_VERSION) {
  throw new Error(
    `Expected lucide-static@${EXPECTED_LUCIDE_STATIC_VERSION}, found ${lucideStaticPackage.version}. ` +
      'Update the generator version check with the dependency upgrade.'
  );
}

const iconSources = [
  ['activity', 'activity'],
  ['alarm-clock', 'alarm-clock'],
  ['alert-triangle', 'triangle-alert'],
  ['alertTriangle', 'triangle-alert'],
  ['badge-check', 'badge-check'],
  ['bandage', 'bandage'],
  ['bed', 'bed'],
  ['brain', 'brain'],
  ['calculator', 'calculator'],
  ['calendar', 'calendar'],
  ['chart-no-axes-combined', 'chart-no-axes-combined'],
  ['chart-spline', 'chart-spline'],
  ['check', 'check'],
  ['checkCircle', 'circle-check'],
  ['cigarette-off', 'cigarette-off'],
  ['circle', 'circle'],
  ['circle-alert', 'circle-alert'],
  ['circle-check', 'circle-check'],
  ['clipboard', 'clipboard'],
  ['clipboard-check', 'clipboard-check'],
  ['clipboard-list', 'clipboard-list'],
  ['clipboard-plus', 'clipboard-plus'],
  ['clock', 'clock'],
  ['coffee', 'coffee'],
  ['croissant', 'croissant'],
  ['droplet', 'droplet'],
  ['droplets', 'droplets'],
  ['ear', 'ear'],
  ['eye-off', 'eye-off'],
  ['file-text', 'file-text'],
  ['fileText', 'file-text'],
  ['flask-conical', 'flask-conical'],
  ['footprints', 'footprints'],
  ['gauge', 'gauge'],
  ['hand', 'hand'],
  ['hand-heart', 'hand-heart'],
  ['heart', 'heart'],
  ['heart-handshake', 'heart-handshake'],
  ['heart-pulse', 'heart-pulse'],
  ['info', 'info'],
  ['leaf', 'leaf'],
  ['list-checks', 'list-checks'],
  ['map', 'map'],
  ['message-circle-warning', 'message-circle-warning'],
  ['monitor-check', 'monitor-check'],
  ['moon', 'moon'],
  ['notebook', 'notebook'],
  ['pill', 'pill'],
  ['ruler', 'ruler'],
  ['scale', 'scale'],
  ['scissors', 'scissors'],
  ['scan-heart', 'scan-heart'],
  ['shield', 'shield'],
  ['siren', 'siren'],
  ['sofa', 'sofa'],
  ['soup', 'soup'],
  ['sparkles', 'sparkles'],
  ['stethoscope', 'stethoscope'],
  ['sun', 'sun'],
  ['syringe', 'syringe'],
  ['test-tube', 'test-tube'],
  ['test-tube-diagonal', 'test-tube-diagonal'],
  ['timer', 'timer'],
  ['triangle-alert', 'triangle-alert'],
  ['utensils', 'utensils'],
  ['waves', 'waves'],
  ['waypoints', 'waypoints'],
  ['weight', 'weight'],
  ['wind', 'wind'],
  ['zap', 'zap'],
];

const duplicatePublicNames = iconSources
  .map(([publicName]) => publicName)
  .filter((publicName, index, names) => names.indexOf(publicName) !== index);

if (duplicatePublicNames.length > 0) {
  throw new Error(`Duplicate PDF icon public names: ${duplicatePublicNames.join(', ')}`);
}

const missingIcons = iconSources
  .filter(([, sourceName]) => !lucideIconNodes[sourceName])
  .map(([publicName, sourceName]) => `${publicName} -> ${sourceName}`);

if (missingIcons.length > 0) {
  throw new Error(`Missing lucide-static icon nodes:\n${missingIcons.join('\n')}`);
}

const generatedIconNodes = Object.fromEntries(
  [...iconSources]
    .sort(([leftName], [rightName]) => leftName.localeCompare(rightName))
    .map(([publicName, sourceName]) => [publicName, lucideIconNodes[sourceName]])
);

const outputPath = resolve(
  repoRoot,
  'src/features/documents/components/pdfs/icons/lucideIconNodes.generated.ts'
);

const output = `import type { PdfIconNode } from './types';

export const pdfIconNodes = ${JSON.stringify(generatedIconNodes, null, 2)} as const satisfies Record<string, PdfIconNode>;

export type PdfIconName = keyof typeof pdfIconNodes;

export const pdfIconNames = Object.keys(pdfIconNodes) as PdfIconName[];
`;

writeFileSync(outputPath, output);
