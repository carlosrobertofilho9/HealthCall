import { createContext, useContext } from 'react';
import { UserProfile } from '@/types';

/**
 * Define a forma dos dados fornecidos pelo `UserProfileContext`.
 */
export type UserProfileContextType = {
  /** O objeto de perfil do usuário, ou `null` se não estiver carregado. */
  profile: UserProfile | null;
  /** Um booleano que indica se o perfil está sendo carregado. */
  loading: boolean;
  /** Uma função para forçar a recarga dos dados do perfil. */
  refresh: () => Promise<void>;
  /** Uma função para definir o destino padrão do usuário. */
  setDefaultDestination: (dest: string | null) => Promise<void>;
  /** Uma função para atualizar diretamente o estado do perfil no contexto. */
  setProfile: (profile: UserProfile | null) => void;
};

/**
 * Contexto React para fornecer dados e ações relacionadas ao perfil do usuário.
 */
export const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

/**
 * Um hook customizado para acessar os dados e ações do perfil do usuário.
 *
 * Este hook consome o `UserProfileContext` e fornece uma maneira fácil para os componentes
 * acessarem o perfil do usuário, o estado de carregamento e as funções para
 * interagir com ele.
 *
 * @returns {UserProfileContextType} O objeto de contexto contendo os dados e ações do perfil.
 * @throws {Error} Se o hook for usado fora de um `UserProfileProvider`.
 */
export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile deve ser usado dentro de UserProfileProvider');
  return ctx;
}
