import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, X, Clock, Calendar } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Modal,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ActionBar
} from '@/components/ui';
import type { Appointment } from '@/types';
import {
  formatDateToISO,
  getAvailableSlots,
  getDayConfig,
  getSlotTime,
  parseISODate
} from '../services/appointmentService';

interface RescheduleAppointmentModalProps {
  appointment: Appointment;
  onConfirm: (id: string, scheduledDate: string, slotNumber: number) => Promise<boolean>;
  onClose: () => void;
  isLoading: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', damping: 25, stiffness: 200 }
  },
};

export const RescheduleAppointmentModal: React.FC<RescheduleAppointmentModalProps> = ({
  appointment,
  onConfirm,
  onClose,
  isLoading,
}) => {
  const [dateValue, setDateValue] = useState(appointment.scheduled_date);
  const [availableSlots, setAvailableSlots] = useState<number[]>([]);
  const [slotNumber, setSlotNumber] = useState<number | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalConfig = useMemo(
    () => getDayConfig(parseISODate(appointment.scheduled_date)),
    [appointment.scheduled_date]
  );
  const selectedDate = useMemo(() => parseISODate(dateValue), [dateValue]);
  const selectedConfig = useMemo(() => getDayConfig(selectedDate), [selectedDate]);
  const canUseSelectedDate =
    selectedConfig.hasService && selectedConfig.serviceType === originalConfig.serviceType;

  useEffect(() => {
    let isMounted = true;

    const loadSlots = async () => {
      setSlotNumber(null);
      setAvailableSlots([]);

      if (!canUseSelectedDate) {
        setError(
          selectedConfig.hasService
            ? 'Selecione uma data com o mesmo tipo de atendimento da marcação original.'
            : 'Esta data não possui atendimento.'
        );
        return;
      }

      setIsLoadingSlots(true);
      setError(null);
      try {
        const slots = await getAvailableSlots(selectedDate);
        if (!isMounted) return;
        setAvailableSlots(slots);
        setSlotNumber(slots[0] ?? null);
        if (slots.length === 0) {
          setError('Não há slots disponíveis nesta data.');
        }
      } catch (err) {
        console.error('Erro ao carregar slots para remarcação:', err);
        if (isMounted) {
          setError('Erro ao carregar slots disponíveis.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSlots(false);
        }
      }
    };

    loadSlots();

    return () => {
      isMounted = false;
    };
  }, [canUseSelectedDate, selectedConfig.hasService, selectedDate, originalConfig.serviceType]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!slotNumber) {
      setError('Selecione um slot disponível.');
      return;
    }

    const success = await onConfirm(appointment.id, dateValue, slotNumber);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      position="bottom"
      showMobileHandle
      panelClassName="safe-area-bottom max-h-[92vh] overflow-y-auto p-0 sm:w-[95vw] sm:max-w-2xl sm:max-h-[90vh] overflow-x-hidden"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 sm:p-10"
      >
        <div className="flex items-center justify-between mb-8">
          <motion.div variants={itemVariants}>
            <h3 className="text-2xl font-bold text-card-foreground">Remarcar Paciente</h3>
            <p className="text-sm text-muted-foreground mt-1">{appointment.patient_name}</p>
          </motion.div>
          <motion.button
            variants={itemVariants}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-3 rounded-2xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        <motion.div 
          variants={itemVariants}
          className="rounded-2xl border border-border bg-secondary/20 p-5 mb-8 flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Ficha atual: <b className="text-card-foreground">{appointment.slot_number}</b></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Data original: <b className="text-card-foreground">{parseISODate(appointment.scheduled_date).toLocaleDateString('pt-BR')}</b></span>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <motion.div variants={itemVariants}>
              <Label className="text-sm font-semibold text-card-foreground mb-2.5 block">Nova data *</Label>
              <Input
                type="date"
                value={dateValue}
                onChange={(event) => setDateValue(event.target.value)}
                min={formatDateToISO(new Date())}
                className="h-14 rounded-2xl bg-background border-border shadow-sm pl-12"
                icon={<CalendarClock className="w-5 h-5" />}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Label className="text-sm font-semibold text-card-foreground mb-2.5 block">Novo slot *</Label>
              <Select
                value={slotNumber?.toString() ?? ''}
                onValueChange={(value) => setSlotNumber(Number(value))}
                disabled={isLoadingSlots || availableSlots.length === 0 || !canUseSelectedDate}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-background border-border shadow-sm">
                  <SelectValue placeholder={isLoadingSlots ? 'Carregando...' : 'Selecione um slot'} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border shadow-2xl">
                  {availableSlots.map(slot => (
                    <SelectItem key={slot} value={slot.toString()} className="rounded-xl py-3 my-1">
                      Slot {slot} — {getSlotTime(slot, selectedConfig)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={itemVariants} className="pt-6 border-t border-border">
            <ActionBar className="gap-4" align="between">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-2xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-all touch-manipulation"
              >
                Cancelar
              </button>
              <Button
                type="submit"
                disabled={isLoading || isLoadingSlots || !slotNumber || !canUseSelectedDate}
                className="flex-1 py-4 rounded-2xl font-bold touch-manipulation shadow-xl shadow-primary/20"
              >
                {isLoading ? 'Salvando...' : 'Confirmar Remarcação'}
              </Button>
            </ActionBar>
          </motion.div>
        </form>
      </motion.div>
    </Modal>
  );
};

export default RescheduleAppointmentModal;
