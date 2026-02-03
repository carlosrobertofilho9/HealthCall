import React, { useState } from 'react';
import { Warning } from '@/types';
import { toast } from 'sonner';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { SortableWarningItem } from '../components/SortableWarningItem';
import { useWarnings } from '../hooks/useWarnings';

const WarningsPage: React.FC = () => {
  const {
    warnings,
    loading,
    addWarning,
    updateWarning,
    removeWarning,
    toggleWarningActive,
    reorderWarnings,
    saveWarningMedia,
  } = useWarnings();

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

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const localUrl = await saveWarningMedia(file);
      return localUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao fazer upload do arquivo');
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
        await updateWarning(editingId, warningData);
      } else {
        // Create new - set order to be last
        const maxOrder = warnings.reduce((max, w) => Math.max(max, w.order || 0), 0);
        await addWarning({ ...warningData, active: true, order: maxOrder + 1 });
      }

      resetForm();
    } catch (error) {
      console.error('Error saving warning:', error);
      // Toast handled in hook
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
      const success = await removeWarning(id);
      if (success && editingId === id) resetForm();
    } catch (error) {
      console.error('Error deleting warning:', error);
    }
  };

  const toggleActive = async (warning: Warning) => {
    await toggleWarningActive(warning.id);
  };

  const togglePriority = async (warning: Warning) => {
    const newPriority = !warning.priority;
    await updateWarning(warning.id, { priority: newPriority });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = warnings.findIndex((w) => w.id === active.id);
    const newIndex = warnings.findIndex((w) => w.id === over.id);

    const newWarnings = arrayMove(warnings, oldIndex, newIndex);
    
    // Optimistic update handled by hook re-fetch, but for drag we might want local state update?
    // The hook will update warnings when reorder returns/notifies.
    // Ideally we should update local state optimistically here if we want super smooth UI,
    // but DndKit handles the visual drag. When dropped, we call reorder.
    
    // However, if we don't update local state immediately, it might snap back until network returns.
    // For now, let's rely on the hook's fast update or the re-render.
    // Actually, `useWarnings` doesn't expose a `setWarnings`, so we rely on re-fetch.
    
    const orderedIds = newWarnings.map((w) => w.id);
    await reorderWarnings(orderedIds);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1 bg-[#1a2c22] rounded-2xl p-8 shadow-2xl h-fit">
          <div className="text-left mb-8">
            <h2 className="text-white text-2xl font-bold leading-tight">
              {editingId ? 'Editar Aviso' : 'Novo Aviso'}
            </h2>
            <p className="text-[#96c5a9] mt-1">
              {editingId ? 'Atualize as informações do aviso.' : 'Crie um novo aviso para exibição.'}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Duration for YouTube only - Video local plays completely automatically */}
              {mediaType === 'youtube' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Duração do Vídeo do YouTube (segundos)
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ex: 30"
                    min="1"
                    required
                  />
                  {duration > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {Math.floor(duration / 60)}:{(duration % 60)
                        .toString()
                        .padStart(2, '0')}{' '}
                      minutos
                    </p>
                  )}
                  <p className="text-xs text-yellow-400 mt-1">
                    ⚠️ Informe a duração do vídeo do YouTube para que ele seja exibido pelo tempo correto.
                  </p>
                </div>
              )}

              {/* Info message for local video */}
              {mediaType === 'video' && (
                <div className="p-3 bg-green-900/30 border border-green-700/50 rounded-md">
                  <p className="text-xs text-green-400 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">info</span>
                    O vídeo será reproduzido automaticamente do início ao fim.
                  </p>
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

        {/* List */}
        <div className="lg:col-span-2 bg-[#1a2c22] rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col justify-between mb-8">
            <div className="text-left">
              <h2 className="text-white text-2xl font-bold leading-tight">Avisos Cadastrados</h2>
              <p className="text-[#96c5a9] mt-1">
                Arraste os avisos para reordená-los. Marque como prioritário para destaque.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10 text-[#96c5a9]">
              <p>Carregando...</p>
            </div>
          ) : warnings.length === 0 ? (
            <div className="text-center py-10 text-[#96c5a9]">
              <p>Nenhum aviso cadastrado.</p>
            </div>
          ) : (
            <div className={`space-y-4 pr-2 ${warnings.length > 4 ? 'max-h-[calc(100vh-22rem)] overflow-y-auto' : ''}`}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={warnings.map((w) => w.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
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
            </div>
          )}
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
    </>
  );
};

export default WarningsPage;
