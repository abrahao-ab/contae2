import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AccountForm } from '@/components/accounts/AccountForm';
import { AccountCard } from '@/components/accounts/AccountCard';
import { DeleteAccountDialog } from '@/components/accounts/DeleteAccountDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Building2, Loader2 } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  bank_name: string | null;
  icon: string | null;
  color: string | null;
}

export default function Accounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form/Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  const fetchAccounts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, name, bank_name, icon, color')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar contas',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const handleCreateAccount = async (data: { name: string; bank_name?: string; icon: string; color: string }) => {
    if (!user) return;

    const { error } = await supabase
      .from('bank_accounts')
      .insert({
        user_id: user.id,
        name: data.name,
        bank_name: data.bank_name || null,
        icon: data.icon,
        color: data.color,
      });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: error.message,
      });
      throw error;
    }

    toast({
      title: 'Conta criada',
      description: `A conta "${data.name}" foi criada com sucesso.`,
    });
    
    fetchAccounts();
  };

  const handleUpdateAccount = async (data: { name: string; bank_name?: string; icon: string; color: string }) => {
    if (!user || !editingAccount) return;

    const { error } = await supabase
      .from('bank_accounts')
      .update({
        name: data.name,
        bank_name: data.bank_name || null,
        icon: data.icon,
        color: data.color,
      })
      .eq('id', editingAccount.id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar conta',
        description: error.message,
      });
      throw error;
    }

    toast({
      title: 'Conta atualizada',
      description: `A conta "${data.name}" foi atualizada com sucesso.`,
    });
    
    setEditingAccount(null);
    fetchAccounts();
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletingAccount) return;

    // Update transactions to remove bank_account_id reference
    await supabase
      .from('transactions')
      .update({ bank_account_id: null })
      .eq('bank_account_id', deletingAccount.id)
      .eq('user_id', user.id);

    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', deletingAccount.id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir conta',
        description: error.message,
      });
      throw error;
    }

    toast({
      title: 'Conta excluída',
      description: `A conta "${deletingAccount.name}" foi excluída.`,
    });
    
    setDeletingAccount(null);
    fetchAccounts();
  };

  const openEditForm = (account: Account) => {
    setEditingAccount(account);
    setFormOpen(true);
  };

  const openDeleteDialog = (account: Account) => {
    setDeletingAccount(account);
    setDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingAccount(null);
  };

  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (account.bank_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Contas Bancárias</h1>
            <p className="text-muted-foreground">Gerencie suas contas para organizar transações</p>
          </div>
          <Button 
            onClick={() => setFormOpen(true)} 
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Conta
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-input"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-card rounded-xl border border-border">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">Nenhuma conta cadastrada</p>
            <p className="text-muted-foreground mb-4">Adicione suas contas bancárias para começar</p>
            <Button 
              onClick={() => setFormOpen(true)} 
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar primeira conta
            </Button>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-card rounded-xl border border-border">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">Nenhuma conta encontrada</p>
            <p className="text-muted-foreground">Tente buscar por outro termo</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={openEditForm}
                onDelete={openDeleteDialog}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <AccountForm
        open={formOpen}
        onClose={closeForm}
        onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount}
        account={editingAccount}
      />

      {/* Delete Dialog */}
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingAccount(null);
        }}
        onConfirm={handleDeleteAccount}
        account={deletingAccount}
      />
    </DashboardLayout>
  );
}
