import React, { useMemo } from 'react';
import { Badge } from '@/components/ui';
import AnatomicalMiniMap from '@/components/clinical/AnatomicalMiniMap';
import {
  Activity,
  Bandage,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Gauge,
  HeartPulse,
  MapPin,
  Ruler,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Syringe,
  TrendingDown,
  TrendingUp,
  UserRound,
  Wind,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { WoundCase, WoundEntry, WoundPhoto } from '../types';
import { calculateArea, calculateAreaReductionPercent } from '../utils/woundAnalytics';
import { getBodyDiagramHistoryCodes, getSubregionByCode } from '../utils/bodyDiagramMapping';

interface WoundSummaryDashboardProps {
  entries: WoundEntry[];
  photos: WoundPhoto[];
  wound?: Pick<
    WoundCase,
    | 'status'
    | 'started_at'
    | 'closure_date'
    | 'closure_type'
    | 'etiology'
    | 'classification'
    | 'anatomical_region'
    | 'anatomical_subregion'
    | 'anatomical_code'
    | 'comorbidities'
    | 'initial_bed_aspect'
    | 'initial_edges'
  > | null;
  relatedAnatomicalCodes?: string[];
}

type NextChangeStatusTone = 'neutral' | 'danger' | 'warning' | 'success';
type ClinicalTone = 'neutral' | 'danger' | 'warning' | 'success' | 'info';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const NEXT_CHANGE_TONE_CLASS: Record<NextChangeStatusTone, string> = {
  neutral: 'border-border bg-muted/40 text-muted-foreground',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
};

const TONE_CARD_CLASS: Record<ClinicalTone, string> = {
  neutral: 'border-border/60 bg-background/70 text-foreground',
  danger: 'border-destructive/25 bg-destructive/10 text-destructive',
  warning: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  info: 'border-primary/25 bg-primary/10 text-primary',
};

const STATUS_LABEL: Record<string, string> = {
  ativa: 'Ativa',
  acompanhamento: 'Em acompanhamento',
  cicatrizada: 'Cicatrizada',
  encerrada: 'Encerrada',
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

const formatNumber = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  });
};

const formatMeasure = (entry: WoundEntry): string =>
  `${formatNumber(entry.measure_length_cm)} x ${formatNumber(entry.measure_width_cm)} x ${formatNumber(entry.measure_depth_cm)} cm`;

const formatArea = (value: number | null): string => (value == null ? '-' : `${formatNumber(value)} cm²`);

const formatList = (values?: string[] | null): string => {
  if (!values || values.length === 0) return '-';
  return values.join(', ');
};

const normalizeLabel = (value: string): string => value.trim().replace(/\s+/g, ' ');

const getProfessionalName = (entry?: Pick<WoundEntry, 'profiles' | 'professional_id'> | null): string => {
  const profileName = entry?.profiles?.full_name?.trim();
  if (profileName) return profileName;
  return 'Profissional sem nome cadastrado';
};

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

const describeAreaReduction = (value: number | null): { label: string; tone: ClinicalTone; trend: 'down' | 'up' | 'flat' } => {
  if (value == null) return { label: 'Dados insuficientes', tone: 'neutral', trend: 'flat' };
  if (value > 0) return { label: `${value.toFixed(1)}% menor que o início`, tone: 'success', trend: 'down' };
  if (value < 0) return { label: `${Math.abs(value).toFixed(1)}% maior que o início`, tone: 'danger', trend: 'up' };
  return { label: 'Área estável', tone: 'neutral', trend: 'flat' };
};

