import React from 'react';
import { Sun, Moon, AlertTriangle, Siren, CalendarX, Loader2 } from 'lucide-react';
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
  onConfirmationPdfClick: (appointment: Appointment) => void;
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
  onConfirmationPdfClick,
  isLoading,
}) => {
  const isHomeVisit = dayConfig.serviceType === 'HOME_VISIT';

  /* ── Sem atendimento ── */
  if (!dayConfig.hasService) {
    return (
      <div className="rounded-[1.25rem] border border-[#DCE5EE] bg-white p-10 text-center shadow-[0_12px_32px_rgba(0,27,61,0.05)] print:border-gray-300 print:bg-white">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[1rem] bg-[#F8FAFC] text-[#64748B]">
          <CalendarX className="size-7" />
        </div>
        <h3 className="mb-1 text-lg font-extrabold text-[#001B3D] print:text-black">Sem agenda neste dia</h3>
        <p className="text-sm font-medium text-[#64748B] print:text-gray-600">
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
      <div className="rounded-[1.25rem] border border-[#DCE5EE] bg-white p-10 text-center shadow-[0_12px_32px_rgba(0,27,61,0.05)]">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-[1rem] bg-[#E6F7F2] text-[#007A65]">
          <Loader2 className="size-6 animate-spin" />
        </div>
        <p className="font-semibold text-[#64748B]">Carregando marcações...</p>
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
          icon={<Sun className="w-4 h-4 text-[#F59E0B]" />}
          title={isHomeVisit ? 'Visitas – Manhã' : 'Manhã'}
          occupied={morningSlots.filter(s => s.appointment !== null).length}
          total={morningSlots.length}
          label={occupancyLabel}
          accentClass="border-[#FFE4B8] bg-[#FFF8E8]"
          progressClass="bg-[#F59E0B]"
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
              onConfirmationPdfClick={onConfirmationPdfClick}
            />
          ))}
        </PeriodSection>
      )}

      {/* Tarde */}
      {afternoonSlots.length > 0 && (
        <PeriodSection
          icon={<Moon className="w-4 h-4 text-[#1466F5]" />}
          title="Tarde"
          occupied={afternoonSlots.filter(s => s.appointment !== null).length}
          total={afternoonSlots.length}
          label={occupancyLabel}
          accentClass="border-[#D5E6FF] bg-[#EAF3FF]"
          progressClass="bg-[#1466F5]"
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
              onConfirmationPdfClick={onConfirmationPdfClick}
            />
          ))}
        </PeriodSection>
      )}

      {/* Reserva / Emergência */}
      {reserveSlots.length > 0 && (
        <PeriodSection
          icon={<Siren className="w-4 h-4 text-[#D9474F]" />}
          title="Reserva / Emergência"
          occupied={reserveSlots.filter(s => s.appointment !== null).length}
          total={reserveSlots.length}
          label={occupancyLabel}
          accentClass="border-[#FFD6DA] bg-[#FFF4F5]"
          progressClass="bg-[#D9474F]"
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
              onConfirmationPdfClick={onConfirmationPdfClick}
            />
          ))}
        </PeriodSection>
      )}

      {/* Resultado vazio da busca */}
      {slots.length === 0 && (
        <div className="rounded-[1.25rem] border border-dashed border-[#BFD2E5] bg-[#F8FAFC] p-10 text-center">
          <AlertTriangle className="mx-auto mb-3 size-8 text-[#64748B]" />
          <p className="text-sm font-semibold text-[#64748B]">Nenhum resultado encontrado para esta busca.</p>
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
  progressClass: string;
  children: React.ReactNode;
}

const PeriodSection: React.FC<PeriodSectionProps> = ({
  icon,
  title,
  occupied,
  total,
  label,
  accentClass,
  progressClass,
  children,
}) => {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <section className="overflow-hidden rounded-[1.2rem] border border-[#DCE5EE] bg-white shadow-[0_12px_32px_rgba(0,27,61,0.05)] print:border-0 print:bg-white print:shadow-none">
      <div className={`flex items-center gap-3 border-b px-4 py-3 ${accentClass} print:hidden`}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[0.85rem] bg-white/80 shadow-[0_8px_18px_rgba(0,27,61,0.05)]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold text-[#001B3D] print:text-black">{title}</h3>
          <p className="text-xs font-semibold text-[#64748B]">{occupied}/{total} {label} em uso</p>
        </div>

        <div className="hidden min-w-28 items-center gap-2 sm:flex print:hidden">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/80">
            <div
              className={`h-full rounded-full transition-all ${progressClass}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-9 text-right text-xs font-extrabold text-[#001B3D]">{pct}%</span>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden items-center gap-2 mb-3 print:flex">
        <h3 className="font-bold text-black">{title}</h3>
        <span className="text-gray-500 text-sm">({occupied}/{total} {label})</span>
      </div>

      <div className="space-y-2 p-3 sm:p-4 print:p-0">
        {children}
      </div>
    </section>
  );
};

export default SlotsList;
