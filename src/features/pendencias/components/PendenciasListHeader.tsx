import React from 'react';
import { FileDown, Loader2, Search } from 'lucide-react';
import {
  DS_COLOR,
  DS_RADIUS,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
import { cn } from '@/lib/utils';

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
    <div className="px-6 py-5 border-b border-border bg-secondary/30 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pendências</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {openCount} em aberto • {dueTodayCount} vencem hoje • {totalCount} no total
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={onGenerateOpenPdf}
          disabled={isGeneratingPdf}
          variant="secondary"
          className={cn('w-full lg:w-auto h-11 px-5 whitespace-nowrap', DS_RADIUS.section)}
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
            className={cn('h-11', DS_RADIUS.section)}
          />
        </div>

        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as StatusFilter)}>
          <SelectTrigger className={cn('h-11', DS_RADIUS.section)}>
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
          variant="secondary"
          className={cn(
            'h-11 px-5 border transition-colors',
            DS_RADIUS.section,
            dueTodayOnly
              ? 'border-warning/40 bg-warning/20 text-warning hover:bg-warning/30'
              : DS_COLOR.border.default,
          )}
        >
          {dueTodayOnly ? 'Vence hoje: ligado' : 'Vence hoje'}
        </Button>
      </div>
    </div>
  );
};
