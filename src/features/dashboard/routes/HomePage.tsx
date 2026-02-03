import React, { useState } from 'react';
import AddPatientForm from '@/components/AddPatientForm';
import PatientQueue from '@/components/PatientQueue';
import EditPatientModal from '@/components/EditPatientModal';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import QueueActions from '@/components/QueueActions';
import type { Patient } from '@/types';
import { usePatientQueue } from '@/features/dashboard/hooks/usePatientQueue';
import { useUserProfile } from '@/hooks/useUserProfile';

import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
	const {
    patients,
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
  } = usePatientQueue({ defaultDestination: user?.default_destination });

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

	const handleSavePatient = async (updatedPatient: Patient) => {
		await updatePatient(updatedPatient.id, updatedPatient);
		closeModal();
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
			<div className="lg:col-span-1">
				<AddPatientForm
					onAddPatient={addPatientByName}
					defaultDestination={profile?.default_destination ?? undefined}
					isAddingPatient={isAddingPatient}
				/>
				<QueueActions
					onClearQueue={handleClearQueue}
					onAddPatientByNumber={handleAddPatientByNumber}
					isAddingPatient={isAddingPatient}
				/>
			</div>
			<PatientQueue
				patients={patients}
				onEdit={openModal}
				onCall={callPatient}
				onUpdateStatus={updatePatientStatus}
				onUpdateDestination={updatePatientDestination}
				onRemove={handleRemovePatient}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				selectedDestination={selectedDestination}
				setSelectedDestination={setSelectedDestination}
			/>
			{isModalOpen && editingPatient && (
				<EditPatientModal patient={editingPatient} onSave={handleSavePatient} onClose={closeModal} isOpen={isModalOpen} />
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
		</div>
	);
};

export default HomePage;
