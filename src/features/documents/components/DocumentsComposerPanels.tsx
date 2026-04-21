import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Edit,
  Eraser,
  Eye,
  FileCheck,
  FileText,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

import { ActionBar, Badge, Button, SectionCard } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Template } from '../utils/mockData';
import { DocumentPdf } from './DocumentPdf';
import { DynamicFieldsForm } from './DynamicFieldsForm';
import { TemplateList } from './TemplateList';

// Animation Variants
const panelVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
  }
};

const hapticTap = {
  scale: 0.97,
  transition: { type: 'spring', stiffness: 600, damping: 30 }
};

const hapticHover = {
  transition: { type: 'spring', stiffness: 400, damping: 25 }
};

const emptyStateVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

interface TemplatesPanelProps {
  templates: Template[];
  selectedTemplateId?: string;
  onSelectTemplate: (template: Template) => void;
  isLoading?: boolean;
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  isLoading,
}) => {
  return (
    <SectionCard title="Modelos" icon={<FileText size={20} />} className="min-h-[28rem] min-w-0 lg:h-full lg:min-h-0">
      <TemplateList 
        templates={templates} 
        onSelect={onSelectTemplate} 
        selectedId={selectedTemplateId} 
        isLoading={isLoading}
      />
    </SectionCard>
  );
};

interface FormPanelProps {
  selectedTemplate: Template | null;
  values: Record<string, string>;
  missingKeys: string[];
  isGenerating: boolean;
  showSuccess?: boolean;
  onFieldChange: (key: string, value: string) => void;
  onClearForm: () => void;
  onGenerateDocument: () => void;
}

export const FormPanel: React.FC<FormPanelProps> = ({
  selectedTemplate,
  values,
  missingKeys,
  isGenerating,
  showSuccess,
  onFieldChange,
  onClearForm,
  onGenerateDocument,
}) => {
  return (
    <SectionCard
      title={selectedTemplate?.title || 'Preenchimento'}
      icon={<Edit size={20} />}
      className="min-h-[28rem] min-w-0 lg:h-full lg:min-h-0"
      contentClassName="p-4 lg:p-5"
    >
      <AnimatePresence mode="wait">
        {selectedTemplate ? (
          <motion.div 
            key={selectedTemplate.id}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            className="flex min-h-0 flex-col lg:h-full"
          >
            <div className="mb-5 flex min-w-0 items-center justify-between gap-3 border-b border-border pb-3">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-none text-primary flex items-center gap-1.5">
                  <Sparkles size={14} className="text-primary/70" />
                  Preenchimento
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{selectedTemplate.description}</p>
              </div>
              <motion.div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearForm}
                  whileTap={hapticTap}
                  whileHover={hapticHover}
                  className="h-8 shrink-0 gap-1.5 px-2.5 text-xs text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
                  disabled={isGenerating}
                >
                  <Eraser size={14} />
                  Limpar
                </Button>
              </motion.div>
            </div>

            <div className="custom-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden pr-1 lg:overflow-y-auto">
              <DynamicFieldsForm
                templateText={selectedTemplate.templateText}
                values={values}
                onChange={onFieldChange}
                templateId={selectedTemplate.id}
                missingKeys={missingKeys}
              />

              <AnimatePresence>
                {missingKeys.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, y: 10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: 10 }}
                    className="mt-4 overflow-hidden rounded-lg border border-chart-4/20 bg-chart-4/10 p-3 text-xs text-chart-4"
                  >
                    <p className="mb-1 flex items-center gap-1 font-semibold">
                      <motion.span 
                        animate={{ opacity: [1, 0.4, 1] }} 
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="inline-block h-1.5 w-1.5 rounded-full bg-chart-4" 
                      />
                      Campos não preenchidos:
                    </p>
                    <p className="pl-2.5 opacity-80">{missingKeys.join(', ')}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ActionBar separated stackOnMobile className="mt-5">
              <motion.div 
                className="w-full"
              >
                <Button 
                  type="button" 
                  animate={missingKeys.length > 0 ? "shake" : "visible"}
                  whileTap={hapticTap}
                  whileHover={hapticHover}
                  onClick={onGenerateDocument}
                  disabled={!selectedTemplate || isGenerating}
                  className={cn(
                    "group relative h-11 w-full overflow-hidden rounded-xl font-semibold transition-all duration-300",
                    showSuccess ? "bg-green-600 hover:bg-green-700 shadow-green-200/50" : "bg-primary hover:bg-primary/90 shadow-primary/20",
                    "shadow-lg disabled:opacity-50 disabled:shadow-none"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isGenerating ? (
                      <motion.div 
                        key="generating"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center justify-center"
                      >
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Gerando documento...
                      </motion.div>
                    ) : showSuccess ? (
                      <motion.div 
                        key="success"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="flex items-center justify-center"
                      >
                        <FileCheck className="mr-2 h-4 w-4" />
                        Gerado com Sucesso!
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="idle"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="flex items-center justify-center"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gerar documento
                        <ChevronRight className="ml-2 h-4 w-4 opacity-70" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </ActionBar>
          </motion.div>
        ) : (
          <motion.div 
            key="empty-form"
            variants={emptyStateVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex h-full min-h-[16rem] flex-col items-center justify-center space-y-3 text-center text-muted-foreground/60"
          >
            <motion.div 
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              <FileText className="h-10 w-10 opacity-20" />
            </motion.div>
            <p className="max-w-[200px] text-sm font-medium leading-relaxed">
              Selecione um modelo para iniciar o preenchimento.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
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
      icon={<Eye size={20} />}
      className={cn('min-h-[28rem] min-w-0 lg:h-full lg:min-h-0', className)}
      contentClassName="relative bg-background/30"
    >
      <AnimatePresence mode="wait">
        {selectedTemplate && previewValues ? (
          <motion.div 
            key={`preview-${selectedTemplate.id}`}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            className="h-[58vh] min-h-0 w-full min-w-0 overflow-hidden bg-background lg:h-full"
          >
            <PDFViewer width="100%" height="100%" showToolbar className="h-full w-full rounded-none border-0">
              <DocumentPdf
                title={selectedTemplate.title}
                templateText={selectedTemplate.templateText}
                values={previewValues}
              />
            </PDFViewer>
          </motion.div>
        ) : (
          <motion.div 
            key="empty-preview"
            variants={emptyStateVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex h-full min-h-[18rem] flex-col items-center justify-center space-y-4 text-center text-muted-foreground"
          >
            <motion.div 
              animate={{ 
                boxShadow: ["0 0 0px var(--primary)", "0 0 15px var(--primary)", "0 0 0px var(--primary)"],
                borderColor: ["rgba(var(--primary), 0.2)", "rgba(var(--primary), 0.5)", "rgba(var(--primary), 0.2)"]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="rounded-full border border-border bg-secondary/30 p-4 shadow-inner"
            >
              <FileText className="h-8 w-8 text-primary/45" />
            </motion.div>
            <div className="max-w-xs">
              <p className="font-medium text-foreground/75">Aguardando geração</p>
              <p className="mt-1 text-xs opacity-60">
                Preencha os campos e clique em “Gerar documento” para visualizar o PDF.
              </p>
              {selectedTemplate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge className="mt-3 border-primary/20 bg-primary/10 text-primary shadow-sm">
                    {selectedTemplate.title}
                  </Badge>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionCard>
  );
};
