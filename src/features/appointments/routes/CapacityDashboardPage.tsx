import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentDaySummary } from '@/types';
import { Button } from '@/components/ui/Button';
import AppointmentsNav from '../components/AppointmentsNav';
import {
  addDays,
  getAppointmentSummariesForDates,
  getWeekStart,
  isBlockedAppointment,
} from '../services/appointmentService';

const RANGE_DAYS = 28;

const formatRangeLabel = (start: Date, end: Date) => {
  const first = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  const last = end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
  return `${first} a ${last}`;
};

const CapacityDashboardPage: React.FC = () => {
  const [rangeStart, setRangeStart] = useState(() => getWeekStart(new Date()));
  const [summaries, setSummaries] = useState<AppointmentDaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const rangeDates = useMemo(
    () => Array.from({ length: RANGE_DAYS }, (_, index) => addDays(rangeStart, index)),
    [rangeStart]
  );

  const rangeEnd = rangeDates[rangeDates.length - 1];

  const loadCapacity = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAppointmentSummariesForDates(rangeDates);
      setSummaries(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard de capacidade:', error);
      toast.error('Erro ao carregar dashboard de capacidade.');
    } finally {
      setIsLoading(false);
    }
  }, [rangeDates]);

  useEffect(() => {
    loadCapacity();
  }, [loadCapacity]);

  const serviceDays = summaries.filter(summary => summary.dayConfig.hasService);
  const totals = serviceDays.reduce(
    (acc, summary) => {
      acc.total += summary.totalSlots;
      acc.occupied += summary.occupiedSlots;
      acc.available += summary.availableSlots;
      acc.blocked += summary.blockedSlots;
      acc.reserve += summary.reserveSlots;
      acc.reserveOccupied += summary.reserveOccupiedSlots;
      acc.normalOccupied += summary.normalOccupiedSlots;
      return acc;
    },
    { total: 0, occupied: 0, available: 0, blocked: 0, reserve: 0, reserveOccupied: 0, normalOccupied: 0 }
  );

  const occupancyRate = totals.total > 0 ? Math.round((totals.occupied / totals.total) * 100) : 0;
  const realPatientCount = totals.normalOccupied + totals.reserveOccupied;
  const weeklyGroups = useMemo(() => {
    return Array.from({ length: 4 }, (_, index) => {
      const weekSummaries = summaries.slice(index * 7, index * 7 + 7);
      const total = weekSummaries.reduce((sum, summary) => sum + summary.totalSlots, 0);
      const occupied = weekSummaries.reduce((sum, summary) => sum + summary.occupiedSlots, 0);
      const available = weekSummaries.reduce((sum, summary) => sum + summary.availableSlots, 0);
      const blocked = weekSummaries.reduce((sum, summary) => sum + summary.blockedSlots, 0);
      return {
        label: `Semana ${index + 1}`,
        range: weekSummaries.length > 0 ? formatRangeLabel(weekSummaries[0].dateObj, weekSummaries[weekSummaries.length - 1].dateObj) : '',
        total,
        occupied,
        available,
        blocked,
        rate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      };
    });
  }, [summaries]);

  const acsRanking = useMemo(() => {
    const counts = new Map<string, number>();
    summaries.forEach(summary => {
      summary.appointments.forEach(appointment => {
        if (isBlockedAppointment(appointment)) return;
        counts.set(appointment.acs_name, (counts.get(appointment.acs_name) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [summaries]);

  const busiestDays = [...serviceDays]
    .sort((a, b) => b.occupancyRate - a.occupancyRate || b.occupiedSlots - a.occupiedSlots)
    .slice(0, 5);

  const goBack = () => setRangeStart(prev => addDays(prev, -RANGE_DAYS));
  const goForward = () => setRangeStart(prev => addDays(prev, RANGE_DAYS));
  const goCurrent = () => setRangeStart(getWeekStart(new Date()));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <AppointmentsNav />

      <section className="rounded-2xl bg-[#1a3a26] p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Dashboard de capacidade</p>
            <h2 className="text-2xl font-bold text-white">{formatRangeLabel(rangeStart, rangeEnd)}</h2>
            <p className="text-sm text-[#96c5a9]">Visão dos próximos 28 dias a partir da semana selecionada</p>
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
      </section>

      {isLoading ? (
        <div className="rounded-2xl bg-[#1a3a26] p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-[#96c5a9]">Carregando capacidade...</p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CapacityStat label="Capacidade total" value={totals.total} detail={`${serviceDays.length} dias com atendimento`} />
            <CapacityStat label="Ocupação" value={`${occupancyRate}%`} detail={`${totals.occupied} de ${totals.total} fichas`} accent />
            <CapacityStat label="Vagas livres" value={totals.available} detail="Fichas ainda disponíveis" tone="blue" />
            <CapacityStat label="Bloqueios" value={totals.blocked} detail="Fichas indisponíveis no período" tone="red" />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-2xl bg-[#1a3a26] p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-bold text-white">Ocupação por semana</h3>
              </div>

              <div className="space-y-4">
                {weeklyGroups.map(week => (
                  <div key={week.label} className="rounded-xl border border-[#264532] bg-[#122118]/40 p-4">
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold text-white">{week.label}</p>
                        <p className="text-xs text-[#96c5a9]">{week.range}</p>
                      </div>
                      <p className="text-sm font-bold text-primary">{week.rate}% ocupado</p>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#264532]">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${week.rate}%` }} />
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                      <BarDetail label="Total" value={week.total} />
                      <BarDetail label="Ocup." value={week.occupied} />
                      <BarDetail label="Livres" value={week.available} />
                      <BarDetail label="Bloq." value={week.blocked} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-[#1a3a26] p-4 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-bold text-white">Pacientes e visitas por ACS</h3>
                </div>

                {acsRanking.length > 0 ? (
                  <div className="space-y-3">
                    {acsRanking.map(item => {
                      const width = realPatientCount > 0 ? `${Math.round((item.count / realPatientCount) * 100)}%` : '0%';
                      return (
                        <div key={item.name}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                            <span className="truncate font-semibold text-white">{item.name}</span>
                            <span className="font-bold text-primary">{item.count}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#264532]">
                            <div className="h-full rounded-full bg-primary" style={{ width }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[#96c5a9]">Nenhuma marcação no período.</p>
                )}
              </div>

              <div className="rounded-2xl bg-[#1a3a26] p-4 sm:p-6">
                <h3 className="mb-4 text-lg font-bold text-white">Dias mais cheios</h3>
                <div className="space-y-3">
                  {busiestDays.map(summary => (
                    <div key={summary.date} className="rounded-xl bg-[#122118]/40 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold capitalize text-white">
                            {summary.dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                          </p>
                          <p className="text-xs text-[#96c5a9]">
                            {summary.occupiedSlots}/{summary.totalSlots} fichas ocupadas
                          </p>
                        </div>
                        <span className="font-bold text-primary">{summary.occupancyRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <CapacityStat label="Marcações reais" value={realPatientCount} detail="Pacientes e visitas, sem contar bloqueios" />
            <CapacityStat label="Reservas ocupadas" value={totals.reserveOccupied} detail={`${totals.reserve} fichas de reserva no período`} tone="red" />
            <CapacityStat label="Consultas normais" value={totals.normalOccupied} detail="Fichas comuns ocupadas por pacientes" tone="blue" />
          </section>
        </>
      )}
    </div>
  );
};

const CapacityStat = ({
  label,
  value,
  detail,
  accent,
  tone,
}: {
  label: string;
  value: number | string;
  detail: string;
  accent?: boolean;
  tone?: 'blue' | 'red';
}) => {
  const valueClass = tone === 'blue' ? 'text-blue-300' : tone === 'red' ? 'text-red-300' : accent ? 'text-primary' : 'text-white';

  return (
    <article className="rounded-2xl border border-[#264532] bg-[#1a3a26] p-5">
      <p className="text-sm font-semibold text-[#96c5a9]">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
      <p className="mt-2 text-sm text-[#96c5a9]">{detail}</p>
    </article>
  );
};

const BarDetail = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg bg-[#1a3a26] p-2">
    <p className="font-bold text-white">{value}</p>
    <p className="text-[#96c5a9]">{label}</p>
  </div>
);

export default CapacityDashboardPage;
