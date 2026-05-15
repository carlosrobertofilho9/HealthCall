import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
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
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button, Badge, Modal } from '@/components/ui';
import { cn, formatCPF, formatCNS } from '@/lib/utils';
import type { Prescription, PrescriptionStatus, PrescriptionFlag } from '../types';
import { PrescriptionUploadModal } from './PrescriptionUploadModal';
import { TableCell, TableRow } from '@/components/ui';

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
  view?: 'card' | 'table';
}

const statusConfig: Record<PrescriptionStatus, { label: string; variant: 'warning' | 'success' | 'secondary' | 'destructive'; icon: React.ReactNode }> = {
  pending: {
    label: 'Pendente',
    variant: 'warning',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  ready: {
    label: 'Pronta',
    variant: 'success',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  delivered: {
    label: 'Entregue',
    variant: 'secondary',
    icon: <Truck className="h-3 w-3" />,
  },
  denied: {
    label: 'Negada',
    variant: 'destructive',
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

const flagConfig: Record<PrescriptionFlag, { label: string; color: string }> = {
  dosage_change: { label: 'Mudança de dosagem', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  new_medication: { label: 'Novo medicamento', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  medication_suspended: { label: 'Medicamento suspenso', color: 'bg-red-100 text-red-700 border-red-200' },
  total_change: { label: 'Mudança total', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  maintenance: { label: 'Manutenção', color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

/* Portal-based action menu that won't be clipped by table overflow */
function ActionMenu({
  triggerRef,
  isOpen,
  onClose,
  children,
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 192,
    });
  }, [isOpen, triggerRef]);

  if (!isOpen || !position) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        style={{ top: position.top, left: position.left }}
        className="fixed z-50 w-48 rounded-xl border border-border bg-popover p-1 shadow-lg"
      >
        {children}
      </motion.div>
    </>,
    document.body
  );
}

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
  view = 'card',
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [deliveredTo, setDeliveredTo] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const actionsButtonRef = useRef<HTMLButtonElement>(null);

  const formattedDocument =
    prescription.document_type === 'CPF'
      ? formatCPF(prescription.document_value)
      : formatCNS(prescription.document_value);

  const status = statusConfig[prescription.status];
  const next = nextStatusMap[prescription.status];
  const prev = prevStatusMap[prescription.status];

  const handlePrint = () => {
    if (prescription.pdf_url) {
      window.open(prescription.pdf_url, '_blank');
    }
  };

  const handleDelete = async () => {
    await onDelete(prescription.id);
    setShowDeleteModal(false);
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

  // Render flags with full names
  const Flags = ({ limit }: { limit?: number }) => {
    if (prescription.flags.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
    const displayFlags = limit ? prescription.flags.slice(0, limit) : prescription.flags;
    return (
      <div className="flex flex-wrap gap-1">
        {displayFlags.map((flag) => {
          const cfg = flagConfig[flag];
          return (
            <span
              key={flag}
              className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold', cfg.color)}
            >
              {cfg.label}
            </span>
          );
        })}
        {limit && prescription.flags.length > limit && (
          <span className="inline-flex items-center rounded-md border border-border bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            +{prescription.flags.length - limit}
          </span>
        )}
      </div>
    );
  };

  // Secondary details (expandable)
  const SecondaryDetails = () => (
    <div className="space-y-2 text-sm">
      {prescription.address && (
        <div className="flex items-start gap-2 text-muted-foreground">
          <Home className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium">Endereço:</span>
          <span className="line-clamp-1">{prescription.address}</span>
        </div>
      )}
      {prescription.birth_date && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium">Nascimento:</span>
          <span>{new Date(prescription.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
        </div>
      )}
      {prescription.status === 'delivered' && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-emerald-700">
            <Truck className="h-3.5 w-3.5" />
            Entregue
          </div>
          {prescription.delivered_to && (
            <p className="mt-1 text-muted-foreground">
              Retirado por: <span className="font-semibold text-foreground">{prescription.delivered_to}</span>
            </p>
          )}
          {prescription.delivered_at && (
            <p className="text-muted-foreground">
              Em: {new Date(prescription.delivered_at).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      )}
      {prescription.status === 'denied' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-red-600">
            <X className="h-3.5 w-3.5" />
            Renovação negada
          </div>
          {prescription.denial_reason && (
            <p className="mt-1 text-muted-foreground">
              Motivo: <span className="font-semibold text-foreground">{prescription.denial_reason}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );

  // Action buttons for mobile card view
  const ActionButtons = () => (
    <div className="flex flex-wrap items-center gap-2">
      {prescription.status === 'pending' && (
        <>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 rounded-lg border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            onClick={() => setShowUploadModal(true)}
            disabled={isUploading}
          >
            <FileUp className="h-3.5 w-3.5" />
            Enviar PDF
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-lg text-red-600 hover:bg-red-50"
            onClick={() => setShowDenyModal(true)}
            disabled={isDenying}
          >
            <X className="h-3.5 w-3.5" />
            Negar
          </Button>
        </>
      )}

      {prescription.status === 'ready' && (
        <Button
          size="sm"
          variant="default"
          className="h-8 gap-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={handlePrint}
        >
          <Printer className="h-3.5 w-3.5" />
          Imprimir
        </Button>
      )}

      {prescription.status === 'ready' && (
        <Button
          size="sm"
          className="h-8 gap-1.5 rounded-lg bg-primary text-white shadow-sm hover:bg-primary/90"
          onClick={handleAdvance}
          disabled={isActionLoading}
        >
          <ArrowRight className="h-3.5 w-3.5" />
          {isUpdatingStatus ? 'Processando...' : 'Entregar'}
        </Button>
      )}

      {next && prescription.status !== 'ready' && (
        <Button
          size="sm"
          className="h-8 gap-1.5 rounded-lg bg-primary text-white shadow-sm hover:bg-primary/90"
          onClick={handleAdvance}
          disabled={isActionLoading}
        >
          <ArrowRight className="h-3.5 w-3.5" />
          {isUpdatingStatus ? 'Processando...' : 'Avançar'}
        </Button>
      )}

      {prev && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => onUpdateStatus(prescription.id, prev)}
          disabled={isActionLoading}
          title="Voltar status"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
      )}

      <Button
        size="icon-sm"
        variant="ghost"
        className="h-8 rounded-lg text-destructive hover:bg-destructive/10"
        onClick={() => setShowDeleteModal(true)}
        disabled={isDeleting}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  // Desktop table row view
  if (view === 'table') {
    return (
      <>
        <TableRow
          className={cn(
            'group cursor-pointer transition-colors',
            selected && 'bg-primary/5'
          )}
          onClick={() => setExpanded(!expanded)}
        >
          <TableCell onClick={(e) => e.stopPropagation()}>
            {onSelectToggle && (
              <button
                type="button"
                onClick={onSelectToggle}
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded border transition-all',
                  selected
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-background hover:border-primary'
                )}
              >
                {selected && <CheckCircle2 className="h-3 w-3" />}
              </button>
            )}
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="font-semibold text-foreground">{prescription.patient_name}</span>
              </div>
              {/* Observation always visible when present */}
              {prescription.observation && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground max-w-md">
                  <StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                  <span className="line-clamp-2">{prescription.observation}</span>
                </div>
              )}
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{prescription.document_type}</span>
              <span className="tabular-nums">{formattedDocument}</span>
            </div>
          </TableCell>
          <TableCell>
            <Flags limit={2} />
          </TableCell>
          <TableCell>
            <Badge variant={status.variant} className="gap-1">
              {status.icon}
              {status.label}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              {prescription.status === 'ready' && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50"
                  onClick={handlePrint}
                  title="Imprimir"
                >
                  <Printer className="h-3.5 w-3.5" />
                </Button>
              )}
              {prescription.status === 'pending' && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg text-amber-600 hover:bg-amber-50"
                  onClick={() => setShowUploadModal(true)}
                  disabled={isUploading}
                  title="Enviar PDF"
                >
                  <FileUp className="h-3.5 w-3.5" />
                </Button>
              )}
              {next && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                  onClick={handleAdvance}
                  disabled={isActionLoading}
                  title="Avançar status"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
              <div className="relative">
                <Button
                  ref={actionsButtonRef}
                  size="icon-sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent"
                  onClick={() => setShowActions(!showActions)}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
                <ActionMenu
                  triggerRef={actionsButtonRef}
                  isOpen={showActions}
                  onClose={() => setShowActions(false)}
                >
                  {prev && (
                    <button
                      onClick={() => {
                        onUpdateStatus(prescription.id, prev);
                        setShowActions(false);
                      }}
                      disabled={isActionLoading}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Voltar status
                    </button>
                  )}
                  {prescription.status === 'pending' && (
                    <button
                      onClick={() => {
                        setShowDenyModal(true);
                        setShowActions(false);
                      }}
                      disabled={isDenying}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Negar renovação
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                      setShowActions(false);
                    }}
                    disabled={isDeleting}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </button>
                </ActionMenu>
              </div>
            </div>
          </TableCell>
        </TableRow>

        {/* Expanded row for secondary details */}
        <AnimatePresence>
          {expanded && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="p-0">
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border bg-accent/30 px-4 py-4">
                    <SecondaryDetails />
                  </div>
                </motion.div>
              </TableCell>
            </TableRow>
          )}
        </AnimatePresence>

        {/* Modals */}
        <PrescriptionUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={(file) => onUpload(prescription.id, file)}
          isUploading={isUploading}
          prescriptionName={prescription.patient_name}
        />

        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Remover receita?"
          description={`Tem certeza que deseja remover a receita de ${prescription.patient_name}? Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
          isLoading={isDeleting}
          confirmText="Remover"
          variant="destructive"
        />

        <InputModal
          isOpen={showDeliverModal}
          onClose={() => { setShowDeliverModal(false); setDeliveredTo(''); }}
          title="Registrar retirada"
          subtitle={prescription.patient_name}
          icon={<Truck className="h-5 w-5 text-emerald-600" />}
          inputLabel="Quem retirou?"
          inputPlaceholder="Nome completo do responsável"
          inputValue={deliveredTo}
          onInputChange={setDeliveredTo}
          onConfirm={handleRegisterDelivery}
          isLoading={isMarkingDelivered}
          confirmText="Confirmar entrega"
        />

        <InputModal
          isOpen={showDenyModal}
          onClose={() => { setShowDenyModal(false); setDenialReason(''); }}
          title="Negar renovação"
          subtitle={prescription.patient_name}
          icon={<X className="h-5 w-5 text-red-500" />}
          inputLabel="Motivo da negação"
          inputPlaceholder="Ex: Alteração em sinais vitais, paciente precisa de reavaliação..."
          inputValue={denialReason}
          onInputChange={setDenialReason}
          onConfirm={handleDeny}
          isLoading={isDenying}
          confirmText="Confirmar negação"
          variant="destructive"
          isTextarea
        />
      </>
    );
  }

  // Mobile card view
  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-2xl border bg-card shadow-sm transition-all',
          selected ? 'border-primary ring-1 ring-primary/20' : 'border-border'
        )}
      >
        {/* Card header */}
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {onSelectToggle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectToggle();
                }}
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                  selected
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-background hover:border-primary'
                )}
              >
                {selected && <CheckCircle2 className="h-3 w-3" />}
              </button>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <h4 className="truncate text-sm font-bold text-foreground">{prescription.patient_name}</h4>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="h-3 w-3" />
                <span className="font-medium text-foreground">{prescription.document_type}</span>
                <span className="tabular-nums">{formattedDocument}</span>
              </div>
              {/* Observation always visible when present */}
              {prescription.observation && (
                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                  <span className="line-clamp-2">{prescription.observation}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge variant={status.variant} className="gap-1">
              {status.icon}
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Card content — flags + actions always visible, secondary details expandable */}
        <div className="border-t border-border px-4 py-3 space-y-3">
          <Flags limit={3} />
          <ActionButtons />
          {/* Expandable secondary details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 border-t border-border">
                  <SecondaryDetails />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {(prescription.address || prescription.birth_date || prescription.status === 'delivered' || prescription.status === 'denied') && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <>
                  Menos detalhes <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Mais detalhes <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <PrescriptionUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={(file) => onUpload(prescription.id, file)}
        isUploading={isUploading}
        prescriptionName={prescription.patient_name}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Remover receita?"
        description={`Tem certeza que deseja remover a receita de ${prescription.patient_name}? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        confirmText="Remover"
        variant="destructive"
      />

      <InputModal
        isOpen={showDeliverModal}
        onClose={() => { setShowDeliverModal(false); setDeliveredTo(''); }}
        title="Registrar retirada"
        subtitle={prescription.patient_name}
        icon={<Truck className="h-5 w-5 text-emerald-600" />}
        inputLabel="Quem retirou?"
        inputPlaceholder="Nome completo do responsável"
        inputValue={deliveredTo}
        onInputChange={setDeliveredTo}
        onConfirm={handleRegisterDelivery}
        isLoading={isMarkingDelivered}
        confirmText="Confirmar entrega"
      />

      <InputModal
        isOpen={showDenyModal}
        onClose={() => { setShowDenyModal(false); setDenialReason(''); }}
        title="Negar renovação"
        subtitle={prescription.patient_name}
        icon={<X className="h-5 w-5 text-red-500" />}
        inputLabel="Motivo da negação"
        inputPlaceholder="Ex: Alteração em sinais vitais, paciente precisa de reavaliação..."
        inputValue={denialReason}
        onInputChange={setDenialReason}
        onConfirm={handleDeny}
        isLoading={isDenying}
        confirmText="Confirmar negação"
        variant="destructive"
        isTextarea
      />
    </>
  );
};

/* Reusable Confirm Modal */
function ConfirmModal({
  isOpen,
  onClose,
  title,
  description,
  onConfirm,
  isLoading,
  confirmText,
  variant = 'destructive',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  isLoading: boolean;
  confirmText: string;
  variant?: 'destructive' | 'default';
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="max-w-sm rounded-2xl">
      <div className="p-6">
        <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        <div className="flex items-center gap-3">
          <Button
            variant={variant}
            className="flex-1 rounded-xl"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processando...' : confirmText}
          </Button>
          <Button variant="secondary" className="rounded-xl" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* Reusable Input Modal */
function InputModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  inputLabel,
  inputPlaceholder,
  inputValue,
  onInputChange,
  onConfirm,
  isLoading,
  confirmText,
  variant = 'default',
  isTextarea = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  inputLabel: string;
  inputPlaceholder: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
  confirmText: string;
  variant?: 'destructive' | 'default';
  isTextarea?: boolean;
}) {
  const inputClasses =
    'w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="max-w-sm rounded-2xl">
      <div className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-accent text-foreground">
            {icon}
          </span>
          <div>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="space-y-1.5 mb-5">
          <label className="block text-xs font-semibold text-muted-foreground">
            {inputLabel} <span className="text-destructive">*</span>
          </label>
          {isTextarea ? (
            <textarea
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={inputPlaceholder}
              rows={3}
              className={cn(inputClasses, 'py-3 resize-none')}
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={inputPlaceholder}
              className={cn(inputClasses, 'h-11')}
              autoFocus
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={variant}
            className="flex-1 rounded-xl"
            onClick={onConfirm}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? 'Salvando...' : confirmText}
          </Button>
          <Button variant="secondary" className="rounded-xl" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PrescriptionCard;
