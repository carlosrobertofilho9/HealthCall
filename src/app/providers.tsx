import React from 'react';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { CastProvider } from '@/components/Cast';

const APPLICATION_ID = 'A75B4462';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UserProfileProvider>
      <CastProvider applicationId={APPLICATION_ID}>
        {children}
      </CastProvider>
    </UserProfileProvider>
  );
};

export default Providers;
