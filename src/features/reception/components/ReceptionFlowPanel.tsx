import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users2, UserRoundCheck, UserRoundX, RefreshCcw, Printer, Calendar, ChevronDown, FileText, Sun, Moon, Clock, Copy, CircleDashed } from 'lucide-react';
import { toast } from 'sonner';
import { Button, DatePicker, SectionCard } from '@/components/ui';
import { cn, formatCNS, formatCPF } from '@/lib/utils';
import { printAppointmentReport, type ReportPeriodFilter } from '@/components/PatientQueue/printReportUtils';
import type { AppointmentSlot, AppointmentStatus } from '@/types';

interface Appointment {
  id: string;
  patient_name: string;
  slot_number: number;
  status: AppointmentStatus;
  document_type: string;
  document_value: string;
}

interface ReceptionFlowPanelProps {
  todayAppointments: Appointment[];
  presenceSummary: {
    showedUp: number;
    noShow: number;
    scheduled: number;
    total: number;
  };
  isLoading: boolean;
  updateStatus: (id: string, status: AppointmentStatus) => Promise<boolean>;
  getSlotLabel: (slot: number) => string;
  goToToday: () => void;
  changeDate: (date: Date) => void;
  selectedDate: Date;
  refresh: () => void;
  slots: AppointmentSlot[];
  className?: string;
}

type ReceptionPeriod = 'Manhã' | 'Tarde';

type PeriodAppointment = {
  appointment: Appointment;
  timeLabel: string;
};

type SummaryTone = 'neutral' | 'primary' | 'amber';

interface SummaryTileProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: SummaryTone;
}

const summaryToneClasses: Record<SummaryTone, string> = {
  neutral: 'border-border/50 bg-background/55 text-card-foreground',
  primary: 'border-primary/25 bg-primary/10 text-primary shadow-primary/5',
  amber: 'border-amber-400/25 bg-amber-400/10 text-amber-300 shadow-amber-500/5',
};

const SummaryTile: React.FC<SummaryTileProps> = ({ label, value, icon, tone }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      'rounded-xl border p-3 shadow-sm backdrop-blur-sm',
      summaryToneClasses[tone],
    )}
  >
    <div className="mb-2 flex items-center justify-between gap-2">
      <p className="min-w-0 truncate text-[10px] font-black uppercase tracking-wider opacity-75">
        {label}
      </p>
      <span className="shrink-0 opacity-80">{icon}</span>
    </div>
    <p className="text-2xl font-black leading-none tabular-nums">{value}</p>
  </motion.div>
);

function formatPatientDocument(type: string, value: string) {
  const normalizedType = type.trim().toUpperCase();

  if (normalizedType === 'CPF') {
    return {
      label: 'CPF',
      value: formatCPF(value),
    };
  }

  if (normalizedType === 'CARTAO_SUS' || normalizedType === 'CNS') {
    return {
      label: 'CNS',
      value: formatCNS(value),
    };
  }

  return {
    label: type.trim() || 'Documento',
    value: value.trim() || 'Não informado',
  };
}

function inferReceptionPeriod(timeLabel: string): ReceptionPeriod {
  const hour = Number(timeLabel.match(/^(\d{2}):\d{2}$/)?.[1]);

  if (!Number.isNaN(hour) && hour >= 12) {
    return 'Tarde';
  }

  return 'Manhã';
}

function isSameLocalDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

