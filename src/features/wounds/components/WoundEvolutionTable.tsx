import React, { useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import type {
  WoundCase,
  WoundEntry,
  WoundPatient,
  WoundPhoto,
  WoundPhotoExifMetadata,
  WoundPhotoMetadataSource,
  WoundSortOrder,
} from '../types';
import { useWoundPhotoMetadata } from '../hooks/useWoundPhotoMetadata';
import { thumbnailizeFromUrl } from '@/lib/imageUtils';
import {
  isLegacyPhotoCreatedAt,
  resolveWoundPhotoMetadataOnDemand,
} from '../services/woundPhotoMetadataService';

interface WoundEvolutionTableProps {
  entries: WoundEntry[];
  photos?: WoundPhoto[];
  mode?: 'inline' | 'modal' | 'page';
  patient?: Pick<WoundPatient, 'full_name' | 'document_type' | 'document_value'> | null;
  wound?: Pick<WoundCase, 'id' | 'anatomical_code' | 'started_at' | 'classification' | 'etiology' | 'comorbidities' | 'status' | 'closure_date'> | null;
  onEditEntry?: (entry: WoundEntry) => void;
  onDeleteEntry?: (entry: WoundEntry) => void;
}

export const PRINT_METADATA_WAIT_TIMEOUT_MS = 5000;

type PrefetchedPhotoMetadata = {
  metadata: WoundPhotoExifMetadata | null;
  source: WoundPhotoMetadataSource;
};

/**
 * Componente que gera uma miniatura leve para o PDF no momento da visualização.
 * Isso resolve o problema de PDFs gigantes (80MB+) mesmo para fotos antigas de alta resolução.
 */
const PrintPhotoThumbnail: React.FC<{ url: string; alt: string }> = ({ url, alt }) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    thumbnailizeFromUrl(url, 600, 0.7)
      .then(result => {
        if (isMounted) setThumbUrl(result);
      })
      .catch(err => {
        console.warn('[PrintPhotoThumbnail] Falha ao processar miniatura:', err);
        if (isMounted) setError(true);
      });
    return () => { isMounted = false; };
  }, [url]);

  if (error) {
    return (
      <img
        src={url}
        alt={alt}
        className="h-full w-full object-cover"
        crossOrigin="anonymous"
      />
    );
  }

  if (!thumbUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/30">
        <div className="h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={thumbUrl}
      alt={alt}
      className="h-full w-full object-cover"
      // @ts-ignore
      decoding="sync"
    />
  );
};

function getLocationOriginLabel(source: WoundPhotoMetadataSource, photoLocationSource?: WoundPhoto['location_source']): string | null {
  if (source === 'exif_download') return 'GPS da foto';
  if (source === 'photo_row') {
    if (photoLocationSource === 'device') return 'GPS do dispositivo';
    return 'GPS da foto';
  }
  if (photoLocationSource === 'device') return 'GPS do dispositivo';
  if (photoLocationSource === 'exif') return 'GPS da foto';
  return null;
}

