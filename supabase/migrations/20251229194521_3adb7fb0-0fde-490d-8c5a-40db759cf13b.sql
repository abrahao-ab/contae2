-- Add purchase_date column to store the original purchase date
-- The existing 'date' column will continue to store the due/effective date
ALTER TABLE public.transactions 
ADD COLUMN purchase_date date;

-- For credit card transactions, purchase_date = when the purchase was made
-- date = when the invoice is due (payment date)

-- Add a comment to clarify the columns
COMMENT ON COLUMN public.transactions.date IS 'Data de vencimento/efetivação da transação';
COMMENT ON COLUMN public.transactions.purchase_date IS 'Data original da compra (para cartões de crédito)';