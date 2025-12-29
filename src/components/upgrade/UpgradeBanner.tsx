import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';

interface UpgradeBannerProps {
  feature: string;
  description?: string;
  compact?: boolean;
  dismissible?: boolean;
}

export function UpgradeBanner({ feature, description, compact = false, dismissible = false }: UpgradeBannerProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
        <Crown className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm text-foreground flex-1">
          {description || `Faça upgrade para usar ${feature}`}
        </p>
        <Button size="sm" variant="ghost" onClick={() => navigate('/plans')} className="shrink-0">
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
      {dismissible && (
        <button 
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">
            Desbloqueie {feature}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description || `Faça upgrade para o plano Premium e aproveite ${feature} e muito mais.`}
          </p>
        </div>
        
        <Button onClick={() => navigate('/plans')} className="gap-2 shrink-0">
          Ver planos
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
