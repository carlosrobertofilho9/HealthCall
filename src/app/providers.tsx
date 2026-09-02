import React from 'react';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <SettingsProvider>
      <UserProfileProvider>{children}</UserProfileProvider>
    </SettingsProvider>
  </ThemeProvider>
);

export default Providers;
