import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  FileText,
  UserCheck,
  MapPin,
  ClipboardList,
  Clock
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Textarea,
  ActionBar,
  Modal,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
import { ACS_OPTIONS } from '@/constants';
import type { Appointment, AppointmentStatus, CreateAppointmentData, DocumentType } from '@/types';
import {
  APPOINTMENT_STATUSES,
  getAppointmentStatus,
  getSlotTime,
  getDayConfig,
  parseISODate
} from '../services/appointmentService';
import { formatCPF, formatCNS } from '@/lib/utils';

interface EditAppointmentModalProps {
  appointment: Appointment;
  onSave: (id: string, updates: Partial<CreateAppointmentData>) => Promise<boolean>;
  onClose: () => void;
  isLoading: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', damping: 25, stiffness: 200 }
  },
};

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
    <Modal
      isOpen
      onClose={onClose}
      position="bottom"
      showMobileHandle
      panelClassName="safe-area-bottom max-h-[92vh] overflow-y-auto p-0 sm:w-[95vw] sm:max-w-3xl sm:max-h-[90vh] overflow-x-hidden"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 sm:p-10"
      >
        <div className="flex items-center justify-between mb-8">
          <motion.div variants={itemVariants}>
            <h3 className="text-2xl font-bold text-card-foreground">Editar Marcação</h3>
            <p className="text-sm text-muted-foreground mt-1">Atualize os dados ou o status do paciente</p>
          </motion.div>
          <motion.button
            variants={itemVariants}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-3 rounded-2xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        <motion.div 
          variants={itemVariants} 
          className="mb-8 p-5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between shadow-lg shadow-primary/5"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shadow-inner">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Identificador</p>
              <p className="text-lg font-bold text-card-foreground">
                Ficha {appointment.slot_number} <span className="text-muted-foreground">·</span> {getSlotTime(appointment.slot_number, dayConfig)}
              </p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Status */}
            <motion.div variants={itemVariants}>
              <Label className="text-sm font-semibold text-card-foreground mb-2.5 block">Status do Atendimento</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as AppointmentStatus)}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-background border-border shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border shadow-2xl">
                  {APPOINTMENT_STATUSES.filter(item => item !== 'Remarcado').map(item => (
                    <SelectItem key={item} value={item} className="rounded-xl py-3 my-1">
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            {/* Nome do Paciente */}
            <motion.div variants={itemVariants}>
              <Label className="text-sm font-semibold text-card-foreground mb-2.5 block">Nome do Paciente *</Label>
              <Input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Digite o nome completo"
                icon={<User className="w-5 h-5" />}
                className="h-14 rounded-2xl bg-background shadow-sm"
              />
              {errors.patientName && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs font-medium mt-1.5 ml-1">{errors.patientName}</motion.p>
              )}
            </motion.div>

            {/* Tipo de Documento */}
            <motion.div variants={itemVariants}>
              <Label className="text-sm font-semibold text-card-foreground mb-3 block">Tipo de Documento *</Label>
              <div className="flex gap-2">
                {['CPF', 'CARTAO_SUS'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setDocumentType(type as DocumentType);
                      setDocumentValue('');
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                      documentType === type
                        ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5'
                        : 'bg-background border-border text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    {type === 'CPF' ? 'CPF' : 'Cartão SUS'}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Documento */}
            <motion.div variants={itemVariants}>
              <Label className="text-sm font-semibold text-card-foreground mb-2.5 block">
                {documentType === 'CPF' ? 'Número do CPF *' : 'Número do Cartão SUS *'}
              </Label>
              <Input
                type="text"
                value={documentValue}
                onChange={handleDocumentChange}
                placeholder={documentType === 'CPF' ? '000.000.000-00' : 'Número do cartão'}
                icon={<FileText className="w-5 h-5" />}
                className="h-14 rounded-2xl bg-background shadow-sm"
              />
              {errors.documentValue && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs font-medium mt-1.5 ml-1">{errors.documentValue}</motion.p>
              )}
            </motion.div>

            {/* ACS */}
            <motion.div variants={itemVariants} className="sm:col-span-2">
              <Label className="text-sm font-semibold text-card-foreground mb-2.5 block">ACS Responsável *</Label>
              <div className="relative mb-3">
                <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Select
                  value={selectedAcs}
                  onValueChange={setSelectedAcs}
                >
                  <SelectTrigger className="pl-12 h-14 rounded-2xl bg-background border-border shadow-sm">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border shadow-2xl">
                    {ACS_OPTIONS.map((acs) => (
                      <SelectItem key={acs} value={acs} className="rounded-xl py-3 my-1">
                        {acs}
                      </SelectItem>
                    ))}
                    <SelectItem value="Outro" className="rounded-xl py-3 my-1 font-semibold text-primary">Outro (Digitar nome)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <AnimatePresence>
                {selectedAcs === 'Outro' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <Input
                      type="text"
                      value={customAcs}
                      onChange={(e) => setCustomAcs(e.target.value)}
                      placeholder="Digite o nome do ACS responsável"
                      icon={<UserCheck className="w-5 h-5" />}
                      className="h-14 rounded-2xl bg-background shadow-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {errors.acsName && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs font-medium mt-1.5 ml-1">{errors.acsName}</motion.p>
              )}
            </motion.div>
          </div>

          {isHomeVisit && (
            <motion.div 
              variants={itemVariants}
              className="space-y-6 rounded-3xl border border-border bg-secondary/20 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-bold text-card-foreground">Dados da Visita Domiciliar</h4>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="text-sm font-semibold text-card-foreground mb-2.5 block">Endereço Completo *</Label>
                  <Input
                    type="text"
                    value={homeVisitAddress}
                    onChange={(e) => setHomeVisitAddress(e.target.value)}
                    placeholder="Rua, número, bairro e complemento"
                    icon={<MapPin className="w-5 h-5" />}
                    className="h-14 rounded-2xl bg-background shadow-sm"
                  />
                  {errors.homeVisitAddress && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs font-medium mt-1.5 ml-1">{errors.homeVisitAddress}</motion.p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-semibold text-card-foreground mb-2.5 block">Ponto de Referência</Label>
                  <Input
                    type="text"
                    value={homeVisitReference}
                    onChange={(e) => setHomeVisitReference(e.target.value)}
                    placeholder="Ex.: próximo à escola, portão azul"
                    icon={<MapPin className="w-5 h-5" />}
                    className="h-14 rounded-2xl bg-background shadow-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-sm font-semibold text-card-foreground mb-2.5 block">Motivo da Visita *</Label>
                  <Textarea
                    value={homeVisitReason}
                    onChange={(e) => setHomeVisitReason(e.target.value)}
                    placeholder="Descreva o motivo atualizado..."
                    icon={<ClipboardList className="w-6 h-6" />}
                    className="min-h-32 rounded-2xl bg-background shadow-sm resize-none"
                  />
                  {errors.homeVisitReason && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs font-medium mt-1.5 ml-1">{errors.homeVisitReason}</motion.p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Botões */}
          <motion.div variants={itemVariants} className="pt-6 border-t border-border">
            <ActionBar className="gap-4" align="between">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-2xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-all touch-manipulation"
              >
                Cancelar
              </button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="flex-1 py-4 rounded-2xl font-bold touch-manipulation shadow-xl shadow-primary/20"
              >
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </ActionBar>
          </motion.div>
        </form>
      </motion.div>
    </Modal>
  );
};

export default EditAppointmentModal;
