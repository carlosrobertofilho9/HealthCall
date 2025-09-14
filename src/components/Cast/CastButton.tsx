import React from 'react';
import { useCast } from './CastProvider';

const CastButton: React.FC = () => {
  const { isApiAvailable } = useCast();

  if (!isApiAvailable) {
    return null; // ou placeholder
  }

  return (
    <google-cast-launcher
      style={{ width: '24px', height: '24px', cursor: 'pointer' }}
    />
  );
};

export default CastButton;