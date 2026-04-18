import React from 'react';
import { formatDateForDisplay } from '../services/appointmentService';
import type { DayScheduleConfig } from '@/types';

interface PrintHeaderProps {
  selectedDate: Date;
  dayConfig: DayScheduleConfig;
  slotStats: {
    total: number;
    occupied: number;
    available: number;
  };
}

/**
 * Cabeçalho para impressão da lista de marcações.
 * Visível apenas na impressão.
 */
export const PrintHeader: React.FC<PrintHeaderProps> = ({
  selectedDate,
  dayConfig,
  slotStats,
}) => {
  const isHomeVisit = dayConfig.serviceType === 'HOME_VISIT';
  const totalLabel = isHomeVisit ? 'Total de Visitas' : 'Total de Vagas';
  const occupiedLabel = isHomeVisit ? 'Visitas Ocupadas' : 'Vagas Ocupadas';
  const availableLabel = isHomeVisit ? 'Visitas Disponíveis' : 'Vagas Disponíveis';

  return (
    <div className="hidden print:block mb-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-black mb-1">
          {isHomeVisit ? 'Roteiro de Visitas Domiciliares - PSF' : 'Lista de Marcações - PSF'}
        </h1>
        <h2 className="text-xl text-gray-700 capitalize">
          {formatDateForDisplay(selectedDate)}
        </h2>
      </div>

      <div className="border border-gray-300 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">{totalLabel}</p>
            <p className="text-2xl font-bold text-black">{slotStats.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{occupiedLabel}</p>
            <p className="text-2xl font-bold text-green-600">{slotStats.occupied}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{availableLabel}</p>
            <p className="text-2xl font-bold text-blue-600">{slotStats.available}</p>
          </div>
        </div>
      </div>

      <div className="text-right text-sm text-gray-500 mb-4">
        Impresso em: {new Date().toLocaleString('pt-BR')}
      </div>
    </div>
  );
};

export default PrintHeader;
