import React from 'react';
import { cn } from '@/lib/utils';
import { FileText, Edit, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

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
    <Card className={cn('flex h-full flex-col overflow-hidden border-border bg-card shadow-xl', className)}>
      <CardHeader className="shrink-0 border-b border-border p-6 pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight text-card-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-primary shadow-inner">
            {icon || <FileText size={20} />}
          </span>
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className={cn('flex min-h-0 flex-1 flex-col overflow-hidden p-0', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
};

export const TemplatesWidget: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BaseWidget 
      title="Modelos" 
      icon={<FileText size={20} />}
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
      icon={<Edit size={20} />}
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
      icon={<Eye size={20} />}
      className="lg:col-span-1" 
      contentClassName="relative bg-background/30"
    >
      {children}
    </BaseWidget>
  );
};
