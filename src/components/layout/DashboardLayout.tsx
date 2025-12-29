import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';
import { ThemeToggle } from './ThemeToggle';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <main className="lg:pl-64 min-h-screen flex flex-col">
        {/* Top header - visible on all screens */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 lg:px-6">
          {/* Spacer for mobile menu button */}
          <div className="w-10 lg:hidden" />
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        
        {/* Page content */}
        <div className="flex-1 p-4 pb-24 lg:p-6 lg:pb-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
