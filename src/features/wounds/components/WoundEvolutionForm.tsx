import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Input,
  DatePicker,
  DateTimePicker,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui';
import type { CreateWoundEntryInput, WoundExudate, WoundOdor } from '../types';
import { validateWoundImageFiles } from '../utils/woundFileValidation';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  Clock, 
  Droplets, 
  Wind, 
  ShieldCheck, 
  AlertTriangle, 
  Maximize, 
  ChevronRight,
  Camera,
  Save,
  X,
  Ruler,
  ClipboardEdit,
  FileText,
  Pill,
  ShieldPlus,
  StickyNote,
  User,
  Activity
} from 'lucide-react';

interface WoundEvolutionFormProps {
  woundId: string | null;
  initialDraft?: Record<string, unknown> | null;
  onSubmit: (input: CreateWoundEntryInput, files: File[]) => Promise<void>;
  onDraftChange?: (draft: Record<string, unknown>) => void;
  onDraftClear?: () => void;
  onCancel?: () => void;
}

const bedAspectOptions = ['Granulação', 'Epitelização', 'Esfacelo', 'Necrose', 'Misto'];
const edgeOptions = ['Regulares', 'Irregulares', 'Descoladas', 'Maceradas', 'Hiperqueratóticas'];
const perilesionalOptions = ['Íntegra', 'Eritematosa', 'Macerada', 'Descamativa', 'Edemaciada'];
const dressingOptions = [
  'AGE (Ácidos Graxos)',
  'Alginato de Cálcio',
  'Hidrogel',
  'Hidrocolóide',
  'Carvão Ativado com Prata',
  'Espuma de Poliuretano',
  'Colagenase',
  'Papaína',
  'Sulfadiazina de Prata',
  'Bota de Unna',
  'Curativo a Vácuo (VAC)',
  'Outra',
];

const nonConformityTypes = [
  'Pomada inadequada',
  'ATB não prescrito',
  'Outro produto não permitido',
  'Sem cobertura adequada',
  'Outro',
];

const exudateOptions: WoundExudate[] = ['ausente', 'seroso', 'sanguinolento', 'serossanguinolento', 'purulento'];
const odorOptions: WoundOdor[] = ['ausente', 'discreto', 'fetido'];

const exudateIcons: Record<WoundExudate, React.ReactNode> = {
  ausente: <Droplets className="h-3.5 w-3.5 text-muted-foreground opacity-40" />,
  seroso: <Droplets className="h-3.5 w-3.5 text-yellow-500" />,
  sanguinolento: <Droplets className="h-3.5 w-3.5 text-rose-600" />,
  serossanguinolento: <Droplets className="h-3.5 w-3.5 text-rose-400" />,
  purulento: <Droplets className="h-3.5 w-3.5 text-amber-600" />,
};

const odorIcons: Record<WoundOdor, React.ReactNode> = {
  ausente: <Wind className="h-3.5 w-3.5 text-muted-foreground opacity-40" />,
  discreto: <Wind className="h-3.5 w-3.5 text-emerald-500" />,
  fetido: <Wind className="h-3.5 w-3.5 text-rose-600" />,
};

const createDefaultState = () => ({
  recorded_at: new Date().toISOString().slice(0, 16),
  measure_length_cm: '',
  measure_width_cm: '',
  measure_depth_cm: '',
  bed_aspect: [] as string[],
  edges: [] as string[],
  exudate: '' as WoundExudate | '',
  odor: '' as WoundOdor | '',
  perilesional_skin: [] as string[],
  pain_scale: 0,
  uses_antibiotic: false,
  antibiotic_type: '',
  uses_ointment: false,
  ointment_type: '',
  dressing_type: '',
  dressing_notes: '',
  non_conformity_detected: false,
  non_conformity_type: '',
  non_conformity_description: '',
  non_conformity_action: '',
  observations: '',
  next_change_date: '',
});

