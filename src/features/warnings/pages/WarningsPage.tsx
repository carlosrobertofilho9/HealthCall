import React, { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePageTitle } from '@/hooks/usePageTitle';
import { WarningForm } from '../components/WarningForm';
import { useWarnings } from '../hooks/useWarnings';
import { deleteWarning, updateWarning } from '../services/warningsService';
import type { Warning } from '../types';
import {
  Megaphone,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  Star,
  Clock,
  Image,
  Video,
  RefreshCw,
} from 'lucide-react';

const WarningsPage: React.FC = () => {
  usePageTitle('Gerenciar Avisos');

  const { warnings, loading, refetch } = useWarnings();
  const [showForm, setShowForm] = useState(false);
  const [editingWarning, setEditingWarning] = useState<Warning | undefined>();
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);

  const activeWarning = selectedWarning || (warnings.length > 0 ? warnings[0] : null);

  const handleDelete = async (id: string, contentUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) return;

    try {
      await deleteWarning(id, contentUrl);
      toast.success('Aviso excluído');
      if (selectedWarning?.id === id) {
        setSelectedWarning(null);
      }
      refetch();
    } catch {
      toast.error('Erro ao excluir aviso');
    }
  };

  const toggleActive = async (warning: Warning) => {
    try {
      await updateWarning({ id: warning.id, active: !warning.active });
      toast.success(warning.active ? 'Aviso desativado' : 'Aviso ativado');
      refetch();
    } catch {
      toast.error('Erro ao atualizar status do aviso');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 w-full h-[calc(100vh-8rem)]">
      <div className="bg-[#1a2c22] rounded-2xl shadow-2xl border border-white/5 flex flex-col h-full overflow-hidden lg:col-span-1">
        <div className="p-6 pb-4 border-b border-white/5">
          <h2 className="text-white text-xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-[#264532] rounded-lg border border-white/5 shadow-inner">
              <Megaphone className="text-[#96c5a9]" size={20} />
            </div>
            Avisos
          </h2>
        </div>

        <div className="p-3 border-b border-white/5">
          <button
            onClick={() => {
              setEditingWarning(undefined);
              setShowForm(true);
            }}
            className="w-full bg-[#264532] text-[#96c5a9] border border-white/5 hover:bg-green-500 hover:text-white hover:border-green-400 hover:shadow-green-500/20 shadow-sm transition-all rounded-lg py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Novo Aviso
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <RefreshCw className="h-8 w-8 animate-spin opacity-40 mb-3" />
              <p className="text-sm">Carregando...</p>
            </div>
          ) : warnings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4 p-6">
              <div className="p-4 rounded-full bg-[#264532]/20 border border-white/5 shadow-inner">
                <Megaphone className="h-8 w-8 text-[#96c5a9]/40" />
              </div>
              <div className="max-w-xs">
                <p className="font-medium text-gray-400">Nenhum aviso</p>
                <p className="text-xs mt-1 opacity-60">Cadastre vídeos ou imagens para o display.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {warnings.map((warning) => (
                <button
                  key={warning.id}
                  onClick={() => setSelectedWarning(warning)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-white/5 transition-all hover:bg-[#264532]/50',
                    activeWarning?.id === warning.id && 'bg-[#264532] border-l-2 border-l-[#96c5a9]'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        warning.active ? 'bg-[#264532] text-[#96c5a9]' : 'bg-gray-800 text-gray-500'
                      )}
                    >
                      {warning.media_type === 'video' ? <Video size={18} /> : <Image size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn('text-sm font-semibold truncate', warning.active ? 'text-white' : 'text-gray-500')}>
                          {warning.text || 'Sem título'}
                        </p>
                        {warning.priority && <Star size={12} className="text-yellow-500 shrink-0 fill-yellow-500" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={cn(
                            'w-1.5 h-1.5 rounded-full shrink-0',
                            warning.active ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-gray-600'
                          )}
                        />
                        <span className="text-xs text-gray-500">
                          {warning.active ? 'Ativo' : 'Inativo'} · {warning.duration || 10}s
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1a2c22] rounded-2xl shadow-2xl border border-white/5 flex flex-col h-full overflow-hidden lg:col-span-1">
        <div className="p-6 pb-4 border-b border-white/5">
          <h2 className="text-white text-xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-[#264532] rounded-lg border border-white/5 shadow-inner">
              <Edit className="text-[#96c5a9]" size={20} />
            </div>
            {showForm ? (editingWarning ? 'Editar Aviso' : 'Novo Aviso') : 'Detalhes'}
          </h2>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
          {showForm ? (
            <WarningForm
              initialData={editingWarning}
              onSuccess={() => {
                setShowForm(false);
                setEditingWarning(undefined);
                refetch();
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingWarning(undefined);
              }}
            />
          ) : activeWarning ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#96c5a9]/60 uppercase tracking-wider mb-1">Título</label>
                <p className="text-white font-semibold">{activeWarning.text || 'Sem título'}</p>
              </div>

              {activeWarning.message && (
                <div>
                  <label className="block text-xs font-medium text-[#96c5a9]/60 uppercase tracking-wider mb-1">Mensagem</label>
                  <p className="text-gray-300 text-sm">{activeWarning.message}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#264532]/30 rounded-lg p-3 border border-white/5">
                  <label className="block text-xs font-medium text-[#96c5a9]/60 uppercase tracking-wider mb-1">Status</label>
                  <span className={cn('text-sm font-medium', activeWarning.active ? 'text-green-400' : 'text-gray-500')}>
                    {activeWarning.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="bg-[#264532]/30 rounded-lg p-3 border border-white/5">
                  <label className="block text-xs font-medium text-[#96c5a9]/60 uppercase tracking-wider mb-1">Duração</label>
                  <p className="text-white text-sm font-medium">{activeWarning.duration || 10}s</p>
                </div>

                <div className="bg-[#264532]/30 rounded-lg p-3 border border-white/5">
                  <label className="block text-xs font-medium text-[#96c5a9]/60 uppercase tracking-wider mb-1">Tipo</label>
                  <p className="text-white text-sm font-medium capitalize">{activeWarning.media_type}</p>
                </div>

                {activeWarning.priority && (
                  <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                    <label className="block text-xs font-medium text-yellow-500/80 uppercase tracking-wider mb-1">Prioridade</label>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-yellow-400 text-sm font-medium">Alta</span>
                    </div>
                  </div>
                )}
              </div>

              {(activeWarning.start_time || activeWarning.end_time) && (
                <div className="bg-[#264532]/30 rounded-lg p-3 border border-white/5">
                  <label className="block text-xs font-medium text-[#96c5a9]/60 uppercase tracking-wider mb-1">Agendamento</label>
                  <div className="flex items-center gap-2 text-white text-sm">
                    <Clock size={14} className="text-[#96c5a9]/60" />
                    <span>
                      {activeWarning.start_time ? activeWarning.start_time.slice(0, 5) : '00:00'} -{' '}
                      {activeWarning.end_time ? activeWarning.end_time.slice(0, 5) : '23:59'}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 mt-2 border-t border-white/5 flex gap-2">
                <button
                  onClick={() => toggleActive(activeWarning)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all',
                    activeWarning.active
                      ? 'bg-gray-800/50 border-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                      : 'bg-[#264532]/30 border-white/5 text-[#96c5a9] hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20'
                  )}
                >
                  {activeWarning.active ? <EyeOff size={16} /> : <Eye size={16} />}
                  {activeWarning.active ? 'Desativar' : 'Ativar'}
                </button>

                <button
                  onClick={() => {
                    setEditingWarning(activeWarning);
                    setShowForm(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-[#264532] text-[#96c5a9] border border-white/5 hover:bg-green-500 hover:text-white hover:border-green-400 transition-all"
                >
                  <Edit size={16} />
                  Editar
                </button>

                <button
                  onClick={() => handleDelete(activeWarning.id, activeWarning.content_url || '')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium bg-gray-800/50 text-gray-400 border border-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4 opacity-60">
              <Megaphone className="h-12 w-12 opacity-20" />
              <p>Selecione um aviso para ver os detalhes ou crie um novo.</p>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col h-full min-h-0">
        <div className="bg-[#1a2c22] rounded-2xl shadow-2xl border border-white/5 flex flex-col h-full overflow-hidden">
          <div className="p-6 pb-4 border-b border-white/5">
            <h2 className="text-white text-xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 bg-[#264532] rounded-lg border border-white/5 shadow-inner">
                <Eye className="text-[#96c5a9]" size={20} />
              </div>
              Visualização
            </h2>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white/5 relative">
            {activeWarning?.content_url ? (
              <div className="flex-1 flex items-center justify-center p-6">
                {activeWarning.media_type === 'video' ? (
                  <video
                    key={activeWarning.id}
                    src={activeWarning.content_url}
                    className="max-w-full max-h-full rounded-xl shadow-2xl"
                    controls
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    key={activeWarning.id}
                    src={activeWarning.content_url}
                    alt={activeWarning.text}
                    className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
                <div className="p-4 rounded-full bg-[#264532]/20 border border-white/5 shadow-inner">
                  <Eye className="h-8 w-8 text-[#96c5a9]/40" />
                </div>
                <div className="max-w-xs">
                  <p className="font-medium text-gray-400">Aguardando seleção</p>
                  <p className="text-xs mt-1 opacity-60">Selecione um aviso para visualizar a mídia.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarningsPage;
