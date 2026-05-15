import React, { useMemo, useState, useCallback } from 'react';
import {
  Plus,
  Pill,
  Search,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Truck,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  X,
  CheckSquare,
  Square,
  Printer,
} from 'lucide-react';
import { PageShell } from '@/components/layout';
import { Button, Input, Modal } from '@/components/ui';
import { usePageTitle } from '@/hooks/usePageTitle';
import { toast } from 'sonner';
import { usePrescriptions } from '../hooks/usePrescriptions';
import PrescriptionForm from '../components/PrescriptionForm';
import PrescriptionList from '../components/PrescriptionList';
import { mergePdfUrls, downloadPdf } from '../utils/mergePdfs';
import { printPrescriptionsReport } from '../components/pdfs/PrescriptionsReportPdf';
import type { Prescription, PrescriptionStatus } from '../types';

type StatusFilter = 'all' | PrescriptionStatus;

function getWeekBounds(offset: number): { start: Date; end: Date; label: string } {
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = current.getDay(); // 0 = domingo
  const start = new Date(current);
  start.setDate(current.getDate() - dayOfWeek + offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const label = offset === 0 ? 'Semana atual' : offset === -1 ? 'Semana passada' : `${fmt(start)} – ${fmt(end)}`;
  return { start, end, label };
}

function parseDateOnly(dateStr: string): Date {
  const datePart = dateStr.slice(0, 10);
  return new Date(datePart + 'T12:00:00');
}

function isInWeek(dateStr: string, start: Date, end: Date): boolean {
  const d = parseDateOnly(dateStr);
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return dateOnly >= start && dateOnly <= end;
}

function filterPrescriptions(
  prescriptions: Prescription[],
  query: string,
  status: StatusFilter,
  weekStart: Date,
  weekEnd: Date
): Prescription[] {
  const normalized = query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return prescriptions.filter((p) => {
    if (status !== 'all' && p.status !== status) return false;
    if (!isInWeek(p.created_at, weekStart, weekEnd)) return false;
    if (!normalized) return true;
    const name = p.patient_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const doc = p.document_value.replace(/\D/g, '');
    const obs = (p.observation || '').toLowerCase();
    return name.includes(normalized) || doc.includes(normalized) || obs.includes(normalized);
  });
}

const statusTabs: { key: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'all', label: 'Todas', icon: <ClipboardList className="h-3.5 w-3.5" />, color: '#1466F5' },
  { key: 'pending', label: 'Pendentes', icon: <AlertCircle className="h-3.5 w-3.5" />, color: '#B45309' },
  { key: 'ready', label: 'Prontas', icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: '#007A65' },
  { key: 'delivered', label: 'Entregues', icon: <Truck className="h-3.5 w-3.5" />, color: '#4A5D73' },
  { key: 'denied', label: 'Negadas', icon: <X className="h-3.5 w-3.5" />, color: '#B4232D' },
];

