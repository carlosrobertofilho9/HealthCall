import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock3, History, MapPin, PhoneCall, RefreshCcw, RotateCcw } from 'lucide-react';
import { Badge, Button, SectionCard } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ReceptionCallHistoryItem } from '../types';

interface ReceptionCallHistoryPanelProps {
  callHistory: ReceptionCallHistoryItem[];
  selectedDate: Date;
  dayConfig: { serviceLabel: string };
  isLoading: boolean;
  onRefresh: () => void;
  className?: string;
}

function formatCallTime(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCallCountLabel(callCount: number) {
  return `${callCount}ª chamada`;
}

export const ReceptionCallHistoryPanel: React.FC<ReceptionCallHistoryPanelProps> = ({
  callHistory,
  selectedDate,
  dayConfig,
  isLoading,
  onRefresh,
  className,
}) => {
  const summary = useMemo(() => {
    const uniquePatients = new Set(callHistory.map((call) => call.patientId)).size;
    const repeatedCalls = callHistory.filter((call) => call.callCount > 1).length;

    return {
      uniquePatients,
      repeatedCalls,
      totalCalls: callHistory.length,
    };
  }, [callHistory]);

  return (
    <SectionCard
      title="Histórico de chamadas"
      subtitle="Chamadas realizadas pelo médico"
      icon={<History className="size-5" />}
      className={cn('flex h-full flex-col border-0 bg-transparent shadow-none rounded-none', className)}
      headerClassName="border-border/60 px-4 py-3 shrink-0"
      contentClassName="p-0 flex-1 flex flex-col min-h-0"
      headerActions={
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={onRefresh}
            className="h-9 rounded-xl border-border/60 bg-background/55 px-3 text-[11px] shadow-sm hover:border-primary/30 hover:bg-primary/5"
            aria-label="Atualizar histórico de chamadas"
          >
            <RefreshCcw className={cn('size-3.5', isLoading && 'animate-spin')} />
            Atualizar
          </Button>
        </motion.div>
      }
    >
      <div className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="rounded-xl border border-border/50 bg-primary/5 p-4 shadow-sm backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary/70">
              Sessão do dia
            </span>
            <Badge variant="default" className="h-5 px-2 text-[10px]">
              {dayConfig.serviceLabel}
            </Badge>
          </div>
          <p className="text-lg font-bold capitalize">
            {selectedDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
            })}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border/50 bg-background/55 p-3 shadow-sm backdrop-blur-sm">
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Chamadas</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-card-foreground">{summary.totalCalls}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/55 p-3 shadow-sm backdrop-blur-sm">
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Pacientes</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-card-foreground">{summary.uniquePatients}</p>
          </div>
          <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 shadow-sm backdrop-blur-sm">
            <p className="text-[9px] font-black uppercase tracking-wider text-amber-300/80">Rechamadas</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-amber-100">{summary.repeatedCalls}</p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
              Últimas chamadas
            </span>
            <span className="text-[10px] font-bold text-primary">
              {callHistory.length} registro{callHistory.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="min-h-[180px] space-y-2">
            <AnimatePresence initial={false}>
              {callHistory.map((call) => (
                <motion.article
                  key={call.id}
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 18, scale: 0.98 }}
                  className="rounded-xl border border-border/50 bg-background/60 p-3.5 shadow-sm backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-background/80 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-card-foreground">{call.patientName}</p>
                      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-background/65 px-2 py-1">
                          <Clock3 className="size-3 text-primary/80" />
                          {formatCallTime(call.calledAt)}
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1 rounded-lg border border-border/50 bg-background/65 px-2 py-1">
                          <MapPin className="size-3 shrink-0 text-primary/80" />
                          <span className="min-w-0 truncate">{call.destination}</span>
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={call.callCount > 1 ? 'warning' : 'outline'}
                      className="shrink-0 gap-1 whitespace-nowrap"
                    >
                      {call.callCount > 1 ? <RotateCcw className="size-3" /> : <PhoneCall className="size-3" />}
                      {getCallCountLabel(call.callCount)}
                    </Badge>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>

            {isLoading && callHistory.length === 0 && (
              <div className="space-y-2">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-24 rounded-xl border border-border/50 bg-background/45 p-3.5 shadow-sm">
                    <div className="mb-3 h-4 w-2/3 animate-pulse rounded-full bg-muted/65" />
                    <div className="flex gap-2">
                      <div className="h-7 w-20 animate-pulse rounded-lg bg-muted/50" />
                      <div className="h-7 flex-1 animate-pulse rounded-lg bg-muted/40" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && callHistory.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/35 px-5 py-8 text-center"
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
                  <History className="size-6" />
                </div>
                <p className="text-sm font-black text-card-foreground">Nenhuma chamada registrada</p>
                <p className="mt-1 max-w-[260px] text-xs font-medium text-muted-foreground">
                  Quando o médico chamar pacientes no painel, os registros aparecerão aqui com horário, destino e contador.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
};
