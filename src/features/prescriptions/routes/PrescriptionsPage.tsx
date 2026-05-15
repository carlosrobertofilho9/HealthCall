import React, { useMemo, useState, useCallback } from 'react';
import {
  Plus,
  Pill,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  X,
  Printer,
  CheckCircle2,
  Truck,
  CalendarRange,
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
  const dayOfWeek = current.getDay();
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

const statusTabs: { key: StatusFilter; label: string; countKey?: keyof ReturnType<typeof useStatusCounts> }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendentes', countKey: 'pending' },
  { key: 'ready', label: 'Prontas', countKey: 'ready' },
  { key: 'delivered', label: 'Entregues', countKey: 'delivered' },
  { key: 'denied', label: 'Negadas', countKey: 'denied' },
];

function useStatusCounts(
  prescriptions: Prescription[],
  weekStart: Date,
  weekEnd: Date
) {
  return useMemo(() => {
    const weekItems = prescriptions.filter((p) => isInWeek(p.created_at, weekStart, weekEnd));
    return {
      total: weekItems.length,
      pending: weekItems.filter((p) => p.status === 'pending').length,
      ready: weekItems.filter((p) => p.status === 'ready').length,
      delivered: weekItems.filter((p) => p.status === 'delivered').length,
      denied: weekItems.filter((p) => p.status === 'denied').length,
    };
  }, [prescriptions, weekStart, weekEnd]);
}

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
  const counts = useStatusCounts(prescriptions, weekStart, weekEnd);

  const filtered = useMemo(
    () => filterPrescriptions(prescriptions, searchQuery, statusFilter, weekStart, weekEnd),
    [prescriptions, searchQuery, statusFilter, weekStart, weekEnd]
  );

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

  const kpiItems = [
    { label: 'Total', value: counts.total, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Pendentes', value: counts.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Prontas', value: counts.ready, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Entregues', value: counts.delivered, color: 'text-slate-500', bg: 'bg-slate-100' },
    { label: 'Negadas', value: counts.denied, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <PageShell className="flex flex-col">
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm">
              <Pill className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Receitas</h1>
              <p className="text-xs font-medium text-muted-foreground">
                Controle de prescrições e retiradas por semana
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowForm(true)}
            disabled={showForm || isLoading}
            className="h-10 shrink-0 gap-2 rounded-xl px-5 text-sm font-bold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
        </div>

        {/* KPIs */}
        <div className="flex flex-wrap items-center gap-3">
          {kpiItems.map((kpi) => (
            <div
              key={kpi.label}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm"
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bg} ${kpi.color}`}>
                <span className="text-sm font-bold">{kpi.value}</span>
              </span>
              <span className="text-xs font-semibold text-muted-foreground">{kpi.label}</span>
            </div>
          ))}
        </div>

        {/* Controls bar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
          {/* Week selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-xs font-bold text-foreground">{weekLabel}</p>
                <p className="text-[10px] font-medium text-muted-foreground">
                  {weekStart.toLocaleDateString('pt-BR')} a {weekEnd.toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden h-8 w-px bg-border sm:block" />

          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, CPF/CNS ou observação..."
              className="h-10 rounded-lg border-border bg-background pl-9 text-sm"
            />
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="h-10 gap-2 rounded-lg"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4" />
            Relatório
          </Button>
        </div>

        {/* Status tabs — uma linha sem scroll */}
        <div className="flex flex-wrap items-center gap-2">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all active:scale-[0.98] ${
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {tab.label}
                {tab.countKey !== undefined && counts[tab.countKey] > 0 && (
                  <span className={`ml-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                  }`}>
                    {counts[tab.countKey]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Select all + count */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between">
            <button
              onClick={selectedIds.length === filtered.length ? deselectAll : selectAllVisible}
              className="flex items-center gap-2 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {selectedIds.length === filtered.length ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <div className="flex h-4 w-4 items-center justify-center rounded border border-primary">
                  <div className="h-2.5 w-2.5 rounded-sm bg-primary opacity-0 transition-opacity" style={{ opacity: selectedIds.length > 0 ? 0.5 : 0 }} />
                </div>
              )}
              {selectedIds.length === filtered.length ? 'Desmarcar todas' : 'Selecionar todas'}
            </button>
            {selectedIds.length > 0 && (
              <span className="text-xs font-medium text-muted-foreground">
                {selectedIds.length} selecionada{selectedIds.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          panelClassName="max-w-2xl rounded-2xl"
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
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm font-medium text-muted-foreground">Carregando receitas...</p>
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
        <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 sm:w-auto">
          <div className="flex items-center gap-1 rounded-2xl border border-border bg-card p-2 shadow-xl">
            <span className="px-3 text-xs font-bold text-foreground">
              {selectedIds.length} selecionada{selectedIds.length !== 1 ? 's' : ''}
            </span>
            <div className="h-5 w-px bg-border" />
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 rounded-lg text-primary hover:bg-primary/10"
              onClick={handleBatchPrint}
              disabled={isMergingPdfs}
            >
              <Printer className="h-3.5 w-3.5" />
              {isMergingPdfs ? 'Mesclando...' : 'Imprimir'}
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => handleBatchStatus('ready')}
              disabled={isBatchUpdating}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Pronta
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-700"
              onClick={() => handleBatchStatus('delivered')}
              disabled={isBatchUpdating}
            >
              <Truck className="h-3.5 w-3.5" />
              Entregue
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-lg text-destructive hover:bg-destructive/10"
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-lg text-muted-foreground hover:bg-accent"
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
