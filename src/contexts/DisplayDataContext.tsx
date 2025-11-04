import React from 'react';
import { DisplayDataContext } from '../hooks/useDisplayData';
import { useDisplay } from '@/features/display/hooks/useDisplay';

/**
 * Um provedor de contexto que gerencia e fornece os dados para a página de exibição.
 *
 * Este componente utiliza o hook `useDisplay` para obter os dados do paciente chamado,
 * o histórico de chamadas e a lógica relacionada. Em seguida, ele disponibiliza esses
 * dados para qualquer componente filho aninhado através do `DisplayDataContext`.
 *
 * @param {object} props As propriedades do componente.
 * @param {React.ReactNode} props.children Os componentes filhos que terão acesso ao contexto.
 * @returns {React.ReactElement} O componente provedor.
 */
export function DisplayDataProvider({ children }: { children: React.ReactNode }) {
  const displayData = useDisplay();

  return <DisplayDataContext.Provider value={displayData}>{children}</DisplayDataContext.Provider>;
}
