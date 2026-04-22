import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, FileText, ListChecks } from 'lucide-react';

import {
  FormPanel,
  PreviewPanel,
  TemplatesPanel,
} from '../components/DocumentsComposerPanels';
import { useDocumentsComposer } from '../hooks/useDocumentsComposer';
import { mockTemplates, Template } from '../utils/mockData';
import { PageShell } from '@/components/layout';
import { MobileStickyTabs, Tabs, TabsContent } from '@/components/ui';

const DocumentsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('templates');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const {
    selectedTemplate,
    fieldValues,
    previewValues,
    missingKeys,
    isGenerating,
    showSuccess,
    selectTemplate,
    setFieldValue,
    setFieldValuesBulk,
    applyPreset,
    clearForm,
    generateDocument,
  } = useDocumentsComposer();

  const handleSelectTemplate = (template: Template) => {
    selectTemplate(template);
    setActiveTab('form');
  };

  const handleGenerateDocument = () => {
    generateDocument();
    setActiveTab('preview');
  };

  useEffect(() => {
    const state = location.state as {
      documentPreset?: {
        templateId: string;
        values: Record<string, string>;
      };
    } | null;

    if (!state?.documentPreset) {
      return;
    }

    const { templateId, values } = state.documentPreset;
    const template = mockTemplates.find((item) => item.id === templateId);
    if (!template) return;

    applyPreset(template, values);
    setFieldValuesBulk(values);
    setActiveTab('preview');

    navigate(location.pathname, { replace: true, state: null });
  }, [applyPreset, location.pathname, location.state, navigate, setFieldValuesBulk]);

  useEffect(() => {
    // Simulate initial loading for premium feel
    const timer = setTimeout(() => setIsLoadingTemplates(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageShell desktopContained className="flex flex-col gap-4 lg:flex-row lg:gap-0">
      {/* Mobile View */}
      <div className="min-w-0 overflow-x-hidden lg:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0">
          <MobileStickyTabs
            value={activeTab}
            onValueChange={setActiveTab}
            ariaLabel="Navegação de documentos"
            items={[
              {
                value: 'templates',
                label: 'Modelos',
                icon: <FileText className="h-4 w-4" />,
              },
              {
                value: 'form',
                label: 'Preencher',
                icon: <ListChecks className="h-4 w-4" />,
              },
              {
                value: 'preview',
                label: 'Visualizar',
                icon: <Eye className="h-4 w-4" />,
              },
            ]}
          />

          <div className="min-w-0 space-y-4 p-3 sm:p-4">
            <TabsContent value="templates">
              <TemplatesPanel
                templates={mockTemplates}
                selectedTemplateId={selectedTemplate?.id}
                onSelectTemplate={handleSelectTemplate}
                isLoading={isLoadingTemplates}
              />
            </TabsContent>

            <TabsContent value="form">
              <FormPanel
                selectedTemplate={selectedTemplate}
                values={fieldValues}
                missingKeys={missingKeys}
                isGenerating={isGenerating}
                showSuccess={showSuccess}
                onFieldChange={setFieldValue}
                onClearForm={clearForm}
                onGenerateDocument={handleGenerateDocument}
              />
            </TabsContent>

            <TabsContent value="preview">
              <PreviewPanel selectedTemplate={selectedTemplate} previewValues={previewValues} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Desktop Multi-Pane View */}
      <div className="hidden lg:flex lg:w-[320px] xl:w-[360px] lg:shrink-0 lg:border-r lg:border-border lg:h-full lg:overflow-hidden">
        <TemplatesPanel
          templates={mockTemplates}
          selectedTemplateId={selectedTemplate?.id}
          onSelectTemplate={handleSelectTemplate}
          isLoading={isLoadingTemplates}
        />
      </div>

      <div className="hidden lg:flex lg:w-[380px] xl:w-[420px] lg:shrink-0 lg:border-r lg:border-border lg:h-full lg:overflow-hidden">
        <FormPanel
          selectedTemplate={selectedTemplate}
          values={fieldValues}
          missingKeys={missingKeys}
          isGenerating={isGenerating}
          showSuccess={showSuccess}
          onFieldChange={setFieldValue}
          onClearForm={clearForm}
          onGenerateDocument={handleGenerateDocument}
        />
      </div>

      <div className="hidden lg:flex lg:min-w-0 lg:flex-1 lg:h-full lg:overflow-hidden">
        <PreviewPanel 
          selectedTemplate={selectedTemplate} 
          previewValues={previewValues}
          className="lg:border-0 lg:shadow-none lg:rounded-none"
        />
      </div>
    </PageShell>
  );
};

export default DocumentsPage;
