import React, { useState } from 'react';
import AddPatientForm from '@/components/AddPatientForm';
import PatientQueue from '@/components/PatientQueue';
import EditPatientModal from '@/components/EditPatientModal';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import QueueActions from '@/components/QueueActions';
import type { Patient } from '@/types';
import { usePatientQueue } from '@/features/dashboard/hooks/usePatientQueue';
import { useUserProfileStore } from '@/store/userProfile';

const HomePage: React.FC = () => {
	const { profile } = useUserProfileStore();
	const {
    patients,
    searchTerm,
    setSearchTerm,
    selectedDestination,
    setSelectedDestination,
    addPatient,
    updatePatientStatus,
    updatePatientDestination,
    removePatient,
    callPatient,
    clearQueue,
    updatePatient
  } = usePatientQueue();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
	const [isClearQueueModalOpen, setIsClearQueueModalOpen] = useState(false);
  const [fichaCount, setFichaCount] = useState(1);

  const handleAddPatientByNumber = async () => {
		const destination = profile?.default_destination ?? 'Consultório';
		const patientName = `Ficha ${fichaCount}`;
		await addPatient(patientName, destination);
    setFichaCount(fichaCount + 1);
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

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
			<div className="lg:col-span-1">
				<AddPatientForm onAddPatient={addPatient} defaultDestination={profile?.default_destination ?? undefined} />
				<QueueActions onClearQueue={handleClearQueue} onAddPatientByNumber={handleAddPatientByNumber} />
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
		</div>
	);
};

export default HomePage;
