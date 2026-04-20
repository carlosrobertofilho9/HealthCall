import React, { useMemo, useState } from 'react';
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import type { WoundEntry, WoundSortOrder } from '../types';

interface WoundEvolutionTableProps {
  entries: WoundEntry[];
}

const WoundEvolutionTable: React.FC<WoundEvolutionTableProps> = ({ entries }) => {
  const [sortOrder, setSortOrder] = useState<WoundSortOrder>('desc');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const sortedEntries = useMemo(() => {
    const list = [...entries];
    list.sort((a, b) => {
      const diff = new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime();
      return sortOrder === 'asc' ? diff : -diff;
    });
    return list;
  }, [entries, sortOrder]);

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Tabela de evolução</h3>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
        >
          Ordenar: {sortOrder === 'asc' ? 'Asc' : 'Desc'}
        </Button>
      </div>

      <Table wrapperClassName="max-h-96 overflow-x-auto">
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Medidas (C x L x P)</TableHead>
            <TableHead>Aspecto</TableHead>
            <TableHead>Bordas</TableHead>
            <TableHead>Exsudato</TableHead>
            <TableHead>Odor</TableHead>
            <TableHead>Dor</TableHead>
            <TableHead>Cobertura</TableHead>
            <TableHead>ATB/Pomada</TableHead>
            <TableHead>Não conformidade</TableHead>
            <TableHead>Profissional</TableHead>
            <TableHead>Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEntries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center text-sm text-muted-foreground">
                Sem evolução registrada.
              </TableCell>
            </TableRow>
          ) : (
            sortedEntries.map((entry) => (
              <React.Fragment key={entry.id}>
                <TableRow>
                  <TableCell>{new Date(entry.recorded_at).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>
                    {entry.measure_length_cm ?? '-'} x {entry.measure_width_cm ?? '-'} x {entry.measure_depth_cm ?? '-'}
                  </TableCell>
                  <TableCell>{entry.bed_aspect.join(', ') || '-'}</TableCell>
                  <TableCell>{entry.edges.join(', ') || '-'}</TableCell>
                  <TableCell>{entry.exudate ?? '-'}</TableCell>
                  <TableCell>{entry.odor ?? '-'}</TableCell>
                  <TableCell>{entry.pain_scale ?? '-'}</TableCell>
                  <TableCell>{entry.dressing_type ?? '-'}</TableCell>
                  <TableCell>
                    {entry.uses_antibiotic ? `ATB: ${entry.antibiotic_type ?? 'sim'}` : 'ATB: não'}
                    {' | '}
                    {entry.uses_ointment ? `Pomada: ${entry.ointment_type ?? 'sim'}` : 'Pomada: não'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.non_conformity_detected ? 'destructive' : 'muted'}>
                      {entry.non_conformity_detected ? 'Sim' : 'Não'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{entry.profiles?.full_name || entry.professional_id}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedEntryId((prev) => (prev === entry.id ? null : entry.id))}
                    >
                      {expandedEntryId === entry.id ? 'Recolher' : 'Expandir'}
                    </Button>
                  </TableCell>
                </TableRow>

                {expandedEntryId === entry.id && (
                  <TableRow>
                    <TableCell colSpan={12}>
                      <div className="grid gap-2 text-sm">
                        <p>
                          <strong>Pele perilesional:</strong> {entry.perilesional_skin.join(', ') || '-'}
                        </p>
                        <p>
                          <strong>Observações:</strong> {entry.observations || '-'}
                        </p>
                        <p>
                          <strong>Ação na não conformidade:</strong> {entry.non_conformity_action || '-'}
                        </p>
                        <p>
                          <strong>Próxima troca sugerida:</strong>{' '}
                          {entry.next_change_date ? new Date(entry.next_change_date).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default WoundEvolutionTable;
