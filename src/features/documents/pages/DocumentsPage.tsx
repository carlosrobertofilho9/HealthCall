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
    <div className="flex w-full flex-col gap-4 xl:h-full xl:overflow-hidden">
      <div className="xl:hidden">
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

      <div className="hidden min-h-0 xl:flex xl:h-full xl:flex-1 xl:overflow-hidden p-6 gap-6 bg-secondary/10">
        <MouseParallax intensity={4} className="flex w-[320px] shadow-2xl rounded-2xl overflow-hidden">
          <TemplatesPanel
            templates={mockTemplates}
            selectedTemplateId={selectedTemplate?.id}
            onSelectTemplate={handleSelectTemplate}
            isLoading={isLoadingTemplates}
          />
        </MouseParallax>

        <MouseParallax intensity={3} className="flex w-[420px] shadow-2xl rounded-2xl overflow-hidden">
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
        </MouseParallax>

        <div className="flex min-w-0 flex-1 flex-col bg-background shadow-2xl rounded-2xl overflow-hidden">
          <PreviewPanel selectedTemplate={selectedTemplate} previewValues={previewValues} />
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
