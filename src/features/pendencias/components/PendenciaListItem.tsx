import React from 'react';
import { IdCard, Loader2, Pencil, Save, Trash2, UserRound, X, FileText } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { TipoPendenciaSelector } from './TipoPendenciaSelector';
import {
  formatCnsCpfForDisplay,
  getDocumentLabel,
  parseTipoTags,
} from '../utils/pendenciasUiUtils';
import { PENDENCIA_STATUS, PENDENCIA_STATUS_LABEL, type Pendencia, type PendenciaStatus } from '../types';

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
  onEditNomePacienteChange: (value: string) => void;
  onEditCnsCpfChange: (value: string) => void;
  onToggleEditTipo: (tipo: string) => void;
  onEditTipoPersonalizadoChange: (value: string) => void;
  onEditResumoChange: (value: string) => void;
  onStatusChange: (status: PendenciaStatus) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
  onDelete: () => void;
  statusBadgeClass: (status: PendenciaStatus) => string;
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
  onEditNomePacienteChange,
  onEditCnsCpfChange,
  onToggleEditTipo,
  onEditTipoPersonalizadoChange,
  onEditResumoChange,
  onStatusChange,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onDelete,
  statusBadgeClass,
}) => {
  const tipos = parseTipoTags(item.tipo);
  const documentoFormatado = formatCnsCpfForDisplay(item.cns_cpf);
  const editingTipos = [...editTiposSelecionados, editTipoPersonalizado.trim()].filter(Boolean);

  return (
    <article className="rounded-xl border border-white/10 bg-[#264532]/35 p-4 hover:border-[#96c5a9]/30 transition-all">
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

              <div className="relative">
                <FileText className="absolute left-3 top-3.5 h-4 w-4 text-[#96c5a9]/80" />
                <textarea
                  value={editResumo}
                  onChange={(event) => onEditResumoChange(event.target.value)}
                  className="w-full rounded-xl text-white bg-[#1f3a2b] border border-white/10 min-h-24 p-3 pl-10 placeholder:text-[#96c5a9]/60 focus:ring-2 focus:ring-primary transition-all focus:outline-none"
                  placeholder="Descreva os detalhes da pendência"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {editingTipos.map((tipoTag) => (
                  <span
                    key={`${item.id}-editing-tag-${tipoTag}`}
                    className="text-xs px-2.5 py-1 rounded-full bg-[#1f3a2b] border border-white/10 text-[#96c5a9]"
                  >
                    {tipoTag}
                  </span>
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
                  <span
                    key={`${item.id}-${tipoTag}`}
                    className="text-xs px-2.5 py-1 rounded-full bg-[#1f3a2b] border border-white/10 text-[#96c5a9]"
                  >
                    {tipoTag}
                  </span>
                ))}
              </div>

              <div className="rounded-lg border border-white/10 bg-[#1f3a2b] p-3">
                <p className="text-xs uppercase tracking-wide text-[#96c5a9]/60 mb-1">Pendência</p>
                <p className="text-gray-100 leading-relaxed">{item.resumo || '-'}</p>
              </div>
            </>
          )}
        </div>

        <div className="w-full xl:w-64 flex flex-col gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full w-fit ${statusBadgeClass(item.status)}`}>
            {PENDENCIA_STATUS_LABEL[item.status]}
          </span>

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
            <>
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
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </article>
  );
};
