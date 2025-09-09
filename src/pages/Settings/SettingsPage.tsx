import React, { useEffect, useState } from 'react';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { getUniqueDestinations } from '@/actions/user';
import { toast } from 'react-toastify';
import { DESTINATION_ROOMS } from '@/constants';

const SettingsPage: React.FC = () => {
  const { profile, setDefaultDestination, loading } = useUserProfile();
  const baseRooms = [...DESTINATION_ROOMS] as string[];
  const [destinations, setDestinations] = useState<string[]>([...baseRooms]);
  const [selected, setSelected] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Mescla valores default (constantes) com valores existentes no banco
    getUniqueDestinations().then((dbValues) => {
      const set = new Set<string>([...baseRooms]);
      for (const d of dbValues) set.add(d);
      // Mantém ordem das constantes e adiciona extras (do banco) ordenados
      const extras = [...set].filter((d) => !baseRooms.includes(d)).sort((a, b) => a.localeCompare(b));
      setDestinations([...baseRooms, ...extras]);
    });
  }, []);

  useEffect(() => {
    if (profile?.default_destination) setSelected(profile.default_destination);
  }, [profile?.default_destination]);

  const handleSave = async () => {
    setSaving(true);
    await setDefaultDestination(selected || null);
    setSaving(false);
    toast.success('Configurações salvas');
  };

  return (
    <div className="bg-[#1a2c22] rounded-2xl p-8 shadow-2xl max-w-xl">
      <h2 className="text-white text-2xl font-bold leading-tight mb-6">Configurações</h2>
      <div className="space-y-6">
        <div>
          <label className="text-white font-medium mb-2 block" htmlFor="default-destination">
            Destino Padrão
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96c5a9]">meeting_room</span>
            <select
              id="default-destination"
              className="form-select appearance-none w-full rounded-full text-white bg-[#264532] border-none h-14 pl-12 pr-10 placeholder:text-[#96c5a9] focus:ring-2 focus:ring-primary transition-all"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={loading}
            >
              <option value="">Nenhum (selecionar ao adicionar)</option>
              {destinations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#96c5a9] pointer-events-none">expand_more</span>
          </div>
        </div>
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-full h-14 px-6 bg-primary text-[#122118] text-base font-bold hover:bg-opacity-80 transition-all disabled:opacity-60"
          >
            <span className="material-symbols-outlined">save</span>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
