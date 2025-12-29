-- Enum para tipo de proprietário da transação
CREATE TYPE public.transaction_owner_type AS ENUM ('individual', 'shared');

-- Tabela de casais
CREATE TABLE public.couples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de membros do casal
CREATE TABLE public.couple_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nickname TEXT,
  avatar_color TEXT DEFAULT '#22c55e',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_owner BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(couple_id, user_id),
  UNIQUE(user_id) -- Um usuário só pode estar em um casal
);

-- Tabela de convites para casal
CREATE TABLE public.couple_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Tabela de metas do casal
CREATE TABLE public.couple_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  icon TEXT DEFAULT 'target',
  color TEXT DEFAULT '#22c55e',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de orçamentos do casal
CREATE TABLE public.couple_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  monthly_limit NUMERIC NOT NULL,
  alert_threshold NUMERIC NOT NULL DEFAULT 80, -- Porcentagem para alertar
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(couple_id, category_id)
);

-- Adicionar colunas para suportar casal nas transações
ALTER TABLE public.transactions
ADD COLUMN couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
ADD COLUMN owner_type public.transaction_owner_type NOT NULL DEFAULT 'individual';

-- Adicionar couple_id nas categorias para categorias compartilhadas
ALTER TABLE public.categories
ADD COLUMN couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS em todas as novas tabelas
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_budgets ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar se usuário é membro de um casal
CREATE OR REPLACE FUNCTION public.is_couple_member(_user_id UUID, _couple_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.couple_members
    WHERE user_id = _user_id
      AND couple_id = _couple_id
  )
$$;

-- Função para obter o couple_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_couple_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT couple_id
  FROM public.couple_members
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies para couples
CREATE POLICY "Users can view their couple"
ON public.couples
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.couple_members
    WHERE couple_members.couple_id = couples.id
    AND couple_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create couple"
ON public.couples
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Couple owners can delete couple"
ON public.couples
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.couple_members
    WHERE couple_members.couple_id = couples.id
    AND couple_members.user_id = auth.uid()
    AND couple_members.is_owner = true
  )
);

-- RLS Policies para couple_members
CREATE POLICY "Users can view couple members"
ON public.couple_members
FOR SELECT
USING (public.is_couple_member(auth.uid(), couple_id));

CREATE POLICY "Users can insert themselves as member"
ON public.couple_members
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own membership"
ON public.couple_members
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Owners can delete members"
ON public.couple_members
FOR DELETE
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.couple_members cm
    WHERE cm.couple_id = couple_members.couple_id
    AND cm.user_id = auth.uid()
    AND cm.is_owner = true
  )
);

-- RLS Policies para couple_invites
CREATE POLICY "Inviters can manage their invites"
ON public.couple_invites
FOR ALL
USING (inviter_id = auth.uid());

CREATE POLICY "Invitees can view invites by phone"
ON public.couple_invites
FOR SELECT
USING (
  invitee_phone IN (
    SELECT phone FROM public.whatsapp_numbers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Invitees can update invite status"
ON public.couple_invites
FOR UPDATE
USING (
  invitee_phone IN (
    SELECT phone FROM public.whatsapp_numbers WHERE user_id = auth.uid()
  )
);

-- RLS Policies para couple_goals
CREATE POLICY "Couple members can view goals"
ON public.couple_goals
FOR SELECT
USING (public.is_couple_member(auth.uid(), couple_id));

CREATE POLICY "Couple members can create goals"
ON public.couple_goals
FOR INSERT
WITH CHECK (public.is_couple_member(auth.uid(), couple_id));

CREATE POLICY "Couple members can update goals"
ON public.couple_goals
FOR UPDATE
USING (public.is_couple_member(auth.uid(), couple_id));

CREATE POLICY "Couple members can delete goals"
ON public.couple_goals
FOR DELETE
USING (public.is_couple_member(auth.uid(), couple_id));

-- RLS Policies para couple_budgets
CREATE POLICY "Couple members can view budgets"
ON public.couple_budgets
FOR SELECT
USING (public.is_couple_member(auth.uid(), couple_id));

CREATE POLICY "Couple members can create budgets"
ON public.couple_budgets
FOR INSERT
WITH CHECK (public.is_couple_member(auth.uid(), couple_id));

CREATE POLICY "Couple members can update budgets"
ON public.couple_budgets
FOR UPDATE
USING (public.is_couple_member(auth.uid(), couple_id));

CREATE POLICY "Couple members can delete budgets"
ON public.couple_budgets
FOR DELETE
USING (public.is_couple_member(auth.uid(), couple_id));

-- Atualizar RLS de transactions para incluir visão do casal
CREATE POLICY "Couple members can view shared transactions"
ON public.transactions
FOR SELECT
USING (
  auth.uid() = user_id OR
  (couple_id IS NOT NULL AND public.is_couple_member(auth.uid(), couple_id))
);

-- Atualizar RLS de categories para incluir categorias do casal
CREATE POLICY "Couple members can view shared categories"
ON public.categories
FOR SELECT
USING (
  auth.uid() = user_id OR
  (couple_id IS NOT NULL AND public.is_couple_member(auth.uid(), couple_id))
);

CREATE POLICY "Couple members can manage shared categories"
ON public.categories
FOR ALL
USING (
  auth.uid() = user_id OR
  (couple_id IS NOT NULL AND public.is_couple_member(auth.uid(), couple_id))
);

-- Trigger para updated_at
CREATE TRIGGER update_couples_updated_at
BEFORE UPDATE ON public.couples
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_couple_goals_updated_at
BEFORE UPDATE ON public.couple_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_couple_budgets_updated_at
BEFORE UPDATE ON public.couple_budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();