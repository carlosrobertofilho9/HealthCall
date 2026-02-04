import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import type { CreateAppointmentData, DocumentType } from '@/types';
import { formatDateToISO } from '../services/appointmentService';

interface AddAppointmentFormProps {
  selectedDate: Date;
  availableSlots: number[];
  onAdd: (data: CreateAppointmentData) => Promise<boolean>;
  onCancel: () => void;
  isLoading: boolean;
  initialSlot?: number;
}

/**
 * Formulário para adicionar uma nova marcação.
 */
export const AddAppointmentForm: React.FC<AddAppointmentFormProps> = ({
  selectedDate,
  availableSlots,
  onAdd,
  onCancel,
  isLoading,
  initialSlot,
}) => {
  const [patientName, setPatientName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('CPF');
  const [documentValue, setDocumentValue] = useState('');
  const [acsName, setAcsName] = useState('');
  const [slotNumber, setSlotNumber] = useState<number>(initialSlot || availableSlots[0] || 1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!patientName.trim()) {
      newErrors.patientName = 'Nome do paciente é obrigatório';
    }

    if (!documentValue.trim()) {
      newErrors.documentValue = 'Documento é obrigatório';
    } else if (documentType === 'CPF' && !isValidCPF(documentValue)) {
      newErrors.documentValue = 'CPF inválido';
    }

    if (!acsName.trim()) {
      newErrors.acsName = 'ACS é obrigatório';
    }

    if (!slotNumber || !availableSlots.includes(slotNumber)) {
      newErrors.slotNumber = 'Selecione um slot disponível';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const data: CreateAppointmentData = {
      scheduled_date: formatDateToISO(selectedDate),
      slot_number: slotNumber,
      patient_name: patientName.trim(),
      document_type: documentType,
      document_value: documentValue.trim(),
      acs_name: acsName.trim(),
    };

    const success = await onAdd(data);
    if (success) {
      // Limpar formulário
      setPatientName('');
      setDocumentValue('');
      setAcsName('');
      setSlotNumber(availableSlots[0] || 1);
      onCancel();
    }
  };

  const formatCPF = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };

  const formatCartaoSUS = (value: string): string => {
    return value.replace(/\D/g, '').slice(0, 15);
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (documentType === 'CPF') {
      setDocumentValue(formatCPF(value));
    } else {
      setDocumentValue(formatCartaoSUS(value));
    }
  };

  const isValidCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    return numbers.length === 11;
  };

  const getSlotPeriod = (slot: number): string => {
    if (slot <= 15) return 'Manhã';
    return 'Tarde';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a3a26] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Nova Marcação</h3>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-[#264532] transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Slot */}
          <div>
            <Label className="text-white mb-2 block">Slot *</Label>
            <select
              value={slotNumber}
              onChange={(e) => setSlotNumber(Number(e.target.value))}
              className="w-full rounded-full text-white bg-[#264532] border-none h-14 px-4 focus:ring-2 focus:ring-primary transition-all focus:outline-none"
            >
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  Slot {slot} - {getSlotPeriod(slot)}
                </option>
              ))}
            </select>
            {errors.slotNumber && (
              <p className="text-red-400 text-sm mt-1">{errors.slotNumber}</p>
            )}
          </div>

          {/* Nome do Paciente */}
          <div>
            <Label className="text-white mb-2 block">Nome do Paciente *</Label>
            <Input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Digite o nome completo"
              className="pl-4"
            />
            {errors.patientName && (
              <p className="text-red-400 text-sm mt-1">{errors.patientName}</p>
            )}
          </div>

          {/* Tipo de Documento */}
          <div>
            <Label className="text-white mb-2 block">Tipo de Documento *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="radio"
                  name="documentType"
                  value="CPF"
                  checked={documentType === 'CPF'}
                  onChange={() => {
                    setDocumentType('CPF');
                    setDocumentValue('');
                  }}
                  className="accent-primary w-4 h-4"
                />
                CPF
              </label>
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="radio"
                  name="documentType"
                  value="CARTAO_SUS"
                  checked={documentType === 'CARTAO_SUS'}
                  onChange={() => {
                    setDocumentType('CARTAO_SUS');
                    setDocumentValue('');
                  }}
                  className="accent-primary w-4 h-4"
                />
                Cartão SUS
              </label>
            </div>
          </div>

          {/* Documento */}
          <div>
            <Label className="text-white mb-2 block">
              {documentType === 'CPF' ? 'CPF *' : 'Número do Cartão SUS *'}
            </Label>
            <Input
              type="text"
              value={documentValue}
              onChange={handleDocumentChange}
              placeholder={documentType === 'CPF' ? '000.000.000-00' : 'Número do cartão'}
              className="pl-4"
            />
            {errors.documentValue && (
              <p className="text-red-400 text-sm mt-1">{errors.documentValue}</p>
            )}
          </div>

          {/* ACS */}
          <div>
            <Label className="text-white mb-2 block">ACS Responsável *</Label>
            <Input
              type="text"
              value={acsName}
              onChange={(e) => setAcsName(e.target.value)}
              placeholder="Nome do Agente Comunitário"
              className="pl-4"
            />
            {errors.acsName && (
              <p className="text-red-400 text-sm mt-1">{errors.acsName}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-full bg-[#264532] text-white font-semibold hover:bg-[#305a3e] transition-colors"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAppointmentForm;
