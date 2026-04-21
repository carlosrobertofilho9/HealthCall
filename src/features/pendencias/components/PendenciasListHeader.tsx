import React from 'react';
import { FileDown, Loader2, Search, ListChecks, ClipboardList, CalendarClock } from 'lucide-react';
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
    <div className="shrink-0 space-y-3 border-b border-border p-3 lg:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-black tracking-tight text-foreground lg:text-xl">Fila de Pendências</h2>
          <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
            Monitoramento operacional por status, prazo e responsável.
          </p>
        </div>

        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            size="sm"
            onClick={onGenerateOpenPdf}
            disabled={isGeneratingPdf}
            variant="secondary"
            aria-label="Gerar relatório semanal"
            className="h-8 w-8 gap-2 rounded-lg p-0 lg:h-9 lg:w-auto lg:px-3"
          >
            {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            <span className="hidden lg:inline">Relatório semanal</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 lg:flex lg:items-center">
        <article className="min-w-0 rounded-lg border border-border/70 bg-card/40 p-2 lg:flex lg:h-9 lg:items-center lg:gap-2 lg:px-3 lg:py-0">
          <p className="flex min-w-0 items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground lg:gap-1.5 lg:text-[10px]">
            <ListChecks className="h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5" />
            <span className="truncate">Abertas</span>
          </p>
          <p className="mt-0.5 text-lg font-black text-foreground lg:mt-0 lg:text-sm">{openCount}</p>
        </article>

        <article className="min-w-0 rounded-lg border border-border/70 bg-card/40 p-2 lg:flex lg:h-9 lg:items-center lg:gap-2 lg:px-3 lg:py-0">
          <p className="flex min-w-0 items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground lg:gap-1.5 lg:text-[10px]">
            <CalendarClock className="h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5" />
            <span className="truncate">Hoje</span>
          </p>
          <p className="mt-0.5 text-lg font-black text-foreground lg:mt-0 lg:text-sm">{dueTodayCount}</p>
        </article>

        <article className="min-w-0 rounded-lg border border-border/70 bg-card/40 p-2 lg:flex lg:h-9 lg:items-center lg:gap-2 lg:px-3 lg:py-0">
          <p className="flex min-w-0 items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground lg:gap-1.5 lg:text-[10px]">
            <ClipboardList className="h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5" />
            <span className="truncate">Total</span>
          </p>
          <p className="mt-0.5 text-lg font-black text-foreground lg:mt-0 lg:text-sm">{totalCount}</p>
        </article>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 lg:grid-cols-[minmax(0,1fr)_180px_170px]">
        <div className="col-span-2 min-w-0 lg:col-span-1">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nome, CNS/CPF, tipo ou resumo"
            icon={<Search className="h-4 w-4" />}
            className="h-10 lg:h-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as StatusFilter)}>
          <SelectTrigger className="h-10 lg:h-9">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="em_aberto">Em aberto</SelectItem>
            <SelectItem value="resolvido">Resolvidos</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card/40 px-2 lg:h-9 lg:justify-between lg:rounded-lg lg:px-3">
          <CalendarClock className="h-4 w-4 text-muted-foreground lg:hidden" />
          <span className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:inline">Somente vence hoje</span>
          <Switch checked={dueTodayOnly} onCheckedChange={onDueTodayOnlyChange} />
        </div>
      </div>
    </div>
  );
};
