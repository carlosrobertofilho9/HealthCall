import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Loader2, TrendingUp, UserCheck, Users, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentDaySummary } from '@/types';
import { Button } from '@/components/ui/Button';
import useAnimation from '@/hooks/useAnimation';
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
  const last = dates[dates.length - 1]
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '');
  return `${first} – ${last}`;
};

const WeeklyAppointmentsPage: React.FC = () => {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [summaries, setSummaries] = useState<AppointmentDaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<AppointmentDaySummary | null>(null);

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

  useEffect(() => {
    setSelectedSummary(null);
  }, [weekStart]);

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

  const weekOccupancy = totals.total > 0 ? Math.round((totals.occupied / totals.total) * 100) : 0;

  const goToPreviousWeek = () => setWeekStart(prev => addDays(prev, -7));
  const goToNextWeek = () => setWeekStart(prev => addDays(prev, 7));
  const goToCurrentWeek = () => setWeekStart(getWeekStart(new Date()));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <AppointmentsNav />

      {/* Week Header */}
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

        {/* Overall occupancy bar */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs text-[#96c5a9]">
            <span>Ocupação da semana</span>
            <span className="font-bold text-white">{weekOccupancy}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#264532]">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${weekOccupancy}%` }}
            />
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Users className="h-4 w-4" />} label="Total de vagas" value={totals.total} />
          <StatCard icon={<UserCheck className="h-4 w-4" />} label="Ocupadas" value={totals.occupied} accent="green" />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Disponíveis" value={totals.available} accent="blue" />
          <StatCard icon={<XCircle className="h-4 w-4" />} label="Bloqueadas" value={totals.blocked} accent="red" />
        </div>
      </section>

      {/* Day cards */}
      {isLoading ? (
        <div className="rounded-2xl bg-[#1a3a26] p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-[#96c5a9]">Carregando semana...</p>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {summaries.map(summary => (
            <WeekDayCard
              key={summary.date}
              summary={summary}
              onOpenDetails={() => setSelectedSummary(summary)}
            />
          ))}
        </section>
      )}

      <DayPatientsModal
        summary={selectedSummary}
        isOpen={Boolean(selectedSummary)}
        onClose={() => setSelectedSummary(null)}
      />
    </div>
  );
};

/* ─── Stat Card ─────────────────────────────────────────────────────────── */

const accentColors = {
  green: { value: 'text-primary', icon: 'text-primary' },
  blue: { value: 'text-blue-300', icon: 'text-blue-300' },
  red: { value: 'text-red-300', icon: 'text-red-300' },
};

const StatCard = ({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: 'green' | 'blue' | 'red';
}) => {
  const colors = accent ? accentColors[accent] : null;

  return (
    <div className="rounded-xl border border-[#264532] bg-[#122118]/50 p-4">
      <div className={`mb-2 ${colors ? colors.icon : 'text-[#96c5a9]'}`}>{icon}</div>
      <p className={`text-2xl font-bold ${colors ? colors.value : 'text-white'}`}>{value}</p>
      <p className="mt-0.5 text-xs font-semibold uppercase text-[#96c5a9]">{label}</p>
    </div>
  );
};

/* ─── Week Day Card ──────────────────────────────────────────────────────── */

