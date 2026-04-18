import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { extractPlaceholders } from '../utils/templateUtils';
import { fieldHints, extraFieldsByTemplate, itemListConfigByTemplate } from '../utils/mockData';
import { AlertCircle, User, CreditCard, Calendar, Hash, Type, AlignLeft, Camera, X, Plus, Trash2, List, CheckSquare } from 'lucide-react';

interface DynamicFieldsFormProps {
  templateText: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  templateId?: string;
}

const getTodayInputDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Componente para campo de lista de itens (fórmulas, etc.) ---
interface ItemListFieldProps {
  fieldKey: string;
  label: string;
  templateId?: string;
  items: Array<{ name: string; quantity: string }>;
  onAdd: (name: string, quantity: string) => void;
  onRemove: (index: number) => void;
}

const ItemListField: React.FC<ItemListFieldProps> = ({ fieldKey, label, templateId, items, onAdd, onRemove }) => {
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const config = templateId ? itemListConfigByTemplate[templateId] : undefined;

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName, newQty || '1');
    setNewName('');
    setNewQty('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div key={fieldKey} className="space-y-3">
      <Label className="text-sm font-medium text-[#96c5a9] pl-1 flex items-center gap-2">
        <List size={16} className="text-[#96c5a9]/60" />
        {config?.label || label}
      </Label>

      {/* Itens adicionados */}
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#264532]/30 border border-white/10 group"
            >
              <span className="text-xs font-bold text-[#96c5a9]/60 w-5">{index + 1}.</span>
              <span className="flex-1 text-sm text-white">{item.name}</span>
              <span className="text-sm font-semibold text-blue-300">{item.quantity} {config?.qtyUnit || 'un.'}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-1 rounded text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                title="Remover item"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário para adicionar novo item */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500 pl-1 mb-1 block">{config?.itemLabel || 'Item'}</label>
          <div className="relative">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite ou selecione..."
              list={`${fieldKey}-suggestions`}
              className="w-full h-10 rounded-lg border border-white/10 bg-[#264532]/30 text-white text-sm px-3 placeholder:text-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
            />
            {config?.suggestions && (
              <datalist id={`${fieldKey}-suggestions`}>
                {config.suggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            )}
          </div>
        </div>
        <div className="w-24">
          <label className="text-xs text-gray-500 pl-1 mb-1 block">{config?.qtyLabel || 'Qtd'}</label>
          <input
            type="number"
            min="1"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="1"
            className="w-full h-10 rounded-lg border border-white/10 bg-[#264532]/30 text-white text-sm px-3 text-center placeholder:text-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="h-10 px-3 rounded-lg bg-green-600/30 text-green-300 border border-green-500/20 hover:bg-green-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
        >
          <Plus size={16} />
          <span className="text-sm">Adicionar</span>
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-2">Nenhum item adicionado ainda.</p>
      )}
    </div>
  );
};

