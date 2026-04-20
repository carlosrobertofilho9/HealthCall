export type BodyDiagramSide = 'front' | 'back';

export interface BodySubregion {
  key: string;
  label: string;
  code: string;
}

export interface BodyRegion {
  key: string;
  label: string;
  side: BodyDiagramSide;
  subregions: BodySubregion[];
}

export const BODY_DIAGRAM_REGIONS: BodyRegion[] = [
  {
    key: 'head',
    label: 'Cabeça',
    side: 'front',
    subregions: [
      { key: 'frontal', label: 'Frontal', code: 'Frontal' },
      { key: 'parietal_d', label: 'Parietal Direito', code: 'ParietalD' },
      { key: 'parietal_e', label: 'Parietal Esquerdo', code: 'ParietalE' },
    ],
  },
  {
    key: 'neck',
    label: 'Pescoço',
    side: 'front',
    subregions: [
      { key: 'cervical_ant', label: 'Região Cervical Anterior', code: 'CervicalAnt' },
      { key: 'cervical_lat_d', label: 'Cervical Lateral Direita', code: 'CervicalLatD' },
      { key: 'cervical_lat_e', label: 'Cervical Lateral Esquerda', code: 'CervicalLatE' },
    ],
  },
  {
    key: 'thorax',
    label: 'Tórax',
    side: 'front',
    subregions: [
      { key: 'torax_d', label: 'Hemitórax Direito', code: 'ToraxD' },
      { key: 'torax_e', label: 'Hemitórax Esquerdo', code: 'ToraxE' },
      { key: 'esternal', label: 'Região Esternal', code: 'Esternal' },
    ],
  },
  {
    key: 'abdomen',
    label: 'Abdômen',
    side: 'front',
    subregions: [
      { key: 'quadrante_sup_d', label: 'Quadrante Superior Direito', code: 'QSD' },
      { key: 'quadrante_sup_e', label: 'Quadrante Superior Esquerdo', code: 'QSE' },
      { key: 'quadrante_inf_d', label: 'Quadrante Inferior Direito', code: 'QID' },
      { key: 'quadrante_inf_e', label: 'Quadrante Inferior Esquerdo', code: 'QIE' },
    ],
  },
  {
    key: 'upper_right',
    label: 'Membro Superior Direito',
    side: 'front',
    subregions: [
      { key: 'braco_d', label: 'Braço Direito', code: 'BracoD' },
      { key: 'antebraco_d', label: 'Antebraço Direito', code: 'AntebracoD' },
      { key: 'mao_d', label: 'Mão Direita', code: 'MaoD' },
    ],
  },
  {
    key: 'upper_left',
    label: 'Membro Superior Esquerdo',
    side: 'front',
    subregions: [
      { key: 'braco_e', label: 'Braço Esquerdo', code: 'BracoE' },
      { key: 'antebraco_e', label: 'Antebraço Esquerdo', code: 'AntebracoE' },
      { key: 'mao_e', label: 'Mão Esquerda', code: 'MaoE' },
    ],
  },
  {
    key: 'lower_right',
    label: 'Membro Inferior Direito',
    side: 'front',
    subregions: [
      { key: 'coxa_d', label: 'Coxa Direita', code: 'CoxaD' },
      { key: 'perna_d', label: 'Perna Direita', code: 'PernaD' },
      { key: 'maleolo_d', label: 'Maléolo Direito', code: 'MaleoloLD' },
      { key: 'pe_d', label: 'Pé Direito', code: 'PeD' },
    ],
  },
  {
    key: 'lower_left',
    label: 'Membro Inferior Esquerdo',
    side: 'front',
    subregions: [
      { key: 'coxa_e', label: 'Coxa Esquerda', code: 'CoxaE' },
      { key: 'perna_e', label: 'Perna Esquerda', code: 'PernaE' },
      { key: 'maleolo_e', label: 'Maléolo Esquerdo', code: 'MaleoloLE' },
      { key: 'pe_e', label: 'Pé Esquerdo', code: 'PeE' },
    ],
  },
  {
    key: 'back_thorax',
    label: 'Dorso',
    side: 'back',
    subregions: [
      { key: 'escapular_d', label: 'Escapular Direita', code: 'EscapularD' },
      { key: 'escapular_e', label: 'Escapular Esquerda', code: 'EscapularE' },
      { key: 'lombar', label: 'Lombar', code: 'Lombar' },
      { key: 'sacral', label: 'Sacral', code: 'Sacral' },
    ],
  },
];

export function getRegionByKey(regionKey: string): BodyRegion | undefined {
  return BODY_DIAGRAM_REGIONS.find((region) => region.key === regionKey);
}

export function getSubregionByCode(code: string): { region: BodyRegion; subregion: BodySubregion } | null {
  for (const region of BODY_DIAGRAM_REGIONS) {
    const subregion = region.subregions.find((item) => item.code === code);
    if (subregion) return { region, subregion };
  }

  return null;
}

export function buildAnatomicalCode(regionKey: string, subregionKey: string): string {
  const region = getRegionByKey(regionKey);
  if (!region) return '';

  const subregion = region.subregions.find((item) => item.key === subregionKey);
  return subregion?.code ?? '';
}

export function getBodyDiagramHistoryCodes(codes: string[]): Array<{ code: string; label: string }> {
  return codes
    .map((code) => {
      const parsed = getSubregionByCode(code);
      if (!parsed) return { code, label: code };
      return {
        code,
        label: `${parsed.region.label} • ${parsed.subregion.label}`,
      };
    })
    .filter((item, index, arr) => arr.findIndex((other) => other.code === item.code) === index);
}
