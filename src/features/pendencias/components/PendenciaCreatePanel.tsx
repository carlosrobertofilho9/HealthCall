import React from 'react';
import { CheckCircle2, ListTodo, Loader2, UserRound, IdCard, FileText } from 'lucide-react';
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
    <section className="rounded-none xl:rounded-2xl border border-white/10 border-x-0 xl:border-x bg-[#1a2c22] overflow-hidden shadow-none xl:shadow-2xl flex flex-col h-full min-h-0">
      <div className="px-6 py-5 border-b border-white/10 bg-linear-to-r from-[#264532] to-[#1f3a2b]">
        <h2 className="text-white text-xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 bg-[#1a2c22] rounded-lg border border-white/10">
            <ListTodo className="text-[#96c5a9]" size={20} />
          </div>
          Nova Pendência
        </h2>
        <p className="text-[#96c5a9]/80 text-sm mt-1">Registre pendências e acompanhe o fluxo de resolução.</p>
      </div>

      <form onSubmit={onSubmit} className="p-5 space-y-4 overflow-visible xl:flex-1 xl:min-h-0 xl:overflow-y-auto custom-scrollbar">
        <div className="rounded-xl border border-white/10 bg-[#264532]/40 p-4 space-y-3">
          <p className="text-xs uppercase tracking-wide text-[#96c5a9]/70">Identificação</p>
          <Input
            value={nomePaciente}
            onChange={(event) => onNomePacienteChange(event.target.value)}
            placeholder="Nome do paciente"
            icon={<UserRound className="h-4 w-4" />}
            className="h-11 rounded-xl bg-[#1f3a2b]"
          />

          <div className="relative">
            <Input
              value={cnsCpf}
              onChange={(event) => onCnsCpfChange(event.target.value)}
              placeholder="CNS ou CPF"
              icon={<IdCard className="h-4 w-4" />}
              className="h-11 rounded-xl pr-20 bg-[#1f3a2b] font-semibold tracking-wide"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[#325a42] px-2 py-1 text-[11px] text-[#96c5a9]">
              {getDocumentLabel(cnsCpf)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#264532]/40 p-4 space-y-3">
          <p className="text-xs uppercase tracking-wide text-[#96c5a9]/70">Tipo da pendência</p>
          <TipoPendenciaSelector
            options={tipoOptions}
            selectedTipos={selectedTipos}
            tipoPersonalizado={tipoPersonalizado}
            onToggleTipo={onToggleTipo}
            onChangeTipoPersonalizado={onTipoPersonalizadoChange}
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-[#264532]/40 p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-[#96c5a9]/70">Descrição</p>
          <div className="relative">
            <FileText className="absolute left-3 top-3.5 h-4 w-4 text-[#96c5a9]/80" />
            <textarea
              value={resumo}
              onChange={(event) => onResumoChange(event.target.value)}
              placeholder="Descreva os detalhes da pendência"
              className="w-full rounded-xl text-white bg-[#1f3a2b] border border-white/10 min-h-28 p-3 pl-10 placeholder:text-[#96c5a9]/60 focus:ring-2 focus:ring-primary transition-all focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#264532]/40 p-4 space-y-3">
          <p className="text-xs uppercase tracking-wide text-[#96c5a9]/70">Planejamento</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#96c5a9]/70 mb-1">Prioridade</p>
              <Select
                value={prioridade}
                onValueChange={(value) => onPrioridadeChange(value as PendenciaPrioridade)}
              >
                <SelectTrigger className="h-11 rounded-xl">
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
              <p className="text-[11px] uppercase tracking-wide text-[#96c5a9]/70 mb-1">Prazo</p>
              <input
                type="date"
                value={prazo}
                onChange={(event) => onPrazoChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-input px-4 text-foreground focus:ring-2 focus:ring-ring transition-all focus:outline-none"
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#96c5a9]/70 mb-1">Responsável</p>
            <Select value={responsavel} onValueChange={onResponsavelChange}>
              <SelectTrigger className="h-11 rounded-xl">
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
          className="rounded-xl h-11 bg-[#264532] text-[#96c5a9] border border-white/10 hover:bg-green-500 hover:text-white hover:border-green-400"
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