export const DynamicFieldsForm: React.FC<DynamicFieldsFormProps> = ({
  templateText,
  values,
  onChange,
  templateId,
}) => {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Detectar chaves automaticamente quando o template mudar
  // + adicionar campos extras (como fotos) que não estão no templateText
  const keys = useMemo(() => {
    const templateKeys = extractPlaceholders(templateText);
    const extras = templateId ? (extraFieldsByTemplate[templateId] || []) : [];
    return [...templateKeys, ...extras];
  }, [templateText, templateId]);

  useEffect(() => {
    if (
      templateId === 'solicitacao_curativo' &&
      keys.includes('DATA_SOLICITACAO_CURATIVO') &&
      !values.DATA_SOLICITACAO_CURATIVO
    ) {
      onChange('DATA_SOLICITACAO_CURATIVO', getTodayInputDate());
    }
  }, [keys, onChange, templateId, values.DATA_SOLICITACAO_CURATIVO]);

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
    if (key.includes('FOTO')) return <Camera size={18} />;
    if (key.includes('FORMULA') || key.includes('ITEMS')) return <List size={18} />;
    
    switch (type) {
      case 'date': return <Calendar size={18} />;
      case 'number': return <Hash size={18} />;
      case 'textarea': return <AlignLeft size={18} />;
      case 'photo': return <Camera size={18} />;
      case 'item-list': return <List size={18} />;
      case 'select': return <List size={18} />;
      case 'checkbox': return <CheckSquare size={18} />;
      default: return <Type size={18} />;
    }
  };

  // --- Gerenciamento de itens para campos tipo "item-list" ---
  const getItemsFromValue = useCallback((key: string): Array<{ name: string; quantity: string }> => {
    const raw = values[key];
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }, [values]);

  const setItems = useCallback((key: string, items: Array<{ name: string; quantity: string }>) => {
    onChange(key, JSON.stringify(items));
  }, [onChange]);

  const addItem = useCallback((key: string, name: string, quantity: string) => {
    if (!name.trim()) return;
    const items = getItemsFromValue(key);
    items.push({ name: name.trim(), quantity: quantity.trim() || '1' });
    setItems(key, items);
  }, [getItemsFromValue, setItems]);

  const removeItem = useCallback((key: string, index: number) => {
    const items = getItemsFromValue(key);
    items.splice(index, 1);
    setItems(key, items);
  }, [getItemsFromValue, setItems]);

  const handlePhotoChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      onChange(key, base64);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = (key: string) => {
    onChange(key, '');
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = '';
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

          // Renderização especial para campo de lista de itens
          if (type === 'item-list') {
            return (
              <ItemListField
                key={key}
                fieldKey={key}
                label={label}
                templateId={templateId}
                items={getItemsFromValue(key)}
                onAdd={(name, qty) => addItem(key, name, qty)}
                onRemove={(index) => removeItem(key, index)}
              />
            );
          }

          // Renderização especial para campo de checkbox
          if (type === 'checkbox') {
            return (
              <div key={key} className="flex items-center space-x-3 p-3 rounded-xl border border-white/10 bg-[#264532]/20 hover:bg-[#264532]/30 transition-colors">
                <input
                  type="checkbox"
                  id={key}
                  checked={value === 'true'}
                  onChange={(e) => onChange(key, e.target.checked ? 'true' : '')}
                  className="w-5 h-5 rounded border-white/20 bg-black/20 text-green-500 focus:ring-green-500/50 focus:ring-offset-0 transition-all"
                />
                <Label htmlFor={key} className="text-sm font-medium text-[#96c5a9] cursor-pointer select-none flex-1">
                  {label}
                </Label>
              </div>
            );
          }

          // Renderização especial para campo de foto
          if (type === 'photo') {
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-sm font-medium text-[#96c5a9] pl-1">
                  {label}
                </Label>
                <div className="relative">
                  {value ? (
                    <div className="relative rounded-xl border border-white/10 bg-[#264532]/30 overflow-hidden">
                      <img 
                        src={value} 
                        alt={label}
                        className="w-full h-40 object-contain bg-black/20"
                      />
                      <button
                        type="button"
                        onClick={() => clearPhoto(key)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                        title="Remover foto"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor={key}
                      className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-white/10 bg-[#264532]/20 cursor-pointer hover:border-green-500/30 hover:bg-[#264532]/40 transition-all"
                    >
                      <Camera size={24} className="text-[#96c5a9]/40" />
                      <span className="text-xs text-[#96c5a9]/50">{placeholder}</span>
                    </label>
                  )}
                  <input
                    ref={(el) => { fileInputRefs.current[key] = el; }}
                    id={key}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoChange(key, e)}
                    className="hidden"
                  />
                </div>
              </div>
            );
          }

          // Renderização especial para campo de select
          if (type === 'select' && hint?.options) {
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-sm font-medium text-[#96c5a9] pl-1">
                  {label}
                </Label>
                <div className="relative group">
                  <div className="absolute z-10 left-3 top-1/2 -translate-y-1/2 text-[#96c5a9]/40 group-focus-within:text-[#96c5a9] transition-colors pointer-events-none">
                    {icon}
                  </div>
                  <Select value={value} onValueChange={(val) => onChange(key, val)}>
                    <SelectTrigger
                        id={key}
                        className="w-full rounded-xl border border-white/10 bg-[#264532]/30 text-white h-11 pl-10 focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50 transition-all text-sm"
                    >
                      <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {hint.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          }

          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-sm font-medium text-[#96c5a9] pl-1">
                {label}
              </Label>
              
              <div className="relative group">
                {type === 'textarea' && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#96c5a9]/40 group-focus-within:text-[#96c5a9] transition-colors pointer-events-none">
                    <div className="mt-[-35px]">{icon}</div>
                  </div>
                )}
                
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
                    icon={icon}
                    className="rounded-xl border-white/10 bg-[#264532]/30 text-white placeholder:text-gray-500 focus:border-green-500/50 focus:ring-[#96c5a9]/20 h-11 transition-all"
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