const PrescriptionsPage: React.FC = () => {
  usePageTitle('Receitas');
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    prescriptions,
    isLoading,
    isCreating,
    isUploading,
    isDeleting,
    isUpdatingStatus,
    isMarkingDelivered,
    isDenying,
    isBatchDeleting,
    isBatchUpdating,
    createPrescription,
    uploadPdf,
    updateStatus,
    markDelivered,
    denyRenewal,
    deletePrescription,
    batchDelete,
    batchUpdateStatus,
  } = usePrescriptions();

  const { start: weekStart, end: weekEnd, label: weekLabel } = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);

  const filtered = useMemo(
    () => filterPrescriptions(prescriptions, searchQuery, statusFilter, weekStart, weekEnd),
    [prescriptions, searchQuery, statusFilter, weekStart, weekEnd]
  );

  const counts = useMemo(() => {
    const weekItems = prescriptions.filter((p) => isInWeek(p.created_at, weekStart, weekEnd));
    return {
      total: weekItems.length,
      pending: weekItems.filter((p) => p.status === 'pending').length,
      ready: weekItems.filter((p) => p.status === 'ready').length,
      delivered: weekItems.filter((p) => p.status === 'delivered').length,
    };
  }, [prescriptions, weekStart, weekEnd]);

  const handleCreate = async (input: Parameters<typeof createPrescription>[0]) => {
    await createPrescription(input);
    setShowForm(false);
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds(filtered.map((p) => p.id));
  }, [filtered]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Deseja remover ${selectedIds.length} receita(s)?`)) return;
    await batchDelete(selectedIds);
    setSelectedIds([]);
  };

  const [isMergingPdfs, setIsMergingPdfs] = useState(false);

  const handleBatchPrint = async () => {
    const selectedPrescriptions = prescriptions.filter((p) => selectedIds.includes(p.id) && p.pdf_url);
    if (selectedPrescriptions.length === 0) {
      toast.error('Nenhuma receita selecionada possui PDF para impressão.');
      return;
    }
    setIsMergingPdfs(true);
    try {
      const urls = selectedPrescriptions.map((p) => p.pdf_url!);
      const merged = await mergePdfUrls(urls);
      const filename = `receitas_${weekLabel.replace(/\s/g, '_').replace(/–/g, '-')}.pdf`;
      downloadPdf(merged, filename);
      toast.success(`PDF consolidado com ${selectedPrescriptions.length} receita(s) baixado.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao mesclar PDFs.';
      toast.error(message);
    } finally {
      setIsMergingPdfs(false);
    }
  };

  const handleExportReport = async () => {
    try {
      await printPrescriptionsReport(filtered, weekLabel);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar relatório.';
      toast.error(message);
    }
  };

  const handleBatchStatus = async (status: PrescriptionStatus) => {
    if (selectedIds.length === 0) return;
    await batchUpdateStatus(selectedIds, status);
    setSelectedIds([]);
  };

  const kpiCards = [
    { label: 'Total da semana', value: counts.total, color: '#1466F5', bg: 'bg-white', border: 'border-[#DCE5EE]' },
    { label: 'Aguardando PDF', value: counts.pending, color: '#B45309', bg: 'bg-[#FFFBF0]', border: 'border-[#F3E8C8]' },
    { label: 'Prontas', value: counts.ready, color: '#007A65', bg: 'bg-[#F4FBF8]', border: 'border-[#CFEDE6]' },
    { label: 'Entregues', value: counts.delivered, color: '#4A5D73', bg: 'bg-[#F8FAFC]', border: 'border-[#DCE5EE]' },
  ];

  return (
    <PageShell className="flex flex-col">
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#001B3D] flex items-center gap-3">
              <span className="flex items-center justify-center rounded-xl border border-[#CFEDE6] bg-[#E6F7F2] p-2.5 text-[#007A65] shadow-inner">
                <Pill className="h-5 w-5" />
              </span>
              Receitas
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">
              Controle de prescrições e retiradas por semana.
            </p>
          </div>

          <Button
            onClick={() => setShowForm(true)}
            disabled={showForm || isLoading}
            className="h-11 shrink-0 rounded-xl bg-[#00BB94] px-5 text-sm font-extrabold text-white shadow-[0_10px_28px_rgba(0,187,148,0.28)] transition-all hover:bg-[#00A885] hover:shadow-[0_14px_36px_rgba(0,187,148,0.34)] active:scale-[0.99] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              className={`rounded-2xl border ${kpi.border} ${kpi.bg} p-4 shadow-[0_12px_28px_rgba(0,27,61,0.06)]`}
            >
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#64748B]">
                {kpi.label}
              </div>
              <p className="mt-2 text-3xl font-black" style={{ color: kpi.color }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Week selector */}
        <div className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-[0_8px_20px_rgba(0,27,61,0.04)]">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] transition-all hover:border-[#BFD8FF] hover:bg-white hover:text-[#1466F5] active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-extrabold text-[#001B3D]">{weekLabel}</p>
            <p className="text-[11px] font-bold text-[#64748B]">
              {weekStart.toLocaleDateString('pt-BR')} a {weekEnd.toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] transition-all hover:border-[#BFD8FF] hover:bg-white hover:text-[#1466F5] active:scale-95"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, CPF/CNS ou observação..."
              className="h-11 rounded-xl border-[#E2E8F0] bg-white pl-10 text-sm font-semibold text-[#001B3D] placeholder:text-[#94A3B8] focus:border-[#1466F5] focus:ring-[#1466F5]/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition-all active:scale-[0.98] ${
                  statusFilter === tab.key
                    ? 'border-[#1466F5] bg-[#EAF3FF] text-[#0F5AD8] shadow-[0_4px_12px_rgba(20,102,245,0.16)]'
                    : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#BFD8FF] hover:bg-[#F8FAFC] hover:text-[#001B3D]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#001B3D]"
              onClick={handleExportReport}
            >
              <Download className="h-4 w-4" />
              Relatório
            </Button>
          </div>
        </div>

        {/* Select all toggle */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 px-1">
            <button
              onClick={selectedIds.length === filtered.length ? deselectAll : selectAllVisible}
              className="flex items-center gap-1.5 text-xs font-extrabold text-[#1466F5] transition-colors hover:text-[#0F5AD8]"
            >
              {selectedIds.length === filtered.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {selectedIds.length === filtered.length ? 'Desmarcar todas' : 'Selecionar todas'}
            </button>
            {selectedIds.length > 0 && (
              <span className="text-xs font-bold text-[#64748B]">
                {selectedIds.length} selecionada{selectedIds.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          panelClassName="max-w-2xl rounded-[1.5rem]"
        >
          <PrescriptionForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isSubmitting={isCreating}
          />
        </Modal>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00BB94] border-t-transparent" />
              <p className="text-sm font-semibold text-[#64748B]">Carregando receitas...</p>
            </div>
          </div>
        ) : (
          <PrescriptionList
            prescriptions={filtered}
            selectedIds={selectedIds}
            onSelectToggle={toggleSelect}
            onUpload={uploadPdf}
            onDelete={deletePrescription}
            onUpdateStatus={updateStatus}
            onMarkDelivered={markDelivered}
            onDenyRenewal={denyRenewal}
            uploadingId={isUploading}
            deletingId={isDeleting}
            updatingStatusId={isUpdatingStatus}
            markingDeliveredId={isMarkingDelivered}
            denyingId={isDenying}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
          />
        )}
      </div>

      {/* Batch actions bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 sm:w-auto">
          <div className="flex items-center gap-2 rounded-2xl border border-[#DCE5EE] bg-white p-2 shadow-[0_24px_60px_rgba(0,27,61,0.18)]">
            <span className="px-3 text-xs font-extrabold text-[#001B3D]">
              {selectedIds.length} selecionada{selectedIds.length !== 1 ? 's' : ''}
            </span>
            <div className="h-6 w-px bg-[#E2E8F0]" />
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl border border-[#E2E8F0] bg-white text-[#1466F5] hover:bg-[#EAF3FF]"
              onClick={handleBatchPrint}
              disabled={isMergingPdfs}
            >
              <Printer className="h-3.5 w-3.5" />
              {isMergingPdfs ? 'Mesclando...' : 'Imprimir'}
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-[#007A65] text-white hover:bg-[#006654]"
              onClick={() => handleBatchStatus('ready')}
              disabled={isBatchUpdating}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Pronta
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-[#4A5D73] text-white hover:bg-[#3D4F63]"
              onClick={() => handleBatchStatus('delivered')}
              disabled={isBatchUpdating}
            >
              <Truck className="h-3.5 w-3.5" />
              Entregue
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl text-[#D9474F] hover:bg-[#FFF7F7]"
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl text-[#64748B] hover:bg-[#F1F5F9]"
              onClick={deselectAll}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default PrescriptionsPage;
