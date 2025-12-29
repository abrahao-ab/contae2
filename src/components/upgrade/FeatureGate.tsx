import { ReactNode, useState } from 'react';
import { usePlanLimits, featureNames } from '@/hooks/usePlanLimits';
import { UpgradeDialog } from './UpgradeDialog';
import { UpgradeBanner } from './UpgradeBanner';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  feature: string;
  currentCount?: number;
  children: ReactNode;
  fallback?: 'dialog' | 'banner' | 'inline' | 'none';
  requiredPlan?: 'paid' | 'couple';
  onBlocked?: () => void;
}

export function FeatureGate({
  feature,
  currentCount = 0,
  children,
  fallback = 'dialog',
  requiredPlan = 'paid',
  onBlocked,
}: FeatureGateProps) {
  const { canCreate, canAccess, getLimit, loading } = usePlanLimits();
  const [showDialog, setShowDialog] = useState(false);

  if (loading) return null;

  // Check if it's a boolean feature (can_*)
  const isBooleanFeature = feature.startsWith('can_') || feature.startsWith('has_');
  const hasAccess = isBooleanFeature ? canAccess(feature) : canCreate(feature, currentCount);

  if (hasAccess) {
    return <>{children}</>;
  }

  const featureName = featureNames[feature] || feature;
  const limit = getLimit(feature);

  const handleClick = () => {
    if (fallback === 'dialog') {
      setShowDialog(true);
    }
    onBlocked?.();
  };

  if (fallback === 'none') {
    return null;
  }

  if (fallback === 'banner') {
    return (
      <UpgradeBanner
        feature={featureName}
        description={limit !== null ? `Limite de ${limit} ${featureName} atingido no plano gratuito.` : undefined}
      />
    );
  }

  if (fallback === 'inline') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-muted-foreground">
        <Lock className="w-4 h-4" />
        <span className="text-sm">Recurso Premium</span>
      </div>
    );
  }

  // Default: dialog trigger
  return (
    <>
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>
      <UpgradeDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        feature={featureName}
        currentLimit={limit ?? undefined}
        requiredPlan={requiredPlan}
      />
    </>
  );
}

// Hook to check feature access imperatively
export function useFeatureCheck() {
  const { canCreate, canAccess, getLimit, isFree, isPremium, isCouple } = usePlanLimits();
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    feature: string;
    limit?: number;
    requiredPlan: 'paid' | 'couple';
  }>({
    open: false,
    feature: '',
    requiredPlan: 'paid',
  });

  const checkAndShowUpgrade = (feature: string, currentCount = 0, requiredPlan: 'paid' | 'couple' = 'paid'): boolean => {
    const isBooleanFeature = feature.startsWith('can_') || feature.startsWith('has_');
    const hasAccess = isBooleanFeature ? canAccess(feature) : canCreate(feature, currentCount);

    if (!hasAccess) {
      const limit = getLimit(feature);
      setDialogState({
        open: true,
        feature: featureNames[feature] || feature,
        limit: limit ?? undefined,
        requiredPlan,
      });
      return false;
    }

    return true;
  };

  const UpgradeDialogComponent = () => (
    <UpgradeDialog
      open={dialogState.open}
      onClose={() => setDialogState((prev) => ({ ...prev, open: false }))}
      feature={dialogState.feature}
      currentLimit={dialogState.limit}
      requiredPlan={dialogState.requiredPlan}
    />
  );

  return {
    checkAndShowUpgrade,
    UpgradeDialogComponent,
    isFree,
    isPremium,
    isCouple,
  };
}
