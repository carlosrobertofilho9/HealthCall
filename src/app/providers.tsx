import React from 'react';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { CastProvider } from '@/components/Cast';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UserProfileProvider>
      <CastProvider>
        {children}
      </CastProvider>
    </UserProfileProvider>
  );
};

export default Providers;
