import React from 'react';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { DisplayDataProvider } from '@/contexts/DisplayDataContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

/**
 * A component that wraps the entire application with all necessary context providers.
 * This ensures that all child components have access to the contexts they need,
 * such as user profile and display data.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered within the providers.
 * @returns {JSX.Element} The providers wrapping the children components.
 */
export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <DisplayDataProvider>
          <UserProfileProvider>
            {children}
          </UserProfileProvider>
        </DisplayDataProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default Providers;
