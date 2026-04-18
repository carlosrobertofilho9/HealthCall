import React from 'react';
import {
  CheckCircle2,
  ListTodo,
  Loader2,
  UserRound,
  IdCard,
  FileText
} from 'lucide-react';
import {
  DS_COLOR,
  DS_RADIUS,
  DS_RADIUS_VARIANT,
  Input,
  Button,
  Textarea,
  FormSection,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
import { cn } from '@/lib/utils';
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
    <section
      className={cn(
        'rounded-none border border-x-0 bg-card overflow-hidden shadow-none xl:border-x xl:shadow-sm flex flex-col h-full min-h-0',
        DS_COLOR.border.default,
        DS_RADIUS_VARIANT.xlSurface,
      )}
    >
      <div className="px-6 py-5 border-b border-border bg-secondary/30">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
          <div className={cn('p-2 bg-card border', DS_COLOR.border.default, DS_RADIUS.control)}>
            <ListTodo className="text-primary" size={20} />
          </div>
          Nova Pendência
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Registre pendências e acompanhe o fluxo de resolução.</p>
      </div>

      <form onSubmit={onSubmit} className="p-5 space-y-4 overflow-visible xl:flex-1 xl:min-h-0 xl:overflow-y-auto custom-scrollbar">
        <div className={cn(DS_RADIUS.section, 'border border-border bg-secondary/20 p-4 space-y-3')}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Identificação</p>
          <Input
            value={nomePaciente}
            onChange={(event) => onNomePacienteChange(event.target.value)}
            placeholder="Nome do paciente"
            icon={<UserRound className="h-4 w-4" />}
            className={cn('h-11', DS_RADIUS.section)}
          />

          <div className="relative">
            <Input
              value={cnsCpf}
              onChange={(event) => onCnsCpfChange(event.target.value)}
              placeholder="CNS ou CPF"
              icon={<IdCard className="h-4 w-4" />}
              className={cn('h-11 pr-20 font-semibold tracking-wide', DS_RADIUS.section)}
            />
            <Badge variant="muted" className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs">
              {getDocumentLabel(cnsCpf)}
            </Badge>
          </div>
        </div>

        <div className={cn(DS_RADIUS.section, 'border border-border bg-secondary/20 p-4 space-y-3')}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Tipo da pendência</p>
          <TipoPendenciaSelector
            options={tipoOptions}
            selectedTipos={selectedTipos}
            tipoPersonalizado={tipoPersonalizado}
            onToggleTipo={onToggleTipo}
            onChangeTipoPersonalizado={onTipoPersonalizadoChange}
          />
        </div>

        <FormSection title="Descrição" className="bg-secondary/20" contentClassName="space-y-2">
          <Textarea
            value={resumo}
            onChange={(event) => onResumoChange(event.target.value)}
            placeholder="Descreva os detalhes da pendência"
            icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            className={cn('min-h-28', DS_RADIUS.section)}
          />
        </FormSection>

        <div className={cn(DS_RADIUS.section, 'border border-border bg-secondary/20 p-4 space-y-3')}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Planejamento</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Prioridade</p>
              <Select
                value={prioridade}
                onValueChange={(value) => onPrioridadeChange(value as PendenciaPrioridade)}
              >
                <SelectTrigger className={cn('h-11', DS_RADIUS.section)}>
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
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Prazo</p>
              <input
                type="date"
                value={prazo}
                onChange={(event) => onPrazoChange(event.target.value)}
                className={cn('h-11 w-full border border-input bg-input px-4 text-foreground focus:ring-2 focus:ring-ring transition-all focus:outline-none', DS_RADIUS.section)}
              />
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Responsável</p>
            <Select value={responsavel} onValueChange={onResponsavelChange}>
              <SelectTrigger className={cn('h-11', DS_RADIUS.section)}>
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

        <Button
          type="submit"
          size="sm"
          disabled={isSaving}
          className={cn('h-11', DS_RADIUS.section)}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Cadastrar pendência
            </>
          )}
        </Button>
      </form>
    </section>
  );
};
