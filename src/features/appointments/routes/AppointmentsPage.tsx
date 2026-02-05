import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useAppointments } from '../hooks/useAppointments';
import DateSelector from '../components/DateSelector';
import SlotsList from '../components/SlotsList';
import AppointmentActions from '../components/AppointmentActions';
import AddAppointmentForm from '../components/AddAppointmentForm';
import EditAppointmentModal from '../components/EditAppointmentModal';
import ConfirmDeleteAppointmentModal from '../components/ConfirmDeleteAppointmentModal';
import ConfirmQueueModal from '../components/ConfirmQueueModal';
import PrintHeader from '../components/PrintHeader';
import { printPatientList } from '@/components/PatientQueue/printUtils';
import { printAppointmentReport } from '@/components/PatientQueue/printReportUtils';
import type { Appointment } from '@/types';
import { addPatient } from '@/features/dashboard/services/patientService';
import { toast } from 'sonner';

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
  
  // Estado para envio para fila
  const [queueModalData, setQueueModalData] = useState<{
    patients: Appointment[];
    period: string;
  } | null>(null);
  const [isSendingToQueue, setIsSendingToQueue] = useState(false);

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

  const handleSendToQueueClick = () => {
    const currentHour = new Date().getHours();
    // Se for antes das 13h, considera manhã. Depois, tarde.
    // Mas devemos verificar se existem pacientes para o período.
    
    // Filtro para Manhã ou Tarde baseado no horário atual
    // Mas talvez o usuário queira mandar turno da Tarde mesmo sendo de Manhã (pré-preparar)?
    // Vamos usar a lógica de horário como padrão, mas se estiver vazio, tentamos o outro?
    // Melhor ser estrito: horário atual define o turno ativo.
    
    let targetPeriod = currentHour < 13 ? 'Manhã' : 'Tarde';
    
    // Filtrar slots que tem apontamento e são do período alvo
    let patientsToSend = slots
        .filter(s => s.appointment && s.period === targetPeriod)
        .map(s => s.appointment!);

    // Se não houver pacientes no turno atual, mas houver no outro e o usuário clicar...
    // Talvez seja melhor perguntar qual turno?
    // Simplificação: Se vazio no turno atual, checa se tem no outro.
    if (patientsToSend.length === 0) {
        const otherPeriod = targetPeriod === 'Manhã' ? 'Tarde' : 'Manhã';
        const otherPatients = slots
            .filter(s => s.appointment && s.period === otherPeriod)
            .map(s => s.appointment!);
        
        if (otherPatients.length > 0) {
            // Se tem no outro turno, muda o alvo (assumindo que o usuário quer enviar o que tem)
            // Ou mostra erro "Nenhum paciente no turno da X".
            // Vamos mostrar erro para evitar acidentes.
            toast.warning(`Nenhum paciente encontrado para o turno da ${targetPeriod}.`);
            return;
        } else {
             toast.warning("Não há pacientes agendados para hoje.");
             return;
        }
    }

    setQueueModalData({
        patients: patientsToSend,
        period: targetPeriod
    });
  };

  const handleConfirmSendToQueue = async () => {
    if (!queueModalData) return;

    setIsSendingToQueue(true);
    let successCount = 0;
    
    try {
        // Envia sequencialmente para garantir ordem (ou paralelo se não importar ordem na fila de espera,
        // mas ordem de chegada/ficha importa).
        // Vamos enviar na ordem dos slots.
        const sortedPatients = [...queueModalData.patients].sort((a, b) => a.slot_number - b.slot_number);

        for (const apt of sortedPatients) {
            // Adiciona para triagem
            await addPatient(apt.patient_name, 'Triagem');
            successCount++;
        }
        
        toast.success(`${successCount} pacientes enviados para a fila de Triagem!`);
        setQueueModalData(null);
    } catch (error) {
        console.error('Erro ao enviar para fila:', error);
        toast.error('Erro ao enviar alguns pacientes para a fila.');
    } finally {
        setIsSendingToQueue(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto print:max-w-none overflow-hidden">
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
          onSendToQueueClick={handleSendToQueueClick}
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

      {/* Modal de envio para fila */}
      {queueModalData && (
        <ConfirmQueueModal
            patientCount={queueModalData.patients.length}
            period={queueModalData.period}
            onConfirm={handleConfirmSendToQueue}
            onClose={() => setQueueModalData(null)}
            isLoading={isSendingToQueue}
        />
      )}
    </div>
  );
};

export default AppointmentsPage;
