/**
 * 数据库类型定义
 * 
 * 这个文件应该通过 Supabase CLI 自动生成：
 * supabase gen types typescript --local > src/lib/db/types.ts
 * 
 * 或者从远程项目生成：
 * supabase gen types typescript --project-id your-project-id > src/lib/db/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  next_auth: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          email: string
          email_verified: string | null
          image: string | null
          username: string | null
          level: number
          xp: number
          streak_days: number
          completed_tasks: number
          hours_focused: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          email: string
          email_verified?: string | null
          image?: string | null
          username?: string | null
          level?: number
          xp?: number
          streak_days?: number
          completed_tasks?: number
          hours_focused?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          email_verified?: string | null
          image?: string | null
          username?: string | null
          level?: number
          xp?: number
          streak_days?: number
          completed_tasks?: number
          hours_focused?: number
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          expires: string
          session_token: string
          user_id: string
        }
        Insert: {
          id?: string
          expires: string
          session_token: string
          user_id: string
        }
        Update: {
          id?: string
          expires?: string
          session_token?: string
          user_id?: string
        }
      }
      accounts: {
        Row: {
          id: string
          type: string
          provider: string
          provider_account_id: string
          refresh_token: string | null
          access_token: string | null
          expires_at: number | null
          token_type: string | null
          scope: string | null
          id_token: string | null
          session_state: string | null
          oauth_token_secret: string | null
          oauth_token: string | null
          user_id: string
        }
        Insert: {
          id?: string
          type: string
          provider: string
          provider_account_id: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
          oauth_token_secret?: string | null
          oauth_token?: string | null
          user_id: string
        }
        Update: {
          id?: string
          type?: string
          provider?: string
          provider_account_id?: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
          oauth_token_secret?: string | null
          oauth_token?: string | null
          user_id?: string
        }
      }
      verification_tokens: {
        Row: {
          identifier: string
          token: string
          expires: string
        }
        Insert: {
          identifier: string
          token: string
          expires: string
        }
        Update: {
          identifier?: string
          token?: string
          expires?: string
        }
      }
    }
    Views: {}
    Functions: {
      uid: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {}
  }
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: 'light' | 'dark' | 'matrix'
          api_provider: 'deepseek' | 'qwen' | 'doubao' | 'openai'
          provider_settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: 'light' | 'dark' | 'matrix'
          api_provider?: 'deepseek' | 'qwen' | 'doubao' | 'openai'
          provider_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: 'light' | 'dark' | 'matrix'
          api_provider?: 'deepseek' | 'qwen' | 'doubao' | 'openai'
          provider_settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          persona_id: string
          tags: string[]
          system_prompt_override: string | null
          model_params: Json
          order_index: number
          custom_persona: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          persona_id: string
          tags?: string[]
          system_prompt_override?: string | null
          model_params?: Json
          order_index?: number
          custom_persona?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          persona_id?: string
          tags?: string[]
          system_prompt_override?: string | null
          model_params?: Json
          order_index?: number
          custom_persona?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'model' | 'system'
          content: string
          is_thinking: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'model' | 'system'
          content: string
          is_thinking?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'model' | 'system'
          content?: string
          is_thinking?: boolean
          created_at?: string
        }
      }
      custom_personas: {
        Row: {
          id: string
          user_id: string
          name: string
          role: string
          avatar: string
          description: string
          system_prompt: string
          greeting: string | null
          avatar_image: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          role: string
          avatar: string
          description: string
          system_prompt: string
          greeting?: string | null
          avatar_image?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          role?: string
          avatar?: string
          description?: string
          system_prompt?: string
          greeting?: string | null
          avatar_image?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      learning_plans: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: 'pending' | 'in-progress' | 'completed'
          category: 'frontend' | 'backend' | 'algorithm' | 'soft-skills'
          progress: number
          start_date: string
          end_date: string
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          status?: 'pending' | 'in-progress' | 'completed'
          category: 'frontend' | 'backend' | 'algorithm' | 'soft-skills'
          progress?: number
          start_date: string
          end_date: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'in-progress' | 'completed'
          category?: 'frontend' | 'backend' | 'algorithm' | 'soft-skills'
          progress?: number
          start_date?: string
          end_date?: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      interview_questions: {
        Row: {
          id: string
          user_id: string
          category: string
          title: string
          description: string | null
          difficulty: 'Easy' | 'Medium' | 'Hard'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          title: string
          description?: string | null
          difficulty: 'Easy' | 'Medium' | 'Hard'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          title?: string
          description?: string | null
          difficulty?: 'Easy' | 'Medium' | 'Hard'
          created_at?: string
          updated_at?: string
        }
      }
      mistake_records: {
        Row: {
          id: string
          user_id: string
          question_id: string
          ai_analysis: string | null
          review_count: number
          added_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          ai_analysis?: string | null
          review_count?: number
          added_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          ai_analysis?: string | null
          review_count?: number
          added_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      nav_items: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          url: string
          icon_url: string | null
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          url: string
          icon_url?: string | null
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          url?: string
          icon_url?: string | null
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          achievement_name: string
          achievement_icon: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          achievement_name: string
          achievement_icon: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          achievement_name?: string
          achievement_icon?: string
          unlocked_at?: string
        }
      }
      focus_trends: {
        Row: {
          id: string
          user_id: string
          date: string
          day_name: string
          focus_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          day_name: string
          focus_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          day_name?: string
          focus_hours?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      user_statistics: {
        Row: {
          user_id: string
          username: string | null
          level: number
          xp: number
          streak_days: number
          completed_tasks: number
          hours_focused: number
          total_sessions: number
          total_messages: number
          total_plans: number
          completed_plans: number
          unlocked_achievements: number
        }
      }
    }
    Functions: {}
    Enums: {}
  }
}