const PrintPhotoItem: React.FC<{ photo: WoundPhoto; prefetched?: PrefetchedPhotoMetadata }> = ({ photo, prefetched }) => {
  const { status, metadata, source } = useWoundPhotoMetadata(photo);

  const effectiveMetadata = metadata ?? prefetched?.metadata ?? null;
  const effectiveSource = source ?? prefetched?.source ?? null;
  const displayAddress = effectiveMetadata?.address;
  const latitude = typeof effectiveMetadata?.latitude === 'number' ? effectiveMetadata.latitude : undefined;
  const longitude = typeof effectiveMetadata?.longitude === 'number' ? effectiveMetadata.longitude : undefined;
  const displayCoordinates = typeof latitude === 'number' && typeof longitude === 'number'
    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    : null;
  const showLoading = status === 'loading' && !effectiveMetadata;
  const locationOriginLabel = getLocationOriginLabel(effectiveSource, photo.location_source);
  const isLegacy = isLegacyPhotoCreatedAt(photo.created_at);

  return (
    <div className="wound-evolution-photo-item border border-border p-2 rounded-lg bg-white flex flex-col gap-2">
      <div className="aspect-square w-full rounded overflow-hidden bg-muted flex items-center justify-center">
        {photo.signed_url ? (
          <PrintPhotoThumbnail 
            url={photo.signed_url} 
            alt={photo.description || 'Foto da ferida'} 
          />
        ) : (
          <span className="text-[10px] text-muted-foreground uppercase font-bold text-center p-2">Sem imagem disponível</span>
        )}
      </div>
      <div className="flex flex-col gap-1 min-h-[40px]">
        <div className="flex items-center justify-between text-[10px] font-bold text-foreground">
          <span>{photo.captured_at ? new Date(photo.captured_at).toLocaleDateString('pt-BR') : '-'}</span>
          <span>{photo.captured_at ? new Date(photo.captured_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
        </div>
        
        {displayAddress && (
          <p className="text-[9px] leading-tight text-muted-foreground">
            <span className="font-bold text-primary/70">Loc: </span>
            {displayAddress}
            {locationOriginLabel && (
              <>
                {' '}
                <span className="font-semibold">({locationOriginLabel})</span>
              </>
            )}
          </p>
        )}

        {!displayAddress && displayCoordinates && (
          <p className="text-[9px] leading-tight text-muted-foreground space-y-0.5">
            <span className="font-bold text-primary/70">GPS: </span>
            <span>{displayCoordinates}</span>
            {locationOriginLabel && (
              <>
                {' '}
                <span className="font-semibold">({locationOriginLabel})</span>
              </>
            )}
          </p>
        )}
        
        {!displayAddress && !displayCoordinates && (status === 'ready' || status === 'empty') && (
          <p className="text-[9px] leading-tight text-muted-foreground italic">
            {isLegacy ? 'Localização indisponível (legado)' : 'Localização não disponível'}
          </p>
        )}

        {showLoading && (
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
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [showOverview, setShowOverview] = useState(true);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [prefetchedByPhotoId, setPrefetchedByPhotoId] = useState<Record<string, PrefetchedPhotoMetadata>>({});
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

  const toggleRowDetails = (entryId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  };

  const triggerPrint = useReactToPrint({
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

  const preloadPrintMetadata = async (): Promise<void> => {
    if (!photos.length) return;

    const nextCache: Record<string, PrefetchedPhotoMetadata> = {};
    let timedOut = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const workers = photos.map(async (photo) => {
      try {
        const resolved = await resolveWoundPhotoMetadataOnDemand(photo);
        if (!timedOut) {
          nextCache[photo.id] = resolved;
        }
      } catch {
        // Best effort: falhas individuais não devem bloquear a impressão.
      }
    });

    await Promise.race([
      Promise.allSettled(workers),
      new Promise<void>((resolve) => {
        timeoutId = setTimeout(() => {
          timedOut = true;
          resolve();
        }, PRINT_METADATA_WAIT_TIMEOUT_MS);
      }),
    ]);

    timedOut = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (Object.keys(nextCache).length > 0) {
      setPrefetchedByPhotoId((prev) => ({ ...prev, ...nextCache }));
    }
  };

  const handlePrint = async () => {
    if (!triggerPrint) return;

    setIsPreparingPrint(true);
    try {
      await preloadPrintMetadata();
      await new Promise((resolve) => setTimeout(resolve, 0));
      triggerPrint();
    } finally {
      setIsPreparingPrint(false);
    }
  };

  return (
    <div className="wound-evolution-table space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="wound-evolution-actions flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Tabela de evolução</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="print-hide"
            onClick={() => setShowOverview((prev) => !prev)}
          >
            {showOverview ? 'Ocultar resumo' : 'Mostrar resumo'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          >
            Ordenar: {sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </Button>
          {canPrint && (
            <Button type="button" size="sm" variant="outline" onClick={() => { void handlePrint(); }} disabled={isPreparingPrint}>
              {isPreparingPrint ? 'Preparando impressão...' : 'Imprimir'}
            </Button>
          )}
        </div>
      </div>

      <div ref={printableRef} className="wound-evolution-print space-y-3">
        <div className={showOverview ? 'space-y-3 print:space-y-3' : 'hidden space-y-3 print:block print:space-y-3'}>
        <section className="wound-evolution-document-header shadow-sm">
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
            <article className="wound-evolution-meta-card wound-evolution-meta-card--wide space-y-1">
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
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 print:grid-cols-3">
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
        </div>

        <div className="space-y-3 md:hidden print:hidden">
          {sortedEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
              Nenhum registro de evolução.
            </div>
          ) : (
            sortedEntries.map((entry) => (
              <article key={`mobile-${entry.id}`} className="rounded-xl border border-border bg-background p-3 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Data/hora do registro</p>
                    <p className="text-sm font-semibold text-foreground">{formatDateTime(entry.recorded_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Responsável</p>
                    <p className="text-xs text-foreground">{entry.profiles?.full_name || entry.professional_id}</p>
                  </div>
                </div>

                {(onEditEntry || onDeleteEntry) && (
                  <div className="mb-3 flex items-center justify-end gap-2 border-b border-border pb-3">
                    {onEditEntry && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => onEditEntry(entry)}
                      >
                        Editar
                      </Button>
                    )}
                    {onDeleteEntry && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => onDeleteEntry(entry)}
                      >
                        Excluir
                      </Button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 text-xs text-foreground">
                  <div>
                    <p className="font-semibold text-muted-foreground">Medidas (C x L x P)</p>
                    <p>{entry.measure_length_cm ?? '-'} x {entry.measure_width_cm ?? '-'} x {entry.measure_depth_cm ?? '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Aspecto do leito</p>
                    <p>{entry.bed_aspect.join(', ') || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Bordas</p>
                    <p>{entry.edges.join(', ') || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Exsudato</p>
                    <p>{entry.exudate ?? '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Odor</p>
                    <p>{entry.odor ?? '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Dor (0-10)</p>
                    <p>{entry.pain_scale ?? '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Pele perilesional</p>
                    <p>{entry.perilesional_skin.join(', ') || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Cobertura utilizada</p>
                    <p>{entry.dressing_type ?? '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Uso de ATB e pomada</p>
                    <p>
                      {entry.uses_antibiotic ? `Antibiótico: ${entry.antibiotic_type ?? 'sim'}` : 'Antibiótico: não'}
                      {' | '}
                      {entry.uses_ointment ? `Pomada tópica: ${entry.ointment_type ?? 'sim'}` : 'Pomada tópica: não'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Não conformidade</p>
                    <p>
                      {entry.non_conformity_detected
                        ? `${entry.non_conformity_type || 'Sim'}${entry.non_conformity_description ? ` - ${entry.non_conformity_description}` : ''}`
                        : 'Não'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Ação da não conformidade</p>
                    <p>{entry.non_conformity_action || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Troca seguinte</p>
                    <p>{formatDate(entry.next_change_date)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Observações clínicas</p>
                    <p className="whitespace-pre-wrap">{entry.observations || '-'}</p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <Table wrapperClassName="wound-evolution-table-wrapper overflow-x-auto hidden md:block print:hidden" className="min-w-[1280px] text-xs">
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
                  <span>Exsudato</span>
                  <small>Tipo + odor</small>
                </div>
              </TableHead>
              <TableHead>
                <div className="wound-evolution-head-cell">
                  <span>Dor</span>
                  <small>0-10</small>
                </div>
              </TableHead>
              <TableHead>
                <div className="wound-evolution-head-cell">
                  <span>Cobertura</span>
                  <small>Utilizada</small>
                </div>
              </TableHead>
              <TableHead className="print-hide">Próxima Troca</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead className="print-hide text-right">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                  Sem evolução registrada.
                </TableCell>
              </TableRow>
            ) : (
              sortedEntries.map((entry) => {
                const rowExpanded = Boolean(expandedRows[entry.id]);

                return (
                  <React.Fragment key={entry.id}>
                    <TableRow className="wound-evolution-row-main">
                      <TableCell className="align-top whitespace-nowrap">{formatDateTime(entry.recorded_at)}</TableCell>
                      <TableCell className="align-top print-hide">
                        <div className="flex items-center gap-1">
                          {onEditEntry && (
                            <Button
                              variant="ghost"
                              size="icon"
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
                              size="icon"
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
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-1">
                          <span>{entry.exudate ?? '-'}</span>
                          <span className="text-[10px] text-muted-foreground">Odor: {entry.odor ?? '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">{entry.pain_scale ?? '-'}</TableCell>
                      <TableCell className="align-top">{entry.dressing_type ?? '-'}</TableCell>
                      <TableCell className="align-top whitespace-nowrap print-hide">{formatDate(entry.next_change_date)}</TableCell>
                      <TableCell className="align-top text-xs">{entry.profiles?.full_name || entry.professional_id}</TableCell>
                      <TableCell className="align-top print-hide text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => toggleRowDetails(entry.id)}
                          aria-expanded={rowExpanded}
                          aria-controls={`wound-entry-details-${entry.id}`}
                        >
                          {rowExpanded ? 'Ocultar' : 'Ver detalhes'}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {rowExpanded && (
                      <TableRow id={`wound-entry-details-${entry.id}`} className="print-hide wound-evolution-row-details">
                        <TableCell colSpan={9} className="p-0">
                          <div className="wound-evolution-details-card">
                            <div className="wound-evolution-details-grid">
                              <div>
                                <p className="wound-evolution-details-label">Aspecto do leito</p>
                                <p className="wound-evolution-details-value">{entry.bed_aspect.join(', ') || '-'}</p>
                              </div>
                              <div>
                                <p className="wound-evolution-details-label">Bordas</p>
                                <p className="wound-evolution-details-value">{entry.edges.join(', ') || '-'}</p>
                              </div>
                              <div>
                                <p className="wound-evolution-details-label">Pele perilesional</p>
                                <p className="wound-evolution-details-value">{entry.perilesional_skin.join(', ') || '-'}</p>
                              </div>
                              <div>
                                <p className="wound-evolution-details-label">Próxima troca</p>
                                <p className="wound-evolution-details-value">{formatDate(entry.next_change_date)}</p>
                              </div>
                            </div>

                            <div className="wound-evolution-details-grid mt-3">
                              <div>
                                <p className="wound-evolution-details-label">ATB / Pomada</p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                                    {entry.uses_antibiotic ? `ATB: ${entry.antibiotic_type ?? 'sim'}` : 'ATB: não'}
                                  </span>
                                  <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                                    {entry.uses_ointment ? `Pomada: ${entry.ointment_type ?? 'sim'}` : 'Pomada: não'}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <p className="wound-evolution-details-label">Não conformidade</p>
                                <p className="wound-evolution-details-value">
                                  {entry.non_conformity_detected
                                    ? `${entry.non_conformity_type || 'Sim'}${entry.non_conformity_description ? ` - ${entry.non_conformity_description}` : ''}`
                                    : 'Não'}
                                </p>
                              </div>

                              <div>
                                <p className="wound-evolution-details-label">Ação NC</p>
                                <p className="wound-evolution-details-value">{entry.non_conformity_action || '-'}</p>
                              </div>
                            </div>

                            <div className="mt-3">
                              <p className="wound-evolution-details-label">Observações clínicas</p>
                              <p className="wound-evolution-details-value whitespace-pre-wrap">{entry.observations || '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>

        <Table wrapperClassName="wound-evolution-table-wrapper hidden print:block" className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Data</TableHead>
              <TableHead className="whitespace-nowrap">Medida</TableHead>
              <TableHead>Exsudato / Odor</TableHead>
              <TableHead>Bordas</TableHead>
              <TableHead>Pele</TableHead>
              <TableHead>Dor</TableHead>
              <TableHead>Cobertura</TableHead>
              <TableHead>Profissional</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                  Sem evolução registrada.
                </TableCell>
              </TableRow>
            ) : (
              sortedEntries.map((entry) => (
                <TableRow key={`print-${entry.id}`}>
                  <TableCell className="align-top whitespace-nowrap">{formatDateTime(entry.recorded_at)}</TableCell>
                  <TableCell className="align-top whitespace-nowrap">
                    {entry.measure_length_cm ?? '-'} x {entry.measure_width_cm ?? '-'} x {entry.measure_depth_cm ?? '-'}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="space-y-1 leading-tight">
                      <p><strong>Exsudato:</strong> {entry.exudate ?? '-'}</p>
                      <p><strong>Odor:</strong> {entry.odor ?? '-'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">{entry.edges.join(', ') || '-'}</TableCell>
                  <TableCell className="align-top">{entry.perilesional_skin.join(', ') || '-'}</TableCell>
                  <TableCell className="align-top">{entry.pain_scale ?? '-'}</TableCell>
                  <TableCell className="align-top">{entry.dressing_type ?? '-'}</TableCell>
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
                  <PrintPhotoItem key={photo.id} photo={photo} prefetched={prefetchedByPhotoId[photo.id]} />
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default WoundEvolutionTable;
