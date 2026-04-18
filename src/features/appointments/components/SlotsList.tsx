import React from 'react';
import { Sun, Moon, AlertTriangle, Siren, CalendarX } from 'lucide-react';
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

  /* ── Sem atendimento ── */
  if (!dayConfig.hasService) {
    return (
      <div className="rounded-2xl border border-[#264532] bg-[#1a3a26] p-10 text-center print:bg-white print:border-gray-300">
        <CalendarX className="w-12 h-12 text-[#264532] mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-1 print:text-black">Sem agenda neste dia</h3>
        <p className="text-sm text-[#96c5a9] print:text-gray-600">
          {dayConfig.dayName} não possui atendimento agendado.{' '}
          <br className="hidden sm:block" />
          Selecione uma Segunda, Terça ou Quarta-feira.
        </p>
      </div>
    );
  }

  /* ── Carregando ── */
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#264532] bg-[#1a3a26] p-10 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#96c5a9]">Carregando marcações...</p>
      </div>
    );
  }

  /* ── Separar por período ── */
  const morningSlots  = slots.filter(s => s.period === 'Manhã');
  const afternoonSlots = slots.filter(s => s.period === 'Tarde');
  const reserveSlots  = slots.filter(s => s.period === 'Reserva');

  const occupancyLabel = isHomeVisit ? 'visitas' : 'vagas';

  return (
    <div className="space-y-6">
      {/* Manhã */}
      {morningSlots.length > 0 && (
        <PeriodSection
          icon={<Sun className="w-4 h-4 text-yellow-400" />}
          title={isHomeVisit ? 'Visitas – Manhã' : 'Manhã'}
          occupied={morningSlots.filter(s => s.appointment !== null).length}
          total={morningSlots.length}
          label={occupancyLabel}
          accentClass="border-yellow-400/20 bg-yellow-400/5"
        >
          {morningSlots.map(slot => (
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
        </PeriodSection>
      )}

      {/* Tarde */}
      {afternoonSlots.length > 0 && (
        <PeriodSection
          icon={<Moon className="w-4 h-4 text-indigo-400" />}
          title="Tarde"
          occupied={afternoonSlots.filter(s => s.appointment !== null).length}
          total={afternoonSlots.length}
          label={occupancyLabel}
          accentClass="border-indigo-400/20 bg-indigo-400/5"
        >
          {afternoonSlots.map(slot => (
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
        </PeriodSection>
      )}

      {/* Reserva / Emergência */}
      {reserveSlots.length > 0 && (
        <PeriodSection
          icon={<Siren className="w-4 h-4 text-red-400" />}
          title="Reserva / Emergência"
          occupied={reserveSlots.filter(s => s.appointment !== null).length}
          total={reserveSlots.length}
          label={occupancyLabel}
          accentClass="border-red-400/20 bg-red-400/5"
        >
          {reserveSlots.map(slot => (
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
        </PeriodSection>
      )}

      {/* Resultado vazio da busca */}
      {slots.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#264532] p-10 text-center">
          <AlertTriangle className="w-8 h-8 text-[#264532] mx-auto mb-3" />
          <p className="text-[#96c5a9] text-sm">Nenhum resultado encontrado para esta busca.</p>
        </div>
      )}
    </div>
  );
};

/* ─── Period Section ─────────────────────────────────────────────────────── */

interface PeriodSectionProps {
  icon: React.ReactNode;
  title: string;
  occupied: number;
  total: number;
  label: string;
  accentClass: string;
  children: React.ReactNode;
}

const PeriodSection: React.FC<PeriodSectionProps> = ({
  icon,
  title,
  occupied,
  total,
  label,
  accentClass,
  children,
}) => {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <section>
      {/* Section header */}
      <div className={`flex items-center gap-3 mb-3 rounded-xl border px-4 py-2.5 ${accentClass} print:hidden`}>
        {icon}
        <h3 className="text-sm font-bold text-white print:text-black flex-1">{title}</h3>

        {/* Mini progress */}
        <div className="flex items-center gap-2 print:hidden">
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-14 h-1.5 rounded-full bg-[#264532] overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-[#96c5a9] font-medium whitespace-nowrap">
            {occupied}/{total} {label}
          </span>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:flex items-center gap-2 mb-3">
        <h3 className="font-bold text-black">{title}</h3>
        <span className="text-gray-500 text-sm">({occupied}/{total} {label})</span>
      </div>

      {/* Slots */}
      <div className="space-y-2">
        {children}
      </div>
    </section>
  );
};

export default SlotsList;
