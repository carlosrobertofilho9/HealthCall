import React from 'react';
import { FileDown, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

export type StatusFilter = 'todos' | 'em_aberto' | 'resolvido';

interface PendenciasListHeaderProps {
  openCount: number;
  totalCount: number;
  dueTodayCount: number;
  search: string;
  statusFilter: StatusFilter;
  dueTodayOnly: boolean;
  isGeneratingPdf: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onDueTodayOnlyChange: (value: boolean) => void;
  onGenerateOpenPdf: () => void;
}

export const PendenciasListHeader: React.FC<PendenciasListHeaderProps> = ({
  openCount,
  totalCount,
  dueTodayCount,
  search,
  statusFilter,
  dueTodayOnly,
  isGeneratingPdf,
  onSearchChange,
  onStatusFilterChange,
  onDueTodayOnlyChange,
  onGenerateOpenPdf,
}) => {
  return (
    <div className="px-6 py-5 border-b border-white/10 bg-linear-to-r from-[#1f3a2b] to-[#264532] space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
        <div>
          <h2 className="text-white text-2xl font-bold tracking-tight">Pendências</h2>
          <p className="text-sm text-[#96c5a9]/80 mt-1">
            {openCount} em aberto • {dueTodayCount} vencem hoje • {totalCount} no total
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={onGenerateOpenPdf}
          disabled={isGeneratingPdf}
          className="w-full lg:w-auto rounded-xl h-11 px-5 whitespace-nowrap bg-[#264532] text-[#96c5a9] border border-white/10 hover:bg-green-500 hover:text-white hover:border-green-400"
        >
          {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Relatório semanal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px_auto] gap-3">
        <div className="relative w-full">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nome, CNS/CPF, tipo ou resumo"
            icon={<Search className="h-4 w-4" />}
            className="h-11 rounded-xl"
          />
        </div>

        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as StatusFilter)}>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="em_aberto">Em aberto</SelectItem>
            <SelectItem value="resolvido">Resolvidos</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          size="sm"
          onClick={() => onDueTodayOnlyChange(!dueTodayOnly)}
          className={`h-11 rounded-xl px-5 border transition-colors ${
            dueTodayOnly
              ? 'bg-amber-500/20 text-amber-100 border-amber-400/40 hover:bg-amber-500/30'
              : 'bg-[#264532] text-[#96c5a9] border-white/10 hover:bg-[#315842] hover:text-white'
          }`}
        >
          {dueTodayOnly ? 'Vence hoje: ligado' : 'Vence hoje'}
        </Button>
      </div>
    </div>
  );
};
