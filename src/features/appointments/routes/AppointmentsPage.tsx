import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Search,
  Plus,
  RefreshCw,
  Ban,
  Printer,
  X,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Route,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { useAppointments } from '../hooks/useAppointments';
import DateSelector from '../components/DateSelector';
import SlotsList from '../components/SlotsList';
import AddAppointmentForm from '../components/AddAppointmentForm';
import EditAppointmentModal from '../components/EditAppointmentModal';
import RescheduleAppointmentModal from '../components/RescheduleAppointmentModal';
import BulkRescheduleModal from '../components/BulkRescheduleModal';
import ConfirmDeleteAppointmentModal from '../components/ConfirmDeleteAppointmentModal';
import PrintHeader from '../components/PrintHeader';
import { printPatientList } from '@/components/PatientQueue/printUtils';
import { printAppointmentReport, type ReportPeriodFilter } from '@/components/PatientQueue/printReportUtils';
import { printHomeVisitRoute } from '@/components/PatientQueue/printHomeVisitRouteUtils';
import { PageShell } from '@/components/layout';
import { Badge } from '@/components/ui';
import type { Appointment, AppointmentStatus } from '@/types';
import { toast } from 'sonner';
import { blockDay, getAppointmentStatus, isBlockedAppointment } from '../services/appointmentService';
import { BlockDayModal } from '../components/BlockDayModal';
import AppointmentsNav from '../components/AppointmentsNav';
import { printAppointmentConfirmationPdf } from '../utils/printAppointmentConfirmationPdf';

