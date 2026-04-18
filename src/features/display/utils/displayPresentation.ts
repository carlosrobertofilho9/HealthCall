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
    overlayClassName: 'bg-amber-950/95',
    accentTextClassName: 'text-amber-300',
    accentBgClassName: 'bg-amber-500/15',
    borderClassName: 'border-amber-300/50',
  },
  medico: {
    kind: 'medico',
    label: 'Consultório Médico',
    icon: 'medical_services',
    eyebrow: 'Consulta médica',
    overlayClassName: 'bg-blue-950/95',
    accentTextClassName: 'text-blue-300',
    accentBgClassName: 'bg-blue-500/15',
    borderClassName: 'border-blue-300/50',
  },
  enfermagem: {
    kind: 'enfermagem',
    label: 'Enfermagem',
    icon: 'clinical_notes',
    eyebrow: 'Atendimento de enfermagem',
    overlayClassName: 'bg-teal-950/95',
    accentTextClassName: 'text-teal-300',
    accentBgClassName: 'bg-teal-500/15',
    borderClassName: 'border-teal-300/50',
  },
  vacina: {
    kind: 'vacina',
    label: 'Vacina',
    icon: 'vaccines',
    eyebrow: 'Sala de vacina',
    overlayClassName: 'bg-violet-950/95',
    accentTextClassName: 'text-violet-300',
    accentBgClassName: 'bg-violet-500/15',
    borderClassName: 'border-violet-300/50',
  },
  odonto: {
    kind: 'odonto',
    label: 'Odonto',
    icon: 'dentistry',
    eyebrow: 'Atendimento odontológico',
    overlayClassName: 'bg-cyan-950/95',
    accentTextClassName: 'text-cyan-300',
    accentBgClassName: 'bg-cyan-500/15',
    borderClassName: 'border-cyan-300/50',
  },
  administrativo: {
    kind: 'administrativo',
    label: 'Visita/administrativo',
    icon: 'badge',
    eyebrow: 'Setor administrativo',
    overlayClassName: 'bg-slate-950/95',
    accentTextClassName: 'text-orange-300',
    accentBgClassName: 'bg-orange-500/15',
    borderClassName: 'border-orange-300/50',
  },
  padrao: {
    kind: 'padrao',
    label: 'Destino',
    icon: 'meeting_room',
    eyebrow: 'Destino',
    overlayClassName: 'bg-gray-900/95',
    accentTextClassName: 'text-[#38e07b]',
    accentBgClassName: 'bg-gray-800',
    borderClassName: 'border-white/10',
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
