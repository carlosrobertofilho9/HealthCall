import React from 'react';
import PatientStatusBadge from './PatientStatusBadge';
import type { Patient, PatientStatus } from '../types';

const PatientCard: React.FC<{
    patient: Patient;
    onEdit: (patient: Patient) => void;
    onUpdateStatus: (id: number, status: PatientStatus) => void;
    onRemove: (id: number) => void;
}> = ({ patient, onEdit, onUpdateStatus, onRemove }) => {
    const isFinished = patient.status === 'Atendimento Finalizado';
    return (
        <div className={`bg-[#264532] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-opacity ${isFinished ? 'opacity-60' : ''}`}>
            <div className="flex-1">
                <p className="text-white font-bold text-lg">{patient.name}</p>
                <p className="text-[#96c5a9] text-sm">Destino: {patient.destination}</p>
                <PatientStatusBadge status={patient.status} />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
                <button 
                    className={`flex items-center justify-center rounded-full h-10 w-10 ${isFinished ? 'bg-primary/10 text-primary/50 cursor-not-allowed' : 'bg-primary/20 text-primary hover:bg-primary/30 transition-colors'}`} 
                    title={patient.status === 'Aguardando' ? 'Chamar Paciente' : 'Chamar Novamente'}
                    onClick={() => onUpdateStatus(patient.id, 'Em Atendimento')}
                    disabled={isFinished}
                    aria-label="Chamar Paciente"
                >
                    <span className="material-symbols-outlined text-base">campaign</span>
                </button>
                <button 
                    className={`edit-patient-btn flex items-center justify-center rounded-full h-10 w-10 ${isFinished ? 'bg-yellow-500/10 text-yellow-400/50 cursor-not-allowed' : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors'}`} 
                    title="Editar"
                    onClick={() => onEdit(patient)}
                    disabled={isFinished}
                    aria-label="Editar Paciente"
                >
                    <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button 
                    className="flex items-center justify-center rounded-full h-10 w-10 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" 
                    title="Remover da Fila"
                    onClick={() => onRemove(patient.id)}
                    aria-label="Remover da Fila"
                >
                    <span className="material-symbols-outlined text-base">delete</span>
                </button>
                <button 
                    className={`flex items-center justify-center rounded-full h-10 w-10 ${isFinished ? 'bg-green-500/10 text-green-400/50 cursor-not-allowed' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors'}`} 
                    title="Finalizar Atendimento"
                    onClick={() => onUpdateStatus(patient.id, 'Atendimento Finalizado')}
                    disabled={isFinished}
                    aria-label="Finalizar Atendimento"
                >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                </button>
            </div>
        </div>
    );
};

export default PatientCard;
