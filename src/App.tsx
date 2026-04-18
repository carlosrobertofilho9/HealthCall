import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Toaster } from '@/components/ui';
import { cn } from '@/lib/utils';

const App: React.FC = () => {
  usePageTitle();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Toaster position="top-center" />
      
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300">
        <main 
          className={cn(
            "flex-1 overflow-y-auto px-2 py-6 lg:px-4 transition-all duration-300 ease-in-out pt-20 lg:pt-6",
            isSidebarCollapsed ? "lg:ml-20" : "lg:ml-70"
          )}
        >
          <div className="mx-auto w-full max-w-400 animate-in fade-in duration-700">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
