import React, { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button, Badge } from '@/components/ui';
import { WarningForm } from '../components/WarningForm';
import { useWarnings } from '../hooks/useWarnings';
import { deleteWarning, updateWarning } from '../services/warningsService';
import type { Warning } from '../types';
import { useResolvedWarningMediaUrl } from '../hooks/useResolvedWarningMediaUrl';
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
  RefreshCw
} from 'lucide-react';

const WarningsPage: React.FC = () => {
  usePageTitle('Gerenciar Avisos');

  const { warnings, loading, refetch } = useWarnings();
  const [showForm, setShowForm] = useState(false);
  const [editingWarning, setEditingWarning] = useState<Warning | undefined>();
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);

  const activeWarning = selectedWarning || (warnings.length > 0 ? warnings[0] : null);
  const resolvedActiveWarningUrl = useResolvedWarningMediaUrl(activeWarning?.content_url);

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
    <div className="grid w-full grid-cols-1 gap-4 lg:h-full lg:grid-cols-4 lg:overflow-hidden">
      <div className="bg-card rounded-2xl shadow-sm border border-border flex flex-col overflow-visible lg:col-span-1 lg:h-full lg:overflow-hidden">
        <div className="p-6 pb-4 border-b border-border">
          <h2 className="text-card-foreground text-xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-lg border border-border shadow-inner">
              <Megaphone className="text-muted-foreground" size={20} />
            </div>
            Avisos
          </h2>
        </div>

        <div className="p-3 border-b border-border">
          <Button
            onClick={() => {
              setEditingWarning(undefined);
              setShowForm(true);
            }}
            size="sm"
            className="w-full rounded-lg py-2.5"
          >
            <Plus size={16} />
            Novo Aviso
          </Button>
        </div>

        <div className="flex-1 min-h-0 lg:overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin opacity-40 mb-3" />
              <p className="text-sm">Carregando...</p>
            </div>
          ) : warnings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4 p-6">
              <div className="p-4 rounded-full bg-secondary/20 border border-border shadow-inner">
                <Megaphone className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <div className="max-w-xs">
                <p className="font-medium">Nenhum aviso</p>
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
                    'w-full text-left px-4 py-3 border-b border-border transition-all hover:bg-secondary/40',
                    activeWarning?.id === warning.id && 'bg-secondary border-l-2 border-l-primary'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        warning.active ? 'bg-secondary text-muted-foreground' : 'bg-background text-muted-foreground/70'
                      )}
                    >
                      {warning.media_type === 'video' ? <Video size={18} /> : <Image size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn('text-sm font-semibold truncate', warning.active ? 'text-card-foreground' : 'text-muted-foreground')}>
                          {warning.text || 'Sem título'}
                        </p>
                        {warning.priority && (
                          <Badge className="gap-1 border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
                            <Star size={12} className="shrink-0 fill-yellow-500 text-yellow-500" />
                            Alta
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={cn(
                            'gap-1',
                            warning.active
                              ? 'bg-green-500/10 text-green-300 border-green-500/30'
                              : 'bg-background text-muted-foreground border-border',
                          )}
                        >
                          {warning.active ? 'Ativo' : 'Inativo'} · {warning.duration || 10}s
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border flex flex-col overflow-visible lg:col-span-1 lg:h-full lg:overflow-hidden">
        <div className="p-6 pb-4 border-b border-border">
          <h2 className="text-card-foreground text-xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-lg border border-border shadow-inner">
              <Edit className="text-muted-foreground" size={20} />
            </div>
            {showForm ? (editingWarning ? 'Editar Aviso' : 'Novo Aviso') : 'Detalhes'}
          </h2>
        </div>

        <div className="flex-1 min-h-0 lg:overflow-y-auto custom-scrollbar p-6">
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
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Título</label>
                <p className="text-card-foreground font-semibold">{activeWarning.text || 'Sem título'}</p>
              </div>

              {activeWarning.message && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Mensagem</label>
                  <p className="text-muted-foreground text-sm">{activeWarning.message}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Status</label>
                  <Badge className={cn(activeWarning.active ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'text-muted-foreground')}>
                    {activeWarning.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Duração</label>
                  <p className="text-card-foreground text-sm font-medium">{activeWarning.duration || 10}s</p>
                </div>

                <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Tipo</label>
                  <p className="text-card-foreground text-sm font-medium capitalize">{activeWarning.media_type}</p>
                </div>

                {activeWarning.priority && (
                  <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                    <label className="block text-xs font-medium text-yellow-500/80 uppercase tracking-wider mb-1">Prioridade</label>
                    <Badge className="gap-1 border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
                      <Star size={14} className="fill-yellow-500 text-yellow-500" />
                      Alta
                    </Badge>
                  </div>
                )}
              </div>

              {(activeWarning.start_time || activeWarning.end_time) && (
                <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Agendamento</label>
                  <div className="flex items-center gap-2 text-card-foreground text-sm">
                    <Clock size={14} className="text-muted-foreground" />
                    <span>
                      {activeWarning.start_time ? activeWarning.start_time.slice(0, 5) : '00:00'} -{' '}
                      {activeWarning.end_time ? activeWarning.end_time.slice(0, 5) : '23:59'}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 mt-2 border-t border-border flex gap-2">
                <Button
                  onClick={() => toggleActive(activeWarning)}
                  size="sm"
                  variant="secondary"
                  className="flex-1 gap-2 rounded-lg py-2.5"
                >
                  {activeWarning.active ? <EyeOff size={16} /> : <Eye size={16} />}
                  {activeWarning.active ? 'Desativar' : 'Ativar'}
                </Button>

                <Button
                  onClick={() => {
                    setEditingWarning(activeWarning);
                    setShowForm(true);
                  }}
                  size="sm"
                  className="flex-1 gap-2 rounded-lg py-2.5"
                >
                  <Edit size={16} />
                  Editar
                </Button>

                <Button
                  onClick={() => handleDelete(activeWarning.id, activeWarning.content_url || '')}
                  size="sm"
                  variant="destructive"
                  className="w-auto px-4 rounded-lg"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4 opacity-60">
              <Megaphone className="h-12 w-12 opacity-20" />
              <p>Selecione um aviso para ver os detalhes ou crie um novo.</p>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col min-h-0 lg:h-full">
        <div className="bg-card rounded-2xl shadow-sm border border-border flex flex-col overflow-visible lg:h-full lg:overflow-hidden">
          <div className="p-6 pb-4 border-b border-border">
            <h2 className="text-card-foreground text-xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg border border-border shadow-inner">
                <Eye className="text-muted-foreground" size={20} />
              </div>
              Visualização
            </h2>
          </div>

          <div className="min-h-[18rem] lg:flex-1 lg:min-h-0 overflow-visible lg:overflow-hidden flex flex-col bg-background/40 relative">
            {activeWarning?.content_url ? (
              <div className="flex-1 flex items-center justify-center p-6">
                {resolvedActiveWarningUrl && activeWarning.media_type === 'video' ? (
                  <video
                    key={activeWarning.id}
                    src={resolvedActiveWarningUrl}
                    className="max-w-full max-h-full rounded-xl shadow-2xl"
                    controls
                    muted
                    preload="metadata"
                    playsInline
                  />
                ) : resolvedActiveWarningUrl ? (
                  <img
                    key={activeWarning.id}
                    src={resolvedActiveWarningUrl}
                    alt={activeWarning.text}
                    className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground max-w-sm">
                    <p className="font-medium">Mídia local não encontrada neste navegador.</p>
                    <p className="text-xs mt-2 opacity-70">Reenvie o arquivo neste computador para exibir o aviso.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4">
                <div className="p-4 rounded-full bg-secondary/20 border border-border shadow-inner">
                  <Eye className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div className="max-w-xs">
                  <p className="font-medium">Aguardando seleção</p>
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
