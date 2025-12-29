-- Add missing DELETE policy for installments table
-- This ensures users can only delete installments associated with their own transactions

CREATE POLICY "Users can delete own installments" 
ON public.installments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = installments.transaction_id 
    AND t.user_id = auth.uid()
  )
);