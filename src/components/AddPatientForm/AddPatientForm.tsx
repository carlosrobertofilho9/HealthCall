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
import { DoorOpen, Loader2, Plus, Sparkles, User, UserPlus } from 'lucide-react';

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
    <section className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_20px_55px_rgba(0,27,61,0.08)]">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E6F7F2] text-[#00A885]">
          <UserPlus className="size-6" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold leading-tight text-[#001B3D]">Entrada rápida</h2>
            <Sparkles className="size-4 text-[#1466F5]" />
          </div>
          <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">Adicionar paciente à fila operacional.</p>
        </div>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="patient-name" className="mb-2 block text-sm font-bold text-[#001B3D]">
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
            icon={<User className="size-4 text-[#00A885]" />}
            className="h-[52px] rounded-2xl border-[#DCE5EE] bg-[#F8FAFC] text-[15px] font-semibold text-[#001B3D] placeholder:text-[#94A3B8] focus:border-[#00BB94] focus:bg-white focus:ring-[#00BB94]/20"
          />
        </div>
        <div>
          <Label htmlFor="destination-room" className="mb-2 block text-sm font-bold text-[#001B3D]">
            Sala de Destino
          </Label>
          <div className="relative">
            <Select onValueChange={setDestination} value={destination}>
              <SelectTrigger
                id="destination-room"
                icon={<DoorOpen className="size-4 text-[#1466F5]" />}
                className="h-[52px] rounded-2xl border-[#DCE5EE] bg-[#F8FAFC] text-[15px] font-semibold text-[#001B3D] focus:border-[#00BB94] focus:bg-white focus:ring-[#00BB94]/20"
              >
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
          <Button
            type="submit"
            disabled={isAddingPatient}
            className="h-14 w-full rounded-2xl bg-[#00BB94] text-base font-extrabold text-white shadow-[0_16px_35px_rgba(0,187,148,0.24)] hover:bg-[#00A885] focus-visible:ring-[#00BB94]/50"
          >
            {isAddingPatient ? (
              <Loader2 className="mr-1 size-5 animate-spin" />
            ) : (
              <Plus className="mr-1 size-5" />
            )}
            <span className="truncate">{isAddingPatient ? 'Adicionando...' : 'Adicionar à Fila'}</span>
          </Button>
        </div>
      </form>
    </section>
  );
};

export default AddPatientForm;
