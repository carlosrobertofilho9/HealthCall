import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina múltiplos valores de classe em uma única string, resolvendo conflitos de classes do Tailwind CSS.
 *
 * Esta função utilitária usa `clsx` para lidar com a lógica condicional de classes e `tailwind-merge`
 * para mesclar inteligentemente as classes do Tailwind, evitando redundâncias e conflitos.
 *
 * @param {...ClassValue[]} inputs - Uma sequência de valores de classe. Pode ser uma string, número, booleano, objeto ou array.
 * @returns {string} Uma string contendo as classes mescladas e otimizadas.
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
};

export const isValidCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return false;
  
  // Basic validation (repeated numbers)
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Digit verification logic could be added here for strict validation
  // keeping it simple as per original code for now, or improving slightly?
  // The original only checked length === 11. I'll stick to that to minimize regression risk unless requested.
  return true;
};

export const formatCNS = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 15);
  // XXX.XXXX.XXXX.XXXX
  // 3.4.4.4
  
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 11) return `${numbers.slice(0, 3)}.${numbers.slice(3, 7)}.${numbers.slice(7)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 7)}.${numbers.slice(7, 11)}.${numbers.slice(11)}`;
};

export const isValidCNS = (cns: string): boolean => {
  const numbers = cns.replace(/\D/g, '');
  return numbers.length === 15;
};

export type DocumentoPacienteTipo = 'CPF' | 'CNS' | null;

export const detectDocumentoPacienteTipo = (value: string): DocumentoPacienteTipo => {
  const digits = value.replace(/\D/g, '');
  if (digits.length > 11) return 'CNS';
  if (digits.length > 0) return 'CPF';
  return null;
};

export const formatDocumentoPaciente = (value: string): { tipo: DocumentoPacienteTipo; formatado: string; digitos: string } => {
  const digits = value.replace(/\D/g, '');
  const tipo = detectDocumentoPacienteTipo(digits);

  if (tipo === 'CNS') {
    return { tipo, formatado: formatCNS(digits), digitos: digits.slice(0, 15) };
  }

  if (tipo === 'CPF') {
    return { tipo, formatado: formatCPF(digits), digitos: digits.slice(0, 11) };
  }

  return { tipo: null, formatado: value, digitos: digits };
};
