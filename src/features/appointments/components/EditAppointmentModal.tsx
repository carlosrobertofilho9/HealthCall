import React, { useState, useEffect } from 'react';
import { X, User, FileText, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ACS_OPTIONS } from '@/constants';
import type { Appointment, DocumentType } from '@/types';
import { getSlotTime, getDayConfig, parseISODate } from '../services/appointmentService';
import { formatCPF, formatCNS } from '@/lib/utils';

interface EditAppointmentModalProps {
  appointment: Appointment;
  onSave: (id: string, updates: Partial<Appointment>) => Promise<boolean>;
  onClose: () => void;
  isLoading: boolean;
}

/**
 * Modal para editar uma marcação existente.
 */
export const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
  appointment,
  onSave,
  onClose,
  isLoading,
}) => {
  const [patientName, setPatientName] = useState(appointment.patient_name);
  const [documentType, setDocumentType] = useState<DocumentType>(appointment.document_type);
  const [documentValue, setDocumentValue] = useState(appointment.document_value);
  
  // Inicializar estado do ACS
  const isKwownAcs = (ACS_OPTIONS as readonly string[]).includes(appointment.acs_name);
  const [selectedAcs, setSelectedAcs] = useState<string>(isKwownAcs ? appointment.acs_name : 'Outro');
  const [customAcs, setCustomAcs] = useState(isKwownAcs ? '' : appointment.acs_name);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!patientName.trim()) {
      newErrors.patientName = 'Nome do paciente é obrigatório';
    }

    if (!documentValue.trim()) {
      newErrors.documentValue = 'Documento é obrigatório';
    }

    const finalAcsName = selectedAcs === 'Outro' ? customAcs : selectedAcs;
    if (!finalAcsName.trim()) {
      newErrors.acsName = 'ACS é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const finalAcsName = selectedAcs === 'Outro' ? customAcs : selectedAcs;

    const success = await onSave(appointment.id, {
      patient_name: patientName.trim(),
      document_type: documentType,
      document_value: documentValue.trim(),
      acs_name: finalAcsName.trim(),
    });

    if (success) {
      onClose();
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (documentType === 'CPF') {
      setDocumentValue(formatCPF(value));
    } else {
      setDocumentValue(formatCNS(value));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-[#1a2c22] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] overflow-y-auto safe-area-bottom">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg sm:text-xl font-bold text-white">Editar Marcação</h3>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl active:bg-[#264532] hover:bg-[#264532] transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-[#264532] rounded-lg">
          <p className="text-[#96c5a9] text-sm">
            Slot <span className="text-white font-bold">{appointment.slot_number}</span> •{' '}
            {getSlotTime(appointment.slot_number, getDayConfig(parseISODate(appointment.scheduled_date)))}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Paciente */}
          <div>
            <Label className="text-white mb-2 block">Nome do Paciente *</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#96c5a9]" />
              <Input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Digite o nome completo"
                className="pl-12"
              />
            </div>
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
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#96c5a9]" />
              <Input
                type="text"
                value={documentValue}
                onChange={handleDocumentChange}
                placeholder={documentType === 'CPF' ? '000.000.000-00' : 'Número do cartão'}
                className="pl-12"
              />
            </div>
            {errors.documentValue && (
              <p className="text-red-400 text-sm mt-1">{errors.documentValue}</p>
            )}
          </div>

          {/* ACS */}
          <div>
            <Label className="text-white mb-2 block">ACS Responsável *</Label>
            <div className="relative mb-2">
              <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#96c5a9] z-10" />
              <Select
                value={selectedAcs}
                onValueChange={setSelectedAcs}
              >
                <SelectTrigger className="pl-12">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {ACS_OPTIONS.map((acs) => (
                    <SelectItem key={acs} value={acs}>
                      {acs}
                    </SelectItem>
                  ))}
                  <SelectItem value="Outro">Outro (Digitar nome)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedAcs === 'Outro' && (
              <div className="relative animate-in fade-in zoom-in duration-200">
                <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#96c5a9]" />
                <Input
                  type="text"
                  value={customAcs}
                  onChange={(e) => setCustomAcs(e.target.value)}
                  placeholder="Digite o nome do ACS"
                  className="pl-12"
                />
              </div>
            )}

            {errors.acsName && (
              <p className="text-red-400 text-sm mt-1">{errors.acsName}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-xl bg-[#264532] text-white font-semibold active:bg-[#305a3e] hover:bg-[#305a3e] transition-colors touch-manipulation"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={isLoading} className="flex-1 py-3.5 touch-manipulation">
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAppointmentModal;
