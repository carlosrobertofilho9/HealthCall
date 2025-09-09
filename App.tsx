import React, { useState, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Header from "./components/Header";
import AddPatientForm from "./components/AddPatientForm";
import PatientQueue from "./components/PatientQueue";
import EditPatientModal from "./components/EditPatientModal";
import DisplayPage from "./components/DisplayPage";
import type { Patient, PatientStatus, CallRecord } from "./types";

const initialPatients: Patient[] = [
  {
    id: 1,
    name: "Maria da Silva",
    destination: "Consultório Médico",
    status: "Em Atendimento",
    callCount: 0,
  },
  {
    id: 2,
    name: "João Pereira",
    destination: "Triagem",
    status: "Aguardando",
    callCount: 0,
  },
  {
    id: 3,
    name: "Ana Souza",
    destination: "Sala de Vacinação",
    status: "Atendimento Finalizado",
    callCount: 0,
  },
];

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/display" element={<DisplayPage />} />
      </Routes>
    </Router>
  );
};

const MainApp = () => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");

  // Chama o paciente (toca som/voz na tela de exibição), incrementa contagem,
  // marca como lastCalled, mas NÃO muda o status para "Em Atendimento".
  const handleCallPatient = (id: number) => {
    let calledPatient: Patient | null = null;

    const updatedPatients = patients.map((p) => {
      if (p.id === id) {
        const updated = {
          ...p,
          callCount: p.callCount + 1,
          lastCalled: true,
        } as Patient;
        calledPatient = updated;
        return updated;
      }
      // Remove marcação de último chamado dos demais
      const { lastCalled, ...rest } = p;
      return { ...rest } as Patient;
    });

    setPatients(updatedPatients);

    if (calledPatient) {
      const nextPatients = updatedPatients.filter(
        (p) => p.status === "Aguardando" && p.id !== calledPatient!.id
      );
      localStorage.setItem("calledPatient", JSON.stringify(calledPatient));
      localStorage.setItem("nextPatients", JSON.stringify(nextPatients));

      // Atualiza histórico de chamadas
      try {
        const current: CallRecord[] = JSON.parse(
          localStorage.getItem("callHistory") || "[]"
        );
        const record: CallRecord = {
          id: calledPatient.id,
          name: calledPatient.name,
          destination: calledPatient.destination,
          callCount: calledPatient.callCount,
          calledAt: Date.now(),
        };
        const updatedHistory = [record, ...current]
          // evita entradas duplicadas consecutivas id+callCount
          .filter((rec, idx, arr) =>
            idx === 0 || !(rec.id === arr[idx - 1].id && rec.callCount === arr[idx - 1].callCount)
          )
          .slice(0, 20); // mantém as últimas 20
        localStorage.setItem("callHistory", JSON.stringify(updatedHistory));
      } catch (e) {
        console.warn("Falha ao atualizar callHistory:", e);
      }

      const time =
        calledPatient.callCount > 1
          ? ` pela ${calledPatient.callCount}ª vez`
          : "";
      toast.success(`${calledPatient.name} foi chamado(a)${time}!`);
    }
  };

  const handleAddPatient = (name: string, destination: string) => {
    if (!name || !destination) {
      toast.error("Nome e destino são obrigatórios!");
      return;
    }
    const newPatient: Patient = {
      id: Date.now(),
      name,
      destination,
      status: "Aguardando",
      callCount: 0,
    };
    setPatients([newPatient, ...patients]);
    toast.success("Paciente adicionado com sucesso!");
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(
      patients.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
    );
    closeModal();
    toast.info("Paciente atualizado com sucesso!");
  };

  const handleUpdateStatus = (id: number, status: PatientStatus) => {
    const updatedPatients = patients.map((p) =>
      p.id === id ? { ...p, status } : p
    );
    setPatients(updatedPatients);

    const patient = patients.find((p) => p.id === id);
    if (patient) {
      toast.info(`Status de ${patient.name} alterado para "${status}"!`);
    }
  };

  const handleRemovePatient = (id: number) => {
    setPatients(patients.filter((p) => p.id !== id));
    toast.warning("Paciente removido da fila!");
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
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        aria-label="notificações"
      />
      <Header />
      <main className="flex-1 px-4 py-10 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
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
