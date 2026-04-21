import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock3, UserCheck, PlayCircle } from 'lucide-react';
import { Badge, SectionCard } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  patient_name: string;
  slot_number: number;
}

interface LastCall {
  patientName: string;
  slotNumber: number;
}

interface ReceptionCallPanelProps {
  lastCall: LastCall | null;
  nextTwoPatients: Patient[];
  selectedDate: Date;
  dayConfig: { serviceLabel: string };
  getSlotLabel: (slot: number) => string;
  isLoading: boolean;
  className?: string;
}

export const ReceptionCallPanel: React.FC<ReceptionCallPanelProps> = ({
  lastCall,
  nextTwoPatients,
  selectedDate,
  dayConfig,
  getSlotLabel,
  isLoading,
  className,
}) => {
  return (
    <SectionCard
      title="Painel de Chamada"
      icon={<Clock3 className="size-5" />}
      className={cn("flex h-full flex-col border-0 shadow-none rounded-none bg-transparent", className)}
      headerClassName="border-border/60 px-4 py-3 shrink-0"
      contentClassName="p-0 flex-1 flex flex-col min-h-0"
    >
      <div className="flex flex-1 flex-col p-4 space-y-4 overflow-y-auto custom-scrollbar">
        <div className="rounded-2xl border border-border/50 bg-primary/5 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary/70">Sessão Atual</span>
            <Badge variant="default" className="h-5 px-2 text-[10px]">{dayConfig.serviceLabel}</Badge>
          </div>
          <p className="text-lg font-bold capitalize">
            {selectedDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
            })}
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-background p-4 shadow-md overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <UserCheck className="size-16" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70 block mb-2">Última pessoa chamada</span>
          <p className="text-xl font-bold text-primary truncate">
            {lastCall?.patientName ?? 'Ninguém chamado'}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {lastCall && <Badge variant="outline" className="bg-muted/30">Slot {lastCall.slotNumber}</Badge>}
            <span className="text-[11px] text-muted-foreground italic">
              {lastCall ? 'Chamada realizada com sucesso' : 'Aguardando primeira chamada do dia'}
            </span>
          </div>
        </div>

        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">Próximos na Fila Médica</span>
            <span className="text-[10px] font-bold text-primary">{nextTwoPatients.length} pacientes</span>
          </div>
          
          <div className="space-y-2 overflow-y-auto flex-1 min-h-[100px]">
            <AnimatePresence initial={false}>
              {nextTwoPatients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{index + 1}. {patient.patient_name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{getSlotLabel(patient.slot_number)}</p>
                  </div>
                  <PlayCircle className="size-4 text-primary/40 shrink-0" />
                </motion.div>
              ))}
            </AnimatePresence>
            {!isLoading && nextTwoPatients.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed rounded-xl border-border/60 opacity-30">
                <p className="text-xs">Fila zerada</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-[10px] text-center text-muted-foreground mt-auto pt-4 uppercase tracking-widest font-medium border-t border-border/40">Chamada sincronizada com o painel central</p>
      </div>
    </SectionCard>
  );
};
