import React, { useState, useMemo } from 'react';
import { Search, FileText, ChevronRight, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
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
          <span key={i} className="text-[#96c5a9] font-bold bg-[#96c5a9]/20 rounded px-0.5 shadow-sm">
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
    <div className="flex flex-col h-full bg-[#1a2c22]">
      {/* Search Header */}
      <div className="p-4 pt-5 pb-3 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between px-1">
             <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Buscar Modelos
             </span>
             {searchTerm && (
                 <span className="text-xs text-[#96c5a9] font-medium animate-in fade-in duration-300">
                    {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}
                 </span>
             )}
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-[#96c5a9] transition-colors" />
          <Input
            placeholder="Pressione para buscar por título ou tag..."
            className="pl-10 pr-9 bg-[#264532]/40 border-white/5 text-white placeholder:text-gray-500 focus:bg-[#264532] focus:border-[#96c5a9]/50 focus:ring-[#96c5a9]/20 transition-all h-10 rounded-xl text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors animate-in zoom-in duration-200"
              title="Limpar busca"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      
      {/* List Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-4 space-y-6">
        {totalResults === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-3 animate-in fade-in zoom-in-95 duration-300">
             <div className="p-3 bg-white/5 rounded-full ring-1 ring-white/5">
                <Search className="h-6 w-6 opacity-30" />
             </div>
             <div className="text-center">
                <p className="text-sm font-medium">Nenhum modelo encontrado</p>
                <p className="text-xs opacity-60 mt-1">Tente buscar por outros termos ou tags (#diabetes, #has, etc)</p>
             </div>
             <button 
                onClick={() => setSearchTerm('')}
                className="mt-2 text-xs text-[#96c5a9] hover:text-[#96c5a9]/80 hover:underline transition-colors"
             >
                Limpar busca
             </button>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.name} className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#96c5a9] opacity-70">
                  {group.name}
                </span>
                <div className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent" />
              </div>

              <div className="space-y-2">
                {group.items.map((template) => {
                  const isSelected = selectedId === template.id;
                  return (
                    <div
                      key={template.id}
                      onClick={() => onSelect(template)}
                      className={cn(
                        "p-3 rounded-xl border transition-all duration-200 cursor-pointer group flex items-start gap-3 relative overflow-hidden",
                        isSelected
                          ? "bg-[#264532] border-[#96c5a9]/30 shadow-lg shadow-black/20"
                          : "bg-[#1a2c22] border-transparent hover:bg-[#264532]/30 hover:border-[#96c5a9]/10"
                      )}
                    >
                      {/* Visual Indicator Line for Selected */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#96c5a9]" />
                      )}

                      <div className={cn(
                        "p-2.5 rounded-lg border shrink-0 transition-colors mt-0.5",
                        isSelected 
                          ? "bg-[#203a2b] border-[#96c5a9]/20 text-[#96c5a9] shadow-inner"
                          : "bg-[#14211a] border-white/5 text-gray-500 group-hover:text-[#96c5a9] group-hover:border-[#96c5a9]/20"
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
                              isSelected ? "text-white" : "text-gray-300 group-hover:text-white"
                            )}
                          />
                          {isSelected && <ChevronRight size={14} className="text-[#96c5a9] shrink-0 mt-0.5" />}
                        </div>
                        {template.description && (
                          <HighlightedText 
                            text={template.description} 
                            searchTerm={searchTerm}
                            className={cn(
                              "text-xs mt-1.5 line-clamp-2 transition-colors leading-relaxed",
                              isSelected ? "text-gray-300" : "text-gray-500 group-hover:text-gray-400"
                            )}
                          />
                        )}
                        
                        {/* Tags display (only when searching or selected) */}
                        {template.tags && (searchTerm || isSelected) && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {template.tags.map(tag => (
                              <span 
                                key={tag} 
                                className={cn(
                                  "text-[9px] px-1.5 py-0.5 rounded-md border transition-colors",
                                  isSelected 
                                    ? "bg-[#96c5a9]/10 border-[#96c5a9]/20 text-[#96c5a9]" 
                                    : "bg-white/5 border-white/5 text-gray-500 group-hover:border-white/10"
                                )}
                              >
                                #{tag}
                              </span>
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

