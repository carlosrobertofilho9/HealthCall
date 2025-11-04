import React, { createContext, useContext } from 'react';
import type { CallRecord, Patient } from '@/types';
import { useDisplay } from '@/features/display/hooks/useDisplay';

interface DisplayDataContextProps {
  calledPatient: Patient | null;
  nextPatients: Patient[];
  callHistory: CallRecord[];
  isCalling: boolean;
  audioActivated: boolean;
  activateAudio: () => void;
}

const DisplayDataContext = createContext<DisplayDataContextProps | undefined>(undefined);

export function DisplayDataProvider({ children }: { children: React.ReactNode }) {
  const displayData = useDisplay();

  return <DisplayDataContext.Provider value={displayData}>{children}</DisplayDataContext.Provider>;
}

// Hook exportado separadamente para compatibilidade com Fast Refresh
function useDisplayDataHook() {
  const context = useContext(DisplayDataContext);
  if (context === undefined) {
    throw new Error('useDisplayData must be used within a DisplayDataProvider');
  }
  return context;
}

export { useDisplayDataHook as useDisplayData };
