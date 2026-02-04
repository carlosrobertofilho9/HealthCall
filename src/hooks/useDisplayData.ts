import { createContext, useContext } from 'react';
import type { CallRecord, Patient } from '@/types';

/**
 * Define a forma dos dados fornecidos pelo `DisplayDataContext`.
 */
export interface DisplayDataContextProps {
  /** O paciente que está sendo chamado atualmente. */
  calledPatient: Patient | null;
  /** Uma lista de pacientes que são os próximos a serem chamados. */
  nextPatients: Patient[];
  /** O histórico de chamadas recentes. */
  callHistory: CallRecord[];
  /** Um booleano que indica se uma chamada está em andamento (e o áudio pode estar tocando). */
  isCalling: boolean;
  /** Um booleano que indica se o usuário interagiu com a página para ativar o áudio. */
  audioActivated: boolean;
  /** Um booleano que indica se a ativação de áudio está em andamento. */
  isActivatingAudio: boolean;
  /** Um booleano que indica se os warnings devem ser exibidos (após 10s sem chamadas). */
  showWarnings: boolean;
  /** Uma função para marcar o áudio como ativado após a interação do usuário. */
  activateAudio: () => void;
  /** Uma função para parar os warnings imediatamente. */
  stopWarnings: () => void;
}

/**
 * Contexto React para fornecer dados relacionados à tela de exibição.
 */
export const DisplayDataContext = createContext<DisplayDataContextProps | undefined>(undefined);

/**
 * Um hook customizado para acessar os dados da tela de exibição.
 *
 * Este hook consome o `DisplayDataContext` e fornece acesso ao paciente chamado,
 * próximos pacientes, histórico de chamadas e estado de áudio.
 * Ele deve ser usado dentro de uma árvore de componentes encapsulada por um `DisplayDataProvider`.
 *
 * @returns {DisplayDataContextProps} O objeto de contexto contendo os dados de exibição.
 * @throws {Error} Se o hook for usado fora de um `DisplayDataProvider`.
 */
export function useDisplayData() {
  const context = useContext(DisplayDataContext);
  if (context === undefined) {
    throw new Error('useDisplayData must be used within a DisplayDataProvider');
  }
  return context;
}
