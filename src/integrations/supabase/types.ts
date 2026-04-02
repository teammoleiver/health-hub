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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_chat_history: {
        Row: {
          content: string
          created_at: string | null
          id: string
          module_context: string | null
          role: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          module_context?: string | null
          role: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          module_context?: string | null
          role?: string
        }
        Relationships: []
      }
      daily_checklist: {
        Row: {
          bedtime_ok: boolean | null
          checklist_date: string | null
          exercise_done: boolean | null
          fast_day_calories_ok: boolean | null
          healthy_breakfast: boolean | null
          id: string
          if_16_8_completed: boolean | null
          is_52_fast_day: boolean | null
          no_alcohol: boolean | null
          no_fried_food: boolean | null
          notes: string | null
          sunlight_done: boolean | null
          updated_at: string | null
          water_goal_met: boolean | null
        }
        Insert: {
          bedtime_ok?: boolean | null
          checklist_date?: string | null
          exercise_done?: boolean | null
          fast_day_calories_ok?: boolean | null
          healthy_breakfast?: boolean | null
          id?: string
          if_16_8_completed?: boolean | null
          is_52_fast_day?: boolean | null
          no_alcohol?: boolean | null
          no_fried_food?: boolean | null
          notes?: string | null
          sunlight_done?: boolean | null
          updated_at?: string | null
          water_goal_met?: boolean | null
        }
        Update: {
          bedtime_ok?: boolean | null
          checklist_date?: string | null
          exercise_done?: boolean | null
          fast_day_calories_ok?: boolean | null
          healthy_breakfast?: boolean | null
          id?: string
          if_16_8_completed?: boolean | null
          is_52_fast_day?: boolean | null
          no_alcohol?: boolean | null
          no_fried_food?: boolean | null
          notes?: string | null
          sunlight_done?: boolean | null
          updated_at?: string | null
          water_goal_met?: boolean | null
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          calories: number | null
          distance_km: number | null
          duration_min: number | null
          exercise_type: string
          heart_rate_avg: number | null
          id: string
          is_training_day: boolean | null
          logged_at: string | null
          notes: string | null
          speed_kmh: number | null
        }
        Insert: {
          calories?: number | null
          distance_km?: number | null
          duration_min?: number | null
          exercise_type: string
          heart_rate_avg?: number | null
          id?: string
          is_training_day?: boolean | null
          logged_at?: string | null
          notes?: string | null
          speed_kmh?: number | null
        }
        Update: {
          calories?: number | null
          distance_km?: number | null
          duration_min?: number | null
          exercise_type?: string
          heart_rate_avg?: number | null
          id?: string
          is_training_day?: boolean | null
          logged_at?: string | null
          notes?: string | null
          speed_kmh?: number | null
        }
        Relationships: []
      }
      fasting_52_schedule: {
        Row: {
          created_at: string | null
          fast_day_1: string | null
          fast_day_1_calories: number | null
          fast_day_1_completed: boolean | null
          fast_day_2: string | null
          fast_day_2_calories: number | null
          fast_day_2_completed: boolean | null
          id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string | null
          fast_day_1?: string | null
          fast_day_1_calories?: number | null
          fast_day_1_completed?: boolean | null
          fast_day_2?: string | null
          fast_day_2_calories?: number | null
          fast_day_2_completed?: boolean | null
          id?: string
          week_start_date: string
        }
        Update: {
          created_at?: string | null
          fast_day_1?: string | null
          fast_day_1_calories?: number | null
          fast_day_1_completed?: boolean | null
          fast_day_2?: string | null
          fast_day_2_calories?: number | null
          fast_day_2_completed?: boolean | null
          id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      fasting_logs: {
        Row: {
          actual_hours: number | null
          calories_on_fast_day: number | null
          completed: boolean | null
          fast_end: string | null
          fast_start: string | null
          fast_type: string | null
          id: string
          logged_date: string | null
          notes: string | null
          target_hours: number | null
        }
        Insert: {
          actual_hours?: number | null
          calories_on_fast_day?: number | null
          completed?: boolean | null
          fast_end?: string | null
          fast_start?: string | null
          fast_type?: string | null
          id?: string
          logged_date?: string | null
          notes?: string | null
          target_hours?: number | null
        }
        Update: {
          actual_hours?: number | null
          calories_on_fast_day?: number | null
          completed?: boolean | null
          fast_end?: string | null
          fast_start?: string | null
          fast_type?: string | null
          id?: string
          logged_date?: string | null
          notes?: string | null
          target_hours?: number | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          achieved: boolean | null
          achieved_at: string | null
          created_at: string | null
          current_value: number | null
          goal_type: string
          id: string
          notes: string | null
          target_date: string | null
          target_value: number | null
          unit: string | null
        }
        Insert: {
          achieved?: boolean | null
          achieved_at?: string | null
          created_at?: string | null
          current_value?: number | null
          goal_type: string
          id?: string
          notes?: string | null
          target_date?: string | null
          target_value?: number | null
          unit?: string | null
        }
        Update: {
          achieved?: boolean | null
          achieved_at?: string | null
          created_at?: string | null
          current_value?: number | null
          goal_type?: string
          id?: string
          notes?: string | null
          target_date?: string | null
          target_value?: number | null
          unit?: string | null
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          calories: number | null
          carbs_g: number | null
          fast_day_running_calories: number | null
          fat_g: number | null
          food_name: string
          id: string
          is_fast_day_meal: boolean | null
          is_healthy: boolean | null
          liver_score: number | null
          logged_at: string | null
          meal_type: string
          protein_g: number | null
          quality: string | null
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          fast_day_running_calories?: number | null
          fat_g?: number | null
          food_name: string
          id?: string
          is_fast_day_meal?: boolean | null
          is_healthy?: boolean | null
          liver_score?: number | null
          logged_at?: string | null
          meal_type: string
          protein_g?: number | null
          quality?: string | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          fast_day_running_calories?: number | null
          fat_g?: number | null
          food_name?: string
          id?: string
          is_fast_day_meal?: boolean | null
          is_healthy?: boolean | null
          liver_score?: number | null
          logged_at?: string | null
          meal_type?: string
          protein_g?: number | null
          quality?: string | null
        }
        Relationships: []
      }
      user_profile: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          fasting_52_enabled: boolean | null
          fasting_52_start_date: string | null
          full_name: string | null
          height_cm: number | null
          id: string
          name: string | null
          openai_api_key: string | null
          preferred_language: string | null
          starting_weight_kg: number | null
          target_weight_final_kg: number | null
          target_weight_m1_kg: number | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          fasting_52_enabled?: boolean | null
          fasting_52_start_date?: string | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          name?: string | null
          openai_api_key?: string | null
          preferred_language?: string | null
          starting_weight_kg?: number | null
          target_weight_final_kg?: number | null
          target_weight_m1_kg?: number | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          fasting_52_enabled?: boolean | null
          fasting_52_start_date?: string | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          name?: string | null
          openai_api_key?: string | null
          preferred_language?: string | null
          starting_weight_kg?: number | null
          target_weight_final_kg?: number | null
          target_weight_m1_kg?: number | null
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          created_at: string | null
          glasses: number
          id: string
          logged_date: string | null
          ml_total: number | null
        }
        Insert: {
          created_at?: string | null
          glasses: number
          id?: string
          logged_date?: string | null
          ml_total?: number | null
        }
        Update: {
          created_at?: string | null
          glasses?: number
          id?: string
          logged_date?: string | null
          ml_total?: number | null
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          bmi: number | null
          body_fat_pct: number | null
          id: string
          logged_at: string | null
          notes: string | null
          waist_cm: number | null
          weight_kg: number
        }
        Insert: {
          bmi?: number | null
          body_fat_pct?: number | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          waist_cm?: number | null
          weight_kg: number
        }
        Update: {
          bmi?: number | null
          body_fat_pct?: number | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          waist_cm?: number | null
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
