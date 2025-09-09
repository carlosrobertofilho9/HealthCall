import React, { useEffect, useState } from 'react';
import { DESTINATION_ROOMS } from '@/constants';

const AddPatientForm: React.FC<{ onAddPatient: (name: string, destination: string) => void; defaultDestination?: string | null }> = ({ onAddPatient, defaultDestination }) => {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');

  useEffect(() => {
    if (defaultDestination) {
      setDestination(defaultDestination);
    }
  }, [defaultDestination]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPatient(name, destination);
    setName('');
    setDestination('');
  };

  const rooms = React.useMemo(() => {
    if (defaultDestination && !DESTINATION_ROOMS.includes(defaultDestination)) {
      return [defaultDestination, ...DESTINATION_ROOMS];
    }
    return DESTINATION_ROOMS;
  }, [defaultDestination]);

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
              className="form-input w-full rounded-full text-white bg-[#264532] border-none h-14 pl-12 pr-4 placeholder:text-[#96c5a9] focus:ring-2 focus:ring-primary transition-all"
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
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96c5a9]">meeting_room</span>
            <select
              className="form-select appearance-none w-full rounded-full text-white bg-[#264532] border-none h-14 pl-12 pr-10 placeholder:text-[#96c5a9] focus:ring-2 focus:ring-primary transition-all"
              id="destination-room"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecione a sala
              </option>
              {rooms.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#96c5a9] pointer-events-none">expand_more</span>
          </div>
        </div>
        <div className="pt-4">
          <button
            className="w-full flex items-center justify-center gap-2 rounded-full h-14 px-6 bg-primary text-[#122118] text-base font-bold hover:bg-opacity-80 transition-all"
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
