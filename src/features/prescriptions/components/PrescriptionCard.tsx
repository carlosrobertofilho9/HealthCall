import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileUp,
  Printer,
  Trash2,
  User,
  StickyNote,
  Home,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Truck,
  ArrowRight,
  ArrowLeft,
  X,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn, formatCPF, formatCNS } from '@/lib/utils';
import type { Prescription, PrescriptionStatus, PrescriptionFlag } from '../types';
import { PrescriptionUploadModal } from './PrescriptionUploadModal';

interface PrescriptionCardProps {
  prescription: Prescription;
  selected?: boolean;
  onSelectToggle?: () => void;
  onUpload: (prescriptionId: string, file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: PrescriptionStatus) => Promise<void>;
  onMarkDelivered: (id: string, deliveredTo: string) => Promise<void>;
  onDenyRenewal: (id: string, reason: string) => Promise<void>;
  isUploading: boolean;
  isDeleting: boolean;
  isUpdatingStatus: boolean;
  isMarkingDelivered: boolean;
  isDenying: boolean;
}

const statusConfig: Record<PrescriptionStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pendente',
    color: 'text-[#92400E]',
    bg: 'bg-[#FFFBF0]',
    border: 'border-[#F3E8C8]',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  ready: {
    label: 'Pronta',
    color: 'text-[#007A65]',
    bg: 'bg-[#F4FBF8]',
    border: 'border-[#CFEDE6]',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  delivered: {
    label: 'Entregue',
    color: 'text-[#4A5D73]',
    bg: 'bg-[#F8FAFC]',
    border: 'border-[#DCE5EE]',
    icon: <Truck className="h-3 w-3" />,
  },
  denied: {
    label: 'Renovação negada',
    color: 'text-[#B4232D]',
    bg: 'bg-[#FFF7F7]',
    border: 'border-[#F3D6D8]',
    icon: <X className="h-3 w-3" />,
  },
};

const nextStatusMap: Record<PrescriptionStatus, PrescriptionStatus | null> = {
  pending: 'ready',
  ready: null,
  delivered: null,
  denied: null,
};

const prevStatusMap: Record<PrescriptionStatus, PrescriptionStatus | null> = {
  pending: null,
  ready: 'pending',
  delivered: 'ready',
  denied: 'ready',
};

