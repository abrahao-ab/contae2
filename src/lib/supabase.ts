import { supabase } from "@/integrations/supabase/client";

export { supabase };

// Helper types for the financial app
export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'web' | 'whatsapp_text' | 'whatsapp_voice' | 'whatsapp_image';
export type InstallmentStatus = 'pending' | 'paid' | 'overdue';
