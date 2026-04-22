import React from 'react';
import {
  CalendarClock,
  FileText,
  Flag,
  IdCard,
  Loader2,
  Pencil,
  Save,
  Tags,
  Trash2,
  UserCog,
  UserRound,
  X,
} from 'lucide-react';
import {
  Input,
  Button,
  Textarea,
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

interface MetaTileProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

const MetaTile: React.FC<MetaTileProps> = ({ icon, label, children }) => (
  <div className="min-w-0 rounded-[1rem] border border-[#E5ECF3] bg-[#F8FAFC] p-3">
    <p className="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs font-bold text-[#64748B]">
      <span className="flex size-4 shrink-0 items-center justify-center">{icon}</span>
      <span className="truncate">{label}</span>
    </p>
    {children}
  </div>
);

const alertClassByLevel: Record<PendenciaAlertLevel, string> = {
  none: 'border-[#E5ECF3]',
  high_priority: 'border-[#BFD8FF]',
  due_today: 'border-[#F4D38B]',
  overdue: 'border-[#F4B6BC]',
};

const alertAccentByLevel: Record<PendenciaAlertLevel, string> = {
  none: 'bg-[linear-gradient(90deg,#1466F5_0%,#00BB94_100%)] opacity-35',
  high_priority: 'bg-[#1466F5]',
  due_today: 'bg-[#F59E0B]',
  overdue: 'bg-[#D9474F]',
};

const alertBadgeByLevel: Record<PendenciaAlertLevel, string> = {
  none: '',
  high_priority: 'border-[#BFD8FF] bg-[#EAF3FF] text-[#1466F5]',
  due_today: 'border-[#F4D38B] bg-[#FFF7E6] text-[#9A6300]',
  overdue: 'border-[#F4B6BC] bg-[#FFF1F2] text-[#B4232B]',
};

const prioridadeClassByValue: Record<PendenciaPrioridade, string> = {
  baixa: 'border border-[#DCE5EE] bg-white text-[#64748B]',
  normal: 'border border-[#BFE8DF] bg-[#E6F7F2] text-[#007A65]',
  alta: 'border border-[#F4B6BC] bg-[#FFF1F2] text-[#B4232B]',
};

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

  if (isEditing) {
    return (
      <article
        className={cn(
          'relative min-w-0 overflow-hidden rounded-[1.45rem] border bg-white shadow-[0_14px_38px_rgba(0,27,61,0.06)]',
          alertClassByLevel[alertLevel],
        )}
      >
        <span className={cn('absolute inset-x-0 top-0 h-1', alertAccentByLevel[alertLevel])} />

        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_14rem] lg:p-5">
          <div className="min-w-0 space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                value={editNomePaciente}
                onChange={(event) => onEditNomePacienteChange(event.target.value)}
                className="h-12 border-[#DCE5EE] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] placeholder:text-[#64748B] focus:bg-white focus:ring-[#00BB94]/20"
                placeholder="Nome do paciente"
                icon={<UserRound className="h-4 w-4" />}
              />

              <Input
                value={editCnsCpf}
                onChange={(event) => onEditCnsCpfChange(event.target.value)}
                className="h-12 border-[#DCE5EE] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] placeholder:text-[#64748B] focus:bg-white focus:ring-[#00BB94]/20"
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
              className="min-h-28 border-[#DCE5EE] bg-[#F8FAFC] text-sm font-medium text-[#001B3D] placeholder:text-[#64748B] focus:bg-white focus:ring-[#00BB94]/20 lg:min-h-24"
              placeholder="Descreva os detalhes da pendência"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Select
                value={editPrioridade}
                onValueChange={(value) => onEditPrioridadeChange(value as PendenciaPrioridade)}
              >
                <SelectTrigger className="h-12 border-[#DCE5EE] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] focus:bg-white focus:ring-[#00BB94]/20">
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
                className="w-full [&_button]:h-12 [&_button]:border-[#DCE5EE] [&_button]:bg-[#F8FAFC] [&_button]:font-semibold [&_button]:text-[#001B3D] [&_button]:focus:bg-white [&_button]:focus:ring-[#00BB94]/20"
              />

              <Select value={editResponsavel} onValueChange={onEditResponsavelChange}>
                <SelectTrigger className="h-12 border-[#DCE5EE] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] focus:bg-white focus:ring-[#00BB94]/20">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsavelOptions.map((option) => (
                    <SelectItem key={`${item.id}-responsavel-${option}`} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editingTipos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {editingTipos.map((tipoTag) => (
                  <span key={`${item.id}-editing-tag-${tipoTag}`} className="inline-flex max-w-full rounded-full border border-[#DCE5EE] bg-[#F8FAFC] px-2.5 py-1 text-xs font-bold text-[#334155]">
                    <span className="truncate">{tipoTag}</span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#E5ECF3] pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
            <div>
              <p className="mb-1.5 text-xs font-bold text-[#64748B]">Status</p>
              <Select value={item.status} onValueChange={(value) => onStatusChange(value as PendenciaStatus)}>
                <SelectTrigger className="h-12 border-[#DCE5EE] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] focus:bg-white focus:ring-[#00BB94]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PENDENCIA_STATUS.ABERTO}>Aberto</SelectItem>
                  <SelectItem value={PENDENCIA_STATUS.EM_ANDAMENTO}>Em andamento</SelectItem>
                  <SelectItem value={PENDENCIA_STATUS.RESOLVIDO}>Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                onClick={onSaveEditing}
                disabled={isUpdating}
                aria-label="Salvar edição"
                className="h-11 rounded-[1rem] bg-[#00BB94] text-sm font-extrabold text-white hover:bg-[#00A885]"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline lg:hidden xl:inline">Salvar</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onCancelEditing}
                variant="ghost"
                aria-label="Cancelar edição"
                className="h-11 rounded-[1rem] border-[#DCE5EE] bg-white text-[#001B3D] hover:bg-[#F8FAFC]"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline lg:hidden xl:inline">Cancelar</span>
              </Button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'group relative min-w-0 overflow-hidden rounded-[1.45rem] border bg-white shadow-[0_14px_38px_rgba(0,27,61,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(0,27,61,0.08)]',
        alertClassByLevel[alertLevel],
      )}
    >
      <span className={cn('absolute inset-x-0 top-0 h-1', alertAccentByLevel[alertLevel])} />

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_14rem] lg:p-5">
        <div className="min-w-0 space-y-4">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[1rem] border border-[#DCE5EE] bg-[#F8FAFC] text-[#1466F5]">
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h3 className="min-w-0 truncate text-lg font-extrabold leading-tight text-[#001B3D]">{item.nome_paciente}</h3>
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold', statusBadgeClass(item.status))}>
                    {PENDENCIA_STATUS_LABEL[item.status]}
                  </span>
                  {alertLevel !== 'none' ? (
                    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold', alertBadgeByLevel[alertLevel])}>
                      {alertLabel}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#BFD8FF] bg-[#EAF3FF] px-2.5 py-1 text-xs font-bold text-[#1466F5]">
                    <IdCard className="size-3.5 shrink-0" />
                    <span className="text-[#64748B]">{getDocumentLabel(item.cns_cpf)}</span>
                    <span className="truncate">{documentoFormatado}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE5EE] bg-[#F8FAFC] px-2.5 py-1 text-xs font-bold text-[#64748B]">
                    <Tags className="size-3.5" />
                    {tipos.length} tipo{tipos.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1rem] border border-[#E5ECF3] bg-[#F8FAFC] p-3.5">
            <p className="line-clamp-3 text-sm font-medium leading-6 text-[#334155]">{item.resumo || '-'}</p>
          </div>

          {tipos.length > 0 ? (
            <div className="flex min-w-0 flex-wrap gap-2">
              {tipos.map((tipoTag) => (
                <span key={`${item.id}-${tipoTag}`} className="inline-flex max-w-full rounded-full border border-[#DCE5EE] bg-white px-2.5 py-1 text-xs font-bold text-[#334155]">
                  <span className="truncate">{tipoTag}</span>
                </span>
              ))}
            </div>
          ) : null}

          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
            <MetaTile icon={<Flag className="size-4 text-[#1466F5]" />} label="Prioridade">
              <span className={cn('inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-extrabold', prioridadeClassByValue[item.prioridade])}>
                {PENDENCIA_PRIORIDADE_LABEL[item.prioridade]}
              </span>
            </MetaTile>

            <MetaTile icon={<CalendarClock className="size-4 text-[#F59E0B]" />} label="Prazo">
              <p className="truncate text-sm font-extrabold text-[#001B3D]">{prazoFormatado}</p>
            </MetaTile>

            <MetaTile icon={<UserCog className="size-4 text-[#00A885]" />} label="Responsável">
              <p className="truncate text-sm font-extrabold text-[#001B3D]">{item.responsavel || 'Não definido'}</p>
            </MetaTile>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#E5ECF3] pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <div>
            <p className="mb-1.5 text-xs font-bold text-[#64748B]">Atualizar status</p>
            <Select value={item.status} onValueChange={(value) => onStatusChange(value as PendenciaStatus)}>
              <SelectTrigger className="h-12 border-[#DCE5EE] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] focus:bg-white focus:ring-[#00BB94]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PENDENCIA_STATUS.ABERTO}>Aberto</SelectItem>
                <SelectItem value={PENDENCIA_STATUS.EM_ANDAMENTO}>Em andamento</SelectItem>
                <SelectItem value={PENDENCIA_STATUS.RESOLVIDO}>Resolvido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-auto flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onStartEditing}
              variant="secondary"
              aria-label="Editar pendência"
              className="h-11 flex-1 rounded-[1rem] border border-[#CFEDE6] bg-[#E6F7F2] text-sm font-extrabold text-[#007A65] hover:bg-[#DDF4EE]"
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
              aria-label="Excluir pendência"
              className="h-11 w-11 shrink-0 rounded-[1rem] bg-[#D9474F] p-0 text-white hover:brightness-105"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};
