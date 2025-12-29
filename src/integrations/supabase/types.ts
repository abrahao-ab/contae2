export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          bank_name: string | null
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          bank_name?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          bank_name?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          couple_id: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          is_shared: boolean
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          couple_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          couple_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_budgets: {
        Row: {
          alert_threshold: number
          category_id: string | null
          couple_id: string
          created_at: string
          id: string
          monthly_limit: number
          updated_at: string
        }
        Insert: {
          alert_threshold?: number
          category_id?: string | null
          couple_id: string
          created_at?: string
          id?: string
          monthly_limit: number
          updated_at?: string
        }
        Update: {
          alert_threshold?: number
          category_id?: string | null
          couple_id?: string
          created_at?: string
          id?: string
          monthly_limit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_budgets_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_goals: {
        Row: {
          color: string | null
          couple_id: string
          created_at: string
          current_amount: number
          deadline: string | null
          icon: string | null
          id: string
          is_completed: boolean
          name: string
          target_amount: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          couple_id: string
          created_at?: string
          current_amount?: number
          deadline?: string | null
          icon?: string | null
          id?: string
          is_completed?: boolean
          name: string
          target_amount: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          couple_id?: string
          created_at?: string
          current_amount?: number
          deadline?: string | null
          icon?: string | null
          id?: string
          is_completed?: boolean
          name?: string
          target_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_goals_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_invites: {
        Row: {
          couple_id: string
          created_at: string
          expires_at: string
          id: string
          invitee_phone: string
          inviter_id: string
          status: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invitee_phone: string
          inviter_id: string
          status?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invitee_phone?: string
          inviter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_invites_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_members: {
        Row: {
          avatar_color: string | null
          couple_id: string
          id: string
          is_owner: boolean
          joined_at: string
          nickname: string | null
          user_id: string
        }
        Insert: {
          avatar_color?: string | null
          couple_id: string
          id?: string
          is_owner?: boolean
          joined_at?: string
          nickname?: string | null
          user_id: string
        }
        Update: {
          avatar_color?: string | null
          couple_id?: string
          id?: string
          is_owner?: boolean
          joined_at?: string
          nickname?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_members_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          bank_name: string
          closing_day: number | null
          color: string | null
          created_at: string
          credit_limit: number
          current_balance: number
          due_day: number | null
          id: string
          is_active: boolean | null
          last_four_digits: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_name: string
          closing_day?: number | null
          color?: string | null
          created_at?: string
          credit_limit?: number
          current_balance?: number
          due_day?: number | null
          id?: string
          is_active?: boolean | null
          last_four_digits?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_name?: string
          closing_day?: number | null
          color?: string | null
          created_at?: string
          credit_limit?: number
          current_balance?: number
          due_day?: number | null
          id?: string
          is_active?: boolean | null
          last_four_digits?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          paid_at: string | null
          status: Database["public"]["Enums"]["installment_status"]
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          paid_at?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          paid_at?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          created_at: string | null
          feature_key: string
          id: string
          is_unlimited: boolean | null
          limit_value: number | null
          plan_id: string
        }
        Insert: {
          created_at?: string | null
          feature_key: string
          id?: string
          is_unlimited?: boolean | null
          limit_value?: number | null
          plan_id: string
        }
        Update: {
          created_at?: string | null
          feature_key?: string
          id?: string
          is_unlimited?: boolean | null
          limit_value?: number | null
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_limits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string
          features: Json
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          popular: boolean | null
          price: number
          price_display: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description: string
          features?: Json
          icon?: string | null
          id: string
          is_active?: boolean | null
          name: string
          popular?: boolean | null
          price?: number
          price_display: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          features?: Json
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          popular?: boolean | null
          price?: number
          price_display?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          category_id: string | null
          couple_id: string | null
          created_at: string
          credit_card_id: string | null
          current_installment: number | null
          date: string
          description: string | null
          id: string
          is_installment: boolean | null
          is_recurring: boolean | null
          owner_type: Database["public"]["Enums"]["transaction_owner_type"]
          parent_transaction_id: string | null
          purchase_date: string | null
          source: Database["public"]["Enums"]["transaction_source"]
          total_installments: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category_id?: string | null
          couple_id?: string | null
          created_at?: string
          credit_card_id?: string | null
          current_installment?: number | null
          date?: string
          description?: string | null
          id?: string
          is_installment?: boolean | null
          is_recurring?: boolean | null
          owner_type?: Database["public"]["Enums"]["transaction_owner_type"]
          parent_transaction_id?: string | null
          purchase_date?: string | null
          source?: Database["public"]["Enums"]["transaction_source"]
          total_installments?: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          couple_id?: string | null
          created_at?: string
          credit_card_id?: string | null
          current_installment?: number | null
          date?: string
          description?: string | null
          id?: string
          is_installment?: boolean | null
          is_recurring?: boolean | null
          owner_type?: Database["public"]["Enums"]["transaction_owner_type"]
          parent_transaction_id?: string | null
          purchase_date?: string | null
          source?: Database["public"]["Enums"]["transaction_source"]
          total_installments?: number | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_numbers: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_couple_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_couple_member: {
        Args: { _couple_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "free" | "paid" | "couple"
      app_role: "admin" | "user"
      installment_status: "pending" | "paid" | "overdue"
      transaction_owner_type: "individual" | "shared"
      transaction_source:
        | "web"
        | "whatsapp_text"
        | "whatsapp_voice"
        | "whatsapp_image"
      transaction_type: "income" | "expense"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["free", "paid", "couple"],
      app_role: ["admin", "user"],
      installment_status: ["pending", "paid", "overdue"],
      transaction_owner_type: ["individual", "shared"],
      transaction_source: [
        "web",
        "whatsapp_text",
        "whatsapp_voice",
        "whatsapp_image",
      ],
      transaction_type: ["income", "expense"],
    },
  },
} as const
