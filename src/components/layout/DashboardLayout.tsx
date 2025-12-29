import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main content */}
      <main className="lg:pl-64 min-h-screen flex flex-col">
        {/* Top header with theme toggle - mobile friendly */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 lg:px-6">
          <ThemeToggle />
        </header>
        
        {/* Page content with proper padding for mobile */}
        <div className="flex-1 p-4 pb-20 lg:p-6 lg:pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}
