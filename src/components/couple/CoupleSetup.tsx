import { useState } from 'react';
import { useCouple } from '@/hooks/useCouple';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Heart, UserPlus, Loader2, Check, X, Send, Clock, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CoupleSetupProps {
  open: boolean;
  onClose: () => void;
}

export function CoupleSetup({ open, onClose }: CoupleSetupProps) {
  const { 
    hasCouple, 
    canInvitePartner, 
    createCouple, 
    invitePartner,
    cancelInvite,
    pendingInvites,
    receivedInvites,
    acceptInvite,
    rejectInvite,
    partner,
  } = useCouple();
  
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [phone, setPhone] = useState('');

  const handleCreateCouple = async () => {
    setLoading(true);
    const result = await createCouple();
    setLoading(false);

    if (result.success) {
      toast({
        title: 'Conta Casal criada!',
        description: 'Agora você pode convidar seu parceiro(a).',
      });
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleInvite = async () => {
    if (!phone.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite o número de WhatsApp do parceiro(a).',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const result = await invitePartner(phone.trim());
    setLoading(false);

    if (result.success) {
      toast({
        title: 'Convite enviado!',
        description: 'Seu parceiro(a) receberá o convite no app.',
      });
      setPhone('');
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingId(inviteId);
    const result = await cancelInvite(inviteId);
    setCancellingId(null);

    if (result.success) {
      toast({
        title: 'Convite cancelado',
        description: 'O convite foi cancelado com sucesso.',
      });
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleAccept = async (inviteId: string) => {
    setLoading(true);
    const result = await acceptInvite(inviteId);
    setLoading(false);

    if (result.success) {
      toast({
        title: 'Convite aceito!',
        description: 'Você agora faz parte da Conta Casal.',
      });
      onClose();
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (inviteId: string) => {
    const result = await rejectInvite(inviteId);
    if (result.success) {
      toast({
        title: 'Convite recusado',
      });
    }
  };

  const formatPhone = (phone: string) => {
    // Format as +55 11 99999-9999
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 12) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    return phone;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Conta Casal
          </DialogTitle>
          <DialogDescription>
            Compartilhe suas finanças e rotina com seu parceiro(a)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Received Invites */}
          {receivedInvites.length > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Convites Recebidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {receivedInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-2 bg-background rounded-lg">
                    <span className="text-sm">Convite de parceiro(a)</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(invite.id)}
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(invite.id)}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Not yet in a couple */}
          {!hasCouple && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Iniciar Conta Casal</CardTitle>
                <CardDescription>
                  Crie sua conta casal para começar a compartilhar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreateCouple} disabled={loading} className="w-full">
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Heart className="w-4 h-4 mr-2" />
                  )}
                  Criar Conta Casal
                </Button>
              </CardContent>
            </Card>
          )}

          {/* In a couple but needs to invite partner */}
          {canInvitePartner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Convidar Parceiro(a)</CardTitle>
                <CardDescription>
                  Digite o número de WhatsApp cadastrado no Contaê
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Ex: 5511999999999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Button onClick={handleInvite} disabled={loading} className="w-full">
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Enviar Convite
                </Button>

                {/* Pending Invites List */}
                {pendingInvites.length > 0 && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Convites Pendentes
                    </p>
                    {pendingInvites.map((invite) => (
                      <div 
                        key={invite.id} 
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {formatPhone(invite.invitee_phone)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Enviado em {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleCancelInvite(invite.id)}
                          disabled={cancellingId === invite.id}
                        >
                          {cancellingId === invite.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Couple is complete */}
          {hasCouple && partner && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" fill="currentColor" />
                  Casal Completo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: partner.avatar_color || '#22c55e' }}
                  >
                    {partner.nickname?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{partner.nickname || 'Parceiro(a)'}</p>
                    <p className="text-sm text-muted-foreground">Conectado(a)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
