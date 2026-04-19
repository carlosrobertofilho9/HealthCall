import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CirclePlus, ListTodo, Loader2 } from 'lucide-react';
import { PENDENCIA_RESPONSAVEL_OPTIONS } from '@/constants';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui';
import { usePageTitle } from '@/hooks/usePageTitle';
import { cn, isValidCNS, isValidCPF } from '@/lib/utils';
import {
  PendenciaCreatePanel,
  PendenciaListItem,
  PendenciasListHeader,
  type StatusFilter
} from '../components';
import { usePendencias } from '../hooks/usePendencias';
import {
  createPendencia,
  deletePendencia,
  updatePendencia,
  updatePendenciaStatus
} from '../services/pendenciasService';
import {
  PENDENCIA_PRIORIDADE,
  PENDENCIA_PRIORIDADE_LABEL,
  PENDENCIA_STATUS,
  PENDENCIA_STATUS_LABEL,
  type Pendencia,
  type PendenciaPrioridade,
  type PendenciaStatus
} from '../types';
import {
  composeTipoValue,
  formatCnsCpfForDisplay,
  formatCnsCpfForInput,
  parseTipoTags,
  TIPO_OPTIONS
} from '../utils/pendenciasUiUtils';
import {
  getAlertLevel,
  getCurrentWeekRange,
  isDateInRange,
  isDueToday,
  sortPendenciasByOperationalSeverity,
  toDateInputValue
} from '../utils/pendenciasOperationalUtils';
import { printOpenPendenciasPdf } from '../utils/printOpenPendenciasPdf';

