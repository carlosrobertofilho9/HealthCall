import React from 'react';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { DisplayDataProvider } from '@/contexts/DisplayDataContext';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <DisplayDataProvider>
      <UserProfileProvider>
        {children}
      </UserProfileProvider>
    </DisplayDataProvider>
  );
};

export default Providers;
