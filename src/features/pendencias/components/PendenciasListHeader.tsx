import React from 'react';
import { CalendarClock, FileDown, ListChecks, Loader2, Search } from 'lucide-react';
import {
  Input,
  Button,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';

export type StatusFilter = 'todos' | 'em_aberto' | 'resolvido';

interface PendenciasListHeaderProps {
  search: string;
  statusFilter: StatusFilter;
  dueTodayOnly: boolean;
  visibleCount: number;
  isGeneratingPdf: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onDueTodayOnlyChange: (value: boolean) => void;
  onGenerateOpenPdf: () => void;
}

export const PendenciasListHeader: React.FC<PendenciasListHeaderProps> = ({
  search,
  statusFilter,
  dueTodayOnly,
  visibleCount,
  isGeneratingPdf,
  onSearchChange,
  onStatusFilterChange,
  onDueTodayOnlyChange,
  onGenerateOpenPdf,
}) => {
  return (
    <div className="shrink-0 space-y-3 border-b border-[#E5ECF3] bg-white px-4 py-4 lg:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#DCE5EE] bg-[#F8FAFC] px-3 py-1 text-xs font-bold text-[#64748B]">
            <ListChecks className="size-3.5 text-[#00A885]" />
            {visibleCount} em exibição
          </div>
          <h2 className="truncate text-xl font-extrabold leading-tight text-[#001B3D]">Fila operacional</h2>
          <p className="mt-1 text-sm font-medium text-[#64748B]">
            Acompanhe status, vencimento e responsável com leitura rápida.
          </p>
        </div>

        <div className="flex shrink-0 items-center sm:pt-1">
          <Button
            type="button"
            size="sm"
            onClick={onGenerateOpenPdf}
            disabled={isGeneratingPdf}
            variant="secondary"
            aria-label="Gerar relatório semanal"
            className="h-11 w-full rounded-[1rem] border border-[#CFEDE6] bg-[#E6F7F2] px-4 text-xs font-extrabold text-[#007A65] hover:bg-[#DDF4EE] sm:w-auto"
          >
            {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            <span>Relatório semanal</span>
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
        <div className="min-w-0">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nome, CNS/CPF, tipo ou resumo"
            icon={<Search className="h-4 w-4" />}
            className="h-12 border-[#DCE5EE] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] placeholder:text-[#64748B] focus:bg-white focus:ring-[#00BB94]/20 lg:h-11"
          />
        </div>

        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as StatusFilter)}>
          <SelectTrigger className="h-12 border-[#DCE5EE] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] focus:bg-white focus:ring-[#00BB94]/20 lg:h-11">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="em_aberto">Em aberto</SelectItem>
            <SelectItem value="resolvido">Resolvidos</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex h-12 items-center justify-between gap-3 rounded-full border border-[#DCE5EE] bg-[#F8FAFC] px-4 lg:h-11">
          <span className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-[#64748B]">
            <CalendarClock className="size-4 shrink-0 text-[#F59E0B]" />
            <span className="truncate">Vence hoje</span>
          </span>
          <Switch checked={dueTodayOnly} onCheckedChange={onDueTodayOnlyChange} />
        </div>
      </div>
    </div>
  );
};
