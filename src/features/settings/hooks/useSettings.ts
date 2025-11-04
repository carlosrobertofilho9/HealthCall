import { useState, useEffect, useCallback } from 'react';
import { useUserProfileStore } from '@/store/userProfile';
import * as settingsService from '@/features/settings/services/settingsService';
import { toast } from 'react-toastify';
import { DESTINATION_ROOMS } from '@/constants';

export function useSettings() {
  const { profile, loading: profileLoading, setDefaultDestination } = useUserProfileStore();
  const [destinations, setDestinations] = useState<string[]>([...DESTINATION_ROOMS]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDestinations = async () => {
      setLoading(true);
      try {
        const dbValues = await settingsService.getUniqueDestinations();
        const set = new Set<string>([...DESTINATION_ROOMS, ...dbValues.filter(d => d)]); // Filter out empty strings
        setDestinations([...set].sort((a, b) => a.localeCompare(b)));
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  useEffect(() => {
    if (profile?.default_destination) {
      setSelected(profile.default_destination);
    }
  }, [profile]);

  const saveDefaultDestination = useCallback(async () => {
    setSaving(true);
    try {
      await setDefaultDestination(selected || null);
      toast.success('Configurações salvas!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }, [selected, setDefaultDestination]);

  return {
    destinations,
    selected,
    setSelected,
    loading: profileLoading || loading,
    saving,
    saveDefaultDestination,
  };
}
