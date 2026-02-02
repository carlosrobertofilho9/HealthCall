import React from 'react';
import { NetworkSyncProvider } from '@/contexts/NetworkSyncContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

/**
 * A component that wraps the entire application with all necessary context providers.
 * This ensures that all child components have access to the contexts they need,
 * such as network sync and settings.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered within the providers.
 * @returns {JSX.Element} The providers wrapping the children components.
 */
export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NetworkSyncProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </NetworkSyncProvider>
  );
};

export default Providers;
