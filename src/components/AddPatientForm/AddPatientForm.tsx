import React, { useEffect, useRef, useState } from 'react';
import { DESTINATION_ROOMS } from '@/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';

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

  return (
    <div className="lg:col-span-1 bg-[#1a2c22] rounded-2xl p-8 shadow-2xl h-fit">
      <div className="text-left mb-8">
        <h2 className="text-white text-2xl font-bold leading-tight">Adicionar Paciente</h2>
        <p className="text-[#96c5a9] mt-1">Insira os dados para adicionar à fila.</p>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="patient-name">Nome do Paciente</Label>
          <Input
            ref={nameInputRef}
            id="patient-name"
            placeholder="Digite o nome do paciente"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="destination-room">Sala de Destino</Label>
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
        <div className="pt-4">
          <Button type="submit" className="w-full">
            Adicionar à Fila
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddPatientForm;
