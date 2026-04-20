import React, { useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import type { WoundCase, WoundEntry, WoundPatient, WoundSortOrder } from '../types';

interface WoundEvolutionTableProps {
  entries: WoundEntry[];
  mode?: 'inline' | 'modal' | 'page';
  patient?: Pick<WoundPatient, 'full_name' | 'document_type' | 'document_value'> | null;
  wound?: Pick<WoundCase, 'anatomical_code' | 'started_at' | 'classification' | 'etiology'> | null;
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
};

const formatDate = (value?: string | null): string => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
};

const WoundEvolutionTable: React.FC<WoundEvolutionTableProps> = ({
  entries,
  mode = 'inline',
  patient,
  wound,
}) => {
  const [sortOrder, setSortOrder] = useState<WoundSortOrder>('desc');
  const printableRef = useRef<HTMLDivElement>(null);

  const canPrint = mode === 'modal' || mode === 'page';

  const sortedEntries = useMemo(() => {
    const list = [...entries];
    list.sort((a, b) => {
      const diff = new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime();
      return sortOrder === 'asc' ? diff : -diff;
    });
    return list;
  }, [entries, sortOrder]);

  const latestEntryAt = sortedEntries[0]?.recorded_at ?? null;
  const oldestEntryAt = sortedEntries[sortedEntries.length - 1]?.recorded_at ?? null;

  const handlePrint = useReactToPrint({
    contentRef: printableRef,
    documentTitle: `ficha-evolucao-curativos-${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page {
        size: A4 landscape !important;
        margin: 8mm !important;
      }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `,
  });

  return (
    <div className="wound-evolution-table space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="wound-evolution-actions flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Tabela de evolução</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          >
            Ordenar: {sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </Button>
          {canPrint && (
            <Button type="button" size="sm" variant="outline" onClick={handlePrint}>
              Imprimir
            </Button>
          )}
        </div>
      </div>

      <div ref={printableRef} className="wound-evolution-print space-y-3">
        <section className="wound-evolution-document-header">
          <div className="wound-evolution-document-ribbon">
            <span className="wound-evolution-brand">HEALTHCALL</span>
            <span className="wound-evolution-ribbon-title">Ficha de Evolução de Curativos</span>
          </div>

          <div className="wound-evolution-document-title-row">
            <h4 className="wound-evolution-document-title">Evolução dos Curativos</h4>
            <p className="wound-evolution-generated-at">
              Gerado em: {new Date().toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="wound-evolution-document-grid">
            <article className="wound-evolution-meta-card wound-evolution-meta-card--wide">
              <p className="wound-evolution-meta-label">Paciente</p>
              <p className="wound-evolution-meta-value">{patient?.full_name || '-'}</p>
              <p className="wound-evolution-meta-subvalue">
                {patient?.document_type || 'Documento'}: {patient?.document_value || '-'}
              </p>
            </article>

            <article className="wound-evolution-meta-card">
              <p className="wound-evolution-meta-label">Localização da lesão</p>
              <p className="wound-evolution-meta-value">{wound?.anatomical_code || '-'}</p>
            </article>

            <article className="wound-evolution-meta-card">
              <p className="wound-evolution-meta-label">Data de início</p>
              <p className="wound-evolution-meta-value">{formatDate(wound?.started_at)}</p>
            </article>

            <article className="wound-evolution-meta-card">
              <p className="wound-evolution-meta-label">Classificação</p>
              <p className="wound-evolution-meta-value">{wound?.classification || '-'}</p>
            </article>

            <article className="wound-evolution-meta-card">
              <p className="wound-evolution-meta-label">Etiologia</p>
              <p className="wound-evolution-meta-value">{wound?.etiology || '-'}</p>
            </article>

            <article className="wound-evolution-meta-card">
              <p className="wound-evolution-meta-label">Período da evolução</p>
              <p className="wound-evolution-meta-value">
                {sortedEntries.length > 0
                  ? `${formatDateTime(oldestEntryAt)} até ${formatDateTime(latestEntryAt)}`
                  : 'Sem registros'}
              </p>
            </article>
          </div>
        </section>

        <Table wrapperClassName="wound-evolution-table-wrapper overflow-x-auto" className="min-w-[2000px] text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Data</TableHead>
              <TableHead className="whitespace-nowrap">
                <div className="wound-evolution-head-cell">
                  <span>Medida</span>
                  <small>C x L x P</small>
                </div>
              </TableHead>
              <TableHead>
                <div className="wound-evolution-head-cell">
                  <span>Aspecto</span>
                  <small>do Leito</small>
                </div>
              </TableHead>
              <TableHead className="print-hide">Bordas</TableHead>
              <TableHead>
                <div className="wound-evolution-head-cell">
                  <span>Exsudato</span>
                  <small>Tipo/Qtd</small>
                </div>
              </TableHead>
              <TableHead className="print-hide">Odor</TableHead>
              <TableHead>
                <div className="wound-evolution-head-cell">
                  <span>Dor</span>
                  <small>0-10</small>
                </div>
              </TableHead>
              <TableHead className="print-hide">Pele Perilesional</TableHead>
              <TableHead>
                <div className="wound-evolution-head-cell">
                  <span>Cobertura</span>
                  <small>Utilizada</small>
                </div>
              </TableHead>
              <TableHead className="print-hide">ATB / Pomada</TableHead>
              <TableHead className="print-hide">Não Conformidade</TableHead>
              <TableHead className="print-hide">Ação NC</TableHead>
              <TableHead className="print-observacoes">Observações</TableHead>
              <TableHead className="print-hide">Próxima Troca</TableHead>
              <TableHead>Profissional</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="text-center text-sm text-muted-foreground">
                  Sem evolução registrada.
                </TableCell>
              </TableRow>
            ) : (
              sortedEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="align-top whitespace-nowrap">{formatDateTime(entry.recorded_at)}</TableCell>
                  <TableCell className="align-top whitespace-nowrap">
                    {entry.measure_length_cm ?? '-'} x {entry.measure_width_cm ?? '-'} x {entry.measure_depth_cm ?? '-'}
                  </TableCell>
                  <TableCell className="align-top">{entry.bed_aspect.join(', ') || '-'}</TableCell>
                  <TableCell className="align-top print-hide">{entry.edges.join(', ') || '-'}</TableCell>
                  <TableCell className="align-top">{entry.exudate ?? '-'}</TableCell>
                  <TableCell className="align-top print-hide">{entry.odor ?? '-'}</TableCell>
                  <TableCell className="align-top">{entry.pain_scale ?? '-'}</TableCell>
                  <TableCell className="align-top print-hide">{entry.perilesional_skin.join(', ') || '-'}</TableCell>
                  <TableCell className="align-top">{entry.dressing_type ?? '-'}</TableCell>
                  <TableCell className="align-top print-hide">
                    {entry.uses_antibiotic ? `ATB: ${entry.antibiotic_type ?? 'sim'}` : 'ATB: não'}
                    {' | '}
                    {entry.uses_ointment ? `Pomada: ${entry.ointment_type ?? 'sim'}` : 'Pomada: não'}
                  </TableCell>
                  <TableCell className="align-top print-hide">
                    {entry.non_conformity_detected
                      ? `${entry.non_conformity_type || 'Sim'}${entry.non_conformity_description ? ` - ${entry.non_conformity_description}` : ''}`
                      : 'Não'}
                  </TableCell>
                  <TableCell className="align-top print-hide">{entry.non_conformity_action || '-'}</TableCell>
                  <TableCell className="print-observacoes max-w-[260px] whitespace-pre-wrap align-top">{entry.observations || '-'}</TableCell>
                  <TableCell className="align-top whitespace-nowrap print-hide">{formatDate(entry.next_change_date)}</TableCell>
                  <TableCell className="align-top text-xs">{entry.profiles?.full_name || entry.professional_id}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default WoundEvolutionTable;