const PendenciasPage: React.FC = () => {
  usePageTitle('Pendências');

  const { pendencias, loading, refetch } = usePendencias();

  const [nomePaciente, setNomePaciente] = useState('');
  const [cnsCpf, setCnsCpf] = useState('');
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [tipoPersonalizado, setTipoPersonalizado] = useState('');
  const [resumo, setResumo] = useState('');
  const [prioridade, setPrioridade] = useState<PendenciaPrioridade>(PENDENCIA_PRIORIDADE.NORMAL);
  const [prazo, setPrazo] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('em_aberto');
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const [mobileTab, setMobileTab] = useState<'new' | 'existing'>('new');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNomePaciente, setEditNomePaciente] = useState('');
  const [editCnsCpf, setEditCnsCpf] = useState('');
  const [editTiposSelecionados, setEditTiposSelecionados] = useState<string[]>([]);
  const [editTipoPersonalizado, setEditTipoPersonalizado] = useState('');
  const [editResumo, setEditResumo] = useState('');
  const [editPrioridade, setEditPrioridade] = useState<PendenciaPrioridade>(PENDENCIA_PRIORIDADE.NORMAL);
  const [editPrazo, setEditPrazo] = useState('');
  const [editResponsavel, setEditResponsavel] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const openPendencias = useMemo(
    () => pendencias.filter((item) => item.status !== PENDENCIA_STATUS.RESOLVIDO),
    [pendencias],
  );

  const dueTodayCount = useMemo(
    () => openPendencias.filter((item) => isDueToday(item)).length,
    [openPendencias],
  );

  const filteredPendencias = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = pendencias.filter((item) => {
      if (statusFilter === 'em_aberto' && item.status === PENDENCIA_STATUS.RESOLVIDO) return false;
      if (statusFilter === 'resolvido' && item.status !== PENDENCIA_STATUS.RESOLVIDO) return false;
      if (dueTodayOnly && !isDueToday(item)) return false;
      if (!normalizedSearch) return true;

      return (
        item.nome_paciente.toLowerCase().includes(normalizedSearch)
        || item.cns_cpf.toLowerCase().includes(normalizedSearch)
        || item.tipo.toLowerCase().includes(normalizedSearch)
        || (item.resumo || '').toLowerCase().includes(normalizedSearch)
        || (item.responsavel || '').toLowerCase().includes(normalizedSearch)
      );
    });

    return sortPendenciasByOperationalSeverity(filtered);
  }, [pendencias, search, statusFilter, dueTodayOnly]);

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
    setPrioridade(PENDENCIA_PRIORIDADE.NORMAL);
    setPrazo('');
    setResponsavel('');
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

    if (!responsavel.trim()) {
      toast.error('Selecione o responsável da pendência.');
      return;
    }

    if (!prazo) {
      toast.error('Informe o prazo da pendência.');
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
        prioridade,
        prazo,
        responsavel,
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
    setEditPrioridade(item.prioridade);
    setEditPrazo(toDateInputValue(item.prazo));
    setEditResponsavel(item.responsavel || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditNomePaciente('');
    setEditCnsCpf('');
    setEditTiposSelecionados([]);
    setEditTipoPersonalizado('');
    setEditResumo('');
    setEditPrioridade(PENDENCIA_PRIORIDADE.NORMAL);
    setEditPrazo('');
    setEditResponsavel('');
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    const tipoComposto = composeTipoValue(editTiposSelecionados, editTipoPersonalizado);

    if (!editNomePaciente.trim() || !editCnsCpf.trim() || !tipoComposto.trim()) {
      toast.error('Preencha Nome, CNS/CPF e Tipo da pendência.');
      return;
    }

    if (!editResponsavel.trim()) {
      toast.error('Selecione o responsável da pendência.');
      return;
    }

    if (!editPrazo) {
      toast.error('Informe o prazo da pendência.');
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
        prioridade: editPrioridade,
        prazo: editPrazo,
        responsavel: editResponsavel,
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
    const { start, end } = getCurrentWeekRange();
    const weeklyPendencias = openPendencias.filter((item) => isDateInRange(item.prazo, start, end));

    if (weeklyPendencias.length === 0) {
      toast.info('Não há pendências da semana atual para imprimir.');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      await printOpenPendenciasPdf(weeklyPendencias);
      toast.success('Janela de impressão aberta com sucesso.');
    } catch {
      toast.error('Erro ao gerar PDF de pendências.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const statusBadgeClass = (status: PendenciaStatus) => {
    if (status === PENDENCIA_STATUS.ABERTO) return 'border border-warning/20 bg-warning/10 text-warning';
    if (status === PENDENCIA_STATUS.EM_ANDAMENTO) return 'border border-chart-3/20 bg-chart-3/10 text-chart-3';
    return 'border border-success/20 bg-success/10 text-success';
  };

  const getAlertLabel = (item: Pendencia) => {
    const alertLevel = getAlertLevel(item);
    if (alertLevel === 'overdue') return 'Atrasado';
    if (alertLevel === 'due_today') return 'Vence hoje';
    if (alertLevel === 'high_priority') return `Prioridade ${PENDENCIA_PRIORIDADE_LABEL[item.prioridade].toLowerCase()}`;
    return '';
  };

  return (
    <div className="flex h-[calc(var(--app-visual-viewport-height,100dvh)-4rem)] min-h-0 w-full flex-col overflow-hidden bg-background lg:h-full">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <aside
          className={cn(
            'min-h-0 w-full flex-col overflow-hidden bg-background lg:flex lg:w-[380px] lg:shrink-0 lg:border-r lg:border-border 2xl:w-[420px]',
            mobileTab === 'new' ? 'flex' : 'hidden',
          )}
        >
          <PendenciaCreatePanel
            nomePaciente={nomePaciente}
            cnsCpf={cnsCpf}
            selectedTipos={selectedTipos}
            tipoPersonalizado={tipoPersonalizado}
            resumo={resumo}
            prioridade={prioridade}
            prazo={prazo}
            responsavel={responsavel}
            responsavelOptions={PENDENCIA_RESPONSAVEL_OPTIONS}
            isSaving={isSaving}
            tipoOptions={TIPO_OPTIONS}
            onSubmit={handleCreate}
            onNomePacienteChange={setNomePaciente}
            onCnsCpfChange={(value) => setCnsCpf(formatCnsCpfForInput(value))}
            onToggleTipo={toggleTipo}
            onTipoPersonalizadoChange={setTipoPersonalizado}
            onResumoChange={setResumo}
            onPrioridadeChange={setPrioridade}
            onPrazoChange={setPrazo}
            onResponsavelChange={setResponsavel}
          />
        </aside>

        <section
          className={cn(
            'min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-background lg:flex',
            mobileTab === 'existing' ? 'flex' : 'hidden',
          )}
        >
          <PendenciasListHeader
            openCount={openPendencias.length}
            totalCount={pendencias.length}
            dueTodayCount={dueTodayCount}
            search={search}
            statusFilter={statusFilter}
            dueTodayOnly={dueTodayOnly}
            isGeneratingPdf={isGeneratingPdf}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            onDueTodayOnlyChange={setDueTodayOnly}
            onGenerateOpenPdf={handleGenerateOpenPdf}
          />

          <div className="custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-5">
            {loading ? (
              <div className="flex h-full min-h-[16rem] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Carregando pendências...</span>
              </div>
            ) : filteredPendencias.length === 0 ? (
              <div className="flex h-full min-h-[16rem] items-center justify-center px-6 text-center text-muted-foreground">
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
                      editPrioridade={editPrioridade}
                      editPrazo={editPrazo}
                      editResponsavel={editResponsavel}
                      responsavelOptions={PENDENCIA_RESPONSAVEL_OPTIONS}
                      onEditNomePacienteChange={setEditNomePaciente}
                      onEditCnsCpfChange={(value) => setEditCnsCpf(formatCnsCpfForInput(value))}
                      onToggleEditTipo={toggleEditTipo}
                      onEditTipoPersonalizadoChange={setEditTipoPersonalizado}
                      onEditResumoChange={setEditResumo}
                      onEditPrioridadeChange={setEditPrioridade}
                      onEditPrazoChange={setEditPrazo}
                      onEditResponsavelChange={setEditResponsavel}
                      onStatusChange={(status) => handleStatusChange(item, status)}
                      onStartEditing={() => startEditing(item)}
                      onCancelEditing={cancelEditing}
                      onSaveEditing={handleUpdate}
                      onDelete={() => handleDelete(item.id)}
                      statusBadgeClass={statusBadgeClass}
                      alertLevel={getAlertLevel(item)}
                      alertLabel={getAlertLabel(item)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="shrink-0 border-t border-border bg-card px-2 py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] lg:hidden">
        <Tabs
          value={mobileTab}
          onValueChange={(value) => setMobileTab(value as 'new' | 'existing')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">
              <CirclePlus className="h-4 w-4 shrink-0" />
              Nova
            </TabsTrigger>

            <TabsTrigger value="existing">
              <ListTodo className="h-4 w-4 shrink-0" />
              Pendências
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default PendenciasPage;
