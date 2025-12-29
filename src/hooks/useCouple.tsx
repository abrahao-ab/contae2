import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePlanLimits } from './usePlanLimits';

interface CoupleMember {
  id: string;
  user_id: string;
  nickname: string | null;
  avatar_color: string | null;
  is_owner: boolean;
  joined_at: string;
}

interface Couple {
  id: string;
  created_at: string;
  members: CoupleMember[];
}

interface CoupleInvite {
  id: string;
  couple_id: string;
  inviter_id: string;
  invitee_phone: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface CoupleGoal {
  id: string;
  couple_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string | null;
  color: string | null;
  is_completed: boolean;
}

interface CoupleBudget {
  id: string;
  couple_id: string;
  category_id: string | null;
  monthly_limit: number;
  alert_threshold: number;
}

type ViewMode = 'individual' | 'couple';

interface CoupleContextType {
  couple: Couple | null;
  partner: CoupleMember | null;
  currentMember: CoupleMember | null;
  pendingInvites: CoupleInvite[];
  receivedInvites: CoupleInvite[];
  goals: CoupleGoal[];
  budgets: CoupleBudget[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  loading: boolean;
  isCouplePlan: boolean;
  hasCouple: boolean;
  canInvitePartner: boolean;
  createCouple: () => Promise<{ success: boolean; error?: string }>;
  invitePartner: (phone: string) => Promise<{ success: boolean; error?: string }>;
  cancelInvite: (inviteId: string) => Promise<{ success: boolean; error?: string }>;
  acceptInvite: (inviteId: string) => Promise<{ success: boolean; error?: string }>;
  rejectInvite: (inviteId: string) => Promise<{ success: boolean; error?: string }>;
  leaveCouple: () => Promise<{ success: boolean; error?: string }>;
  updateMemberProfile: (nickname: string, avatarColor: string) => Promise<{ success: boolean; error?: string }>;
  createGoal: (data: Omit<CoupleGoal, 'id' | 'couple_id' | 'is_completed'>) => Promise<{ success: boolean; error?: string }>;
  updateGoal: (id: string, data: Partial<CoupleGoal>) => Promise<{ success: boolean; error?: string }>;
  deleteGoal: (id: string) => Promise<{ success: boolean; error?: string }>;
  createBudget: (categoryId: string | null, monthlyLimit: number, alertThreshold: number) => Promise<{ success: boolean; error?: string }>;
  updateBudget: (id: string, data: Partial<CoupleBudget>) => Promise<{ success: boolean; error?: string }>;
  deleteBudget: (id: string) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

const CoupleContext = createContext<CoupleContextType | undefined>(undefined);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isCouple } = usePlanLimits();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [pendingInvites, setPendingInvites] = useState<CoupleInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<CoupleInvite[]>([]);
  const [goals, setGoals] = useState<CoupleGoal[]>([]);
  const [budgets, setBudgets] = useState<CoupleBudget[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [loading, setLoading] = useState(true);

  const isCouplePlan = isCouple();
  const hasCouple = !!couple;
  const currentMember = couple?.members.find(m => m.user_id === user?.id) || null;
  const partner = couple?.members.find(m => m.user_id !== user?.id) || null;
  const canInvitePartner = isCouplePlan && hasCouple && couple.members.length < 2;

  const fetchCoupleData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch couple membership
      const { data: memberData } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', user.id)
        .single();

      if (memberData) {
        // Fetch couple with all members
        const { data: coupleData } = await supabase
          .from('couples')
          .select('*')
          .eq('id', memberData.couple_id)
          .single();

        if (coupleData) {
          const { data: membersData } = await supabase
            .from('couple_members')
            .select('*')
            .eq('couple_id', coupleData.id);

          setCouple({
            ...coupleData,
            members: membersData || [],
          });

          // Fetch goals
          const { data: goalsData } = await supabase
            .from('couple_goals')
            .select('*')
            .eq('couple_id', coupleData.id)
            .order('created_at', { ascending: false });

          setGoals(goalsData?.map(g => ({
            ...g,
            target_amount: Number(g.target_amount),
            current_amount: Number(g.current_amount),
          })) || []);

          // Fetch budgets
          const { data: budgetsData } = await supabase
            .from('couple_budgets')
            .select('*')
            .eq('couple_id', coupleData.id);

          setBudgets(budgetsData?.map(b => ({
            ...b,
            monthly_limit: Number(b.monthly_limit),
            alert_threshold: Number(b.alert_threshold),
          })) || []);
        }
      } else {
        setCouple(null);
        setGoals([]);
        setBudgets([]);
      }

      // Fetch pending invites sent by user
      const { data: sentInvites } = await supabase
        .from('couple_invites')
        .select('*')
        .eq('inviter_id', user.id)
        .eq('status', 'pending');

      setPendingInvites(sentInvites || []);

      // Fetch received invites by phone
      const { data: userPhones } = await supabase
        .from('whatsapp_numbers')
        .select('phone')
        .eq('user_id', user.id);

      if (userPhones && userPhones.length > 0) {
        const phones = userPhones.map(p => p.phone);
        const { data: received } = await supabase
          .from('couple_invites')
          .select('*')
          .in('invitee_phone', phones)
          .eq('status', 'pending');

        setReceivedInvites(received || []);
      }
    } catch (error) {
      console.error('Error fetching couple data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCoupleData();
  }, [fetchCoupleData]);

