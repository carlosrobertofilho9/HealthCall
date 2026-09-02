import { useState, useEffect } from 'react';
import type { Patient } from '@/types';

/**
 * Calcula o próximo número de ficha a partir da fila já carregada.
 * O contador oficial usado para criar fichas é persistido no servidor local.
 */
export function useFichaCounter(patients: Patient[]): number {
  const [fichaCount, setFichaCount] = useState(1);

  useEffect(() => {
    const fichaNumbers = patients
      .map((patient) => {
        const match = patient.name.match(/^Ficha (\d+)$/);
        return match ? Number.parseInt(match[1], 10) : 0;
      })
      .filter((number) => number > 0);

    setFichaCount(fichaNumbers.length === 0 ? 1 : Math.max(...fichaNumbers) + 1);
  }, [patients]);

  return fichaCount;
}
