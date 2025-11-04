import { createContext, useContext } from 'react';
import type { CallRecord, Patient } from '@/types';

export interface DisplayDataContextProps {
  calledPatient: Patient | null;
  nextPatients: Patient[];
  callHistory: CallRecord[];
  isCalling: boolean;
  audioActivated: boolean;
  activateAudio: () => void;
}

export const DisplayDataContext = createContext<DisplayDataContextProps | undefined>(undefined);

export function useDisplayData() {
  const context = useContext(DisplayDataContext);
  if (context === undefined) {
    throw new Error('useDisplayData must be used within a DisplayDataProvider');
  }
  return context;
}
