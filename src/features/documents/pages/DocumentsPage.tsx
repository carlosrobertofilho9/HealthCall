import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  FormPanel,
  PreviewPanel,
  TemplatesPanel,
} from '../components/DocumentsComposerPanels';
import { MouseParallax } from '../components/MouseParallax';
import { useDocumentsComposer } from '../hooks/useDocumentsComposer';
import { mockTemplates, Template } from '../utils/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';

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
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:gap-0 lg:h-full lg:overflow-hidden lg:bg-background">
      {/* Mobile View */}
      <div className="lg:hidden p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full justify-between">
            <TabsTrigger value="templates" className="flex-1">
              Modelos
            </TabsTrigger>
            <TabsTrigger value="form" className="flex-1">
              Preencher
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">
              Visualizar
            </TabsTrigger>
          </TabsList>

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
    </div>
  );
};

export default DocumentsPage;