const WoundEvolutionForm: React.FC<WoundEvolutionFormProps> = ({
  woundId,
  initialDraft,
  onSubmit,
  onDraftChange,
  onDraftClear,
  onCancel,
}) => {
  const [form, setForm] = useState(createDefaultState);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const onDraftChangeRef = useRef(onDraftChange);

  useEffect(() => {
    onDraftChangeRef.current = onDraftChange;
  }, [onDraftChange]);

  useEffect(() => {
    if (!initialDraft) return;

    setForm((prev) => {
      const next = {
        ...prev,
        ...(initialDraft as Partial<typeof prev>),
      };

      if (JSON.stringify(next) === JSON.stringify(prev)) {
        return prev;
      }

      return next;
    });
  }, [initialDraft]);

  useEffect(() => {
    onDraftChangeRef.current?.(form);
  }, [form]);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};

    if (!woundId) {
      next.wound = 'Selecione uma ferida antes de registrar evolução.';
      return next;
    }

    if (!form.measure_length_cm) next.measure_length_cm = 'Comprimento é obrigatório.';
    if (!form.measure_width_cm) next.measure_width_cm = 'Largura é obrigatória.';
    if (!form.measure_depth_cm) next.measure_depth_cm = 'Profundidade é obrigatória.';
    if (!form.exudate) next.exudate = 'Selecione o exsudato.';
    if (!form.odor) next.odor = 'Selecione o odor.';
    if (!form.dressing_type) next.dressing_type = 'Selecione a cobertura utilizada.';

    if (form.uses_antibiotic && !form.antibiotic_type.trim()) {
      next.antibiotic_type = 'Informe o tipo de antibiótico.';
    }

    if (form.uses_ointment && !form.ointment_type.trim()) {
      next.ointment_type = 'Informe o tipo de pomada.';
    }

    if (form.non_conformity_detected) {
      if (!form.non_conformity_type) next.non_conformity_type = 'Selecione o tipo de não conformidade.';
      if (!form.non_conformity_description.trim()) next.non_conformity_description = 'Descreva a não conformidade.';
      if (!form.non_conformity_action.trim()) next.non_conformity_action = 'Informe a ação tomada.';
    }

    return next;
  }, [form, woundId]);

  const hasErrors = Object.keys(errors).length > 0;

  const errorMessages = useMemo(
    () => Array.from(new Set(Object.values(errors))),
    [errors],
  );

  const uploadLocked = hasErrors || !woundId;

  const toggleInList = (key: 'bed_aspect' | 'edges' | 'perilesional_skin', value: string) => {
    setForm((prev) => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!woundId || hasErrors || fileError) return;

    const payload: CreateWoundEntryInput = {
      wound_id: woundId,
      recorded_at: new Date(form.recorded_at).toISOString(),
      measure_length_cm: Number(form.measure_length_cm),
      measure_width_cm: Number(form.measure_width_cm),
      measure_depth_cm: Number(form.measure_depth_cm),
      bed_aspect: form.bed_aspect,
      edges: form.edges,
      exudate: form.exudate || null,
      odor: form.odor || null,
      perilesional_skin: form.perilesional_skin,
      pain_scale: Number(form.pain_scale),
      uses_antibiotic: form.uses_antibiotic,
      antibiotic_type: form.uses_antibiotic ? form.antibiotic_type : null,
      uses_ointment: form.uses_ointment,
      ointment_type: form.uses_ointment ? form.ointment_type : null,
      dressing_type: form.dressing_type,
      dressing_notes: form.dressing_notes || null,
      non_conformity_detected: form.non_conformity_detected,
      non_conformity_type: form.non_conformity_detected ? form.non_conformity_type : null,
      non_conformity_description: form.non_conformity_detected ? form.non_conformity_description : null,
      non_conformity_action: form.non_conformity_detected ? form.non_conformity_action : null,
      observations: form.observations || null,
      next_change_date: form.next_change_date || null,
    };

    setIsSubmitting(true);

    try {
      await onSubmit(payload, files);
      setForm(createDefaultState());
      setFiles([]);
      setFileError(null);
      onDraftClear?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="space-y-4 p-4 shadow-lg border-primary/10">
      <div className="flex items-start justify-between gap-2 border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-6 bg-primary rounded-full" />
            Nova evolução clínica
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Preencha os detalhes técnicos para registrar a evolução da lesão.
          </p>
        </div>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="rounded-full">
            <X className="h-4 w-4 mr-1" />
            Fechar
          </Button>
        )}
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {errorMessages.length > 0 && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in slide-in-from-top-2">
            <p className="font-bold mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Atenção:
            </p>
            <ul className="space-y-1 pl-4">
              {errorMessages.map((message) => (
                <li key={message} className="list-disc">{message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Seção 1: Dados Temporais e Medidas */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70">1. Registro e Dimensões</h4>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Data e hora do registro *
              </label>
              <DateTimePicker
                icon={<Clock className="h-4 w-4" />}
                value={form.recorded_at}
                onChange={(value) => setForm((prev) => ({ ...prev, recorded_at: value }))}
                className="font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground text-center block">C (cm)</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  icon={<Ruler className="h-3 w-3" />}
                  value={form.measure_length_cm}
                  onChange={(event) => setForm((prev) => ({ ...prev, measure_length_cm: event.target.value }))}
                  className="text-center font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground text-center block">L (cm)</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  icon={<Maximize className="h-3 w-3" />}
                  value={form.measure_width_cm}
                  onChange={(event) => setForm((prev) => ({ ...prev, measure_width_cm: event.target.value }))}
                  className="text-center font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground text-center block">P (cm)</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  icon={<Ruler className="h-3 w-3 rotate-90" />}
                  value={form.measure_depth_cm}
                  onChange={(event) => setForm((prev) => ({ ...prev, measure_depth_cm: event.target.value }))}
                  className="text-center font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            2. Avaliação da Lesão
          </h4>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1.5">
                <Droplets className="h-3 w-3" />
                Exsudato *
              </label>
              <Select 
                value={form.exudate || undefined} 
                onValueChange={(value) => setForm((prev) => ({ ...prev, exudate: value as WoundExudate }))}
              >
                <SelectTrigger 
                  icon={form.exudate ? exudateIcons[form.exudate] : <Droplets className="h-4 w-4 text-sky-500/80" />}
                >
                  <SelectValue placeholder="Selecione o exsudato" />
                </SelectTrigger>
                <SelectContent>
                  {exudateOptions.map((item) => (
                    <SelectItem key={item} value={item} icon={exudateIcons[item]}>
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1.5">
                <Wind className="h-3 w-3" />
                Odor *
              </label>
              <Select 
                value={form.odor || undefined} 
                onValueChange={(value) => setForm((prev) => ({ ...prev, odor: value as WoundOdor }))}
              >
                <SelectTrigger 
                  icon={form.odor ? odorIcons[form.odor] : <Wind className="h-4 w-4 text-emerald-500/80" />}
                >
                  <SelectValue placeholder="Selecione o odor" />
                </SelectTrigger>
                <SelectContent>
                  {odorOptions.map((item) => (
                    <SelectItem key={item} value={item} icon={odorIcons[item]}>
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <fieldset className="space-y-3 rounded-2xl border border-border bg-secondary/5 p-4">
            <legend className="px-2 text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              Aspecto do leito
              <ChevronRight className="h-3 w-3" />
            </legend>
            <div className="flex flex-wrap gap-2">
              {bedAspectOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleInList('bed_aspect', item)}
                  className={`rounded-full border px-6 py-2.5 text-sm sm:text-base font-bold transition-all transform active:scale-95 ${
                    form.bed_aspect.includes(item)
                      ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-secondary/20'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="space-y-3 rounded-2xl border border-border p-4">
              <legend className="px-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Bordas</legend>
              <div className="flex flex-wrap gap-2">
                {edgeOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInList('edges', item)}
                    className={`rounded-full border px-5 py-2.5 text-sm sm:text-base font-bold transition-all active:scale-95 ${
                      form.edges.includes(item)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:border-primary/40'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-2xl border border-border p-4">
              <legend className="px-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Pele perilesional</legend>
              <div className="flex flex-wrap gap-2">
                {perilesionalOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInList('perilesional_skin', item)}
                    className={`rounded-full border px-5 py-2.5 text-sm sm:text-base font-bold transition-all active:scale-95 ${
                      form.perilesional_skin.includes(item)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:border-primary/40'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-secondary/10 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Escala de Dor (0-10)
              </label>
              <span className={`text-sm font-black px-3 py-1 rounded-full ${
                form.pain_scale > 7 ? 'bg-destructive text-destructive-foreground' : 
                form.pain_scale > 3 ? 'bg-warning text-warning-foreground' : 
                'bg-success text-success-foreground'
              }`}>
                {form.pain_scale}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={form.pain_scale}
              onChange={(event) => setForm((prev) => ({ ...prev, pain_scale: Number(event.target.value) }))}
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-bold px-1">
              <span>SEM DOR</span>
              <span>MODERADA</span>
              <span>INTENSA</span>
            </div>
          </div>
        </div>

        {/* Seção 3: Tratamento e Cobertura */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70">3. Tratamento Aplicado</h4>
          
          <div className="grid gap-6 sm:grid-cols-2 bg-secondary/5 rounded-2xl border border-border p-4">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm font-semibold text-foreground cursor-pointer group">
                <div className={`w-10 h-6 flex items-center rounded-full transition-colors p-1 ${form.uses_antibiotic ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${form.uses_antibiotic ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={form.uses_antibiotic}
                  onChange={(event) => setForm((prev) => ({ ...prev, uses_antibiotic: event.target.checked }))}
                />
                Uso de antibiótico
              </label>
              
              {form.uses_antibiotic && (
                <Input
                  placeholder="Qual antibiótico? *"
                  icon={<ShieldPlus className="h-4 w-4 text-primary" />}
                  value={form.antibiotic_type}
                  onChange={(event) => setForm((prev) => ({ ...prev, antibiotic_type: event.target.value }))}
                  className="animate-in slide-in-from-left-2 duration-200"
                />
              )}
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm font-semibold text-foreground cursor-pointer group">
                <div className={`w-10 h-6 flex items-center rounded-full transition-colors p-1 ${form.uses_ointment ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${form.uses_ointment ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={form.uses_ointment}
                  onChange={(event) => setForm((prev) => ({ ...prev, uses_ointment: event.target.checked }))}
                />
                Uso de pomada
              </label>
              
              {form.uses_ointment && (
                <Input
                  placeholder="Qual pomada? *"
                  icon={<Pill className="h-4 w-4 text-primary" />}
                  value={form.ointment_type}
                  onChange={(event) => setForm((prev) => ({ ...prev, ointment_type: event.target.value }))}
                  className="animate-in slide-in-from-left-2 duration-200"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground ml-1">Cobertura utilizada *</label>
            <Select 
              value={form.dressing_type || undefined} 
              onValueChange={(value) => setForm((prev) => ({ ...prev, dressing_type: value }))}
            >
              <SelectTrigger 
                icon={<ShieldCheck className={cn("h-4 w-4", form.dressing_type ? "text-primary" : "text-primary/40")} />}
              >
                <SelectValue placeholder="Selecione a cobertura" />
              </SelectTrigger>
              <SelectContent>
                {dressingOptions.map((item) => (
                  <SelectItem key={item} value={item} icon={<ShieldCheck className="h-3.5 w-3.5 text-primary/50" />}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

            <label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1.5">
              <StickyNote className="h-3 w-3" />
              Anotações da Cobertura
            </label>
            <Textarea
              placeholder="Anotações específicas sobre a aplicação da cobertura..."
              value={form.dressing_notes}
              onChange={(event) => setForm((prev) => ({ ...prev, dressing_notes: event.target.value }))}
              className="min-h-[80px]"
            />
        </div>

        {/* Seção 4: Segurança e Registro Fotográfico */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70">4. Segurança e Planejamento</h4>
          
          <div className={`space-y-4 rounded-2xl border p-4 transition-colors ${form.non_conformity_detected ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-secondary/5'}`}>
            <label className="flex items-center gap-3 text-sm font-bold text-foreground cursor-pointer">
              <div className={`w-10 h-6 flex items-center rounded-full transition-colors p-1 ${form.non_conformity_detected ? 'bg-destructive' : 'bg-muted'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${form.non_conformity_detected ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={form.non_conformity_detected}
                onChange={(event) => setForm((prev) => ({ ...prev, non_conformity_detected: event.target.checked }))}
              />
              Não conformidade detectada
            </label>

            {form.non_conformity_detected && (
              <div className="space-y-4 animate-in zoom-in-95 duration-200">
                <Select 
                  value={form.non_conformity_type || undefined} 
                  onValueChange={(value) => setForm((prev) => ({ ...prev, non_conformity_type: value }))}
                >
                  <SelectTrigger 
                    icon={<AlertTriangle className={cn("h-4 w-4", form.non_conformity_type ? "text-destructive" : "text-destructive/40")} />}
                  >
                    <SelectValue placeholder="Qual o problema? *" />
                  </SelectTrigger>
                  <SelectContent>
                    {nonConformityTypes.map((item) => (
                      <SelectItem key={item} value={item} icon={<AlertTriangle className="h-3.5 w-3.5 text-destructive/50" />}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1.5">
                      <FileText className="h-3 w-3" />
                      Descrição da não conformidade *
                    </label>
                    <Textarea
                      placeholder="Descrição detalhada do que foi encontrado *"
                      value={form.non_conformity_description}
                      onChange={(event) => setForm((prev) => ({ ...prev, non_conformity_description: event.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1.5">
                      <Activity className="h-3 w-3" />
                      Ação imediata tomada *
                    </label>
                    <Textarea
                      placeholder="Ação imediata tomada *"
                      value={form.non_conformity_action}
                      onChange={(event) => setForm((prev) => ({ ...prev, non_conformity_action: event.target.value }))}
                      required
                    />
                  </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1.5">
              <ClipboardEdit className="h-3 w-3" />
              Observações Clínicas Adicionais
            </label>
            <Textarea
              placeholder="Presença de tunelamento, tecidos adjacentes, etc..."
              value={form.observations}
              onChange={(event) => setForm((prev) => ({ ...prev, observations: event.target.value }))}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Próxima troca sugerida</label>
              <DatePicker
                icon={<Calendar className="h-4 w-4" />}
                value={form.next_change_date}
                onChange={(value) => setForm((prev) => ({ ...prev, next_change_date: value }))}
                className="font-medium"
                placeholder="Selecione uma data"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="wound-evolution-photos" className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1">
                <Camera className="h-3 w-3" />
                Registro Fotográfico
              </label>
              <div className="relative">
                <Input
                  id="wound-evolution-photos"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploadLocked}
                  className="sr-only"
                  onChange={(event) => {
                    const selectedFiles = Array.from(event.target.files ?? []) as File[];

                    if (uploadLocked) {
                      setFileError('Preencha os campos obrigatórios antes de anexar fotos.');
                      setFiles([]);
                      event.target.value = '';
                      return;
                    }

                    const validation = validateWoundImageFiles(selectedFiles);
                    if (!validation.isValid) {
                      setFileError(validation.error);
                      setFiles([]);
                      event.target.value = '';
                      return;
                    }

                    setFileError(null);
                    setFiles(selectedFiles);
                  }}
                />
                <label 
                  htmlFor="wound-evolution-photos"
                  className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-full h-11 px-4 cursor-pointer transition-all ${
                    uploadLocked ? 'opacity-50 cursor-not-allowed bg-muted' : 'border-primary/30 hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  <Camera className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase">
                    {files.length > 0 ? `${files.length} Foto(s) Selecionada(s)` : 'Anexar Fotos da Lesão'}
                  </span>
                </label>
              </div>
              {fileError && <p className="text-[10px] text-destructive font-bold ml-1">{fileError}</p>}
              {!fileError && uploadLocked && (
                <p className="text-[10px] text-muted-foreground ml-1 italic">Complete os campos obrigatórios (*) para liberar as fotos.</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex flex-col gap-3">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting || hasErrors || !!fileError || !woundId}
            className="w-full rounded-2xl h-14 text-base font-bold shadow-xl shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Salvando evolução...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Concluir Evolução Clínica
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">
              Descartar alterações
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};

export default WoundEvolutionForm;

