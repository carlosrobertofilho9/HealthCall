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

export const DisplayDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const displayData = useDisplay();

  return <DisplayDataContext.Provider value={displayData}>{children}</DisplayDataContext.Provider>;
};

export const useDisplayData = () => {
  const context = useContext(DisplayDataContext);
  if (context === undefined) {
    throw new Error('useDisplayData must be used within a DisplayDataProvider');
  }
  return context;
};
