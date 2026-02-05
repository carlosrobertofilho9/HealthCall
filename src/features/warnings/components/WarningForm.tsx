import React, { useState, useEffect } from 'react';
import { CreateWarningDTO, UpdateWarningDTO, MediaType, Warning } from '../types';
import { createWarning, updateWarning, uploadMedia } from '../services/warningsService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

interface WarningFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Warning;
}

export const WarningForm: React.FC<WarningFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialData?.content_url || null);
  
  const formatTimeForInput = (timeStr?: string | null) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5); // "14:00:00" -> "14:00"
  };

  const [formData, setFormData] = useState<Partial<CreateWarningDTO>>({
    text: initialData?.text || '',
    media_type: initialData?.media_type || 'image',
    duration: initialData?.duration || 10,
    active: initialData?.active ?? true,
    start_time: formatTimeForInput(initialData?.start_time),
    end_time: formatTimeForInput(initialData?.end_time),
    priority_order: initialData?.priority_order || 0,
    message: initialData?.message || '',
    priority: initialData?.priority ?? false
  });
  
  const [youtubeUrl, setYoutubeUrl] = useState<string>(initialData?.media_type === 'youtube' ? initialData?.content_url || '' : '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-detect type
      if (selectedFile.type.startsWith('video/')) {
        setFormData(prev => ({ ...prev, media_type: 'video' }));
      } else {
        setFormData(prev => ({ ...prev, media_type: 'image' }));
      }

      // Create preview
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isYoutube = formData.media_type === 'youtube';
    
    if (!formData.text || (!file && !initialData && !isYoutube) || (isYoutube && !youtubeUrl)) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      let publicUrl = initialData?.content_url || '';
      
      if (isYoutube) {
        publicUrl = youtubeUrl;
      } else if (file) {
        publicUrl = await uploadMedia(file);
      }
      
      if (initialData) {
        const updateData: UpdateWarningDTO = {
          id: initialData.id,
          text: formData.text!,
          media_type: formData.media_type as MediaType,
          content_url: publicUrl,
          message: formData.message || '',
          duration: Number(formData.duration),
          active: formData.active,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          priority_order: Number(formData.priority_order || 0),
          priority: formData.priority
        };
        await updateWarning(updateData);
        toast.success('Aviso atualizado com sucesso!');
      } else {
        const newWarning: CreateWarningDTO = {
          text: formData.text!,
          media_type: formData.media_type as MediaType,
          content_url: publicUrl,
          message: formData.message || '',
          duration: Number(formData.duration),
          active: formData.active,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          priority_order: Number(formData.priority_order || 0),
          priority: formData.priority
        };
        await createWarning(newWarning);
        toast.success('Aviso criado com sucesso!');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar aviso:', error);
      toast.error('Erro ao salvar aviso. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl animate-in fade-in zoom-in duration-300">
      <h2 className="text-2xl font-bold text-white mb-6">
        {initialData ? 'Editar Aviso' : 'Novo Aviso'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Título</label>
          <Input
            value={formData.text}
            onChange={e => setFormData({ ...formData, text: e.target.value })}
            placeholder="Ex: Campanha de Vacinação"
            className="bg-gray-700 border-gray-600 pl-4"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Mídia</label>
            <select
              value={formData.media_type}
              onChange={e => {
                const newType = e.target.value as MediaType;
                setFormData({ ...formData, media_type: newType });
                if (newType === 'youtube') {
                  setFile(null);
                  setPreview(null);
                } else {
                  setYoutubeUrl('');
                }
              }}
              className="w-full bg-gray-700 text-white rounded-lg border border-gray-600 p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="image">Imagem</option>
              <option value="video">Vídeo</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.priority || false}
                onChange={e => setFormData({ ...formData, priority: e.target.checked })}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Mensagem (TTS/Legenda)</label>
            <Input
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              placeholder="Ex: Vacine-se hoje mesmo!"
              className="bg-gray-700 border-gray-600 pl-4"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Duração (segundos)</label>
            <Input
              type="number"
              value={formData.duration}
              onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
              placeholder="10"
              className="bg-gray-700 border-gray-600 pl-4"
              min={1}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Ordem de Prioridade (Opcional)</label>
          <Input
            type="number"
            value={formData.priority_order}
            onChange={e => setFormData({ ...formData, priority_order: Number(e.target.value) })}
            placeholder="0"
            className="bg-gray-700 border-gray-600 pl-4"
          />
          <p className="text-xs text-gray-500 mt-1">Números menores aparecem primeiro.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-700/50 p-4 rounded-lg">
           <div className="col-span-2">
             <span className="text-sm font-bold text-gray-300 block mb-2">Agendamento (Opcional)</span>
           </div>
           <div>
             <label className="block text-xs text-gray-400 mb-1">Hora Início</label>
             <input
               type="time"
               value={formData.start_time || ''}
               onChange={e => setFormData({ ...formData, start_time: e.target.value })}
               className="w-full bg-gray-700 text-white rounded-lg border border-gray-600 p-2 focus:ring-2 focus:ring-green-500 outline-none"
             />
           </div>
           <div>
             <label className="block text-xs text-gray-400 mb-1">Hora Fim</label>
             <input
               type="time"
               value={formData.end_time || ''}
               onChange={e => setFormData({ ...formData, end_time: e.target.value })}
               className="w-full bg-gray-700 text-white rounded-lg border border-gray-600 p-2 focus:ring-2 focus:ring-green-500 outline-none"
             />
           </div>
        </div>

        {formData.media_type === 'youtube' ? (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">URL do YouTube</label>
            <Input
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="bg-gray-700 border-gray-600 pl-4"
            />
            <p className="text-xs text-gray-500 mt-1">Cole a URL completa do vídeo do YouTube</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Arquivo ({formData.media_type === 'video' ? 'Vídeo' : 'Imagem'})</label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept={formData.media_type === 'video' ? 'video/*' : 'image/*'}
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {preview ? (
                <div className="relative">
                   {formData.media_type === 'video' ? (
                     <video src={preview} className="max-h-48 mx-auto rounded shadow-lg" controls />
                   ) : (
                     <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded shadow-lg" />
                   )}
                   {file && <p className="mt-2 text-sm text-green-400 font-semibold">{file.name}</p>}
                   <p className="text-xs text-gray-400">{formData.media_type === 'video' ? 'Vídeo' : 'Imagem'}</p>
                   <p className="text-xs text-gray-500 mt-1">Clique para alterar</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">cloud_upload</span>
                  <p>Clique ou arraste para fazer upload</p>
                  <p className="text-xs mt-1 text-gray-500">{formData.media_type === 'video' ? 'Suporta MP4, WebM, etc.' : 'Suporta JPG, PNG, etc.'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-full text-white hover:bg-gray-700 transition"
          >
            Cancelar
          </button>
          <Button
            type="submit"
            disabled={loading}
            className="w-auto px-8"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm mr-2">refresh</span>
                Salvando...
              </>
            ) : (
              initialData ? 'Atualizar Aviso' : 'Salvar Aviso'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
