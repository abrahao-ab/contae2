import { useCouple } from '@/hooks/useCouple';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { Button } from '@/components/ui/button';
import { User, Users, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewModeToggleProps {
  className?: string;
}

export function ViewModeToggle({ className }: ViewModeToggleProps) {
  const { isCouple } = usePlanLimits();
  const { viewMode, setViewMode, hasCouple, partner, currentMember } = useCouple();

  // Only show for couple plan users who have a couple
  if (!isCouple() || !hasCouple) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2 p-1 bg-muted rounded-lg', className)}>
      <Button
        variant={viewMode === 'individual' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('individual')}
        className="gap-2"
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">
          {currentMember?.nickname || 'Meu'}
        </span>
      </Button>
      <Button
        variant={viewMode === 'couple' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('couple')}
        className="gap-2"
      >
        <Heart className="w-4 h-4" />
        <span className="hidden sm:inline">Casal</span>
      </Button>
      {partner && (
        <div 
          className="hidden lg:flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground"
          style={{ borderLeft: '1px solid hsl(var(--border))' }}
        >
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
            style={{ backgroundColor: partner.avatar_color || '#22c55e' }}
          >
            {partner.nickname?.charAt(0)?.toUpperCase() || <Users className="w-3 h-3" />}
          </div>
          <span>{partner.nickname || 'Parceiro(a)'}</span>
        </div>
      )}
    </div>
  );
}
