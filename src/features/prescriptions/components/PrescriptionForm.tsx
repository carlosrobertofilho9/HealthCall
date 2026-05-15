import React, { useMemo, useState } from 'react';
import { Save, X, User, CreditCard, Home, Calendar, StickyNote, Pill, AlertTriangle, PlusCircle, MinusCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui';
import { formatCPF, formatCNS, cn } from '@/lib/utils';
import type { CreatePrescriptionInput, PrescriptionFlag } from '../types';

interface PrescriptionFormProps {
  onSubmit: (input: CreatePrescriptionInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const flagOptions: { key: PrescriptionFlag; label: string; icon: React.ReactNode; color: string; activeBg: string; activeBorder: string }[] = [
  { key: 'dosage_change', label: 'Mudança de dosagem', icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'text-amber-600', activeBg: 'bg-amber-50', activeBorder: 'border-amber-200' },
  { key: 'new_medication', label: 'Novo medicamento', icon: <PlusCircle className="h-3.5 w-3.5" />, color: 'text-emerald-600', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-200' },
  { key: 'medication_suspended', label: 'Medicamento suspenso', icon: <MinusCircle className="h-3.5 w-3.5" />, color: 'text-red-500', activeBg: 'bg-red-50', activeBorder: 'border-red-200' },
  { key: 'total_change', label: 'Mudança total da prescrição', icon: <RefreshCw className="h-3.5 w-3.5" />, color: 'text-violet-600', activeBg: 'bg-violet-50', activeBorder: 'border-violet-200' },
];

const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [patientName, setPatientName] = useState('');
  const [documentType, setDocumentType] = useState<'CPF' | 'CNS'>('CPF');
  const [documentValue, setDocumentValue] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [observation, setObservation] = useState('');
  const [flags, setFlags] = useState<PrescriptionFlag[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formattedDocument = useMemo(() => {
    const raw = documentValue.replace(/\D/g, '');
    if (documentType === 'CPF') return formatCPF(raw);
    return formatCNS(raw);
  }, [documentValue, documentType]);

  const nameError = touched.name && !patientName.trim() ? 'Nome do paciente é obrigatório.' : null;
  const documentError = touched.document
    ? !documentValue.replace(/\D/g, '').trim()
      ? 'Documento é obrigatório.'
      : documentType === 'CPF' && documentValue.replace(/\D/g, '').length !== 11
      ? 'CPF deve conter 11 dígitos.'
      : documentType === 'CNS' && documentValue.replace(/\D/g, '').length !== 15
      ? 'CNS deve conter 15 dígitos.'
      : null
    : null;

  const isValid = patientName.trim() && !documentError && documentValue.replace(/\D/g, '').length > 0;

  const handleDocumentChange = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (documentType === 'CPF') {
      setDocumentValue(raw.slice(0, 11));
    } else {
      setDocumentValue(raw.slice(0, 15));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ name: true, document: true });
    if (!isValid) return;

    await onSubmit({
      patient_name: patientName.trim(),
      document_type: documentType,
      document_value: documentValue.replace(/\D/g, ''),
      address: address.trim() || null,
      birth_date: birthDate || null,
      observation: observation.trim() || null,
      flags: flags.length > 0 ? flags : undefined,
    });
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border bg-gradient-to-b from-background to-accent/30 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm">
            <Pill className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-foreground">Nova Receita</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Preencha os dados do paciente para preparação da receita.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onCancel}
          className="rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-5">
          {/* Patient name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted-foreground">
              Nome do paciente <span className="text-destructive">*</span>
            </label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="Digite o nome completo"
              icon={<User className="h-4 w-4 text-muted-foreground" />}
              className={cn(
                'h-11 rounded-xl border-border bg-background text-sm',
                nameError && 'border-destructive focus:border-destructive focus:ring-destructive/20'
              )}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          {/* Document */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-xs font-semibold text-muted-foreground">
                Documento <span className="text-destructive">*</span>
              </label>
              <Select
                value={documentType}
                onValueChange={(value: 'CPF' | 'CNS') => {
                  setDocumentType(value);
                  setDocumentValue('');
                }}
              >
                <SelectTrigger
                  icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
                  className="h-11 rounded-xl border-border bg-background text-sm"
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CNS">CNS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground">
                Número <span className="text-destructive">*</span>
              </label>
              <Input
                value={formattedDocument}
                onChange={(e) => handleDocumentChange(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, document: true }))}
                placeholder={documentType === 'CPF' ? '000.000.000-00' : '000.0000.0000.0000'}
                className={cn(
                  'h-11 rounded-xl border-border bg-background text-sm',
                  documentError && 'border-destructive focus:border-destructive focus:ring-destructive/20'
                )}
              />
              {documentError && <p className="text-xs text-destructive">{documentError}</p>}
            </div>
          </div>

          {/* Address + Birth */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground">
                Endereço <span className="font-medium normal-case text-muted-foreground/70">(opcional)</span>
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro"
                icon={<Home className="h-4 w-4 text-muted-foreground" />}
                className="h-11 rounded-xl border-border bg-background text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground">
                Data de nascimento <span className="font-medium normal-case text-muted-foreground/70">(opcional)</span>
              </label>
              <DatePicker
                value={birthDate}
                onChange={setBirthDate}
                placeholder="Selecione"
                icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                allowClear
                className="h-11 rounded-xl border-border bg-background text-sm"
              />
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted-foreground">
              Sinalizações <span className="font-medium normal-case text-muted-foreground/70">(opcional)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {flagOptions.map((flag) => {
                const isActive = flags.includes(flag.key);
                return (
                  <button
                    key={flag.key}
                    type="button"
                    onClick={() => {
                      setFlags((prev) =>
                        isActive ? prev.filter((f) => f !== flag.key) : [...prev, flag.key]
                      );
                    }}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] text-left',
                      isActive
                        ? `${flag.activeBg} ${flag.activeBorder} ${flag.color} shadow-sm`
                        : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <span className={isActive ? flag.color : 'text-muted-foreground'}>{flag.icon}</span>
                    {flag.label}
                    {isActive && <CheckCircle2 className="ml-auto h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted-foreground">
              Observação <span className="font-medium normal-case text-muted-foreground/70">(opcional)</span>
            </label>
            <Textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Informações complementares sobre a receita, alergias, medicamentos anteriores..."
              icon={<StickyNote className="h-4 w-4 text-muted-foreground" />}
              rows={4}
              className="rounded-xl border-border bg-background text-sm resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="h-11 flex-1 gap-2 rounded-xl text-sm font-bold shadow-sm"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Salvando...' : 'Salvar Receita'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="h-11 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PrescriptionForm;
