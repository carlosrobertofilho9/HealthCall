import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { isValidCNS, isValidCPF } from '@/lib/utils';
import {
  PendenciaCreatePanel,
  PendenciaListItem,
  PendenciasListHeader,
  type StatusFilter,
} from '../components';
import { usePendencias } from '../hooks/usePendencias';
import {
  createPendencia,
  deletePendencia,
  updatePendencia,
  updatePendenciaStatus,
} from '../services/pendenciasService';
import {
  PENDENCIA_STATUS,
  PENDENCIA_STATUS_LABEL,
  type Pendencia,
  type PendenciaStatus,
} from '../types';
import {
  composeTipoValue,
  formatCnsCpfForDisplay,
  formatCnsCpfForInput,
  parseTipoTags,
  TIPO_OPTIONS,
} from '../utils/pendenciasUiUtils';
import { printOpenPendenciasPdf } from '../utils/printOpenPendenciasPdf';

const PendenciasPage: React.FC = () => {
  usePageTitle('Pendências');

  const { pendencias, loading, refetch } = usePendencias();

  const [nomePaciente, setNomePaciente] = useState('');
  const [cnsCpf, setCnsCpf] = useState('');
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [tipoPersonalizado, setTipoPersonalizado] = useState('');
  const [resumo, setResumo] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('em_aberto');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNomePaciente, setEditNomePaciente] = useState('');
  const [editCnsCpf, setEditCnsCpf] = useState('');
  const [editTiposSelecionados, setEditTiposSelecionados] = useState<string[]>([]);
  const [editTipoPersonalizado, setEditTipoPersonalizado] = useState('');
  const [editResumo, setEditResumo] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const openPendencias = useMemo(
    () => pendencias.filter((item) => item.status !== PENDENCIA_STATUS.RESOLVIDO),
    [pendencias],
  );

  const filteredPendencias = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return pendencias.filter((item) => {
      if (statusFilter === 'em_aberto' && item.status === PENDENCIA_STATUS.RESOLVIDO) return false;
      if (statusFilter === 'resolvido' && item.status !== PENDENCIA_STATUS.RESOLVIDO) return false;
      if (!normalizedSearch) return true;

      return (
        item.nome_paciente.toLowerCase().includes(normalizedSearch)
        || item.cns_cpf.toLowerCase().includes(normalizedSearch)
        || item.tipo.toLowerCase().includes(normalizedSearch)
        || (item.resumo || '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [pendencias, search, statusFilter]);

  const validateCnsCpf = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11) return isValidCPF(digits);
    if (digits.length === 15) return isValidCNS(digits);
    return false;
  };

  const clearForm = () => {
    setNomePaciente('');
    setCnsCpf('');
    setSelectedTipos([]);
    setTipoPersonalizado('');
    setResumo('');
  };

  const toggleTipo = (tipo: string) => {
    setSelectedTipos((previous) => {
      if (previous.includes(tipo)) return previous.filter((item) => item !== tipo);
      return [...previous, tipo];
    });
  };

  const toggleEditTipo = (tipo: string) => {
    setEditTiposSelecionados((current) => {
      if (current.includes(tipo)) return current.filter((item) => item !== tipo);
      return [...current, tipo];
    });
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const tipoComposto = composeTipoValue(selectedTipos, tipoPersonalizado);

    if (!nomePaciente.trim() || !cnsCpf.trim() || !tipoComposto.trim()) {
      toast.error('Preencha Nome, CNS/CPF e Tipo da pendência.');
      return;
    }

    if (!validateCnsCpf(cnsCpf)) {
      toast.error('CNS/CPF inválido. Informe CPF (11 dígitos) ou CNS (15 dígitos).');
      return;
    }

    try {
      setIsSaving(true);
      await createPendencia({
        nome_paciente: nomePaciente.trim(),
        cns_cpf: cnsCpf.trim(),
        tipo: tipoComposto,
        resumo: resumo.trim(),
      });
      toast.success('Pendência cadastrada com sucesso.');
      clearForm();
      refetch();
    } catch {
      toast.error('Erro ao cadastrar pendência.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (pendencia: Pendencia, status: PendenciaStatus) => {
    if (pendencia.status === status) return;

    try {
      await updatePendenciaStatus(pendencia.id, status);
      toast.success(`Status atualizado para ${PENDENCIA_STATUS_LABEL[status]}.`);
      refetch();
    } catch {
      toast.error('Erro ao atualizar o status da pendência.');
    }
  };

  const startEditing = (item: Pendencia) => {
    const tags = parseTipoTags(item.tipo);
    const knownTags = tags.filter((tag) => TIPO_OPTIONS.includes(tag));
    const customTags = tags.filter((tag) => !TIPO_OPTIONS.includes(tag));

    setEditingId(item.id);
    setEditNomePaciente(item.nome_paciente);
    setEditCnsCpf(formatCnsCpfForDisplay(item.cns_cpf));
    setEditTiposSelecionados(knownTags);
    setEditTipoPersonalizado(customTags.join(', '));
    setEditResumo(item.resumo || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditNomePaciente('');
    setEditCnsCpf('');
    setEditTiposSelecionados([]);
    setEditTipoPersonalizado('');
    setEditResumo('');
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    const tipoComposto = composeTipoValue(editTiposSelecionados, editTipoPersonalizado);

    if (!editNomePaciente.trim() || !editCnsCpf.trim() || !tipoComposto.trim()) {
      toast.error('Preencha Nome, CNS/CPF e Tipo da pendência.');
      return;
    }

    if (!validateCnsCpf(editCnsCpf)) {
      toast.error('CNS/CPF inválido. Informe CPF (11 dígitos) ou CNS (15 dígitos).');
      return;
    }

    try {
      setIsUpdating(true);
      await updatePendencia({
        id: editingId,
        nome_paciente: editNomePaciente.trim(),
        cns_cpf: editCnsCpf.trim(),
        tipo: tipoComposto,
        resumo: editResumo.trim(),
      });
      toast.success('Pendência atualizada com sucesso.');
      cancelEditing();
      refetch();
    } catch {
      toast.error('Erro ao atualizar pendência.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Deseja realmente excluir esta pendência?');
    if (!confirmed) return;

    try {
      setIsDeletingId(id);
      await deletePendencia(id);
      toast.success('Pendência excluída com sucesso.');
      if (editingId === id) cancelEditing();
      refetch();
    } catch {
      toast.error('Erro ao excluir pendência.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleGenerateOpenPdf = async () => {
    if (openPendencias.length === 0) {
      toast.info('Não há pendências em aberto para imprimir.');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      await printOpenPendenciasPdf(openPendencias);
      toast.success('Janela de impressão aberta com sucesso.');
    } catch {
      toast.error('Erro ao gerar PDF de pendências.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const statusBadgeClass = (status: PendenciaStatus) => {
    if (status === PENDENCIA_STATUS.ABERTO) return 'bg-amber-500/10 text-amber-300 border border-amber-500/20';
    if (status === PENDENCIA_STATUS.EM_ANDAMENTO) return 'bg-blue-500/10 text-blue-300 border border-blue-500/20';
    return 'bg-green-500/10 text-green-300 border border-green-500/20';
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 w-full h-[calc(100vh-8rem)]">
      <PendenciaCreatePanel
        nomePaciente={nomePaciente}
        cnsCpf={cnsCpf}
        selectedTipos={selectedTipos}
        tipoPersonalizado={tipoPersonalizado}
        resumo={resumo}
        isSaving={isSaving}
        tipoOptions={TIPO_OPTIONS}
        onSubmit={handleCreate}
        onNomePacienteChange={setNomePaciente}
        onCnsCpfChange={(value) => setCnsCpf(formatCnsCpfForInput(value))}
        onToggleTipo={toggleTipo}
        onTipoPersonalizadoChange={setTipoPersonalizado}
        onResumoChange={setResumo}
      />

      <section className="xl:col-span-8 rounded-2xl border border-white/10 bg-[#1a2c22] overflow-hidden shadow-2xl flex flex-col">
        <PendenciasListHeader
          openCount={openPendencias.length}
          totalCount={pendencias.length}
          search={search}
          statusFilter={statusFilter}
          isGeneratingPdf={isGeneratingPdf}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onGenerateOpenPdf={handleGenerateOpenPdf}
        />

        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar p-5">
          {loading ? (
            <div className="flex h-full items-center justify-center text-gray-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando pendências...</span>
            </div>
          ) : filteredPendencias.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500 text-center px-6">
              Nenhuma pendência encontrada para os filtros atuais.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPendencias.map((item) => {
                const isEditing = editingId === item.id;

                return (
                  <PendenciaListItem
                    key={item.id}
                    item={item}
                    tipoOptions={TIPO_OPTIONS}
                    isEditing={isEditing}
                    isUpdating={isUpdating}
                    isDeleting={isDeletingId === item.id}
                    editNomePaciente={editNomePaciente}
                    editCnsCpf={editCnsCpf}
                    editTiposSelecionados={editTiposSelecionados}
                    editTipoPersonalizado={editTipoPersonalizado}
                    editResumo={editResumo}
                    onEditNomePacienteChange={setEditNomePaciente}
                    onEditCnsCpfChange={(value) => setEditCnsCpf(formatCnsCpfForInput(value))}
                    onToggleEditTipo={toggleEditTipo}
                    onEditTipoPersonalizadoChange={setEditTipoPersonalizado}
                    onEditResumoChange={setEditResumo}
                    onStatusChange={(status) => handleStatusChange(item, status)}
                    onStartEditing={() => startEditing(item)}
                    onCancelEditing={cancelEditing}
                    onSaveEditing={handleUpdate}
                    onDelete={() => handleDelete(item.id)}
                    statusBadgeClass={statusBadgeClass}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PendenciasPage;
