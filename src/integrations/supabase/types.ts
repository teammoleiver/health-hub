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
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          module_context?: string | null
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          module_context?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blood_test_records: {
        Row: {
          analyzed_at: string | null
          applied: boolean
          bmi: number | null
          created_at: string | null
          file_name: string | null
          id: string
          markers: Json
          pdf_storage_path: string | null
          recommendations: Json | null
          risk_factors: Json | null
          source: string
          summary: string | null
          test_date: string
          uploaded_at: string
          user_id: string | null
          weight_kg: number | null
        }
        Insert: {
          analyzed_at?: string | null
          applied?: boolean
          bmi?: number | null
          created_at?: string | null
          file_name?: string | null
          id?: string
          markers?: Json
          pdf_storage_path?: string | null
          recommendations?: Json | null
          risk_factors?: Json | null
          source?: string
          summary?: string | null
          test_date: string
          uploaded_at?: string
          user_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          analyzed_at?: string | null
          applied?: boolean
          bmi?: number | null
          created_at?: string | null
          file_name?: string | null
          id?: string
          markers?: Json
          pdf_storage_path?: string | null
          recommendations?: Json | null
          risk_factors?: Json | null
          source?: string
          summary?: string | null
          test_date?: string
          uploaded_at?: string
          user_id?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          color: string | null
          completed: boolean | null
          created_at: string | null
          description: string | null
          end_date: string | null
          event_date: string
          event_time: string | null
          event_type: string | null
          id: string
          is_all_day: boolean | null
          is_recurring: boolean | null
          linked_id: string | null
          linked_module: string | null
          recurring_pattern: string | null
          reminder_minutes: number | null
          title: string
          user_id: string
        }
        Insert: {
          color?: string | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          is_all_day?: boolean | null
          is_recurring?: boolean | null
          linked_id?: string | null
          linked_module?: string | null
          recurring_pattern?: string | null
          reminder_minutes?: number | null
          title: string
          user_id: string
        }
        Update: {
          color?: string | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          is_all_day?: boolean | null
          is_recurring?: boolean | null
          linked_id?: string | null
          linked_module?: string | null
          recurring_pattern?: string | null
          reminder_minutes?: number | null
          title?: string
          user_id?: string
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
          water_goal_met?: boolean | null
        }
        Relationships: []
      }
      daily_snapshots: {
        Row: {
          bmi: number | null
          checklist_completed: number
          checklist_pct: number
          checklist_total: number
          created_at: string
          exercise_calories: number | null
          exercise_done: boolean
          exercise_duration_min: number | null
          exercise_type: string | null
          fasting_completed: boolean
          fasting_hours: number | null
          health_score: number | null
          id: string
          meals_logged: number
          no_alcohol: boolean
          no_fried_food: boolean
          notes: string | null
          snapshot_date: string
          total_calories: number
          user_id: string | null
          water_glasses: number
          water_goal_met: boolean
          water_ml: number
          weight_kg: number | null
        }
        Insert: {
          bmi?: number | null
          checklist_completed?: number
          checklist_pct?: number
          checklist_total?: number
          created_at?: string
          exercise_calories?: number | null
          exercise_done?: boolean
          exercise_duration_min?: number | null
          exercise_type?: string | null
          fasting_completed?: boolean
          fasting_hours?: number | null
          health_score?: number | null
          id?: string
          meals_logged?: number
          no_alcohol?: boolean
          no_fried_food?: boolean
          notes?: string | null
          snapshot_date: string
          total_calories?: number
          user_id?: string | null
          water_glasses?: number
          water_goal_met?: boolean
          water_ml?: number
          weight_kg?: number | null
        }
        Update: {
          bmi?: number | null
          checklist_completed?: number
          checklist_pct?: number
          checklist_total?: number
          created_at?: string
          exercise_calories?: number | null
          exercise_done?: boolean
          exercise_duration_min?: number | null
          exercise_type?: string | null
          fasting_completed?: boolean
          fasting_hours?: number | null
          health_score?: number | null
          id?: string
          meals_logged?: number
          no_alcohol?: boolean
          no_fried_food?: boolean
          notes?: string | null
          snapshot_date?: string
          total_calories?: number
          user_id?: string | null
          water_glasses?: number
          water_goal_met?: boolean
          water_ml?: number
          weight_kg?: number | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      food_database: {
        Row: {
          carbs_g: number | null
          carbs_per_serving: number | null
          category: string
          created_at: string | null
          fat_g: number | null
          fat_per_serving: number | null
          fiber_g: number | null
          food_name: string
          id: string
          kcal_per_100g: number | null
          kcal_per_serving: number | null
          pcs_per_kg: string | null
          protein_g: number | null
          protein_per_serving: number | null
          serving_description: string | null
          serving_g: number | null
          source_menu: string | null
          sugar_g: number | null
        }
        Insert: {
          carbs_g?: number | null
          carbs_per_serving?: number | null
          category: string
          created_at?: string | null
          fat_g?: number | null
          fat_per_serving?: number | null
          fiber_g?: number | null
          food_name: string
          id?: string
          kcal_per_100g?: number | null
          kcal_per_serving?: number | null
          pcs_per_kg?: string | null
          protein_g?: number | null
          protein_per_serving?: number | null
          serving_description?: string | null
          serving_g?: number | null
          source_menu?: string | null
          sugar_g?: number | null
        }
        Update: {
          carbs_g?: number | null
          carbs_per_serving?: number | null
          category?: string
          created_at?: string | null
          fat_g?: number | null
          fat_per_serving?: number | null
          fiber_g?: number | null
          food_name?: string
          id?: string
          kcal_per_100g?: number | null
          kcal_per_serving?: number | null
          pcs_per_kg?: string | null
          protein_g?: number | null
          protein_per_serving?: number | null
          serving_description?: string | null
          serving_g?: number | null
          source_menu?: string | null
          sugar_g?: number | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      kanban_columns: {
        Row: {
          col_order: number | null
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          status_mapping: string | null
          title: string
          user_id: string
          wip_limit: number | null
        }
        Insert: {
          col_order?: number | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          status_mapping?: string | null
          title: string
          user_id: string
          wip_limit?: number | null
        }
        Update: {
          col_order?: number | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          status_mapping?: string | null
          title?: string
          user_id?: string
          wip_limit?: number | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string | null
          height_cm: number | null
          id: string
          name: string | null
          preferred_language: string | null
          starting_weight_kg: number | null
          target_weight_final_kg: number | null
          target_weight_m1_kg: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          name?: string | null
          preferred_language?: string | null
          starting_weight_kg?: number | null
          target_weight_final_kg?: number | null
          target_weight_m1_kg?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          name?: string | null
          preferred_language?: string | null
          starting_weight_kg?: number | null
          target_weight_final_kg?: number | null
          target_weight_m1_kg?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          area: string
          brainstorm_notes: string | null
          color: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          health_module_link: string | null
          horizon: string
          icon: string | null
          id: string
          is_stuck: boolean | null
          milestones: Json | null
          next_action_id: string | null
          notes: Json | null
          outcome_statement: string | null
          purpose: string | null
          start_date: string | null
          status: string
          success_criteria: string[] | null
          tags: string[] | null
          task_ids: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          area?: string
          brainstorm_notes?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          health_module_link?: string | null
          horizon?: string
          icon?: string | null
          id?: string
          is_stuck?: boolean | null
          milestones?: Json | null
          next_action_id?: string | null
          notes?: Json | null
          outcome_statement?: string | null
          purpose?: string | null
          start_date?: string | null
          status?: string
          success_criteria?: string[] | null
          tags?: string[] | null
          task_ids?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          area?: string
          brainstorm_notes?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          health_module_link?: string | null
          horizon?: string
          icon?: string | null
          id?: string
          is_stuck?: boolean | null
          milestones?: Json | null
          next_action_id?: string | null
          notes?: Json | null
          outcome_statement?: string | null
          purpose?: string | null
          start_date?: string | null
          status?: string
          success_criteria?: string[] | null
          tags?: string[] | null
          task_ids?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sleep_logs: {
        Row: {
          bedtime: string
          caffeine_after_2pm: boolean | null
          created_at: string | null
          date: string
          exercise_today: boolean | null
          id: string
          late_eating: boolean | null
          morning_feeling: number | null
          notes: string | null
          quality: number | null
          screen_before_bed: boolean | null
          stress_level: number | null
          total_hours: number
          user_id: string | null
          wake_time: string
          wake_ups: number | null
        }
        Insert: {
          bedtime: string
          caffeine_after_2pm?: boolean | null
          created_at?: string | null
          date: string
          exercise_today?: boolean | null
          id?: string
          late_eating?: boolean | null
          morning_feeling?: number | null
          notes?: string | null
          quality?: number | null
          screen_before_bed?: boolean | null
          stress_level?: number | null
          total_hours: number
          user_id?: string | null
          wake_time: string
          wake_ups?: number | null
        }
        Update: {
          bedtime?: string
          caffeine_after_2pm?: boolean | null
          created_at?: string | null
          date?: string
          exercise_today?: boolean | null
          id?: string
          late_eating?: boolean | null
          morning_feeling?: number | null
          notes?: string | null
          quality?: number | null
          screen_before_bed?: boolean | null
          stress_level?: number | null
          total_hours?: number
          user_id?: string | null
          wake_time?: string
          wake_ups?: number | null
        }
        Relationships: []
      }
      social_content_plan: {
        Row: {
          body: string | null
          created_at: string
          format: string | null
          framework: string | null
          hook: string
          id: string
          image_status: string | null
          image_url: string | null
          notes: string | null
          pillar: string | null
          position: number | null
          posted_at: string | null
          scheduled_date: string | null
          scheduled_day: string | null
          source_post_id: string | null
          source_topic_id: string | null
          status: string
          updated_at: string
          user_id: string
          week_number: number | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          format?: string | null
          framework?: string | null
          hook: string
          id?: string
          image_status?: string | null
          image_url?: string | null
          notes?: string | null
          pillar?: string | null
          position?: number | null
          posted_at?: string | null
          scheduled_date?: string | null
          scheduled_day?: string | null
          source_post_id?: string | null
          source_topic_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          week_number?: number | null
        }
        Update: {
          body?: string | null
          created_at?: string
          format?: string | null
          framework?: string | null
          hook?: string
          id?: string
          image_status?: string | null
          image_url?: string | null
          notes?: string | null
          pillar?: string | null
          position?: number | null
          posted_at?: string | null
          scheduled_date?: string | null
          scheduled_day?: string | null
          source_post_id?: string | null
          source_topic_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_content_plan_source_post_id_fkey"
            columns: ["source_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_content_plan_source_topic_id_fkey"
            columns: ["source_topic_id"]
            isOneToOne: false
            referencedRelation: "social_hot_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      social_generated_drafts: {
        Row: {
          body: string
          created_at: string
          framework: string
          id: string
          plan_id: string | null
          promoted: boolean | null
          rating: number | null
          source_post_id: string | null
          source_topic_id: string | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          body: string
          created_at?: string
          framework: string
          id?: string
          plan_id?: string | null
          promoted?: boolean | null
          rating?: number | null
          source_post_id?: string | null
          source_topic_id?: string | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          body?: string
          created_at?: string
          framework?: string
          id?: string
          plan_id?: string | null
          promoted?: boolean | null
          rating?: number | null
          source_post_id?: string | null
          source_topic_id?: string | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_generated_drafts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "social_content_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_generated_drafts_source_post_id_fkey"
            columns: ["source_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_generated_drafts_source_topic_id_fkey"
            columns: ["source_topic_id"]
            isOneToOne: false
            referencedRelation: "social_hot_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      social_hot_topics: {
        Row: {
          description: string | null
          generated_at: string
          id: string
          post_count: number | null
          profile_count: number | null
          related_post_ids: string[] | null
          score: number | null
          timeframe: string | null
          title: string
          user_id: string
        }
        Insert: {
          description?: string | null
          generated_at?: string
          id?: string
          post_count?: number | null
          profile_count?: number | null
          related_post_ids?: string[] | null
          score?: number | null
          timeframe?: string | null
          title: string
          user_id: string
        }
        Update: {
          description?: string | null
          generated_at?: string
          id?: string
          post_count?: number | null
          profile_count?: number | null
          related_post_ids?: string[] | null
          score?: number | null
          timeframe?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          author: string | null
          comments: number | null
          company: string | null
          external_id: string | null
          id: string
          likes: number | null
          post_text: string | null
          post_type: string | null
          post_url: string | null
          posted_at: string | null
          profile_id: string | null
          raw_payload: Json | null
          scraped_at: string
          shares: number | null
          user_id: string
          views: number | null
        }
        Insert: {
          author?: string | null
          comments?: number | null
          company?: string | null
          external_id?: string | null
          id?: string
          likes?: number | null
          post_text?: string | null
          post_type?: string | null
          post_url?: string | null
          posted_at?: string | null
          profile_id?: string | null
          raw_payload?: Json | null
          scraped_at?: string
          shares?: number | null
          user_id: string
          views?: number | null
        }
        Update: {
          author?: string | null
          comments?: number | null
          company?: string | null
          external_id?: string | null
          id?: string
          likes?: number | null
          post_text?: string | null
          post_type?: string | null
          post_url?: string | null
          posted_at?: string | null
          profile_id?: string | null
          raw_payload?: Json | null
          scraped_at?: string
          shares?: number | null
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "social_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_profiles: {
        Row: {
          active: boolean
          apify_actor_id: string | null
          company: string | null
          created_at: string
          display_name: string | null
          followers: number | null
          id: string
          info_summary: string | null
          last_scrape_error: string | null
          last_scrape_status: string | null
          last_scraped_at: string | null
          location: string | null
          notes: string | null
          profile_url: string
          scrape_cadence: string
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          active?: boolean
          apify_actor_id?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          followers?: number | null
          id?: string
          info_summary?: string | null
          last_scrape_error?: string | null
          last_scrape_status?: string | null
          last_scraped_at?: string | null
          location?: string | null
          notes?: string | null
          profile_url: string
          scrape_cadence?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          active?: boolean
          apify_actor_id?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          followers?: number | null
          id?: string
          info_summary?: string | null
          last_scrape_error?: string | null
          last_scrape_status?: string | null
          last_scraped_at?: string | null
          location?: string | null
          notes?: string | null
          profile_url?: string
          scrape_cadence?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      social_writer_settings: {
        Row: {
          anthropic_model: string | null
          banned_words: string[] | null
          created_at: string
          custom_system_prompt: string | null
          default_word_limit: number | null
          id: string
          lovable_model: string | null
          openai_model: string | null
          preferred_provider: string
          updated_at: string
          user_id: string
          voice_notes: string | null
        }
        Insert: {
          anthropic_model?: string | null
          banned_words?: string[] | null
          created_at?: string
          custom_system_prompt?: string | null
          default_word_limit?: number | null
          id?: string
          lovable_model?: string | null
          openai_model?: string | null
          preferred_provider?: string
          updated_at?: string
          user_id: string
          voice_notes?: string | null
        }
        Update: {
          anthropic_model?: string | null
          banned_words?: string[] | null
          created_at?: string
          custom_system_prompt?: string | null
          default_word_limit?: number | null
          id?: string
          lovable_model?: string | null
          openai_model?: string | null
          preferred_provider?: string
          updated_at?: string
          user_id?: string
          voice_notes?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          column_id: string
          completed_at: string | null
          contexts: string[] | null
          created_at: string | null
          description: string | null
          due_date: string | null
          energy_required: string | null
          estimated_minutes: number | null
          health_module_link: string | null
          id: string
          is_recurring: boolean | null
          is_two_minute_task: boolean | null
          notes: string | null
          priority: string | null
          project_id: string | null
          recurring_pattern: string | null
          status: string
          subtasks: Json | null
          tags: string[] | null
          task_order: number | null
          title: string
          user_id: string
          waiting_for: string | null
        }
        Insert: {
          column_id?: string
          completed_at?: string | null
          contexts?: string[] | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          energy_required?: string | null
          estimated_minutes?: number | null
          health_module_link?: string | null
          id?: string
          is_recurring?: boolean | null
          is_two_minute_task?: boolean | null
          notes?: string | null
          priority?: string | null
          project_id?: string | null
          recurring_pattern?: string | null
          status?: string
          subtasks?: Json | null
          tags?: string[] | null
          task_order?: number | null
          title: string
          user_id: string
          waiting_for?: string | null
        }
        Update: {
          column_id?: string
          completed_at?: string | null
          contexts?: string[] | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          energy_required?: string | null
          estimated_minutes?: number | null
          health_module_link?: string | null
          id?: string
          is_recurring?: boolean | null
          is_two_minute_task?: boolean | null
          notes?: string | null
          priority?: string | null
          project_id?: string | null
          recurring_pattern?: string | null
          status?: string
          subtasks?: Json | null
          tags?: string[] | null
          task_order?: number | null
          title?: string
          user_id?: string
          waiting_for?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          glasses: number
          id?: string
          logged_date?: string | null
          ml_total?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          glasses?: number
          id?: string
          logged_date?: string | null
          ml_total?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      weekly_menu_plans: {
        Row: {
          ai_analysis: Json | null
          created_at: string | null
          id: string
          plan_data: Json
          status: string | null
          updated_at: string | null
          user_id: string
          week_label: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string | null
          id?: string
          plan_data?: Json
          status?: string | null
          updated_at?: string | null
          user_id: string
          week_label?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string | null
          id?: string
          plan_data?: Json
          status?: string | null
          updated_at?: string | null
          user_id?: string
          week_label?: string | null
        }
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          id: string
          inbox_processed: number | null
          notes: string | null
          projects_reviewed: number | null
          reviewed_at: string | null
          tasks_reviewed: number | null
          user_id: string
        }
        Insert: {
          id?: string
          inbox_processed?: number | null
          notes?: string | null
          projects_reviewed?: number | null
          reviewed_at?: string | null
          tasks_reviewed?: number | null
          user_id: string
        }
        Update: {
          id?: string
          inbox_processed?: number | null
          notes?: string | null
          projects_reviewed?: number | null
          reviewed_at?: string | null
          tasks_reviewed?: number | null
          user_id?: string
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
          user_id: string | null
          waist_cm: number | null
          weight_kg: number
        }
        Insert: {
          bmi?: number | null
          body_fat_pct?: number | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          user_id?: string | null
          waist_cm?: number | null
          weight_kg: number
        }
        Update: {
          bmi?: number | null
          body_fat_pct?: number | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          user_id?: string | null
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
