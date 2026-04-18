import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Loader2, Search, TrendingUp, UserCheck, Users, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentDaySummary, AppointmentStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import AppointmentsNav from '../components/AppointmentsNav';
import {
  addDays,
  formatDateForDisplay,
  getAppointmentSummariesForDates,
  getWeekDates,
  getWeekStart,
  isBlockedAppointment,
  updateAppointmentStatus,
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

const STATUS_CYCLE: AppointmentStatus[] = ['Agendado', 'Compareceu', 'Faltou'];

const statusBadgeClass: Record<AppointmentStatus, string> = {
  Agendado: 'text-muted-foreground',
  Compareceu: 'text-primary',
  Faltou: 'text-red-300',
  Remarcado: 'text-amber-300',
};

const updateSummaryAppointmentStatus = (
  summary: AppointmentDaySummary,
  appointmentId: string,
  status: AppointmentStatus
): AppointmentDaySummary => {
  const statusUpdatedAt = new Date().toISOString();

  return {
    ...summary,
    appointments: summary.appointments.map(appointment =>
      appointment.id === appointmentId
        ? { ...appointment, status, status_updated_at: statusUpdatedAt }
        : appointment
    ),
    releasedAppointments: summary.releasedAppointments.map(appointment =>
      appointment.id === appointmentId
        ? { ...appointment, status, status_updated_at: statusUpdatedAt }
        : appointment
    ),
    slots: summary.slots.map(slot =>
      slot.appointment?.id === appointmentId
        ? {
            ...slot,
            appointment: {
              ...slot.appointment,
              status,
              status_updated_at: statusUpdatedAt,
            },
          }
        : slot
    ),
  };
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

  const summariesWithService = useMemo(
    () => summaries.filter(summary => summary.dayConfig.hasService),
    [summaries]
  );

  const totals = summariesWithService.reduce(
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

  const handleAppointmentStatusUpdated = useCallback((appointmentId: string, status: AppointmentStatus) => {
    setSummaries(prev => prev.map(summary => updateSummaryAppointmentStatus(summary, appointmentId, status)));
    setSelectedSummary(prev => (prev ? updateSummaryAppointmentStatus(prev, appointmentId, status) : prev));
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <AppointmentsNav />

      {/* Week Header */}
      <section className="rounded-2xl bg-card border border-border p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-base font-medium text-primary">Agenda semanal</p>
            <h2 className="text-3xl font-bold text-card-foreground">{formatWeekRange(weekDates)}</h2>
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
          <div className="mb-1.5 flex items-center justify-between text-sm text-muted-foreground">
            <span>Ocupação da semana</span>
            <span className="font-bold text-card-foreground">{weekOccupancy}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
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
        <div className="rounded-2xl bg-card border border-border p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando semana...</p>
        </div>
      ) : (
        <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {summariesWithService.map(summary => (
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
        onStatusChange={handleAppointmentStatusUpdated}
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
    <div className="rounded-xl border border-border bg-background/50 p-4">
      <div className={`mb-2 ${colors ? colors.icon : 'text-muted-foreground'}`}>{icon}</div>
      <p className={`text-2xl font-bold ${colors ? colors.value : 'text-card-foreground'}`}>{value}</p>
      <p className="mt-0.5 text-sm font-semibold uppercase text-muted-foreground">{label}</p>
    </div>
  );
};

/* ─── Week Day Card ──────────────────────────────────────────────────────── */

const WeekDayCard: React.FC<{
  summary: AppointmentDaySummary;
  onOpenDetails: () => void;
}> = ({
  summary,
  onOpenDetails,
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
    <article className="flex flex-col rounded-2xl border border-border bg-card">
      {/* Day header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            {formatShortDate(summary.dateObj)}
          </p>
          <h3 className="mt-0.5 text-base font-bold text-card-foreground">{summary.dayConfig.dayName}</h3>
          {summary.dayConfig.hasService && (
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {summary.dayConfig.serviceLabel}
            </p>
          )}
        </div>
        <span
          className={`rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold ${
            summary.dayConfig.hasService ? badgeClass : 'text-muted-foreground'
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
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
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
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {isHomeVisit ? 'Visitas' : 'Pacientes'}
                </p>
              </div>
              {patientSlots.length > 0 ? (
                <div className="space-y-1.5">
                  {visiblePatientSlots.map(slot => (
                    <div
                      key={slot.slotNumber}
                      className="flex items-center gap-2 rounded-lg bg-background/50 px-2.5 py-2"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                        {slot.slotNumber}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold leading-tight text-card-foreground">
                          {slot.appointment?.patient_name}
                        </p>
                        <p className="text-xs leading-tight text-muted-foreground">{slot.time}</p>
                      </div>
                    </div>
                  ))}
                  {patientSlots.length > 4 && (
                    <p className="pl-1 text-xs text-muted-foreground">
                      +{patientSlots.length - 4} paciente{patientSlots.length - 4 > 1 ? 's' : ''}
                    </p>
                  )}
                  <p className="pl-1 text-xs font-semibold text-primary">Clique para ver detalhes</p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border py-4 text-center">
                  <p className="text-sm text-muted-foreground">Nenhum paciente marcado</p>
                </div>
              )}
            </div>

            {/* Next available */}
            <div className="mt-auto flex items-center gap-2 rounded-xl bg-background/50 px-3 py-2.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">
                {nextAvailable
                  ? `${isHomeVisit ? 'Próxima visita' : 'Próxima'}: ficha ${nextAvailable.slotNumber} · ${nextAvailable.time}`
                  : 'Sem vagas livres'}
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
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
  <div className="rounded-lg bg-background/50 py-2 text-center">
    <p className={`text-base font-bold ${valueClass}`}>{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

/* ─── Day Patients Modal ─────────────────────────────────────────────────── */

const DayPatientsModal = ({
  summary,
  isOpen,
  onClose,
  onStatusChange,
}: {
  summary: AppointmentDaySummary | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (appointmentId: string, status: AppointmentStatus) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAcs, setSelectedAcs] = useState('ALL');
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    appointmentId: string;
    currentStatus: AppointmentStatus;
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const modalPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedAcs('ALL');
      setUpdatingAppointmentId(null);
      setContextMenu(null);
    }
  }, [isOpen, summary?.date]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (contextMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setContextMenu(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu]);

  if (!isOpen || !summary) {
    return null;
  }

  const isHomeVisit = summary.dayConfig.serviceType === 'HOME_VISIT';
  const patientSlots = summary.slots.filter(
    slot => slot.appointment && !isBlockedAppointment(slot.appointment)
  );

  const acsOptions = Array.from(
    new Set(patientSlots.map(slot => slot.appointment?.acs_name ?? '').filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredPatientSlots = patientSlots.filter(slot => {
    const patientName = slot.appointment?.patient_name ?? '';
    const documentValue = slot.appointment?.document_value ?? '';
    const acsName = slot.appointment?.acs_name ?? '';

    const matchesSearch =
      !normalizedSearchTerm ||
      patientName.toLowerCase().includes(normalizedSearchTerm) ||
      documentValue.toLowerCase().includes(normalizedSearchTerm);

    const matchesAcs = selectedAcs === 'ALL' || acsName === selectedAcs;

    return matchesSearch && matchesAcs;
  });

  const morningSlots = filteredPatientSlots.filter(slot => slot.period === 'Manhã');
  const afternoonSlots = filteredPatientSlots.filter(slot => slot.period !== 'Manhã');

  const handleChangeStatus = async (appointmentId: string, status: AppointmentStatus) => {
    if (updatingAppointmentId) {
      return;
    }

    setUpdatingAppointmentId(appointmentId);

    try {
      await updateAppointmentStatus(appointmentId, status);
      onStatusChange(appointmentId, status);
      toast.success(`Status atualizado para "${status}"`);
    } catch (error) {
      console.error('Erro ao atualizar status no modal semanal:', error);
      toast.error('Erro ao atualizar status da marcação.');
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const handleOpenContextMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    appointmentId: string,
    currentStatus: AppointmentStatus
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const panelRect = modalPanelRef.current?.getBoundingClientRect();
    const badgeRect = event.currentTarget.getBoundingClientRect();

    if (!panelRect) {
      return;
    }

    const panelPadding = 8;
    const menuOffset = 6;
    const estimatedMenuHeight = 148;
    const estimatedMenuWidth = 190;

    let x = badgeRect.right - panelRect.left - estimatedMenuWidth;
    let y = badgeRect.bottom - panelRect.top + menuOffset;

    const maxX = panelRect.width - estimatedMenuWidth - panelPadding;
    x = Math.max(panelPadding, Math.min(x, maxX));

    if (y + estimatedMenuHeight > panelRect.height - panelPadding) {
      y = badgeRect.top - panelRect.top - estimatedMenuHeight - menuOffset;
    }

    const maxY = panelRect.height - estimatedMenuHeight - panelPadding;
    y = Math.max(panelPadding, Math.min(y, maxY));

    setContextMenu({
      appointmentId,
      currentStatus,
      x,
      y,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelRef={modalPanelRef}
      panelClassName="relative mx-4 max-w-3xl shadow-sm"
    >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {formatShortDate(summary.dateObj)}
            </p>
            <h3 className="mt-1 text-lg font-bold text-card-foreground">{summary.dayConfig.dayName}</h3>
            <p className="text-base text-muted-foreground">
              {summary.dayConfig.serviceLabel} · {summary.occupiedSlots}/{summary.totalSlots} ocupadas
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-2">
          <Input
            type="text"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome, CNS ou CPF"
            icon={<Search className="h-4 w-4" />}
            className="h-11 rounded-lg bg-background/50 pr-4"
          />

          <Select value={selectedAcs} onValueChange={setSelectedAcs}>
            <SelectTrigger className="h-11 rounded-lg bg-background/50 pl-4 pr-4">
              <SelectValue placeholder="Filtrar por agente de saúde" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os agentes</SelectItem>
              {acsOptions.map(acsName => (
                <SelectItem key={acsName} value={acsName}>
                  {acsName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-4">
          {filteredPatientSlots.length > 0 ? (
            <>
              {[
                { title: 'Manhã', slots: morningSlots },
                { title: 'Tarde', slots: afternoonSlots },
              ].map(section => (
                <section key={section.title} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-primary">{section.title}</h4>
                    <span className="text-xs text-muted-foreground">{section.slots.length} paciente(s)</span>
                  </div>

                  {section.slots.length > 0 ? (
                    section.slots.map(slot => (
                      <article
                        key={slot.slotNumber}
                        className="rounded-xl border border-border bg-background/50 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                              {slot.slotNumber}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-card-foreground">
                                {slot.appointment?.patient_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {isHomeVisit ? 'Visita' : 'Consulta'} · {slot.time}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={event => {
                              const appointment = slot.appointment;
                              if (!appointment) return;

                              handleOpenContextMenu(event, appointment.id, appointment.status);
                            }}
                            onContextMenu={event => {
                              const appointment = slot.appointment;
                              if (!appointment) return;

                              handleOpenContextMenu(event, appointment.id, appointment.status);
                            }}
                            disabled={updatingAppointmentId !== null}
                            className={`rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold transition-opacity ${
                              statusBadgeClass[slot.appointment?.status ?? 'Agendado']
                            } ${updatingAppointmentId !== null ? 'cursor-not-allowed opacity-70' : 'hover:opacity-80'}`}
                            title="Clique para abrir menu de status"
                          >
                            {slot.appointment?.status}
                          </button>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <p>
                            <span className="font-semibold text-card-foreground">Documento:</span> {slot.appointment?.document_value}
                          </p>
                          <p>
                            <span className="font-semibold text-card-foreground">ACS:</span> {slot.appointment?.acs_name}
                          </p>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border py-4 text-center">
                      <p className="text-sm text-muted-foreground">Nenhum paciente no turno da {section.title.toLowerCase()}.</p>
                    </div>
                  )}
                </section>
              ))}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum {isHomeVisit ? 'paciente para visita' : 'paciente agendado'} com os filtros selecionados.
              </p>
            </div>
          )}
        </div>

        {contextMenu && (
          <div
            ref={contextMenuRef}
            className="absolute z-60 min-w-45 rounded-xl border border-border bg-popover p-1.5 shadow-xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {STATUS_CYCLE.map(status => {
              const isCurrent = contextMenu.currentStatus === status;
              const isBusy = updatingAppointmentId !== null;

              return (
                <button
                  key={status}
                  type="button"
                  disabled={isBusy || isCurrent}
                  onClick={() => {
                    const currentStatus = contextMenu.currentStatus;
                    const appointmentId = contextMenu.appointmentId;

                    if (status === currentStatus) {
                      setContextMenu(null);
                      return;
                    }

                    void handleChangeStatus(appointmentId, status);
                    setContextMenu(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-base transition-colors ${
                    isCurrent
                      ? `${statusBadgeClass[status]} bg-secondary`
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  } ${isBusy ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  <span>{status}</span>
                  {isCurrent ? <span className="text-xs font-semibold">Atual</span> : null}
                </button>
              );
            })}
          </div>
        )}

        <footer className="flex justify-end border-t border-border px-5 py-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="w-auto">
            Fechar
          </Button>
        </footer>
    </Modal>
  );
};

export default WeeklyAppointmentsPage;
