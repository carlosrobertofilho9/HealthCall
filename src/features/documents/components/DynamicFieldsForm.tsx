import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Label,
  Input,
  Textarea,
  Button,
  DatePicker,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
import { cn, formatCPF, formatCNS } from '@/lib/utils';
import { extractPlaceholders } from '../utils/templateUtils';
import { fieldHints, extraFieldsByTemplate, itemListConfigByTemplate } from '../utils/mockData';
import {
  clampIsoDateToFutureRange,
  getTodayIsoDate,
  DOCUMENTS_MAX_FUTURE_DAYS,
} from '../utils/dateSequence';
import {
  AlertCircle,
  User,
  CreditCard,
  Calendar,
  Hash,
  Type,
  AlignLeft,
  Camera,
  X,
  Plus,
  Trash2,
  List,
  CheckSquare
} from 'lucide-react';

// Animation variants for form items
const formItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, scale: 0.95, height: 0 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    height: 'auto',
    transition: { type: 'spring', stiffness: 400, damping: 30 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    height: 0,
    transition: { duration: 0.2 }
  }
};

interface DynamicFieldsFormProps {
  templateText: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  templateId?: string;
  missingKeys?: string[];
}

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
      <Label className="flex items-center gap-2 pl-1 text-sm font-medium text-primary">
        <List size={16} className="text-primary/70" />
        {config?.label || label}
      </Label>

      {/* Itens adicionados */}
      <div className="space-y-1.5">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={`${item.name}-${index}`}
              variants={listItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              className="group flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2 transition-all hover:bg-secondary/50"
            >
              <span className="w-5 text-xs font-bold text-primary/70">{index + 1}.</span>
              <span className="flex-1 text-sm text-foreground">{item.name}</span>
              <Badge className="border-chart-3/20 bg-chart-3/10 text-chart-3 shadow-xs">
                {item.quantity} {config?.qtyUnit || 'un.'}
              </Badge>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                  className="h-7 w-7 border-0 text-destructive/55 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  title="Remover item"
                >
                  <Trash2 size={14} />
                </Button>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="mb-1 block pl-1 text-xs text-muted-foreground">{config?.itemLabel || 'Item'}</Label>
          <div className="relative">
            <Input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite ou selecione..."
              list={`${fieldKey}-suggestions`}
              icon={<List size={16} />}
              className="h-10 rounded-lg bg-input/70 text-sm focus:bg-input transition-all"
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
          <Label className="mb-1 block pl-1 text-xs text-muted-foreground">{config?.qtyLabel || 'Qtd'}</Label>
          <Input
            type="number"
            min="1"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="1"
            icon={null}
            className="h-10 rounded-lg bg-input/70 text-center text-sm focus:bg-input transition-all"
          />
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="h-10 rounded-lg px-3 shadow-sm hover:shadow-md"
          >
            <Plus size={16} />
            <span className="text-sm">Adicionar</span>
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {items.length === 0 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="py-2 text-center text-xs text-muted-foreground italic"
          >
            Nenhum item adicionado ainda.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DynamicFieldsForm: React.FC<DynamicFieldsFormProps> = ({
  templateText,
  values,
  onChange,
  templateId,
  missingKeys = [],
}) => {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
      onChange('DATA_SOLICITACAO_CURATIVO', getTodayIsoDate());
    }
  }, [keys, onChange, templateId, values.DATA_SOLICITACAO_CURATIVO]);

  useEffect(() => {
    if (templateId === 'controle_pressao' && keys.includes('MAPA_DATA_INICIAL') && !values.MAPA_DATA_INICIAL) {
      onChange('MAPA_DATA_INICIAL', getTodayIsoDate());
    }

    if (templateId === 'controle_glicemico' && keys.includes('GLICEMIA_DATA_INICIAL') && !values.GLICEMIA_DATA_INICIAL) {
      onChange('GLICEMIA_DATA_INICIAL', getTodayIsoDate());
    }
  }, [
    keys,
    onChange,
    templateId,
    values.GLICEMIA_DATA_INICIAL,
    values.MAPA_DATA_INICIAL,
  ]);

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

  const formatDocumentValueByFieldKey = useCallback((fieldKey: string, rawValue: string) => {
    const normalizedKey = fieldKey.toUpperCase();
    const hasCPF = normalizedKey.includes('CPF');
    const hasCNS = normalizedKey.includes('CNS');
    const hasDOC = normalizedKey.includes('DOC');

    if (!hasCPF && !hasCNS && !hasDOC) {
      return rawValue;
    }

    const digits = rawValue.replace(/\D/g, '');

    if (hasCPF && !hasCNS) {
      return formatCPF(digits);
    }

    if (hasCNS && !hasCPF) {
      return formatCNS(digits);
    }

    if (digits.length <= 11) {
      return formatCPF(digits);
    }

    return formatCNS(digits);
  }, []);

  if (keys.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/15 p-8 text-primary/70"
      >
        <AlertCircle className="w-8 h-8 opacity-50" />
        <p className="text-sm">Este modelo não possui campos variáveis.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
        className="grid gap-5"
      >
        {keys.map((key) => {
          const hint = fieldHints[key];
          const label = hint?.label || humanizeKey(key);
          const type = hint?.type || 'text';
          const placeholder = hint?.placeholder || `Digite o valor para ${key}...`;
          const value = values[key] || '';
          const icon = getIcon(key, type);

          const renderField = () => {
            if (key === 'MAPA_DATA_INICIAL' || key === 'GLICEMIA_DATA_INICIAL') {
              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="pl-1 text-sm font-medium text-primary">
                    {label}
                  </Label>
                  <DatePicker
                    value={value || getTodayIsoDate()}
                    onChange={(nextValue) => onChange(key, clampIsoDateToFutureRange(nextValue))}
                    minDate={new Date()}
                    maxDate={(() => {
                      const d = new Date();
                      d.setDate(d.getDate() + DOCUMENTS_MAX_FUTURE_DAYS);
                      return d;
                    })()}
                  >
                    {({ open, value: val }) => (
                      <div className="rounded-xl border border-border bg-secondary/20 p-3 transition-colors hover:bg-secondary/30">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Data inicial do monitoramento</p>
                            <p className="text-sm font-semibold text-foreground">
                              {val ? new Date(val + 'T12:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              }) : '___/___'}
                            </p>
                          </div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="gap-2 shadow-sm"
                              onClick={open}
                            >
                              <Calendar className="h-4 w-4" />
                              Selecionar
                            </Button>
                          </motion.div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Permite de hoje até +{DOCUMENTS_MAX_FUTURE_DAYS} dias.</p>
                      </div>
                    )}
                  </DatePicker>
                </div>
              );
            }

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

            if (type === 'checkbox') {
              return (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.01, backgroundColor: 'rgba(var(--secondary), 0.5)' }}
                  className="flex items-center space-x-3 rounded-xl border border-border bg-secondary/25 p-3 transition-all"
                >
                  <input
                    type="checkbox"
                    id={key}
                    checked={value === 'true'}
                    onChange={(e) => onChange(key, e.target.checked ? 'true' : '')}
                    className="h-5 w-5 rounded border-border bg-input accent-primary transition-all focus:ring-2 focus:ring-ring focus:ring-offset-0"
                  />
                  <Label htmlFor={key} className="flex-1 cursor-pointer select-none text-sm font-medium text-primary">
                    {label}
                  </Label>
                </motion.div>
              );
            }

            if (type === 'photo') {
              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="pl-1 text-sm font-medium text-primary">
                    {label}
                  </Label>
                  <div className="relative">
                    <AnimatePresence mode="wait">
                      {value ? (
                        <motion.div 
                          key="photo-preview"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="relative overflow-hidden rounded-xl border border-border bg-secondary/30 shadow-md"
                        >
                          <img 
                            src={value} 
                            alt={label}
                            className="h-40 w-full bg-background/40 object-contain"
                          />
                          <motion.div 
                            whileHover={{ scale: 1.1 }} 
                            whileTap={{ scale: 0.9 }} 
                            className="absolute right-2 top-2"
                          >
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => clearPhoto(key)}
                              className="h-8 w-8 rounded-lg shadow-lg"
                              title="Remover foto"
                            >
                              <X size={14} />
                            </Button>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.label
                          key="photo-upload"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          htmlFor={key}
                          className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/25 transition-all hover:border-primary/35 hover:bg-secondary/40 hover:shadow-inner"
                        >
                          <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          >
                            <Camera size={24} className="text-primary/45" />
                          </motion.div>
                          <span className="text-xs text-muted-foreground">{placeholder}</span>
                        </motion.label>
                      )}
                    </AnimatePresence>
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

            if (type === 'select' && hint?.options) {
              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="pl-1 text-sm font-medium text-primary">
                    {label}
                  </Label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                      {icon}
                    </div>
                    <Select value={value} onValueChange={(val) => onChange(key, val)}>
                      <SelectTrigger
                          id={key}
                          className="h-11 w-full rounded-xl bg-input/70 pl-10 text-sm transition-all focus:bg-input hover:border-primary/20"
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
                <Label htmlFor={key} className="pl-1 text-sm font-medium text-primary">
                  {label}
                </Label>
                
                <div className="relative group">
                  {type === 'textarea' ? (
                    <Textarea
                      id={key}
                      value={value}
                      onChange={(e) => onChange(key, formatDocumentValueByFieldKey(key, e.target.value))}
                      placeholder={placeholder}
                      icon={<span className="text-muted-foreground">{icon}</span>}
                      className="min-h-24 rounded-xl bg-input/70 text-sm focus:bg-input transition-all"
                      rows={5}
                    />
                  ) : (
                    <Input
                      id={key}
                      type={type}
                      value={value}
                      onChange={(e) => onChange(key, formatDocumentValueByFieldKey(key, e.target.value))}
                      placeholder={placeholder}
                      icon={icon}
                      className="h-11 rounded-xl bg-input/70 transition-all focus:bg-input"
                    />
                  )}
                </div>
              </div>
            );
          };

          const isMissing = missingKeys.includes(key);

          return (
            <motion.div 
              key={key} 
              variants={formItemVariants}
              animate={isMissing ? { x: [0, -2, 2, -2, 2, 0] } : {}}
              transition={isMissing ? { duration: 0.4 } : {}}
            >
              <div className={cn(
                "transition-all duration-300 rounded-xl p-1",
                isMissing && "bg-destructive/5 ring-1 ring-destructive/20"
              )}>
                {renderField()}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

