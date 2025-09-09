import React, { useEffect, useMemo, useState } from 'react';
import AddPatientForm from '@/components/AddPatientForm';
import PatientQueue from '@/components/PatientQueue';
import EditPatientModal from '@/components/EditPatientModal';
import type { Patient, PatientStatus, CallRecord } from '@/types';
import { toast } from 'react-toastify';
import { getPatients, addPatient, updatePatient, removePatient, callPatient } from '@/actions/patients';
import { storage } from '@/actions/storage';
import { CALL_HISTORY_LIMIT, STORAGE_KEYS } from '@/constants';

// The appendCallHistory function is not available in the new actions file, so we define it here.
// In a real application, this would be in a shared utility file.
function appendCallHistory(history: CallRecord[], called: Patient, limit = 20): CallRecord[] {
	const record: CallRecord = {
		id: called.id,
		name: called.name,
		destination: called.destination,
		callCount: called.callCount,
		calledAt: Date.now(),
	};
	const arr = [record, ...history]
		.filter(
			(rec, idx, arr2) =>
				idx === 0 || !(rec.id === arr2[idx - 1].id && rec.callCount === arr2[idx - 1].callCount)
		)
		.slice(0, limit);
	return arr;
}

const HomePage: React.FC = () => {
	const [patients, setPatients] = useState<Patient[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedDestination, setSelectedDestination] = useState('');

	useEffect(() => {
		const fetchPatients = async () => {
			const data = await getPatients();
			setPatients(data);
		};
		fetchPatients();
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

			// Update localStorage for the display page
			storage.set(STORAGE_KEYS.calledPatient, updatedPatient);
			const next = patients.filter((p) => p.status === 'Aguardando' && p.id !== id);
			storage.set(STORAGE_KEYS.nextPatients, next);

			const currentHistory = storage.get<CallRecord[]>(STORAGE_KEYS.callHistory) ?? [];
			const updatedHistory = appendCallHistory(currentHistory, updatedPatient, CALL_HISTORY_LIMIT);
			storage.set(STORAGE_KEYS.callHistory, updatedHistory);

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
			}
		}
	};

	const handleRemovePatient = async (id: string) => {
		const success = await removePatient(id);
		if (success) {
			setPatients(patients.filter((p) => p.id !== id));
			toast.warning('Paciente removido da fila!');
		} else {
			toast.error('Erro ao remover paciente!');
		}
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
					p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
					(selectedDestination === '' || p.destination === selectedDestination)
			),
		[patients, searchTerm, selectedDestination]
	);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
			<div className="lg:col-span-1">
				<AddPatientForm onAddPatient={handleAddPatient} />
			</div>
			<PatientQueue
				patients={filteredPatients}
				onEdit={openModal}
				onCall={(id: string, destination: string) => handleCallPatient(id, destination)}
				onUpdateStatus={handleUpdateStatus}
				onRemove={handleRemovePatient}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				selectedDestination={selectedDestination}
				setSelectedDestination={setSelectedDestination}
			/>
			{isModalOpen && editingPatient && (
				<EditPatientModal patient={editingPatient} onSave={handleUpdatePatient} onClose={closeModal} />
			)}
		</div>
	);
};

export default HomePage;
