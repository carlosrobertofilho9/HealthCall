import React from 'react';
import PatientCard from './PatientCard';
import type { Patient, PatientStatus } from '@/types';
import { DESTINATION_ROOMS } from '@/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Input } from '@/components/ui/Input';

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
 * Um componente que exibe a lista de pacientes na fila de espera.
 *
 * Este componente renderiza a fila de pacientes e inclui controles de interface do usuário para
 * pesquisar por nome e filtrar por destino. Cada paciente é exibido usando o
 * componente `PatientCard`.
 *
 * @param {PatientQueueProps} props As propriedades do componente.
 * @param {Patient[]} props.patients A lista de pacientes a ser exibida.
 * @param {(patient: Patient) => void} props.onEdit Callback acionado ao editar um paciente.
 * @param {(id: string, destination: string) => void} props.onCall Callback acionado ao chamar um paciente.
 * @param {(id: string, status: PatientStatus) => void} props.onUpdateStatus Callback acionado ao atualizar o status de um paciente.
 * @param {(patient: Patient) => void} props.onRemove Callback acionado ao remover um paciente.
 * @param {string} props.searchTerm O termo de pesquisa atual.
 * @param {(term: string) => void} props.setSearchTerm Callback para atualizar o termo de pesquisa.
 * @param {string} props.selectedDestination O destino atualmente selecionado para filtragem.
 * @param {(destination: string) => void} props.setSelectedDestination Callback para atualizar o filtro de destino.
 * @param {(id: string, destination: string) => void} props.onUpdateDestination Callback acionado ao atualizar o destino de um paciente.
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
            <Input
              id="search-patient"
              placeholder="Pesquisar paciente..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96c5a9] z-10">filter_list</span>
            <Select onValueChange={(value) => setSelectedDestination(value === 'all' ? '' : value)} value={selectedDestination || 'all'}>
              <SelectTrigger id="filter-destination-room">
                <SelectValue placeholder="Todas as Salas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Salas</SelectItem>
                {DESTINATION_ROOMS.map(room => (
                  <SelectItem key={room} value={room}>{room}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
