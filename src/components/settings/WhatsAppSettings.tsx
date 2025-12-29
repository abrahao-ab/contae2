import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { MessageCircle, Plus, Trash2, Crown } from 'lucide-react';

type AccountType = 'free' | 'paid' | 'couple';

interface WhatsAppNumber {
  id: string;
  phone: string;
  is_primary: boolean;
  created_at: string;
}

const accountTypeLabels: Record<AccountType, string> = {
  free: 'Gratuita',
  paid: 'Paga',
  couple: 'Casal'
};

const accountTypeLimits: Record<AccountType, number> = {
  free: 1,
  paid: 1,
  couple: 2
};

export function WhatsAppSettings() {
  const { user } = useAuth();
  const [whatsappNumbers, setWhatsappNumbers] = useState<WhatsAppNumber[]>([]);
  const [accountType, setAccountType] = useState<AccountType>('free');
  const [newPhone, setNewPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : '';
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPhone(formatPhoneInput(e.target.value));
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [numbersRes, profileRes] = await Promise.all([
        supabase
          .from('whatsapp_numbers')
          .select('*')
          .order('is_primary', { ascending: false }),
        supabase
          .from('profiles')
          .select('account_type')
          .eq('user_id', user?.id)
          .single()
      ]);

      if (numbersRes.data) {
        setWhatsappNumbers(numbersRes.data);
      }
      if (profileRes.data) {
        setAccountType(profileRes.data.account_type as AccountType);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPhone = async () => {
    if (!newPhone.trim()) {
      toast.error('Digite um número de telefone');
      return;
    }

    const cleanPhone = newPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      toast.error('Número de telefone inválido');
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('whatsapp_numbers')
        .insert({
          user_id: user?.id,
          phone: cleanPhone,
          is_primary: whatsappNumbers.length === 0
        });

      if (error) {
        if (error.message.includes('Limite de WhatsApps')) {
          toast.error(error.message);
        } else if (error.message.includes('idx_whatsapp_phone')) {
          toast.error('Este número já está cadastrado');
        } else {
          toast.error('Erro ao adicionar número');
        }
        return;
      }

      toast.success('Número adicionado com sucesso');
      setNewPhone('');
      fetchData();
    } catch (error) {
      toast.error('Erro ao adicionar número');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePhone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_numbers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Número removido');
      fetchData();
    } catch (error) {
      toast.error('Erro ao remover número');
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      // Remove primary from all
      await supabase
        .from('whatsapp_numbers')
        .update({ is_primary: false })
        .eq('user_id', user?.id);

      // Set new primary
      const { error } = await supabase
        .from('whatsapp_numbers')
        .update({ is_primary: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Número principal atualizado');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  const maxNumbers = accountTypeLimits[accountType];
  const canAddMore = whatsappNumbers.length < maxNumbers;

  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    }
    if (phone.length === 13) {
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
    }
    return phone;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </div>
          <Badge variant="secondary">
            {accountTypeLabels[accountType]} ({whatsappNumbers.length}/{maxNumbers})
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Gerencie os números de WhatsApp vinculados à sua conta para registrar transações por mensagem.
        </p>

        {/* Current numbers */}
        <div className="space-y-2">
          {whatsappNumbers.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-foreground">
                  {formatPhone(item.phone)}
                </span>
                {item.is_primary && (
                  <Badge variant="default" className="text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Principal
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!item.is_primary && whatsappNumbers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetPrimary(item.id)}
                  >
                    Tornar principal
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeletePhone(item.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {whatsappNumbers.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum número cadastrado
            </p>
          )}
        </div>

        {/* Add new number */}
        {canAddMore && (
          <div className="flex gap-2">
            <Input
              placeholder="(00) 00000-0000"
              value={newPhone}
              onChange={handlePhoneChange}
              maxLength={15}
              className="flex-1"
            />
            <Button onClick={handleAddPhone} disabled={isAdding}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
        )}

        {!canAddMore && (
          <p className="text-sm text-muted-foreground text-center">
            {accountType === 'couple' 
              ? 'Limite de 2 números atingido para conta Casal'
              : 'Upgrade para conta Casal para adicionar mais um número'
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
}
