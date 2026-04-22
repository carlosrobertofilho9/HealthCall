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
  ShieldCheck,
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

interface FormBlockProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const FormBlock: React.FC<FormBlockProps> = ({ title, description, icon, children }) => (
  <section className="rounded-[1.25rem] border border-[#E5ECF3] bg-[#F8FAFC] p-4">
    <div className="mb-4 flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[0.9rem] border border-[#DCE5EE] bg-white text-[#1466F5] shadow-[0_8px_18px_rgba(0,27,61,0.04)]">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-extrabold text-[#001B3D]">{title}</h3>
        <p className="mt-0.5 text-xs font-medium leading-5 text-[#64748B]">{description}</p>
      </div>
    </div>
    {children}
  </section>
);

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
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_18px_48px_rgba(0,27,61,0.07)] lg:h-full lg:min-h-0">
      <div className="shrink-0 border-b border-[#E5ECF3] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-[#BFE8DF] bg-[#E6F7F2] text-[#007A65] shadow-[0_12px_24px_rgba(0,187,148,0.12)]">
              <ClipboardList className="size-6" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold leading-tight text-[#001B3D]">Nova pendência</h2>
              <p className="mt-1 text-sm font-medium leading-5 text-[#64748B]">
                Cadastre uma demanda com prazo e responsável definidos.
              </p>
            </div>
          </div>

          <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-[#CFEDE6] bg-[#E6F7F2] px-3 py-1 text-xs font-bold text-[#007A65] sm:inline-flex">
            <ShieldCheck className="size-3.5" />
            Cadastro
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col lg:min-h-0 lg:flex-1">
        <div className="custom-scrollbar flex flex-col gap-4 overflow-x-hidden p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <FormBlock
            title="Identificação do paciente"
            description="Use nome completo e documento para evitar ambiguidade na fila."
            icon={<UserRound className="size-4" />}
          >
            <div className="space-y-3">
              <Input
                value={nomePaciente}
                onChange={(event) => onNomePacienteChange(event.target.value)}
                placeholder="Nome do paciente"
                icon={<UserRound className="h-4 w-4" />}
                className="h-12 border-[#DCE5EE] bg-white text-sm font-semibold text-[#001B3D] placeholder:text-[#64748B] focus:ring-[#00BB94]/20"
              />

              <div className="relative">
                <Input
                  value={cnsCpf}
                  onChange={(event) => onCnsCpfChange(event.target.value)}
                  placeholder="CNS ou CPF"
                  icon={<IdCard className="h-4 w-4" />}
                  className="h-12 border-[#DCE5EE] bg-white pr-20 text-sm font-semibold text-[#001B3D] placeholder:text-[#64748B] focus:ring-[#00BB94]/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[#DCE5EE] bg-[#F8FAFC] px-2 py-0.5 text-xs font-extrabold text-[#64748B]">
                  {getDocumentLabel(cnsCpf)}
                </span>
              </div>
            </div>
          </FormBlock>

          <FormBlock
            title="Classificação"
            description="Marque uma ou mais categorias para facilitar busca e encaminhamento."
            icon={<ClipboardList className="size-4" />}
          >
            <TipoPendenciaSelector
              options={tipoOptions}
              selectedTipos={selectedTipos}
              tipoPersonalizado={tipoPersonalizado}
              onToggleTipo={onToggleTipo}
              onChangeTipoPersonalizado={onTipoPersonalizadoChange}
            />
          </FormBlock>

          <FormBlock
            title="Descrição"
            description="Registre apenas o necessário para orientar a próxima ação."
            icon={<FileText className="size-4" />}
          >
            <Textarea
              value={resumo}
              onChange={(event) => onResumoChange(event.target.value)}
              placeholder="Descreva os detalhes da pendência"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              className="min-h-28 border-[#DCE5EE] bg-white text-sm font-medium text-[#001B3D] placeholder:text-[#64748B] focus:ring-[#00BB94]/20"
            />
          </FormBlock>

          <FormBlock
            title="Planejamento"
            description="Defina urgência, prazo e responsável antes de salvar."
            icon={<CalendarDays className="size-4" />}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#64748B]">
                  <Flag className="h-3.5 w-3.5" />
                  Prioridade
                </p>
                <Select
                  value={prioridade}
                  onValueChange={(value) => onPrioridadeChange(value as PendenciaPrioridade)}
                >
                  <SelectTrigger className="h-12 border-[#DCE5EE] bg-white text-sm font-semibold text-[#001B3D] focus:ring-[#00BB94]/20">
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
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#64748B]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Prazo
                </p>
                <DatePicker
                  value={prazo}
                  onChange={onPrazoChange}
                  placeholder="Selecione o prazo"
                  className="w-full [&_button]:h-12 [&_button]:border-[#DCE5EE] [&_button]:bg-white [&_button]:font-semibold [&_button]:text-[#001B3D] [&_button]:focus:ring-[#00BB94]/20"
                />
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#64748B]">
                <Users className="h-3.5 w-3.5" />
                Responsável
              </p>
              <Select value={responsavel} onValueChange={onResponsavelChange}>
                <SelectTrigger className="h-12 border-[#DCE5EE] bg-white text-sm font-semibold text-[#001B3D] focus:ring-[#00BB94]/20">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsavelOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </FormBlock>
        </div>

        <div className="shrink-0 border-t border-[#E5ECF3] bg-white/95 p-4 backdrop-blur">
          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="h-12 w-full shrink-0 rounded-[1rem] bg-[#00BB94] text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(0,187,148,0.22)] hover:bg-[#00A885] focus-visible:ring-[#00BB94]/45"
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
    </section>
  );
};
