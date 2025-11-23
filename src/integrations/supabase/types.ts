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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          tool_calls: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          tool_calls?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          confidence_score: number | null
          created_at: string
          diversification_score: number | null
          id: string
          model_version: string
          processing_time_ms: number | null
          recommendations: Json
          session_id: string
          updated_at: string
          user_id: string
          user_profile: Json
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          diversification_score?: number | null
          id?: string
          model_version?: string
          processing_time_ms?: number | null
          recommendations: Json
          session_id?: string
          updated_at?: string
          user_id: string
          user_profile: Json
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          diversification_score?: number | null
          id?: string
          model_version?: string
          processing_time_ms?: number | null
          recommendations?: Json
          session_id?: string
          updated_at?: string
          user_id?: string
          user_profile?: Json
        }
        Relationships: []
      }
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
      daily_swipe_limits: {
        Row: {
          created_at: string
          date: string
          id: string
          swipes_used: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          swipes_used?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          swipes_used?: number
          updated_at?: string
          user_id?: string | null
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
      recommendation_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          matches_count: number | null
          passes_count: number | null
          recommendations_shown: number | null
          session_duration_seconds: number | null
          session_type: string
          user_id: string
          user_satisfaction_score: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          matches_count?: number | null
          passes_count?: number | null
          recommendations_shown?: number | null
          session_duration_seconds?: number | null
          session_type: string
          user_id: string
          user_satisfaction_score?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          matches_count?: number | null
          passes_count?: number | null
          recommendations_shown?: number | null
          session_duration_seconds?: number | null
          session_type?: string
          user_id?: string
          user_satisfaction_score?: number | null
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
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
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
      user_feedback: {
        Row: {
          created_at: string
          feedback_reason: string | null
          feedback_type: string
          id: string
          is_ai_recommendation: boolean
          recommendation_id: string | null
          stock_ticker: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_reason?: string | null
          feedback_type: string
          id?: string
          is_ai_recommendation?: boolean
          recommendation_id?: string | null
          stock_ticker: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_reason?: string | null
          feedback_type?: string
          id?: string
          is_ai_recommendation?: boolean
          recommendation_id?: string | null
          stock_ticker?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "ai_recommendations"
            referencedColumns: ["id"]
          },
        ]
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
          age: number | null
          age_range: string | null
          ai_learned_preferences: Json | null
          behavior_patterns: Json | null
          created_at: string
          gender: string | null
          id: string
          income_level: string | null
          investment_experience: string | null
          investment_goals: string[] | null
          last_ai_analysis: string | null
          risk_tolerance: string | null
          salary: number | null
          sectors_of_interest: string[] | null
          time_horizon: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          age_range?: string | null
          ai_learned_preferences?: Json | null
          behavior_patterns?: Json | null
          created_at?: string
          gender?: string | null
          id?: string
          income_level?: string | null
          investment_experience?: string | null
          investment_goals?: string[] | null
          last_ai_analysis?: string | null
          risk_tolerance?: string | null
          salary?: number | null
          sectors_of_interest?: string[] | null
          time_horizon?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          age_range?: string | null
          ai_learned_preferences?: Json | null
          behavior_patterns?: Json | null
          created_at?: string
          gender?: string | null
          id?: string
          income_level?: string | null
          investment_experience?: string | null
          investment_goals?: string[] | null
          last_ai_analysis?: string | null
          risk_tolerance?: string | null
          salary?: number | null
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
      waitlist: {
        Row: {
          created_at: string
          email: string
          experience: string
          id: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          email: string
          experience: string
          id?: string
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string
          experience?: string
          id?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      trigger_ceo_data_update: { Args: never; Returns: undefined }
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
