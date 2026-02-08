import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import * as settingsService from '@/features/settings/services/settingsService';
import { updateUserDestination } from '@/features/authentication/services/authService';
import { toast } from 'sonner';
import { DESTINATION_ROOMS } from '@/constants';

/**
 * Um hook para gerenciar a lógica e o estado da página de Configurações.
 *
 * Este hook é responsável por:
 * - Buscar a lista de destinos de pacientes únicos para preencher o seletor.
 * - Obter o perfil do usuário atual para preencher o destino padrão.
 * - Gerenciar o estado do destino selecionado.
 * - Fornecer uma função para salvar o destino padrão do usuário.
 * - Lidar com os estados de carregamento e salvamento.
 *
 * @returns {{
 *   destinations: string[],
 *   selected: string,
 *   setSelected: (value: string) => void,
 *   loading: boolean,
 *   saving: boolean,
 *   saveDefaultDestination: () => Promise<void>
 * }} Um objeto contendo o estado das configurações e as funções de interação.
 */
export function useSettings() {
  const { profile, loading: profileLoading, setProfile } = useUserProfile();
  const { user } = useAuth();
  const [destinations, setDestinations] = useState<string[]>([...DESTINATION_ROOMS]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDestinations = async () => {
      setLoading(true);
      try {
        const dbValues = await settingsService.getUniqueDestinations();
        const set = new Set<string>([...DESTINATION_ROOMS, ...dbValues.filter(d => d)]);
        setDestinations([...set].sort((a, b) => a.localeCompare(b)));
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  // Prioriza o destino do usuário autenticado
  useEffect(() => {
    if (user?.default_destination) {
      setSelected(user.default_destination);
    } else if (profile?.default_destination) {
      setSelected(profile.default_destination);
    }
  }, [user, profile]);

  const saveDefaultDestination = useCallback(async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }
    setSaving(true);
    try {
      // Salva no usuário autenticado (tabela users)
      const updatedUser = await updateUserDestination(user.id, selected || null);
      if (updatedUser) {
        toast.success('Configurações salvas!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }, [user, selected]);

  return {
    destinations,
    selected,
    setSelected,
    loading: profileLoading || loading,
    saving,
    saveDefaultDestination,
  };
}
