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
  const [showSuccess, setShowSuccess] = useState(false);

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
    setShowSuccess(false);
  }, []);

  const setFieldValue = useCallback((key: string, value: string) => {
    setFieldValues((previous) => ({ ...previous, [key]: value }));
  }, []);

  const setFieldValuesBulk = useCallback((values: Record<string, string>) => {
    setFieldValues(values);
  }, []);

  const clearForm = useCallback(() => {
    setFieldValues({});
    setPreviewValues(null);
    setMissingKeys([]);
    setShowSuccess(false);
    toast.info('Formulário limpo.');
  }, []);

  const generateDocument = useCallback(() => {
    if (!selectedTemplate) return;

    const keys = extractPlaceholders(selectedTemplate.templateText);
    const missing = keys.filter((key) => !fieldValues[key] || fieldValues[key].trim() === '');
    setMissingKeys(missing);

    // If there are many missing keys, we might want to alert but still allow generation
    // For the animation requirement, we'll trigger the error state if there are missing keys
    if (missing.length > 0) {
      toast.error('Alguns campos obrigatórios estão vazios.');
    }

    setIsGenerating(true);
    setShowSuccess(false);

    if (generateTimeoutRef.current) {
      window.clearTimeout(generateTimeoutRef.current);
    }

    generateTimeoutRef.current = window.setTimeout(() => {
      setPreviewValues({ ...fieldValues });
      setIsGenerating(false);
      setShowSuccess(true);
      toast.success('Documento gerado com sucesso!');

      // Hide success indicator after a delay
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800); // Slightly longer for the "premium" feel of processing
  }, [fieldValues, selectedTemplate]);

  const applyPreset = useCallback((template: Template, values: Record<string, string>) => {
    setSelectedTemplate(template);
    setFieldValues(values);
    setPreviewValues(values);
    setShowSuccess(false);

    const keys = extractPlaceholders(template.templateText);
    const missing = keys.filter((key) => !values[key] || values[key].trim() === '');
    setMissingKeys(missing);
  }, []);

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
    showSuccess,
    selectTemplate,
    setFieldValue,
    setFieldValuesBulk,
    clearForm,
    generateDocument,
    applyPreset,
  };
};
