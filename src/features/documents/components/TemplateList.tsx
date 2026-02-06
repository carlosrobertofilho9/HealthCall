import React, { useState } from 'react';
import { Search, FileText, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Template } from '../utils/mockData';
import { cn } from '@/lib/utils';

interface TemplateListProps {
  templates: Template[];
  onSelect: (template: Template) => void;
  selectedId?: string;
}

export const TemplateList: React.FC<TemplateListProps> = ({ 
  templates, 
  onSelect, 
  selectedId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = templates.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-white/5 bg-[#1a2c22]">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#96c5a9]/50 group-focus-within:text-[#96c5a9] transition-colors" />
          <Input
            placeholder="Buscar modelos..."
            className="pl-10 bg-[#264532]/50 border-white/5 text-white placeholder:text-[#96c5a9]/50 focus:bg-[#264532] focus:border-[#96c5a9]/50 focus:ring-[#96c5a9]/20 transition-all h-10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* List Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[#96c5a9]/50 text-sm gap-2">
             <FileText className="h-8 w-8 opacity-20" />
             <p>Nenhum modelo encontrado.</p>
          </div>
        ) : (
          filtered.map((template) => {
             const isSelected = selectedId === template.id;
             return (
              <div
                key={template.id}
                onClick={() => onSelect(template)}
                className={cn(
                  "p-3 rounded-xl border transition-all duration-200 cursor-pointer group flex items-start gap-3",
                  isSelected
                    ? "bg-[#264532]/40 border-green-500/30 shadow-sm"
                    : "bg-[#1a2c22]/40 border-white/5 hover:bg-[#264532]/20 hover:border-white/10"
                )}
              >
                <div className={cn(
                    "p-2 rounded-lg border shrink-0 transition-colors",
                    isSelected 
                        ? "bg-[#264532] border-green-500/20 text-[#96c5a9]"
                        : "bg-[#1a2c22] border-white/5 text-gray-500 group-hover:text-[#96c5a9] group-hover:border-white/10"
                )}>
                    <FileText size={18} />
                </div>

                <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex justify-between items-start">
                        <h4 className={cn(
                            "text-sm font-semibold truncate pr-2 transition-colors",
                            isSelected ? "text-white" : "text-gray-300 group-hover:text-white"
                        )}>
                            {template.title}
                        </h4>
                        {isSelected && <ChevronRight size={14} className="text-green-500 mt-0.5" />}
                    </div>
                    {template.description && (
                      <p className={cn(
                          "text-xs mt-0.5 line-clamp-2 transition-colors",
                           isSelected ? "text-[#96c5a9]" : "text-gray-500 group-hover:text-[#96c5a9]/70"
                      )}>
                        {template.description}
                      </p>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
