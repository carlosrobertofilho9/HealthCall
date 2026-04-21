import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAppViewport } from '@/hooks/useAppViewport';
import { Toaster } from '@/components/ui';
import { cn } from '@/lib/utils';

const App: React.FC = () => {
  usePageTitle();
  useAppViewport();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  return (
    <div className="flex min-h-[var(--app-visual-viewport-height,100dvh)] w-full min-w-0 overflow-x-hidden bg-background text-foreground lg:h-[var(--app-visual-viewport-height,100dvh)] lg:overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      
      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col transition-all duration-300 lg:overflow-hidden">
        <main 
          className={cn(
            "min-w-0 flex-1 overflow-x-hidden pt-16 transition-all duration-300 ease-in-out lg:overflow-y-auto lg:pt-0",
            isSidebarCollapsed ? "lg:ml-20" : "lg:ml-70"
          )}
        >
          <div className="mx-auto min-h-0 w-full min-w-0 max-w-full overflow-x-hidden animate-in fade-in duration-700 lg:h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
