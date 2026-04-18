import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  UserCheck,
  Users,
  XCircle
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { toast } from 'sonner';
import type { CapacityAnalyticsFilters, CapacityStatusFilter } from '@/types';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
import AppointmentsNav from '../components/AppointmentsNav';
import { addDays, getCapacityAnalyticsForDateRange, getWeekStart } from '../services/appointmentService';
import {
  APPOINTMENTS_CHART_COLORS,
  APPOINTMENTS_CHART_LEGEND_WRAPPER_STYLE,
  APPOINTMENTS_CHART_TOOLTIP_CONTENT_STYLE,
  APPOINTMENTS_CHART_TOOLTIP_ITEM_STYLE,
  APPOINTMENTS_CHART_TOOLTIP_LABEL_STYLE
} from '../constants/chartTheme';

const RANGE_DAYS = 28;

const statusOptions: { value: CapacityStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'Agendado', label: 'Agendado' },
  { value: 'Compareceu', label: 'Compareceu' },
  { value: 'Faltou', label: 'Faltou' },
  { value: 'Remarcado', label: 'Remarcado' },
];

const formatRangeLabel = (start: Date, end: Date) => {
  const first = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  const last = end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
  return `${first} a ${last}`;
};

const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseInputDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDelta = (value: number) => {
  if (value > 0) {
    return `+${value}%`;
  }

  return `${value}%`;
};

