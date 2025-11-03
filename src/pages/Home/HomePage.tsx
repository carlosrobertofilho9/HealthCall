import React, { useEffect, useMemo, useState } from 'react';
import AddPatientForm from '@/components/AddPatientForm';
import PatientQueue from '@/components/PatientQueue';
import EditPatientModal from '@/components/EditPatientModal';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import QueueActions from '@/components/QueueActions';
import type { Patient, PatientStatus, CallRecord } from '@/types';
import { toast } from 'react-toastify';
import { getPatients, addPatient, updatePatient, removePatient, callPatient, clearQueue, appendCallHistory } from '@/actions/patients';
import { storage } from '@/actions/storage';
import { CALL_HISTORY_LIMIT, STORAGE_KEYS } from '@/constants';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { supabase } from '@/lib/supabaseClient';


/**
 * The main administrative page for managing the patient queue.
 * It combines the `AddPatientForm` and `PatientQueue` components,
 * and handles all the state management and actions related to patients,
 * including adding, updating, deleting, and calling them.
 */
const HomePage: React.FC = () => {
	const { profile } = useUserProfile();
	const [patients, setPatients] = useState<Patient[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
	const [isClearQueueModalOpen, setIsClearQueueModalOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
	const [selectedDestination, setSelectedDestination] = useState('');
	const [fichaCount, setFichaCount] = useState(1);

	useEffect(() => {
		const timerId = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 300);

		return () => {
			clearTimeout(timerId);
		};
	}, [searchTerm]);

	useEffect(() => {
		const fetchPatients = async () => {
			const data = await getPatients();
			setPatients(data);
		};
		fetchPatients();

		const channel = supabase
			.channel('realtime-patients')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
				fetchPatients();
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	const handleCallPatient = async (id: string, destination: string) => {
		const calledPatientResponse = await callPatient(id, destination);
		if (!calledPatientResponse) {
			toast.error('Erro ao chamar paciente!');
			return;
		}

		// Find the patient in the local state to get the full object
		const patient = patients.find((p) => p.id === id);
		if (patient) {
			// The callPatient action already increments the count in the DB.
			// We need to reflect that change in the local state for the UI.
			const updatedPatient = { ...patient, status: 'Chamado' as PatientStatus, callCount: patient.callCount + 1 };
			setPatients(patients.map((p) => (p.id === id ? updatedPatient : p)));

			const time = updatedPatient.callCount > 1 ? ` pela ${updatedPatient.callCount}ª vez` : '';
			toast.success(`${updatedPatient.name} foi chamado(a)${time}!`);
		}
	};

	const handleAddPatient = async (name: string, destination: string) => {
		if (!name || !destination) {
			toast.error('Nome e destino são obrigatórios!');
			return;
		}
		const newPatient = await addPatient(name, destination);
		if (newPatient) {
			setPatients([newPatient, ...patients]);
			toast.success('Paciente adicionado com sucesso!');
		} else {
			toast.error('Erro ao adicionar paciente!');
		}
	};

	const handleAddPatientByNumber = async () => {
		const destination = profile?.default_destination ?? 'Consultório';
		const patientName = `Ficha ${fichaCount}`;
		const newPatient = await addPatient(patientName, destination);
		if (newPatient) {
			setPatients([newPatient, ...patients]);
			setFichaCount(fichaCount + 1);
			toast.success(`Paciente ${patientName} adicionado com sucesso!`);
		} else {
			toast.error('Erro ao adicionar paciente!');
		}
	};

	const handleUpdatePatient = async (updatedP: Patient) => {
		const result = await updatePatient(updatedP);
		if (result) {
			setPatients(patients.map((p) => (p.id === result.id ? result : p)));
			closeModal();
			toast.info('Paciente atualizado com sucesso!');
		} else {
			toast.error('Erro ao atualizar paciente!');
		}
	};

	const handleUpdateStatus = async (id: string, status: PatientStatus) => {
		const patient = patients.find((p) => p.id === id);
		if (patient) {
			const updatedPatientData = { ...patient, status };
			const result = await updatePatient(updatedPatientData);
			if (result) {
				setPatients(patients.map((p) => (p.id === id ? result : p)));
				toast.info(`Status de ${result.name} alterado para "${status}"!`);
			} else {
				toast.error('Erro ao atualizar status! Verifique permissões no banco.');
			}
		}
	};

	const handleUpdateDestination = async (id: string, destination: string) => {
		const patient = patients.find((p) => p.id === id);
		if (patient) {
			const updatedPatientData = { ...patient, destination };
			const result = await updatePatient(updatedPatientData);
			if (result) {
				setPatients(patients.map((p) => (p.id === id ? result : p)));
				toast.info(`Destino de ${result.name} alterado para "${destination}"!`);
			} else {
				toast.error('Erro ao atualizar destino! Verifique permissões no banco.');
			}
		}
	};


	const handleRemovePatient = (patient: Patient) => {
		setPatientToDelete(patient);
		setIsConfirmModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (patientToDelete) {
			const success = await removePatient(patientToDelete.id);
			if (success) {
				setPatients(patients.filter((p) => p.id !== patientToDelete.id));
				toast.warning('Paciente removido da fila!');
			} else {
				toast.error('Erro ao remover paciente! Verifique permissões no banco.');
			}
			setPatientToDelete(null);
			setIsConfirmModalOpen(false);
		}
	};

	const handleClearQueue = () => {
		setIsClearQueueModalOpen(true);
	};

	const handleConfirmClearQueue = async () => {
		const success = await clearQueue();
		if (success) {
			setPatients([]);
			toast.warning('Fila de pacientes limpa!');
		} else {
			toast.error('Erro ao limpar a fila! Verifique permissões no banco.');
		}
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

	const filteredPatients = useMemo(
		() =>
			patients.filter(
				(p) =>
					p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) &&
					(selectedDestination === '' || p.destination === selectedDestination)
			),
		[patients, debouncedSearchTerm, selectedDestination]
	);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
			<div className="lg:col-span-1">
				<AddPatientForm onAddPatient={handleAddPatient} defaultDestination={profile?.default_destination ?? undefined} />
				<QueueActions onClearQueue={handleClearQueue} onAddPatientByNumber={handleAddPatientByNumber} />
			</div>
			<PatientQueue
				patients={filteredPatients}
				onEdit={openModal}
				onCall={(id: string, destination: string) => handleCallPatient(id, destination)}
				onUpdateStatus={handleUpdateStatus}
				onUpdateDestination={handleUpdateDestination}
				onRemove={handleRemovePatient}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				selectedDestination={selectedDestination}
				setSelectedDestination={setSelectedDestination}
			/>
			{isModalOpen && editingPatient && (
				<EditPatientModal patient={editingPatient} onSave={handleUpdatePatient} onClose={closeModal} isOpen={isModalOpen} />
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
