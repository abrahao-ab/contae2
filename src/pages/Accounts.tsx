import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function Accounts() {
  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Contas Bancárias</h1>
          <p className="text-muted-foreground">Organize suas contas para categorização</p>
        </div>
        <div className="flex items-center justify-center h-64 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">Em breve: gestão de contas bancárias</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
