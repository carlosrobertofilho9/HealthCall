import React, { useState } from 'react';
import AddPatientForm from '@/components/AddPatientForm';
import PatientQueue from '@/components/PatientQueue';
import EditPatientModal from '@/components/EditPatientModal';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import QueueActions from '@/components/QueueActions';
import type { Appointment, Patient } from '@/types';
import { usePatientQueue } from '@/features/dashboard/hooks/usePatientQueue';
import { useUserProfile } from '@/hooks/useUserProfile';
import AppointmentsColumn from '@/features/dashboard/components/AppointmentsColumn';
import { updateAppointmentStatus } from '@/features/appointments/services/appointmentService';
import { PageShell } from '@/components/layout';
import { Activity, CheckCircle2, Clock3, Users } from 'lucide-react';

/**
 * A página principal do painel de controle (dashboard).
 *
 * Este componente orquestra a interface principal para gerenciamento da fila de pacientes.
 * Ele integra os componentes `AddPatientForm`, `PatientQueue` e `QueueActions`,
 * e gerencia o estado dos modais para edição e exclusão de pacientes.
 * A lógica de estado é principalmente fornecida pelos hooks `usePatientQueue` e `useUserProfile`.
 *
 * @returns {React.ReactElement} O componente da página inicial.
 */
const HomePage: React.FC = () => {
	const { profile } = useUserProfile();
	const {
		patients,
		filteredPatients,
		isFiltering,
		searchTerm,
		setSearchTerm,
		selectedDestination,
		setSelectedDestination,
		addPatientByName,
		addPatientByNumber,
		updatePatientStatus,
		updatePatientDestination,
		removePatient,
		callPatient,
		clearQueue,
		updatePatient,
		isAddingPatient,
		reorderPatients,
	} = usePatientQueue();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
	const [isClearQueueModalOpen, setIsClearQueueModalOpen] = useState(false);

	const handleAddPatientByNumber = async () => {
		const destination = profile?.default_destination ?? 'Consultório';
		await addPatientByNumber(destination);
	};

	const handleRemovePatient = (patient: Patient) => {
		setPatientToDelete(patient);
		setIsConfirmModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (patientToDelete) {
			await removePatient(patientToDelete.id);
			setPatientToDelete(null);
			setIsConfirmModalOpen(false);
		}
	};

	const handleClearQueue = () => {
		setIsClearQueueModalOpen(true);
	};

	const handleConfirmClearQueue = async () => {
		await clearQueue();
		setIsClearQueueModalOpen(false);
	};

	const handleCloseConfirmModal = () => {
		setPatientToDelete(null);
		setIsConfirmModalOpen(false);
		setIsClearQueueModalOpen(false);
	};

	const openModal = (patient: Patient) => {
		setEditingPatient(patient);
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setEditingPatient(null);
	};

    const handleCheckIn = async (appointment: Appointment): Promise<boolean> => {
       const destination = profile?.default_destination ?? 'Consultório';
       const patient = await addPatientByName(appointment.patient_name, destination);

       if (!patient) {
        return false;
       }

       await updateAppointmentStatus(appointment.id, 'Compareceu');
       return true;
	};

	return (
		<PageShell desktopContained className="flex flex-col gap-4 pb-4 lg:gap-0 lg:pb-0">
			<header className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:rounded-none lg:border-0 lg:border-b lg:shadow-none lg:bg-transparent lg:shrink-0">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">Fila de atendimento</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Gestão operacional da triagem com entrada rápida, priorização e acompanhamento em tempo real.
						</p>
					</div>
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
						<div className="rounded-xl border border-border bg-background px-3 py-2">
							<div className="flex items-center gap-2 text-muted-foreground">
								<Users size={14} />
								<span className="text-xs">Total</span>
							</div>
							<p className="mt-1 text-lg font-semibold text-foreground">{patients.length}</p>
						</div>
						<div className="rounded-xl border border-border bg-background px-3 py-2">
							<div className="flex items-center gap-2 text-muted-foreground">
								<Clock3 size={14} />
								<span className="text-xs">Aguardando</span>
							</div>
							<p className="mt-1 text-lg font-semibold text-foreground">
								{patients.filter((patient) => patient.status === 'Aguardando').length}
							</p>
						</div>
						<div className="rounded-xl border border-border bg-background px-3 py-2">
							<div className="flex items-center gap-2 text-muted-foreground">
								<Activity size={14} />
								<span className="text-xs">Em atendimento</span>
							</div>
							<p className="mt-1 text-lg font-semibold text-foreground">
								{patients.filter((patient) => patient.status === 'Em Atendimento').length}
							</p>
						</div>
						<div className="rounded-xl border border-border bg-background px-3 py-2">
							<div className="flex items-center gap-2 text-muted-foreground">
								<CheckCircle2 size={14} />
								<span className="text-xs">Chamados</span>
							</div>
							<p className="mt-1 text-lg font-semibold text-foreground">
								{patients.filter((patient) => patient.status === 'Chamado').length}
							</p>
						</div>
					</div>
				</div>
			</header>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-0 xl:h-full xl:overflow-hidden">
				<div className="space-y-4 xl:col-span-3 xl:space-y-0 xl:flex xl:flex-col xl:border-r xl:border-border xl:bg-transparent">
					<div className="xl:border-b xl:border-border">
						<AddPatientForm
							onAddPatient={addPatientByName}
							defaultDestination={profile?.default_destination ?? undefined}
							isAddingPatient={isAddingPatient}
						/>
					</div>
					<div>
						<QueueActions
							onClearQueue={handleClearQueue}
							onAddPatientByNumber={handleAddPatientByNumber}
							isAddingPatient={isAddingPatient}
						/>
					</div>
				</div>

				<div className="min-h-0 xl:col-span-6 xl:border-r xl:border-border xl:bg-transparent">
					<PatientQueue
						patients={filteredPatients}
						onEdit={openModal}
						onCall={callPatient}
						onUpdateStatus={updatePatientStatus}
						onUpdateDestination={updatePatientDestination}
						onRemove={handleRemovePatient}
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						selectedDestination={selectedDestination}
						setSelectedDestination={setSelectedDestination}
						onReorder={isFiltering ? undefined : reorderPatients}
					/>
				</div>

				<div className="min-h-0 xl:col-span-3 xl:bg-transparent">
					<AppointmentsColumn onCheckIn={handleCheckIn} queuedPatients={patients} />
				</div>
			</div>

			{isModalOpen && editingPatient && (
				<EditPatientModal patient={editingPatient} onSave={updatePatient} onClose={closeModal} isOpen={isModalOpen} />
			)}
			{isConfirmModalOpen && patientToDelete && (
				<ConfirmDeleteModal
					isOpen={isConfirmModalOpen}
					onClose={handleCloseConfirmModal}
					onConfirm={handleConfirmDelete}
					patientName={patientToDelete.name}
				/>
			)}
			{isClearQueueModalOpen && (
				<ConfirmDeleteModal
					isOpen={isClearQueueModalOpen}
					onClose={handleCloseConfirmModal}
					onConfirm={handleConfirmClearQueue}
					patientName="toda a fila"
				/>
			)}
		</PageShell>
	);
};

export default HomePage;