const nextStatusLabel: Record<PrescriptionStatus, string | null> = {
  pending: null,
  ready: 'Registrar retirada',
  delivered: null,
  denied: null,
};

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
  selected,
  onSelectToggle,
  onUpload,
  onDelete,
  onUpdateStatus,
  onMarkDelivered,
  onDenyRenewal,
  isUploading,
  isDeleting,
  isUpdatingStatus,
  isMarkingDelivered,
  isDenying,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [deliveredTo, setDeliveredTo] = useState('');
  const [denialReason, setDenialReason] = useState('');

  const formattedDocument =
    prescription.document_type === 'CPF'
      ? formatCPF(prescription.document_value)
      : formatCNS(prescription.document_value);

  const status = statusConfig[prescription.status];
  const next = nextStatusMap[prescription.status];
  const prev = prevStatusMap[prescription.status];
  const nextLabel = nextStatusLabel[prescription.status];

  const flagConfig: Record<PrescriptionFlag, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    dosage_change: { label: 'Mudança de dosagem', color: 'text-[#B45309]', bg: 'bg-[#FFFBF0]', border: 'border-[#F3E8C8]', icon: <AlertTriangle className="h-3 w-3" /> },
    new_medication: { label: 'Novo medicamento', color: 'text-[#007A65]', bg: 'bg-[#F4FBF8]', border: 'border-[#CFEDE6]', icon: <PlusCircle className="h-3 w-3" /> },
    medication_suspended: { label: 'Medicamento suspenso', color: 'text-[#D9474F]', bg: 'bg-[#FFF7F7]', border: 'border-[#F3D6D8]', icon: <MinusCircle className="h-3 w-3" /> },
    total_change: { label: 'Mudança total', color: 'text-[#6D28D9]', bg: 'bg-[#F5EDFF]', border: 'border-[#E9D5FF]', icon: <RefreshCw className="h-3 w-3" /> },
    maintenance: { label: 'Manutenção', color: 'text-[#1466F5]', bg: 'bg-[#EAF3FF]', border: 'border-[#D5E6FF]', icon: <CheckCircle2 className="h-3 w-3" /> },
  };

  const handlePrint = () => {
    if (prescription.pdf_url) {
      window.open(prescription.pdf_url, '_blank');
    }
  };

  const handleDelete = async () => {
    await onDelete(prescription.id);
    setShowDeleteConfirm(false);
  };

  const handleAdvance = async () => {
    if (prescription.status === 'ready') {
      setShowDeliverModal(true);
      return;
    }
    if (!next) return;
    await onUpdateStatus(prescription.id, next);
  };

  const handleRegisterDelivery = async () => {
    if (!deliveredTo.trim()) return;
    await onMarkDelivered(prescription.id, deliveredTo.trim());
    setShowDeliverModal(false);
    setDeliveredTo('');
  };

  const handleDeny = async () => {
    if (!denialReason.trim()) return;
    await onDenyRenewal(prescription.id, denialReason.trim());
    setShowDenyModal(false);
    setDenialReason('');
  };

  const isActionLoading = isUpdatingStatus || isMarkingDelivered || isDenying || isUploading || isDeleting;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md',
          selected ? 'border-[#1466F5] ring-2 ring-[#1466F5]/20' : 'border-[#E2E8F0]'
        )}
      >
        {/* Checkbox + Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {onSelectToggle && (
              <button
                type="button"
                onClick={onSelectToggle}
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all',
                  selected
                    ? 'border-[#1466F5] bg-[#1466F5] text-white'
                    : 'border-[#CBD5E1] bg-white hover:border-[#1466F5]'
                )}
              >
                {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
            )}
            <h4 className="truncate text-base font-extrabold text-[#001B3D] flex items-center gap-1.5">
              <User className="h-4 w-4 shrink-0 text-[#94A3B8]" />
              {prescription.patient_name}
            </h4>
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold',
              status.bg,
              status.border,
              status.color
            )}
          >
            {status.icon}
            {status.label}
          </span>
        </div>

        {/* Info */}
        {/* Flags */}
        {prescription.flags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {prescription.flags.map((flag) => {
              const cfg = flagConfig[flag];
              return (
                <span
                  key={flag}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-extrabold',
                    cfg.bg,
                    cfg.border,
                    cfg.color
                  )}
                >
                  {cfg.icon}
                  {cfg.label}
                </span>
              );
            })}
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-[#64748B]">
            <CreditCard className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold text-[#001B3D]">{prescription.document_type}:</span>
            <span className="tabular-nums font-medium">{formattedDocument}</span>
          </div>

          {prescription.observation && (
            <div className="flex items-start gap-2 text-[#64748B]">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="font-semibold text-[#001B3D]">Observação:</span>
              <span className="line-clamp-2">{prescription.observation}</span>
            </div>
          )}

          {prescription.address && (
            <div className="flex items-start gap-2 text-[#64748B]">
              <Home className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="font-semibold text-[#001B3D]">Endereço:</span>
              <span className="line-clamp-1">{prescription.address}</span>
            </div>
          )}

          {prescription.birth_date && (
            <div className="flex items-center gap-2 text-[#64748B]">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="font-semibold text-[#001B3D]">Nascimento:</span>
              <span>{new Date(prescription.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
            </div>
          )}

          {prescription.status === 'delivered' && (
            <div className="rounded-xl border border-[#CFEDE6] bg-[#F4FBF8] px-3 py-2 text-xs">
              <div className="flex items-center gap-2 font-extrabold text-[#007A65]">
                <Truck className="h-3.5 w-3.5" />
                Entregue
              </div>
              {prescription.delivered_to && (
                <p className="mt-1 text-[#4A5D73]">
                  Retirado por: <strong>{prescription.delivered_to}</strong>
                </p>
              )}
              {prescription.delivered_at && (
                <p className="text-[#64748B]">
                  Em: {new Date(prescription.delivered_at).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          )}

          {prescription.status === 'denied' && (
            <div className="rounded-xl border border-[#F3D6D8] bg-[#FFF7F7] px-3 py-2 text-xs">
              <div className="flex items-center gap-2 font-extrabold text-[#B4232D]">
                <X className="h-3.5 w-3.5" />
                Renovação negada
              </div>
              {prescription.denial_reason && (
                <p className="mt-1 text-[#4A5D73]">
                  Motivo: <strong>{prescription.denial_reason}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-[#F1F5F9]">
          {prescription.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 rounded-lg border-[#F3E8C8] bg-[#FFFBF0] text-[#92400E] hover:bg-[#F3E8C8]"
                onClick={() => setShowUploadModal(true)}
                disabled={isUploading}
              >
                <FileUp className="h-4 w-4" />
                Enviar PDF
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-lg text-[#B4232D] hover:bg-[#FFF7F7]"
                onClick={() => setShowDenyModal(true)}
                disabled={isDenying}
                title="Negar renovação"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}

          {prescription.status === 'ready' && (
            <Button
              size="sm"
              variant="default"
              className="flex-1 rounded-lg bg-[#00BB94] text-white hover:bg-[#00A885]"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          )}

          {nextLabel && (
            <Button
              size="sm"
              className="flex-1 rounded-lg bg-[#1466F5] text-white shadow-[0_6px_16px_rgba(20,102,245,0.24)] hover:bg-[#0F5AD8]"
              onClick={handleAdvance}
              disabled={isActionLoading}
            >
              <ArrowRight className="h-4 w-4" />
              {isUpdatingStatus ? 'Processando...' : nextLabel}
            </Button>
          )}

          {prev && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#001B3D]"
              onClick={() => onUpdateStatus(prescription.id, prev)}
              disabled={isActionLoading}
              title="Voltar status"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <Button
            size="icon-sm"
            variant="ghost"
            className="rounded-lg text-[#D9474F] hover:bg-[#FFF7F7]"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Upload PDF Modal */}
      <PrescriptionUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={(file) => onUpload(prescription.id, file)}
        isUploading={isUploading}
        prescriptionName={prescription.patient_name}
      />

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-[#001B3D]/40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-extrabold text-[#001B3D] mb-2">Remover receita?</h3>
            <p className="text-sm font-semibold text-[#64748B] mb-6">
              Tem certeza que deseja remover a receita de <strong>{prescription.patient_name}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Removendo...' : 'Remover'}
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Deliver Modal */}
      {showDeliverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-[#001B3D]/40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#CFEDE6] bg-[#E6F7F2] text-[#007A65]">
                <Truck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-[#001B3D]">Registrar retirada</h3>
                <p className="text-xs font-semibold text-[#64748B]">{prescription.patient_name}</p>
              </div>
            </div>

            <div className="space-y-1.5 mb-5">
              <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#64748B]">
                Quem retirou? <span className="text-[#D9474F]">*</span>
              </label>
              <input
                type="text"
                value={deliveredTo}
                onChange={(e) => setDeliveredTo(e.target.value)}
                placeholder="Nome completo do responsável"
                className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-sm font-semibold text-[#001B3D] placeholder:text-[#94A3B8] outline-none focus:border-[#1466F5] focus:ring-2 focus:ring-[#1466F5]/20"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="flex-1 rounded-xl bg-[#00BB94] text-white hover:bg-[#00A885]"
                onClick={handleRegisterDelivery}
                disabled={!deliveredTo.trim() || isMarkingDelivered}
              >
                {isMarkingDelivered ? 'Salvando...' : 'Confirmar entrega'}
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={() => {
                  setShowDeliverModal(false);
                  setDeliveredTo('');
                }}
                disabled={isMarkingDelivered}
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Deny Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-[#001B3D]/40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F3D6D8] bg-[#FFF7F7] text-[#B4232D]">
                <X className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-[#001B3D]">Negar renovação</h3>
                <p className="text-xs font-semibold text-[#64748B]">{prescription.patient_name}</p>
              </div>
            </div>

            <div className="space-y-1.5 mb-5">
              <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#64748B]">
                Motivo da negação <span className="text-[#D9474F]">*</span>
              </label>
              <textarea
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                placeholder="Ex: Alteração em sinais vitais, paciente precisa de reavaliação..."
                rows={3}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#001B3D] placeholder:text-[#94A3B8] outline-none focus:border-[#1466F5] focus:ring-2 focus:ring-[#1466F5]/20 resize-none"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                onClick={handleDeny}
                disabled={!denialReason.trim() || isDenying}
              >
                {isDenying ? 'Salvando...' : 'Confirmar negação'}
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={() => {
                  setShowDenyModal(false);
                  setDenialReason('');
                }}
                disabled={isDenying}
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default PrescriptionCard;
