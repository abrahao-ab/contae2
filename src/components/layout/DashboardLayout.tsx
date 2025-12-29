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
      <main className="lg:pl-64 min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 lg:px-8">
          <ThemeToggle />
        </header>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
