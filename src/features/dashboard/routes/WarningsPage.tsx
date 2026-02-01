import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Warning } from '@/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { WarningOverlay } from '@/features/display/components/WarningOverlay';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { NewsTicker } from '@/features/display/components/NewsTicker';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableWarningItemProps {
  warning: Warning;
  isEditing: boolean;
  onToggleActive: (warning: Warning) => void;
  onTogglePriority: (warning: Warning) => void;
  onPreview: (warning: Warning) => void;
  onEdit: (warning: Warning) => void;
  onDelete: (id: string) => void;
}

const SortableWarningItem: React.FC<SortableWarningItemProps> = ({
  warning,
  isEditing,
  onToggleActive,
  onTogglePriority,
  onPreview,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: warning.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 flex items-start justify-between transition-colors border-l-4 ${
        warning.priority
          ? 'bg-yellow-900/20 border-yellow-500'
          : isEditing
          ? 'bg-green-900/20 border-green-500'
          : 'border-transparent hover:bg-gray-750'
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0 mr-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-2 text-gray-400 hover:text-white cursor-grab active:cursor-grabbing transition-colors mt-1"
          title="Arrastar para reordenar"
        >
          <span className="material-symbols-outlined">drag_indicator</span>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                warning.active ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={warning.active ? 'Ativo' : 'Inativo'}
            />
            {warning.priority && (
              <span
                className="material-symbols-outlined text-yellow-400 text-lg"
                title="Aviso Prioritário"
              >
                star
              </span>
            )}
            <p className="text-white font-semibold truncate">{warning.text}</p>
          </div>
          {warning.background_url && (
            <div className="flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-gray-400 text-sm">
                {warning.media_type === 'video' || warning.media_type === 'youtube'
                  ? 'videocam'
                  : 'image'}
              </span>
              <p className="text-sm text-gray-400 truncate max-w-md">
                {warning.background_url}
              </p>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Criado em: {new Date(warning.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onTogglePriority(warning)}
          className={`p-2 rounded-md transition-colors ${
            warning.priority
              ? 'text-yellow-400 hover:bg-gray-700'
              : 'text-gray-400 hover:bg-gray-700 hover:text-yellow-400'
          }`}
          title={warning.priority ? 'Remover prioridade' : 'Marcar como prioritário'}
        >
          <span className="material-symbols-outlined">
            {warning.priority ? 'star' : 'star_border'}
          </span>
        </button>

        <button
          onClick={() => onToggleActive(warning)}
          className={`p-2 rounded-md transition-colors ${
            warning.active
              ? 'text-green-400 hover:bg-gray-700'
              : 'text-gray-400 hover:bg-gray-700'
          }`}
          title={warning.active ? 'Desativar' : 'Ativar'}
        >
          <span className="material-symbols-outlined">
            {warning.active ? 'toggle_on' : 'toggle_off'}
          </span>
        </button>

        <button
          onClick={() => onPreview(warning)}
          className="p-2 text-purple-400 hover:bg-gray-700 rounded-md transition-colors"
          title="Visualizar e Ouvir"
        >
          <span className="material-symbols-outlined">visibility</span>
        </button>

        <button
          onClick={() => onEdit(warning)}
          className={`p-2 rounded-md transition-colors ${
            isEditing
              ? 'text-blue-400 bg-gray-700 ring-1 ring-blue-500'
              : 'text-blue-400 hover:bg-gray-700'
          }`}
          title="Editar"
        >
          <span className="material-symbols-outlined">edit</span>
        </button>

        <button
          onClick={() => onDelete(warning.id)}
          className="p-2 text-red-400 hover:bg-gray-700 rounded-md transition-colors"
          title="Excluir"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>
  );
};

const WarningsPage: React.FC = () => {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [mediaType, setMediaType] = useState<'image' | 'video' | 'youtube'>('image');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [qrcodeUrl, setQrcodeUrl] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState<number>(0);
  const [isPriority, setIsPriority] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Preview State
  const [previewWarning, setPreviewWarning] = useState<Warning | null>(null);
  const { speak, cancel } = useTextToSpeech();

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchWarnings();
  }, []);

  const handlePreview = async (warning: Warning) => {
    setPreviewWarning(warning);
    try {
      await speak(warning.text);
    } catch (e) {
      console.error('Preview TTS Error', e);
    }
  };

  const closePreview = () => {
    cancel();
    setPreviewWarning(null);
  };

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('warnings')
        .select('*')
        .order('priority', { ascending: false })
        .order('order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWarnings(data || []);
    } catch (error) {
      console.error('Error fetching warnings:', error);
      toast.error('Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('warning-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('warning-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Text is only required for images, videos/youtube can be without text
    if (mediaType === 'image' && !newText.trim()) return;

    try {
      setIsAdding(true);

      let finalUrl = newUrl;

      // Handle File Upload (Image or Video)
      if (file && (mediaType === 'image' || mediaType === 'video')) {
        const uploadedUrl = await handleFileUpload(file);
        if (uploadedUrl) {
          finalUrl = uploadedUrl;
        } else {
          setIsAdding(false);
          return;
        }
      } else if (mediaType === 'youtube') {
        finalUrl = youtubeUrl;
      }

      const warningData = {
        text: newText,
        background_url: finalUrl || null,
        media_type: mediaType,
        qrcode_url: qrcodeUrl || null,
        start_time: startTime || null,
        end_time: endTime || null,
        duration: duration || null,
        priority: isPriority,
      };

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('warnings')
          .update(warningData)
          .eq('id', editingId);

        if (error) throw error;

        setWarnings(
          warnings.map((w) => (w.id === editingId ? { ...w, ...warningData } : w))
        );
        toast.success('Aviso atualizado com sucesso');
      } else {
        // Create new - set order to be last
        const maxOrder = warnings.reduce((max, w) => Math.max(max, w.order || 0), 0);
        const { data, error } = await supabase
          .from('warnings')
          .insert([{ ...warningData, active: true, order: maxOrder + 1 }])
          .select()
          .single();

        if (error) throw error;
        setWarnings([data, ...warnings]);
        toast.success('Aviso adicionado com sucesso');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving warning:', error);
      toast.error('Erro ao salvar aviso');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (warning: Warning) => {
    setEditingId(warning.id);
    setNewText(warning.text);

    // Set Media Type and URLs
    setMediaType(warning.media_type || 'image');
    if (warning.media_type === 'youtube') {
      setYoutubeUrl(warning.background_url || '');
      setNewUrl('');
    } else {
      setNewUrl(warning.background_url || '');
      setYoutubeUrl('');
    }

    setQrcodeUrl(warning.qrcode_url || '');
    setStartTime(warning.start_time || '');
    setEndTime(warning.end_time || '');
    setDuration(warning.duration || 0);
    setIsPriority(warning.priority || false);

    setPreviewUrl(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setNewText('');
    setNewUrl('');
    setYoutubeUrl('');
    setQrcodeUrl('');
    setStartTime('');
    setEndTime('');
    setDuration(0);
    setMediaType('image');
    setIsPriority(false);
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('warnings').delete().eq('id', id);
      if (error) throw error;

      setWarnings(warnings.filter((w) => w.id !== id));
      if (editingId === id) resetForm();
      toast.success('Aviso removido');
    } catch (error) {
      console.error('Error deleting warning:', error);
      toast.error('Erro ao remover aviso');
    }
  };

  const toggleActive = async (warning: Warning) => {
    try {
      const { error } = await supabase
        .from('warnings')
        .update({ active: !warning.active })
        .eq('id', warning.id);

      if (error) throw error;

      setWarnings(
        warnings.map((w) => (w.id === warning.id ? { ...w, active: !w.active } : w))
      );
    } catch (error) {
      console.error('Error updating warning:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const togglePriority = async (warning: Warning) => {
    try {
      const newPriority = !warning.priority;
      const { error } = await supabase
        .from('warnings')
        .update({ priority: newPriority })
        .eq('id', warning.id);

      if (error) throw error;

      setWarnings(
        warnings.map((w) =>
          w.id === warning.id ? { ...w, priority: newPriority } : w
        )
      );
      
      // Re-fetch to get proper ordering
      fetchWarnings();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Erro ao atualizar prioridade');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = warnings.findIndex((w) => w.id === active.id);
    const newIndex = warnings.findIndex((w) => w.id === over.id);

    const newWarnings = arrayMove(warnings, oldIndex, newIndex);
    setWarnings(newWarnings);

    // Update order in database
    try {
      const updates = newWarnings.map((warning, index) => ({
        id: warning.id,
        order: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from('warnings')
          .update({ order: update.order })
          .eq('id', update.id);
      }

      toast.success('Ordem atualizada');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar ordem');
      // Revert on error
      fetchWarnings();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Gerenciar Avisos</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 sticky top-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingId ? 'Editar Aviso' : 'Novo Aviso'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Texto do Aviso (Falado e Exibido)
                  {mediaType !== 'image' && (
                    <span className="text-gray-500 text-xs ml-2">
                      (Opcional para vídeos)
                    </span>
                  )}
                </label>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  required={mediaType === 'image'}
                  placeholder="Ex: Por favor, aguardem sentados."
                />
              </div>

              {/* Priority Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-md">
                <label className="text-sm font-medium text-gray-300">
                  Marcar como prioritário
                </label>
                <button
                  type="button"
                  onClick={() => setIsPriority(!isPriority)}
                  className={`p-2 rounded-md transition-colors ${
                    isPriority
                      ? 'text-yellow-400'
                      : 'text-gray-400 hover:text-yellow-400'
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {isPriority ? 'star' : 'star_border'}
                  </span>
                </button>
              </div>

              {/* Media Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Mídia
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={mediaType === 'image'}
                      onChange={() => setMediaType('image')}
                      className="text-green-500 focus:ring-green-500 bg-gray-700"
                    />
                    <span className="text-white">Imagem</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={mediaType === 'video'}
                      onChange={() => setMediaType('video')}
                      className="text-green-500 focus:ring-green-500 bg-gray-700"
                    />
                    <span className="text-white">Vídeo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={mediaType === 'youtube'}
                      onChange={() => setMediaType('youtube')}
                      className="text-green-500 focus:ring-green-500 bg-gray-700"
                    />
                    <span className="text-white">YouTube</span>
                  </label>
                </div>
              </div>

              {/* Media Inputs */}
              {(mediaType === 'image' || mediaType === 'video') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {mediaType === 'image'
                        ? 'URL da Imagem (Opcional)'
                        : 'URL do Vídeo (Opcional)'}
                    </label>
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={
                        mediaType === 'image'
                          ? 'https://exemplo.com/imagem.jpg'
                          : 'https://exemplo.com/video.mp4'
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Ou faça upload ({mediaType === 'image' ? 'Imagem' : 'Vídeo'})
                    </label>
                    <input
                      key={mediaType} // Force remount on type change
                      ref={fileInputRef}
                      type="file"
                      accept={
                        mediaType === 'image'
                          ? '.jpg,.jpeg,.png,.webp,.gif'
                          : '.mp4,.webm,.ogg,.mov'
                      }
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) {
                          // Validate file size (max 50MB for video, 5MB for image)
                          const limit =
                            mediaType === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
                          if (selectedFile.size > limit) {
                            toast.error(
                              `O arquivo deve ter no máximo ${
                                mediaType === 'video' ? '50MB' : '5MB'
                              }`
                            );
                            if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input on error
                            return;
                          }

                          setFile(selectedFile);
                          setNewUrl('');

                          // Create local preview if image
                          if (selectedFile.type.startsWith('image/')) {
                            const objectUrl = URL.createObjectURL(selectedFile);
                            setPreviewUrl(objectUrl);
                          } else {
                            setPreviewUrl(null);
                          }
                        }
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                    />
                  </div>
                </>
              )}

              {mediaType === 'youtube' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    URL do Vídeo do YouTube
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              {(newUrl || previewUrl) && mediaType === 'image' && (
                <div className="mt-2 text-center p-2 bg-gray-900 rounded border border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Pré-visualização da imagem:</p>
                  <img
                    src={previewUrl || newUrl}
                    alt="Preview"
                    className="max-h-32 mx-auto rounded object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}

              {/* QR Code */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  URL para QR Code (Opcional)
                </label>
                <input
                  type="url"
                  value={qrcodeUrl}
                  onChange={(e) => setQrcodeUrl(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://pesquisa.com/satisfacao"
                />
              </div>

              {/* Duration for Video/YouTube */}
              {(mediaType === 'video' || mediaType === 'youtube') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Duração do Vídeo (segundos)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ex: 30"
                    min="0"
                  />
                  {duration > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {Math.floor(duration / 60)}:{(duration % 60)
                        .toString()
                        .padStart(2, '0')}{' '}
                      minutos
                    </p>
                  )}
                </div>
              )}

              {/* Scheduling */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Hora Início
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Hora Fim
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isAdding || (mediaType === 'image' && !newText.trim())}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding
                    ? 'Salvando...'
                    : editingId
                    ? 'Salvar Alterações'
                    : 'Adicionar Aviso'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Avisos Cadastrados</h2>
              <p className="text-sm text-gray-400 mt-1">
                Arraste os avisos para reordená-los
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : warnings.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                Nenhum aviso cadastrado.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={warnings.map((w) => w.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y divide-gray-700">
                    {warnings.map((warning) => (
                      <SortableWarningItem
                        key={warning.id}
                        warning={warning}
                        isEditing={editingId === warning.id}
                        onToggleActive={toggleActive}
                        onTogglePriority={togglePriority}
                        onPreview={handlePreview}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-10">
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800 flex flex-col">
            <div className="flex-grow relative">
              <WarningOverlay
                warning={previewWarning}
                isPreview={true}
                onClose={closePreview}
              />
            </div>
            {/* Simulate Ticker in Preview */}
            <div className="relative z-50">
              <NewsTicker />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarningsPage;
