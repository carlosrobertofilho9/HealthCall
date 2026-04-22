import {
  Badge,
  ClipboardPlus,
  MapPin,
  ShieldCheck,
  SmilePlus,
  Stethoscope,
  Syringe,
  type LucideIcon,
} from 'lucide-react';
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
  Icon: LucideIcon;
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
    Icon: ShieldCheck,
    eyebrow: 'Atendimento inicial',
    ...DISPLAY_DESTINATION_COLOR.triagem,
  },
  medico: {
    kind: 'medico',
    label: 'Consultório Médico',
    Icon: Stethoscope,
    eyebrow: 'Consulta médica',
    ...DISPLAY_DESTINATION_COLOR.medico,
  },
  enfermagem: {
    kind: 'enfermagem',
    label: 'Enfermagem',
    Icon: ClipboardPlus,
    eyebrow: 'Atendimento de enfermagem',
    ...DISPLAY_DESTINATION_COLOR.enfermagem,
  },
  vacina: {
    kind: 'vacina',
    label: 'Vacina',
    Icon: Syringe,
    eyebrow: 'Sala de vacina',
    ...DISPLAY_DESTINATION_COLOR.vacina,
  },
  odonto: {
    kind: 'odonto',
    label: 'Odonto',
    Icon: SmilePlus,
    eyebrow: 'Atendimento odontológico',
    ...DISPLAY_DESTINATION_COLOR.odonto,
  },
  administrativo: {
    kind: 'administrativo',
    label: 'Visita/administrativo',
    Icon: Badge,
    eyebrow: 'Setor administrativo',
    ...DISPLAY_DESTINATION_COLOR.administrativo,
  },
  padrao: {
    kind: 'padrao',
    label: 'Destino',
    Icon: MapPin,
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
