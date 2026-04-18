import React, { useState } from 'react';

import {
  FormPanel,
  PreviewPanel,
  TemplatesPanel,
} from '../components/DocumentsComposerPanels';
import { useDocumentsComposer } from '../hooks/useDocumentsComposer';
import { mockTemplates, Template } from '../utils/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';

const DocumentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const {
    selectedTemplate,
    fieldValues,
    previewValues,
    missingKeys,
    isGenerating,
    selectTemplate,
    setFieldValue,
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
            />
          </TabsContent>

          <TabsContent value="form">
            <FormPanel
              selectedTemplate={selectedTemplate}
              values={fieldValues}
              missingKeys={missingKeys}
              isGenerating={isGenerating}
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

      <div className="hidden min-h-0 gap-4 xl:grid xl:h-full xl:grid-cols-[320px_minmax(320px,420px)_1fr] xl:overflow-hidden">
        <TemplatesPanel
          templates={mockTemplates}
          selectedTemplateId={selectedTemplate?.id}
          onSelectTemplate={handleSelectTemplate}
        />

        <FormPanel
          selectedTemplate={selectedTemplate}
          values={fieldValues}
          missingKeys={missingKeys}
          isGenerating={isGenerating}
          onFieldChange={setFieldValue}
          onClearForm={clearForm}
          onGenerateDocument={handleGenerateDocument}
        />

        <PreviewPanel selectedTemplate={selectedTemplate} previewValues={previewValues} />
      </div>
    </div>
  );
};

export default DocumentsPage;
