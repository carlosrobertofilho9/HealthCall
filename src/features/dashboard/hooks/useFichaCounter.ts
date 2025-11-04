import { useState, useEffect } from 'react';
import { Patient } from '@/types';

/**
 * Hook customizado para gerenciar o contador de fichas.
 * Sincroniza automaticamente com a lista de pacientes do Supabase.
 * @param {Patient[]} patients - Lista atual de pacientes
 * @returns {number} O próximo número de ficha disponível
 */
export function useFichaCounter(patients: Patient[]): number {
  const [fichaCount, setFichaCount] = useState(1);

  /**
   * Calcula o próximo número de ficha baseado nos pacientes existentes.
   * Analisa todos os nomes de pacientes que seguem o padrão "Ficha N"
   * e retorna o maior número encontrado + 1.
   */
  useEffect(() => {
    const getNextFichaNumber = (): number => {
      if (patients.length === 0) {
        return 1;
      }

      const fichaNumbers = patients
        .map(p => {
          const match = p.name.match(/^Ficha (\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => num > 0);

      if (fichaNumbers.length === 0) {
        return 1;
      }

      return Math.max(...fichaNumbers) + 1;
    };

    const nextNumber = getNextFichaNumber();
    setFichaCount(nextNumber);
  }, [patients]);

  return fichaCount;
}
