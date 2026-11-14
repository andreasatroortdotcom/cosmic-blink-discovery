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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      guest_sessions: {
        Row: {
          created_at: string
          secret_hash: string
          session_id: string
        }
        Insert: {
          created_at?: string
          secret_hash: string
          session_id: string
        }
        Update: {
          created_at?: string
          secret_hash?: string
          session_id?: string
        }
        Relationships: []
      }
      patch_rulings: {
        Row: {
          created_at: string
          patch_id: string
          ruled_by: string
          ruling: string
        }
        Insert: {
          created_at?: string
          patch_id: string
          ruled_by: string
          ruling: string
        }
        Update: {
          created_at?: string
          patch_id?: string
          ruled_by?: string
          ruling?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      swipes: {
        Row: {
          candidate_type: string | null
          constellation: string
          created_at: string
          dec: number
          id: string
          ip_hash: string | null
          patch_id: string
          ra: number
          user_id: string | null
          user_session_id: string
          verdict: string
        }
        Insert: {
          candidate_type?: string | null
          constellation?: string
          created_at?: string
          dec: number
          id?: string
          ip_hash?: string | null
          patch_id: string
          ra: number
          user_id?: string | null
          user_session_id: string
          verdict: string
        }
        Update: {
          candidate_type?: string | null
          constellation?: string
          created_at?: string
          dec?: number
          id?: string
          ip_hash?: string | null
          patch_id?: string
          ra?: number
          user_id?: string | null
          user_session_id?: string
          verdict?: string
        }
        Relationships: []
      }
    }
    Views: {
      candidate_patches: {
        Row: {
          constellation: string | null
          dec: number | null
          flaggers: number | null
          flags: number | null
          last_at: string | null
          patch_id: string | null
          ra: number | null
          static_votes: number | null
          top_type: string | null
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          avatar_url: string | null
          confirmed: number | null
          correct_verifications: number | null
          display_name: string | null
          first_flags: number | null
          points: number | null
          reviews: number | null
          user_id: string | null
          verifications: number | null
        }
        Relationships: []
      }
      patch_verification: {
        Row: {
          constellation: string | null
          dec: number | null
          discoverer_id: string | null
          flagged_at: string | null
          no_votes: number | null
          patch_id: string | null
          ra: number | null
          status: string | null
          yes_votes: number | null
        }
        Relationships: []
      }
      swipe_stats: {
        Row: {
          anomalies_flagged: number | null
          patches_inspected: number | null
          total_swipes: number | null
          volunteers: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_guest_swipes: {
        Args: { _secret: string; _session: string }
        Returns: number
      }
      register_guest_session: {
        Args: { _secret: string; _session: string }
        Returns: boolean
      }
      rule_patch: {
        Args: { _patch: string; _ruling: string }
        Returns: undefined
      }
      session_seen_patches: {
        Args: { _secret: string; _session: string }
        Returns: string[]
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
  public: {
    Enums: {},
  },
} as const
