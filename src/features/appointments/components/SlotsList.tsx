import React from 'react';
import { Sun, Moon, AlertTriangle } from 'lucide-react';
import type { AppointmentSlot, Appointment, DayScheduleConfig } from '@/types';
import SlotCard from './SlotCard';

interface SlotsListProps {
  slots: AppointmentSlot[];
  dayConfig: DayScheduleConfig;
  onAddClick: (slotNumber: number) => void;
  onEditClick: (appointment: Appointment) => void;
  onDeleteClick: (appointment: Appointment) => void;
  isLoading: boolean;
}

/**
 * Lista de slots organizada por período (Manhã/Tarde).
 */
export const SlotsList: React.FC<SlotsListProps> = ({
  slots,
  dayConfig,
  onAddClick,
  onEditClick,
  onDeleteClick,
  isLoading,
}) => {
  // Se não há atendimento no dia
  if (!dayConfig.hasService) {
    return (
      <div className="bg-[#1a3a26] rounded-2xl p-12 text-center print:bg-white print:border print:border-gray-300">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2 print:text-black">
          Sem atendimento médico neste dia
        </h3>
        <p className="text-[#96c5a9] print:text-gray-600">
          {dayConfig.dayName} não possui atendimento agendado.
          <br />
          Selecione uma Segunda-feira ou Terça-feira para ver as marcações.
        </p>
      </div>
    );
  }

  // Se está carregando
  if (isLoading) {
    return (
      <div className="bg-[#1a3a26] rounded-2xl p-12 text-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-[#96c5a9]">Carregando marcações...</p>
      </div>
    );
  }

  // Separar slots por período
  const morningSlots = slots.filter(s => s.period === 'Manhã');
  const afternoonSlots = slots.filter(s => s.period === 'Tarde');

  return (
    <div className="space-y-8">
      {/* Período da Manhã */}
      {morningSlots.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Sun className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-bold text-white print:text-black">
              Manhã
            </h3>
            <span className="text-[#96c5a9] text-sm print:text-gray-600">
              ({morningSlots.filter(s => s.appointment).length}/{morningSlots.length} vagas ocupadas)
            </span>
          </div>
          <div className="grid gap-3">
            {morningSlots.map((slot) => (
              <SlotCard
                key={slot.slotNumber}
                slot={slot}
                onAddClick={onAddClick}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Período da Tarde */}
      {afternoonSlots.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Moon className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-bold text-white print:text-black">
              Tarde
            </h3>
            <span className="text-[#96c5a9] text-sm print:text-gray-600">
              ({afternoonSlots.filter(s => s.appointment).length}/{afternoonSlots.length} vagas ocupadas)
            </span>
          </div>
          <div className="grid gap-3">
            {afternoonSlots.map((slot) => (
              <SlotCard
                key={slot.slotNumber}
                slot={slot}
                onAddClick={onAddClick}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotsList;