export const ReceptionFlowPanel: React.FC<ReceptionFlowPanelProps> = ({
  todayAppointments,
  presenceSummary,
  isLoading,
  updateStatus,
  getSlotLabel,
  goToToday,
  changeDate,
  selectedDate,
  refresh,
  slots,
  className,
}) => {
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
  const [reportMenuPosition, setReportMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const reportMenuRef = useRef<HTMLDivElement>(null);
  const reportPopupRef = useRef<HTMLDivElement>(null);

  const slotsByNumber = useMemo(() => {
    return new Map(slots.map((slot) => [slot.slotNumber, slot]));
  }, [slots]);

  const appointmentGroups = useMemo(() => {
    const groups: Record<ReceptionPeriod, PeriodAppointment[]> = {
      Manhã: [],
      Tarde: [],
    };

    todayAppointments.forEach((appointment) => {
      const slot = slotsByNumber.get(appointment.slot_number);
      const timeLabel = slot?.time || getSlotLabel(appointment.slot_number);
      const period = slot?.period === 'Tarde' ? 'Tarde' : slot?.period === 'Manhã' ? 'Manhã' : inferReceptionPeriod(timeLabel);

      groups[period].push({
        appointment,
        timeLabel,
      });
    });

    return [
      {
        period: 'Manhã' as const,
        icon: <Sun className="size-4 text-yellow-400" />,
        accentClass: 'border-yellow-400/20 bg-yellow-400/5',
        appointments: groups.Manhã,
      },
      {
        period: 'Tarde' as const,
        icon: <Moon className="size-4 text-indigo-400" />,
        accentClass: 'border-indigo-400/20 bg-indigo-400/5',
        appointments: groups.Tarde,
      },
    ].filter((group) => group.appointments.length > 0);
  }, [getSlotLabel, slotsByNumber, todayAppointments]);

  const availablePeriods = useMemo(() => {
    const periods = new Set<ReportPeriodFilter>();
    slots.forEach((slot) => {
      if (slot.period === 'Manhã' || slot.period === 'Tarde') {
        periods.add(slot.period);
      }
    });
    return Array.from(periods);
  }, [slots]);

  const shouldShowPeriodMenu = availablePeriods.length > 1;
  const selectedDateIso = selectedDate.toISOString().slice(0, 10);
  const selectedDateLabel = selectedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const selectedWeekdayLabel = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
  });
  const isSelectedDateToday = isSameLocalDay(selectedDate, new Date());
  const selectedDateContextLabel = `${isSelectedDateToday ? 'HOJE' : selectedWeekdayLabel.slice(0, 3).toUpperCase()} • ${selectedDate.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  })}`;
  const handleReportPrint = (period?: ReportPeriodFilter) => {
    printAppointmentReport(slots, period);
    setIsReportMenuOpen(false);
  };

  const handleReportButtonClick = () => {
    if (shouldShowPeriodMenu) {
      const reportButtonRect = reportMenuRef.current?.getBoundingClientRect();
      if (reportButtonRect) {
        setReportMenuPosition({
          top: reportButtonRect.bottom + 8,
          right: window.innerWidth - reportButtonRect.right,
        });
      }
      setIsReportMenuOpen((prev) => !prev);
      return;
    }
    handleReportPrint(availablePeriods[0]);
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado!`);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  useEffect(() => {
    if (!isReportMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const clickedOutsideTrigger = !reportMenuRef.current || !reportMenuRef.current.contains(targetNode);
      const clickedOutsidePopup = !reportPopupRef.current || !reportPopupRef.current.contains(targetNode);

      if (clickedOutsideTrigger && clickedOutsidePopup) {
        setIsReportMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsReportMenuOpen(false);
      }
    };
    const closeReportMenu = () => setIsReportMenuOpen(false);

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', closeReportMenu);
    window.addEventListener('scroll', closeReportMenu, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', closeReportMenu);
      window.removeEventListener('scroll', closeReportMenu, true);
    };
  }, [isReportMenuOpen]);

  return (
    <SectionCard
      title="Fluxo de pacientes"
      subtitle={`${selectedWeekdayLabel} • ${presenceSummary.total} ficha${presenceSummary.total === 1 ? '' : 's'} no dia`}
      icon={<Users2 className="size-5" />}
      className={cn("flex h-full flex-col border-0 shadow-none rounded-none bg-transparent", className)}
      headerClassName="shrink-0 flex-col items-stretch gap-3 border-border/50 bg-background/55 px-4 py-3 backdrop-blur-xl xl:flex-row xl:items-center"
      headerActionsClassName="w-full xl:w-auto"
      iconClassName="border-primary/20 bg-primary/10 text-primary shadow-primary/10"
      titleClassName="text-lg sm:text-xl"
      contentClassName="p-0 flex-1 flex flex-col min-h-0"
      headerActions={
        <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5 sm:justify-end">
          <DatePicker
            value={selectedDateIso}
            onChange={(value) => {
              const [year, month, day] = value.split('-').map(Number);
              changeDate(new Date(year, month - 1, day, 12, 0, 0, 0));
            }}
          >
            {({ open }) => (
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button size="xs" variant="ghost" onClick={open} className="h-9 rounded-xl border-border/60 bg-background/55 px-3 text-[11px] shadow-sm hover:border-primary/30 hover:bg-primary/5" aria-label={`Alterar data do fluxo: ${selectedDateLabel}`}>
                  <Calendar className="size-3.5" /> {selectedDateContextLabel}
                </Button>
              </motion.div>
            )}
          </DatePicker>
          {!isSelectedDateToday && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button size="xs" variant="ghost" onClick={goToToday} className="h-9 rounded-xl border-border/60 bg-background/55 px-3 text-[11px] shadow-sm hover:border-primary/30 hover:bg-primary/5">
                Hoje
              </Button>
            </motion.div>
          )}
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button size="xs" variant="ghost" onClick={refresh} className="h-9 rounded-xl border-border/60 bg-background/55 px-3 text-[11px] shadow-sm hover:border-primary/30 hover:bg-primary/5" aria-label="Atualizar fluxo de pacientes">
              <RefreshCcw className={cn("size-3.5", isLoading && "animate-spin")} /> Atualizar
            </Button>
          </motion.div>
          <div ref={reportMenuRef} className="relative">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button size="xs" variant="ghost" onClick={handleReportButtonClick} className="h-9 rounded-xl border-border/60 bg-background/55 px-3 text-[11px] shadow-sm hover:border-primary/30 hover:bg-primary/5" aria-expanded={isReportMenuOpen}>
                <Printer className="size-3.5" /> Relatório
                {shouldShowPeriodMenu && <ChevronDown className={cn("size-3.5 transition-transform", isReportMenuOpen && "rotate-180")} />}
              </Button>
            </motion.div>
          </div>
        </div>
      }
    >
      {createPortal(
        <AnimatePresence>
          {isReportMenuOpen && reportMenuPosition && (
            <motion.div
              ref={reportPopupRef}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              style={{ top: reportMenuPosition.top, right: reportMenuPosition.right }}
              className="fixed z-[70] min-w-[190px] rounded-xl border border-border/60 bg-background/95 p-1.5 shadow-2xl backdrop-blur-xl"
            >
              <button type="button" onClick={() => handleReportPrint()} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                Dia inteiro
              </button>
              {availablePeriods.map((period) => (
                <button key={period} type="button" onClick={() => handleReportPrint(period)} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  Turno da {period.toLowerCase()}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
      <div className="flex flex-1 flex-col min-h-0">
        <div className="grid grid-cols-2 gap-3 border-b border-border/40 bg-muted/15 p-4 sm:grid-cols-4 shrink-0">
          <SummaryTile label="Total" value={presenceSummary.total} icon={<Users2 className="size-4" />} tone="neutral" />
          <SummaryTile label="Presentes" value={presenceSummary.showedUp} icon={<UserRoundCheck className="size-4" />} tone="primary" />
          <SummaryTile label="Agendados" value={presenceSummary.scheduled} icon={<CircleDashed className="size-4" />} tone="neutral" />
          <SummaryTile label="Faltas" value={presenceSummary.noShow} icon={<UserRoundX className="size-4" />} tone="amber" />
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
          <AnimatePresence initial={false}>
            {appointmentGroups.map((group) => (
              <motion.section
                key={group.period}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="mb-5 last:mb-0"
              >
                <div className={cn("mb-3 flex items-center gap-3 rounded-xl border px-4 py-2.5 shadow-sm backdrop-blur-sm", group.accentClass)}>
                  {group.icon}
                  <h3 className="flex-1 text-sm font-bold text-card-foreground">{group.period}</h3>
                  <span className="text-xs font-medium text-muted-foreground">
                    {group.appointments.length} paciente{group.appointments.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.appointments.map(({ appointment, timeLabel }) => {
                    const documentInfo = formatPatientDocument(appointment.document_type, appointment.document_value);
                    const documentDigits = appointment.document_value.replace(/\D/g, '');
                    const isPresent = appointment.status === 'Compareceu';
                    const isNoShow = appointment.status === 'Faltou';
                    const isScheduled = appointment.status === 'Agendado';

                    return (
                      <motion.div
                        key={appointment.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                          "group flex flex-col gap-3 rounded-xl border border-border/60 bg-background/60 p-3.5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-background/80 hover:shadow-lg hover:shadow-black/10 sm:flex-row sm:items-center sm:justify-between",
                          isPresent && "border-primary/30 bg-primary/5 shadow-primary/5",
                          isNoShow && "border-border/40 bg-muted/5 opacity-80"
                        )}
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start">
                          <div className="flex shrink-0 gap-2">
                            <div
                              className={cn(
                                "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-inner",
                                isNoShow && "border-muted-foreground/20 bg-muted/20 text-muted-foreground",
                                isPresent && "border-primary/30 bg-primary/15"
                              )}
                              aria-label={`Ficha ${appointment.slot_number}`}
                            >
                              <span className="text-2xl font-black leading-none tabular-nums">
                                {appointment.slot_number}
                              </span>
                            </div>

                            <div
                              className={cn(
                                "flex h-14 min-w-[74px] flex-col items-center justify-center rounded-lg border border-border/60 bg-background/70 px-2.5 text-card-foreground shadow-sm",
                                isPresent && "border-primary/20 bg-primary/5",
                                isNoShow && "bg-background/45"
                              )}
                              aria-label={`Horário ${timeLabel}`}
                            >
                              <div className="flex items-center gap-1">
                                <Clock className="size-3 text-primary/80" />
                                <span className="text-sm font-black leading-none tabular-nums">
                                  {timeLabel}
                                </span>
                              </div>
                              {isScheduled && (
                                <span className="mt-1 rounded-full border border-border/70 bg-secondary/60 px-1.5 py-0.5 text-[8px] font-black uppercase leading-none text-muted-foreground">
                                  Agendado
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopy(appointment.patient_name, 'Nome')}
                                className="group/name inline-flex min-w-0 items-center gap-1.5 rounded-lg text-left text-base font-extrabold text-card-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:truncate"
                                title="Toque para copiar o nome"
                              >
                                <span className="min-w-0 sm:truncate">{appointment.patient_name}</span>
                                <Copy className="size-3.5 shrink-0 text-muted-foreground/45 transition-colors group-hover/name:text-primary" />
                              </button>
                            </div>

                            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopy(documentDigits || appointment.document_value, 'Documento')}
                                className={cn(
                                  "inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-2.5 py-1.5 text-left text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                  isPresent && "border-primary/20 bg-primary/5",
                                  isNoShow && "bg-background/45"
                                )}
                                title={`Toque para copiar ${documentInfo.label}: ${documentInfo.value}`}
                              >
                                <FileText className="size-4 shrink-0 text-primary/80" />
                                <span className="shrink-0 text-[11px] font-black text-muted-foreground">
                                  {documentInfo.label}
                                </span>
                                <span className="min-w-0 break-all font-bold text-card-foreground">
                                  {documentInfo.value}
                                </span>
                                <Copy className="size-3.5 shrink-0 text-muted-foreground/45" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:w-[280px] sm:shrink-0">
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => updateStatus(appointment.id, 'Compareceu')}
                            className={cn(
                              "inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black text-primary shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              "border-primary/25 bg-primary/10 hover:border-primary/45 hover:bg-primary/15 hover:shadow-primary/10",
                              isPresent && "border-primary/50 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                            )}
                            aria-pressed={isPresent}
                          >
                            <UserRoundCheck className="size-4 shrink-0" />
                            <span>PRESENTE</span>
                          </motion.button>

                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => updateStatus(appointment.id, 'Faltou')}
                            className={cn(
                              "inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              "border-amber-400/30 bg-amber-500/10 text-amber-300 hover:border-amber-300/50 hover:bg-amber-500/15 hover:text-amber-200 hover:shadow-amber-500/10",
                              isNoShow && "border-amber-400/60 bg-amber-500/20 text-amber-100 shadow-md shadow-amber-500/10"
                            )}
                            aria-pressed={isNoShow}
                          >
                            <UserRoundX className="size-4 shrink-0" />
                            <span>FALTA</span>
                          </motion.button>

                          {!isScheduled && (
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.98 }}
                              onClick={() => updateStatus(appointment.id, 'Agendado')}
                              className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border/70 bg-background/55 px-3 text-[10px] font-black uppercase text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                              <RefreshCcw className="size-3.5 shrink-0" />
                              <span>Voltar para agendado</span>
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            ))}
          </AnimatePresence>

          {isLoading && todayAppointments.length === 0 && (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-28 rounded-xl border border-border/50 bg-background/45 p-3.5 shadow-sm"
                >
                  <div className="flex h-full gap-3">
                    <div className="h-14 w-14 rounded-lg bg-muted/60 animate-pulse" />
                    <div className="flex flex-1 flex-col justify-center gap-3">
                      <div className="h-4 w-2/5 rounded-full bg-muted/70 animate-pulse" />
                      <div className="h-8 w-3/5 rounded-lg bg-muted/45 animate-pulse" />
                    </div>
                    <div className="hidden w-64 grid-cols-2 gap-2 sm:grid">
                      <div className="rounded-xl bg-muted/50 animate-pulse" />
                      <div className="rounded-xl bg-muted/50 animate-pulse" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!isLoading && todayAppointments.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/35 px-6 py-12 text-center"
            >
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
                <Users2 className="size-7" />
              </div>
              <p className="text-base font-black text-card-foreground">Nenhum paciente na fila</p>
              <p className="mt-1 max-w-sm text-sm font-medium text-muted-foreground">
                Quando houver fichas para este dia, elas aparecerão aqui separadas por turno.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </SectionCard>
  );
};
