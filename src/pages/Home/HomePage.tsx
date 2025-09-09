import React, { useMemo, useState } from 'react';
import AddPatientForm from '@/components/AddPatientForm';
import PatientQueue from '@/components/PatientQueue';
import EditPatientModal from '@/components/EditPatientModal';
import type { Patient, PatientStatus, CallRecord } from '@/types';
import { toast } from 'react-toastify';
import { CALL_HISTORY_LIMIT, STORAGE_KEYS } from '@/constants';
import { addPatient, updatePatient, removePatient, updateStatus, callPatient, appendCallHistory } from '@/actions/patients';
import { storage } from '@/actions/storage';

const initialPatients: Patient[] = [
  {
    id: 1,
    name: 'Maria da Silva',
    destination: 'Consultório Médico',
    status: 'Em Atendimento',
    callCount: 0,
  },
  {
    id: 2,
    name: 'João Pereira',
    destination: 'Triagem',
    status: 'Aguardando',
    callCount: 0,
  },
  {
    id: 3,
    name: 'Ana Souza',
    destination: 'Sala de Vacinação',
    status: 'Atendimento Finalizado',
    callCount: 0,
  },
];

const HomePage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');

  const handleCallPatient = (id: number) => {
    const result = callPatient(patients, id);
    if (!result) return;
    const { updated, called, next } = result;
    setPatients(updated);

    storage.set(STORAGE_KEYS.calledPatient, called);
    storage.set(STORAGE_KEYS.nextPatients, next);

    const current = storage.get<CallRecord[]>(STORAGE_KEYS.callHistory) ?? [];
    const updatedHistory = appendCallHistory(current, called, CALL_HISTORY_LIMIT);
    storage.set(STORAGE_KEYS.callHistory, updatedHistory);

    const time = called.callCount > 1 ? ` pela ${called.callCount}ª vez` : '';
    toast.success(`${called.name} foi chamado(a)${time}!`);
  };

  const handleAddPatient = (name: string, destination: string) => {
    if (!name || !destination) {
      toast.error('Nome e destino são obrigatórios!');
      return;
    }
    const newList = addPatient(patients, { name, destination });
    setPatients(newList);
    toast.success('Paciente adicionado com sucesso!');
  };

  const handleUpdatePatient = (updatedP: Patient) => {
    setPatients(updatePatient(patients, updatedP));
    closeModal();
    toast.info('Paciente atualizado com sucesso!');
  };

  const handleUpdateStatus = (id: number, status: PatientStatus) => {
    const newList = updateStatus(patients, id, status);
    setPatients(newList);
    const patient = patients.find((p) => p.id === id);
    if (patient) {
      toast.info(`Status de ${patient.name} alterado para "${status}"!`);
    }
  };

  const handleRemovePatient = (id: number) => {
    setPatients(removePatient(patients, id));
    toast.warning('Paciente removido da fila!');
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
      <AddPatientForm onAddPatient={handleAddPatient} />
      <PatientQueue
        patients={filteredPatients}
        onEdit={openModal}
        onCall={handleCallPatient}
        onUpdateStatus={handleUpdateStatus}
        onRemove={handleRemovePatient}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedDestination={selectedDestination}
        setSelectedDestination={setSelectedDestination}
      />
      {isModalOpen && editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onSave={handleUpdatePatient}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default HomePage;
