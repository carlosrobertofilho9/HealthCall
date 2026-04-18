import React, { useState } from 'react';
import { ListOrdered, Megaphone, MessageSquare, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
          <label className="block text-xs font-medium text-[#96c5a9]/60 uppercase tracking-wider mb-1">Título</label>
          <Input
            value={formData.text || ''}
            onChange={(event) => setFormData((previous) => ({ ...previous, text: event.target.value }))}
            placeholder="Ex: Campanha de Vacinação"
            icon={<Megaphone className="h-4 w-4" />}
            className="bg-[#264532]/30 border-white/10 text-white placeholder:text-gray-500 focus:border-[#96c5a9]/40"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#96c5a9]/60 uppercase tracking-wider mb-1">Tipo de Mídia</label>
            <select
              value={formData.media_type}
              onChange={(event) => setFormData((previous) => ({ ...previous, media_type: event.target.value as MediaType }))}
              className="w-full bg-[#264532]/30 text-white rounded-lg border border-white/10 p-2.5 focus:ring-2 focus:ring-[#96c5a9]/40 outline-none"
            >
              <option value="image">Imagem</option>
              <option value="video">Vídeo</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.priority}
                onChange={(event) => setFormData((previous) => ({ ...previous, priority: event.target.checked }))}
                className="w-5 h-5 rounded border-white/10 bg-[#264532]/30 text-yellow-500 focus:ring-yellow-500"
              />
              <span className="text-sm text-gray-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                Prioridade Alta
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#96c5a9]/60 uppercase tracking-wider mb-1">Mensagem (TTS/Legenda)</label>
            <Input
              value={formData.message || ''}
              onChange={(event) => setFormData((previous) => ({ ...previous, message: event.target.value }))}
              placeholder="Ex: Procure a sala de vacinação"
              icon={<MessageSquare className="h-4 w-4" />}
              className="bg-[#264532]/30 border-white/10 text-white placeholder:text-gray-500 focus:border-[#96c5a9]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#96c5a9]/60 uppercase tracking-wider mb-1">Duração (segundos)</label>
            <Input
              type="number"
              min={1}
              value={formData.duration || 10}
              onChange={(event) => setFormData((previous) => ({ ...previous, duration: Number(event.target.value) }))}
              icon={<Timer className="h-4 w-4" />}
              className="bg-[#264532]/30 border-white/10 text-white placeholder:text-gray-500 focus:border-[#96c5a9]/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#96c5a9]/60 uppercase tracking-wider mb-1">Ordem de Prioridade</label>
          <Input
            type="number"
            value={formData.priority_order || 0}
            onChange={(event) => setFormData((previous) => ({ ...previous, priority_order: Number(event.target.value) }))}
            icon={<ListOrdered className="h-4 w-4" />}
            className="bg-[#264532]/30 border-white/10 text-white placeholder:text-gray-500 focus:border-[#96c5a9]/40"
          />
          <p className="text-xs text-gray-500 mt-1">Números menores aparecem primeiro.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#264532]/20 p-4 rounded-lg border border-white/5">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Hora Início</label>
            <input
              type="time"
              value={formData.start_time || ''}
              onChange={(event) => setFormData((previous) => ({ ...previous, start_time: event.target.value }))}
              className="w-full bg-[#264532]/30 text-white rounded-lg border border-white/10 p-2 focus:ring-2 focus:ring-[#96c5a9]/40 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Hora Fim</label>
            <input
              type="time"
              value={formData.end_time || ''}
              onChange={(event) => setFormData((previous) => ({ ...previous, end_time: event.target.value }))}
              className="w-full bg-[#264532]/30 text-white rounded-lg border border-white/10 p-2 focus:ring-2 focus:ring-[#96c5a9]/40 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#96c5a9]/60 uppercase tracking-wider mb-1">Arquivo ({formData.media_type === 'video' ? 'Vídeo' : 'Imagem'})</label>
          <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-[#96c5a9]/40 transition-colors cursor-pointer relative bg-[#264532]/10">
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
                  <p className="text-sm text-gray-400">Mídia local não encontrada neste navegador.</p>
                )}
                {file && <p className="mt-2 text-sm text-green-400 font-semibold">{file.name}</p>}
                <p className="text-xs text-gray-500 mt-1">Clique para alterar</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2">cloud_upload</span>
                <p>Clique ou arraste para fazer upload</p>
                <p className="text-xs mt-1 text-gray-500">
                  {formData.media_type === 'video' ? 'Vídeos até 50MB' : 'Imagens até 5MB'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-gray-400 hover:bg-[#264532]/30 hover:text-white border border-white/5 transition-all text-sm font-medium"
          >
            Cancelar
          </button>
          <Button
            type="submit"
            disabled={loading}
            className="w-auto px-8 bg-[#264532] text-[#96c5a9] border border-white/5 hover:bg-green-500 hover:text-white hover:border-green-400 hover:shadow-green-500/20 shadow-sm transition-all"
          >
            {loading ? 'Salvando...' : initialData ? 'Atualizar Aviso' : 'Salvar Aviso'}
          </Button>
        </div>
      </form>
    </div>
  );
};
