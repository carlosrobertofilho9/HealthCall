import React, { useMemo, useState } from 'react';
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import AnatomicalMiniMap from '@/components/clinical/AnatomicalMiniMap';
import type { WoundCase, WoundCaseStatus } from '../types';
import { Filter, Plus, Play, Eye, CheckCircle, Lock, ListFilter } from 'lucide-react';

interface WoundCaseListProps {
  wounds: WoundCase[];
  selectedWoundId: string | null;
  onSelectWound: (woundId: string) => void;
  onNewWound: () => void;
  onNewEvolution: () => void;
}

const woundStatusLabels: Record<WoundCaseStatus, string> = {
  ativa: 'Ativa',
  acompanhamento: 'Acompanhamento',
  cicatrizada: 'Cicatrizada',
  encerrada: 'Encerrada',
};

const WoundCaseList: React.FC<WoundCaseListProps> = ({
  wounds,
  selectedWoundId,
  onSelectWound,
  onNewWound,
  onNewEvolution,
}) => {
  const [statusFilter, setStatusFilter] = useState<WoundCaseStatus | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState('');

  const filtered = useMemo(() => {
    return wounds.filter((wound) => {
      const statusMatch = statusFilter === 'all' || wound.status === statusFilter;
      const locationMatch = !locationFilter || wound.anatomical_code.toLowerCase().includes(locationFilter.toLowerCase());
      return statusMatch && locationMatch;
    });
  }, [locationFilter, statusFilter, wounds]);

  const activeStatusIcon = useMemo(() => {
    switch (statusFilter) {
      case 'ativa': return <Play className="h-4 w-4 text-emerald-500" />;
      case 'acompanhamento': return <Eye className="h-4 w-4 text-sky-500" />;
      case 'cicatrizada': return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'encerrada': return <Lock className="h-4 w-4 text-muted-foreground" />;
      default: return <ListFilter className="h-4 w-4" />;
    }
  }, [statusFilter]);

  return (
    <div className="space-y-4 h-full flex flex-col overflow-hidden">
      <div className="grid gap-2 sm:grid-cols-2 flex-shrink-0">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as WoundCaseStatus | 'all')}>
          <SelectTrigger icon={activeStatusIcon}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" icon={<ListFilter className="h-4 w-4" />}>Todos</SelectItem>
            <SelectItem value="ativa" icon={<Play className="h-4 w-4 text-emerald-500" />}>Ativa</SelectItem>
            <SelectItem value="acompanhamento" icon={<Eye className="h-4 w-4 text-sky-500" />}>Acompanhamento</SelectItem>
            <SelectItem value="cicatrizada" icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}>Cicatrizada</SelectItem>
            <SelectItem value="encerrada" icon={<Lock className="h-4 w-4 text-muted-foreground" />}>Encerrada</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Filtrar por código anatômico"
          value={locationFilter}
          onChange={(event) => setLocationFilter(event.target.value)}
        />
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
            Sem feridas para o filtro selecionado.
          </p>
        ) : (
          filtered.map((wound) => (
            <button
              key={wound.id}
              type="button"
              onClick={() => onSelectWound(wound.id)}
              className={`w-full rounded-xl border p-3 text-left transition-colors ${
                selectedWoundId === wound.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <AnatomicalMiniMap code={wound.anatomical_code} size={36} className="shrink-0 bg-background/50" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground leading-tight truncate">{wound.anatomical_code}</p>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                    Início: {new Date(wound.started_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={wound.status === 'encerrada' ? 'muted' : 'warning'}>{woundStatusLabels[wound.status]}</Badge>
                {wound.closure_type && <Badge variant="outline">{wound.closure_type}</Badge>}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default WoundCaseList;
