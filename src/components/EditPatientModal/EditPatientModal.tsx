import React, { useEffect, useState } from 'react';
import type { Patient } from '@/types';
import { DESTINATION_ROOMS } from '@/constants';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { DoorOpen, User, Save, X } from 'lucide-react';

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

  useEffect(() => {
    if (!isOpen) return;
    setName(patient.name);
    setDestination(patient.destination);
  }, [isOpen, patient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...patient, name, destination });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="max-w-lg p-8 shadow-sm">
        <div className="text-left mb-8">
          <h2 className="text-card-foreground text-2xl font-bold leading-tight">Editar Paciente</h2>
          <p className="text-muted-foreground mt-1">Altere as informações do paciente e salve.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <Label className="text-card-foreground font-medium mb-2 block" htmlFor="edit-patient-name">
              Nome do Paciente
            </Label>
            <Input
              id="edit-patient-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              icon={<User className="h-4 w-4" />}
              className="h-14"
            />
          </div>
          <div>
            <Label className="text-card-foreground font-medium mb-2 block" htmlFor="edit-destination-room">
              Sala de Destino
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
                <DoorOpen size={20} />
              </span>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger id="edit-destination-room" className="h-14">
                  <SelectValue placeholder="Selecione a sala" />
                </SelectTrigger>
                <SelectContent>
                {DESTINATION_ROOMS.map((room) => (
                  <SelectItem key={room} value={room}>
                    {room}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="pt-4 flex items-center gap-4">
            <Button className="w-full" type="submit">
              <Save size={18} />
              <span className="truncate">Salvar Alterações</span>
            </Button>
            <Button onClick={onClose} variant="secondary" className="w-full" type="button">
              <X size={18} />
              <span className="truncate">Cancelar</span>
            </Button>
          </div>
        </form>
    </Modal>
  );
};

export default EditPatientModal;
