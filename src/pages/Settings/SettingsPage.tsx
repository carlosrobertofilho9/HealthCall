import React, { useEffect, useState } from 'react';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { getUniqueDestinations } from '@/actions/user';
import { toast } from 'react-toastify';
import { DESTINATION_ROOMS } from '@/constants';
import CustomSelect from '@/components/CustomSelect';

/**
 * A page for users to configure their application settings.
 * Currently, it allows setting a default destination for new patients,
 * which is saved to their user profile.
 */
const SettingsPage: React.FC = () => {
  const { profile, setDefaultDestination, loading } = useUserProfile();
  const baseRooms = [...DESTINATION_ROOMS] as string[];
  const [destinations, setDestinations] = useState<string[]>([...baseRooms]);
  const [selected, setSelected] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const selectOptions = [
    { value: '', label: 'Nenhum (selecionar ao adicionar)' },
    ...destinations.map(d => ({ value: d, label: d }))
  ];

  useEffect(() => {
    const fetchDestinations = async () => {
      setLoadingDestinations(true);
      try {
        const dbValues = await getUniqueDestinations();
        const set = new Set<string>([...baseRooms]);
        for (const d of dbValues) set.add(d);
        const extras = [...set].filter((d) => !baseRooms.includes(d)).sort((a, b) => a.localeCompare(b));
        setDestinations([...baseRooms, ...extras]);
      } catch (error) {
        toast.error('Erro ao carregar destinos.');
        console.error('Error loading destinations:', error);
      } finally {
        setLoadingDestinations(false);
      }
    };
    fetchDestinations();
  }, []);

  useEffect(() => {
    if (profile?.default_destination) setSelected(profile.default_destination);
  }, [profile?.default_destination]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('saving');
    try {
      await setDefaultDestination(selected || null);
      setSaveStatus('saved');
      toast.success('Configurações salvas');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      toast.error('Erro ao salvar configurações.');
      console.error('Error saving settings:', error);
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#1a2c22] rounded-2xl p-8 shadow-2xl max-w-xl mx-auto">
      <h2 className="text-white text-2xl font-bold leading-tight mb-6">Configurações</h2>
      <div className="space-y-6">
        <div>
          <label className="text-white font-medium mb-2 block" htmlFor="default-destination">
            Destino Padrão
          </label>
          <CustomSelect
            id="default-destination"
            options={selectOptions}
            value={selected}
            onChange={setSelected}
            disabled={loading || loadingDestinations}
            icon="meeting_room"
            loading={loadingDestinations}
          />
        </div>
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving || saveStatus === 'saved'}
            className="w-full flex items-center justify-center gap-2 rounded-full h-14 px-6 bg-primary text-[#122118] text-base font-bold hover:bg-opacity-80 transition-all disabled:opacity-60 focus:outline-none"
          >
            {saveStatus === 'saving' && (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            )}
            {saveStatus === 'saved' && (
              <span className="material-symbols-outlined">check_circle</span>
            )}
            {saveStatus === 'idle' && (
              <span className="material-symbols-outlined">save</span>
            )}
            {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
