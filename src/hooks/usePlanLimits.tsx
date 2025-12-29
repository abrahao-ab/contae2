import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';

type AccountType = Database['public']['Enums']['account_type'];

interface PlanLimit {
  feature_key: string;
  limit_value: number | null;
  is_unlimited: boolean;
}

interface PlanLimitsContextType {
  accountType: AccountType;
  limits: PlanLimit[];
  loading: boolean;
  // Check functions
  canCreate: (featureKey: string, currentCount: number) => boolean;
  canAccess: (featureKey: string) => boolean;
  getLimit: (featureKey: string) => number | null;
  isUnlimited: (featureKey: string) => boolean;
  getRemainingCount: (featureKey: string, currentCount: number) => number;
  // Plan info
  isPremium: () => boolean;
  isCouple: () => boolean;
  isFree: () => boolean;
  // Refresh
  refresh: () => Promise<void>;
}

const PlanLimitsContext = createContext<PlanLimitsContextType | undefined>(undefined);

export function PlanLimitsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>('free');
  const [limits, setLimits] = useState<PlanLimit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlanData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user's account type
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const userAccountType = profileData?.account_type || 'free';
      setAccountType(userAccountType);

      // Fetch plan limits for user's plan
      const { data: limitsData, error: limitsError } = await supabase
        .from('plan_limits')
        .select('feature_key, limit_value, is_unlimited')
        .eq('plan_id', userAccountType);

      if (limitsError) throw limitsError;
      setLimits(limitsData || []);
    } catch (error) {
      console.error('Error fetching plan data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlanData();
  }, [fetchPlanData]);

  const getLimit = useCallback((featureKey: string): number | null => {
    const limit = limits.find((l) => l.feature_key === featureKey);
    if (!limit) return null;
    return limit.is_unlimited ? null : limit.limit_value;
  }, [limits]);

  const isUnlimited = useCallback((featureKey: string): boolean => {
    const limit = limits.find((l) => l.feature_key === featureKey);
    return limit?.is_unlimited || false;
  }, [limits]);

  const canCreate = useCallback((featureKey: string, currentCount: number): boolean => {
    const limit = limits.find((l) => l.feature_key === featureKey);
    if (!limit) return true; // No limit defined = allowed
    if (limit.is_unlimited) return true;
    if (limit.limit_value === null) return true;
    return currentCount < limit.limit_value;
  }, [limits]);

  const canAccess = useCallback((featureKey: string): boolean => {
    const limit = limits.find((l) => l.feature_key === featureKey);
    if (!limit) return true; // No limit defined = allowed
    if (limit.is_unlimited) return true;
    // For boolean features (like can_export), limit_value of 0 = false, 1 = true
    return limit.limit_value !== 0;
  }, [limits]);

  const getRemainingCount = useCallback((featureKey: string, currentCount: number): number => {
    const limit = limits.find((l) => l.feature_key === featureKey);
    if (!limit || limit.is_unlimited || limit.limit_value === null) return Infinity;
    return Math.max(0, limit.limit_value - currentCount);
  }, [limits]);

  const isPremium = useCallback(() => accountType === 'paid', [accountType]);
  const isCouple = useCallback(() => accountType === 'couple', [accountType]);
  const isFree = useCallback(() => accountType === 'free', [accountType]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchPlanData();
  }, [fetchPlanData]);

  return (
    <PlanLimitsContext.Provider
      value={{
        accountType,
        limits,
        loading,
        canCreate,
        canAccess,
        getLimit,
        isUnlimited,
        getRemainingCount,
        isPremium,
        isCouple,
        isFree,
        refresh,
      }}
    >
      {children}
    </PlanLimitsContext.Provider>
  );
}

export function usePlanLimits() {
  const context = useContext(PlanLimitsContext);
  if (context === undefined) {
    throw new Error('usePlanLimits must be used within a PlanLimitsProvider');
  }
  return context;
}

// Plan display names
export const planNames: Record<AccountType, string> = {
  free: 'Gratuito',
  paid: 'Premium',
  couple: 'Conta Casal',
};

// Feature display names for user-friendly messages
export const featureNames: Record<string, string> = {
  whatsapp_numbers: 'números de WhatsApp',
  bank_accounts: 'contas bancárias',
  credit_cards: 'cartões de crédito',
  categories: 'categorias personalizadas',
  commitments: 'compromissos',
  reminders: 'lembretes',
  connected_users: 'usuários conectados',
  can_export: 'exportação de relatórios',
  can_create_reports: 'relatórios detalhados',
  can_create_alerts: 'alertas de gastos',
  can_create_goals: 'metas financeiras',
  can_customize_categories: 'personalização de categorias',
  has_shared_view: 'visão compartilhada',
  has_shared_goals: 'metas conjuntas',
};
