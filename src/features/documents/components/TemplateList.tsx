import React, { useState, useMemo } from 'react';
import { Search, FileText, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Badge, Button } from '@/components/ui';
import { Template, TemplateCategory } from '../utils/mockData';
import { cn } from '@/lib/utils';

interface TemplateListProps {
  templates: Template[];
  onSelect: (template: Template) => void;
  selectedId?: string;
  isLoading?: boolean;
}

// Helper to remove accents/diacritics
function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Helper to create a regex that matches the term regardless of accents
function getAccentInsensitiveRegex(term: string) {
  const normalized = removeAccents(term);
  
  return normalized
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex chars first
    .split('')
    .map((char) => {
      const accents: Record<string, string> = {
        'a': '[aáàâãä]',
        'e': '[eéèêë]',
        'i': '[iíìîï]',
        'o': '[oóòôõö]',
        'u': '[uúùûü]',
        'c': '[cç]',
        'n': '[nñ]'
      };
      return accents[char.toLowerCase()] || char;
    })
    .join('');
}

const SkeletonItem = () => (
  <div className="flex animate-pulse items-start gap-3 rounded-xl border border-border/50 p-3 bg-card/50">
    <div className="mt-0.5 h-10 w-10 shrink-0 rounded-lg bg-muted/20" />
    <div className="flex-1 space-y-2 py-1">
      <div className="h-4 w-3/4 rounded bg-muted/20" />
      <div className="h-3 w-full rounded bg-muted/10" />
      <div className="h-3 w-1/2 rounded bg-muted/10" />
    </div>
  </div>
);

const HighlightedText: React.FC<{ text: string; searchTerm: string; className?: string }> = ({ 
  text, 
  searchTerm,
  className 
}) => {
  if (!searchTerm.trim()) return <span className={className}>{text}</span>;

  const terms = removeAccents(searchTerm)
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 0);
  
  if (terms.length === 0) return <span className={className}>{text}</span>;

  const pattern = terms.map(getAccentInsensitiveRegex).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isMatch = regex.test(part);
        regex.lastIndex = 0; 
        
        return isMatch ? (
          <span key={i} className="rounded bg-primary/15 px-0.5 font-bold text-primary shadow-sm">
            {part}
          </span>
        ) : (
          part
        );
      })}
    </span>
  );
};

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

const hapticTap = {
  scale: 0.97,
  transition: { type: 'spring', stiffness: 600, damping: 30 }
};

const hapticHover = {
  scale: 1.02,
  y: -2,
  transition: { type: 'spring', stiffness: 400, damping: 25 }
};

