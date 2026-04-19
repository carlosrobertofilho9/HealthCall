import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useMobileDocumentScroll } from '@/hooks/useMobileDocumentScroll';
import { Toaster } from '@/components/ui';
import { cn } from '@/lib/utils';

const App: React.FC = () => {
  usePageTitle();
  useMobileDocumentScroll();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  return (
    <div className="flex min-h-screen bg-background text-foreground lg:h-screen lg:overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col transition-all duration-300 lg:overflow-hidden">
        <main 
          className={cn(
            "flex-1 px-2 py-6 pt-20 transition-all duration-300 ease-in-out lg:overflow-y-auto lg:px-4 lg:pt-6",
            isSidebarCollapsed ? "lg:ml-20" : "lg:ml-70"
          )}
        >
          <div className="mx-auto min-h-0 w-full max-w-400 animate-in fade-in duration-700 lg:h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