const WeekDayCard = ({
  summary,
  onOpenDetails,
}: {
  summary: AppointmentDaySummary;
  onOpenDetails: () => void;
}) => {
  const isHomeVisit = summary.dayConfig.serviceType === 'HOME_VISIT';
  const patientSlots = summary.slots.filter(
    slot => slot.appointment && !isBlockedAppointment(slot.appointment)
  );
  const visiblePatientSlots = patientSlots.slice(0, 4);
  const nextAvailable = summary.slots.find(slot => !slot.appointment);
  const rate = summary.occupancyRate;

  const barColor =
    rate >= 90 ? 'bg-red-400' : rate >= 60 ? 'bg-amber-400' : 'bg-primary';

  const badgeClass =
    rate >= 90
      ? 'text-red-300'
      : rate >= 60
      ? 'text-amber-300'
      : 'text-primary';

  return (
    <article className="flex flex-col rounded-2xl border border-[#264532] bg-[#1a3a26]">
      {/* Day header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#264532] px-4 py-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            {formatShortDate(summary.dateObj)}
          </p>
          <h3 className="mt-0.5 text-sm font-bold text-white">{summary.dayConfig.dayName}</h3>
          {summary.dayConfig.hasService && (
            <p className="mt-0.5 text-[10px] font-medium text-[#96c5a9]">
              {summary.dayConfig.serviceLabel}
            </p>
          )}
        </div>
        <span
          className={`rounded-full bg-[#264532] px-2.5 py-0.5 text-[11px] font-bold ${
            summary.dayConfig.hasService ? badgeClass : 'text-[#96c5a9]'
          }`}
        >
          {summary.dayConfig.hasService ? `${rate}%` : 'Sem agenda'}
        </span>
      </div>

      <div
        className={`flex flex-1 flex-col gap-4 p-4 ${
          summary.dayConfig.hasService ? 'cursor-pointer' : ''
        }`}
        onClick={summary.dayConfig.hasService ? onOpenDetails : undefined}
        role={summary.dayConfig.hasService ? 'button' : undefined}
        tabIndex={summary.dayConfig.hasService ? 0 : undefined}
        onKeyDown={
          summary.dayConfig.hasService
            ? event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpenDetails();
                }
              }
            : undefined
        }
      >
        {summary.dayConfig.hasService ? (
          <>
            {/* Occupancy bar */}
            <div className="h-2 overflow-hidden rounded-full bg-[#264532]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${rate}%` }}
              />
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-1.5">
              <MiniStat label="Ocup." value={summary.occupiedSlots} valueClass="text-primary" />
              <MiniStat label="Livres" value={summary.availableSlots} valueClass="text-blue-300" />
              <MiniStat label="Bloq." value={summary.blockedSlots} valueClass="text-red-300" />
            </div>

            {/* Patient list */}
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-[#96c5a9]" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#96c5a9]">
                  {isHomeVisit ? 'Visitas' : 'Pacientes'}
                </p>
              </div>
              {patientSlots.length > 0 ? (
                <div className="space-y-1.5">
                  {visiblePatientSlots.map(slot => (
                    <div
                      key={slot.slotNumber}
                      className="flex items-center gap-2 rounded-lg bg-[#122118]/50 px-2.5 py-2"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#264532] text-[10px] font-bold text-primary">
                        {slot.slotNumber}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold leading-tight text-white">
                          {slot.appointment?.patient_name}
                        </p>
                        <p className="text-[10px] leading-tight text-[#96c5a9]">{slot.time}</p>
                      </div>
                    </div>
                  ))}
                  {patientSlots.length > 4 && (
                    <p className="pl-1 text-[11px] text-[#96c5a9]">
                      +{patientSlots.length - 4} paciente{patientSlots.length - 4 > 1 ? 's' : ''}
                    </p>
                  )}
                  <p className="pl-1 text-[11px] font-semibold text-primary">Clique para ver detalhes</p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#264532] py-4 text-center">
                  <p className="text-xs text-[#96c5a9]">Nenhum paciente marcado</p>
                </div>
              )}
            </div>

            {/* Next available */}
            <div className="mt-auto flex items-center gap-2 rounded-xl bg-[#122118]/50 px-3 py-2.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="text-[11px] font-medium text-[#96c5a9]">
                {nextAvailable
                  ? `${isHomeVisit ? 'Próxima visita' : 'Próxima'}: ficha ${nextAvailable.slotNumber} · ${nextAvailable.time}`
                  : 'Sem vagas livres'}
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#264532] py-6">
            <XCircle className="h-5 w-5 text-[#264532]" />
            <p className="text-center text-xs text-[#96c5a9]">
              {formatDateForDisplay(summary.dateObj)} sem atendimento
            </p>
          </div>
        )}
      </div>
    </article>
  );
};

/* ─── Mini Stat ──────────────────────────────────────────────────────────── */

const MiniStat = ({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass: string;
}) => (
  <div className="rounded-lg bg-[#122118]/50 py-2 text-center">
    <p className={`text-base font-bold ${valueClass}`}>{value}</p>
    <p className="text-[10px] text-[#96c5a9]">{label}</p>
  </div>
);

/* ─── Day Patients Modal ─────────────────────────────────────────────────── */

const DayPatientsModal = ({
  summary,
  isOpen,
  onClose,
}: {
  summary: AppointmentDaySummary | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { shouldRender, isVisible } = useAnimation(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender || !summary) {
    return null;
  }

  const isHomeVisit = summary.dayConfig.serviceType === 'HOME_VISIT';
  const patientSlots = summary.slots.filter(
    slot => slot.appointment && !isBlockedAppointment(slot.appointment)
  );

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`mx-4 w-full max-w-3xl rounded-2xl border border-[#264532] bg-[#1a3a26] shadow-2xl transition-all duration-500 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={event => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#264532] px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
              {formatShortDate(summary.dateObj)}
            </p>
            <h3 className="mt-1 text-lg font-bold text-white">{summary.dayConfig.dayName}</h3>
            <p className="text-sm text-[#96c5a9]">
              {summary.dayConfig.serviceLabel} · {summary.occupiedSlots}/{summary.totalSlots} ocupadas
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#96c5a9] transition-colors hover:bg-[#264532] hover:text-white"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
          {patientSlots.length > 0 ? (
            patientSlots.map(slot => (
              <article
                key={slot.slotNumber}
                className="rounded-xl border border-[#264532] bg-[#122118]/50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#264532] text-xs font-bold text-primary">
                      {slot.slotNumber}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {slot.appointment?.patient_name}
                      </p>
                      <p className="text-xs text-[#96c5a9]">
                        {isHomeVisit ? 'Visita' : 'Consulta'} · {slot.time}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#264532] px-2.5 py-1 text-[11px] font-semibold text-[#96c5a9]">
                    {slot.appointment?.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-[#96c5a9] sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-white">Documento:</span> {slot.appointment?.document_value}
                  </p>
                  <p>
                    <span className="font-semibold text-white">ACS:</span> {slot.appointment?.acs_name}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[#264532] py-10 text-center">
              <p className="text-sm text-[#96c5a9]">
                Nenhum {isHomeVisit ? 'paciente para visita' : 'paciente agendado'} nesse dia.
              </p>
            </div>
          )}
        </div>

        <footer className="flex justify-end border-t border-[#264532] px-5 py-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="w-auto">
            Fechar
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default WeeklyAppointmentsPage;