export const TemplateList: React.FC<TemplateListProps> = ({ 
  templates, 
  onSelect, 
  selectedId,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = useMemo(() => {
    let list = templates;
    if (searchTerm.trim()) {
      const terms = removeAccents(searchTerm.toLowerCase())
        .split(/\s+/)
        .filter(t => t.length > 0);
      
      list = templates.filter(t => {
        const searchableText = removeAccents([
          t.title,
          t.description || '',
          t.category,
          ...(t.tags || [])
        ].join(' ').toLowerCase());
        
        return terms.every(term => searchableText.includes(term));
      });
    }

    const order: TemplateCategory[] = ['Monitoramento', 'Protocolos e Termos', 'Administrativo', 'Orientações e Capas'];
    
    const groups: Record<string, Template[]> = {};
    list.forEach(t => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });

    return order
      .filter(cat => groups[cat] && groups[cat].length > 0)
      .map(cat => ({
        name: cat,
        items: groups[cat]
      }));
  }, [templates, searchTerm]);

  const totalResults = useMemo(() => 
    filteredGroups.reduce((acc, g) => acc + g.items.length, 0),
    [filteredGroups]
  );

  return (
    <div className="flex flex-col lg:h-full">
      <div className="space-y-3 border-b border-border p-4 pb-3 pt-5">
        <div className="flex items-center justify-between px-1">
             <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Buscar Modelos
             </span>
             <AnimatePresence mode="wait">
               {searchTerm && (
                   <motion.span 
                    key="results-count"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-xs font-medium text-primary"
                   >
                      {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}
                   </motion.span>
               )}
             </AnimatePresence>
        </div>

        <div className="relative group">
          <Input
            placeholder="Pressione para buscar por título ou tag..."
            icon={<Search className="h-4 w-4" />}
            className="h-10 rounded-xl bg-input/70 pr-9 text-sm transition-all focus:bg-input hover:border-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSearchTerm('')}
              whileTap={hapticTap}
              className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 animate-in rounded-full border-0 text-muted-foreground zoom-in hover:text-foreground duration-200"
              title="Limpar busca"
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-6 p-4 lg:overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div 
              key="loading-skeleton"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 px-1">
                <div className="h-2 w-24 rounded bg-muted/20 animate-pulse" />
                <div className="h-px flex-1 bg-linear-to-r from-border/50 to-transparent" />
              </div>
              {[1, 2, 3, 4, 5].map(i => (
                <motion.div key={i} variants={itemVariants}>
                  <SkeletonItem />
                </motion.div>
              ))}
            </motion.div>
          ) : totalResults === 0 ? (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground"
            >
               <motion.div 
                animate={{ 
                  y: [0, -4, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="rounded-full border border-border bg-secondary/30 p-3"
               >
                  <Search className="h-6 w-6 opacity-30" />
               </motion.div>
               <div className="text-center">
                  <p className="text-sm font-medium">Nenhum modelo encontrado</p>
                  <p className="text-xs opacity-60 mt-1">Tente buscar por outros termos ou tags (#diabetes, #has, etc)</p>
               </div>
               <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  whileTap={hapticTap}
                  className="mt-2 h-9 border-0 text-xs text-primary hover:text-primary"
               >
                  Limpar busca
               </Button>
            </motion.div>
          ) : (
            <motion.div 
              key="list-container"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {filteredGroups.map((group) => (
                <div key={group.name} className="space-y-3">
                  <div className="flex items-center gap-3 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
                      {group.name}
                    </span>
                    <div className="h-px flex-1 bg-linear-to-r from-border to-transparent" />
                  </div>

                  <div className="space-y-2">
                    {group.items.map((template) => {
                      const isSelected = selectedId === template.id;
                      return (
                        <motion.div
                          layout
                          key={template.id}
                          variants={itemVariants}
                          whileHover={{ 
                            ...hapticHover,
                            backgroundColor: 'var(--secondary)',
                            transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
                          }}
                          whileTap={hapticTap}
                          onClick={() => onSelect(template)}
                          className={cn(
                            "group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-xl border p-3 transition-all duration-300",
                            isSelected
                              ? "border-primary/40 bg-secondary shadow-lg shadow-primary/5 ring-1 ring-primary/20 scale-[1.01]"
                              : "border-transparent bg-card hover:border-primary/10"
                          )}
                        >
                          {isSelected && (
                            <motion.div 
                              layoutId="active-indicator"
                              className="absolute bottom-0 left-0 top-0 w-[3px] bg-primary" 
                            />
                          )}

                          <div className={cn(
                            "mt-0.5 shrink-0 rounded-lg border p-2.5 transition-all duration-300",
                            isSelected 
                              ? "border-primary/20 bg-background/50 text-primary shadow-inner scale-110"
                              : "border-border bg-background/30 text-muted-foreground group-hover:border-primary/20 group-hover:text-primary group-hover:bg-background/50"
                          )}>
                            {template.icon ? <template.icon size={18} /> : <FileText size={18} />}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                            <div className="flex justify-between items-start gap-2">
                              <HighlightedText 
                                text={template.title} 
                                searchTerm={searchTerm}
                                className={cn(
                                  "text-sm font-semibold truncate transition-colors leading-tight",
                                  isSelected ? "text-card-foreground" : "text-foreground/80 group-hover:text-foreground"
                                )}
                              />
                              <AnimatePresence>
                                {isSelected && (
                                  <motion.div
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -5 }}
                                  >
                                    <ChevronRight size={14} className="shrink-0 text-primary" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            {template.description && (
                              <HighlightedText 
                                text={template.description} 
                                searchTerm={searchTerm}
                                className={cn(
                                  "text-xs mt-1.5 line-clamp-2 transition-colors leading-relaxed",
                                  isSelected ? "text-foreground/75" : "text-muted-foreground group-hover:text-foreground/65"
                                )}
                              />
                            )}

                            {template.tags && (searchTerm || isSelected) && (
                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {template.tags.map(tag => (
                                  <Badge
                                    key={tag} 
                                    className={cn(
                                      "rounded-md px-1.5 py-0.5 text-[9px] transition-all",
                                      isSelected 
                                        ? "border-primary/20 bg-primary/10 text-primary font-medium"
                                        : "border-border bg-secondary/40 text-muted-foreground group-hover:border-border"
                                    )}
                                  >
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

