import React, { useMemo } from 'react';
import { Badge } from '@/components/ui';
import {
  Activity,
  AlertTriangle,
  Bandage,
  CalendarClock,
  Camera,
  Droplets,
  Gauge,
  Pill,
  Syringe,
  UserRound,
  Wind,
} from 'lucide-react';
import type { WoundCase, WoundEntry, WoundPhoto } from '../types';
import { calculateArea, calculateAreaReductionPercent } from '../utils/woundAnalytics';

interface WoundSummaryDashboardProps {
  entries: WoundEntry[];
  photos: WoundPhoto[];
  wound?: Pick<WoundCase, 'status' | 'started_at' | 'closure_date'> | null;
}

type NextChangeStatusTone = 'neutral' | 'danger' | 'warning' | 'success';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const NEXT_CHANGE_TONE_CLASS: Record<NextChangeStatusTone, string> = {
  neutral: 'border-border bg-muted/30 text-muted-foreground',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
};

const formatDate = (value?: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMeasure = (entry: WoundEntry): string =>
  `${entry.measure_length_cm ?? '-'} x ${entry.measure_width_cm ?? '-'} x ${entry.measure_depth_cm ?? '-'}`;

const formatArea = (value: number | null): string => (value == null ? '-' : `${value.toFixed(2)} cm²`);

const normalizeLabel = (value: string): string => value.trim().replace(/\s+/g, ' ');

const buildDistribution = (values: Array<string | null | undefined>): Array<{ label: string; count: number }> => {
  const counters = new Map<string, number>();

  values.forEach((value) => {
    if (!value) return;
    const normalized = normalizeLabel(value);
    if (!normalized) return;
    counters.set(normalized, (counters.get(normalized) || 0) + 1);
  });

  return Array.from(counters.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

const describeAreaReduction = (value: number | null): { label: string; tone: string } => {
  if (value == null) return { label: 'Dados insuficientes', tone: 'text-muted-foreground' };
  if (value > 0) return { label: `${value.toFixed(1)}% de redução`, tone: 'text-emerald-600' };
  if (value < 0) return { label: `${Math.abs(value).toFixed(1)}% de aumento`, tone: 'text-destructive' };
  return { label: 'Área estável', tone: 'text-muted-foreground' };
};

const describePainDelta = (value: number | null): { label: string; tone: string } => {
  if (value == null) return { label: 'Sem comparação', tone: 'text-muted-foreground' };
  if (value < 0) return { label: `${Math.abs(value)} ponto(s) a menos`, tone: 'text-emerald-600' };
  if (value > 0) return { label: `${value} ponto(s) a mais`, tone: 'text-destructive' };
  return { label: 'Sem variação', tone: 'text-muted-foreground' };
};

const getNextChangeStatus = (nextChangeDate?: string | null): {
  label: string;
  tone: NextChangeStatusTone;
  fullDate: string;
} => {
  if (!nextChangeDate) {
    return {
      label: 'Não definida',
      tone: 'neutral',
      fullDate: '-',
    };
  }

  const target = new Date(nextChangeDate);
  if (Number.isNaN(target.getTime())) {
    return {
      label: 'Data inválida',
      tone: 'danger',
      fullDate: '-',
    };
  }

  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / DAY_IN_MS);

  if (diffDays < 0) {
    return {
      label: `Atrasada ${Math.abs(diffDays)}d`,
      tone: 'danger',
      fullDate: formatDate(nextChangeDate),
    };
  }

  if (diffDays === 0) {
    return {
      label: 'Vence hoje',
      tone: 'warning',
      fullDate: formatDate(nextChangeDate),
    };
  }

  if (diffDays <= 2) {
    return {
      label: `Em ${diffDays}d`,
      tone: 'warning',
      fullDate: formatDate(nextChangeDate),
    };
  }

  return {
    label: `Em ${diffDays}d`,
    tone: 'success',
    fullDate: formatDate(nextChangeDate),
  };
};

const WoundSummaryDashboard: React.FC<WoundSummaryDashboardProps> = ({
  entries,
  photos,
  wound,
}) => {
  const summary = useMemo(() => {
    if (entries.length === 0) {
      return null;
    }

    const chronological = [...entries].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );
    const recent = [...chronological].reverse();
    const first = chronological[0];
    const latest = recent[0];

    const firstArea = calculateArea(first.measure_length_cm, first.measure_width_cm);
    const latestArea = calculateArea(latest.measure_length_cm, latest.measure_width_cm);
    const areaReduction = calculateAreaReductionPercent(chronological);

    const firstPain = first.pain_scale;
    const latestPain = latest.pain_scale;
    const painDelta = firstPain != null && latestPain != null ? latestPain - firstPain : null;

    const painValues = chronological
      .map((item) => item.pain_scale)
      .filter((value): value is number => typeof value === 'number');
    const averagePain = painValues.length > 0
      ? Number((painValues.reduce((acc, value) => acc + value, 0) / painValues.length).toFixed(1))
      : null;

    const firstDate = new Date(first.recorded_at).getTime();
    const latestDate = new Date(latest.recorded_at).getTime();
    const trackedDays = Number.isFinite(firstDate) && Number.isFinite(latestDate)
      ? Math.max(1, Math.ceil((latestDate - firstDate) / DAY_IN_MS) + 1)
      : 1;

    const photoEntryIds = new Set(
      photos
        .map((photo) => photo.entry_id)
        .filter((entryId): entryId is string => Boolean(entryId)),
    );
    const entriesWithPhoto = chronological.filter((entry) => photoEntryIds.has(entry.id)).length;

    const exudateTop = buildDistribution(chronological.map((entry) => entry.exudate)).slice(0, 3);
    const odorTop = buildDistribution(chronological.map((entry) => entry.odor)).slice(0, 3);
    const dressingTop = buildDistribution(chronological.map((entry) => entry.dressing_type)).slice(0, 3);
    const professionalTop = buildDistribution(
      chronological.map((entry) => entry.profiles?.full_name || entry.professional_id.slice(0, 8)),
    ).slice(0, 3);

    const nonConformityCount = chronological.filter((entry) => entry.non_conformity_detected).length;
    const highPainCount = chronological.filter((entry) => (entry.pain_scale ?? 0) >= 7).length;
    const antibioticCount = chronological.filter((entry) => entry.uses_antibiotic).length;
    const ointmentCount = chronological.filter((entry) => entry.uses_ointment).length;

    return {
      recentEntries: recent.slice(0, 3),
      first,
      latest,
      firstArea,
      latestArea,
      areaReduction,
      painDelta,
      averagePain,
      trackedDays,
      entriesWithPhoto,
      exudateTop,
      odorTop,
      dressingTop,
      professionalTop,
      nonConformityCount,
      highPainCount,
      antibioticCount,
      ointmentCount,
      dateRangeLabel: `${formatDate(first.recorded_at)} a ${formatDate(latest.recorded_at)}`,
      woundStatus: wound?.status || null,
      woundStartDate: wound?.started_at || null,
      woundClosureDate: wound?.closure_date || null,
    };
  }, [entries, photos, wound]);

  if (!summary) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card/30 p-6 text-center">
        <Activity className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
        <h4 className="text-sm font-semibold text-foreground">Resumo clínico indisponível</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Cadastre ao menos uma evolução para gerar indicadores da tabela.
        </p>
      </section>
    );
  }

  const latestNextChange = getNextChangeStatus(summary.latest.next_change_date);
  const areaSummary = describeAreaReduction(summary.areaReduction);
  const painSummary = describePainDelta(summary.painDelta);

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Resumo Clínico Consolidado</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Síntese automática dos principais campos exibidos na tabela de evolução.
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">
          {entries.length} registros
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            Período de evolução
          </div>
          <p className="mt-2 text-lg font-black text-foreground">{summary.trackedDays} dias</p>
          <p className="text-[11px] text-muted-foreground">{summary.dateRangeLabel}</p>
        </article>

        <article className="rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Camera className="h-3.5 w-3.5" />
            Evidência fotográfica
          </div>
          <p className="mt-2 text-lg font-black text-foreground">{summary.entriesWithPhoto}/{entries.length}</p>
          <p className="text-[11px] text-muted-foreground">evoluções com foto</p>
        </article>

        <article className="rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Droplets className="h-3.5 w-3.5" />
            Área da lesão
          </div>
          <p className="mt-2 text-sm font-black text-foreground">
            {formatArea(summary.firstArea)} {'->'} {formatArea(summary.latestArea)}
          </p>
          <p className={`text-[11px] font-semibold ${areaSummary.tone}`}>{areaSummary.label}</p>
        </article>

        <article className="rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" />
            Dor (0-10)
          </div>
          <p className="mt-2 text-lg font-black text-foreground">
            {summary.averagePain == null ? '-' : summary.averagePain}
          </p>
          <p className={`text-[11px] font-semibold ${painSummary.tone}`}>{painSummary.label}</p>
        </article>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-xl border border-border/60 bg-background/70 p-3">
          <h5 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Estado Atual (Último Registro)</h5>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-foreground sm:grid-cols-2">
            <div className="rounded-lg border border-border/50 bg-background/60 p-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Data/Hora</p>
              <p className="font-semibold">{formatDateTime(summary.latest.recorded_at)}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/60 p-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Medida (C x L x P)</p>
              <p className="font-semibold">{formatMeasure(summary.latest)}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/60 p-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Exsudato / Odor</p>
              <p className="font-semibold">{summary.latest.exudate ?? '-'} / {summary.latest.odor ?? '-'}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/60 p-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Cobertura</p>
              <p className="font-semibold">{summary.latest.dressing_type ?? '-'}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/60 p-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Próxima troca</p>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${NEXT_CHANGE_TONE_CLASS[latestNextChange.tone]}`}>
                  {latestNextChange.label}
                </span>
                <span className="text-[11px] text-muted-foreground">{latestNextChange.fullDate}</span>
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/60 p-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Profissional</p>
              <p className="font-semibold">{summary.latest.profiles?.full_name || summary.latest.professional_id.slice(0, 8)}</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-border/60 bg-background/70 p-3">
          <h5 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Padrões do Histórico</h5>

          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Droplets className="h-3 w-3" />
                  Exsudato mais comum
                </div>
                <p className="text-xs font-semibold text-foreground">{summary.exudateTop[0]?.label || '-'}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Wind className="h-3 w-3" />
                  Odor mais comum
                </div>
                <p className="text-xs font-semibold text-foreground">{summary.odorTop[0]?.label || '-'}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Bandage className="h-3 w-3" />
                  Cobertura predominante
                </div>
                <p className="text-xs font-semibold text-foreground">{summary.dressingTop[0]?.label || '-'}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <UserRound className="h-3 w-3" />
                  Profissional mais atuante
                </div>
                <p className="text-xs font-semibold text-foreground">{summary.professionalTop[0]?.label || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border/50 bg-background/60 p-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">ATB</p>
                <p className="text-sm font-black text-foreground">{summary.antibioticCount}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/60 p-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Pomada</p>
                <p className="text-sm font-black text-foreground">{summary.ointmentCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Não conformidades
                </div>
                <p className="mt-1 text-sm font-black text-destructive">{summary.nonConformityCount}</p>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                  <Pill className="h-3 w-3" />
                  Dor {'>='} 7
                </div>
                <p className="mt-1 text-sm font-black text-amber-600">{summary.highPainCount}</p>
              </div>
            </div>

            {(summary.woundStatus || summary.woundStartDate || summary.woundClosureDate) && (
              <div className="rounded-lg border border-border/50 bg-background/60 p-2 text-xs text-foreground">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Syringe className="h-3 w-3" />
                  Status do caso
                </div>
                <p className="mt-1 font-semibold">
                  {summary.woundStatus || '-'}
                  {summary.woundStartDate ? ` | início: ${formatDate(summary.woundStartDate)}` : ''}
                  {summary.woundClosureDate ? ` | fechamento: ${formatDate(summary.woundClosureDate)}` : ''}
                </p>
              </div>
            )}
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-border/60 bg-background/70 p-3">
        <h5 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Últimos Registros da Tabela</h5>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[920px] w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/60 text-left text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2">Data</th>
                <th className="px-2 py-2">Medida</th>
                <th className="px-2 py-2">Exsudato/Odor</th>
                <th className="px-2 py-2">Dor</th>
                <th className="px-2 py-2">Cobertura</th>
                <th className="px-2 py-2">Próx. troca</th>
                <th className="px-2 py-2">Profissional</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentEntries.map((entry) => {
                const nextChange = getNextChangeStatus(entry.next_change_date);
                return (
                  <tr key={entry.id} className="border-b border-border/30 align-top text-foreground">
                    <td className="px-2 py-2 whitespace-nowrap">{formatDateTime(entry.recorded_at)}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{formatMeasure(entry)}</td>
                    <td className="px-2 py-2">
                      {(entry.exudate ?? '-')}/{entry.odor ?? '-'}
                    </td>
                    <td className="px-2 py-2">{entry.pain_scale ?? '-'}</td>
                    <td className="px-2 py-2">{entry.dressing_type ?? '-'}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${NEXT_CHANGE_TONE_CLASS[nextChange.tone]}`}>
                          {nextChange.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{nextChange.fullDate}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">{entry.profiles?.full_name || entry.professional_id.slice(0, 8)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};

export default WoundSummaryDashboard;
