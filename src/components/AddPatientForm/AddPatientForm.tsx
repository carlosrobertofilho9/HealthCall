import React, { useEffect, useRef, useState } from 'react';
import { DESTINATION_ROOMS } from '@/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Loader2 } from 'lucide-react';

/**
 * A form component for adding a new patient to the queue.
 * @param {object} props - The component props.
 * @param {(name: string, destination: string) => void} props.onAddPatient - Callback function to execute when a patient is added.
 * @param {string | null | undefined} [props.defaultDestination] - The default destination to be selected.
 * @param {boolean} props.isAddingPatient - Flag to indicate if the patient is being added.
 */
const AddPatientForm: React.FC<{
  onAddPatient: (name: string, destination: string) => void;
  defaultDestination?: string | null;
  isAddingPatient: boolean;
}> = ({ onAddPatient, defaultDestination, isAddingPatient }) => {
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

  return (
    <div className="lg:col-span-1 bg-[#1a2c22] rounded-2xl p-8 shadow-2xl h-fit">
      <div className="text-left mb-8">
        <h2 className="text-white text-2xl font-bold leading-tight">Adicionar Paciente</h2>
        <p className="text-[#96c5a9] mt-1">Insira os dados para adicionar à fila.</p>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="patient-name" className="text-white font-medium mb-2 block">
            Nome do Paciente
          </Label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96c5a9]">person</span>
            <Input
              ref={nameInputRef}
              id="patient-name"
              placeholder="Digite o nome do paciente"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="pl-12"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="destination-room" className="text-white font-medium mb-2 block">
            Sala de Destino
          </Label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96c5a9] z-10">meeting_room</span>
            <Select onValueChange={setDestination} value={destination}>
              <SelectTrigger id="destination-room">
                <SelectValue placeholder="Selecione a sala" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map(room => (
                  <SelectItem key={room} value={room}>{room}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="pt-4">
          <Button type="submit" disabled={isAddingPatient}>
            {isAddingPatient ? (
              <Loader2 className="animate-spin" />
            ) : (
              <span className="material-symbols-outlined">add</span>
            )}
            <span className="truncate">{isAddingPatient ? 'Adicionando...' : 'Adicionar à Fila'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddPatientForm;