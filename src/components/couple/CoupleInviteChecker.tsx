import { useEffect, useState } from 'react';
import { useCouple } from '@/hooks/useCouple';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, Users } from 'lucide-react';

export function CoupleInviteChecker() {
  const { user } = useAuth();
  const { isCouple } = usePlanLimits();
  const { receivedInvites, acceptInvite, rejectInvite, refresh, loading } = useCouple();
  const [showDialog, setShowDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Check for invites after login
  useEffect(() => {
    if (!loading && user && receivedInvites.length > 0) {
      setShowDialog(true);
    }
  }, [loading, user, receivedInvites]);

  const handleAccept = async (inviteId: string) => {
    setProcessing(true);
    const result = await acceptInvite(inviteId);
    setProcessing(false);
    
    if (result.success) {
      setShowDialog(false);
      await refresh();
    }
  };

  const handleReject = async (inviteId: string) => {
    setProcessing(true);
    await rejectInvite(inviteId);
    setProcessing(false);
    setShowDialog(false);
  };

  if (!showDialog || receivedInvites.length === 0) {
    return null;
  }

  const invite = receivedInvites[0];

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <DialogTitle className="text-center">Convite de Casal</DialogTitle>
          <DialogDescription className="text-center">
            Você foi convidado(a) para fazer parte de uma Conta Casal! 
            Ao aceitar, você poderá compartilhar finanças com seu parceiro(a).
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div className="text-sm text-muted-foreground">
            Recebido em {new Date(invite.created_at).toLocaleDateString('pt-BR')}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleReject(invite.id)}
            disabled={processing}
            className="flex-1"
          >
            Recusar
          </Button>
          <Button
            onClick={() => handleAccept(invite.id)}
            disabled={processing}
            className="flex-1 bg-pink-500 hover:bg-pink-600"
          >
            {processing ? 'Processando...' : 'Aceitar Convite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
