import React, { useState } from 'react';
import { X, Copy, Check, Clock, User, FileText, UserCheck, MapPin, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Modal from '@/components/ui/Modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ACS_OPTIONS } from '@/constants';
import type { CreateAppointmentData, DocumentType } from '@/types';
import { formatDateToISO, getAppointmentMessage, getSlotTime, getDayConfig } from '../services/appointmentService';
import { formatCPF, formatCNS, isValidCPF, isValidCNS } from '@/lib/utils';

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
  const [selectedAcs, setSelectedAcs] = useState<string>('');
  const [customAcs, setCustomAcs] = useState('');
  const [slotNumber, setSlotNumber] = useState<number>(initialSlot || availableSlots[0] || 1);
  const [homeVisitAddress, setHomeVisitAddress] = useState('');
  const [homeVisitReference, setHomeVisitReference] = useState('');
  const [homeVisitReason, setHomeVisitReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estados de sucesso
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdMessage, setCreatedMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const dayConfig = getDayConfig(selectedDate);
  const isHomeVisit = dayConfig.serviceType === 'HOME_VISIT';

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!patientName.trim()) {
      newErrors.patientName = 'Nome do paciente é obrigatório';
    }

    if (!documentValue.trim()) {
      newErrors.documentValue = 'Documento é obrigatório';
    } else if (documentType === 'CPF' && !isValidCPF(documentValue)) {
      newErrors.documentValue = 'CPF inválido';
    } else if (documentType === 'CARTAO_SUS' && !isValidCNS(documentValue)) {
      newErrors.documentValue = 'Cartão SUS inválido';
    }

    const finalAcsName = selectedAcs === 'Outro' ? customAcs : selectedAcs;
    if (!finalAcsName.trim()) {
      newErrors.acsName = 'ACS é obrigatório';
    }

    if (!slotNumber || !availableSlots.includes(slotNumber)) {
      newErrors.slotNumber = 'Selecione um slot disponível';
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

    const data: CreateAppointmentData = {
      scheduled_date: formatDateToISO(selectedDate),
      slot_number: slotNumber,
      patient_name: patientName.trim(),
      document_type: documentType,
      document_value: documentValue.trim(),
      acs_name: finalAcsName.trim(),
      home_visit_address: isHomeVisit ? homeVisitAddress.trim() : null,
      home_visit_reference: isHomeVisit ? homeVisitReference.trim() || null : null,
      home_visit_reason: isHomeVisit ? homeVisitReason.trim() : null,
    };
    const success = await onAdd(data);
    if (success) {
      // Gerar mensagem de sucesso
      const message = getAppointmentMessage(
        patientName.trim(),
        formatDateToISO(selectedDate),
        slotNumber,
        data
      );
      setCreatedMessage(message);
      setShowSuccess(true);
      
      // Limpar formulário (para próximo uso)
      setPatientName('');
      setDocumentValue('');
      setSelectedAcs('');
      setCustomAcs('');
      setHomeVisitAddress('');
      setHomeVisitReference('');
      setHomeVisitReason('');
      setSlotNumber(availableSlots[0] || 1);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(createdMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    onCancel();
  };

  /* Removed duplicate formatPhone */

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (documentType === 'CPF') {
      setDocumentValue(formatCPF(value));
    } else {
      setDocumentValue(formatCNS(value));
    }
  };



  if (showSuccess) {
    return (
      <Modal
        isOpen
        onClose={handleClose}
        position="bottom"
        showMobileHandle
        panelClassName="safe-area-bottom animate-slide-up p-6 sm:max-w-lg sm:animate-none"
      >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-card-foreground">Agendamento Realizado!</h3>
            <p className="text-muted-foreground">Copie a mensagem abaixo para enviar ao paciente</p>
          </div>

          <div className="bg-secondary p-4 rounded-xl mb-6 relative group">
            <pre className="text-secondary-foreground font-mono text-sm whitespace-pre-wrap">
              {createdMessage}
            </pre>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3.5 px-4 rounded-xl border border-border text-card-foreground font-semibold active:bg-secondary hover:bg-secondary transition-colors touch-manipulation"
            >
              Fechar
            </button>
            <Button 
              onClick={handleCopy} 
              className="flex-1 flex items-center justify-center gap-2 py-3.5 touch-manipulation"
            >
              {isCopied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copiar Mensagem
                </>
              )}
            </Button>
          </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onCancel}
      position="bottom"
      showMobileHandle
      panelClassName="safe-area-bottom max-h-[92vh] overflow-y-auto p-5 sm:w-[95vw] sm:max-w-3xl sm:max-h-[90vh] sm:p-8"
    >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg sm:text-xl font-bold text-card-foreground">Nova Marcação</h3>
          <button
            onClick={onCancel}
            className="p-2.5 rounded-xl active:bg-secondary hover:bg-secondary transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 text-card-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {/* Slot */}
            <div>
              <Label className="text-card-foreground mb-2 block">Slot *</Label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Select
                  value={slotNumber.toString()}
                  onValueChange={(value) => setSlotNumber(Number(value))}
                >
                  <SelectTrigger className="pl-12">
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot} value={slot.toString()}>
                        Slot {slot} - {getSlotTime(slot, dayConfig)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.slotNumber && (
                <p className="text-red-400 text-sm mt-1">{errors.slotNumber}</p>
              )}
            </div>

            {/* Nome do Paciente */}
            <div>
              <Label className="text-card-foreground mb-2 block">Nome do Paciente *</Label>
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
              <Label className="text-card-foreground mb-2 block">Tipo de Documento *</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-card-foreground cursor-pointer">
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
                <label className="flex items-center gap-2 text-card-foreground cursor-pointer">
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
              <Label className="text-card-foreground mb-2 block">
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
            <div className="sm:col-span-2">
            <Label className="text-card-foreground mb-2 block">ACS Responsável *</Label>
            <div className="relative mb-2">
              <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
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
          </div>

          {isHomeVisit && (
            <div className="space-y-4 rounded-2xl border border-border bg-background/40 p-4">
              <div>
                <Label className="text-card-foreground mb-2 block">Endereço completo *</Label>
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
                <Label className="text-card-foreground mb-2 block">Ponto de referência</Label>
                <Input
                  type="text"
                  value={homeVisitReference}
                  onChange={(e) => setHomeVisitReference(e.target.value)}
                  placeholder="Ex.: próximo à escola, portão azul"
                  icon={<MapPin className="w-4 h-4" />}
                />
              </div>

              <div>
                <Label className="text-card-foreground mb-2 block">Motivo da visita *</Label>
                <div className="relative">
                  <ClipboardList className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                  <textarea
                    value={homeVisitReason}
                    onChange={(e) => setHomeVisitReason(e.target.value)}
                    placeholder="Descreva o motivo da visita domiciliar"
                    className="w-full min-h-24 rounded-2xl bg-input border border-input pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition-all focus:outline-none resize-y"
                  />
                </div>
                {errors.homeVisitReason && (
                  <p className="text-red-400 text-sm mt-1">{errors.homeVisitReason}</p>
                )}
              </div>
            </div>
          )}

{/* Removed Telefone UI block */}

          {/* Botões */}
          <div className="flex gap-3 pt-4 sm:pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3.5 px-4 rounded-xl bg-secondary text-secondary-foreground font-semibold active:bg-secondary/90 hover:bg-secondary/90 transition-colors touch-manipulation"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={isLoading} className="flex-1 py-3.5 touch-manipulation">
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
    </Modal>
  );
};

export default AddAppointmentForm;
