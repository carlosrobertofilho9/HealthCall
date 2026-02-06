import React, { useMemo } from 'react';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { extractPlaceholders } from '../utils/templateUtils';
import { fieldHints } from '../utils/mockData';
import { AlertCircle, User, CreditCard, Calendar, Hash, Type, AlignLeft } from 'lucide-react';

interface DynamicFieldsFormProps {
  templateText: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export const DynamicFieldsForm: React.FC<DynamicFieldsFormProps> = ({
  templateText,
  values,
  onChange,
}) => {
  // Detectar chaves automaticamente quando o template mudar
  const keys = useMemo(() => extractPlaceholders(templateText), [templateText]);

  // Função para transformar CHAVE_COM_UNDERSCORE em "Chave Com Underscore"
  const humanizeKey = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getIcon = (key: string, type: string) => {
    if (key.includes('NOME') || key.includes('PACIENTE')) return <User size={18} />;
    if (key.includes('CNS') || key.includes('CPF') || key.includes('DOC')) return <CreditCard size={18} />;
    
    switch (type) {
      case 'date': return <Calendar size={18} />;
      case 'number': return <Hash size={18} />;
      case 'textarea': return <AlignLeft size={18} />;
      default: return <Type size={18} />;
    }
  };

  if (keys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-white/5 rounded-xl bg-[#264532]/10 text-[#96c5a9]/60 border-dashed gap-2">
        <AlertCircle className="w-8 h-8 opacity-50" />
        <p className="text-sm">Este modelo não possui campos variáveis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5">
        {keys.map((key) => {
          const hint = fieldHints[key];
          const label = hint?.label || humanizeKey(key);
          const type = hint?.type || 'text';
          const placeholder = hint?.placeholder || `Digite o valor para ${key}...`;
          const value = values[key] || '';
          const icon = getIcon(key, type);

          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-sm font-medium text-[#96c5a9] pl-1">
                {label}
              </Label>
              
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#96c5a9]/40 group-focus-within:text-[#96c5a9] transition-colors pointer-events-none">
                  {type === 'textarea' ? <div className="mt-[-35px]">{icon}</div> : icon}
                </div>
                
                {type === 'textarea' ? (
                  <textarea
                    id={key}
                    value={value}
                    onChange={(e) => onChange(key, e.target.value)}
                    placeholder={placeholder}
                    className="flex min-h-[100px] w-full rounded-xl border border-white/10 bg-[#264532]/30 pl-10 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-all"
                    rows={5}
                  />
                ) : (
                  <Input
                    id={key}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(key, e.target.value)}
                    placeholder={placeholder}
                    className="rounded-xl border-white/10 bg-[#264532]/30 text-white placeholder:text-gray-500 focus:border-green-500/50 focus:ring-[#96c5a9]/20 h-11 pl-10 transition-all"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
