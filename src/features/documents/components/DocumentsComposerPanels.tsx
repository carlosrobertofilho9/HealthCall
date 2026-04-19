import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import {
  ChevronRight,
  Edit,
  Eraser,
  Eye,
  FileCheck,
  FileText,
  RefreshCw,
} from 'lucide-react';

import { ActionBar, Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Template } from '../utils/mockData';
import { DocumentPdf } from './DocumentPdf';
import { DynamicFieldsForm } from './DynamicFieldsForm';
import { TemplateList } from './TemplateList';

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon,
  className,
  contentClassName,
  children,
}) => {
  return (
    <Card className={cn('flex flex-col border-border bg-card shadow-sm xl:h-full xl:overflow-hidden', className)}>
      <CardHeader className="shrink-0 border-b border-border p-4 pb-3 lg:p-5 lg:pb-4">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-card-foreground lg:text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary text-primary shadow-inner">
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className={cn('flex min-h-0 flex-1 flex-col p-0 xl:overflow-hidden', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
};

interface TemplatesPanelProps {
  templates: Template[];
  selectedTemplateId?: string;
  onSelectTemplate: (template: Template) => void;
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
}) => {
  return (
    <SectionCard title="Modelos" icon={<FileText size={18} />} className="min-h-[28rem] xl:h-full xl:min-h-0">
      <TemplateList templates={templates} onSelect={onSelectTemplate} selectedId={selectedTemplateId} />
    </SectionCard>
  );
};

interface FormPanelProps {
  selectedTemplate: Template | null;
  values: Record<string, string>;
  missingKeys: string[];
  isGenerating: boolean;
  onFieldChange: (key: string, value: string) => void;
  onClearForm: () => void;
  onGenerateDocument: () => void;
}

export const FormPanel: React.FC<FormPanelProps> = ({
  selectedTemplate,
  values,
  missingKeys,
  isGenerating,
  onFieldChange,
  onClearForm,
  onGenerateDocument,
}) => {
  return (
    <SectionCard
      title={selectedTemplate?.title || 'Preenchimento'}
      icon={<Edit size={18} />}
      className="min-h-[28rem] xl:h-full xl:min-h-0"
      contentClassName="p-4 lg:p-5"
    >
      {selectedTemplate ? (
        <div className="flex min-h-0 flex-col xl:h-full">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-3">
            <div className="min-w-0">
              <p className="text-sm font-medium leading-none text-primary">Preenchimento</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{selectedTemplate.description}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClearForm}
              title="Limpar formulário"
              className="h-8 w-8 flex-none text-muted-foreground hover:text-destructive active:scale-90"
            >
              <Eraser size={16} />
            </Button>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 pr-1 xl:overflow-y-auto">
            <DynamicFieldsForm
              templateText={selectedTemplate.templateText}
              values={values}
              onChange={onFieldChange}
              templateId={selectedTemplate.id}
            />

            {missingKeys.length > 0 && (
              <div className="mt-4 rounded-lg border border-chart-4/20 bg-chart-4/10 p-3 text-xs text-chart-4">
                <p className="mb-1 flex items-center gap-1 font-semibold">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-chart-4" />
                  Campos não preenchidos:
                </p>
                <p className="pl-2.5 opacity-80">{missingKeys.join(', ')}</p>
              </div>
            )}
          </div>

          <ActionBar separated stackOnMobile className="mt-5">
            <Button type="button" onClick={onGenerateDocument} disabled={isGenerating} className="w-full shadow-sm">
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Gerar documento
                  <ChevronRight className="ml-2 h-4 w-4 opacity-70" />
                </>
              )}
            </Button>
          </ActionBar>
        </div>
      ) : (
        <div className="flex h-full min-h-[16rem] flex-col items-center justify-center space-y-3 text-center text-muted-foreground opacity-75">
          <FileText className="h-10 w-10 opacity-25" />
          <p className="max-w-xs text-sm">Selecione um modelo para iniciar o preenchimento.</p>
        </div>
      )}
    </SectionCard>
  );
};

interface PreviewPanelProps {
  selectedTemplate: Template | null;
  previewValues: Record<string, string> | null;
  className?: string;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  selectedTemplate,
  previewValues,
  className,
}) => {
  return (
    <SectionCard
      title="Visualização"
      icon={<Eye size={18} />}
      className={cn('min-h-[28rem] xl:h-full xl:min-h-0', className)}
      contentClassName="relative bg-background/30"
    >
      {selectedTemplate && previewValues ? (
        <div className="h-[58vh] min-h-0 w-full overflow-hidden bg-background xl:h-full">
          <PDFViewer width="100%" height="100%" showToolbar className="h-full w-full rounded-none border-0">
            <DocumentPdf
              title={selectedTemplate.title}
              templateText={selectedTemplate.templateText}
              values={previewValues}
            />
          </PDFViewer>
        </div>
      ) : (
        <div className="flex h-full min-h-[18rem] flex-col items-center justify-center space-y-4 text-center text-muted-foreground">
          <div className="rounded-full border border-border bg-secondary/30 p-4 shadow-inner">
            <FileText className="h-8 w-8 text-primary/45" />
          </div>
          <div className="max-w-xs">
            <p className="font-medium text-foreground/75">Aguardando geração</p>
            <p className="mt-1 text-xs opacity-60">
              Preencha os campos e clique em “Gerar documento” para visualizar o PDF.
            </p>
            {selectedTemplate && (
              <Badge className="mt-3 border-primary/20 bg-primary/10 text-primary">{selectedTemplate.title}</Badge>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
};
