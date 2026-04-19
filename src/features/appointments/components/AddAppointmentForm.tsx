import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  Clock,
  User,
  FileText,
  UserCheck,
  MapPin,
  ClipboardList
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
import type { CreateAppointmentData, DocumentType } from '@/types';
import {
  formatDateToISO,
  getAppointmentMessage,
  getSlotTime,
  getDayConfig
} from '../services/appointmentService';
import { formatCPF, formatCNS, isValidCPF, isValidCNS } from '@/lib/utils';

interface AddAppointmentFormProps {
  selectedDate: Date;
  availableSlots: number[];
  onAdd: (data: CreateAppointmentData) => Promise<boolean>;
  onCancel: () => void;
  isLoading: boolean;
  initialSlot?: number;
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
      onClose={handleClose}
      position="bottom"
      showMobileHandle
      panelClassName="safe-area-bottom max-h-[92vh] overflow-y-auto p-0 sm:w-[95vw] sm:max-w-3xl sm:max-h-[90vh] overflow-x-hidden"
    >
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="p-6 sm:p-10"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-primary/20 shadow-xl shadow-primary/5"
              >
                <Check className="w-10 h-10 text-primary" strokeWidth={3} />
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-card-foreground mb-2"
              >
                Agendamento Realizado!
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-muted-foreground"
              >
                Tudo pronto para amanhã. Copie a mensagem para o paciente:
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-secondary/50 backdrop-blur-sm border border-border p-5 rounded-2xl mb-8 relative group"
            >
              <pre className="text-secondary-foreground font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {createdMessage}
              </pre>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <ActionBar className="gap-4" align="between">
                <button
                  onClick={handleClose}
                  className="flex-1 py-4 px-6 rounded-2xl bg-card border border-border text-card-foreground font-bold active:bg-secondary hover:bg-secondary transition-all touch-manipulation shadow-lg shadow-black/5"
                >
                  Fechar
                </button>
                <Button 
                  onClick={handleCopy} 
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold touch-manipulation shadow-xl shadow-primary/20"
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
              </ActionBar>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="p-6 sm:p-10"
          >
            <div className="flex items-center justify-between mb-8">
              <motion.div variants={itemVariants}>
                <h3 className="text-2xl font-bold text-card-foreground">Nova Marcação</h3>
                <p className="text-sm text-muted-foreground mt-1">Preencha os dados básicos do paciente</p>
              </motion.div>
              <motion.button
                variants={itemVariants}
                whileTap={{ scale: 0.9 }}
                onClick={onCancel}
                className="p-3 rounded-2xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Slot */}
                <motion.div variants={itemVariants}>
                  <Label className="text-sm font-semibold text-card-foreground mb-2.5 block">Horário da Ficha *</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <Select
                      value={slotNumber.toString()}
                      onValueChange={(value) => setSlotNumber(Number(value))}
                    >
                      <SelectTrigger className="pl-12 h-14 rounded-2xl bg-background border-border shadow-sm focus:ring-primary/20">
                        <SelectValue placeholder="Selecione um horário" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border shadow-2xl">
                        {availableSlots.map((slot) => (
                          <SelectItem key={slot} value={slot.toString()} className="rounded-xl py-3 my-1">
                            Slot {slot} — {getSlotTime(slot, dayConfig)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.slotNumber && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs font-medium mt-1.5 ml-1">{errors.slotNumber}</motion.p>
                  )}
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
                    className="h-14 rounded-2xl bg-background shadow-sm focus:ring-primary/20"
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
                    className="h-14 rounded-2xl bg-background shadow-sm focus:ring-primary/20"
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
                      <SelectTrigger className="pl-12 h-14 rounded-2xl bg-background border-border shadow-sm focus:ring-primary/20">
                        <SelectValue placeholder="Selecione o ACS ou 'Outro'" />
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
                          className="h-14 rounded-2xl bg-background shadow-sm focus:ring-primary/20"
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
                        placeholder="Descreva brevemente o motivo da visita..."
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
                    onClick={onCancel}
                    className="flex-1 py-4 px-6 rounded-2xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-all touch-manipulation"
                  >
                    Cancelar
                  </button>
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="flex-1 py-4 rounded-2xl font-bold touch-manipulation shadow-xl shadow-primary/20"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                        Salvando...
                      </div>
                    ) : 'Confirmar Agendamento'}
                  </Button>
                </ActionBar>
              </motion.div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default AddAppointmentForm;
