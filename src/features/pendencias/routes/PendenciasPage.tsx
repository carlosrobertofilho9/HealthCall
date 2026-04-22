import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CirclePlus,
  ClipboardCheck,
  ListTodo,
  Loader2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { PENDENCIA_RESPONSAVEL_OPTIONS } from '@/constants';
import { PageShell } from '@/components/layout';
import { MobileStickyTabs } from '@/components/ui';
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
  isOverdue,
  sortPendenciasByOperationalSeverity,
  toDateInputValue
} from '../utils/pendenciasOperationalUtils';
import { printOpenPendenciasPdf } from '../utils/printOpenPendenciasPdf';

type MetricTone = 'teal' | 'blue' | 'warning' | 'danger';

interface OperationalMetricProps {
  label: string;
  value: React.ReactNode;
  helper: string;
  icon: React.ReactNode;
  tone: MetricTone;
}

const metricToneClass: Record<MetricTone, { icon: string; value: string }> = {
  teal: {
    icon: 'border-[#BFE8DF] bg-[#E6F7F2] text-[#007A65]',
    value: 'text-[#007A65]',
  },
  blue: {
    icon: 'border-[#BFD8FF] bg-[#EAF3FF] text-[#1466F5]',
    value: 'text-[#001B3D]',
  },
  warning: {
    icon: 'border-[#F4D38B] bg-[#FFF7E6] text-[#9A6300]',
    value: 'text-[#9A6300]',
  },
  danger: {
    icon: 'border-[#F4B6BC] bg-[#FFF1F2] text-[#B4232B]',
    value: 'text-[#B4232B]',
  },
};

