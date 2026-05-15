import React, { useMemo, useState } from 'react';
import { Info, Save, X, User, CreditCard, Home, Calendar, StickyNote, Pill, AlertTriangle, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react';
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

  const formattedDocument = useMemo(() => {
    const raw = documentValue.replace(/\D/g, '');
    if (documentType === 'CPF') return formatCPF(raw);
    return formatCNS(raw);
  }, [documentValue, documentType]);

  const formError = useMemo(() => {
    if (!patientName.trim()) return 'Nome do paciente é obrigatório.';
    if (!documentValue.replace(/\D/g, '').trim()) return 'Documento é obrigatório.';
    if (documentType === 'CPF' && documentValue.replace(/\D/g, '').length !== 11) {
      return 'CPF deve conter 11 dígitos.';
    }
    if (documentType === 'CNS' && documentValue.replace(/\D/g, '').length !== 15) {
      return 'CNS deve conter 15 dígitos.';
    }
    return null;
  }, [patientName, documentValue, documentType]);

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
    if (formError) return;

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
    <Card className="overflow-hidden rounded-[1.5rem] border border-[#DCE5EE] bg-white shadow-[0_24px_60px_rgba(0,27,61,0.10)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[#F1F5F9] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#CFEDE6] bg-[#E6F7F2] text-[#007A65]">
            <Pill className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-[#001B3D]">Nova Receita</h3>
            <p className="mt-0.5 text-xs font-semibold text-[#64748B]">
              Preencha os dados do paciente para preparação da receita.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onCancel}
          className="rounded-full text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#001B3D]"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        {formError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#F3D6D8] bg-[#FFF7F7] px-3.5 py-3 text-xs font-semibold text-[#B4232D]">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{formError}</p>
          </div>
        )}

        <div className="space-y-5">
          {/* Nome do paciente */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#64748B]">
              Nome do paciente <span className="text-[#D9474F]">*</span>
            </label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Digite o nome completo"
              icon={<User className="h-4 w-4 text-[#94A3B8]" />}
              className="h-11 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] placeholder:text-[#94A3B8] focus:border-[#1466F5] focus:ring-[#1466F5]/20"
            />
          </div>

          {/* Documento */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#64748B]">
                Documento <span className="text-[#D9474F]">*</span>
              </label>
              <Select
                value={documentType}
                onValueChange={(value: 'CPF' | 'CNS') => {
                  setDocumentType(value);
                  setDocumentValue('');
                }}
              >
                <SelectTrigger
                  icon={<CreditCard className="h-4 w-4 text-[#94A3B8]" />}
                  className="h-11 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] focus:ring-[#1466F5]/20"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CNS">CNS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#64748B]">
                Número <span className="text-[#D9474F]">*</span>
              </label>
              <Input
                value={formattedDocument}
                onChange={(e) => handleDocumentChange(e.target.value)}
                placeholder={documentType === 'CPF' ? '000.000.000-00' : '000.0000.0000.0000'}
                className="h-11 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] placeholder:text-[#94A3B8] focus:border-[#1466F5] focus:ring-[#1466F5]/20"
              />
            </div>
          </div>

          {/* Endereço + Nascimento */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#64748B]">
                Endereço <span className="font-medium normal-case text-[#94A3B8]">(opcional)</span>
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro"
                icon={<Home className="h-4 w-4 text-[#94A3B8]" />}
                className="h-11 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] placeholder:text-[#94A3B8] focus:border-[#1466F5] focus:ring-[#1466F5]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#64748B]">
                Data de nascimento <span className="font-medium normal-case text-[#94A3B8]">(opcional)</span>
              </label>
              <DatePicker
                value={birthDate}
                onChange={setBirthDate}
                placeholder="Selecione"
                icon={<Calendar className="h-4 w-4 text-[#94A3B8]" />}
                allowClear
                className="h-11 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D]"
              />
            </div>
          </div>

          {/* Sinalizações */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#64748B]">
              Sinalizações <span className="font-medium normal-case text-[#94A3B8]">(opcional)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([
                { key: 'dosage_change' as const, label: 'Mudança de dosagem', icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'text-[#B45309]', bg: 'bg-[#FFFBF0]', border: 'border-[#F3E8C8]' },
                { key: 'new_medication' as const, label: 'Novo medicamento', icon: <PlusCircle className="h-3.5 w-3.5" />, color: 'text-[#007A65]', bg: 'bg-[#F4FBF8]', border: 'border-[#CFEDE6]' },
                { key: 'medication_suspended' as const, label: 'Medicamento suspenso', icon: <MinusCircle className="h-3.5 w-3.5" />, color: 'text-[#D9474F]', bg: 'bg-[#FFF7F7]', border: 'border-[#F3D6D8]' },
                { key: 'total_change' as const, label: 'Mudança total da prescrição', icon: <RefreshCw className="h-3.5 w-3.5" />, color: 'text-[#6D28D9]', bg: 'bg-[#F5EDFF]', border: 'border-[#E9D5FF]' },
              ]).map((flag) => {
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
                      'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition-all active:scale-[0.98] text-left',
                      isActive
                        ? `${flag.bg} ${flag.border} ${flag.color} shadow-[0_4px_12px_rgba(0,0,0,0.06)]`
                        : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#BFD8FF] hover:bg-[#F8FAFC]'
                    )}
                  >
                    <span className={isActive ? flag.color : 'text-[#94A3B8]'}>{flag.icon}</span>
                    {flag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#64748B]">
              Observação <span className="font-medium normal-case text-[#94A3B8]">(opcional)</span>
            </label>
            <Textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Informações complementares sobre a receita, alergias, medicamentos anteriores..."
              icon={<StickyNote className="h-4 w-4 text-[#94A3B8]" />}
              rows={4}
              className="rounded-xl border-[#E2E8F0] bg-[#F8FAFC] text-sm font-semibold text-[#001B3D] placeholder:text-[#94A3B8] focus:border-[#1466F5] focus:ring-[#1466F5]/20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3 border-t border-[#F1F5F9] pt-5">
          <Button
            type="submit"
            disabled={!!formError || isSubmitting}
            className="h-11 flex-1 rounded-xl bg-[#00BB94] text-sm font-extrabold text-white shadow-[0_10px_28px_rgba(0,187,148,0.28)] transition-all hover:bg-[#00A885] hover:shadow-[0_14px_36px_rgba(0,187,148,0.34)] active:scale-[0.99] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Salvando...' : 'Salvar Receita'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="h-11 rounded-xl border border-[#DCE5EE] bg-[#F8FAFC] px-5 text-sm font-extrabold text-[#4A5D73] hover:bg-white hover:text-[#001B3D]"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PrescriptionForm;