const normalizeText = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const AppointmentsPage: React.FC = () => {
  const {
    selectedDate,
    dayConfig,
    slots,
    releasedAppointments,
    isLoading,
    slotStats,
    addAppointment,
    editAppointment,
    removeAppointment,
    updateStatus,
    reschedule,
    bulkReschedule,
    changeDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    refresh,
  } = useAppointments();

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [initialSlotForAdd, setInitialSlotForAdd] = useState<number | undefined>();
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [isBulkRescheduleModalOpen, setIsBulkRescheduleModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBlockDayModalOpen, setIsBlockDayModalOpen] = useState(false);
  const [isBlockingDay, setIsBlockingDay] = useState(false);
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
  const [isPatientListMenuOpen, setIsPatientListMenuOpen] = useState(false);
  const [reportMenuPosition, setReportMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [patientListMenuPosition, setPatientListMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const reportMenuRef = useRef<HTMLDivElement | null>(null);
  const patientListMenuRef = useRef<HTMLDivElement | null>(null);
  const reportPopupRef = useRef<HTMLDivElement | null>(null);
  const patientListPopupRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const availableSlots = slots.filter(s => s.appointment === null).map(s => s.slotNumber);
  const bulkRescheduleAppointments = slots
    .map(slot => slot.appointment)
    .filter((appointment): appointment is Appointment =>
      Boolean(appointment) &&
      getAppointmentStatus(appointment) === 'Agendado' &&
      !isBlockedAppointment(appointment)
    );

  const filteredSlots = slots.filter(slot => {
    if (!searchQuery) return true;
    if (!slot.appointment) return false;
    const query = normalizeText(searchQuery);
    const apt = slot.appointment;
    return (
      normalizeText(apt.patient_name).includes(query) ||
      normalizeText(apt.document_value).includes(query) ||
      normalizeText(apt.acs_name).includes(query) ||
      normalizeText(getAppointmentStatus(apt)).includes(query) ||
      normalizeText(apt.home_visit_address || '').includes(query) ||
      normalizeText(apt.home_visit_reference || '').includes(query) ||
      normalizeText(apt.home_visit_reason || '').includes(query)
    );
  });

  const filteredReleasedAppointments = releasedAppointments.filter(appointment => {
    if (!searchQuery) return true;
    const query = normalizeText(searchQuery);
    return (
      normalizeText(appointment.patient_name).includes(query) ||
      normalizeText(appointment.document_value).includes(query) ||
      normalizeText(appointment.acs_name).includes(query) ||
      normalizeText(getAppointmentStatus(appointment)).includes(query) ||
      normalizeText(appointment.home_visit_address || '').includes(query) ||
      normalizeText(appointment.home_visit_reference || '').includes(query) ||
      normalizeText(appointment.home_visit_reason || '').includes(query)
    );
  });

  const handleAddClick = (slotNumber?: number) => {
    setInitialSlotForAdd(slotNumber);
    setIsAddFormOpen(true);
  };

  const handleEditClick = (appointment: Appointment) => setEditingAppointment(appointment);

  const handleDeleteClick = (appointment: Appointment) => {
    if (isBlockedAppointment(appointment)) {
      setDeletingAppointment(appointment);
      return;
    }
    void handleStatusChange(appointment, 'Faltou');
  };

  const handleStatusChange = async (appointment: Appointment, status: AppointmentStatus) => {
    if (getAppointmentStatus(appointment) === status) return;
    await updateStatus(appointment.id, status);
  };

  const handleRescheduleClick = (appointment: Appointment) => setReschedulingAppointment(appointment);

  const handleConfirmationPdfClick = async (appointment: Appointment) => {
    try {
      await printAppointmentConfirmationPdf(appointment);
    } catch (error) {
      console.error('Erro ao gerar PDF de confirmação:', error);
      toast.error('Erro ao gerar PDF de confirmação.');
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingAppointment) {
      await removeAppointment(deletingAppointment.id);
      setDeletingAppointment(null);
    }
  };

  const handleBlockDay = async (reason: string, startSlot?: number, endSlot?: number) => {
    setIsBlockingDay(true);
    try {
      const count = await blockDay(selectedDate, reason, startSlot, endSlot);
      if (count > 0) {
        toast.success(`${count} horários bloqueados com sucesso!`);
        await refresh();
      } else {
        toast.info('Não havia horários vazios para bloquear.');
      }
      setIsBlockDayModalOpen(false);
    } catch (error) {
      console.error('Erro ao bloquear dia:', error);
      toast.error('Erro ao bloquear o dia. Tente novamente.');
    } finally {
      setIsBlockingDay(false);
    }
  };

  const occupancyPct = slotStats.total > 0
    ? Math.round((slotStats.occupied / slotStats.total) * 100)
    : 0;
  const isHomeVisit = dayConfig.serviceType === 'HOME_VISIT';
  const occupiedPatientSlots = slots.filter(slot =>
    slot.appointment && !isBlockedAppointment(slot.appointment)
  );
  const blockedSlotsCount = slots.filter(slot =>
    slot.appointment && isBlockedAppointment(slot.appointment)
  ).length;
  const attendedCount = occupiedPatientSlots.filter(slot =>
    slot.appointment && getAppointmentStatus(slot.appointment) === 'Compareceu'
  ).length;
  const scheduledCount = occupiedPatientSlots.filter(slot =>
    slot.appointment && getAppointmentStatus(slot.appointment) === 'Agendado'
  ).length;
  const serviceLabel = dayConfig.hasService
    ? dayConfig.serviceType === 'HOME_VISIT'
      ? 'Visitas domiciliares'
      : 'Atendimento na UBS'
    : 'Sem atendimento';
  const selectedDateLabel = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const nextAvailableSlot = availableSlots.length > 0
    ? slots.find(slot => slot.slotNumber === availableSlots[0])
    : undefined;
  const nextAvailableLabel = nextAvailableSlot
    ? `Ficha ${nextAvailableSlot.slotNumber}${nextAvailableSlot.time ? ` · ${nextAvailableSlot.time}` : ''}`
    : 'Agenda completa';
  const visibleResultsCount = filteredSlots.filter(slot => slot.appointment && !isBlockedAppointment(slot.appointment)).length;

  const reportPeriods = useMemo(() => {
    const periods = new Set<ReportPeriodFilter>();
    slots.forEach(slot => {
      if (slot.period === 'Manhã' || slot.period === 'Tarde') {
        periods.add(slot.period);
      }
    });
    return Array.from(periods);
  }, [slots]);

  const shouldShowReportMenu = reportPeriods.length > 1;

  const handleReportPrint = (period?: ReportPeriodFilter) => {
    printAppointmentReport(slots, { periodFilter: period, selectedDate });
    setIsReportMenuOpen(false);
    setIsPatientListMenuOpen(false);
  };

  const handleReportButtonClick = () => {
    if (shouldShowReportMenu) {
      const rect = reportMenuRef.current?.getBoundingClientRect();
      if (rect) {
        setReportMenuPosition({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
      setIsReportMenuOpen(prev => !prev);
      setIsPatientListMenuOpen(false);
      return;
    }

    const singlePeriod = reportPeriods[0];
    handleReportPrint(singlePeriod);
  };

  const handlePatientListPrint = (period?: ReportPeriodFilter) => {
    printPatientList(slots, period);
    setIsPatientListMenuOpen(false);
    setIsReportMenuOpen(false);
  };

  const handlePatientListButtonClick = () => {
    if (shouldShowReportMenu) {
      const rect = patientListMenuRef.current?.getBoundingClientRect();
      if (rect) {
        setPatientListMenuPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
      setIsPatientListMenuOpen(prev => !prev);
      setIsReportMenuOpen(false);
      return;
    }

    const singlePeriod = reportPeriods[0];
    handlePatientListPrint(singlePeriod);
  };

  const focusSearchInput = () => {
    setIsSearchOpen(true);
    window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  useEffect(() => {
    if (!isReportMenuOpen && !isPatientListMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      
      const clickedOutsideReportTrigger = !reportMenuRef.current || !reportMenuRef.current.contains(targetNode);
      const clickedOutsideReportPopup = !reportPopupRef.current || !reportPopupRef.current.contains(targetNode);
      const clickedOutsidePatientListTrigger = !patientListMenuRef.current || !patientListMenuRef.current.contains(targetNode);
      const clickedOutsidePatientListPopup = !patientListPopupRef.current || !patientListPopupRef.current.contains(targetNode);

      if (clickedOutsideReportTrigger && clickedOutsideReportPopup) {
        setIsReportMenuOpen(false);
      }
      
      if (clickedOutsidePatientListTrigger && clickedOutsidePatientListPopup) {
        setIsPatientListMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsReportMenuOpen(false);
        setIsPatientListMenuOpen(false);
      }
    };

    const closeAll = () => {
      setIsReportMenuOpen(false);
      setIsPatientListMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', closeAll);
    window.addEventListener('scroll', closeAll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', closeAll);
      window.removeEventListener('scroll', closeAll, true);
    };
  }, [isReportMenuOpen, isPatientListMenuOpen]);

  return (
    <PageShell
      desktopContained
      className="flex flex-col gap-5 bg-[linear-gradient(180deg,#F4F6F8_0%,#EFF8F6_100%)] px-4 py-4 pb-[13rem] print:max-w-none md:pb-28 lg:h-full lg:!overflow-y-auto lg:px-5 lg:py-5 lg:pb-5 xl:!overflow-hidden"
    >
      {/* Print header */}
      <PrintHeader selectedDate={selectedDate} dayConfig={dayConfig} slotStats={slotStats} />

      {/* ══════════════ OPERATION HEADER ══════════════ */}
      <header className="relative shrink-0 overflow-hidden rounded-[1.6rem] border border-white/80 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(0,27,61,0.07)] print:hidden lg:px-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#1466F5_0%,#00BB94_100%)]" aria-hidden="true" />
        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)] xl:items-center">
          <div className="min-w-0">
            <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-[#CFEDE6] bg-[#E6F7F2] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#007A65]">
              <span className="size-2 rounded-full bg-[#00BB94]" />
              Agenda APS em tempo real
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-normal text-[#001B3D] lg:text-[2.25rem]">
              Marcações
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-5 text-[#64748B]">
              Controle de fichas, visitas, presença e remarcações com leitura rápida para a rotina da unidade.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#334155]">
              <StatusChip icon={<Stethoscope className="size-4 text-[#00A885]" />} label={serviceLabel} />
              <StatusChip icon={<ShieldCheck className="size-4 text-[#1466F5]" />} label={selectedDateLabel} />
              {dayConfig.hasService && (
                <StatusChip
                  icon={availableSlots.length > 0
                    ? <Zap className="size-4 text-[#00A885]" />
                    : <CheckCircle2 className="size-4 text-[#F59E0B]" />
                  }
                  label={`Próxima livre: ${nextAvailableLabel}`}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:gap-3">
            <MetricCard
              label={isHomeVisit ? 'Visitas' : 'Fichas'}
              value={dayConfig.hasService ? slotStats.total : 0}
              helper={dayConfig.hasService ? 'capacidade do dia' : 'sem agenda'}
              icon={<Users className="size-4 text-[#1466F5]" />}
              tone="blue"
            />
            <MetricCard
              label="Ocupação"
              value={`${occupancyPct}%`}
              helper={`${slotStats.occupied}/${slotStats.total || 0} em uso`}
              icon={<TrendingUp className="size-4 text-[#00A885]" />}
              tone="green"
            />
            <MetricCard
              label="Livres"
              value={dayConfig.hasService ? slotStats.available : 0}
              helper={dayConfig.hasService ? nextAvailableLabel : 'indisponível'}
              icon={<Clock3 className="size-4 text-[#0F5AD8]" />}
              tone="softBlue"
            />
            <MetricCard
              label="Compareceu"
              value={attendedCount}
              helper={`${scheduledCount} agendado(s)`}
              icon={<Activity className="size-4 text-[#007A65]" />}
              tone="neutral"
            />
          </div>
        </div>

        <div className="relative mt-5 flex flex-col gap-3 border-t border-[#EEF3F7] pt-4 md:flex-row md:items-center md:justify-between">
          <AppointmentsNav />
          {dayConfig.hasService && (
            <button
              onClick={() => handleAddClick()}
              disabled={availableSlots.length === 0 || isLoading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] bg-[#00BB94] px-6 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(0,187,148,0.22)] transition-all hover:bg-[#00A885] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 md:min-w-48"
            >
              <Plus className="size-5" />
              {isHomeVisit ? 'Nova Visita' : 'Nova Marcação'}
            </button>
          )}
        </div>
      </header>

      {/* ══════════════ MAIN LAYOUT ══════════════ */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 print:block xl:grid-cols-[minmax(300px,0.78fr)_minmax(520px,1.42fr)] xl:overflow-hidden">

        {/* ── CONTROLS ── */}
        <aside className="space-y-4 print:hidden xl:min-h-0 xl:overflow-y-auto xl:pr-1 custom-scrollbar">
          <DateSelector
            selectedDate={selectedDate}
            dayConfig={dayConfig}
            onPreviousDay={goToPreviousDay}
            onNextDay={goToNextDay}
            onToday={goToToday}
            onDateChange={changeDate}
          />

          {dayConfig.hasService && (
            <section className="overflow-hidden rounded-[1.35rem] border border-white/80 bg-white shadow-[0_16px_44px_rgba(0,27,61,0.06)]">
              <div className="border-b border-[#EEF3F7] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-[#001B3D]">Resumo operacional</h2>
                    <p className="mt-1 text-xs font-semibold text-[#64748B]">
                      Status do dia e ações de apoio
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    occupancyPct >= 90
                      ? 'bg-[#FFF1F2] text-[#B42318]'
                      : occupancyPct >= 60
                        ? 'bg-[#FFF7E6] text-[#9A5A00]'
                        : 'bg-[#E6F7F2] text-[#007A65]'
                  }`}>
                    {occupancyPct}%
                  </span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#E9EDF1]">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      occupancyPct >= 90
                        ? 'bg-[#D9474F]'
                        : occupancyPct >= 60
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#00BB94]'
                    }`}
                    style={{ width: `${occupancyPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-4">
                <StatPill label="Pacientes" value={occupiedPatientSlots.length} color="green" />
                <StatPill label="Livres" value={slotStats.available} color="blue" />
                <StatPill label="Bloqueios" value={blockedSlotsCount} color="warning" />
                <StatPill label="Remarcadas" value={releasedAppointments.length} color="neutral" />
              </div>

              <div className="grid gap-2 border-t border-[#EEF3F7] p-4">
                {isHomeVisit ? (
                  <DesktopActionButton
                    icon={<Route className="w-4 h-4" />}
                    label="Imprimir roteiro"
                    onClick={() => printHomeVisitRoute(slots, selectedDate)}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative" ref={reportMenuRef}>
                      <DesktopActionButton
                        icon={<Printer className="w-4 h-4" />}
                        label="Relatório"
                        onClick={handleReportButtonClick}
                      />
                    </div>
                    <div className="relative" ref={patientListMenuRef}>
                      <DesktopActionButton
                        icon={<FileText className="w-4 h-4" />}
                        label="Ficha"
                        onClick={handlePatientListButtonClick}
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <DesktopActionButton
                    icon={<Ban className="w-4 h-4 text-[#D9474F]" />}
                    label="Bloquear"
                    onClick={() => setIsBlockDayModalOpen(true)}
                    disabled={isLoading}
                  />
                  <DesktopActionButton
                    icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
                    label="Atualizar"
                    onClick={refresh}
                    disabled={isLoading}
                  />
                </div>
                <DesktopActionButton
                  icon={<CalendarDays className="w-4 h-4 text-[#F59E0B]" />}
                  label="Reagendar dia"
                  onClick={() => setIsBulkRescheduleModalOpen(true)}
                  disabled={isLoading || bulkRescheduleAppointments.length === 0}
                />
              </div>
            </section>
          )}
        </aside>

        {/* ── AGENDA ── */}
        <main className="min-w-0 pb-4 print:pb-0 xl:min-h-0 xl:overflow-y-auto custom-scrollbar">
          <section className="min-h-full rounded-[1.35rem] border border-white/80 bg-white/86 p-3 shadow-[0_16px_44px_rgba(0,27,61,0.06)] backdrop-blur sm:p-4 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
            {dayConfig.hasService && (
              <div className="mb-4 rounded-[1.1rem] border border-[#DCE5EE] bg-white p-3 shadow-[0_10px_28px_rgba(0,27,61,0.04)] print:hidden">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#007A65]">
                      <span className="size-2 rounded-full bg-[#00BB94]" />
                      Agenda do dia
                    </div>
                    <h2 className="mt-1 text-xl font-extrabold text-[#001B3D]">
                      {isHomeVisit ? 'Visitas programadas' : 'Fichas de atendimento'}
                    </h2>
                  </div>

                  <div className="w-full lg:max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Buscar paciente, CPF, CNS ou ACS..."
                        value={searchQuery}
                        onFocus={() => setIsSearchOpen(true)}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-12 w-full rounded-[0.95rem] border border-[#DCE5EE] bg-[#F8FAFC] py-3 pl-10 pr-10 text-sm font-semibold text-[#001B3D] placeholder:text-[#64748B] transition-colors focus:border-[#00BB94] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#00BB94]/10"
                      />
                      {(searchQuery || isSearchOpen) && (
                        <button
                          onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                          className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[#64748B] transition-colors hover:bg-[#E9EDF1] hover:text-[#001B3D]"
                          aria-label="Limpar busca"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <p className="mt-2 text-xs font-semibold text-[#64748B]">
                        {visibleResultsCount} resultado(s) na agenda ativa
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <SlotsList
              slots={filteredSlots}
              dayConfig={dayConfig}
              onAddClick={handleAddClick}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
              onStatusChange={handleStatusChange}
              onRescheduleClick={handleRescheduleClick}
              onConfirmationPdfClick={handleConfirmationPdfClick}
              isLoading={isLoading}
            />

            <ReleasedAppointmentsSection appointments={filteredReleasedAppointments} />
          </section>
        </main>
      </div>

      {/* ══════════════ MOBILE BOTTOM TOOLBAR ══════════════ */}
      {dayConfig.hasService && (
        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] z-[60] md:hidden print:hidden">
          <div className="border-t border-[#CFEDE6] bg-[#EFF8F6]/96 px-4 pb-3 pt-3 shadow-[0_-18px_44px_rgba(0,27,61,0.14)] backdrop-blur-xl">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center max-w-xl mx-auto">
              <button
                onClick={() => handleAddClick()}
                disabled={availableSlots.length === 0 || isLoading}
                className="flex h-12 items-center justify-center gap-2 rounded-[0.95rem] bg-[#00BB94] text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(0,187,148,0.22)] transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                {isHomeVisit ? 'Nova Visita' : 'Nova Marcação'}
              </button>

              <button
                onClick={focusSearchInput}
                className="flex h-12 w-12 items-center justify-center rounded-[0.95rem] border border-[#DCE5EE] bg-[#F8FAFC] transition-all active:scale-95"
                aria-label="Buscar"
              >
                <Search className={`w-5 h-5 ${isSearchOpen ? 'text-[#00A885]' : 'text-[#64748B]'}`} />
              </button>

              <button
                onClick={() => setIsBlockDayModalOpen(true)}
                disabled={isLoading}
                className="flex h-12 w-12 items-center justify-center rounded-[0.95rem] border border-[#DCE5EE] bg-[#F8FAFC] transition-all active:scale-95 disabled:opacity-50"
                aria-label="Bloquear dia"
              >
                <Ban className="w-5 h-5 text-[#D9474F]" />
              </button>

              <button
                onClick={() => setIsBulkRescheduleModalOpen(true)}
                disabled={isLoading || bulkRescheduleAppointments.length === 0}
                className="flex h-12 w-12 items-center justify-center rounded-[0.95rem] border border-[#DCE5EE] bg-[#F8FAFC] transition-all active:scale-95 disabled:opacity-50"
                aria-label="Reagendar dia"
              >
                <CalendarDays className="w-5 h-5 text-[#F59E0B]" />
              </button>

              <button
                onClick={refresh}
                disabled={isLoading}
                className="flex h-12 w-12 items-center justify-center rounded-[0.95rem] border border-[#DCE5EE] bg-[#F8FAFC] transition-all active:scale-95 disabled:opacity-50"
                aria-label="Atualizar"
              >
                <RefreshCw className={`w-5 h-5 text-[#64748B] ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="pb-1" />
          </div>
        </div>
      )}

      {/* ══════════════ MODALS ══════════════ */}
      {isAddFormOpen && (
        <AddAppointmentForm
          selectedDate={selectedDate}
          availableSlots={availableSlots}
          onAdd={addAppointment}
          onCancel={() => { setIsAddFormOpen(false); setInitialSlotForAdd(undefined); }}
          isLoading={isLoading}
          initialSlot={initialSlotForAdd}
        />
      )}

      {editingAppointment && (
        <EditAppointmentModal
          appointment={editingAppointment}
          onSave={editAppointment}
          onClose={() => setEditingAppointment(null)}
          isLoading={isLoading}
        />
      )}

      {reschedulingAppointment && (
        <RescheduleAppointmentModal
          appointment={reschedulingAppointment}
          onConfirm={reschedule}
          onClose={() => setReschedulingAppointment(null)}
          isLoading={isLoading}
        />
      )}

      {isBulkRescheduleModalOpen && (
        <BulkRescheduleModal
          sourceDate={selectedDate}
          sourceConfig={dayConfig}
          appointments={bulkRescheduleAppointments}
          onConfirm={bulkReschedule}
          onClose={() => setIsBulkRescheduleModalOpen(false)}
          isLoading={isLoading}
        />
      )}

      {deletingAppointment && (
        <ConfirmDeleteAppointmentModal
          patientName={deletingAppointment.patient_name}
          slotNumber={deletingAppointment.slot_number}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingAppointment(null)}
          isLoading={isLoading}
        />
      )}

      {isBlockDayModalOpen && (
        <BlockDayModal
          date={selectedDate}
          dayConfig={dayConfig}
          onConfirm={handleBlockDay}
          onClose={() => setIsBlockDayModalOpen(false)}
          isLoading={isBlockingDay}
        />
      )}
      {createPortal(
        <AnimatePresence>
          {isReportMenuOpen && reportMenuPosition && (
            <motion.div
              ref={reportPopupRef}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              style={{ top: reportMenuPosition.top, left: reportMenuPosition.left }}
              className="fixed z-[70] w-56 rounded-[1rem] border border-[#DCE5EE] bg-white/95 p-1.5 shadow-[0_20px_50px_rgba(0,27,61,0.16)] backdrop-blur-xl"
            >
              <button
                onClick={() => handleReportPrint()}
                className="w-full rounded-[0.8rem] px-3 py-2.5 text-left text-xs font-black uppercase tracking-wider text-[#007A65] transition-all hover:bg-[#E6F7F2] active:scale-[0.98]"
              >
                Imprimir dia inteiro
              </button>
              <div className="h-px bg-[#EEF3F7] my-1 mx-1" />
              {reportPeriods.map(period => (
                <button
                  key={period}
                  onClick={() => handleReportPrint(period)}
                  className="w-full rounded-[0.8rem] px-3 py-2 text-left text-xs font-bold text-[#001B3D] transition-all hover:bg-[#EAF3FF] active:scale-[0.98]"
                >
                  Turno da {period.toLowerCase()}
                </button>
              ))}
            </motion.div>
          )}

          {isPatientListMenuOpen && patientListMenuPosition && (
            <motion.div
              ref={patientListPopupRef}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              style={{ top: patientListMenuPosition.top, right: patientListMenuPosition.right }}
              className="fixed z-[70] w-56 rounded-[1rem] border border-[#DCE5EE] bg-white/95 p-1.5 shadow-[0_20px_50px_rgba(0,27,61,0.16)] backdrop-blur-xl"
            >
              <button
                onClick={() => handlePatientListPrint()}
                className="w-full rounded-[0.8rem] px-3 py-2.5 text-left text-xs font-black uppercase tracking-wider text-[#007A65] transition-all hover:bg-[#E6F7F2] active:scale-[0.98]"
              >
                Imprimir dia inteiro
              </button>
              <div className="h-px bg-[#EEF3F7] my-1 mx-1" />
              {reportPeriods.map(period => (
                <button
                  key={period}
                  onClick={() => handlePatientListPrint(period)}
                  className="w-full rounded-[0.8rem] px-3 py-2 text-left text-xs font-bold text-[#001B3D] transition-all hover:bg-[#EAF3FF] active:scale-[0.98]"
                >
                  Turno da {period.toLowerCase()}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </PageShell>
  );
};

/* ─── Header Helpers ───────────────────────────────────────────────────── */

const StatusChip = ({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) => (
  <div className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-[#DCE5EE] bg-[#F8FAFC] px-3 py-1.5">
    <span className="shrink-0">{icon}</span>
    <span className="truncate">{label}</span>
  </div>
);

const MetricCard = ({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  helper: string;
  icon: React.ReactNode;
  tone: 'blue' | 'softBlue' | 'green' | 'neutral';
}) => {
  const toneClass = {
    blue: 'border-[#D5E6FF] bg-[#EAF3FF] text-[#0F5AD8] shadow-[0_10px_28px_rgba(20,102,245,0.06)]',
    softBlue: 'border-[#DCE5EE] bg-[#F8FAFC] text-[#0F5AD8] shadow-[0_10px_28px_rgba(0,27,61,0.04)]',
    green: 'border-[#CFEDE6] bg-[#E6F7F2] text-[#007A65] shadow-[0_10px_28px_rgba(0,187,148,0.06)]',
    neutral: 'border-[#DCE5EE] bg-[#F8FAFC] text-[#334155] shadow-[0_10px_28px_rgba(0,27,61,0.04)]',
  }[tone];

  return (
    <div className={`rounded-[1.15rem] border p-3 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-extrabold leading-none text-[#001B3D]">{value}</p>
      <p className="mt-1 truncate text-xs font-semibold text-[#64748B]">{helper}</p>
    </div>
  );
};

/* ─── Stat Pill ─────────────────────────────────────────────────────────── */

const StatPill = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'neutral' | 'green' | 'blue' | 'warning';
}) => {
  const valueClass =
    color === 'green' ? 'text-[#007A65]' :
    color === 'blue' ? 'text-[#0F5AD8]' :
    color === 'warning' ? 'text-[#9A5A00]' :
    'text-[#001B3D]';

  return (
    <div className="rounded-[1rem] border border-[#DCE5EE] bg-[#F8FAFC] py-3 text-center">
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#64748B]">{label}</p>
    </div>
  );
};

/* ─── Desktop Action Button ──────────────────────────────────────────────── */

const DesktopActionButton = ({
  icon,
  label,
  onClick,
  disabled,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex w-full items-center justify-center gap-2 rounded-[0.95rem] px-4 py-3
      text-sm font-extrabold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50
      ${primary
        ? 'bg-[#00BB94] text-white shadow-[0_10px_24px_rgba(0,187,148,0.18)] hover:bg-[#00A885]'
        : 'border border-[#DCE5EE] bg-[#F8FAFC] text-[#001B3D] hover:border-[#BFD2E5] hover:bg-white'
      }
    `}
  >
    {icon}
    {label}
  </button>
);

/* ─── Released Appointments Section ─────────────────────────────────────── */

const ReleasedAppointmentsSection = ({ appointments }: { appointments: Appointment[] }) => {
  if (appointments.length === 0) return null;

  return (
    <section className="mt-5 overflow-hidden rounded-[1.2rem] border border-[#DCE5EE] bg-white shadow-[0_12px_32px_rgba(0,27,61,0.05)] print:hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[#EEF3F7] p-4">
        <div>
          <h3 className="font-extrabold text-[#001B3D]">Remarcadas</h3>
          <p className="mt-0.5 text-xs font-semibold text-[#64748B]">Histórico preservado sem ocupar ficha no dia original.</p>
        </div>
        <Badge className="border-[#CFEDE6] bg-[#E6F7F2] px-3 py-1 text-sm font-extrabold text-[#007A65]">
          {appointments.length}
        </Badge>
      </div>

      <div className="divide-y divide-[#EEF3F7]">
        {appointments.map(appointment => (
          <div
            key={appointment.id}
            className="flex flex-col gap-2 p-4 transition-colors hover:bg-[#F8FAFC] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge className="border-[#CFEDE6] bg-[#E6F7F2] py-0.5 font-extrabold text-[#007A65]">
                  Ficha {appointment.slot_number}
                </Badge>
                <Badge className="border-[#E9D5FF] bg-[#F5EDFF] py-0.5 font-extrabold text-[#6D28D9]">
                  {getAppointmentStatus(appointment)}
                </Badge>
              </div>
              <p className="truncate font-bold text-[#001B3D]">{appointment.patient_name}</p>
              <p className="text-sm font-medium text-[#64748B]">
                {appointment.document_value} · ACS: {appointment.acs_name}
              </p>
            </div>
            <p className="shrink-0 text-xs font-semibold text-[#64748B]">
              {new Date(appointment.status_updated_at || appointment.updated_at).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AppointmentsPage;
