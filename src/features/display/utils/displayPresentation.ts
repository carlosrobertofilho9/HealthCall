import { DISPLAY_DESTINATION_COLOR } from './displayTheme';

export type DisplayDestinationKind =
  | 'triagem'
  | 'medico'
  | 'enfermagem'
  | 'vacina'
  | 'odonto'
  | 'administrativo'
  | 'padrao';

export type DisplayDestinationPresentation = {
  kind: DisplayDestinationKind;
  label: string;
  icon: string;
  eyebrow: string;
  overlayClassName: string;
  accentTextClassName: string;
  accentBgClassName: string;
  borderClassName: string;
};

const PRESENTATIONS: Record<DisplayDestinationKind, DisplayDestinationPresentation> = {
  triagem: {
    kind: 'triagem',
    label: 'Triagem',
    icon: 'emergency',
    eyebrow: 'Atendimento inicial',
    ...DISPLAY_DESTINATION_COLOR.triagem,
  },
  medico: {
    kind: 'medico',
    label: 'Consultório Médico',
    icon: 'medical_services',
    eyebrow: 'Consulta médica',
    ...DISPLAY_DESTINATION_COLOR.medico,
  },
  enfermagem: {
    kind: 'enfermagem',
    label: 'Enfermagem',
    icon: 'clinical_notes',
    eyebrow: 'Atendimento de enfermagem',
    ...DISPLAY_DESTINATION_COLOR.enfermagem,
  },
  vacina: {
    kind: 'vacina',
    label: 'Vacina',
    icon: 'vaccines',
    eyebrow: 'Sala de vacina',
    ...DISPLAY_DESTINATION_COLOR.vacina,
  },
  odonto: {
    kind: 'odonto',
    label: 'Odonto',
    icon: 'dentistry',
    eyebrow: 'Atendimento odontológico',
    ...DISPLAY_DESTINATION_COLOR.odonto,
  },
  administrativo: {
    kind: 'administrativo',
    label: 'Visita/administrativo',
    icon: 'badge',
    eyebrow: 'Setor administrativo',
    ...DISPLAY_DESTINATION_COLOR.administrativo,
  },
  padrao: {
    kind: 'padrao',
    label: 'Destino',
    icon: 'meeting_room',
    eyebrow: 'Destino',
    ...DISPLAY_DESTINATION_COLOR.padrao,
  },
};

function normalizeDestination(destination: string | null | undefined): string {
  return (destination || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function getDestinationPresentation(
  destination: string | null | undefined
): DisplayDestinationPresentation {
  const normalized = normalizeDestination(destination);

  if (!normalized) return PRESENTATIONS.padrao;

  if (normalized.includes('triagem')) return PRESENTATIONS.triagem;
  if (normalized.includes('medic') || normalized.includes('cons. medico')) return PRESENTATIONS.medico;
  if (normalized.includes('enferm')) return PRESENTATIONS.enfermagem;
  if (normalized.includes('vacin') || normalized.includes('vacina') || normalized.includes('imuniz')) {
    return PRESENTATIONS.vacina;
  }
  if (normalized.includes('odonto') || normalized.includes('odont') || normalized.includes('dent')) {
    return PRESENTATIONS.odonto;
  }
  if (
    normalized.includes('visita') ||
    normalized.includes('administr') ||
    normalized.includes('recepc') ||
    normalized.includes('secretar') ||
    /\bacs\b/.test(normalized)
  ) {
    return PRESENTATIONS.administrativo;
  }

  return PRESENTATIONS.padrao;
}
