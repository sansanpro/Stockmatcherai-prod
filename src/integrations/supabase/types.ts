export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      consumer_stocks: {
        Row: {
          ceo_highlights: string
          ceo_name: string
          company_name: string
          created_at: string | null
          dividend_yield: number
          esg_score: number | null
          id: string
          last_updated: string | null
          market_cap: string
          one_year_return: number
          pe_ratio: number
          price_per_share: number
          risk_level: string
          ticker: string
          updated_at: string | null
        }
        Insert: {
          ceo_highlights: string
          ceo_name: string
          company_name: string
          created_at?: string | null
          dividend_yield: number
          esg_score?: number | null
          id: string
          last_updated?: string | null
          market_cap: string
          one_year_return: number
          pe_ratio: number
          price_per_share: number
          risk_level: string
          ticker: string
          updated_at?: string | null
        }
        Update: {
          ceo_highlights?: string
          ceo_name?: string
          company_name?: string
          created_at?: string | null
          dividend_yield?: number
          esg_score?: number | null
          id?: string
          last_updated?: string | null
          market_cap?: string
          one_year_return?: number
          pe_ratio?: number
          price_per_share?: number
          risk_level?: string
          ticker?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      energy_stocks: {
        Row: {
          ceo_highlights: string
          ceo_name: string
          company_name: string
          created_at: string | null
          dividend_yield: number
          esg_score: number | null
          id: string
          last_updated: string | null
          market_cap: string
          one_year_return: number
          pe_ratio: number
          price_per_share: number
          risk_level: string
          ticker: string
          updated_at: string | null
        }
        Insert: {
          ceo_highlights: string
          ceo_name: string
          company_name: string
          created_at?: string | null
          dividend_yield: number
          esg_score?: number | null
          id: string
          last_updated?: string | null
          market_cap: string
          one_year_return: number
          pe_ratio: number
          price_per_share: number
          risk_level: string
          ticker: string
          updated_at?: string | null
        }
        Update: {
          ceo_highlights?: string
          ceo_name?: string
          company_name?: string
          created_at?: string | null
          dividend_yield?: number
          esg_score?: number | null
          id?: string
          last_updated?: string | null
          market_cap?: string
          one_year_return?: number
          pe_ratio?: number
          price_per_share?: number
          risk_level?: string
          ticker?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      finance_stocks: {
        Row: {
          ceo_highlights: string
          ceo_name: string
          company_name: string
          created_at: string | null
          dividend_yield: number
          esg_score: number | null
          id: string
          last_updated: string | null
          market_cap: string
          one_year_return: number
          pe_ratio: number
          price_per_share: number
          risk_level: string
          ticker: string
          updated_at: string | null
        }
        Insert: {
          ceo_highlights: string
          ceo_name: string
          company_name: string
          created_at?: string | null
          dividend_yield: number
          esg_score?: number | null
          id: string
          last_updated?: string | null
          market_cap: string
          one_year_return: number
          pe_ratio: number
          price_per_share: number
          risk_level: string
          ticker: string
          updated_at?: string | null
        }
        Update: {
          ceo_highlights?: string
          ceo_name?: string
          company_name?: string
          created_at?: string | null
          dividend_yield?: number
          esg_score?: number | null
          id?: string
          last_updated?: string | null
          market_cap?: string
          one_year_return?: number
          pe_ratio?: number
          price_per_share?: number
          risk_level?: string
          ticker?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      healthcare_stocks: {
        Row: {
          ceo_highlights: string
          ceo_name: string
          company_name: string
          created_at: string | null
          dividend_yield: number
          esg_score: number | null
          id: string
          last_updated: string | null
          market_cap: string
          one_year_return: number
          pe_ratio: number
          price_per_share: number
          risk_level: string
          ticker: string
          updated_at: string | null
        }
        Insert: {
          ceo_highlights: string
          ceo_name: string
          company_name: string
          created_at?: string | null
          dividend_yield: number
          esg_score?: number | null
          id: string
          last_updated?: string | null
          market_cap: string
          one_year_return: number
          pe_ratio: number
          price_per_share: number
          risk_level: string
          ticker: string
          updated_at?: string | null
        }
        Update: {
          ceo_highlights?: string
          ceo_name?: string
          company_name?: string
          created_at?: string | null
          dividend_yield?: number
          esg_score?: number | null
          id?: string
          last_updated?: string | null
          market_cap?: string
          one_year_return?: number
          pe_ratio?: number
          price_per_share?: number
          risk_level?: string
          ticker?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_update_logs: {
        Row: {
          api_calls_used: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          sector: string
          started_at: string | null
          status: string | null
          stocks_failed: number | null
          stocks_updated: number | null
          update_type: string
        }
        Insert: {
          api_calls_used?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          sector: string
          started_at?: string | null
          status?: string | null
          stocks_failed?: number | null
          stocks_updated?: number | null
          update_type?: string
        }
        Update: {
          api_calls_used?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          sector?: string
          started_at?: string | null
          status?: string | null
          stocks_failed?: number | null
          stocks_updated?: number | null
          update_type?: string
        }
        Relationships: []
      }
      technology_stocks: {
        Row: {
          ceo_highlights: string
          ceo_name: string
          company_name: string
          created_at: string | null
          dividend_yield: number
          esg_score: number | null
          id: string
          last_updated: string | null
          market_cap: string
          one_year_return: number
          pe_ratio: number
          price_per_share: number
          risk_level: string
          ticker: string
          updated_at: string | null
        }
        Insert: {
          ceo_highlights: string
          ceo_name: string
          company_name: string
          created_at?: string | null
          dividend_yield: number
          esg_score?: number | null
          id: string
          last_updated?: string | null
          market_cap: string
          one_year_return: number
          pe_ratio: number
          price_per_share: number
          risk_level: string
          ticker: string
          updated_at?: string | null
        }
        Update: {
          ceo_highlights?: string
          ceo_name?: string
          company_name?: string
          created_at?: string | null
          dividend_yield?: number
          esg_score?: number | null
          id?: string
          last_updated?: string | null
          market_cap?: string
          one_year_return?: number
          pe_ratio?: number
          price_per_share?: number
          risk_level?: string
          ticker?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_matches: {
        Row: {
          company_name: string
          id: string
          is_match: boolean
          match_reason: string | null
          matched_at: string
          stock_data: Json | null
          ticker: string
          user_id: string
        }
        Insert: {
          company_name: string
          id?: string
          is_match: boolean
          match_reason?: string | null
          matched_at?: string
          stock_data?: Json | null
          ticker: string
          user_id: string
        }
        Update: {
          company_name?: string
          id?: string
          is_match?: boolean
          match_reason?: string | null
          matched_at?: string
          stock_data?: Json | null
          ticker?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          age_range: string | null
          created_at: string
          id: string
          income_level: string | null
          investment_experience: string | null
          investment_goals: string[] | null
          risk_tolerance: string | null
          sectors_of_interest: string[] | null
          time_horizon: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          created_at?: string
          id?: string
          income_level?: string | null
          investment_experience?: string | null
          investment_goals?: string[] | null
          risk_tolerance?: string | null
          sectors_of_interest?: string[] | null
          time_horizon?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          created_at?: string
          id?: string
          income_level?: string | null
          investment_experience?: string | null
          investment_goals?: string[] | null
          risk_tolerance?: string | null
          sectors_of_interest?: string[] | null
          time_horizon?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_watchlists: {
        Row: {
          added_at: string
          company_name: string
          id: string
          stock_data: Json | null
          ticker: string
          user_id: string
        }
        Insert: {
          added_at?: string
          company_name: string
          id?: string
          stock_data?: Json | null
          ticker: string
          user_id: string
        }
        Update: {
          added_at?: string
          company_name?: string
          id?: string
          stock_data?: Json | null
          ticker?: string
          user_id?: string
        }
        Relationships: []
      }
      utilities_stocks: {
        Row: {
          ceo_highlights: string
          ceo_name: string
          company_name: string
          created_at: string | null
          dividend_yield: number
          esg_score: number | null
          id: string
          last_updated: string | null
          market_cap: string
          one_year_return: number
          pe_ratio: number
          price_per_share: number
          risk_level: string
          ticker: string
          updated_at: string | null
        }
        Insert: {
          ceo_highlights: string
          ceo_name: string
          company_name: string
          created_at?: string | null
          dividend_yield: number
          esg_score?: number | null
          id: string
          last_updated?: string | null
          market_cap: string
          one_year_return: number
          pe_ratio: number
          price_per_share: number
          risk_level: string
          ticker: string
          updated_at?: string | null
        }
        Update: {
          ceo_highlights?: string
          ceo_name?: string
          company_name?: string
          created_at?: string | null
          dividend_yield?: number
          esg_score?: number | null
          id?: string
          last_updated?: string | null
          market_cap?: string
          one_year_return?: number
          pe_ratio?: number
          price_per_share?: number
          risk_level?: string
          ticker?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      trigger_ceo_data_update: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
