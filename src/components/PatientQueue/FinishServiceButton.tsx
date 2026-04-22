
import React, { useState, useRef, useEffect } from 'react';
import type { PatientStatus } from '@/types';
import { CheckCircle, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui';

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
      <Tooltip content="Finalizar ou encaminhar">
        <button
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-xl border transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-55',
            isFinished
              ? 'border-[#E2E8F0] bg-[#F1F5F9] text-[#94A3B8]'
              : 'border-[#BFECE1] bg-white text-[#007A65] hover:bg-[#E6F7F2]'
          )}
          onClick={handleToggle}
          disabled={isFinished}
          aria-label="Finalizar ou encaminhar"
          aria-expanded={isOpen}
        >
          <CheckCircle className="size-4" />
        </button>
      </Tooltip>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-[1.35rem] border border-[#DCE5EE] bg-white shadow-[0_24px_70px_rgba(0,27,61,0.16)] animate-in fade-in zoom-in-95 duration-200 sm:bottom-full sm:top-auto sm:mb-2 sm:mt-0 sm:origin-bottom-right">
            <div className="flex items-center justify-between border-b border-[#E5ECF3] bg-[#F8FAFC] p-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#64748B]">
                <span>Ações</span>
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-1 transition-colors hover:bg-[#EAF3FF] hover:text-[#1466F5]">
                  <X className="size-4" />
                </button>
            </div>
          <ul className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
            {options.map((option, idx) => (
              <li
                key={idx}
                className={`
                    group relative flex cursor-pointer select-none items-center gap-2 px-3 py-3 text-sm font-semibold text-[#001B3D]
                    transition-colors hover:bg-[#EAF3FF]
                    ${option.action === 'finish' ? 'mb-1 border-b border-[#E5ECF3] pb-3 text-[#007A65]' : ''}
                `}
                onClick={() => handleSelect(option.action, option.destination)}
              >
                {option.action === 'finish' ? (
                    <CheckCircle className="size-4 text-[#00A885]" />
                ) : (
                    <ArrowRight className="size-4 text-[#64748B] transition-colors group-hover:text-[#1466F5]" />
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
