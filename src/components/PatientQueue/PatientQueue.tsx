import React from 'react';
import PatientCard from './PatientCard';
import type { Patient, PatientStatus } from '@/types';
import { DESTINATION_ROOMS } from '@/constants';
import CustomSelect from '@/components/CustomSelect';

interface PatientQueueProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onCall: (id: string, destination: string) => void;
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onRemove: (patient: Patient) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDestination: string;
  setSelectedDestination: (destination: string) => void;
  onUpdateDestination: (id: string, destination: string) => void;
}

/**
 * A component that displays and manages the patient waiting queue.
 * It includes functionality for searching, filtering, and performing actions on patients.
 * @param {PatientQueueProps} props - The component props.
 * @param {Patient[]} props.patients - The list of patients to display.
 * @param {(patient: Patient) => void} props.onEdit - Callback function to edit a patient.
 * @param {(id: string, destination: string) => void} props.onCall - Callback function to call a patient.
 * @param {(id: string, status: PatientStatus) => void} props.onUpdateStatus - Callback function to update a patient's status.
 * @param {(patient: Patient) => void} props.onRemove - Callback function to remove a patient.
 * @param {string} props.searchTerm - The current search term for filtering patients.
 * @param {(term: string) => void} props.setSearchTerm - Callback function to update the search term.
 * @param {string} props.selectedDestination - The currently selected destination for filtering.
 * @param {(destination: string) => void} props.setSelectedDestination - Callback function to update the selected destination.
 * @param {(id: string, destination: string) => void} props.onUpdateDestination - Callback function to update the patient's destination.
 */
const PatientQueue: React.FC<PatientQueueProps> = ({
  patients,
  onEdit,
  onCall,
  onUpdateStatus,
  onRemove,
  searchTerm,
  setSearchTerm,
  selectedDestination,
  setSelectedDestination,
  onUpdateDestination,
}) => {
  const selectOptions = [
    { value: '', label: 'Todas as Salas' },
    ...DESTINATION_ROOMS.map(room => ({ value: room, label: room }))
  ];

  return (
    <div className="lg:col-span-2 bg-[#1a2c22] rounded-2xl p-8 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div className="text-left">
          <h2 className="text-white text-2xl font-bold leading-tight">Fila de Espera</h2>
          <p className="text-[#96c5a9] mt-1">Gerencie os pacientes na fila de atendimento.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96c5a9]">search</span>
            <input
              className="form-input w-full rounded-full text-white bg-[#264532] border-none h-14 pl-12 pr-4 placeholder:text-[#96c5a9] focus:ring-2 focus:ring-primary transition-all focus:outline-none"
              id="search-patient"
              placeholder="Pesquisar paciente..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <CustomSelect
            id="filter-destination-room"
            options={selectOptions}
            value={selectedDestination}
            onChange={setSelectedDestination}
            icon="meeting_room"
            placeholder="Todas as Salas"
            className="w-full sm:w-64"
          />
        </div>
      </div>
      <div className={`space-y-4 pr-2 ${patients.length > 4 ? 'max-h-[calc(100vh-22rem)] overflow-y-auto' : ''}`}>
        {patients.length > 0 ? (
          patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onEdit={onEdit}
              onCall={onCall}
              onUpdateStatus={onUpdateStatus}
              onUpdateDestination={onUpdateDestination}
              onRemove={() => onRemove(patient)}
            />
          ))
        ) : (
          <div className="text-center py-10 text-[#96c5a9]">
            <p>Nenhum paciente encontrado na fila com os filtros atuais.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientQueue;
