import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useAppointments } from '../hooks/useAppointments';
import DateSelector from '../components/DateSelector';
import SlotsList from '../components/SlotsList';
import AppointmentActions from '../components/AppointmentActions';
import AddAppointmentForm from '../components/AddAppointmentForm';
import EditAppointmentModal from '../components/EditAppointmentModal';
import RescheduleAppointmentModal from '../components/RescheduleAppointmentModal';
import ConfirmDeleteAppointmentModal from '../components/ConfirmDeleteAppointmentModal';
import PrintHeader from '../components/PrintHeader';
import { printPatientList } from '@/components/PatientQueue/printUtils';
import { printAppointmentReport } from '@/components/PatientQueue/printReportUtils';
import { printHomeVisitRoute } from '@/components/PatientQueue/printHomeVisitRouteUtils';
import type { Appointment, AppointmentStatus } from '@/types';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { blockDay, getAppointmentStatus, isBlockedAppointment } from '../services/appointmentService';
import { BlockDayModal } from '../components/BlockDayModal';
import AppointmentsNav from '../components/AppointmentsNav';

/**
 * Página de Marcações do PSF (Estratégia de Saúde da Família).
 * 
 * Esta página exibe uma grade fixa de slots por dia da semana,
 * permitindo agendar, editar e remover marcações de pacientes.
 * 
 * Regras:
 * - Segunda-feira: 30 slots (11 manhã + 4 reserva manhã + 9 tarde + 6 reserva tarde)
 * - Terça-feira: 15 slots (11 manhã + 4 reserva manhã)
 * - Quarta-feira: 15 visitas domiciliares (11 manhã + 4 reserva manhã)
 * - Demais dias: Sem atendimento
 */

