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
import { PageShell } from '@/components/layout';
import { Activity, CheckCircle2, Clock3, ListChecks, ShieldCheck, Users, Zap } from 'lucide-react';

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
	const defaultDestination = profile?.default_destination ?? 'Consultório';

	const waitingCount = patients.filter((patient) => patient.status === 'Aguardando').length;
	const inServiceCount = patients.filter((patient) => patient.status === 'Em Atendimento').length;
	const calledCount = patients.filter((patient) => patient.status === 'Chamado').length;
	const finishedCount = patients.filter((patient) => patient.status === 'Atendimento Finalizado').length;
	const operationalQueueCount = patients.length - finishedCount;
	const nextPatient = patients.find((patient) => patient.status !== 'Atendimento Finalizado');
	const visibleQueueLabel = isFiltering ? `${filteredPatients.length} filtrados` : `${operationalQueueCount} ativos`;

	const handleAddPatientByNumber = async () => {
		await addPatientByNumber(defaultDestination);
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

		return true;
	};

	return (
		<PageShell
			desktopContained
			className="flex flex-col gap-4 !overflow-x-visible overflow-y-auto bg-[linear-gradient(180deg,#F4F6F8_0%,#EFF8F6_100%)] px-4 py-4 pb-8 lg:h-full lg:!overflow-visible lg:px-5 lg:py-5"
		>
			<header className="relative shrink-0 overflow-hidden rounded-[1.6rem] border border-white/80 bg-white px-5 py-4 shadow-[0_18px_48px_rgba(0,27,61,0.07)] lg:px-6 lg:py-4">
				<div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#1466F5_0%,#00BB94_100%)]" aria-hidden="true" />
				<div className="relative grid gap-4 xl:grid-cols-[1.05fr_1fr] xl:items-center">
					<div className="min-w-0">
						<div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#CFEDE6] bg-[#E6F7F2] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#007A65]">
							<span className="size-2 rounded-full bg-[#00BB94]" />
							Operação em tempo real
						</div>
						<h1 className="text-3xl font-extrabold leading-tight tracking-normal text-[#001B3D] lg:text-[2.15rem]">
							Fila de atendimento
						</h1>
						<p className="mt-2 max-w-2xl text-sm font-medium leading-5 text-[#64748B]">
							Entrada rápida, priorização clínica e acompanhamento da unidade em uma visão limpa e operacional.
						</p>
						<div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#334155]">
							<div className="inline-flex items-center gap-2 rounded-full border border-[#DCE5EE] bg-[#F8FAFC] px-3 py-1.5">
								<ShieldCheck className="size-4 text-[#00A885]" />
								<span>{defaultDestination}</span>
							</div>
							<div className="inline-flex items-center gap-2 rounded-full border border-[#DCE5EE] bg-[#F8FAFC] px-3 py-1.5">
								<Zap className="size-4 text-[#1466F5]" />
								<span>{visibleQueueLabel}</span>
							</div>
							{nextPatient && (
								<div className="min-w-0 inline-flex max-w-full items-center gap-2 rounded-full border border-[#DCE5EE] bg-[#F8FAFC] px-3 py-1.5">
									<ListChecks className="size-4 shrink-0 text-[#00A885]" />
									<span className="truncate">Próximo: {nextPatient.name}</span>
								</div>
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:gap-3">
						<div className="rounded-[1.15rem] border border-[#DCE5EE] bg-[#F8FAFC] p-3 shadow-[0_10px_28px_rgba(0,27,61,0.04)]">
							<div className="flex items-center justify-between gap-2 text-[#64748B]">
								<span className="text-[11px] font-bold uppercase tracking-[0.12em]">Total</span>
								<Users className="size-4 text-[#1466F5]" />
							</div>
							<p className="mt-2 text-2xl font-extrabold leading-none text-[#001B3D]">{patients.length}</p>
							<p className="mt-1 text-xs font-semibold text-[#64748B]">pacientes no dia</p>
						</div>
						<div className="rounded-[1.15rem] border border-[#DCE5EE] bg-[#F8FAFC] p-3 shadow-[0_10px_28px_rgba(0,27,61,0.04)]">
							<div className="flex items-center justify-between gap-2 text-[#64748B]">
								<span className="text-[11px] font-bold uppercase tracking-[0.12em]">Aguardando</span>
								<Clock3 className="size-4 text-[#F59E0B]" />
							</div>
							<p className="mt-2 text-2xl font-extrabold leading-none text-[#001B3D]">{waitingCount}</p>
							<p className="mt-1 text-xs font-semibold text-[#64748B]">em espera</p>
						</div>
						<div className="rounded-[1.15rem] border border-[#CFEDE6] bg-[#E6F7F2] p-3 shadow-[0_10px_28px_rgba(0,187,148,0.06)]">
							<div className="flex items-center justify-between gap-2 text-[#007A65]">
								<span className="text-[11px] font-bold uppercase tracking-[0.12em]">Atendendo</span>
								<Activity className="size-4" />
							</div>
							<p className="mt-2 text-2xl font-extrabold leading-none text-[#001B3D]">{inServiceCount}</p>
							<p className="mt-1 text-xs font-semibold text-[#007A65]">em sala</p>
						</div>
						<div className="rounded-[1.15rem] border border-[#D5E6FF] bg-[#EAF3FF] p-3 shadow-[0_10px_28px_rgba(20,102,245,0.06)]">
							<div className="flex items-center justify-between gap-2 text-[#0F5AD8]">
								<span className="text-[11px] font-bold uppercase tracking-[0.12em]">Chamados</span>
								<CheckCircle2 className="size-4" />
							</div>
							<p className="mt-2 text-2xl font-extrabold leading-none text-[#001B3D]">{calledCount}</p>
							<p className="mt-1 text-xs font-semibold text-[#0F5AD8]">acionados</p>
						</div>
					</div>
				</div>
			</header>

			<div className="grid min-h-0 grid-cols-1 gap-5 overflow-visible xl:flex-1 xl:grid-cols-[minmax(280px,0.85fr)_minmax(430px,1.45fr)_minmax(280px,0.9fr)]">
				<div className="space-y-5 overflow-visible xl:flex xl:min-h-0 xl:flex-col">
					<div>
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

				<div className="min-h-0">
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

				<div className="min-h-0">
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
