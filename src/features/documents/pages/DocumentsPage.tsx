import React, { useState } from 'react';
import { TemplateList } from '../components/TemplateList';
import { DynamicFieldsForm } from '../components/DynamicFieldsForm';
import { DocumentPdf } from '../components/DocumentPdf'; 
import { TemplatesWidget, DocumentFormWidget, PreviewWidget } from '../components/DocumentsWidgets';
import { mockTemplates, Template } from '../utils/mockData';
import { extractPlaceholders } from '../utils/templateUtils';
import { Button } from '@/components/ui/Button';
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 w-full h-[calc(100vh-8rem)]">
      {/* Coluna 1: Lista de Templates */}
      <TemplatesWidget>
        <TemplateList 
          templates={mockTemplates} 
          onSelect={handleSelectTemplate}
          selectedId={selectedTemplate?.id}
        />
      </TemplatesWidget>

      {/* Coluna 2: Formulário de Preenchimento */}
      <DocumentFormWidget title={selectedTemplate?.title}>
        {selectedTemplate ? (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6 gap-4 border-b border-white/5 pb-4">
                    <div className="flex flex-col">
                        <p className="text-[#96c5a9] font-medium text-sm leading-none mb-1">Preenchimento</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{selectedTemplate.description}</p>
                    </div>
                    <button 
                        onClick={clearForm} 
                        title="Limpar formulário"
                        className="flex-none h-8 w-8 flex items-center justify-center rounded-lg bg-[#264532]/20 text-[#96c5a9]/50 hover:bg-red-500/10 hover:text-red-400 border border-white/5 transition-all active:scale-90"
                    >
                        <Eraser size={16} />
                    </button>
                </div>

                <div className="flex-1">
                    <DynamicFieldsForm 
                        templateText={selectedTemplate.templateText}
                        values={fieldValues}
                        onChange={handleFieldChange}
                        templateId={selectedTemplate.id}
                    />
                     {missingKeys.length > 0 && (
                        <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-200 text-xs">
                        <p className="font-semibold mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                            Campos não preenchidos:
                        </p>
                        <p className="opacity-80 pl-2.5">{missingKeys.join(', ')}</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-6 border-t border-white/5">
                    <Button 
                        onClick={generateDocument} 
                        disabled={isGenerating}
                        className="w-full bg-[#264532] text-[#96c5a9] border border-white/5 hover:bg-green-500 hover:text-white hover:border-green-400 hover:shadow-green-500/20 shadow-sm transition-all"
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
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4 opacity-60">
                <FileText className="h-12 w-12 opacity-20" />
                <p>Selecione um modelo à esquerda para iniciar o preenchimento.</p>
            </div>
        )}
      </DocumentFormWidget>

      {/* Coluna 3 e 4: Preview */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-0">
             <PreviewWidget>
                {selectedTemplate && previewValues ? (
                    <div className="h-full w-full bg-neutral-900 rounded-lg overflow-hidden">
                        <PDFViewer width="100%" height="100%" showToolbar={true} className="rounded-none border-0 w-full h-full">
                            <DocumentPdf 
                                title={selectedTemplate.title} 
                                templateText={selectedTemplate.templateText}
                                values={previewValues}
                            />
                        </PDFViewer>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
                        <div className="p-4 rounded-full bg-[#264532]/20 border border-white/5 shadow-inner">
                             <FileText className="h-8 w-8 text-[#96c5a9]/40" />
                        </div>
                        <div className="max-w-xs">
                            <p className="font-medium text-gray-400">Aguardando geração</p>
                            <p className="text-xs mt-1 opacity-60">
                                Preencha o formulário e clique em "Gerar Documento" para visualizar o PDF.
                            </p>
                        </div>
                    </div>
                )}
             </PreviewWidget>
        </div>
    </div>
  );
};

export default DocumentsPage;
