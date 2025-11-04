import React from 'react';
import { DisplayDataContext } from '../hooks/useDisplayData';
import { useDisplay } from '@/features/display/hooks/useDisplay';

export function DisplayDataProvider({ children }: { children: React.ReactNode }) {
  const displayData = useDisplay();

  return <DisplayDataContext.Provider value={displayData}>{children}</DisplayDataContext.Provider>;
}
