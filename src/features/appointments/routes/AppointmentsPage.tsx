import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
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

/**
 * Página de Marcações do PSF (Estratégia de Saúde da Família).
 * 
 * Esta página exibe uma grade fixa de slots por dia da semana,
 * permitindo agendar, editar e remover marcações de pacientes.
 * 
 * Regras:
 * - Segunda-feira: 30 slots (15 manhã + 15 tarde)
 * - Terça-feira: 15 slots (manhã)
 * - Demais dias: Sem atendimento
 */
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

  // Slots disponíveis para adicionar
  const availableSlots = slots
    .filter(s => s.appointment === null)
    .map(s => s.slotNumber);

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

  return (
    <div className="w-full max-w-4xl mx-auto print:max-w-none">
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
        <div className="grid grid-cols-3 gap-4 mb-6 print:hidden">
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

      {/* Ações */}
      <div className="mb-6">
        <AppointmentActions
          hasService={dayConfig.hasService}
          availableSlotsCount={availableSlots.length}
          onAddClick={() => handleAddClick()}
          onPrintClick={handlePrint}
          onPrintReportClick={handlePrintReport}
          onRefreshClick={refresh}
          isLoading={isLoading}
        />
      </div>

      {/* Lista de slots */}
      <SlotsList
        slots={slots}
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
    </div>
  );
};

export default AppointmentsPage;
