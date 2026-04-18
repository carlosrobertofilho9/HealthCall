import React, { useState } from 'react';
import { TemplateList } from '../components/TemplateList';
import { DynamicFieldsForm } from '../components/DynamicFieldsForm';
import { DocumentPdf } from '../components/DocumentPdf'; 
import { TemplatesWidget, DocumentFormWidget, PreviewWidget } from '../components/DocumentsWidgets';
import { mockTemplates, Template } from '../utils/mockData';
import { extractPlaceholders } from '../utils/templateUtils';
import { Button, ActionBar, Badge } from '@/components/ui';
import { FileText, RefreshCw, ChevronRight, Eraser, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PDFViewer } from '@react-pdf/renderer';

const DocumentsPage: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [previewValues, setPreviewValues] = useState<Record<string, string> | null>(null);
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Resetar estado quando mudar o template
  const handleSelectTemplate = (template: Template) => {
    if (selectedTemplate?.id === template.id) return;
    
    setSelectedTemplate(template);
    setFieldValues({});
    setPreviewValues(null);
    setMissingKeys([]);
  };

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [key]: value }));
  };

  const clearForm = () => {
    setFieldValues({});
    setPreviewValues(null);
    setMissingKeys([]);
    toast.info('Formulário limpo.');
  };

  const generateDocument = () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    
    // Validar campos
    const keys = extractPlaceholders(selectedTemplate.templateText);
    const missing = keys.filter(key => !fieldValues[key] || fieldValues[key].trim() === '');
    setMissingKeys(missing);

    if (missing.length > 0) {
      // Campos são opcionais agora
      // toast.warning(`Atenção: ${missing.length} campos não foram preenchidos.`);
    }

    // Set preview values to trigger the update
    // Small delay to simulate processing/visual feedback
    setTimeout(() => {
        setPreviewValues({ ...fieldValues });
        setIsGenerating(false);
        toast.success('Documento gerado com sucesso!');
    }, 500);
  };

  return (
    <div className="grid h-[calc(100vh-8rem)] w-full grid-cols-1 gap-4 lg:grid-cols-4">
      <TemplatesWidget>
        <TemplateList 
          templates={mockTemplates} 
          onSelect={handleSelectTemplate}
          selectedId={selectedTemplate?.id}
        />
      </TemplatesWidget>

      <DocumentFormWidget title={selectedTemplate?.title}>
        {selectedTemplate ? (
            <div className="flex h-full flex-col">
                <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-4">
                    <div className="flex flex-col">
                        <p className="mb-1 text-sm font-medium leading-none text-primary">Preenchimento</p>
                        <p className="max-w-[200px] truncate text-xs text-muted-foreground">{selectedTemplate.description}</p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={clearForm} 
                        title="Limpar formulário"
                        className="h-8 w-8 flex-none text-muted-foreground hover:text-destructive active:scale-90"
                    >
                        <Eraser size={16} />
                    </Button>
                </div>

                <div className="flex-1">
                    <DynamicFieldsForm 
                        templateText={selectedTemplate.templateText}
                        values={fieldValues}
                        onChange={handleFieldChange}
                        templateId={selectedTemplate.id}
                    />
                     {missingKeys.length > 0 && (
                        <div className="mt-4 rounded-lg border border-chart-4/20 bg-chart-4/10 p-3 text-xs text-chart-4">
                        <p className="mb-1 flex items-center gap-1 font-semibold">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-chart-4"></span>
                            Campos não preenchidos:
                        </p>
                        <p className="opacity-80 pl-2.5">{missingKeys.join(', ')}</p>
                    </div>
                  )}
                </div>

                <ActionBar separated stackOnMobile className="mt-6">
                    <Button 
                        type="button"
                        onClick={generateDocument} 
                        disabled={isGenerating}
                        className="w-full shadow-sm"
                    >
                        {isGenerating ? (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                        </>
                        ) : (
                        <>
                            <FileCheck className="mr-2 h-4 w-4" />
                            Gerar Documento
                            <ChevronRight className="ml-2 h-4 w-4 opacity-70" />
                        </>
                        )}
                    </Button>
                </ActionBar>
            </div>
        ) : (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-center text-muted-foreground opacity-70">
                <FileText className="h-12 w-12 opacity-20" />
                <p>Selecione um modelo à esquerda para iniciar o preenchimento.</p>
            </div>
        )}
      </DocumentFormWidget>

        <div className="flex h-full min-h-0 flex-col lg:col-span-2">
             <PreviewWidget>
                {selectedTemplate && previewValues ? (
                    <div className="h-full w-full overflow-hidden rounded-lg bg-background">
                        <PDFViewer width="100%" height="100%" showToolbar={true} className="rounded-none border-0 w-full h-full">
                            <DocumentPdf 
                                title={selectedTemplate.title} 
                                templateText={selectedTemplate.templateText}
                                values={previewValues}
                            />
                        </PDFViewer>
                    </div>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center space-y-4 text-center text-muted-foreground">
                        <div className="rounded-full border border-border bg-secondary/30 p-4 shadow-inner">
                             <FileText className="h-8 w-8 text-primary/45" />
                        </div>
                        <div className="max-w-xs">
                            <p className="font-medium text-foreground/75">Aguardando geração</p>
                            <p className="mt-1 text-xs opacity-60">
                                Preencha o formulário e clique em "Gerar Documento" para visualizar o PDF.
                            </p>
                            {selectedTemplate ? (
                              <Badge className="mt-3 border-primary/20 bg-primary/10 text-primary">
                                {selectedTemplate.title}
                              </Badge>
                            ) : null}
                        </div>
                    </div>
                )}
             </PreviewWidget>
        </div>
    </div>
  );
};

export default DocumentsPage;
