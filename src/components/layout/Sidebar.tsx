import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  ArrowUpDown,
  CreditCard,
  Wallet,
  Tags,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Crown,
  Users,
  Zap,
  Heart,
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type AccountType = Database['public']['Enums']['account_type'];

import { useCouple } from '@/hooks/useCouple';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ArrowUpDown, label: 'Transações', path: '/transactions' },
  { icon: CreditCard, label: 'Cartões', path: '/cards' },
  { icon: Wallet, label: 'Contas', path: '/accounts' },
  { icon: Tags, label: 'Categorias', path: '/categories' },
];

const planConfig: Record<AccountType, { label: string; icon: React.ReactNode; color: string }> = {
  free: { label: 'Free', icon: <Zap className="w-3 h-3" />, color: 'bg-muted text-muted-foreground' },
  paid: { label: 'Premium', icon: <Crown className="w-3 h-3" />, color: 'bg-primary/20 text-primary' },
  couple: { label: 'Casal', icon: <Users className="w-3 h-3" />, color: 'bg-pink-500/20 text-pink-500' },
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('free');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isCouplePlan, hasCouple } = useCouple();

  useEffect(() => {
    const fetchAccountType = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setAccountType(data.account_type);
      }
    };

    fetchAccountType();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const closeMobileMenu = () => setMobileOpen(false);

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const plan = planConfig[accountType];
    
    return (
      <div className="flex flex-col h-full bg-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-lg text-sidebar-foreground">Contaê</h1>
              <p className="text-xs text-sidebar-foreground/60">Controle inteligente</p>
            </div>
          )}
        </div>

        {/* Plan Badge */}
        {(!collapsed || isMobile) && (
          <button
            onClick={() => {
              navigate('/plans');
              closeMobileMenu();
            }}
            className="mx-3 mt-4 p-3 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={cn('gap-1', plan.color)}>
                  {plan.icon}
                  {plan.label}
                </Badge>
              </div>
              <ChevronLeft className="w-4 h-4 text-sidebar-foreground/50 rotate-180 group-hover:translate-x-1 transition-transform" />
            </div>
            {accountType === 'free' && (
              <p className="text-xs text-sidebar-foreground/50 mt-1">
                Fazer upgrade →
              </p>
            )}
          </button>
        )}
        
        {collapsed && !isMobile && (
          <button
            onClick={() => navigate('/plans')}
            className="mx-3 mt-4 p-2 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors flex items-center justify-center"
            title={`Plano ${plan.label}`}
          >
            <Badge className={cn('p-1', plan.color)}>
              {plan.icon}
            </Badge>
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                  'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                  'active:scale-95',
                  isActive && 'bg-sidebar-primary text-white hover:bg-sidebar-primary'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          {isCouplePlan && hasCouple && (
            <NavLink
              to="/settings/couple"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                  'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                  'active:scale-95',
                  isActive && 'bg-pink-500/20 text-pink-500'
                )
              }
            >
              <Heart className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && <span className="font-medium text-sm">Casal</span>}
            </NavLink>
          )}
          <NavLink
            to="/settings"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                'active:scale-95',
                isActive && 'bg-sidebar-primary text-white'
              )
            }
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {(!collapsed || isMobile) && <span className="font-medium text-sm">Configurações</span>}
          </NavLink>

          <button
            onClick={handleSignOut}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
              'text-sidebar-foreground/70 hover:text-red-400 hover:bg-red-500/10',
              'active:scale-95'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(!collapsed || isMobile) && <span className="font-medium text-sm">Sair</span>}
          </button>
        </div>

        {/* Collapse Button (Desktop only) */}
        {!isMobile && (
          <div className="hidden lg:block px-3 py-4 border-t border-sidebar-border">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <ChevronLeft className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')} />
              {!collapsed && <span className="text-sm">Recolher</span>}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Button - Fixed in top left */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden h-10 w-10 bg-card/95 backdrop-blur-sm border-border text-foreground shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar - Slide from left */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-sidebar transform transition-transform duration-300 ease-out lg:hidden',
          'shadow-2xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent isMobile />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 left-0 bg-sidebar border-r border-sidebar-border transition-all duration-300',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