const describePainDelta = (value: number | null): { label: string; tone: ClinicalTone } => {
  if (value == null) return { label: 'Sem comparação', tone: 'neutral' };
  if (value < 0) return { label: `${Math.abs(value)} ponto(s) a menos`, tone: 'success' };
  if (value > 0) return { label: `${value} ponto(s) a mais`, tone: 'danger' };
  return { label: 'Sem variação', tone: 'neutral' };
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

const getTrackedDays = (firstDateValue?: string | null, latestDateValue?: string | null): number => {
  const firstDate = firstDateValue ? new Date(firstDateValue).getTime() : NaN;
  const latestDate = latestDateValue ? new Date(latestDateValue).getTime() : NaN;
  if (!Number.isFinite(firstDate) || !Number.isFinite(latestDate)) return 1;
  return Math.max(1, Math.ceil((latestDate - firstDate) / DAY_IN_MS) + 1);
};

const WoundSummaryDashboard: React.FC<WoundSummaryDashboardProps> = ({
  entries,
  photos,
  wound,
  relatedAnatomicalCodes = [],
}) => {
  const summary = useMemo(() => {
    const anatomicalMatch = wound?.anatomical_code ? getSubregionByCode(wound.anatomical_code) : null;
    const anatomicalLabel = anatomicalMatch
      ? `${anatomicalMatch.region.label} • ${anatomicalMatch.subregion.label}`
      : wound?.anatomical_code || 'Localização não definida';
    const otherLocations = getBodyDiagramHistoryCodes(
      relatedAnatomicalCodes.filter((code) => code && code !== wound?.anatomical_code),
    ).slice(0, 4);

    if (entries.length === 0) {
      return {
        hasEntries: false as const,
        anatomicalLabel,
        otherLocations,
        woundStatus: wound?.status || null,
      };
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

    const photoEntryIds = new Set(
      photos
        .map((photo) => photo.entry_id)
        .filter((entryId): entryId is string => Boolean(entryId)),
    );
    const entriesWithPhoto = chronological.filter((entry) => photoEntryIds.has(entry.id)).length;

    const exudateTop = buildDistribution(chronological.map((entry) => entry.exudate)).slice(0, 2);
    const odorTop = buildDistribution(chronological.map((entry) => entry.odor)).slice(0, 2);
    const dressingTop = buildDistribution(chronological.map((entry) => entry.dressing_type)).slice(0, 2);
    const professionalTop = buildDistribution(chronological.map((entry) => getProfessionalName(entry))).slice(0, 2);

    const nonConformityCount = chronological.filter((entry) => entry.non_conformity_detected).length;
    const highPainCount = chronological.filter((entry) => (entry.pain_scale ?? 0) >= 7).length;
    const antibioticCount = chronological.filter((entry) => entry.uses_antibiotic).length;
    const ointmentCount = chronological.filter((entry) => entry.uses_ointment).length;

    return {
      hasEntries: true as const,
      recentEntries: recent.slice(0, 3),
      first,
      latest,
      firstArea,
      latestArea,
      areaReduction,
      painDelta,
      averagePain,
      trackedDays: getTrackedDays(first.recorded_at, latest.recorded_at),
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
      anatomicalLabel,
      otherLocations,
      woundStatus: wound?.status || null,
      woundStartDate: wound?.started_at || null,
      woundClosureDate: wound?.closure_date || null,
    };
  }, [entries, photos, wound, relatedAnatomicalCodes]);

  if (!summary.hasEntries) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden rounded-2xl border border-border/60 bg-background/60 shadow-sm backdrop-blur"
      >
        <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
          <div className="p-5 sm:p-6">
            <Badge variant="secondary" className="mb-4 w-fit text-[10px] font-black uppercase tracking-widest">
              {summary.woundStatus ? STATUS_LABEL[summary.woundStatus] || summary.woundStatus : 'Caso selecionado'}
            </Badge>
            <h4 className="text-xl font-black tracking-tight text-foreground">Resumo clínico aguardando evolução</h4>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              O caso já possui localização cadastrada. A síntese clínica será preenchida assim que a primeira evolução for registrada.
            </p>
            <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Activity className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">Próximo passo clínico</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Registrar medidas, dor, cobertura aplicada e evidência fotográfica para formar o painel de acompanhamento.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="border-t border-border/60 bg-muted/20 p-5 lg:border-l lg:border-t-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Localização registrada
            </div>
            <div className="mt-4 flex justify-center">
              {wound?.anatomical_code ? (
                <AnatomicalMiniMap code={wound.anatomical_code} size={150} className="rounded-2xl bg-background/40 shadow-none" />
              ) : (
                <div className="flex h-56 w-40 items-center justify-center rounded-2xl border border-dashed border-border bg-background/50 text-center text-xs text-muted-foreground">
                  Sem mapa cadastrado
                </div>
              )}
            </div>
            <p className="mt-4 text-center text-sm font-black text-foreground">{summary.anatomicalLabel}</p>
          </aside>
        </div>
      </motion.section>
    );
  }

  const latestNextChange = getNextChangeStatus(summary.latest.next_change_date);
  const areaSummary = describeAreaReduction(summary.areaReduction);
  const painSummary = describePainDelta(summary.painDelta);
  const latestProfessional = getProfessionalName(summary.latest);
  const statusLabel = summary.woundStatus ? STATUS_LABEL[summary.woundStatus] || summary.woundStatus : 'Sem status';

  const alertItems = [
    latestNextChange.tone === 'danger'
      ? {
          title: 'Troca atrasada',
          detail: `${latestNextChange.label} - data prevista ${latestNextChange.fullDate}`,
          tone: 'danger' as ClinicalTone,
          icon: CalendarClock,
        }
      : null,
    latestNextChange.tone === 'warning'
      ? {
          title: 'Troca próxima',
          detail: `${latestNextChange.label} - data prevista ${latestNextChange.fullDate}`,
          tone: 'warning' as ClinicalTone,
          icon: CalendarClock,
        }
      : null,
    summary.areaReduction != null && summary.areaReduction < 0
      ? {
          title: 'Área em aumento',
          detail: areaSummary.label,
          tone: 'danger' as ClinicalTone,
          icon: TrendingUp,
        }
      : null,
    (summary.latest.pain_scale ?? 0) >= 7
      ? {
          title: 'Dor elevada',
          detail: `Dor ${summary.latest.pain_scale}/10 no último registro`,
          tone: 'warning' as ClinicalTone,
          icon: HeartPulse,
        }
      : null,
    summary.latest.non_conformity_detected
      ? {
          title: 'Não conformidade recente',
          detail: summary.latest.non_conformity_type || 'Registro marcado com não conformidade',
          tone: 'danger' as ClinicalTone,
          icon: ShieldAlert,
        }
      : null,
    summary.latest.exudate === 'purulento' || summary.latest.odor === 'fetido'
      ? {
          title: 'Sinal de atenção',
          detail: `${summary.latest.exudate || 'Exsudato não informado'} / ${summary.latest.odor || 'odor não informado'}`,
          tone: 'warning' as ClinicalTone,
          icon: Droplets,
        }
      : null,
  ].filter((item): item is { title: string; detail: string; tone: ClinicalTone; icon: React.ElementType } => Boolean(item));

  const highlightCards = [
    {
      title: 'Próxima troca',
      value: latestNextChange.label,
      detail: latestNextChange.fullDate,
      icon: CalendarClock,
      tone: latestNextChange.tone === 'danger' ? 'danger' : latestNextChange.tone === 'warning' ? 'warning' : 'success',
    },
    {
      title: 'Área atual',
      value: formatArea(summary.latestArea),
      detail: areaSummary.label,
      icon: areaSummary.trend === 'up' ? TrendingUp : TrendingDown,
      tone: areaSummary.tone,
    },
    {
      title: 'Dor atual',
      value: summary.latest.pain_scale == null ? '-' : `${summary.latest.pain_scale}/10`,
      detail: painSummary.label,
      icon: Gauge,
      tone: painSummary.tone,
    },
    {
      title: 'Evidências',
      value: `${summary.entriesWithPhoto}/${entries.length}`,
      detail: `${photos.length} foto(s) no caso`,
      icon: Camera,
      tone: summary.entriesWithPhoto === entries.length ? 'success' : 'info',
    },
  ] satisfies Array<{
    title: string;
    value: string;
    detail: string;
    icon: React.ElementType;
    tone: ClinicalTone;
  }>;

  const keyPoints = [
    {
      label: 'Última evolução',
      value: `${formatDateTime(summary.latest.recorded_at)} por ${latestProfessional}`,
      icon: UserRound,
    },
    {
      label: 'Medidas atuais',
      value: `${formatMeasure(summary.latest)} - área ${formatArea(summary.latestArea)}`,
      icon: Ruler,
    },
    {
      label: 'Leito e bordas',
      value: `${formatList(summary.latest.bed_aspect)} / ${formatList(summary.latest.edges)}`,
      icon: ClipboardCheck,
    },
    {
      label: 'Exsudato e odor',
      value: `${summary.latest.exudate || '-'} / ${summary.latest.odor || '-'}`,
      icon: Droplets,
    },
    {
      label: 'Pele perilesional',
      value: formatList(summary.latest.perilesional_skin),
      icon: Sparkles,
    },
    {
      label: 'Cobertura atual',
      value: summary.latest.dressing_type || '-',
      icon: Bandage,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/60 shadow-sm backdrop-blur">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest">
                {statusLabel}
              </Badge>
              <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {entries.length} evolução(ões)
              </span>
              <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {summary.trackedDays} dia(s)
              </span>
            </div>

            <div className="mt-5 max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Resumo do curativo</p>
              <h4 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {summary.anatomicalLabel}
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {wound?.etiology || 'Etiologia não informada'}
                {wound?.classification ? `, ${wound.classification}` : ''}. Acompanhamento de {summary.dateRangeLabel}.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {highlightCards.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.article
                    key={item.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                    className={cn('rounded-xl border p-3 shadow-sm', TONE_CARD_CLASS[item.tone])}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-75">{item.title}</span>
                      <Icon className="h-4 w-4 shrink-0" />
                    </div>
                    <p className="mt-3 text-xl font-black tracking-tight">{item.value}</p>
                    <p className="mt-1 min-h-4 text-[11px] font-semibold opacity-80">{item.detail}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>

          <aside className="border-t border-border/60 bg-muted/20 p-5 xl:border-l xl:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Localização registrada
              </div>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                {summary.woundStatus ? STATUS_LABEL[summary.woundStatus] || summary.woundStatus : 'Caso'}
              </Badge>
            </div>

            <div className="mt-5 flex justify-center">
              {wound?.anatomical_code ? (
                <AnatomicalMiniMap code={wound.anatomical_code} size={172} className="rounded-2xl bg-background/40 shadow-none" />
              ) : (
                <div className="flex h-64 w-44 items-center justify-center rounded-2xl border border-dashed border-border bg-background/50 text-center text-xs text-muted-foreground">
                  Sem mapa cadastrado
                </div>
              )}
            </div>

            <div className="mt-5 rounded-xl border border-border/50 bg-background/70 p-3 text-center">
              <p className="text-sm font-black text-foreground">{summary.anatomicalLabel}</p>
              <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                Início: {formatDate(summary.woundStartDate)}
                {summary.woundClosureDate ? ` - fechamento: ${formatDate(summary.woundClosureDate)}` : ''}
              </p>
            </div>

            {summary.otherLocations.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Outras lesões do paciente</p>
                <div className="flex flex-wrap gap-1.5">
                  {summary.otherLocations.map((item) => (
                    <span
                      key={item.code}
                      className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-[10px] font-bold text-muted-foreground"
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <article className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Pontos importantes</p>
              <h5 className="mt-1 text-lg font-black tracking-tight text-foreground">Estado atual da lesão</h5>
            </div>
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {keyPoints.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-border/50 bg-background/70 p-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-snug text-foreground">{item.value}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-background/70 p-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Syringe className="h-3.5 w-3.5" />
                Terapêutica
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', summary.latest.uses_antibiotic ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground')}>
                  ATB {summary.latest.uses_antibiotic ? summary.latest.antibiotic_type || 'sim' : 'não'}
                </span>
                <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', summary.latest.uses_ointment ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground')}>
                  Pomada {summary.latest.uses_ointment ? summary.latest.ointment_type || 'sim' : 'não'}
                </span>
              </div>
              {summary.latest.dressing_notes && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{summary.latest.dressing_notes}</p>
              )}
            </div>

            <div className="rounded-xl border border-border/50 bg-background/70 p-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Wind className="h-3.5 w-3.5" />
                Padrão do histórico
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="font-black text-foreground">{summary.exudateTop[0]?.label || '-'}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">Exsudato comum</p>
                </div>
                <div>
                  <p className="font-black text-foreground">{summary.odorTop[0]?.label || '-'}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">Odor comum</p>
                </div>
                <div>
                  <p className="font-black text-foreground">{summary.dressingTop[0]?.label || '-'}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">Cobertura comum</p>
                </div>
                <div>
                  <p className="font-black text-foreground">{summary.professionalTop[0]?.label || '-'}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">Profissional</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside className="space-y-5">
          <article className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm backdrop-blur sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Alertas clínicos</p>
                <h5 className="mt-1 text-lg font-black tracking-tight text-foreground">Sinais para revisão</h5>
              </div>
              <ShieldAlert className="h-5 w-5 text-primary" />
            </div>

            <div className="mt-4 space-y-2">
              {alertItems.length > 0 ? (
                alertItems.slice(0, 4).map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={`${item.title}-${item.detail}`} className={cn('rounded-xl border p-3', TONE_CARD_CLASS[item.tone])}>
                      <div className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <p className="text-sm font-black">{item.title}</p>
                          <p className="mt-1 text-xs font-semibold opacity-80">{item.detail}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-400">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm font-black">Sem alertas críticos</p>
                      <p className="mt-1 text-xs font-semibold opacity-80">Os últimos registros não indicam dor alta, atraso, odor fétido ou não conformidade ativa.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm backdrop-blur sm:p-5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                <p className="text-lg font-black text-foreground">{summary.nonConformityCount}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">NC</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                <p className="text-lg font-black text-foreground">{summary.highPainCount}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dor alta</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                <p className="text-lg font-black text-foreground">{summary.antibioticCount + summary.ointmentCount}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Terapias</p>
              </div>
            </div>
          </article>
        </aside>
      </div>

      <article className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Histórico recente</p>
            <h5 className="mt-1 text-lg font-black tracking-tight text-foreground">Últimas evoluções resumidas</h5>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
            Média de dor: {summary.averagePain == null ? '-' : summary.averagePain}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {summary.recentEntries.map((entry, index) => {
            const nextChange = getNextChangeStatus(entry.next_change_date);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="rounded-xl border border-border/50 bg-background/70 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-foreground">{formatDateTime(entry.recorded_at)}</p>
                    <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{getProfessionalName(entry)}</p>
                  </div>
                  <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide', NEXT_CHANGE_TONE_CLASS[nextChange.tone])}>
                    {nextChange.label}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <p>
                    <span className="font-bold text-foreground">Medida:</span> {formatMeasure(entry)}
                  </p>
                  <p>
                    <span className="font-bold text-foreground">Dor:</span> {entry.pain_scale ?? '-'} / <span className="font-bold text-foreground">Cobertura:</span> {entry.dressing_type || '-'}
                  </p>
                  <p>
                    <span className="font-bold text-foreground">Exsudato/Odor:</span> {entry.exudate || '-'} / {entry.odor || '-'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </article>
    </motion.section>
  );
};

export default WoundSummaryDashboard;
