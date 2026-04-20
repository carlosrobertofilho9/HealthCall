import React, { useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import type { WoundCase, WoundEntry, WoundPatient, WoundPhoto, WoundSortOrder } from '../types';
import { useWoundPhotoMetadata } from '../hooks/useWoundPhotoMetadata';

interface WoundEvolutionTableProps {
  entries: WoundEntry[];
  photos?: WoundPhoto[];
  mode?: 'inline' | 'modal' | 'page';
  patient?: Pick<WoundPatient, 'full_name' | 'document_type' | 'document_value'> | null;
  wound?: Pick<WoundCase, 'id' | 'anatomical_code' | 'started_at' | 'classification' | 'etiology' | 'comorbidities' | 'status' | 'closure_date'> | null;
  onEditEntry?: (entry: WoundEntry) => void;
  onDeleteEntry?: (entry: WoundEntry) => void;
}

const PrintPhotoItem: React.FC<{ photo: WoundPhoto }> = ({ photo }) => {
  const { status, metadata } = useWoundPhotoMetadata(photo);

  return (
    <div className="wound-evolution-photo-item border border-border p-2 rounded-lg bg-white flex flex-col gap-2">
      <div className="aspect-square w-full rounded overflow-hidden bg-muted flex items-center justify-center">
        {photo.signed_url ? (
          <img
            src={photo.signed_url}
            alt={photo.description || 'Foto da ferida'}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Sem URL</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-foreground">
          <span>{new Date(photo.captured_at).toLocaleDateString('pt-BR')}</span>
          <span>{new Date(photo.captured_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {status === 'ready' && metadata?.address && (
          <p className="text-[9px] leading-tight text-muted-foreground">
            <span className="font-bold">Loc: </span>
            {metadata.address}
          </p>
        )}
        {status === 'ready' && !metadata?.address && (
          <p className="text-[9px] leading-tight text-muted-foreground italic">
            Localização não disponível
          </p>
        )}
        {status === 'loading' && (
          <p className="text-[9px] leading-tight text-muted-foreground animate-pulse">
            Carregando localização...
          </p>
        )}
      </div>
    </div>
  );
};

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
  photos = [],
  mode = 'inline',
  patient,
  wound,
  onEditEntry,
  onDeleteEntry,
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

  const clinicalSummary = useMemo(() => {
    if (!entries.length) return null;

    // Data handling
    const chronological = [...entries].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    const first = chronological[0];
    const latest = chronological[chronological.length - 1];

    // Treatment Days
    const start = wound?.started_at ? new Date(wound.started_at) : new Date(first.recorded_at);
    const totalDays = Math.ceil((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Area Reduction
    const firstArea = (first.measure_length_cm || 0) * (first.measure_width_cm || 0);
    const latestArea = (latest.measure_length_cm || 0) * (latest.measure_width_cm || 0);
    const areaReduction = firstArea > 0 ? Math.round(((firstArea - latestArea) / firstArea) * 100) : 0;

    // Medications
    const meds = new Map<string, { name: string; type: 'atb' | 'pomada'; start: string; end: string }>();

    chronological.forEach((entry) => {
      if (entry.uses_antibiotic) {
        const name = entry.antibiotic_type || 'Antibiótico';
        const key = `atb-${name}`;
        const current = meds.get(key);
        if (!current) {
          meds.set(key, { name, type: 'atb', start: entry.recorded_at, end: entry.recorded_at });
        } else {
          current.end = entry.recorded_at;
        }
      }
      if (entry.uses_ointment) {
        const name = entry.ointment_type || 'Pomada';
        const key = `pomada-${name}`;
        const current = meds.get(key);
        if (!current) {
          meds.set(key, { name, type: 'pomada', start: entry.recorded_at, end: entry.recorded_at });
        } else {
          current.end = entry.recorded_at;
        }
      }
    });

    const medicationsWithDays = Array.from(meds.values()).map((med) => {
      const start = new Date(med.start);
      const end = new Date(med.end);
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return { ...med, diffDays };
    });

    // Healing / Duration
    let healingDurationDays = null;
    if (wound?.status === 'cicatrizada' || wound?.status === 'encerrada') {
      const end = wound.closure_date ? new Date(wound.closure_date) : new Date(latest.recorded_at);
      healingDurationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Non-conformities
    const nonConformities = chronological
      .filter((e) => e.non_conformity_detected)
      .map((e) => ({
        date: e.recorded_at,
        type: e.non_conformity_type,
        desc: e.non_conformity_description,
      }));

    return {
      totalDays,
      healingDurationDays,
      areaReduction,
      medications: medicationsWithDays,
      nonConformities,
    };
  }, [entries, wound]);

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
      .break-before-page {
        break-before: page !important;
        page-break-before: always !important;
      }
      .wound-evolution-photo-item {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
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
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="wound-evolution-meta-label">Paciente</p>
                  <p className="wound-evolution-meta-value">{patient?.full_name || '-'}</p>
                  <p className="wound-evolution-meta-subvalue">
                    {patient?.document_type || 'CPF'}: {patient?.document_value || 'Não informado'}
                  </p>
                </div>
                {wound?.comorbidities && wound.comorbidities.length > 0 && (
                  <div className="flex-1 border-l border-border pl-4">
                    <p className="wound-evolution-meta-label">Comorbidades</p>
                    <p className="wound-evolution-meta-value !text-[10px] !font-medium !leading-tight">
                      {wound.comorbidities.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </article>

            <article className="wound-evolution-meta-card wound-evolution-meta-card--wide">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <p className="wound-evolution-meta-label">Localização e Início</p>
                  <p className="wound-evolution-meta-value">{wound?.anatomical_code || '-'}</p>
                  <p className="wound-evolution-meta-subvalue">Início: {formatDate(wound?.started_at)}</p>
                </div>
                {wound?.etiology && wound.etiology !== '-' && (
                  <div className="flex flex-col border-l border-border pl-4">
                    <p className="wound-evolution-meta-label">Etiologia / Causa</p>
                    <p className="wound-evolution-meta-value">{wound.etiology}</p>
                  </div>
                )}
                {wound?.classification && wound.classification !== '-' && (
                  <div className="flex flex-col border-l border-border pl-4">
                    <p className="wound-evolution-meta-label">Classificação</p>
                    <p className="wound-evolution-meta-value">{wound.classification}</p>
                  </div>
                )}
              </div>
            </article>

            <article className="wound-evolution-meta-card wound-evolution-meta-card--wide">
              <p className="wound-evolution-meta-label">Período Selecionado para este Relatório</p>
              <p className="wound-evolution-meta-value !text-[11px]">
                {sortedEntries.length > 0
                  ? `${formatDateTime(oldestEntryAt)} até ${formatDateTime(latestEntryAt)}`
                  : 'Sem registros no período'}
              </p>
            </article>
          </div>
        </section>

        {clinicalSummary && (
          <section className="wound-evolution-clinical-summary">
            <article className="wound-evolution-summary-card">
              <span className="wound-evolution-summary-label">Indicadores de Evolução</span>
              <div className="wound-evolution-summary-stats">
                <div className="wound-evolution-stat-group">
                  <span className="wound-evolution-stat-value">{clinicalSummary.totalDays}d</span>
                  <span className="wound-evolution-stat-label">DDI (Intervenção)</span>
                </div>
                {clinicalSummary.healingDurationDays !== null && (
                  <div className="wound-evolution-stat-group">
                    <span className="wound-evolution-stat-value text-indigo-500">
                      {clinicalSummary.healingDurationDays}d
                    </span>
                    <span className="wound-evolution-stat-label">Cicatrização</span>
                  </div>
                )}
                {clinicalSummary.areaReduction > 0 && clinicalSummary.healingDurationDays === null && (
                  <div className="wound-evolution-stat-group">
                    <span className="wound-evolution-stat-value !text-indigo-600">
                      -{clinicalSummary.areaReduction}%
                    </span>
                    <span className="wound-evolution-stat-label">Área reduzida</span>
                  </div>
                )}
                {wound?.comorbidities && wound.comorbidities.length > 0 && (
                  <div className="wound-evolution-stat-group">
                    <span className="wound-evolution-stat-value text-xs !font-bold">
                      {wound.comorbidities.length}
                    </span>
                    <span className="wound-evolution-stat-label">Comorbidades</span>
                  </div>
                )}
              </div>
            </article>

            <article className="wound-evolution-summary-card">
              <span className="wound-evolution-summary-label">Terapêutica Utilizada (ATB / Pomadas)</span>
              <div className="wound-evolution-summary-list">
                {clinicalSummary.medications.length > 0 ? (
                  clinicalSummary.medications.map((med, idx) => (
                    <div key={idx} className="wound-evolution-summary-item">
                      <div className="flex items-center gap-2">
                        <span className="wound-evolution-summary-badge">
                          {med.type.toUpperCase()}
                        </span>
                        <span className="wound-evolution-summary-item-name">{med.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="wound-evolution-summary-item-period">
                          {formatDate(med.start)} - {formatDate(med.end)}
                        </span>
                        <span className="font-bold text-primary text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">
                          {med.diffDays} dias
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">
                    Nenhum uso de ATB ou Pomada registrado nas evoluções.
                  </span>
                )}
              </div>
            </article>
          </section>
        )}

        {clinicalSummary && clinicalSummary.nonConformities.length > 0 && (
          <section className="wound-evolution-alerts">
            <div className="wound-evolution-alerts-header">
              <span className="wound-evolution-alerts-title">Alertas e Incidências Detectadas (Não Conformidades)</span>
              <span className="wound-evolution-alerts-count">{clinicalSummary.nonConformities.length} registros</span>
            </div>
            <div className="wound-evolution-alerts-grid">
              {clinicalSummary.nonConformities.slice(0, 4).map((nc, idx) => (
                <div key={idx} className="wound-evolution-alert-item">
                  <span className="wound-evolution-alert-date">{formatDate(nc.date)}</span>
                  <div className="wound-evolution-alert-content">
                    <span className="wound-evolution-alert-type">{nc.type || 'Não conformidade'}</span>
                    {nc.desc && <span className="wound-evolution-alert-desc">{nc.desc}</span>}
                  </div>
                </div>
              ))}
              {clinicalSummary.nonConformities.length > 4 && (
                <div className="wound-evolution-alert-more">
                  + {clinicalSummary.nonConformities.length - 4} outros eventos registrados na tabela abaixo.
                </div>
              )}
            </div>
          </section>
        )}

        <Table wrapperClassName="wound-evolution-table-wrapper overflow-x-auto" className="min-w-[2000px] text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Data</TableHead>
              <TableHead className="print-hide">Ações</TableHead>
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
                  <TableCell className="align-top print-hide">
                    <div className="flex items-center gap-1">
                      {onEditEntry && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                          onClick={() => onEditEntry(entry)}
                          title="Editar evolução"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </Button>
                      )}
                      {onDeleteEntry && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => onDeleteEntry(entry)}
                          title="Excluir evolução"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </Button>
                      )}
                    </div>
                  </TableCell>
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

        {photos.length > 0 && (
          <section className="wound-evolution-print-gallery break-before-page pt-8">
            <div className="wound-evolution-document-ribbon mb-6">
              <span className="wound-evolution-brand">HEALTHCALL</span>
              <span className="wound-evolution-ribbon-title">Galeria de Fotos do Prontuário</span>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {[...photos]
                .sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime())
                .map((photo) => (
                  <PrintPhotoItem key={photo.id} photo={photo} />
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default WoundEvolutionTable;