const OperationalMetric: React.FC<OperationalMetricProps> = ({ label, value, helper, icon, tone }) => {
  const toneClass = metricToneClass[tone];

  return (
    <article className="min-w-0 rounded-[1rem] border border-[#E5ECF3] bg-[#F8FAFC] p-2.5 shadow-[0_8px_20px_rgba(0,27,61,0.035)]">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#64748B]">{label}</p>
          <p className={`mt-0.5 truncate text-xl font-extrabold leading-none ${toneClass.value}`}>{value}</p>
        </div>
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-[0.85rem] border ${toneClass.icon}`}>
          {icon}
        </span>
      </div>
      <p className="mt-2 truncate text-[11px] font-semibold text-[#64748B]">{helper}</p>
    </article>
  );
};

interface ContextChipProps {
  icon: React.ReactNode;
  label: string;
}

const ContextChip: React.FC<ContextChipProps> = ({ icon, label }) => (
  <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#DCE5EE] bg-white px-2.5 py-1 text-xs font-bold text-[#334155] shadow-[0_6px_14px_rgba(0,27,61,0.035)]">
    <span className="flex size-4 shrink-0 items-center justify-center">{icon}</span>
    <span className="truncate">{label}</span>
  </span>
);

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

  const overdueCount = useMemo(
    () => openPendencias.filter((item) => isOverdue(item)).length,
    [openPendencias],
  );

  const highPriorityCount = useMemo(
    () => openPendencias.filter((item) => item.prioridade === PENDENCIA_PRIORIDADE.ALTA).length,
    [openPendencias],
  );

  const inProgressCount = useMemo(
    () => pendencias.filter((item) => item.status === PENDENCIA_STATUS.EM_ANDAMENTO).length,
    [pendencias],
  );

  const resolvedCount = useMemo(
    () => pendencias.filter((item) => item.status === PENDENCIA_STATUS.RESOLVIDO).length,
    [pendencias],
  );

  const weekRangeLabel = useMemo(() => {
    const { start, end } = getCurrentWeekRange();
    const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
    return `${formatter.format(start)} a ${formatter.format(end)}`;
  }, []);

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
    if (status === PENDENCIA_STATUS.ABERTO) return 'border border-[#F4D38B] bg-[#FFF7E6] text-[#9A6300]';
    if (status === PENDENCIA_STATUS.EM_ANDAMENTO) return 'border border-[#BFD8FF] bg-[#EAF3FF] text-[#1466F5]';
    return 'border border-[#BFE8DF] bg-[#E6F7F2] text-[#007A65]';
  };

  const getAlertLabel = (item: Pendencia) => {
    const alertLevel = getAlertLevel(item);
    if (alertLevel === 'overdue') return 'Atrasado';
    if (alertLevel === 'due_today') return 'Vence hoje';
    if (alertLevel === 'high_priority') return `Prioridade ${PENDENCIA_PRIORIDADE_LABEL[item.prioridade].toLowerCase()}`;
    return '';
  };

  const renderListContent = () => (
    <>
      <PendenciasListHeader
        search={search}
        statusFilter={statusFilter}
        dueTodayOnly={dueTodayOnly}
        visibleCount={filteredPendencias.length}
        isGeneratingPdf={isGeneratingPdf}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onDueTodayOnlyChange={setDueTodayOnly}
        onGenerateOpenPdf={handleGenerateOpenPdf}
      />

      <div className="custom-scrollbar min-w-0 overflow-x-hidden p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:p-5">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 rounded-[1.25rem] border border-[#E5ECF3] bg-[#F8FAFC] text-[#64748B]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando pendências...</span>
          </div>
        ) : filteredPendencias.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-[1rem] border border-[#BFE8DF] bg-[#E6F7F2] text-[#007A65]">
              <CheckCircle2 className="size-6" />
            </div>
            <p className="text-base font-extrabold text-[#001B3D]">Nenhuma pendência encontrada</p>
            <p className="mt-1 max-w-sm text-sm font-medium text-[#64748B]">
              Ajuste os filtros ou registre uma nova demanda para acompanhar a fila operacional.
            </p>
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
    </>
  );

  return (
    <PageShell
      desktopContained
      className="flex min-h-0 flex-col gap-4 bg-[linear-gradient(180deg,#F4F6F8_0%,#EFF8F6_100%)] px-4 py-4 pb-6 lg:h-full lg:overflow-hidden lg:px-5 lg:py-4"
    >
      <MobileStickyTabs
        value={mobileTab}
        onValueChange={(value) => setMobileTab(value as 'new' | 'existing')}
        ariaLabel="Navegação de pendências"
        items={[
          {
            value: 'new',
            label: 'Nova',
            icon: <CirclePlus className="h-4 w-4" />,
          },
          {
            value: 'existing',
            label: 'Pendências',
            icon: <ListTodo className="h-4 w-4" />,
            badge: openPendencias.length,
          },
        ]}
      />

      <header className="relative shrink-0 overflow-hidden rounded-[1.35rem] border border-white/80 bg-white px-4 py-3.5 shadow-[0_14px_36px_rgba(0,27,61,0.06)] lg:px-5 lg:py-3.5">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#1466F5_0%,#00BB94_100%)]" aria-hidden="true" />
        <div className="relative grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(520px,1.05fr)] xl:items-center">
          <div className="min-w-0">
            <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-[#CFEDE6] bg-[#E6F7F2] px-2.5 py-0.5 text-[11px] font-bold text-[#007A65]">
              <span className="size-2 rounded-full bg-[#00BB94]" />
              Operação de pendências
            </div>
            <h1 className="text-2xl font-extrabold leading-tight text-[#001B3D] lg:text-[2rem]">
              Pendências
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-medium leading-5 text-[#64748B]">
              Registro, priorização e acompanhamento das demandas clínicas abertas com foco em prazo, responsável e continuidade do cuidado.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ContextChip icon={<Activity className="size-4 text-[#00A885]" />} label="Monitoramento em tempo real" />
              <ContextChip icon={<ShieldCheck className="size-4 text-[#1466F5]" />} label={`Semana: ${weekRangeLabel}`} />
              <ContextChip
                icon={overdueCount > 0 ? <AlertTriangle className="size-4 text-[#D9474F]" /> : <CheckCircle2 className="size-4 text-[#00A885]" />}
                label={overdueCount > 0 ? `${overdueCount} atraso(s) exigem atenção` : 'Fluxo sob controle'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <OperationalMetric
              label="Abertas"
              value={openPendencias.length}
              helper={`${inProgressCount} em andamento`}
              icon={<ClipboardCheck className="size-5" />}
              tone="teal"
            />
            <OperationalMetric
              label="Vence hoje"
              value={dueTodayCount}
              helper={dueTodayCount > 0 ? 'priorizar no turno' : 'sem vencimento hoje'}
              icon={<CalendarClock className="size-5" />}
              tone={dueTodayCount > 0 ? 'warning' : 'blue'}
            />
            <OperationalMetric
              label="Atrasadas"
              value={overdueCount}
              helper={overdueCount > 0 ? 'revisar responsáveis' : 'sem atraso ativo'}
              icon={<AlertTriangle className="size-5" />}
              tone={overdueCount > 0 ? 'danger' : 'teal'}
            />
            <OperationalMetric
              label="Resolvidas"
              value={resolvedCount}
              helper={`${highPriorityCount} alta prioridade`}
              icon={<UserCheck className="size-5" />}
              tone="blue"
            />
          </div>
        </div>
      </header>

      <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 lg:min-h-0 lg:grid-cols-[minmax(340px,0.38fr)_minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[minmax(380px,0.36fr)_minmax(0,1fr)]">
        <aside
          className={cn(
            'min-w-0 flex-col lg:flex lg:h-full lg:min-h-0 lg:overflow-hidden',
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
            'min-w-0 flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_18px_48px_rgba(0,27,61,0.07)] lg:flex lg:min-h-0',
            mobileTab === 'existing' ? 'flex' : 'hidden',
          )}
        >
          {renderListContent()}
        </section>
      </div>

    </PageShell>
  );
};

export default PendenciasPage;
