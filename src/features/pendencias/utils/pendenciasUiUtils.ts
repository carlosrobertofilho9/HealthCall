import { formatCNS, formatCPF } from '@/lib/utils';

export const TIPO_OPTIONS = [
  'Exame',
  'Encaminhamento',
  'Laudo',
  'Retorno',
  'Medicamento',
  'Fisioterapia',
  'Psicologia',
];

export const formatCnsCpfForInput = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 15);
  if (digits.length <= 11) return formatCPF(digits);
  return formatCNS(digits);
};

export const formatCnsCpfForDisplay = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) return formatCPF(digits);
  if (digits.length === 15) return formatCNS(digits);
  return value;
};

export const getDocumentLabel = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) return 'CPF';
  if (digits.length === 15) return 'CNS';
  return 'Doc';
};

export const parseTipoTags = (value: string) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

export const composeTipoValue = (selectedTipos: string[], tipoPersonalizado: string) =>
  [...selectedTipos, tipoPersonalizado.trim()].filter(Boolean).join(', ');
