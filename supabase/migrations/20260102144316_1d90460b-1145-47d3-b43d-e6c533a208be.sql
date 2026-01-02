-- Tabela para registrar pagamentos de fatura de cartão
CREATE TABLE public.card_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_full_payment BOOLEAN NOT NULL DEFAULT false,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.card_payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own card payments"
ON public.card_payments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own card payments"
ON public.card_payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own card payments"
ON public.card_payments
FOR DELETE
USING (auth.uid() = user_id);