// Helper para normalizar texto (remover acentos e converter para minúsculas)
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

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
    changeDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    refresh,
  } = useAppointments();

  // Estados dos modais
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [initialSlotForAdd, setInitialSlotForAdd] = useState<number | undefined>();
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBlockDayModalOpen, setIsBlockDayModalOpen] = useState(false);
  const [isBlockingDay, setIsBlockingDay] = useState(false);
  
  


  // Slots disponíveis para adicionar
  const availableSlots = slots
    .filter(s => s.appointment === null)
    .map(s => s.slotNumber);

  // Filtrar slots baseados na busca
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

  // Handlers
  const handleAddClick = (slotNumber?: number) => {
    setInitialSlotForAdd(slotNumber);
    setIsAddFormOpen(true);
  };

  const handleEditClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
  };

  const handleDeleteClick = (appointment: Appointment) => {
    if (isBlockedAppointment(appointment)) {
      setDeletingAppointment(appointment);
      return;
    }

    void handleStatusChange(appointment, 'Cancelado');
  };

  const handleStatusChange = async (appointment: Appointment, status: AppointmentStatus) => {
    if (getAppointmentStatus(appointment) === status) {
      return;
    }

    await updateStatus(appointment.id, status);
  };

  const handleRescheduleClick = (appointment: Appointment) => {
    setReschedulingAppointment(appointment);
  };

  const handleConfirmDelete = async () => {
    if (deletingAppointment) {
      await removeAppointment(deletingAppointment.id);
      setDeletingAppointment(null);
    }
  };

  const handlePrint = () => {
    printPatientList(slots);
  };

  const handlePrintReport = () => {
    printAppointmentReport(slots);
  };

  const handlePrintHomeVisitRoute = () => {
    printHomeVisitRoute(slots, selectedDate);
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

  return (
    <div className="w-full max-w-7xl mx-auto print:max-w-none overflow-hidden">
      {/* Cabeçalho para impressão */}
      <PrintHeader
        selectedDate={selectedDate}
        dayConfig={dayConfig}
        slotStats={slotStats}
      />

      <div className="mb-6">
        <AppointmentsNav />
      </div>

      {/* Seletor de data */}
      <div className="mb-6">
        <DateSelector
          selectedDate={selectedDate}
          dayConfig={dayConfig}
          onPreviousDay={goToPreviousDay}
          onNextDay={goToNextDay}
          onToday={goToToday}
          onDateChange={changeDate}
        />
      </div>

      {/* Estatísticas do dia (oculto na impressão) */}
      {dayConfig.hasService && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:hidden">
          <div className="bg-[#1a3a26] rounded-xl p-4 text-center">
            <p className="text-[#96c5a9] text-sm">
              {dayConfig.serviceType === 'HOME_VISIT' ? 'Total de Visitas' : 'Total de Vagas'}
            </p>
            <p className="text-2xl font-bold text-white">{slotStats.total}</p>
          </div>
          <div className="bg-[#1a3a26] rounded-xl p-4 text-center">
            <p className="text-[#96c5a9] text-sm">Ocupadas</p>
            <p className="text-2xl font-bold text-primary">{slotStats.occupied}</p>
          </div>
          <div className="bg-[#1a3a26] rounded-xl p-4 text-center">
            <p className="text-[#96c5a9] text-sm">
              {dayConfig.serviceType === 'HOME_VISIT' ? 'Disponíveis para visita' : 'Disponíveis'}
            </p>
            <p className="text-2xl font-bold text-blue-400">{slotStats.available}</p>
          </div>
        </div>
      )}

      {/* Ações e Busca */}
      <div className="mb-6 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center print:hidden">
        {/* Barra de Busca - Largura fixa no desktop para consistência */}
        <div className='relative w-full xl:w-96'>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
             placeholder="Buscar paciente, CPF ou ACS..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-10 bg-[#1a3a26] border-[#264532] text-white placeholder:text-gray-400 focus:ring-primary w-full transition-all focus:border-primary"
          />
        </div>

        {/* Ações - Flexível */}
        <div className="w-full xl:w-auto">
          <AppointmentActions
            hasService={dayConfig.hasService}
            serviceType={dayConfig.serviceType}
            availableSlotsCount={availableSlots.length}
            onAddClick={() => handleAddClick()}
            onPrintClick={handlePrint}
            onPrintReportClick={handlePrintReport}
            onPrintHomeVisitRouteClick={handlePrintHomeVisitRoute}
            onRefreshClick={refresh}
            onBlockDayClick={() => setIsBlockDayModalOpen(true)}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Lista de slots */}
      <SlotsList
        slots={filteredSlots}
        dayConfig={dayConfig}
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onStatusChange={handleStatusChange}
        onRescheduleClick={handleRescheduleClick}
        isLoading={isLoading}
      />

      <ReleasedAppointmentsSection appointments={filteredReleasedAppointments} />

      {/* Modal de adicionar marcação */}
      {isAddFormOpen && (
        <AddAppointmentForm
          selectedDate={selectedDate}
          availableSlots={availableSlots}
          onAdd={addAppointment}
          onCancel={() => {
            setIsAddFormOpen(false);
            setInitialSlotForAdd(undefined);
          }}
          isLoading={isLoading}
          initialSlot={initialSlotForAdd}
        />
      )}

      {/* Modal de editar marcação */}
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

      {/* Modal de confirmar exclusão */}
      {deletingAppointment && (
        <ConfirmDeleteAppointmentModal
          patientName={deletingAppointment.patient_name}
          slotNumber={deletingAppointment.slot_number}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingAppointment(null)}
          isLoading={isLoading}
        />
      )}



      {/* Modal de bloquear dia */}
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

const ReleasedAppointmentsSection = ({ appointments }: { appointments: Appointment[] }) => {
  if (appointments.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-2xl border border-[#264532] bg-[#1a3a26] p-4 print:hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">Canceladas e remarcadas</h3>
          <p className="text-sm text-[#96c5a9]">Registros mantidos no histórico sem ocupar ficha.</p>
        </div>
        <span className="rounded-full bg-[#264532] px-3 py-1 text-sm font-bold text-[#96c5a9]">
          {appointments.length}
        </span>
      </div>

      <div className="grid gap-2">
        {appointments.map(appointment => (
          <div
            key={appointment.id}
            className="flex flex-col gap-2 rounded-xl border border-[#264532] bg-[#122118]/50 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#264532] px-2.5 py-0.5 text-xs font-bold text-primary">
                  Slot {appointment.slot_number}
                </span>
                <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-200">
                  {getAppointmentStatus(appointment)}
                </span>
              </div>
              <p className="mt-2 truncate font-semibold text-white">{appointment.patient_name}</p>
              <p className="text-sm text-[#96c5a9]">
                {appointment.document_value} · ACS: {appointment.acs_name}
              </p>
            </div>
            <p className="text-xs text-[#96c5a9]">
              Atualizado em{' '}
              {new Date(appointment.status_updated_at || appointment.updated_at).toLocaleString('pt-BR')}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AppointmentsPage;