const CapacityDashboardPage: React.FC = () => {
  const [rangeStart, setRangeStart] = useState(() => getWeekStart(new Date()));
  const [rangeEnd, setRangeEnd] = useState(() => addDays(getWeekStart(new Date()), RANGE_DAYS - 1));
  const [filters, setFilters] = useState<CapacityAnalyticsFilters>({
    acsName: 'ALL',
    status: 'ALL',
  });
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof getCapacityAnalyticsForDateRange>> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isInvalidRange = rangeStart > rangeEnd;

  const loadCapacity = useCallback(async () => {
    if (isInvalidRange) {
      return;
    }

    setIsLoading(true);

    try {
      const data = await getCapacityAnalyticsForDateRange(rangeStart, rangeEnd, filters);
      setAnalytics(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard de capacidade:', error);
      toast.error('Erro ao carregar dashboard de capacidade.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, isInvalidRange, rangeEnd, rangeStart]);

  useEffect(() => {
    void loadCapacity();
  }, [loadCapacity]);

  const goBack = () => {
    setRangeStart(prev => addDays(prev, -RANGE_DAYS));
    setRangeEnd(prev => addDays(prev, -RANGE_DAYS));
  };

  const goForward = () => {
    setRangeStart(prev => addDays(prev, RANGE_DAYS));
    setRangeEnd(prev => addDays(prev, RANGE_DAYS));
  };

  const goCurrent = () => {
    const start = getWeekStart(new Date());
    setRangeStart(start);
    setRangeEnd(addDays(start, RANGE_DAYS - 1));
  };

  const occupancyDeltaClass = useMemo(() => {
    if (!analytics) return 'text-muted-foreground';
    return analytics.deltas.occupancyRate >= 0 ? 'text-primary' : 'text-red-300';
  }, [analytics]);

  const showRateDeltaClass = useMemo(() => {
    if (!analytics) return 'text-muted-foreground';
    return analytics.deltas.showRate >= 0 ? 'text-primary' : 'text-red-300';
  }, [analytics]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <AppointmentsNav />

      <section className="rounded-2xl bg-card border border-border p-4 sm:p-6 space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Dashboard de capacidade analítica</p>
            <h2 className="text-2xl font-bold text-card-foreground">{formatRangeLabel(rangeStart, rangeEnd)}</h2>
            <p className="text-sm text-muted-foreground">Comparação automática com o período imediatamente anterior</p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={goBack} className="w-auto">
              <ChevronLeft className="h-4 w-4" />
              28 dias
            </Button>
            <Button type="button" size="sm" onClick={goCurrent} className="w-auto">
              Atual
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={goForward} className="w-auto">
              28 dias
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0">
            <Input
              type="date"
              value={formatInputDate(rangeStart)}
              onChange={event => setRangeStart(parseInputDate(event.target.value))}
              className="h-11 min-w-0"
              icon={<CalendarDays className="h-4 w-4" />}
              aria-label="Data inicial"
            />
          </div>

          <div className="min-w-0">
            <Input
              type="date"
              value={formatInputDate(rangeEnd)}
              onChange={event => setRangeEnd(parseInputDate(event.target.value))}
              className="h-11 min-w-0"
              icon={<CalendarDays className="h-4 w-4" />}
              aria-label="Data final"
            />
          </div>

          <div className="relative min-w-0">
            <Users className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
            <Select
              value={filters.acsName}
              onValueChange={value => setFilters(prev => ({ ...prev, acsName: value as CapacityAnalyticsFilters['acsName'] }))}
            >
              <SelectTrigger className="h-11 pl-12 min-w-0">
                <SelectValue placeholder="Filtrar ACS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os ACS</SelectItem>
                {(analytics?.uniqueAcs || []).map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative min-w-0">
            <Activity className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
            <Select
              value={filters.status}
              onValueChange={value => setFilters(prev => ({ ...prev, status: value as CapacityStatusFilter }))}
            >
              <SelectTrigger className="h-11 pl-12 min-w-0">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isInvalidRange && (
          <p className="text-sm text-red-300">A data final deve ser igual ou posterior à data inicial.</p>
        )}
      </section>

      {isLoading ? (
        <div className="rounded-2xl bg-card border border-border p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando capacidade analítica...</p>
        </div>
      ) : analytics ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={<BarChart3 className="h-5 w-5 text-primary" />}
              label="Taxa de ocupação"
              value={`${analytics.current.occupancyRate}%`}
              helper={`${analytics.current.occupiedSlots + analytics.current.blockedSlots} de ${analytics.current.totalSlots} fichas`}
              delta={formatDelta(analytics.deltas.occupancyRate)}
              deltaClass={occupancyDeltaClass}
            />
            <KpiCard
              icon={<UserCheck className="h-5 w-5 text-primary" />}
              label="Taxa de comparecimento"
              value={`${analytics.current.showRate}%`}
              helper={`${analytics.current.showCount} compareceu / ${analytics.current.noShowCount} faltou`}
              delta={formatDelta(analytics.deltas.showRate)}
              deltaClass={showRateDeltaClass}
            />
            <KpiCard
              icon={<XCircle className="h-5 w-5 text-red-300" />}
              label="Faltas"
              value={analytics.current.noShowCount}
              helper="No período filtrado"
              delta={formatDelta(analytics.deltas.noShowCount)}
              deltaClass={analytics.deltas.noShowCount <= 0 ? 'text-primary' : 'text-red-300'}
            />
            <KpiCard
              icon={<RefreshCw className="h-5 w-5 text-amber-300" />}
              label="Remarcações"
              value={analytics.current.rescheduledCount}
              helper="No período filtrado"
              delta={formatDelta(analytics.deltas.rescheduledCount)}
              deltaClass={analytics.deltas.rescheduledCount <= 0 ? 'text-primary' : 'text-red-300'}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Evolução diária (ocupação x comparecimento)">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={analytics.trend}>
                  <CartesianGrid stroke={APPOINTMENTS_CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke={APPOINTMENTS_CHART_COLORS.axis} />
                  <YAxis stroke={APPOINTMENTS_CHART_COLORS.axis} domain={[0, 100]} />
                  <Tooltip contentStyle={APPOINTMENTS_CHART_TOOLTIP_CONTENT_STYLE} labelStyle={APPOINTMENTS_CHART_TOOLTIP_LABEL_STYLE} itemStyle={APPOINTMENTS_CHART_TOOLTIP_ITEM_STYLE} />
                  <Legend wrapperStyle={APPOINTMENTS_CHART_LEGEND_WRAPPER_STYLE} />
                  <Line type="monotone" dataKey="occupancyRate" name="Ocupação (%)" stroke={APPOINTMENTS_CHART_COLORS.primary} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="showRate" name="Comparecimento (%)" stroke={APPOINTMENTS_CHART_COLORS.info} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Distribuição por status">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.statusDistribution}>
                  <CartesianGrid stroke={APPOINTMENTS_CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="status" stroke={APPOINTMENTS_CHART_COLORS.axis} />
                  <YAxis stroke={APPOINTMENTS_CHART_COLORS.axis} />
                  <Tooltip contentStyle={APPOINTMENTS_CHART_TOOLTIP_CONTENT_STYLE} labelStyle={APPOINTMENTS_CHART_TOOLTIP_LABEL_STYLE} itemStyle={APPOINTMENTS_CHART_TOOLTIP_ITEM_STYLE} />
                  <Legend wrapperStyle={APPOINTMENTS_CHART_LEGEND_WRAPPER_STYLE} />
                  <Bar dataKey="count" name="Quantidade" fill={APPOINTMENTS_CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="grid items-start gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-6">
              <ChartCard title="Distribuição por turno">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.turnDistribution}>
                    <CartesianGrid stroke={APPOINTMENTS_CHART_COLORS.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="period" stroke={APPOINTMENTS_CHART_COLORS.axis} />
                    <YAxis stroke={APPOINTMENTS_CHART_COLORS.axis} />
                    <Tooltip contentStyle={APPOINTMENTS_CHART_TOOLTIP_CONTENT_STYLE} labelStyle={APPOINTMENTS_CHART_TOOLTIP_LABEL_STYLE} itemStyle={APPOINTMENTS_CHART_TOOLTIP_ITEM_STYLE} />
                    <Legend wrapperStyle={APPOINTMENTS_CHART_LEGEND_WRAPPER_STYLE} />
                    <Bar dataKey="occupied" name="Ocupadas" fill={APPOINTMENTS_CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="showCount" name="Compareceu" fill={APPOINTMENTS_CHART_COLORS.info} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="noShowCount" name="Faltou" fill={APPOINTMENTS_CHART_COLORS.danger} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="rescheduledCount" name="Remarcado" fill={APPOINTMENTS_CHART_COLORS.warning} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Movimentações por dia (faltou x remarcado)">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={analytics.trend}>
                    <CartesianGrid stroke={APPOINTMENTS_CHART_COLORS.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke={APPOINTMENTS_CHART_COLORS.axis} />
                    <YAxis stroke={APPOINTMENTS_CHART_COLORS.axis} />
                    <Tooltip contentStyle={APPOINTMENTS_CHART_TOOLTIP_CONTENT_STYLE} labelStyle={APPOINTMENTS_CHART_TOOLTIP_LABEL_STYLE} itemStyle={APPOINTMENTS_CHART_TOOLTIP_ITEM_STYLE} />
                    <Legend wrapperStyle={APPOINTMENTS_CHART_LEGEND_WRAPPER_STYLE} />
                    <Line type="monotone" dataKey="noShowCount" name="Faltou" stroke={APPOINTMENTS_CHART_COLORS.danger} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="rescheduledCount" name="Remarcado" stroke={APPOINTMENTS_CHART_COLORS.warning} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="space-y-6">
              <ChartCard title="Ranking ACS">
                {analytics.acsRanking.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.acsRanking.slice(0, 7).map(item => (
                      <div key={item.acsName} className="rounded-xl border border-border bg-background/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-semibold text-card-foreground">{item.acsName}</p>
                          <p className="font-bold text-primary">{item.total}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Comparecimento: {item.showRate}% · Faltas: {item.noShowCount}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem registros para os filtros atuais.</p>
                )}
              </ChartCard>

              <ChartCard title="Dias mais cheios">
                <div className="space-y-2.5">
                  {analytics.busiestDays.map(day => (
                    <div key={day.date} className="rounded-xl border border-border bg-background/40 p-3">
                      <p className="text-sm font-semibold text-card-foreground">{day.label}</p>
                      <p className="text-xs text-muted-foreground">{day.occupiedSlots + day.blockedSlots}/{day.totalSlots} fichas</p>
                      <p className="mt-1 text-sm font-bold text-primary">{day.occupancyRate}% ocupado</p>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </section>
        </>
      ) : (
        <div className="rounded-2xl bg-card border border-border p-10 text-center text-sm text-muted-foreground">
          Não há dados para o período informado.
        </div>
      )}
    </div>
  );
};

const KpiCard = ({
  icon,
  label,
  value,
  helper,
  delta,
  deltaClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  helper: string;
  delta: string;
  deltaClass: string;
}) => (
  <article className="rounded-2xl border border-border bg-card p-5">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      {icon}
    </div>
    <p className="mt-3 text-3xl font-bold text-card-foreground">{value}</p>
    <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    <p className={`mt-2 text-xs font-bold ${deltaClass}`}>vs. período anterior: {delta}</p>
  </article>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <article className="rounded-2xl border border-border bg-card p-4 sm:p-5">
    <h3 className="mb-4 text-base font-bold text-card-foreground">{title}</h3>
    {children}
  </article>
);

export default CapacityDashboardPage;
