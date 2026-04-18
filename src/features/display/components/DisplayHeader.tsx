import React from 'react';
import { DISPLAY_CLASS } from '../utils/displayTheme';

/**
 * Header do display com logo e nome da unidade.
 * Reutilizado tanto no layout normal quanto no overlay de chamada.
 */
export const DisplayHeader: React.FC = () => (
  <header className={DISPLAY_CLASS.header}>
    <div className="flex items-center gap-3">
      <img src="/healthcall-logo-header.png" alt="HealthCall Logo" className="h-8 w-auto" />
      <h1 className="text-xl font-bold">PSF Maria Lucia da Silva</h1>
    </div>
  </header>
);
