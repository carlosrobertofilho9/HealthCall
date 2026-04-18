import React, { useState, useEffect } from 'react';
import { X, User, FileText, UserCheck, MapPin, ClipboardList } from 'lucide-react';
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
import type { Appointment, AppointmentStatus, CreateAppointmentData, DocumentType } from '@/types';
import { APPOINTMENT_STATUSES, getAppointmentStatus, getSlotTime, getDayConfig, parseISODate } from '../services/appointmentService';
import { formatCPF, formatCNS } from '@/lib/utils';

interface EditAppointmentModalProps {
  appointment: Appointment;
  onSave: (id: string, updates: Partial<CreateAppointmentData>) => Promise<boolean>;
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
  const [status, setStatus] = useState<AppointmentStatus>(getAppointmentStatus(appointment));
  const [homeVisitAddress, setHomeVisitAddress] = useState(appointment.home_visit_address || '');
  const [homeVisitReference, setHomeVisitReference] = useState(appointment.home_visit_reference || '');
  const [homeVisitReason, setHomeVisitReason] = useState(appointment.home_visit_reason || '');
  const appointmentDate = parseISODate(appointment.scheduled_date);
  const dayConfig = getDayConfig(appointmentDate);
  const isHomeVisit = dayConfig.serviceType === 'HOME_VISIT';
  
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

    if (isHomeVisit && !homeVisitAddress.trim()) {
      newErrors.homeVisitAddress = 'Endereço completo é obrigatório';
    }

    if (isHomeVisit && !homeVisitReason.trim()) {
      newErrors.homeVisitReason = 'Motivo da visita é obrigatório';
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
      status,
      home_visit_address: isHomeVisit ? homeVisitAddress.trim() : null,
      home_visit_reference: isHomeVisit ? homeVisitReference.trim() || null : null,
      home_visit_reason: isHomeVisit ? homeVisitReason.trim() : null,
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
            {getSlotTime(appointment.slot_number, dayConfig)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-white mb-2 block">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as AppointmentStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_STATUSES.filter(item => item !== 'Remarcado').map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nome do Paciente */}
          <div>
            <Label className="text-white mb-2 block">Nome do Paciente *</Label>
            <Input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Digite o nome completo"
              icon={<User className="w-4 h-4" />}
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
              icon={<FileText className="w-4 h-4" />}
            />
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
              <div className="animate-in fade-in zoom-in duration-200">
                <Input
                  type="text"
                  value={customAcs}
                  onChange={(e) => setCustomAcs(e.target.value)}
                  placeholder="Digite o nome do ACS"
                  icon={<UserCheck className="w-4 h-4" />}
                />
              </div>
            )}

            {errors.acsName && (
              <p className="text-red-400 text-sm mt-1">{errors.acsName}</p>
            )}
          </div>

          {isHomeVisit && (
            <div className="space-y-4 rounded-2xl border border-[#264532] bg-[#122118]/40 p-4">
              <div>
                <Label className="text-white mb-2 block">Endereço completo *</Label>
                <Input
                  type="text"
                  value={homeVisitAddress}
                  onChange={(e) => setHomeVisitAddress(e.target.value)}
                  placeholder="Rua, número, bairro e complemento"
                  icon={<MapPin className="w-4 h-4" />}
                />
                {errors.homeVisitAddress && (
                  <p className="text-red-400 text-sm mt-1">{errors.homeVisitAddress}</p>
                )}
              </div>

              <div>
                <Label className="text-white mb-2 block">Ponto de referência</Label>
                <Input
                  type="text"
                  value={homeVisitReference}
                  onChange={(e) => setHomeVisitReference(e.target.value)}
                  placeholder="Ex.: próximo à escola, portão azul"
                  icon={<MapPin className="w-4 h-4" />}
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Motivo da visita *</Label>
                <div className="relative">
                  <ClipboardList className="absolute left-4 top-4 w-5 h-5 text-[#96c5a9]" />
                  <textarea
                    value={homeVisitReason}
                    onChange={(e) => setHomeVisitReason(e.target.value)}
                    placeholder="Descreva o motivo da visita domiciliar"
                    className="w-full min-h-24 rounded-2xl bg-[#264532] border-none pl-12 pr-4 py-4 text-white placeholder:text-[#96c5a9] focus:ring-2 focus:ring-primary transition-all focus:outline-none resize-y"
                  />
                </div>
                {errors.homeVisitReason && (
                  <p className="text-red-400 text-sm mt-1">{errors.homeVisitReason}</p>
                )}
              </div>
            </div>
          )}

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
