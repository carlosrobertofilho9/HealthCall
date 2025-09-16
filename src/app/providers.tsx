import React from 'react';
import { UserProfileProvider } from '@/contexts/UserProfileContext';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UserProfileProvider>
      {children}
    </UserProfileProvider>
  );
};

export default Providers;
