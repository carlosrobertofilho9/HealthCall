import React, { useEffect, useRef, useState } from 'react';
import { DESTINATION_ROOMS } from '@/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Button,
  Label
} from '@/components/ui';
import { Loader2, UserPlus, User, DoorOpen, Plus } from 'lucide-react';

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
    <div className="lg:col-span-1 bg-card rounded-2xl p-6 shadow-sm border border-border h-fit xl:rounded-none xl:border-0 xl:shadow-none xl:bg-transparent">
      <div className="flex flex-col gap-2 mb-6">
      <h2 className="text-card-foreground text-2xl font-bold leading-tight flex items-center gap-3">
        <div className="p-2 bg-secondary rounded-lg border border-border shadow-inner">
          <UserPlus className="text-muted-foreground" size={24} />
            </div>
            Adicionar Paciente
        </h2>
      <p className="text-muted-foreground text-sm pl-1">Insira os dados para adicionar à fila.</p>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="patient-name" className="text-card-foreground font-medium mb-2 block">
            Nome do Paciente
          </Label>
          <Input
            ref={nameInputRef}
            id="patient-name"
            placeholder="Digite o nome do paciente"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            icon={<User className="h-4 w-4" />}
          />
        </div>
        <div>
          <Label htmlFor="destination-room" className="text-card-foreground font-medium mb-2 block">
            Sala de Destino
          </Label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
                <DoorOpen size={20} />
            </div>
            <Select onValueChange={setDestination} value={destination}>
              <SelectTrigger id="destination-room" className="pl-12">
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
        <div className="pt-2">
          <Button type="submit" disabled={isAddingPatient} className="w-full">
            {isAddingPatient ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Plus className="mr-2" size={20} />
            )}
            <span className="truncate">{isAddingPatient ? 'Adicionando...' : 'Adicionar à Fila'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddPatientForm;