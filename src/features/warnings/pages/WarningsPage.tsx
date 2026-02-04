import React, { useState } from 'react';
import { useWarnings } from '../hooks/useWarnings';
import { WarningForm } from '../components/WarningForm';
import { deleteWarning, updateWarning } from '../services/warningsService';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';

const WarningsPage: React.FC = () => {
  usePageTitle('Gerenciar Avisos');
  const { warnings, loading, refetch } = useWarnings();
  const [showForm, setShowForm] = useState(false);
  const [editingWarning, setEditingWarning] = useState<import('../types').Warning | undefined>(undefined);

  const handleDelete = async (id: string, url: string) => {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) return;
    try {
      await deleteWarning(id, url);
      toast.success('Aviso excluído');
      refetch();
    } catch (e) {
      toast.error('Erro ao excluir');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateWarning({ id, active: !currentStatus });
      toast.success(currentStatus ? 'Aviso desativado' : 'Aviso ativado');
      refetch();
    } catch (e) {
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Avisos e Anúncios</h1>
          <p className="text-gray-400 mt-1">Gerencie o conteúdo exibido na tela de espera</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingWarning(undefined);
              setShowForm(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transition"
          >
            <span className="material-symbols-outlined">add</span>
            Novo Aviso
          </button>
        )}
      </div>

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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full py-20 text-center text-gray-500">
               <span className="material-symbols-outlined animate-spin text-4xl mb-4">refresh</span>
               <p>Carregando avisos...</p>
             </div>
          ) : warnings.length === 0 ? (
             <div className="col-span-full py-20 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed text-center flex flex-col items-center justify-center">
               <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
                 <span className="material-symbols-outlined text-3xl">campaign</span>
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Nenhum aviso cadastrado</h3>
               <p className="text-gray-400 max-w-sm mb-6">Cadastre vídeos ou imagens para serem exibidos na tela de espera quando não houver chamadas.</p>
                <button
                  onClick={() => {
                    setEditingWarning(undefined);
                    setShowForm(true);
                  }}
                  className="text-green-400 font-bold hover:text-green-300 transition"
                >
                  Criar meu primeiro aviso
                </button>
             </div>
          ) : (
            warnings.map(warning => (
              <div key={warning.id} className={`bg-gray-800 rounded-xl overflow-hidden border transition-all ${warning.active ? 'border-gray-700 hover:border-green-500/50' : 'border-gray-700 opacity-60'} ${warning.priority ? 'ring-2 ring-yellow-500/50' : ''}`}>
                <div className="aspect-video bg-black relative group">
                  {warning.media_type === 'video' && warning.content_url ? (
                    <video 
                      src={`${warning.content_url}#t=0.5`} 
                      className="w-full h-full object-cover" 
                      preload="metadata"
                      muted
                      playsInline
                    />
                  ) : warning.media_type === 'youtube' ? (
                    <div className="w-full h-full flex items-center justify-center bg-red-900/20">
                      <span className="material-symbols-outlined text-6xl text-red-500">smart_display</span>
                    </div>
                  ) : warning.content_url ? (
                    <img src={warning.content_url} alt={warning.text} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <span className="material-symbols-outlined text-4xl text-gray-500">image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                     <button
                       onClick={() => toggleActive(warning.id, warning.active)}
                       className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"
                       title={warning.active ? 'Desativar' : 'Ativar'}
                     >
                       <span className="material-symbols-outlined">{warning.active ? 'visibility_off' : 'visibility'}</span>
                     </button>
                     <button
                       onClick={() => {
                         setEditingWarning(warning);
                         setShowForm(true);
                       }}
                       className="p-2 bg-blue-500/80 rounded-full hover:bg-blue-500 text-white"
                       title="Editar"
                     >
                       <span className="material-symbols-outlined">edit</span>
                     </button>
                     <button
                       onClick={() => handleDelete(warning.id, warning.content_url || '')}
                       className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 text-white"
                       title="Excluir"
                     >
                       <span className="material-symbols-outlined">delete</span>
                     </button>
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {warning.priority && (
                      <span className="px-2 py-1 bg-yellow-500/80 rounded text-xs text-black font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">star</span>
                        Prioridade
                      </span>
                    )}
                    <span className="px-2 py-1 bg-black/60 rounded text-xs text-white font-mono flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">
                        {warning.media_type === 'video' ? 'videocam' : warning.media_type === 'youtube' ? 'smart_display' : 'image'}
                      </span>
                      {warning.duration || 10}s
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white line-clamp-1" title={warning.text}>{warning.text || 'Sem título'}</h3>
                    <div className={`w-2 h-2 rounded-full mt-2 ${warning.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-500'}`} />
                  </div>
                  
                  {warning.message && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3 h-10">{warning.message}</p>
                  )}
                  
                  {(warning.start_time || warning.end_time) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-900/50 p-2 rounded">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>
                        {warning.start_time ? warning.start_time.slice(0, 5) : '00:00'} - {warning.end_time ? warning.end_time.slice(0, 5) : '23:59'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default WarningsPage;
