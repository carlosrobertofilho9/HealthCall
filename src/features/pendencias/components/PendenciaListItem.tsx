import React from 'react';
import {
  IdCard,
  Loader2,
  Pencil,
  Save,
  Trash2,
  UserRound,
  X,
  FileText,
  CalendarClock,
  Flag,
  UserCog,
  Tags,
} from 'lucide-react';
import {
  Input,
  Button,
  Textarea,
  ActionBar,
  DatePicker,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { TipoPendenciaSelector } from './TipoPendenciaSelector';
import { formatCnsCpfForDisplay, getDocumentLabel, parseTipoTags } from '../utils/pendenciasUiUtils';
import {
  PENDENCIA_PRIORIDADE,
  PENDENCIA_PRIORIDADE_LABEL,
  PENDENCIA_STATUS,
  PENDENCIA_STATUS_LABEL,
  type Pendencia,
  type PendenciaPrioridade,
  type PendenciaStatus,
} from '../types';
import { type PendenciaAlertLevel } from '../utils/pendenciasOperationalUtils';

interface PendenciaListItemProps {
  item: Pendencia;
  tipoOptions: string[];
  isEditing: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  editNomePaciente: string;
  editCnsCpf: string;
  editTiposSelecionados: string[];
  editTipoPersonalizado: string;
  editResumo: string;
  editPrioridade: PendenciaPrioridade;
  editPrazo: string;
  editResponsavel: string;
  responsavelOptions: readonly string[];
  onEditNomePacienteChange: (value: string) => void;
  onEditCnsCpfChange: (value: string) => void;
  onToggleEditTipo: (tipo: string) => void;
  onEditTipoPersonalizadoChange: (value: string) => void;
  onEditResumoChange: (value: string) => void;
  onEditPrioridadeChange: (value: PendenciaPrioridade) => void;
  onEditPrazoChange: (value: string) => void;
  onEditResponsavelChange: (value: string) => void;
  onStatusChange: (status: PendenciaStatus) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
  onDelete: () => void;
  statusBadgeClass: (status: PendenciaStatus) => string;
  alertLevel: PendenciaAlertLevel;
  alertLabel: string;
}

export const PendenciaListItem: React.FC<PendenciaListItemProps> = ({
  item,
  tipoOptions,
  isEditing,
  isUpdating,
  isDeleting,
  editNomePaciente,
  editCnsCpf,
  editTiposSelecionados,
  editTipoPersonalizado,
  editResumo,
  editPrioridade,
  editPrazo,
  editResponsavel,
  responsavelOptions,
  onEditNomePacienteChange,
  onEditCnsCpfChange,
  onToggleEditTipo,
  onEditTipoPersonalizadoChange,
  onEditResumoChange,
  onEditPrioridadeChange,
  onEditPrazoChange,
  onEditResponsavelChange,
  onStatusChange,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onDelete,
  statusBadgeClass,
  alertLevel,
  alertLabel,
}) => {
  const tipos = parseTipoTags(item.tipo);
  const documentoFormatado = formatCnsCpfForDisplay(item.cns_cpf);
  const editingTipos = [...editTiposSelecionados, editTipoPersonalizado.trim()].filter(Boolean);
  const prazoFormatado = item.prazo ? new Date(`${item.prazo}T00:00:00`).toLocaleDateString('pt-BR') : 'Não definido';

  const alertClassByLevel: Record<PendenciaAlertLevel, string> = {
    none: 'border-border/70',
    high_priority: 'border-primary/40',
    due_today: 'border-warning/60',
    overdue: 'border-destructive/60',
  };

  const alertAccentByLevel: Record<PendenciaAlertLevel, string> = {
    none: 'bg-border/40',
    high_priority: 'bg-primary/70',
    due_today: 'bg-warning/80',
    overdue: 'bg-destructive/80',
  };

  const alertBadgeByLevel: Record<PendenciaAlertLevel, string> = {
    none: '',
    high_priority: 'border-primary/25 bg-primary/10 text-primary',
    due_today: 'border-warning/30 bg-warning/10 text-warning',
    overdue: 'border-destructive/30 bg-destructive/10 text-destructive',
  };

  const prioridadeClassByValue: Record<PendenciaPrioridade, string> = {
    baixa: 'border border-border bg-muted/40 text-muted-foreground',
    normal: 'border border-primary/20 bg-primary/10 text-primary',
    alta: 'border border-destructive/30 bg-destructive/10 text-destructive',
  };

  return (
    <article
      className={cn(
        'group relative min-w-0 overflow-hidden rounded-xl border bg-card/40 p-3 transition-colors hover:border-primary/30 lg:rounded-lg lg:bg-card/25 lg:p-0 lg:shadow-sm',
        alertClassByLevel[alertLevel],
      )}
    >
      <span className={cn('pointer-events-none absolute inset-y-0 left-0 hidden w-1 lg:block', alertAccentByLevel[alertLevel])} />

      {isEditing ? (
        <div className="space-y-3 lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-4 lg:space-y-0 lg:p-4 lg:pl-5">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <Input
                value={editNomePaciente}
                onChange={(event) => onEditNomePacienteChange(event.target.value)}
                className="h-10"
                placeholder="Nome do paciente"
                icon={<UserRound className="h-4 w-4" />}
              />

              <Input
                value={editCnsCpf}
                onChange={(event) => onEditCnsCpfChange(event.target.value)}
                className="h-10 font-semibold"
                placeholder="CNS ou CPF"
                icon={<IdCard className="h-4 w-4" />}
              />
            </div>

            <TipoPendenciaSelector
              options={tipoOptions}
              selectedTipos={editTiposSelecionados}
              tipoPersonalizado={editTipoPersonalizado}
              onToggleTipo={onToggleEditTipo}
              onChangeTipoPersonalizado={onEditTipoPersonalizadoChange}
            />

            <Textarea
              value={editResumo}
              onChange={(event) => onEditResumoChange(event.target.value)}
              className="min-h-24 lg:min-h-20"
              placeholder="Descreva os detalhes da pendência"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Select
                value={editPrioridade}
                onValueChange={(value) => onEditPrioridadeChange(value as PendenciaPrioridade)}
              >
                <SelectTrigger className="h-10 pl-4">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PENDENCIA_PRIORIDADE.BAIXA}>{PENDENCIA_PRIORIDADE_LABEL.baixa}</SelectItem>
                  <SelectItem value={PENDENCIA_PRIORIDADE.NORMAL}>{PENDENCIA_PRIORIDADE_LABEL.normal}</SelectItem>
                  <SelectItem value={PENDENCIA_PRIORIDADE.ALTA}>{PENDENCIA_PRIORIDADE_LABEL.alta}</SelectItem>
                </SelectContent>
              </Select>

              <DatePicker
                value={editPrazo}
                onChange={onEditPrazoChange}
                placeholder="Prazo"
                className="w-full"
              />

              <Select value={editResponsavel} onValueChange={onEditResponsavelChange}>
                <SelectTrigger className="h-10 pl-4">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsavelOptions.map((option) => (
                    <SelectItem key={`${item.id}-responsavel-${option}`} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {editingTipos.map((tipoTag) => (
                <span key={`${item.id}-editing-tag-${tipoTag}`} className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold">
                  {tipoTag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-row gap-2 lg:flex-col lg:border-l lg:border-border/60 lg:pl-4">
            <Select value={item.status} onValueChange={(value) => onStatusChange(value as PendenciaStatus)}>
              <SelectTrigger className="h-10 min-w-0 flex-1 pl-3 lg:flex-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PENDENCIA_STATUS.ABERTO}>Aberto</SelectItem>
                <SelectItem value={PENDENCIA_STATUS.EM_ANDAMENTO}>Em andamento</SelectItem>
                <SelectItem value={PENDENCIA_STATUS.RESOLVIDO}>Resolvido</SelectItem>
              </SelectContent>
            </Select>

            <ActionBar align="start" className="shrink-0 flex-row gap-2 lg:grid lg:grid-cols-2">
              <Button
                type="button"
                size="sm"
                onClick={onSaveEditing}
                disabled={isUpdating}
                aria-label="Salvar edição"
                className="h-10 w-10 shrink-0 p-0 sm:w-auto sm:px-4 lg:w-full lg:px-0"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline lg:hidden">Salvar edição</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onCancelEditing}
                variant="ghost"
                aria-label="Cancelar edição"
                className="h-10 w-10 shrink-0 p-0 sm:w-auto sm:px-4 lg:w-full lg:px-0"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline lg:hidden">Cancelar</span>
              </Button>
            </ActionBar>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2 lg:hidden">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-base font-black tracking-tight text-foreground">{item.nome_paciente}</p>
                <div className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{getDocumentLabel(item.cns_cpf)}</span>
                  <span className="truncate text-xs font-semibold tracking-wide text-primary">{documentoFormatado}</span>
                </div>
              </div>

              <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold', statusBadgeClass(item.status))}>
                {PENDENCIA_STATUS_LABEL[item.status]}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {tipos.map((tipoTag) => (
                <span key={`${item.id}-${tipoTag}`} className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold">
                  {tipoTag}
                </span>
              ))}
            </div>

            <div className="rounded-lg border border-border/70 bg-background/60 p-2.5">
              <p className="wrap-break-word max-h-[4.75rem] overflow-hidden text-sm leading-relaxed text-foreground">{item.resumo || '-'}</p>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div className="min-w-0 rounded-lg border border-border/60 bg-background/50 p-2">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Flag className="h-3.5 w-3.5" />
                </p>
                <span className={cn('inline-flex max-w-full rounded-full px-1.5 py-0.5 text-[10px] font-bold', prioridadeClassByValue[item.prioridade])}>
                  {PENDENCIA_PRIORIDADE_LABEL[item.prioridade]}
                </span>
              </div>

              <div className="min-w-0 rounded-lg border border-border/60 bg-background/50 p-2">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                </p>
                <p className="truncate text-[11px] font-semibold text-foreground">{prazoFormatado}</p>
              </div>

              <div className="min-w-0 rounded-lg border border-border/60 bg-background/50 p-2">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <UserCog className="h-3.5 w-3.5" />
                </p>
                <p className="truncate text-[11px] font-semibold text-foreground">{item.responsavel || 'Não definido'}</p>
              </div>
            </div>

            {alertLevel !== 'none' ? (
              <span className="inline-flex w-fit rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                {alertLabel}
              </span>
            ) : null}

            <div className="flex w-full flex-row gap-2">
              <Select value={item.status} onValueChange={(value) => onStatusChange(value as PendenciaStatus)}>
                <SelectTrigger className="h-10 min-w-0 flex-1 pl-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PENDENCIA_STATUS.ABERTO}>Aberto</SelectItem>
                  <SelectItem value={PENDENCIA_STATUS.EM_ANDAMENTO}>Em andamento</SelectItem>
                  <SelectItem value={PENDENCIA_STATUS.RESOLVIDO}>Resolvido</SelectItem>
                </SelectContent>
              </Select>

              <ActionBar align="start" className="shrink-0 flex-row gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={onStartEditing}
                  variant="ghost"
                  aria-label="Editar pendência"
                  className="h-10 w-10 shrink-0 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onDelete}
                  disabled={isDeleting}
                  variant="destructive"
                  aria-label="Excluir pendência"
                  className="h-10 w-10 shrink-0 p-0"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </ActionBar>
            </div>
          </div>

          <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-4 lg:p-4 lg:pl-5">
            <div className="min-w-0 space-y-3">
              <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="min-w-0 truncate text-base font-semibold tracking-tight text-foreground">{item.nome_paciente}</h3>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', statusBadgeClass(item.status))}>
                      {PENDENCIA_STATUS_LABEL[item.status]}
                    </span>
                    {alertLevel !== 'none' ? (
                      <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold', alertBadgeByLevel[alertLevel])}>
                        {alertLabel}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 font-semibold text-primary">
                      <IdCard className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{getDocumentLabel(item.cns_cpf)}</span>
                      <span className="truncate">{documentoFormatado}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-muted-foreground">
                      <Tags className="h-3.5 w-3.5" />
                      {tipos.length} tipo{tipos.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="line-clamp-2 text-sm leading-relaxed text-foreground/90">{item.resumo || '-'}</p>

              <div className="flex min-w-0 flex-wrap gap-1.5">
                {tipos.map((tipoTag) => (
                  <span key={`${item.id}-${tipoTag}`} className="inline-flex max-w-full rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-foreground/80">
                    <span className="truncate">{tipoTag}</span>
                  </span>
                ))}
              </div>

              <div className="grid min-w-0 grid-cols-3 gap-2 border-t border-border/60 pt-2">
                <div className="min-w-0">
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Flag className="h-3.5 w-3.5" />
                    Prioridade
                  </p>
                  <span className={cn('inline-flex max-w-full rounded-full px-2 py-0.5 text-[10px] font-bold', prioridadeClassByValue[item.prioridade])}>
                    {PENDENCIA_PRIORIDADE_LABEL[item.prioridade]}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Prazo
                  </p>
                  <p className="truncate text-xs font-semibold text-foreground">{prazoFormatado}</p>
                </div>

                <div className="min-w-0">
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <UserCog className="h-3.5 w-3.5" />
                    Responsável
                  </p>
                  <p className="truncate text-xs font-semibold text-foreground">{item.responsavel || 'Não definido'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 border-l border-border/60 pl-4">
              <Select value={item.status} onValueChange={(value) => onStatusChange(value as PendenciaStatus)}>
                <SelectTrigger className="h-9 rounded-lg pl-3 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PENDENCIA_STATUS.ABERTO}>Aberto</SelectItem>
                  <SelectItem value={PENDENCIA_STATUS.EM_ANDAMENTO}>Em andamento</SelectItem>
                  <SelectItem value={PENDENCIA_STATUS.RESOLVIDO}>Resolvido</SelectItem>
                </SelectContent>
              </Select>

              <ActionBar align="end" className="gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={onStartEditing}
                  variant="ghost"
                  aria-label="Editar pendência"
                  className="h-9 w-9 rounded-lg p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onDelete}
                  disabled={isDeleting}
                  variant="destructive"
                  aria-label="Excluir pendência"
                  className="h-9 w-9 rounded-lg p-0"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </ActionBar>
            </div>
          </div>
        </>
      )}
    </article>
  );
};
