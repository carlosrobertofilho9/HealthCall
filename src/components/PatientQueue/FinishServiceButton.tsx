
import React, { useState, useRef, useEffect } from 'react';
import type { PatientStatus } from '@/types';

interface FinishServiceButtonProps {
  patientId: string;
  isFinished: boolean;
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onUpdateDestination: (id: string, destination: string) => void;
}

const FinishServiceButton: React.FC<FinishServiceButtonProps> = ({
  patientId,
  isFinished,
  onUpdateStatus,
  onUpdateDestination,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!isFinished) {
      setIsOpen(prev => !prev);
    }
  };

  const handleSelect = (action: string, destination?: string) => {
    if (action === 'finish') {
      onUpdateStatus(patientId, 'Atendimento Finalizado');
    } else if (action === 'forward' && destination) {
      onUpdateDestination(patientId, destination);
      onUpdateStatus(patientId, 'Aguardando');
    }
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const options = [
    { label: 'Finalizar Atendimento', action: 'finish' },
    { label: 'Encaminhar para Consultorio Médico', action: 'forward', destination: 'Consultorio Médico' },
    { label: 'Encaminhar para Consultorio Enfermagem', action: 'forward', destination: 'Consultorio Enfermagem' },
    { label: 'Encaminhar para Consultorio Odontologico', action: 'forward', destination: 'Consultorio Odontologico' },
    { label: 'Encaminhar para Sala de Vacinação', action: 'forward', destination: 'Sala de Vacinação' },
    { label: 'Encaminhar para Triagem', action: 'forward', destination: 'Triagem' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        className={`flex items-center justify-center rounded-full h-10 w-10 ${
          isFinished
            ? 'bg-green-500/10 text-green-400/50 cursor-not-allowed'
            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors'
        }`}
        title="Finalizar Atendimento"
        onClick={handleToggle}
        disabled={isFinished}
        aria-label="Finalizar Atendimento"
      >
        <span className="material-symbols-outlined text-base">check_circle</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-72 rounded-md bg-[#264532] shadow-lg max-h-60 overflow-auto right-0">
          <ul className="py-1">
            {options.map(option => (
              <li
                key={option.label}
                className="text-white cursor-pointer select-none relative py-2 px-4 hover:bg-[#3a6b4d]"
                onClick={() => handleSelect(option.action, option.destination)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FinishServiceButton;
