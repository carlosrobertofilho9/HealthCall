import React from 'react';
import type { PatientStatus } from '@/types';

/**
 * A badge component to display the status of a patient.
 * @param {object} props - The component props.
 * @param {PatientStatus} props.status - The status of the patient.
 */
const PatientStatusBadge: React.FC<{ status: PatientStatus }> = ({ status }) => {
  const baseClasses = 'mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium';
  const statusInfo = {
    'Em Atendimento': {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      dot: 'bg-blue-400',
    },
    Aguardando: {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-400',
      dot: 'bg-yellow-400',
    },
    'Atendimento Finalizado': {
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      dot: 'bg-gray-400',
    },
    Chamado: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      dot: 'bg-green-400',
    },
  } as const;
  const { bg, text, dot } = statusInfo[status];
  return (
    <div className={`${baseClasses} ${bg} ${text}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`}></span>
      <span>{status}</span>
    </div>
  );
};

export default PatientStatusBadge;
