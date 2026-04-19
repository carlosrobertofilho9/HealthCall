import React, { useState, useMemo } from 'react';
import { Search, FileText, ChevronRight, X } from 'lucide-react';
import { Input, Badge, Button } from '@/components/ui';
import { Template, TemplateCategory } from '../utils/mockData';
import { cn } from '@/lib/utils';

interface TemplateListProps {
  templates: Template[];
  onSelect: (template: Template) => void;
  selectedId?: string;
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

  // Create a combined regex for all terms
  // Example: term "ae" -> regex "(?:[aá...][eé...])"
  const pattern = terms.map(getAccentInsensitiveRegex).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        // Check if this part matches any of our terms (accent-insensitive)
        const isMatch = regex.test(part);
        // Reset lastIndex because test() advances it for global regexes
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

export const TemplateList: React.FC<TemplateListProps> = ({ 
  templates, 
  onSelect, 
  selectedId 
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

    // Define consistent order for categories
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
    <div className="flex flex-col bg-card xl:h-full">
      <div className="space-y-3 border-b border-border p-4 pb-3 pt-5">
        <div className="flex items-center justify-between px-1">
             <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Buscar Modelos
             </span>
             {searchTerm && (
                 <span className="animate-in fade-in text-xs font-medium text-primary duration-300">
                    {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}
                 </span>
             )}
        </div>

        <div className="relative group">
          <Input
            placeholder="Pressione para buscar por título ou tag..."
            icon={<Search className="h-4 w-4" />}
            className="h-10 rounded-xl bg-input/70 pr-9 text-sm transition-all focus:bg-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 animate-in rounded-full border-0 text-muted-foreground zoom-in hover:text-foreground duration-200"
              title="Limpar busca"
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-6 p-3 pt-4 xl:overflow-y-auto">
        {totalResults === 0 ? (
          <div className="animate-in flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground fade-in zoom-in-95 duration-300">
             <div className="rounded-full border border-border bg-secondary/30 p-3">
                <Search className="h-6 w-6 opacity-30" />
             </div>
             <div className="text-center">
                <p className="text-sm font-medium">Nenhum modelo encontrado</p>
                <p className="text-xs opacity-60 mt-1">Tente buscar por outros termos ou tags (#diabetes, #has, etc)</p>
             </div>
             <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="mt-2 h-9 border-0 text-xs text-primary hover:text-primary"
             >
                Limpar busca
             </Button>
          </div>
        ) : (
          filteredGroups.map((group) => (
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
                    <div
                      key={template.id}
                      onClick={() => onSelect(template)}
                      className={cn(
                        "group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-xl border p-3 transition-all duration-200",
                        isSelected
                          ? "border-primary/30 bg-secondary shadow-lg shadow-background/40"
                          : "border-transparent bg-card hover:border-primary/10 hover:bg-secondary/35"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-primary" />
                      )}

                      <div className={cn(
                        "mt-0.5 shrink-0 rounded-lg border p-2.5 transition-colors",
                        isSelected 
                          ? "border-primary/20 bg-background/40 text-primary shadow-inner"
                          : "border-border bg-background/30 text-muted-foreground group-hover:border-primary/20 group-hover:text-primary"
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
                          {isSelected && <ChevronRight size={14} className="mt-0.5 shrink-0 text-primary" />}
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
                                  "rounded-md px-1.5 py-0.5 text-[9px] transition-colors",
                                  isSelected 
                                    ? "border-primary/20 bg-primary/10 text-primary"
                                    : "border-border bg-secondary/40 text-muted-foreground group-hover:border-border"
                                )}
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
