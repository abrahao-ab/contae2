import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';

interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  feature: string;
  featureDescription?: string;
  currentLimit?: number;
  requiredPlan?: 'paid' | 'couple';
}

export function UpgradeDialog({
  open,
  onClose,
  feature,
  featureDescription,
  currentLimit,
  requiredPlan = 'paid',
}: UpgradeDialogProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/plans');
  };

  const planInfo = {
    paid: {
      name: 'Premium',
      price: 'R$ 29,90/mês',
      icon: Crown,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    couple: {
      name: 'Conta Casal',
      price: 'R$ 49,90/mês',
      icon: Sparkles,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
  };

  const plan = planInfo[requiredPlan];
  const Icon = plan.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full ${plan.bgColor} flex items-center justify-center mb-4`}>
            <Icon className={`w-8 h-8 ${plan.color}`} />
          </div>
          <DialogTitle className="text-xl">Recurso do plano {plan.name}</DialogTitle>
          <DialogDescription className="text-base">
            {featureDescription || `Para usar ${feature}, você precisa do plano ${plan.name}.`}
          </DialogDescription>
        </DialogHeader>

        {currentLimit !== undefined && (
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Seu plano atual permite até <span className="font-semibold text-foreground">{currentLimit}</span> {feature}.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Com o {plan.name}, você terá acesso <span className="font-semibold text-foreground">ilimitado</span>!
            </p>
          </div>
        )}

        <div className="space-y-3 pt-4">
          <Button onClick={handleUpgrade} className="w-full gap-2">
            Ver plano {plan.name}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Continuar no plano atual
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          A partir de {plan.price} • Cancele quando quiser
        </p>
      </DialogContent>
    </Dialog>
  );
}
