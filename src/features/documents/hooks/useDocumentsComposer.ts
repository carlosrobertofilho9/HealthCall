import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Template } from '../utils/mockData';
import { extractPlaceholders } from '../utils/templateUtils';

export const useDocumentsComposer = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [previewValues, setPreviewValues] = useState<Record<string, string> | null>(null);
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTimeoutRef = useRef<number | null>(null);

  const selectTemplate = useCallback((template: Template) => {
    setSelectedTemplate((currentTemplate) => {
      if (currentTemplate?.id === template.id) {
        return currentTemplate;
      }

      return template;
    });

    setFieldValues({});
    setPreviewValues(null);
    setMissingKeys([]);
  }, []);

  const setFieldValue = useCallback((key: string, value: string) => {
    setFieldValues((previous) => ({ ...previous, [key]: value }));
  }, []);

  const clearForm = useCallback(() => {
    setFieldValues({});
    setPreviewValues(null);
    setMissingKeys([]);
    toast.info('Formulário limpo.');
  }, []);

  const generateDocument = useCallback(() => {
    if (!selectedTemplate) return;

    setIsGenerating(true);

    const keys = extractPlaceholders(selectedTemplate.templateText);
    const missing = keys.filter((key) => !fieldValues[key] || fieldValues[key].trim() === '');
    setMissingKeys(missing);

    if (generateTimeoutRef.current) {
      window.clearTimeout(generateTimeoutRef.current);
    }

    generateTimeoutRef.current = window.setTimeout(() => {
      setPreviewValues({ ...fieldValues });
      setIsGenerating(false);
      toast.success('Documento gerado com sucesso!');
    }, 400);
  }, [fieldValues, selectedTemplate]);

  useEffect(() => {
    return () => {
      if (generateTimeoutRef.current) {
        window.clearTimeout(generateTimeoutRef.current);
      }
    };
  }, []);

  return {
    selectedTemplate,
    fieldValues,
    previewValues,
    missingKeys,
    isGenerating,
    selectTemplate,
    setFieldValue,
    clearForm,
    generateDocument,
  };
};
