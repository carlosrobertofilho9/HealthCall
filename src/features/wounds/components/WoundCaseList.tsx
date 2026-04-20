import React, { useMemo, useState } from 'react';
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import type { WoundCase, WoundCaseStatus } from '../types';
import { Filter, Plus } from 'lucide-react';

interface WoundCaseListProps {
  wounds: WoundCase[];
  selectedWoundId: string | null;
  onSelectWound: (woundId: string) => void;
  onNewWound: () => void;
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

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Feridas do paciente</h2>
        <Button type="button" size="sm" onClick={onNewWound}>
          <Plus className="h-4 w-4" />
          Nova ferida
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="relative">
          <Filter className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as WoundCaseStatus | 'all')}>
            <SelectTrigger className="pl-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativa">Ativa</SelectItem>
              <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
              <SelectItem value="cicatrizada">Cicatrizada</SelectItem>
              <SelectItem value="encerrada">Encerrada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          placeholder="Filtrar por código anatômico"
          value={locationFilter}
          onChange={(event) => setLocationFilter(event.target.value)}
        />
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
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
              <p className="text-sm font-semibold text-foreground">{wound.anatomical_code}</p>
              <p className="text-xs text-muted-foreground">
                Início: {new Date(wound.started_at).toLocaleDateString('pt-BR')}
              </p>
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
