import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users2, UserRoundCheck, UserRoundX, RefreshCcw, Printer, Calendar } from 'lucide-react';
import { Badge, Button, SectionCard } from '@/components/ui';
import { cn } from '@/lib/utils';
import { printAppointmentReport } from '@/components/PatientQueue/printReportUtils';

interface Appointment {
  id: string;
  patient_name: string;
  slot_number: number;
  status: string;
  document_type: string;
  document_value: string;
}

interface ReceptionFlowPanelProps {
  todayAppointments: Appointment[];
  presenceSummary: {
    showedUp: number;
    noShow: number;
    scheduled: number;
    total: number;
  };
  isLoading: boolean;
  updateStatus: (id: string, status: string) => Promise<void>;
  getSlotLabel: (slot: number) => string;
  goToToday: () => void;
  refresh: () => void;
  slots: any;
  className?: string;
}

export const ReceptionFlowPanel: React.FC<ReceptionFlowPanelProps> = ({
  todayAppointments,
  presenceSummary,
  isLoading,
  updateStatus,
  getSlotLabel,
  goToToday,
  refresh,
  slots,
  className,
}) => {
  return (
    <SectionCard
      title="Gestão de fluxo de pacientes"
      icon={<Users2 className="size-5" />}
      className={cn("flex h-full flex-col border-0 shadow-none rounded-none bg-transparent", className)}
      headerClassName="border-border/60 px-4 py-3 shrink-0"
      contentClassName="p-0 flex-1 flex flex-col min-h-0"
      headerActions={
        <div className="flex items-center gap-1.5">
          <Button size="xs" variant="ghost" onClick={goToToday} className="h-8 px-2 text-xs">
            <Calendar className="mr-1.5 size-3.5" /> Hoje
          </Button>
          <Button size="xs" variant="ghost" onClick={refresh} className="h-8 px-2 text-xs">
            <RefreshCcw className={cn("mr-1.5 size-3.5", isLoading && "animate-spin")} /> Atualizar
          </Button>
          <div className="mx-1 h-4 w-px bg-border/60" />
          <Button size="xs" variant="ghost" onClick={() => printAppointmentReport(slots)} className="h-8 px-2 text-xs">
            <Printer className="mr-1.5 size-3.5" /> Relatório do Dia
          </Button>
        </div>
      }
    >
      <div className="flex flex-1 flex-col min-h-0">
        <div className="grid grid-cols-3 gap-3 p-4 bg-muted/20 border-b border-border/40 shrink-0">
          <div className="rounded-xl border border-border/50 bg-background/50 p-3 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{presenceSummary.total}</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold tracking-wider text-primary/70">Presentes</p>
            <p className="text-xl font-bold text-primary">{presenceSummary.showedUp}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/50 p-3 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">Faltas</p>
            <p className="text-xl font-bold text-muted-foreground">{presenceSummary.noShow}</p>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence initial={false}>
            {todayAppointments.map((appointment) => (
              <motion.div
                key={appointment.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "group flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/60 p-3.5 shadow-sm transition-all hover:border-primary/30 hover:bg-background/80",
                  appointment.status === 'Compareceu' && "border-primary/20 bg-primary/5",
                  appointment.status === 'Faltou' && "border-border/40 bg-muted/5 opacity-80"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold truncate">{appointment.patient_name}</p>
                    <Badge variant={appointment.status === 'Compareceu' ? 'success' : appointment.status === 'Faltou' ? 'destructive' : 'secondary'} className="h-5 px-1.5 text-[10px] uppercase">
                      {appointment.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Slot {appointment.slot_number} ({getSlotLabel(appointment.slot_number)}) • {appointment.document_type}: {appointment.document_value}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-nowrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-3 border-primary/20 text-primary hover:bg-primary/10 bg-primary/5"
                    onClick={() => updateStatus(appointment.id, 'Compareceu')}
                  >
                    <UserRoundCheck className="size-4 mr-1.5" />
                    <span className="text-[11px] font-bold">PRESENTE</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-3 border-border/60 text-muted-foreground hover:bg-muted/40 bg-muted/10 font-bold"
                    onClick={() => updateStatus(appointment.id, 'Faltou')}
                  >
                    <UserRoundX className="size-4 mr-1.5" />
                    <span className="text-[11px] font-bold">FALTA</span>
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!isLoading && todayAppointments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
              <Users2 className="size-12 mb-2" />
              <p className="text-sm">Fila vazia</p>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
};