  const createCouple = async () => {
    if (!user || !isCouplePlan) {
      return { success: false, error: 'Plano Casal necessário' };
    }

    try {
      // Create couple
      const { data: newCouple, error: coupleError } = await supabase
        .from('couples')
        .insert({})
        .select()
        .single();

      if (coupleError) throw coupleError;

      // Add current user as owner
      const { error: memberError } = await supabase
        .from('couple_members')
        .insert({
          couple_id: newCouple.id,
          user_id: user.id,
          is_owner: true,
        });

      if (memberError) throw memberError;

      await fetchCoupleData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const invitePartner = async (phone: string) => {
    if (!user || !couple) {
      return { success: false, error: 'Casal não encontrado' };
    }

    if (couple.members.length >= 2) {
      return { success: false, error: 'O casal já está completo' };
    }

    try {
      const { error } = await supabase
        .from('couple_invites')
        .insert({
          couple_id: couple.id,
          inviter_id: user.id,
          invitee_phone: phone,
        });

      if (error) throw error;

      await fetchCoupleData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const cancelInvite = async (inviteId: string) => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      await supabase
        .from('couple_invites')
        .update({ status: 'cancelled' })
        .eq('id', inviteId)
        .eq('inviter_id', user.id);

      await fetchCoupleData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const sendWhatsAppNotification = async (phone: string, message: string) => {
    try {
      const response = await supabase.functions.invoke('send-whatsapp', {
        body: { phone, message },
      });
      
      if (response.error) {
        console.error('Error sending WhatsApp notification:', response.error);
      } else {
        console.log('WhatsApp notification sent successfully');
      }
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
    }
  };

  const acceptInvite = async (inviteId: string) => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      // Get invite with inviter info
      const { data: invite } = await supabase
        .from('couple_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (!invite) {
        return { success: false, error: 'Convite não encontrado' };
      }

      // Check if user is already in a couple
      const { data: existingMember } = await supabase
        .from('couple_members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        return { success: false, error: 'Você já faz parte de um casal' };
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('couple_members')
        .insert({
          couple_id: invite.couple_id,
          user_id: user.id,
          is_owner: false,
        });

      if (memberError) throw memberError;

      // Update user's account_type to 'couple'
      await supabase
        .from('profiles')
        .update({ account_type: 'couple' })
        .eq('user_id', user.id);

      // Update invite status
      await supabase
        .from('couple_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);

      // Cancel any other pending invites for this user's phone numbers
      const { data: userPhones } = await supabase
        .from('whatsapp_numbers')
        .select('phone')
        .eq('user_id', user.id);

      if (userPhones && userPhones.length > 0) {
        const phones = userPhones.map(p => p.phone);
        await supabase
          .from('couple_invites')
          .update({ status: 'cancelled' })
          .in('invitee_phone', phones)
          .eq('status', 'pending')
          .neq('id', inviteId);
      }

      // Get inviter's WhatsApp number to send notification
      const { data: inviterPhone } = await supabase
        .from('whatsapp_numbers')
        .select('phone')
        .eq('user_id', invite.inviter_id)
        .eq('is_primary', true)
        .maybeSingle();

      if (inviterPhone) {
        // Get accepter's name from profile
        const { data: accepterProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();

        const accepterName = accepterProfile?.full_name || 'Seu parceiro(a)';
        
        // Send WhatsApp notification to inviter
        sendWhatsAppNotification(
          inviterPhone.phone,
          `💕 *Contaê - Conta Casal*\n\n${accepterName} aceitou seu convite para a Conta Casal!\n\nAgora vocês podem gerenciar as finanças juntos. Acesse o app para configurar seus perfis e metas.`
        );
      }

      await fetchCoupleData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const rejectInvite = async (inviteId: string) => {
    try {
      await supabase
        .from('couple_invites')
        .update({ status: 'rejected' })
        .eq('id', inviteId);

      await fetchCoupleData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const leaveCouple = async () => {
    if (!user || !couple) {
      return { success: false, error: 'Casal não encontrado' };
    }

    try {
      // Remove user from couple
      await supabase
        .from('couple_members')
        .delete()
        .eq('couple_id', couple.id)
        .eq('user_id', user.id);

      // If user was owner, delete the couple entirely
      if (currentMember?.is_owner) {
        await supabase
          .from('couples')
          .delete()
          .eq('id', couple.id);
      }

      await fetchCoupleData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateMemberProfile = async (nickname: string, avatarColor: string) => {
    if (!user || !couple) {
      return { success: false, error: 'Casal não encontrado' };
    }

    try {
      await supabase
        .from('couple_members')
        .update({ nickname, avatar_color: avatarColor })
        .eq('couple_id', couple.id)
        .eq('user_id', user.id);

      await fetchCoupleData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const createGoal = async (data: Omit<CoupleGoal, 'id' | 'couple_id' | 'is_completed'>) => {
    if (!couple) {
      return { success: false, error: 'Casal não encontrado' };
    }

    try {
      await supabase
        .from('couple_goals')
        .insert({
          couple_id: couple.id,
          ...data,
        });

      await fetchCoupleData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateGoal = async (id: string, data: Partial<CoupleGoal>) => {
    try {
      await supabase
        .from('couple_goals')
        .update(data)
        .eq('id', id);

      await fetchCoupleData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await supabase
        .from('couple_goals')
        .delete()
        .eq('id', id);

      await fetchCoupleData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const createBudget = async (categoryId: string | null, monthlyLimit: number, alertThreshold: number) => {
    if (!couple) {
      return { success: false, error: 'Casal não encontrado' };
    }

    try {
      await supabase
        .from('couple_budgets')
        .insert({
          couple_id: couple.id,
          category_id: categoryId,
          monthly_limit: monthlyLimit,
          alert_threshold: alertThreshold,
        });

      await fetchCoupleData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateBudget = async (id: string, data: Partial<CoupleBudget>) => {
    try {
      await supabase
        .from('couple_budgets')
        .update(data)
        .eq('id', id);

      await fetchCoupleData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await supabase
        .from('couple_budgets')
        .delete()
        .eq('id', id);

      await fetchCoupleData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return (
    <CoupleContext.Provider
      value={{
        couple,
        partner,
        currentMember,
        pendingInvites,
        receivedInvites,
        goals,
        budgets,
        viewMode,
        setViewMode,
        loading,
        isCouplePlan,
        hasCouple,
        canInvitePartner,
        createCouple,
        invitePartner,
        cancelInvite,
        acceptInvite,
        rejectInvite,
        leaveCouple,
        updateMemberProfile,
        createGoal,
        updateGoal,
        deleteGoal,
        createBudget,
        updateBudget,
        deleteBudget,
        refresh: fetchCoupleData,
      }}
    >
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple() {
  const context = useContext(CoupleContext);
  if (context === undefined) {
    throw new Error('useCouple must be used within a CoupleProvider');
  }
  return context;
}
