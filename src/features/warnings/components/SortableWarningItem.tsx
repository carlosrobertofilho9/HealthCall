import React from 'react';
import { Warning } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
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

export const SortableWarningItem: React.FC<SortableWarningItemProps> = ({
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

  const isInactive = !warning.active;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[#264532] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
        isInactive ? 'opacity-60' : ''
      } ${
        warning.priority ? 'ring-2 ring-yellow-500/50' : ''
      } ${
        isEditing ? 'ring-2 ring-blue-500/50' : ''
      }`}
    >
      <div className="flex items-start gap-3 flex-1">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex items-center justify-center rounded-full h-10 w-10 bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-white cursor-grab active:cursor-grabbing transition-colors mt-1"
          title="Arrastar para reordenar"
          aria-label="Arrastar para reordenar"
        >
          <span className="material-symbols-outlined text-base">drag_indicator</span>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {warning.priority && (
              <span
                className="material-symbols-outlined text-yellow-400 text-lg"
                title="Aviso Prioritário"
              >
                star
              </span>
            )}
            <p className="text-white font-bold text-lg">{warning.text || '(Sem texto)'}</p>
            {!warning.active && (
              <span className="bg-red-500/20 text-red-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Inativo
              </span>
            )}
          </div>
          {warning.background_url && (
            <p className="text-[#96c5a9] text-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">
                {warning.media_type === 'video' || warning.media_type === 'youtube'
                  ? 'videocam'
                  : 'image'}
              </span>
              {warning.media_type === 'youtube' ? 'YouTube' : warning.media_type === 'video' ? 'Vídeo' : 'Imagem'}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Criado em: {new Date(warning.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
        <button
          onClick={() => onTogglePriority(warning)}
          className={`flex items-center justify-center rounded-full h-10 w-10 ${
            warning.priority
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
              : 'bg-yellow-500/10 text-yellow-400/50 hover:bg-yellow-500/20'
          } transition-colors`}
          title={warning.priority ? 'Remover prioridade' : 'Marcar como prioritário'}
          aria-label={warning.priority ? 'Remover prioridade' : 'Marcar como prioritário'}
        >
          <span className="material-symbols-outlined text-base">
            {warning.priority ? 'star' : 'star_border'}
          </span>
        </button>

        <button
          onClick={() => onToggleActive(warning)}
          className={`flex items-center justify-center rounded-full h-10 w-10 ${
            warning.active
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          } transition-colors`}
          title={warning.active ? 'Desativar' : 'Ativar'}
          aria-label={warning.active ? 'Desativar' : 'Ativar'}
        >
          <span className="material-symbols-outlined text-base">
            {warning.active ? 'toggle_on' : 'toggle_off'}
          </span>
        </button>

        <button
          onClick={() => onPreview(warning)}
          className="flex items-center justify-center rounded-full h-10 w-10 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
          title="Visualizar e Ouvir"
          aria-label="Visualizar e Ouvir"
        >
          <span className="material-symbols-outlined text-base">visibility</span>
        </button>

        <button
          onClick={() => onEdit(warning)}
          className={`flex items-center justify-center rounded-full h-10 w-10 ${
            isEditing
              ? 'bg-blue-500/30 text-blue-300 ring-2 ring-blue-500/50'
              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
          } transition-colors`}
          title="Editar"
          aria-label="Editar"
        >
          <span className="material-symbols-outlined text-base">edit</span>
        </button>

        <button
          onClick={() => onDelete(warning.id)}
          className="flex items-center justify-center rounded-full h-10 w-10 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          title="Excluir"
          aria-label="Excluir"
        >
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      </div>
    </div>
  );
};
