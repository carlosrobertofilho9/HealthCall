
import React, { useState, useRef, useEffect } from 'react';
import type { PatientStatus } from '@/types';
import { CheckCircle, ArrowRight, X } from 'lucide-react';

interface FinishServiceButtonProps {
  patientId: string;
  isFinished: boolean;
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onUpdateDestination: (id: string, destination: string) => void;
}

/**
 * Um botão com um menu suspenso para finalizar o atendimento de um paciente ou encaminhá-lo.
 */
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
    { label: 'Finalizar Atendimento', action: 'finish', icon: CheckCircle, color: 'text-green-400' },
    { label: 'Encaminhar para Cons. Médico', action: 'forward', destination: 'Consultorio Médico' },
    { label: 'Encaminhar para Cons. Enfermagem', action: 'forward', destination: 'Consultorio Enfermagem' },
    { label: 'Encaminhar para Cons. Odontológico', action: 'forward', destination: 'Consultorio Odontologico' },
    { label: 'Encaminhar para Sala de Vacinação', action: 'forward', destination: 'Sala de Vacinação' },
    { label: 'Encaminhar para Triagem', action: 'forward', destination: 'Triagem' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        className={`
          flex items-center justify-center rounded-md h-9 w-9 transition-all active:scale-95
          ${isFinished
            ? 'text-green-400/50 cursor-not-allowed'
            : 'text-green-400 hover:bg-green-500/20 hover:text-green-300'
          }
        `}
        title="Finalizar/Encaminhar"
        onClick={handleToggle}
        disabled={isFinished}
        aria-label="Finalizar ou Encaminhar"
        aria-expanded={isOpen}
      >
        <CheckCircle size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 z-50 w-64 rounded-xl bg-[#1a2c22] border border-[#264532] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">
            <div className="p-2 border-b border-[#264532] flex items-center justify-between text-xs text-gray-400 font-medium uppercase tracking-wider bg-[#264532]/30">
                <span>Ações</span>
                <button onClick={() => setIsOpen(false)} className="hover:text-white"><X size={14}/></button>
            </div>
          <ul className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
            {options.map((option, idx) => (
              <li
                key={idx}
                className={`
                    group flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none relative py-2.5 px-3 
                    hover:bg-[#264532] hover:text-white transition-colors
                    ${option.action === 'finish' ? 'border-b border-[#264532] mb-1 pb-3 text-green-400 font-medium hover:text-green-300' : ''}
                `}
                onClick={() => handleSelect(option.action, option.destination)}
              >
                {option.action === 'finish' ? (
                    <CheckCircle size={16} className="text-green-500" />
                ) : (
                    <ArrowRight size={14} className="text-[#96c5a9] group-hover:text-white transition-colors" />
                )}
                <span>{option.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FinishServiceButton;
