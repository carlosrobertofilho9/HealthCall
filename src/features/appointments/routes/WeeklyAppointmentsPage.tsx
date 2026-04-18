import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Loader2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentDaySummary } from '@/types';
import { Button } from '@/components/ui/Button';
import AppointmentsNav from '../components/AppointmentsNav';
import {
  addDays,
  formatDateForDisplay,
  getAppointmentSummariesForDates,
  getWeekDates,
  getWeekStart,
  isBlockedAppointment,
} from '../services/appointmentService';

const formatShortDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });

const formatWeekRange = (dates: Date[]) => {
  const first = dates[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  const last = dates[dates.length - 1].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
  return `${first} a ${last}`;
};

const WeeklyAppointmentsPage: React.FC = () => {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [summaries, setSummaries] = useState<AppointmentDaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const weekDates = useMemo(() => getWeekDates(weekStart).slice(0, 5), [weekStart]);

  const loadWeek = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAppointmentSummariesForDates(weekDates);
      setSummaries(data);
    } catch (error) {
      console.error('Erro ao carregar agenda semanal:', error);
      toast.error('Erro ao carregar agenda semanal.');
    } finally {
      setIsLoading(false);
    }
  }, [weekDates]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  const totals = summaries.reduce(
    (acc, summary) => {
      acc.total += summary.totalSlots;
      acc.occupied += summary.occupiedSlots;
      acc.available += summary.availableSlots;
      acc.blocked += summary.blockedSlots;
      return acc;
    },
    { total: 0, occupied: 0, available: 0, blocked: 0 }
  );

  const goToPreviousWeek = () => setWeekStart(prev => addDays(prev, -7));
  const goToNextWeek = () => setWeekStart(prev => addDays(prev, 7));
  const goToCurrentWeek = () => setWeekStart(getWeekStart(new Date()));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <AppointmentsNav />

      <section className="rounded-2xl bg-[#1a3a26] p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Agenda semanal</p>
            <h2 className="text-2xl font-bold text-white">{formatWeekRange(weekDates)}</h2>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={goToPreviousWeek} className="w-auto">
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button type="button" size="sm" onClick={goToCurrentWeek} className="w-auto">
              Semana atual
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={goToNextWeek} className="w-auto">
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Vagas" value={totals.total} />
          <Stat label="Ocupadas" value={totals.occupied} highlight />
          <Stat label="Disponíveis" value={totals.available} tone="blue" />
          <Stat label="Bloqueios" value={totals.blocked} tone="red" />
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-2xl bg-[#1a3a26] p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-[#96c5a9]">Carregando semana...</p>
        </div>
      ) : (
        <section className="grid gap-4 lg:grid-cols-5">
          {summaries.map(summary => (
            <WeekDayCard key={summary.date} summary={summary} />
          ))}
        </section>
      )}
    </div>
  );
};

const Stat = ({
  label,
  value,
  highlight,
  tone,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  tone?: 'blue' | 'red';
}) => {
  const valueClass = tone === 'blue' ? 'text-blue-300' : tone === 'red' ? 'text-red-300' : highlight ? 'text-primary' : 'text-white';

  return (
    <div className="rounded-xl border border-[#264532] bg-[#122118]/50 p-4">
      <p className="text-xs font-semibold uppercase text-[#96c5a9]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
};

const WeekDayCard = ({ summary }: { summary: AppointmentDaySummary }) => {
  const patientSlots = summary.slots.filter(slot => slot.appointment && !isBlockedAppointment(slot.appointment));
  const nextAvailable = summary.slots.find(slot => !slot.appointment);
  const rateWidth = `${summary.occupancyRate}%`;

  return (
    <article className="rounded-2xl border border-[#264532] bg-[#1a3a26] p-4">
      <div className="flex items-start justify-between gap-3 lg:block">
        <div>
          <p className="text-sm font-semibold capitalize text-primary">{formatShortDate(summary.dateObj)}</p>
          <h3 className="mt-1 text-base font-bold text-white">{summary.dayConfig.dayName}</h3>
        </div>
        <span className="rounded-full bg-[#264532] px-3 py-1 text-xs font-bold text-[#96c5a9]">
          {summary.dayConfig.hasService ? `${summary.occupancyRate}%` : 'Sem agenda'}
        </span>
      </div>

      {summary.dayConfig.hasService ? (
        <>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#264532]">
            <div className="h-full rounded-full bg-primary" style={{ width: rateWidth }} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Ocup." value={summary.occupiedSlots} />
            <MiniStat label="Livres" value={summary.availableSlots} />
            <MiniStat label="Bloq." value={summary.blockedSlots} />
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[#96c5a9]">
              <UserCheck className="h-3.5 w-3.5" />
              Pacientes
            </div>
            {patientSlots.length > 0 ? (
              <div className="space-y-2">
                {patientSlots.slice(0, 4).map(slot => (
                  <div key={slot.slotNumber} className="rounded-lg bg-[#122118]/50 p-2">
                    <p className="truncate text-sm font-semibold text-white">{slot.appointment?.patient_name}</p>
                    <p className="text-xs text-[#96c5a9]">
                      Ficha {slot.slotNumber} · {slot.time}
                    </p>
                  </div>
                ))}
                {patientSlots.length > 4 && (
                  <p className="text-xs text-[#96c5a9]">+{patientSlots.length - 4} pacientes</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#96c5a9]">Nenhum paciente marcado.</p>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#122118]/50 p-3 text-sm text-[#96c5a9]">
            <Clock className="h-4 w-4 text-primary" />
            {nextAvailable ? `Próxima vaga: ficha ${nextAvailable.slotNumber} (${nextAvailable.time})` : 'Sem vagas livres'}
          </div>
        </>
      ) : (
        <p className="mt-5 text-sm text-[#96c5a9]">{formatDateForDisplay(summary.dateObj)} não possui atendimento configurado.</p>
      )}
    </article>
  );
};

const MiniStat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg bg-[#122118]/50 p-2">
    <p className="text-lg font-bold text-white">{value}</p>
    <p className="text-[11px] text-[#96c5a9]">{label}</p>
  </div>
);

export default WeeklyAppointmentsPage;
