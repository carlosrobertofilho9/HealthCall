import React from 'react';
import {
  IdCard,
  Loader2,
  Pencil,
  Save,
  Trash2,
  UserRound,
  X,
  FileText
} from 'lucide-react';
import {
  DS_COLOR,
  DS_RADIUS,
  Input,
  Button,
  Badge,
  Textarea,
  ActionBar,
  DatePicker,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
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
  type PendenciaStatus
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
  const alertClassByLevel: Record<PendenciaAlertLevel, string> = {
    none: DS_COLOR.border.default,
    high_priority: 'border-chart-4/50',
    due_today: 'border-warning/60',
    overdue: 'border-destructive/60',
  };
  const prioridadeClassByValue: Record<PendenciaPrioridade, string> = {
    baixa: 'border border-border bg-secondary/20 text-muted-foreground',
    normal: 'border border-chart-3/20 bg-chart-3/10 text-chart-3',
    alta: 'border border-chart-4/30 bg-chart-4/10 text-chart-4',
  };

  return (
    <article className={cn(DS_RADIUS.section, 'min-w-0 border bg-secondary/20 p-4 hover:border-primary/30 transition-all', alertClassByLevel[alertLevel])}>
      <div className="flex min-w-0 flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div className="min-w-0 space-y-3 flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editNomePaciente}
                onChange={(event) => onEditNomePacienteChange(event.target.value)}
                className={cn('h-10', DS_RADIUS.section)}
                placeholder="Nome do paciente"
                icon={<UserRound className="h-4 w-4" />}
              />
              <Input
                value={editCnsCpf}
                onChange={(event) => onEditCnsCpfChange(event.target.value)}
                className={cn('h-10 font-semibold', DS_RADIUS.section)}
                placeholder="CNS ou CPF"
                icon={<IdCard className="h-4 w-4" />}
              />

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
                className={cn('min-h-24', DS_RADIUS.section)}
                placeholder="Descreva os detalhes da pendência"
                icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Select
                  value={editPrioridade}
                  onValueChange={(value) => onEditPrioridadeChange(value as PendenciaPrioridade)}
                >
                  <SelectTrigger className={cn('h-10 pl-4', DS_RADIUS.section)}>
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
              </div>

              <Select value={editResponsavel} onValueChange={onEditResponsavelChange}>
                <SelectTrigger className={cn('h-10 pl-4', DS_RADIUS.section)}>
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsavelOptions.map((option) => (
                    <SelectItem key={`${item.id}-responsavel-${option}`} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex flex-wrap gap-2">
                {editingTipos.map((tipoTag) => (
                  <Badge
                    key={`${item.id}-editing-tag-${tipoTag}`}
                    variant="muted"
                  >
                    {tipoTag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="font-semibold text-lg leading-tight break-words">{item.nome_paciente}</p>
                <div className={cn('mt-1 inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-2.5 py-1', DS_RADIUS.control)}>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{getDocumentLabel(item.cns_cpf)}</span>
                  <span className="text-sm font-semibold text-primary tracking-wide">{documentoFormatado}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {tipos.map((tipoTag) => (
                  <Badge
                    key={`${item.id}-${tipoTag}`}
                    variant="muted"
                  >
                    {tipoTag}
                  </Badge>
                ))}
              </div>

              <div className={cn(DS_RADIUS.control, 'border border-border bg-background/40 p-3')}>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Pendência</p>
                <p className="text-foreground leading-relaxed break-words">{item.resumo || '-'}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={prioridadeClassByValue[item.prioridade]}>
                  Prioridade: {PENDENCIA_PRIORIDADE_LABEL[item.prioridade]}
                </Badge>

                <Badge variant="muted">
                  Prazo: {item.prazo ? new Date(`${item.prazo}T00:00:00`).toLocaleDateString('pt-BR') : 'Não definido'}
                </Badge>

                <Badge variant="muted">
                  Responsável: {item.responsavel || 'Não definido'}
                </Badge>

                {alertLevel !== 'none' ? (
                  <Badge variant="destructive">
                    {alertLabel}
                  </Badge>
                ) : null}
              </div>
            </>
          )}
        </div>

        <div className="w-full xl:w-64 flex flex-col gap-2">
          <Badge className={`w-fit ${statusBadgeClass(item.status)}`}>
            {PENDENCIA_STATUS_LABEL[item.status]}
          </Badge>

          <Select value={item.status} onValueChange={(value) => onStatusChange(value as PendenciaStatus)}>
            <SelectTrigger className={cn('h-10 pl-4', DS_RADIUS.section)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PENDENCIA_STATUS.ABERTO}>Aberto</SelectItem>
              <SelectItem value={PENDENCIA_STATUS.EM_ANDAMENTO}>Em andamento</SelectItem>
              <SelectItem value={PENDENCIA_STATUS.RESOLVIDO}>Resolvido</SelectItem>
            </SelectContent>
          </Select>

          {isEditing ? (
            <ActionBar align="start" className="flex-col gap-2">
              <Button
                type="button"
                size="sm"
                onClick={onSaveEditing}
                disabled={isUpdating}
                className={cn('h-10', DS_RADIUS.section)}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar edição
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onCancelEditing}
                variant="ghost"
                className={cn('h-10', DS_RADIUS.section)}
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </ActionBar>
          ) : (
            <ActionBar align="start" className="flex-col gap-2">
              <Button
                type="button"
                size="sm"
                onClick={onStartEditing}
                variant="ghost"
                className={cn('h-10', DS_RADIUS.section)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                variant="destructive"
                className={cn('h-10', DS_RADIUS.section)}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Excluir
              </Button>
            </ActionBar>
          )}
        </div>
      </div>
    </article>
  );
};
