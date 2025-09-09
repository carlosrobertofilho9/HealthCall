import React, { useState, useMemo } from "react";
import Header from "./components/Header";
import AddPatientForm from "./components/AddPatientForm";
import PatientQueue from "./components/PatientQueue";
import EditPatientModal from "./components/EditPatientModal";
import type { Patient, PatientStatus } from "./types";

const initialPatients: Patient[] = [
  {
    id: 1,
    name: "Maria da Silva",
    destination: "Consultório Médico",
    status: "Em Atendimento",
  },
  {
    id: 2,
    name: "João Pereira",
    destination: "Triagem",
    status: "Aguardando",
  },
  {
    id: 3,
    name: "Ana Souza",
    destination: "Sala de Vacinação",
    status: "Atendimento Finalizado",
  },
];

const App = () => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");

  const handleAddPatient = (name: string, destination: string) => {
    if (!name || !destination) return;
    const newPatient: Patient = {
      id: Date.now(),
      name,
      destination,
      status: "Aguardando",
    };
    setPatients([newPatient, ...patients]);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(
      patients.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
    );
    closeModal();
  };

  const handleUpdateStatus = (id: number, status: PatientStatus) => {
    setPatients(
      patients.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  const handleRemovePatient = (id: number) => {
    setPatients(patients.filter((p) => p.id !== id));
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
          (selectedDestination === "" || p.destination === selectedDestination)
      ),
    [patients, searchTerm, selectedDestination]
  );

  return (
    <div className="relative flex size-full min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-10 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
          <AddPatientForm onAddPatient={handleAddPatient} />
          <PatientQueue
            patients={filteredPatients}
            onEdit={openModal}
            onUpdateStatus={handleUpdateStatus}
            onRemove={handleRemovePatient}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedDestination={selectedDestination}
            setSelectedDestination={setSelectedDestination}
          />
        </div>
      </main>
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

export default App;
