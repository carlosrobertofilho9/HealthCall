import React from 'react';
import {
  ClipboardList,
  Save,
  Loader2,
  UserRound,
  IdCard,
  FileText,
  CalendarDays,
  Flag,
  Users,
} from 'lucide-react';
import {
  SectionCard,
  Input,
  Button,
  Textarea,
  Badge,
  DatePicker,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
import { TipoPendenciaSelector } from './TipoPendenciaSelector';
import { getDocumentLabel } from '../utils/pendenciasUiUtils';
import { PENDENCIA_PRIORIDADE_LABEL, type PendenciaPrioridade } from '../types';

interface PendenciaCreatePanelProps {
  nomePaciente: string;
  cnsCpf: string;
  selectedTipos: string[];
  tipoPersonalizado: string;
  resumo: string;
  prioridade: PendenciaPrioridade;
  prazo: string;
  responsavel: string;
  responsavelOptions: readonly string[];
  isSaving: boolean;
  tipoOptions: string[];
  onSubmit: (event: React.FormEvent) => void;
  onNomePacienteChange: (value: string) => void;
  onCnsCpfChange: (value: string) => void;
  onToggleTipo: (tipo: string) => void;
  onTipoPersonalizadoChange: (value: string) => void;
  onResumoChange: (value: string) => void;
  onPrioridadeChange: (value: PendenciaPrioridade) => void;
  onPrazoChange: (value: string) => void;
  onResponsavelChange: (value: string) => void;
}

export const PendenciaCreatePanel: React.FC<PendenciaCreatePanelProps> = ({
  nomePaciente,
  cnsCpf,
  selectedTipos,
  tipoPersonalizado,
  resumo,
  prioridade,
  prazo,
  responsavel,
  responsavelOptions,
  isSaving,
  tipoOptions,
  onSubmit,
  onNomePacienteChange,
  onCnsCpfChange,
  onToggleTipo,
  onTipoPersonalizadoChange,
  onResumoChange,
  onPrioridadeChange,
  onPrazoChange,
  onResponsavelChange,
}) => {
  return (
    <SectionCard
      title="Nova Pendência"
      icon={<ClipboardList size={20} />}
      className="min-w-0 overflow-hidden lg:h-full lg:min-h-0"
      contentClassName="p-4 lg:min-h-0 lg:p-3"
      headerClassName="lg:p-4 lg:pb-3"
      iconClassName="lg:p-2"
      titleClassName="lg:text-base"
      headerActions={
        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">
          Cadastro
        </Badge>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col lg:min-h-0 lg:flex-1">
        <div className="custom-scrollbar flex flex-col gap-4 overflow-x-hidden pr-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:gap-3">
          <div className="rounded-2xl border border-border/70 bg-card/40 p-4 lg:rounded-lg lg:p-3">
            <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground lg:mb-2">Identificação do paciente</p>

            <div className="space-y-3 lg:space-y-2">
              <Input
                value={nomePaciente}
                onChange={(event) => onNomePacienteChange(event.target.value)}
                placeholder="Nome do paciente"
                icon={<UserRound className="h-4 w-4" />}
                className="h-11 lg:h-10"
              />

              <div className="relative">
                <Input
                  value={cnsCpf}
                  onChange={(event) => onCnsCpfChange(event.target.value)}
                  placeholder="CNS ou CPF"
                  icon={<IdCard className="h-4 w-4" />}
                  className="h-11 pr-20 font-semibold tracking-wide lg:h-10"
                />
                <Badge variant="muted" className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider">
                  {getDocumentLabel(cnsCpf)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/40 p-4 lg:rounded-lg lg:p-3">
            <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground lg:mb-2">Classificação</p>
            <TipoPendenciaSelector
              options={tipoOptions}
              selectedTipos={selectedTipos}
              tipoPersonalizado={tipoPersonalizado}
              onToggleTipo={onToggleTipo}
              onChangeTipoPersonalizado={onTipoPersonalizadoChange}
            />
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/40 p-4 lg:rounded-lg lg:p-3">
            <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground lg:mb-2">Descrição</p>
            <Textarea
              value={resumo}
              onChange={(event) => onResumoChange(event.target.value)}
              placeholder="Descreva os detalhes da pendência"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              className="min-h-28 lg:min-h-20"
            />
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/40 p-4 lg:rounded-lg lg:p-3">
            <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground lg:mb-2">Planejamento</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Flag className="h-3.5 w-3.5" />
                  Prioridade
                </p>
                <Select
                  value={prioridade}
                  onValueChange={(value) => onPrioridadeChange(value as PendenciaPrioridade)}
                >
                  <SelectTrigger className="h-11 lg:h-10">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">{PENDENCIA_PRIORIDADE_LABEL.baixa}</SelectItem>
                    <SelectItem value="normal">{PENDENCIA_PRIORIDADE_LABEL.normal}</SelectItem>
                    <SelectItem value="alta">{PENDENCIA_PRIORIDADE_LABEL.alta}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Prazo
                </p>
                <DatePicker
                  value={prazo}
                  onChange={onPrazoChange}
                  placeholder="Selecione o prazo"
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Responsável
              </p>
              <Select value={responsavel} onValueChange={onResponsavelChange}>
                <SelectTrigger className="h-11 lg:h-10">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsavelOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-4 shrink-0 border-t border-border/70 bg-background/95 pt-4 shadow-[0_-12px_28px_rgba(15,23,42,0.12)] backdrop-blur lg:mt-0 lg:bg-background/90 lg:pt-3 lg:shadow-none lg:backdrop-blur-none">
          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="h-11 w-full shrink-0 lg:h-10"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Cadastrar pendência
              </>
            )}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
};
