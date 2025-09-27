import React, { useEffect, useState } from 'react';
import type { Patient } from '@/types';
import { DESTINATION_ROOMS } from '@/constants';
import useAnimation from '@/hooks/useAnimation';

/**
 * A modal component for editing an existing patient's information.
 * @param {object} props - The component props.
 * @param {Patient} props.patient - The patient object to be edited.
 * @param {(patient: Patient) => void} props.onSave - Callback function to save the updated patient data.
 * @param {() => void} props.onClose - Callback function to close the modal.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 */
const EditPatientModal: React.FC<{
  patient: Patient;
  onSave: (patient: Patient) => void;
  onClose: () => void;
  isOpen: boolean; // Add isOpen prop
}> = ({ patient, onSave, onClose, isOpen }) => {
  const [name, setName] = useState(patient.name);
  const [destination, setDestination] = useState(patient.destination);
  const { shouldRender, isVisible } = useAnimation(isOpen);

  useEffect(() => {
    if (!isVisible) return; // Only add listener if modal is visible

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...patient, name, destination });
  };

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}>
      <div className={`bg-[#1a2c22] rounded-2xl p-8 shadow-2xl w-full max-w-lg m-4 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={(e) => e.stopPropagation()}>
        <div className="text-left mb-8">
          <h2 className="text-white text-2xl font-bold leading-tight">Editar Paciente</h2>
          <p className="text-[#96c5a9] mt-1">Altere as informações do paciente e salve.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-white font-medium mb-2 block" htmlFor="edit-patient-name">
              Nome do Paciente
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96c5a9]">person</span>
              <input
                className="form-input w-full rounded-full text-white bg-[#264532] border-none h-14 pl-12 pr-4 placeholder:text-[#96c5a9] focus:ring-2 focus:ring-primary transition-all focus:outline-none"
                id="edit-patient-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-white font-medium mb-2 block" htmlFor="edit-destination-room">
              Sala de Destino
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96c5a9]">meeting_room</span>
              <select
                className="form-select appearance-none w-full rounded-full text-white bg-[#264532] border-none h-14 pl-12 pr-10 placeholder:text-[#96c5a9] focus:ring-2 focus:ring-primary transition-all focus:outline-none"
                id="edit-destination-room"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              >
                {DESTINATION_ROOMS.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#96c5a9] pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="pt-4 flex items-center gap-4">
            <button className="w-full flex items-center justify-center gap-2 rounded-full h-14 px-6 bg-primary text-[#122118] text-base font-bold hover:bg-opacity-80 transition-all focus:outline-none" type="submit">
              <span className="material-symbols-outlined">save</span>
              <span className="truncate">Salvar Alterações</span>
            </button>
            <button onClick={onClose} className="w-full flex items-center justify-center gap-2 rounded-full h-14 px-6 bg-[#264532] text-white text-base font-bold hover:bg-[#325a42] transition-all focus:outline-none" type="button">
              <span className="material-symbols-outlined">cancel</span>
              <span className="truncate">Cancelar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatientModal;
