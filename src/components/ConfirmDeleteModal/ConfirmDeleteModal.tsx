import React from 'react';
import useAnimation from '@/hooks/useAnimation';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patientName: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm, patientName }) => {
  const { shouldRender, isVisible } = useAnimation(isOpen);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}>
      <div className={`bg-[#1a2c22] rounded-2xl p-8 shadow-2xl w-full max-w-md mx-4 relative transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute top-4 right-4 text-[#96c5a9] hover:text-white transition-colors"
          onClick={onClose}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="text-left mb-8">
          <h2 className="text-white text-2xl font-bold leading-tight">Confirmar Exclusão</h2>
          <p className="text-[#96c5a9] mt-1">
            Tem certeza que deseja remover <span className="font-bold text-white">{patientName}</span> da fila?
          </p>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            className="px-6 py-3 rounded-full bg-[#264532] text-white font-bold hover:bg-[#3a6b4d] transition-colors"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-6 py-3 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
