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
  Input,
  Button,
  Badge,
  Textarea,
  ActionBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
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
    none: 'border-white/10',
    high_priority: 'border-orange-400/50',
    due_today: 'border-amber-400/60',
    overdue: 'border-red-500/60',
  };
  const prioridadeClassByValue: Record<PendenciaPrioridade, string> = {
    baixa: 'bg-slate-500/10 text-slate-200 border border-slate-400/20',
    normal: 'bg-blue-500/10 text-blue-200 border border-blue-400/20',
    alta: 'bg-orange-500/10 text-orange-200 border border-orange-400/30',
  };

  return (
    <article className={`rounded-xl border ${alertClassByLevel[alertLevel]} bg-[#264532]/35 p-4 hover:border-[#96c5a9]/30 transition-all`}>
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div className="space-y-3 flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editNomePaciente}
                onChange={(event) => onEditNomePacienteChange(event.target.value)}
                className="h-10 rounded-xl bg-[#1f3a2b]"
                placeholder="Nome do paciente"
                icon={<UserRound className="h-4 w-4" />}
              />
              <Input
                value={editCnsCpf}
                onChange={(event) => onEditCnsCpfChange(event.target.value)}
                className="h-10 rounded-xl bg-[#1f3a2b] font-semibold"
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
                className="min-h-24 rounded-xl text-white bg-[#1f3a2b] border-white/10 placeholder:text-[#96c5a9]/60 focus:ring-primary"
                placeholder="Descreva os detalhes da pendência"
                icon={<FileText className="h-4 w-4 text-[#96c5a9]/80" />}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Select
                  value={editPrioridade}
                  onValueChange={(value) => onEditPrioridadeChange(value as PendenciaPrioridade)}
                >
                  <SelectTrigger className="h-10 rounded-xl pl-4">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PENDENCIA_PRIORIDADE.BAIXA}>{PENDENCIA_PRIORIDADE_LABEL.baixa}</SelectItem>
                    <SelectItem value={PENDENCIA_PRIORIDADE.NORMAL}>{PENDENCIA_PRIORIDADE_LABEL.normal}</SelectItem>
                    <SelectItem value={PENDENCIA_PRIORIDADE.ALTA}>{PENDENCIA_PRIORIDADE_LABEL.alta}</SelectItem>
                  </SelectContent>
                </Select>

                <input
                  type="date"
                  value={editPrazo}
                  onChange={(event) => onEditPrazoChange(event.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-input px-4 text-foreground focus:ring-2 focus:ring-ring transition-all focus:outline-none"
                />
              </div>

              <Select value={editResponsavel} onValueChange={onEditResponsavelChange}>
                <SelectTrigger className="h-10 rounded-xl pl-4">
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
                    className="bg-[#1f3a2b] border-white/10 text-[#96c5a9]"
                  >
                    {tipoTag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-white font-semibold text-lg leading-tight">{item.nome_paciente}</p>
                <div className="mt-1 inline-flex items-center gap-2 rounded-lg border border-[#96c5a9]/30 bg-[#1f3a2b] px-2.5 py-1">
                  <span className="text-[11px] uppercase tracking-wide text-[#96c5a9]/80">{getDocumentLabel(item.cns_cpf)}</span>
                  <span className="text-sm font-semibold text-[#d4f5e1] tracking-wide">{documentoFormatado}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {tipos.map((tipoTag) => (
                  <Badge
                    key={`${item.id}-${tipoTag}`}
                    className="bg-[#1f3a2b] border-white/10 text-[#96c5a9]"
                  >
                    {tipoTag}
                  </Badge>
                ))}
              </div>

              <div className="rounded-lg border border-white/10 bg-[#1f3a2b] p-3">
                <p className="text-xs uppercase tracking-wide text-[#96c5a9]/60 mb-1">Pendência</p>
                <p className="text-gray-100 leading-relaxed">{item.resumo || '-'}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={prioridadeClassByValue[item.prioridade]}>
                  Prioridade: {PENDENCIA_PRIORIDADE_LABEL[item.prioridade]}
                </Badge>

                <Badge className="bg-[#1f3a2b] border-white/10 text-[#96c5a9]">
                  Prazo: {item.prazo ? new Date(`${item.prazo}T00:00:00`).toLocaleDateString('pt-BR') : 'Não definido'}
                </Badge>

                <Badge className="bg-[#1f3a2b] border-white/10 text-[#96c5a9]">
                  Responsável: {item.responsavel || 'Não definido'}
                </Badge>

                {alertLevel !== 'none' ? (
                  <Badge className="bg-red-500/10 text-red-200 border-red-400/30">
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
            <SelectTrigger className="h-10 rounded-xl pl-4">
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
                className="rounded-xl h-10 bg-[#264532] text-[#96c5a9] border border-white/10 hover:bg-green-500 hover:text-white hover:border-green-400"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar edição
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onCancelEditing}
                className="rounded-xl h-10 bg-transparent text-white border border-white/20 hover:bg-white/10"
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
                className="rounded-xl h-10 bg-transparent text-white border border-white/20 hover:bg-white/10"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                className="rounded-xl h-10 bg-red-500/10 text-red-200 border border-red-400/30 hover:bg-red-500/20"
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
