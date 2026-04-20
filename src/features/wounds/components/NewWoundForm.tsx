import React, { useMemo, useState } from 'react';
import BodyDiagram from '@/components/clinical/BodyDiagram';
import {
  Button,
  Card,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui';
import type { CreateWoundCaseInput, CreateWoundEntryInput } from '../types';
import { getSubregionByCode } from '../utils/bodyDiagramMapping';
import { validateWoundImageFiles } from '../utils/woundFileValidation';
import { 
  Calendar, 
  Stethoscope, 
  Info, 
  Ruler, 
  Camera, 
  Save, 
  X,
  ChevronRight,
  Maximize
} from 'lucide-react';

interface NewWoundFormSubmitPayload {
  caseInput: CreateWoundCaseInput;
  initialEntry?: Omit<CreateWoundEntryInput, 'wound_id'>;
  initialPhotos: File[];
}

interface NewWoundFormProps {
  patientId: string | null;
  existingAnatomicalCodes: string[];
  onSubmit: (payload: NewWoundFormSubmitPayload) => Promise<void>;
  onCancel: () => void;
}

const etiologyOptions = [
  'Úlcera varicosa',
  'Pé diabético',
  'Úlcera de pressão',
  'Pós-cirúrgica',
  'Traumática',
  'Outra',
];

const comorbiditiesOptions = ['DM', 'HAS', 'IVC', 'Tabagismo', 'Obesidade', 'Outra'];
const bedAspectOptions = ['Granulação', 'Epitelização', 'Esfacelo', 'Necrose', 'Misto'];
const edgeOptions = ['Regulares', 'Irregulares', 'Descoladas', 'Maceradas', 'Hiperqueratóticas'];

const NewWoundForm: React.FC<NewWoundFormProps> = ({
  patientId,
  existingAnatomicalCodes,
  onSubmit,
  onCancel,
}) => {
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [etiology, setEtiology] = useState(etiologyOptions[0]);
  const [classification, setClassification] = useState('');
  const [anatomicalCode, setAnatomicalCode] = useState('');
  const [comorbidities, setComorbidities] = useState<string[]>([]);
  const [initialBedAspect, setInitialBedAspect] = useState<string[]>([]);
  const [initialEdges, setInitialEdges] = useState<string[]>([]);
  const [initialLength, setInitialLength] = useState('');
  const [initialWidth, setInitialWidth] = useState('');
  const [initialDepth, setInitialDepth] = useState('');
  const [initialObservations, setInitialObservations] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const parsedAnatomy = useMemo(() => (anatomicalCode ? getSubregionByCode(anatomicalCode) : null), [anatomicalCode]);

  const missingRequiredFields = useMemo(() => {
    return !patientId || !anatomicalCode || !startedAt || !etiology;
  }, [anatomicalCode, etiology, patientId, startedAt]);

  const formError = useMemo(() => {
    if (!patientId) return 'Selecione um paciente antes de cadastrar a ferida.';
    if (!anatomicalCode) return 'Selecione a localização anatômica da ferida.';
    if (!startedAt) return 'Data de início da lesão é obrigatória.';
    if (!etiology) return 'Etiologia é obrigatória.';
    if (fileError) return fileError;
    return null;
  }, [anatomicalCode, etiology, fileError, patientId, startedAt]);

  const toggleListValue = (list: string[], value: string, setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formError || !patientId) {
      return;
    }

    setIsSubmitting(true);

    try {
      const caseInput: CreateWoundCaseInput = {
        patient_id: patientId,
        started_at: startedAt,
        etiology,
        classification: classification || null,
        anatomical_region: parsedAnatomy?.region.label ?? null,
        anatomical_subregion: parsedAnatomy?.subregion.label ?? null,
        anatomical_code: anatomicalCode,
        comorbidities,
        initial_bed_aspect: initialBedAspect,
        initial_edges: initialEdges,
      };

      const hasAnyMeasure = initialLength || initialWidth || initialDepth;
      const initialEntry = hasAnyMeasure || initialObservations
        ? {
            measure_length_cm: initialLength ? Number(initialLength) : null,
            measure_width_cm: initialWidth ? Number(initialWidth) : null,
            measure_depth_cm: initialDepth ? Number(initialDepth) : null,
            bed_aspect: initialBedAspect,
            edges: initialEdges,
            observations: initialObservations || null,
          }
        : undefined;

      await onSubmit({
        caseInput,
        initialEntry,
        initialPhotos: imageFiles,
      });
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
            Cadastro de Nova Lesão
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Inicie um novo acompanhamento clínico mapeando a lesão.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="rounded-full">
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </div>

      {formError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0" />
          <p>{formError}</p>
        </div>
      )}

      {!patientId ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center space-y-2">
          <Info className="h-8 w-8 text-muted-foreground mx-auto opacity-20" />
          <p className="text-sm text-muted-foreground">
            Selecione um paciente na lista acima para registrar uma nova ferida.
          </p>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70">1. Localização e Início</h4>
            <BodyDiagram
              value={anatomicalCode}
              selectedCodes={existingAnatomicalCodes}
              onChange={(code) => setAnatomicalCode(code)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  Data de início *
                </label>
                <Input
                  type="date"
                  icon={<Calendar className="h-4 w-4" />}
                  value={startedAt}
                  onChange={(event) => setStartedAt(event.target.value)}
                  required
                  className="font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1.5">
                  <Stethoscope className="h-3 w-3" />
                  Etiologia (Causa) *
                </label>
                <Select value={etiology} onValueChange={setEtiology}>
                  <SelectTrigger icon={<Stethoscope className="h-4 w-4 text-primary" />}>
                    <SelectValue placeholder="Selecione a etiologia" />
                  </SelectTrigger>
                  <SelectContent>
                    {etiologyOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70">2. Classificação e Comorbidades</h4>
            <Input
              placeholder="Classificação / Grau (ex: Estágio 3, Grau I)"
              icon={<Info className="h-4 w-4" />}
              value={classification}
              onChange={(event) => setClassification(event.target.value)}
            />

            <fieldset className="space-y-3 rounded-2xl border border-border bg-secondary/5 p-4">
              <legend className="px-2 text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                Comorbidades do Paciente
                <ChevronRight className="h-3 w-3" />
              </legend>
              <div className="flex flex-wrap gap-2">
                {comorbiditiesOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`rounded-full border px-6 py-2.5 text-sm sm:text-base font-bold transition-all transform active:scale-95 ${
                      comorbidities.includes(item)
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                        : 'border-border bg-background text-foreground hover:border-primary/40'
                    }`}
                    onClick={() => toggleListValue(comorbidities, item, setComorbidities)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70">3. Estado Inicial e Medidas</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="space-y-3 rounded-2xl border border-border p-4">
                <legend className="px-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Aspecto do Leito</legend>
                <div className="flex flex-wrap gap-2">
                  {bedAspectOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`rounded-full border px-5 py-2.5 text-sm sm:text-base font-bold transition-all ${
                        initialBedAspect.includes(item)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:border-primary/40'
                      }`}
                      onClick={() => toggleListValue(initialBedAspect, item, setInitialBedAspect)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-3 rounded-2xl border border-border p-4">
                <legend className="px-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Bordas</legend>
                <div className="flex flex-wrap gap-2">
                  {edgeOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`rounded-full border px-5 py-2.5 text-sm sm:text-base font-bold transition-all ${
                        initialEdges.includes(item)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:border-primary/40'
                      }`}
                      onClick={() => toggleListValue(initialEdges, item, setInitialEdges)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground text-center block">C (cm)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  icon={<Ruler className="h-3 w-3" />}
                  value={initialLength}
                  onChange={(event) => setInitialLength(event.target.value)}
                  className="text-center font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground text-center block">L (cm)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  icon={<Maximize className="h-3 w-3" />}
                  value={initialWidth}
                  onChange={(event) => setInitialWidth(event.target.value)}
                  className="text-center font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground text-center block">P (cm)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  icon={<Ruler className="h-3 w-3 rotate-90" />}
                  value={initialDepth}
                  onChange={(event) => setInitialDepth(event.target.value)}
                  className="text-center font-bold"
                />
              </div>
            </div>

            <Textarea
              value={initialObservations}
              onChange={(event) => setInitialObservations(event.target.value)}
              placeholder="Observações clínicas iniciais (ex: presença de exsudato, odor, dor)..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70">4. Registro Fotográfico</h4>
            <div className="relative">
              <Input
                id="wound-initial-photos"
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                disabled={missingRequiredFields}
                className="sr-only"
                onChange={(event) => {
                  const selectedFiles = Array.from(event.target.files ?? []);

                  if (missingRequiredFields) {
                    setFileError('Preencha os campos obrigatórios (*) antes de anexar fotos.');
                    setImageFiles([]);
                    event.target.value = '';
                    return;
                  }

                  const validation = validateWoundImageFiles(selectedFiles);
                  if (!validation.isValid) {
                    setFileError(validation.error);
                    setImageFiles([]);
                    event.target.value = '';
                    return;
                  }

                  setFileError(null);
                  setImageFiles(selectedFiles);
                }}
              />
              <label 
                htmlFor="wound-initial-photos"
                className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-full h-12 px-4 cursor-pointer transition-all ${
                  missingRequiredFields ? 'opacity-50 cursor-not-allowed bg-muted' : 'border-primary/30 hover:border-primary hover:bg-primary/5'
                }`}
              >
                <Camera className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold text-primary uppercase">
                  {imageFiles.length > 0 ? `${imageFiles.length} Foto(s) Selecionada(s)` : 'Anexar Fotos Iniciais'}
                </span>
              </label>
              {fileError && <p className="text-[10px] text-destructive font-bold mt-1 ml-4">{fileError}</p>}
              {!fileError && missingRequiredFields && (
                <p className="text-[10px] text-muted-foreground mt-1 ml-4 italic">Complete os obrigatórios (*) para liberar upload.</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex flex-col gap-3">
            <Button 
              type="submit" 
              size="lg" 
              disabled={isSubmitting || !!formError}
              className="w-full rounded-2xl h-14 text-base font-bold shadow-xl shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Salvando registro...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Salvar Cadastro da Ferida
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};

export default NewWoundForm;

