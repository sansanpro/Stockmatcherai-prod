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
    PostgrestVersion: "12.2.3"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
      ai_error_logs: {
        Row: {
          created_at: string
          function_name: string
          id: number
          message: string | null
          model: string | null
          stage: string
          status: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: never
          message?: string | null
          model?: string | null
          stage: string
          status?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: never
          message?: string | null
          model?: string | null
          stage?: string
          status?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_model_status: {
        Row: {
          cooling_until: string
          model: string
          updated_at: string
        }
        Insert: {
          cooling_until: string
          model: string
          updated_at?: string
        }
        Update: {
          cooling_until?: string
          model?: string
          updated_at?: string
        }
        Relationships: []
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
      analytics_events: {
        Row: {
          anonymous_id: string
          app_version: string | null
          created_at: string
          event: string
          id: number
          platform: string | null
          props: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id: string
          app_version?: string | null
          created_at?: string
          event: string
          id?: never
          platform?: string | null
          props?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string
          app_version?: string | null
          created_at?: string
          event?: string
          id?: never
          platform?: string | null
          props?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      causes: {
        Row: {
          icon: string
          id: string
          is_live: boolean
          label: string
          sort_order: number
          tagline: string
        }
        Insert: {
          icon: string
          id: string
          is_live?: boolean
          label: string
          sort_order: number
          tagline: string
        }
        Update: {
          icon?: string
          id?: string
          is_live?: boolean
          label?: string
          sort_order?: number
          tagline?: string
        }
        Relationships: []
      }
      daily_decks: {
        Row: {
          cards: Json
          created_at: string
          deck_date: string
          user_id: string
        }
        Insert: {
          cards: Json
          created_at?: string
          deck_date: string
          user_id: string
        }
        Update: {
          cards?: Json
          created_at?: string
          deck_date?: string
          user_id?: string
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
      market_data_cache: {
        Row: {
          cache_key: string
          data: Json
          fetched_at: string
        }
        Insert: {
          cache_key: string
          data: Json
          fetched_at?: string
        }
        Update: {
          cache_key?: string
          data?: Json
          fetched_at?: string
        }
        Relationships: []
      }
      price_moves: {
        Row: {
          move_date: string
          pct: number
          price: number | null
          recorded_at: string
          ticker: string
        }
        Insert: {
          move_date: string
          pct: number
          price?: number | null
          recorded_at?: string
          ticker: string
        }
        Update: {
          move_date?: string
          pct?: number
          price?: number | null
          recorded_at?: string
          ticker?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "consumer_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "consumer_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "energy_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "energy_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "finance_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "finance_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "healthcare_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "healthcare_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "technology_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "technology_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "utilities_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_moves_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "utilities_stocks"
            referencedColumns: ["ticker"]
          },
        ]
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
      stock_flags: {
        Row: {
          created_at: string
          dealbreaker: string
          evidence: string
          source_url: string
          ticker: string
        }
        Insert: {
          created_at?: string
          dealbreaker: string
          evidence: string
          source_url: string
          ticker: string
        }
        Update: {
          created_at?: string
          dealbreaker?: string
          evidence?: string
          source_url?: string
          ticker?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "consumer_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "consumer_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "energy_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "energy_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "finance_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "finance_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "healthcare_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "healthcare_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "technology_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "technology_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "utilities_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_flags_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "utilities_stocks"
            referencedColumns: ["ticker"]
          },
        ]
      }
      stock_missions: {
        Row: {
          cause: string
          created_at: string
          evidence: string
          exposure: string
          id: number
          reviewed_at: string | null
          source_url: string
          status: string
          tagged_by: string
          ticker: string
          updated_at: string
          version: number
          why_line: string | null
        }
        Insert: {
          cause: string
          created_at?: string
          evidence: string
          exposure: string
          id?: never
          reviewed_at?: string | null
          source_url: string
          status?: string
          tagged_by: string
          ticker: string
          updated_at?: string
          version?: number
          why_line?: string | null
        }
        Update: {
          cause?: string
          created_at?: string
          evidence?: string
          exposure?: string
          id?: never
          reviewed_at?: string | null
          source_url?: string
          status?: string
          tagged_by?: string
          ticker?: string
          updated_at?: string
          version?: number
          why_line?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_missions_cause_fkey"
            columns: ["cause"]
            isOneToOne: false
            referencedRelation: "cause_company_counts"
            referencedColumns: ["cause"]
          },
          {
            foreignKeyName: "stock_missions_cause_fkey"
            columns: ["cause"]
            isOneToOne: false
            referencedRelation: "causes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "consumer_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "consumer_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "energy_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "energy_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "finance_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "finance_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "healthcare_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "healthcare_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "technology_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "technology_stocks"
            referencedColumns: ["ticker"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "utilities_stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_missions_ticker_fkey"
            columns: ["ticker"]
            isOneToOne: false
            referencedRelation: "utilities_stocks"
            referencedColumns: ["ticker"]
          },
        ]
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
      stocks: {
        Row: {
          beta: number | null
          caution_checked_on: string | null
          caution_headline: string | null
          caution_reason: string | null
          caution_source_url: string | null
          ceo_highlights: string | null
          ceo_name: string | null
          city: string | null
          company_name: string
          country: string
          created_at: string
          description: string | null
          dividend_yield: number | null
          esg_score: number | null
          exchange: string | null
          finnhub_synced_at: string | null
          full_time_employees: number | null
          in_feed: boolean
          industry: string | null
          ipo_date: string | null
          is_fund: boolean
          last_updated: string
          logo_url: string | null
          market_cap: string | null
          market_cap_usd: number | null
          mission_story: string | null
          one_year_return: number | null
          pe_ratio: number | null
          price_per_share: number | null
          profile_updated_at: string
          proof: string | null
          proof_source_url: string | null
          risk_level: string | null
          sector: string
          state: string | null
          things_to_know: string[] | null
          ticker: string
          updated_at: string
          website: string | null
        }
        Insert: {
          beta?: number | null
          caution_checked_on?: string | null
          caution_headline?: string | null
          caution_reason?: string | null
          caution_source_url?: string | null
          ceo_highlights?: string | null
          ceo_name?: string | null
          city?: string | null
          company_name: string
          country?: string
          created_at?: string
          description?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          exchange?: string | null
          finnhub_synced_at?: string | null
          full_time_employees?: number | null
          in_feed?: boolean
          industry?: string | null
          ipo_date?: string | null
          is_fund?: boolean
          last_updated?: string
          logo_url?: string | null
          market_cap?: string | null
          market_cap_usd?: number | null
          mission_story?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          profile_updated_at?: string
          proof?: string | null
          proof_source_url?: string | null
          risk_level?: string | null
          sector: string
          state?: string | null
          things_to_know?: string[] | null
          ticker: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          beta?: number | null
          caution_checked_on?: string | null
          caution_headline?: string | null
          caution_reason?: string | null
          caution_source_url?: string | null
          ceo_highlights?: string | null
          ceo_name?: string | null
          city?: string | null
          company_name?: string
          country?: string
          created_at?: string
          description?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          exchange?: string | null
          finnhub_synced_at?: string | null
          full_time_employees?: number | null
          in_feed?: boolean
          industry?: string | null
          ipo_date?: string | null
          is_fund?: boolean
          last_updated?: string
          logo_url?: string | null
          market_cap?: string | null
          market_cap_usd?: number | null
          mission_story?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          profile_updated_at?: string
          proof?: string | null
          proof_source_url?: string | null
          risk_level?: string | null
          sector?: string
          state?: string | null
          things_to_know?: string[] | null
          ticker?: string
          updated_at?: string
          website?: string | null
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
          subscription_source: string | null
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
          subscription_source?: string | null
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
          subscription_source?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      swipes: {
        Row: {
          card_type: string
          cause: string | null
          created_at: string
          deck_date: string
          id: number
          liked: boolean
          ticker: string
          user_id: string
        }
        Insert: {
          card_type?: string
          cause?: string | null
          created_at?: string
          deck_date?: string
          id?: never
          liked: boolean
          ticker: string
          user_id: string
        }
        Update: {
          card_type?: string
          cause?: string | null
          created_at?: string
          deck_date?: string
          id?: never
          liked?: boolean
          ticker?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_cause_fkey"
            columns: ["cause"]
            isOneToOne: false
            referencedRelation: "cause_company_counts"
            referencedColumns: ["cause"]
          },
          {
            foreignKeyName: "swipes_cause_fkey"
            columns: ["cause"]
            isOneToOne: false
            referencedRelation: "causes"
            referencedColumns: ["id"]
          },
        ]
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
          causes: string[] | null
          created_at: string
          dealbreakers: string[] | null
          gender: string | null
          horizon: string | null
          id: string
          income_level: string | null
          investment_experience: string | null
          investment_goals: string[] | null
          last_ai_analysis: string | null
          motivation: string | null
          onboarding_version: number
          risk_tolerance: string | null
          salary: number | null
          sectors_of_interest: string[] | null
          starting_amount: string | null
          time_horizon: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          age_range?: string | null
          ai_learned_preferences?: Json | null
          behavior_patterns?: Json | null
          causes?: string[] | null
          created_at?: string
          dealbreakers?: string[] | null
          gender?: string | null
          horizon?: string | null
          id?: string
          income_level?: string | null
          investment_experience?: string | null
          investment_goals?: string[] | null
          last_ai_analysis?: string | null
          motivation?: string | null
          onboarding_version?: number
          risk_tolerance?: string | null
          salary?: number | null
          sectors_of_interest?: string[] | null
          starting_amount?: string | null
          time_horizon?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          age_range?: string | null
          ai_learned_preferences?: Json | null
          behavior_patterns?: Json | null
          causes?: string[] | null
          created_at?: string
          dealbreakers?: string[] | null
          gender?: string | null
          horizon?: string | null
          id?: string
          income_level?: string | null
          investment_experience?: string | null
          investment_goals?: string[] | null
          last_ai_analysis?: string | null
          motivation?: string | null
          onboarding_version?: number
          risk_tolerance?: string | null
          salary?: number | null
          sectors_of_interest?: string[] | null
          starting_amount?: string | null
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
      cause_company_counts: {
        Row: {
          cause: string | null
          companies: number | null
          is_live: boolean | null
          label: string | null
        }
        Relationships: []
      }
      company_profiles: {
        Row: {
          city: string | null
          country: string | null
          description: string | null
          finnhub_synced_at: string | null
          full_time_employees: number | null
          industry: string | null
          ipo_date: string | null
          logo_url: string | null
          state: string | null
          ticker: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          description?: string | null
          finnhub_synced_at?: string | null
          full_time_employees?: number | null
          industry?: string | null
          ipo_date?: string | null
          logo_url?: string | null
          state?: string | null
          ticker?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          description?: string | null
          finnhub_synced_at?: string | null
          full_time_employees?: number | null
          industry?: string | null
          ipo_date?: string | null
          logo_url?: string | null
          state?: string | null
          ticker?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      consumer_stocks: {
        Row: {
          ceo_highlights: string | null
          ceo_name: string | null
          company_name: string | null
          created_at: string | null
          dividend_yield: number | null
          esg_score: number | null
          id: string | null
          last_updated: string | null
          market_cap: string | null
          one_year_return: number | null
          pe_ratio: number | null
          price_per_share: number | null
          risk_level: string | null
          ticker: string | null
          updated_at: string | null
        }
        Insert: {
          ceo_highlights?: string | null
          ceo_name?: string | null
          company_name?: string | null
          created_at?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          id?: string | null
          last_updated?: string | null
          market_cap?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          risk_level?: string | null
          ticker?: string | null
          updated_at?: string | null
        }
        Update: {
          ceo_highlights?: string | null
          ceo_name?: string | null
          company_name?: string | null
          created_at?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          id?: string | null
          last_updated?: string | null
          market_cap?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          risk_level?: string | null
          ticker?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      energy_stocks: {
        Row: {
          ceo_highlights: string | null
          ceo_name: string | null
          company_name: string | null
          created_at: string | null
          dividend_yield: number | null
          esg_score: number | null
          id: string | null
          last_updated: string | null
          market_cap: string | null
          one_year_return: number | null
          pe_ratio: number | null
          price_per_share: number | null
          risk_level: string | null
          ticker: string | null
          updated_at: string | null
        }
        Insert: {
          ceo_highlights?: string | null
          ceo_name?: string | null
          company_name?: string | null
          created_at?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          id?: string | null
          last_updated?: string | null
          market_cap?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          risk_level?: string | null
          ticker?: string | null
          updated_at?: string | null
        }
        Update: {
          ceo_highlights?: string | null
          ceo_name?: string | null
          company_name?: string | null
          created_at?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          id?: string | null
          last_updated?: string | null
          market_cap?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          risk_level?: string | null
          ticker?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      finance_stocks: {
        Row: {
          ceo_highlights: string | null
          ceo_name: string | null
          company_name: string | null
          created_at: string | null
          dividend_yield: number | null
          esg_score: number | null
          id: string | null
          last_updated: string | null
          market_cap: string | null
          one_year_return: number | null
          pe_ratio: number | null
          price_per_share: number | null
          risk_level: string | null
          ticker: string | null
          updated_at: string | null
        }
        Insert: {
          ceo_highlights?: string | null
          ceo_name?: string | null
          company_name?: string | null
          created_at?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          id?: string | null
          last_updated?: string | null
          market_cap?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          risk_level?: string | null
          ticker?: string | null
          updated_at?: string | null
        }
        Update: {
          ceo_highlights?: string | null
          ceo_name?: string | null
          company_name?: string | null
          created_at?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          id?: string | null
          last_updated?: string | null
          market_cap?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          risk_level?: string | null
          ticker?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      healthcare_stocks: {
        Row: {
          ceo_highlights: string | null
          ceo_name: string | null
          company_name: string | null
          created_at: string | null
          dividend_yield: number | null
          esg_score: number | null
          id: string | null
          last_updated: string | null
          market_cap: string | null
          one_year_return: number | null
          pe_ratio: number | null
          price_per_share: number | null
          risk_level: string | null
          ticker: string | null
          updated_at: string | null
        }
        Insert: {
          ceo_highlights?: string | null
          ceo_name?: string | null
          company_name?: string | null
          created_at?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          id?: string | null
          last_updated?: string | null
          market_cap?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          risk_level?: string | null
          ticker?: string | null
          updated_at?: string | null
        }
        Update: {
          ceo_highlights?: string | null
          ceo_name?: string | null
          company_name?: string | null
          created_at?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          id?: string | null
          last_updated?: string | null
          market_cap?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          risk_level?: string | null
          ticker?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      technology_stocks: {
        Row: {
          ceo_highlights: string | null
          ceo_name: string | null
          company_name: string | null
          created_at: string | null
          dividend_yield: number | null
          esg_score: number | null
          id: string | null
          last_updated: string | null
          market_cap: string | null
          one_year_return: number | null
          pe_ratio: number | null
          price_per_share: number | null
          risk_level: string | null
          ticker: string | null
          updated_at: string | null
        }
        Insert: {
          ceo_highlights?: string | null
          ceo_name?: string | null
          company_name?: string | null
          created_at?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          id?: string | null
          last_updated?: string | null
          market_cap?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          risk_level?: string | null
          ticker?: string | null
          updated_at?: string | null
        }
        Update: {
          ceo_highlights?: string | null
          ceo_name?: string | null
          company_name?: string | null
          created_at?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          id?: string | null
          last_updated?: string | null
          market_cap?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          risk_level?: string | null
          ticker?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      utilities_stocks: {
        Row: {
          ceo_highlights: string | null
          ceo_name: string | null
          company_name: string | null
          created_at: string | null
          dividend_yield: number | null
          esg_score: number | null
          id: string | null
          last_updated: string | null
          market_cap: string | null
          one_year_return: number | null
          pe_ratio: number | null
          price_per_share: number | null
          risk_level: string | null
          ticker: string | null
          updated_at: string | null
        }
        Insert: {
          ceo_highlights?: string | null
          ceo_name?: string | null
          company_name?: string | null
          created_at?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          id?: string | null
          last_updated?: string | null
          market_cap?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          risk_level?: string | null
          ticker?: string | null
          updated_at?: string | null
        }
        Update: {
          ceo_highlights?: string | null
          ceo_name?: string | null
          company_name?: string | null
          created_at?: string | null
          dividend_yield?: number | null
          esg_score?: number | null
          id?: string | null
          last_updated?: string | null
          market_cap?: string | null
          one_year_return?: number | null
          pe_ratio?: number | null
          price_per_share?: number | null
          risk_level?: string | null
          ticker?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
