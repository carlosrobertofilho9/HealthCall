import React, { useState } from 'react';
import {
  CloudUpload,
  ListOrdered,
  Megaphone,
  MessageSquare,
  Star,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Input,
  Textarea,
  FormSection,
  ActionBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
import { createWarning, deleteWarningMedia, updateWarning, uploadMedia } from '../services/warningsService';
import type { CreateWarningDTO, MediaType, UpdateWarningDTO, Warning } from '../types';
import { useResolvedWarningMediaUrl } from '../hooks/useResolvedWarningMediaUrl';

interface WarningFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Warning;
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;

function formatTimeForInput(timeValue?: string | null): string {
  return timeValue ? timeValue.slice(0, 5) : '';
}

export const WarningForm: React.FC<WarningFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialData?.content_url || null);
  const resolvedPreview = useResolvedWarningMediaUrl(preview);
  const [formData, setFormData] = useState<Partial<CreateWarningDTO>>({
    text: initialData?.text || '',
    media_type: initialData?.media_type || 'image',
    duration: initialData?.duration || 10,
    active: initialData?.active ?? true,
    start_time: formatTimeForInput(initialData?.start_time),
    end_time: formatTimeForInput(initialData?.end_time),
    priority_order: initialData?.priority_order || 0,
    message: initialData?.message || '',
    priority: initialData?.priority ?? false,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const isVideo = selectedFile.type.startsWith('video/');
    const sizeLimit = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
    if (selectedFile.size > sizeLimit) {
      toast.error(`O arquivo deve ter no máximo ${isVideo ? '50MB' : '5MB'}.`);
      event.target.value = '';
      return;
    }

    setFile(selectedFile);
    setFormData((previous) => ({
      ...previous,
      media_type: isVideo ? 'video' : 'image',
    }));
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.text?.trim()) {
      toast.error('Título é obrigatório.');
      return;
    }

    if (!file && !initialData?.content_url) {
      toast.error('Selecione uma mídia (imagem ou vídeo).');
      return;
    }

    setLoading(true);

    try {
      let contentUrl = initialData?.content_url || '';
      if (file) {
        contentUrl = await uploadMedia(file);
      }

      if (initialData) {
        const payload: UpdateWarningDTO = {
          id: initialData.id,
          text: formData.text,
          media_type: (formData.media_type || 'image') as MediaType,
          content_url: contentUrl,
          message: formData.message || '',
          duration: Number(formData.duration || 10),
          active: formData.active,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          priority_order: Number(formData.priority_order || 0),
          priority: !!formData.priority,
        };

        await updateWarning(payload);
        if (file && initialData.content_url && initialData.content_url !== contentUrl) {
          await deleteWarningMedia(initialData.content_url).catch(() => undefined);
        }
        toast.success('Aviso atualizado com sucesso!');
      } else {
        const payload: CreateWarningDTO = {
          text: formData.text,
          media_type: (formData.media_type || 'image') as MediaType,
          content_url: contentUrl,
          message: formData.message || '',
          duration: Number(formData.duration || 10),
          active: formData.active,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          priority_order: Number(formData.priority_order || 0),
          priority: !!formData.priority,
        };

        await createWarning(payload);
        toast.success('Aviso criado com sucesso!');
      }

      onSuccess();
    } catch {
      toast.error('Erro ao salvar aviso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in zoom-in duration-300">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Título</label>
          <Input
            value={formData.text || ''}
            onChange={(event) => setFormData((previous) => ({ ...previous, text: event.target.value }))}
            placeholder="Ex: Campanha de Vacinação"
            icon={<Megaphone className="h-4 w-4" />}
            className="bg-input/70 border-border text-foreground placeholder:text-muted-foreground focus:border-ring/40"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Tipo de Mídia</label>
            <Select
              value={formData.media_type}
              onValueChange={(value) => setFormData((previous) => ({ ...previous, media_type: value as MediaType }))}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Imagem</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.priority}
                onChange={(event) => setFormData((previous) => ({ ...previous, priority: event.target.checked }))}
                className="w-5 h-5 rounded border-border bg-input/70 text-yellow-500 focus:ring-yellow-500"
              />
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                Prioridade Alta
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Mensagem (TTS/Legenda)</label>
            <Textarea
              value={formData.message || ''}
              onChange={(event) => setFormData((previous) => ({ ...previous, message: event.target.value }))}
              placeholder="Ex: Procure a sala de vacinação"
              icon={<MessageSquare className="h-4 w-4" />}
              className="min-h-24 resize-y bg-input/70 border-border text-foreground placeholder:text-muted-foreground focus:border-ring/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Duração (segundos)</label>
            <Input
              type="number"
              min={1}
              value={formData.duration || 10}
              onChange={(event) => setFormData((previous) => ({ ...previous, duration: Number(event.target.value) }))}
              icon={<Timer className="h-4 w-4" />}
              className="bg-input/70 border-border text-foreground placeholder:text-muted-foreground focus:border-ring/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Ordem de Prioridade</label>
          <Input
            type="number"
            value={formData.priority_order || 0}
            onChange={(event) => setFormData((previous) => ({ ...previous, priority_order: Number(event.target.value) }))}
            icon={<ListOrdered className="h-4 w-4" />}
            className="bg-input/70 border-border text-foreground placeholder:text-muted-foreground focus:border-ring/40"
          />
          <p className="text-xs text-muted-foreground mt-1">Números menores aparecem primeiro.</p>
        </div>

        <FormSection title="Janela de Exibição" contentClassName="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Hora Início</label>
            <input
              type="time"
              value={formData.start_time || ''}
              onChange={(event) => setFormData((previous) => ({ ...previous, start_time: event.target.value }))}
              className="w-full bg-input/70 text-foreground rounded-lg border border-border p-2 focus:ring-2 focus:ring-ring/40 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Hora Fim</label>
            <input
              type="time"
              value={formData.end_time || ''}
              onChange={(event) => setFormData((previous) => ({ ...previous, end_time: event.target.value }))}
              className="w-full bg-input/70 text-foreground rounded-lg border border-border p-2 focus:ring-2 focus:ring-ring/40 outline-none"
            />
          </div>
        </FormSection>

        <FormSection title={`Arquivo (${formData.media_type === 'video' ? 'Vídeo' : 'Imagem'})`}>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-ring/40 transition-colors cursor-pointer relative bg-secondary/10">
            <input
              type="file"
              accept={formData.media_type === 'video' ? '.mp4,.webm,.ogg,.mov' : '.jpg,.jpeg,.png,.webp,.gif'}
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />

            {preview ? (
              <div className="relative">
                {resolvedPreview ? (
                  formData.media_type === 'video' ? (
                    <video src={resolvedPreview} className="max-h-48 mx-auto rounded shadow-lg" controls preload="metadata" />
                  ) : (
                    <img src={resolvedPreview} alt="Preview" className="max-h-48 mx-auto rounded shadow-lg" />
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">Mídia local não encontrada neste navegador.</p>
                )}
                {file && <p className="mt-2 text-sm text-green-400 font-semibold">{file.name}</p>}
                <p className="text-xs text-muted-foreground mt-1">Clique para alterar</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <CloudUpload className="h-10 w-10 mb-2" />
                <p>Clique ou arraste para fazer upload</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  {formData.media_type === 'video' ? 'Vídeos até 50MB' : 'Imagens até 5MB'}
                </p>
              </div>
            )}
          </div>
        </FormSection>

        <ActionBar separated>
          <Button
            type="button"
            onClick={onCancel}
            size="sm"
            variant="secondary"
            className="w-auto rounded-lg"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            size="sm"
            className="w-auto px-8 rounded-lg"
          >
            {loading ? 'Salvando...' : initialData ? 'Atualizar Aviso' : 'Salvar Aviso'}
          </Button>
        </ActionBar>
      </form>
    </div>
  );
};
