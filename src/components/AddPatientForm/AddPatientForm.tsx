import React, { useEffect, useRef, useState } from 'react';
import { DESTINATION_ROOMS } from '@/constants';
import CustomSelect from '@/components/CustomSelect';

/**
 * A form component for adding a new patient to the queue.
 * @param {object} props - The component props.
 * @param {(name: string, destination: string) => void} props.onAddPatient - Callback function to execute when a patient is added.
 * @param {string | null | undefined} [props.defaultDestination] - The default destination to be selected.
 */
const AddPatientForm: React.FC<{ onAddPatient: (name: string, destination: string) => void; defaultDestination?: string | null }> = ({ onAddPatient, defaultDestination }) => {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultDestination) {
      setDestination(defaultDestination);
    }
  }, [defaultDestination]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPatient(name, destination);
    setName('');
    nameInputRef.current?.focus();
  };

  const rooms = React.useMemo(() => {
    if (defaultDestination && !DESTINATION_ROOMS.includes(defaultDestination)) {
      return [defaultDestination, ...DESTINATION_ROOMS];
    }
    return DESTINATION_ROOMS;
  }, [defaultDestination]);

  const selectOptions = [
    { value: '', label: 'Selecione a sala' },
    ...rooms.map(room => ({ value: room, label: room }))
  ];

  return (
    <div className="lg:col-span-1 bg-[#1a2c22] rounded-2xl p-8 shadow-2xl h-fit">
      <div className="text-left mb-8">
        <h2 className="text-white text-2xl font-bold leading-tight">Adicionar Paciente</h2>
        <p className="text-[#96c5a9] mt-1">Insira os dados para adicionar à fila.</p>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="text-white font-medium mb-2 block" htmlFor="patient-name">
            Nome do Paciente
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96c5a9]">person</span>
            <input
              ref={nameInputRef}
              className="form-input w-full rounded-full text-white bg-[#264532] border-none h-14 pl-12 pr-4 placeholder:text-[#96c5a9] focus:ring-2 focus:ring-primary transition-all focus:outline-none"
              id="patient-name"
              placeholder="Digite o nome do paciente"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="text-white font-medium mb-2 block" htmlFor="destination-room">
            Sala de Destino
          </label>
          <CustomSelect
            id="destination-room"
            options={selectOptions}
            value={destination}
            onChange={setDestination}
            icon="meeting_room"
            placeholder="Selecione a sala"
          />
        </div>
        <div className="pt-4">
          <button
            className="w-full flex items-center justify-center gap-2 rounded-full h-14 px-6 bg-primary text-[#122118] text-base font-bold hover:bg-opacity-80 transition-all focus:outline-none"
            type="submit"
          >
            <span className="material-symbols-outlined">add</span>
            <span className="truncate">Adicionar à Fila</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPatientForm;
