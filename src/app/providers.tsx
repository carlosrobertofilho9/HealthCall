import React from 'react';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { DisplayDataProvider } from '@/contexts/DisplayDataContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { isLocalMode } from '@/lib/runtime';

/**
 * Local-first mode intentionally avoids mounting contexts that talk to
 * Supabase. The legacy providers remain available when VITE_DATA_MODE=supabase.
 */
export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isLocalMode) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }

  return (
    <ThemeProvider>
      <SettingsProvider>
        <DisplayDataProvider>
          <UserProfileProvider>{children}</UserProfileProvider>
        </DisplayDataProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default Providers;
