import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Clock, FileText, Loader2, Save, User, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ACS_OPTIONS } from '@/constants';
import type { AppointmentSlot, DocumentType } from '@/types';
import { formatCPF, formatCNS, isValidCPF, isValidCNS } from '@/lib/utils';
import {
  addDays,
  createAppointment,
  formatDateToISO,
  generateSlotsForDate,
  getAppointmentsByDate,
  getDayConfig,
  getSlotTime,
  getSuggestedAvailableSlot,
  parseISODate,
} from '../services/appointmentService';

const LAST_ACS_STORAGE_KEY = 'healthcall.quickReception.lastAcs';

type LoadResult = {
  date: string;
  slots: AppointmentSlot[];
};

const getInitialAcs = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(LAST_ACS_STORAGE_KEY) || '';
};

const detectDocumentType = (value: string): DocumentType => {
  const digits = value.replace(/\D/g, '');
  return digits.length > 11 ? 'CARTAO_SUS' : 'CPF';
};

const formatDocumentByType = (value: string, type: DocumentType) => {
  return type === 'CPF' ? formatCPF(value) : formatCNS(value);
};

export const QuickAppointmentForm: React.FC = () => {
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [dateValue, setDateValue] = useState(formatDateToISO(new Date()));
  const [documentValue, setDocumentValue] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('CPF');
  const [patientName, setPatientName] = useState('');
  const [selectedAcs, setSelectedAcs] = useState(getInitialAcs);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDate = useMemo(() => parseISODate(dateValue), [dateValue]);
  const dayConfig = useMemo(() => getDayConfig(selectedDate), [selectedDate]);
  const suggestedSlot = useMemo(() => getSuggestedAvailableSlot(slots), [slots]);
  const availableSlotOptions = useMemo(
    () => slots.filter(slot => !slot.appointment),
    [slots]
  );
  const canUseSelectedDate = dayConfig.hasService && dayConfig.serviceType === 'UBS';

  const loadSlotsForDate = async (date: Date): Promise<LoadResult> => {
    const dateStr = formatDateToISO(date);
    const config = getDayConfig(date);

    if (!config.hasService || config.serviceType !== 'UBS') {
      return { date: dateStr, slots: [] };
    }

    const appointments = await getAppointmentsByDate(dateStr);
    return { date: dateStr, slots: generateSlotsForDate(date, appointments) };
  };

  const findNextQuickDate = async (startDate: Date): Promise<LoadResult | null> => {
    for (let offset = 0; offset < 60; offset += 1) {
      const candidate = addDays(startDate, offset);
      const result = await loadSlotsForDate(candidate);
      if (getSuggestedAvailableSlot(result.slots)) {
        return result;
      }
    }

    return null;
  };

  const applyLoadedSlots = (result: LoadResult, moveDate = false) => {
    if (moveDate) {
      setDateValue(result.date);
    }

    setSlots(result.slots);
    const nextSlot = getSuggestedAvailableSlot(result.slots);
    setSelectedSlot(nextSlot?.slotNumber ?? null);
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialDate = async () => {
      setIsLoadingSlots(true);
      setError(null);

      try {
        const result = await findNextQuickDate(new Date());
        if (!isMounted) return;

        if (result) {
          applyLoadedSlots(result, true);
        } else {
          setSlots([]);
          setSelectedSlot(null);
          setError('Nenhum dia UBS com slot disponível foi encontrado nos próximos 60 dias.');
        }
      } catch (err) {
        console.error('Erro ao carregar recepção rápida:', err);
        if (isMounted) {
          setError('Erro ao carregar slots disponíveis.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSlots(false);
          setTimeout(() => documentInputRef.current?.focus(), 0);
        }
      }
    };

    loadInitialDate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSelectedDate = async () => {
      setIsLoadingSlots(true);
      setError(null);

      if (!canUseSelectedDate) {
        setSlots([]);
        setSelectedSlot(null);
        setError(
          dayConfig.serviceType === 'HOME_VISIT'
            ? 'Use a agenda completa para visitas domiciliares, pois endereço e motivo são obrigatórios.'
            : 'Esta data não possui atendimento UBS.'
        );
        setIsLoadingSlots(false);
        return;
      }

      try {
        const result = await loadSlotsForDate(selectedDate);
        if (!isMounted) return;
        applyLoadedSlots(result);
        if (!getSuggestedAvailableSlot(result.slots)) {
          setError('Não há slots disponíveis nesta data.');
        }
      } catch (err) {
        console.error('Erro ao carregar slots da data:', err);
        if (isMounted) {
          setError('Erro ao carregar slots disponíveis.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSlots(false);
        }
      }
    };

    loadSelectedDate();

    return () => {
      isMounted = false;
    };
  }, [canUseSelectedDate, dateValue, dayConfig.serviceType, selectedDate]);

  useEffect(() => {
    if (suggestedSlot && selectedSlot === null) {
      setSelectedSlot(suggestedSlot.slotNumber);
    }
  }, [selectedSlot, suggestedSlot]);

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const nextType = detectDocumentType(value);
    setDocumentType(nextType);
    setDocumentValue(formatDocumentByType(value, nextType));
  };

  const validate = () => {
    const trimmedName = patientName.trim();
    const trimmedAcs = selectedAcs.trim();

    if (!canUseSelectedDate) {
      return 'Selecione uma data UBS com atendimento.';
    }

    if (!selectedSlot) {
      return 'Não há slot disponível para salvar.';
    }

    if (!documentValue.trim()) {
      return 'Documento é obrigatório.';
    }

    if (documentType === 'CPF' && !isValidCPF(documentValue)) {
      return 'CPF inválido.';
    }

    if (documentType === 'CARTAO_SUS' && !isValidCNS(documentValue)) {
      return 'Cartão SUS inválido.';
    }

    if (!trimmedName) {
      return 'Nome do paciente é obrigatório.';
    }

    if (!trimmedAcs) {
      return 'ACS é obrigatório.';
    }

    return null;
  };

  const reloadAfterSave = async () => {
    const currentResult = await loadSlotsForDate(selectedDate);
    if (getSuggestedAvailableSlot(currentResult.slots)) {
      applyLoadedSlots(currentResult);
      return;
    }

    const nextResult = await findNextQuickDate(addDays(selectedDate, 1));
    if (nextResult) {
      applyLoadedSlots(nextResult, true);
      return;
    }

    applyLoadedSlots(currentResult);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await createAppointment({
        scheduled_date: dateValue,
        slot_number: selectedSlot!,
        patient_name: patientName.trim(),
        document_type: documentType,
        document_value: documentValue.trim(),
        acs_name: selectedAcs.trim(),
        status: 'Agendado',
      });

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LAST_ACS_STORAGE_KEY, selectedAcs.trim());
      }

      toast.success('Marcação salva.');
      setDocumentValue('');
      setDocumentType('CPF');
      setPatientName('');
      await reloadAfterSave();
      setTimeout(() => documentInputRef.current?.focus(), 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar marcação.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl bg-[#1a3a26] p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr_1fr_1fr_auto] lg:items-end">
        <div>
          <Label className="mb-2 block text-white">Data</Label>
          <div className="relative">
            <CalendarDays className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#96c5a9]" />
            <Input
              type="date"
              value={dateValue}
              onChange={(event) => setDateValue(event.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-white">
            Documento <span className="text-xs font-normal text-[#96c5a9]">({documentType === 'CPF' ? 'CPF' : 'Cartão SUS'})</span>
          </Label>
          <div className="relative">
            <FileText className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#96c5a9]" />
            <Input
              ref={documentInputRef}
              value={documentValue}
              onChange={handleDocumentChange}
              placeholder="CPF ou Cartão SUS"
              className="pl-12"
            />
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-white">Nome</Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#96c5a9]" />
            <Input
              value={patientName}
              onChange={(event) => setPatientName(event.target.value)}
              placeholder="Nome completo"
              className="pl-12"
            />
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-white">ACS</Label>
          <div className="relative">
            <UserCheck className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#96c5a9]" />
            <Select value={selectedAcs} onValueChange={setSelectedAcs}>
              <SelectTrigger className="pl-12">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ACS_OPTIONS.map(acs => (
                  <SelectItem key={acs} value={acs}>
                    {acs}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-white">Slot sugerido</Label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#96c5a9]" />
            <Select
              value={selectedSlot?.toString() ?? ''}
              onValueChange={(value) => setSelectedSlot(Number(value))}
              disabled={isLoadingSlots || availableSlotOptions.length === 0}
            >
              <SelectTrigger className="pl-12">
                <SelectValue placeholder={isLoadingSlots ? 'Carregando' : 'Sem slot'} />
              </SelectTrigger>
              <SelectContent>
                {availableSlotOptions.map(slot => (
                  <SelectItem key={slot.slotNumber} value={slot.slotNumber.toString()}>
                    Slot {slot.slotNumber} - {getSlotTime(slot.slotNumber, dayConfig)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSaving || isLoadingSlots || !selectedSlot || !canUseSelectedDate}
          className="h-14 w-full lg:w-auto lg:px-8"
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
        </Button>
      </form>

      <div className="mt-4 min-h-6">
        {error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : suggestedSlot ? (
          <p className="text-sm text-[#96c5a9]">
            Próximo slot: ficha {suggestedSlot.slotNumber} · {getSlotTime(suggestedSlot.slotNumber, dayConfig)}
          </p>
        ) : (
          <p className="text-sm text-[#96c5a9]">Selecione uma data UBS com vaga disponível.</p>
        )}
      </div>
    </section>
  );
};

export default QuickAppointmentForm;
