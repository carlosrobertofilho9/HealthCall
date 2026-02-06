import React from 'react';
import { cn } from '@/lib/utils';
import { FileText, Edit, Eye } from 'lucide-react';

interface WidgetProps {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
  className?: string; // For the outer container
  contentClassName?: string; // For the inner content area
}

const BaseWidget: React.FC<WidgetProps> = ({ 
  children, 
  title, 
  icon, 
  className,
  contentClassName 
}) => {
  return (
    <div className={cn(
      "bg-[#1a2c22] rounded-2xl shadow-2xl border border-white/5 flex flex-col h-full overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex flex-col gap-1 p-6 pb-4 border-b border-white/5 shrink-0">
         <h2 className="text-white text-xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-[#264532] rounded-lg border border-white/5 shadow-inner">
               {icon || <FileText className="text-[#96c5a9]" size={20} />}
            </div>
            {title}
         </h2>
      </div>
      
      {/* Content */}
      <div className={cn("flex-1 min-h-0 overflow-hidden flex flex-col", contentClassName)}>
        {children}
      </div>
    </div>
  );
};

export const TemplatesWidget: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BaseWidget 
      title="Modelos" 
      icon={<FileText className="text-[#96c5a9]" size={20} />}
      className="lg:col-span-1"
      contentClassName="p-0"
    >
      {children}
    </BaseWidget>
  );
};

export const DocumentFormWidget: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => {
  return (
    <BaseWidget 
      title={title || "Preenchimento"} 
      icon={<Edit className="text-[#96c5a9]" size={20} />}
      className="lg:col-span-1"
      contentClassName="p-6 overflow-y-auto custom-scrollbar"
    >
      {children}
    </BaseWidget>
  );
};

export const PreviewWidget: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BaseWidget 
      title="Visualização" 
      icon={<Eye className="text-[#96c5a9]" size={20} />}
      className="lg:col-span-1" 
      contentClassName="bg-white/5 relative"
    >
      {children}
    </BaseWidget>
  );
};
