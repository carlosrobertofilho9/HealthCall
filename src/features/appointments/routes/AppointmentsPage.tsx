import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Ban,
  Printer,
  X,
  CalendarDays,
  CheckCircle2,
  Circle,
  BarChart2
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
  const reportMenuRef = useRef<HTMLDivElement | null>(null);
  const patientListMenuRef = useRef<HTMLDivElement | null>(null);

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
    printAppointmentReport(slots, period);
    setIsReportMenuOpen(false);
    setIsPatientListMenuOpen(false);
  };

  const handleReportButtonClick = () => {
    if (shouldShowReportMenu) {
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
      setIsPatientListMenuOpen(prev => !prev);
      setIsReportMenuOpen(false);
      return;
    }

    const singlePeriod = reportPeriods[0];
    handlePatientListPrint(singlePeriod);
  };

  useEffect(() => {
    if (!isReportMenuOpen && !isPatientListMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const clickedOutsideReport = !reportMenuRef.current || !reportMenuRef.current.contains(targetNode);
      const clickedOutsidePatientList = !patientListMenuRef.current || !patientListMenuRef.current.contains(targetNode);

      if (clickedOutsideReport && clickedOutsidePatientList) {
        setIsReportMenuOpen(false);
        setIsPatientListMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsReportMenuOpen(false);
        setIsPatientListMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isReportMenuOpen, isPatientListMenuOpen]);

  return (
    <div className="w-full mx-auto print:max-w-none lg:flex lg:flex-col lg:h-full lg:overflow-hidden lg:bg-background">
      {/* Print header */}
      <PrintHeader selectedDate={selectedDate} dayConfig={dayConfig} slotStats={slotStats} />

      {/* ══════════════ TOP NAV ══════════════ */}
      <div className="mb-4 print:hidden lg:mb-0 lg:-mx-2 lg:px-6 lg:py-4 lg:bg-card lg:border-b lg:border-border lg:shrink-0">
        <div className="lg:w-full lg:mx-auto">
          <AppointmentsNav />
        </div>
      </div>

      {/* ══════════════ MAIN LAYOUT ══════════════ */}
      <div className="flex flex-col lg:flex-row gap-4 print:block lg:flex-1 lg:overflow-hidden lg:gap-0 lg:w-full">

        {/* ── LEFT PANEL (sticky on desktop) ── */}
        <aside className="w-full lg:w-[320px] xl:w-[360px] shrink-0 print:hidden lg:flex lg:flex-col lg:h-full lg:border-r lg:border-border lg:bg-transparent">
          <div className="lg:sticky lg:top-4 flex flex-col gap-4 lg:p-6 lg:h-full lg:overflow-y-auto custom-scrollbar lg:static">

            {/* Date selector */}
            <DateSelector
              selectedDate={selectedDate}
              dayConfig={dayConfig}
              onPreviousDay={goToPreviousDay}
              onNextDay={goToNextDay}
              onToday={goToToday}
              onDateChange={changeDate}
            />

            {/* Stats card – only when service */}
            {dayConfig.hasService && (
              <div className="rounded-2xl bg-card border border-border p-5 space-y-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none lg:p-0">
                {/* Occupancy header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-card-foreground">Ocupação do dia</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    occupancyPct >= 90 ? 'text-red-400' :
                    occupancyPct >= 60 ? 'text-amber-400' : 'text-primary'
                  }`}>{occupancyPct}%</span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      occupancyPct >= 90 ? 'bg-red-400' :
                      occupancyPct >= 60 ? 'bg-amber-400' : 'bg-primary'
                    }`}
                    style={{ width: `${occupancyPct}%` }}
                  />
                </div>

                {/* Stat pills */}
                <div className="grid grid-cols-3 gap-2">
                  <StatPill
                    label={isHomeVisit ? 'Visitas' : 'Total'}
                    value={slotStats.total}
                    color="neutral"
                  />
                  <StatPill
                    label="Ocupadas"
                    value={slotStats.occupied}
                    color="green"
                  />
                  <StatPill
                    label="Livres"
                    value={slotStats.available}
                    color="blue"
                  />
                </div>

                {/* Quick status breakdown */}
                <div className="space-y-2 pt-1 border-t border-border">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Próxima vaga livre
                  </p>
                  {availableSlots.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <Circle className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-semibold text-card-foreground">
                        Ficha {availableSlots[0]}
                        {slots[availableSlots[0] - 1]?.time
                          ? ` · ${slots[availableSlots[0] - 1].time}`
                          : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-sm text-amber-300 font-medium">
                        Agenda completa
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions – desktop only */}
            {dayConfig.hasService && (
              <div className="hidden lg:flex flex-col gap-2">
                <DesktopActionButton
                  icon={<Plus className="w-4 h-4" />}
                  label={isHomeVisit ? 'Nova Visita' : 'Nova Marcação'}
                  onClick={() => handleAddClick()}
                  disabled={availableSlots.length === 0 || isLoading}
                  primary
                />
                <div className="grid grid-cols-2 gap-2">
                  <DesktopActionButton
                    icon={<Ban className="w-4 h-4 text-red-400" />}
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
                  icon={<CalendarDays className="w-4 h-4 text-amber-300" />}
                  label="Reagendar dia"
                  onClick={() => setIsBulkRescheduleModalOpen(true)}
                  disabled={isLoading || bulkRescheduleAppointments.length === 0}
                />
                <div className="h-px bg-border my-1" />
                {isHomeVisit ? (
                  <DesktopActionButton
                    icon={<Printer className="w-4 h-4" />}
                    label="Imprimir Roteiro"
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

                      {shouldShowReportMenu && isReportMenuOpen && (
                        <div className="absolute right-0 z-50 mt-2 w-40 rounded-xl border border-border bg-popover p-1 shadow-lg">
                          <button
                            onClick={() => handleReportPrint('Manhã')}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-popover-foreground hover:bg-accent transition-colors"
                          >
                            Imprimir manhã
                          </button>
                          <button
                            onClick={() => handleReportPrint('Tarde')}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-popover-foreground hover:bg-accent transition-colors"
                          >
                            Imprimir tarde
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="relative" ref={patientListMenuRef}>
                      <DesktopActionButton
                        icon={<Printer className="w-4 h-4" />}
                        label="Ficha"
                        onClick={handlePatientListButtonClick}
                      />

                      {shouldShowReportMenu && isPatientListMenuOpen && (
                        <div className="absolute right-0 z-50 mt-2 w-40 rounded-xl border border-border bg-popover p-1 shadow-lg">
                          <button
                            onClick={() => handlePatientListPrint('Manhã')}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-popover-foreground hover:bg-accent transition-colors"
                          >
                            Imprimir manhã
                          </button>
                          <button
                            onClick={() => handlePatientListPrint('Tarde')}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-popover-foreground hover:bg-accent transition-colors"
                          >
                            Imprimir tarde
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ── RIGHT PANEL: slots ── */}
        <main className="flex-1 min-w-0 pb-28 lg:pb-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pt-6 lg:px-6">
          {/* Search bar */}
          {dayConfig.hasService && (
            <div className="mb-4 print:hidden lg:mb-6">
              {/* Mobile: collapsible search */}
              <div className="lg:hidden">
                {isSearchOpen ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Buscar paciente, CPF, ACS..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 rounded-xl bg-card border border-border text-card-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <button
                      onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                      className="p-3 rounded-xl bg-card border border-border text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground text-sm hover:border-primary transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    <span>Buscar paciente, CPF ou ACS...</span>
                    {searchQuery && (
                      <span className="ml-auto text-primary font-semibold text-xs">
                        {filteredSlots.filter(s => s.appointment).length} resultado(s)
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Desktop: always visible */}
              <div className="hidden lg:block relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar paciente, CPF ou ACS..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-card-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Slots list */}
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

          {/* Released section */}
          <ReleasedAppointmentsSection appointments={filteredReleasedAppointments} />
        </main>
      </div>

      {/* ══════════════ MOBILE BOTTOM TOOLBAR ══════════════ */}
      {dayConfig.hasService && (
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden print:hidden">
          {/* Blur backdrop */}
          <div className="bg-background/90 backdrop-blur-xl border-t border-border px-4 pt-3 pb-safe-or-3">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center max-w-xl mx-auto">
              {/* Primary CTA */}
              <button
                onClick={() => handleAddClick()}
                disabled={availableSlots.length === 0 || isLoading}
                className="flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
                {isHomeVisit ? 'Nova Visita' : 'Nova Marcação'}
              </button>

              {/* Search toggle */}
              <button
                onClick={() => { setIsSearchOpen(v => !v); }}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-card border border-border active:scale-95 transition-all"
                aria-label="Buscar"
              >
                <Search className={`w-5 h-5 ${isSearchOpen ? 'text-primary' : 'text-muted-foreground'}`} />
              </button>

              {/* Block */}
              <button
                onClick={() => setIsBlockDayModalOpen(true)}
                disabled={isLoading}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-card border border-border active:scale-95 transition-all disabled:opacity-50"
                aria-label="Bloquear dia"
              >
                <Ban className="w-5 h-5 text-red-400" />
              </button>

              <button
                onClick={() => setIsBulkRescheduleModalOpen(true)}
                disabled={isLoading || bulkRescheduleAppointments.length === 0}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-card border border-border active:scale-95 transition-all disabled:opacity-50"
                aria-label="Reagendar dia"
              >
                <CalendarDays className="w-5 h-5 text-amber-300" />
              </button>

              {/* Refresh */}
              <button
                onClick={refresh}
                disabled={isLoading}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-card border border-border active:scale-95 transition-all disabled:opacity-50"
                aria-label="Atualizar"
              >
                <RefreshCw className={`w-5 h-5 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Safe area for home indicator */}
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
  color: 'neutral' | 'green' | 'blue';
}) => {
  const valueClass =
    color === 'green' ? 'text-primary' :
    color === 'blue'  ? 'text-blue-300' :
    'text-card-foreground';

  return (
    <div className="rounded-xl bg-background border border-border py-3 text-center">
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-0.5">{label}</p>
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
      flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl
      font-semibold text-sm transition-all active:scale-95 disabled:opacity-50
      ${primary
        ? 'bg-primary text-primary-foreground hover:brightness-110'
        : 'bg-card border border-border text-card-foreground hover:bg-secondary'
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
    <section className="mt-6 rounded-2xl border border-border bg-card overflow-hidden print:hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-bold text-card-foreground">Remarcadas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Mantidas no histórico sem ocupar ficha no dia original.</p>
        </div>
        <Badge className="px-3 py-1 text-sm font-bold">
          {appointments.length}
        </Badge>
      </div>

      <div className="divide-y divide-border">
        {appointments.map(appointment => (
          <div
            key={appointment.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 hover:bg-background/40 transition-colors"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge className="py-0.5 font-bold text-primary">
                  Ficha {appointment.slot_number}
                </Badge>
                <Badge className="border-purple-500/20 bg-purple-500/15 py-0.5 font-bold text-purple-300">
                  {getAppointmentStatus(appointment)}
                </Badge>
              </div>
              <p className="font-semibold text-card-foreground truncate">{appointment.patient_name}</p>
              <p className="text-sm text-muted-foreground">
                {appointment.document_value} · ACS: {appointment.acs_name}
              </p>
            </div>
            <p className="text-xs text-muted-foreground shrink-0">
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
