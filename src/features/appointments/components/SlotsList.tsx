import React from 'react';
import { Sun, Moon, AlertTriangle, AlertCircle } from 'lucide-react';
import type { AppointmentSlot, Appointment, AppointmentStatus, DayScheduleConfig } from '@/types';
import SlotCard from './SlotCard';

interface SlotsListProps {
  slots: AppointmentSlot[];
  dayConfig: DayScheduleConfig;
  onAddClick: (slotNumber: number) => void;
  onEditClick: (appointment: Appointment) => void;
  onDeleteClick: (appointment: Appointment) => void;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void;
  onRescheduleClick: (appointment: Appointment) => void;
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
  onStatusChange,
  onRescheduleClick,
  isLoading,
}) => {
  const isHomeVisit = dayConfig.serviceType === 'HOME_VISIT';
  const occupancyLabel = isHomeVisit ? 'visitas ocupadas' : 'vagas ocupadas';

  // Se não há atendimento no dia
  if (!dayConfig.hasService) {
    return (
      <div className="bg-[#1a3a26] rounded-2xl p-12 text-center print:bg-white print:border print:border-gray-300">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2 print:text-black">
          Sem agenda neste dia
        </h3>
        <p className="text-[#96c5a9] print:text-gray-600">
          {dayConfig.dayName} não possui atendimento agendado.
          <br />
          Selecione uma Segunda, Terça ou Quarta-feira para ver as marcações.
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
  const reserveSlots = slots.filter(s => s.period === 'Reserva');

  return (
    <div className="space-y-8">
      {/* Período da Manhã */}
      {morningSlots.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Sun className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-bold text-white print:text-black">
              {isHomeVisit ? 'Visitas domiciliares - manhã' : 'Manhã'}
            </h3>
            <span className="text-[#96c5a9] text-sm print:text-gray-600">
              ({morningSlots.filter(s => s.appointment).length}/{morningSlots.length} {occupancyLabel})
            </span>
          </div>
          <div className="grid gap-3">
            {morningSlots.map((slot) => (
              <SlotCard
                key={slot.slotNumber}
                slot={slot}
                serviceType={dayConfig.serviceType}
                onAddClick={onAddClick}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
                onStatusChange={onStatusChange}
                onRescheduleClick={onRescheduleClick}
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
              ({afternoonSlots.filter(s => s.appointment).length}/{afternoonSlots.length} {occupancyLabel})
            </span>
          </div>
          <div className="grid gap-3">
            {afternoonSlots.map((slot) => (
              <SlotCard
                key={slot.slotNumber}
                slot={slot}
                serviceType={dayConfig.serviceType}
                onAddClick={onAddClick}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
                onStatusChange={onStatusChange}
                onRescheduleClick={onRescheduleClick}
              />
            ))}
          </div>
        </div>
      )}
      {/* Slots de Reserva */}
      {reserveSlots.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-bold text-white print:text-black">
              Reservas / Emergência
            </h3>
            <span className="text-[#96c5a9] text-sm print:text-gray-600">
              ({reserveSlots.filter(s => s.appointment).length}/{reserveSlots.length} {occupancyLabel})
            </span>
          </div>
          <div className="grid gap-3">
            {reserveSlots.map((slot) => (
              <SlotCard
                key={slot.slotNumber}
                slot={slot}
                serviceType={dayConfig.serviceType}
                onAddClick={onAddClick}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
                onStatusChange={onStatusChange}
                onRescheduleClick={onRescheduleClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotsList;
