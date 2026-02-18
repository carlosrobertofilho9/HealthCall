import React, { useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import { useAppointments } from '../hooks/useAppointments';
import DateSelector from '../components/DateSelector';
import SlotsList from '../components/SlotsList';
import AppointmentActions from '../components/AppointmentActions';
import AddAppointmentForm from '../components/AddAppointmentForm';
import EditAppointmentModal from '../components/EditAppointmentModal';
import ConfirmDeleteAppointmentModal from '../components/ConfirmDeleteAppointmentModal';
import PrintHeader from '../components/PrintHeader';
import { printPatientList } from '@/components/PatientQueue/printUtils';
import { printAppointmentReport } from '@/components/PatientQueue/printReportUtils';
import type { Appointment } from '@/types';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { blockDay } from '../services/appointmentService';
import { BlockDayModal } from '../components/BlockDayModal';

/**
 * Página de Marcações do PSF (Estratégia de Saúde da Família).
 * 
 * Esta página exibe uma grade fixa de slots por dia da semana,
 * permitindo agendar, editar e remover marcações de pacientes.
 * 
 * Regras:
 * - Segunda-feira: 30 slots (11 manhã + 4 reserva manhã + 9 tarde + 6 reserva tarde)
 * - Terça-feira: 15 slots (11 manhã + 4 reserva manhã)
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
    isLoading,
    slotStats,
    addAppointment,
    editAppointment,
    removeAppointment,
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
      normalizeText(apt.acs_name).includes(query)
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
    setDeletingAppointment(appointment);
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

      {/* Título da página (oculto na impressão) */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <CalendarDays className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold text-white">Marcações</h1>
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
            <p className="text-[#96c5a9] text-sm">Total de Vagas</p>
            <p className="text-2xl font-bold text-white">{slotStats.total}</p>
          </div>
          <div className="bg-[#1a3a26] rounded-xl p-4 text-center">
            <p className="text-[#96c5a9] text-sm">Ocupadas</p>
            <p className="text-2xl font-bold text-primary">{slotStats.occupied}</p>
          </div>
          <div className="bg-[#1a3a26] rounded-xl p-4 text-center">
            <p className="text-[#96c5a9] text-sm">Disponíveis</p>
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
            availableSlotsCount={availableSlots.length}
            onAddClick={() => handleAddClick()}
            onPrintClick={handlePrint}
            onPrintReportClick={handlePrintReport}
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
        isLoading={isLoading}
      />

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

export default AppointmentsPage;
