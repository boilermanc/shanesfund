export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'premium' | 'pro';
          subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due';
          stripe_customer_id: string | null;
          onboarding_completed: boolean;
          notification_preferences: Json;
          savings_goal: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'premium' | 'pro';
          subscription_status?: 'active' | 'inactive' | 'canceled' | 'past_due';
          stripe_customer_id?: string | null;
          onboarding_completed?: boolean;
          notification_preferences?: Json;
          savings_goal?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'premium' | 'pro';
          subscription_status?: 'active' | 'inactive' | 'canceled' | 'past_due';
          stripe_customer_id?: string | null;
          onboarding_completed?: boolean;
          notification_preferences?: Json;
          savings_goal?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pools: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          game_type: 'powerball' | 'mega_millions';
          captain_id: string;
          invite_code: string;
          is_private: boolean;
          contribution_amount: number;
          status: 'active' | 'archived' | 'completed';
          settings: Json;
          total_collected: number;
          total_winnings: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          game_type: 'powerball' | 'mega_millions';
          captain_id: string;
          invite_code?: string;
          is_private?: boolean;
          contribution_amount?: number;
          status?: 'active' | 'archived' | 'completed';
          settings?: Json;
          total_collected?: number;
          total_winnings?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          game_type?: 'powerball' | 'mega_millions';
          captain_id?: string;
          invite_code?: string;
          is_private?: boolean;
          contribution_amount?: number;
          status?: 'active' | 'archived' | 'completed';
          settings?: Json;
          total_collected?: number;
          total_winnings?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      pool_members: {
        Row: {
          id: string;
          pool_id: string;
          user_id: string;
          role: 'captain' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          pool_id: string;
          user_id: string;
          role?: 'captain' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: string;
          user_id?: string;
          role?: 'captain' | 'member';
          joined_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          pool_id: string;
          game_type: 'powerball' | 'mega_millions';
          numbers: number[];
          bonus_number: number;
          multiplier: number | null;
          draw_date: string;
          image_url: string | null;
          entered_by: string;
          entry_method: 'scan' | 'manual';
          checked: boolean;
          is_winner: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          pool_id: string;
          game_type: 'powerball' | 'mega_millions';
          numbers: number[];
          bonus_number: number;
          multiplier?: number | null;
          draw_date: string;
          image_url?: string | null;
          entered_by: string;
          entry_method: 'scan' | 'manual';
          checked?: boolean;
          is_winner?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: string;
          game_type?: 'powerball' | 'mega_millions';
          numbers?: number[];
          bonus_number?: number;
          multiplier?: number | null;
          draw_date?: string;
          image_url?: string | null;
          entered_by?: string;
          entry_method?: 'scan' | 'manual';
          checked?: boolean;
          is_winner?: boolean;
          created_at?: string;
        };
      };
      contributions: {
        Row: {
          id: string;
          pool_id: string;
          user_id: string;
          ticket_id: string | null;
          amount: number;
          paid: boolean;
          paid_at: string | null;
          draw_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          pool_id: string;
          user_id: string;
          ticket_id?: string | null;
          amount: number;
          paid?: boolean;
          paid_at?: string | null;
          draw_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: string;
          user_id?: string;
          ticket_id?: string | null;
          amount?: number;
          paid?: boolean;
          paid_at?: string | null;
          draw_date?: string;
          created_at?: string;
        };
      };
      winnings: {
        Row: {
          id: string;
          ticket_id: string;
          pool_id: string;
          prize_amount: number;
          prize_tier: 'jackpot' | 'match_5' | 'match_4_bonus' | 'match_4' | 'match_3_bonus' | 'match_3' | 'match_2_bonus' | 'match_1_bonus' | 'match_bonus';
          numbers_matched: number;
          bonus_matched: boolean;
          per_member_share: number | null;
          contributing_members: number | null;
          claimed: boolean;
          draw_date: string;
          detected_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          pool_id: string;
          prize_amount: number;
          prize_tier: 'jackpot' | 'match_5' | 'match_4_bonus' | 'match_4' | 'match_3_bonus' | 'match_3' | 'match_2_bonus' | 'match_1_bonus' | 'match_bonus';
          numbers_matched: number;
          bonus_matched?: boolean;
          per_member_share?: number | null;
          contributing_members?: number | null;
          claimed?: boolean;
          draw_date: string;
          detected_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          pool_id?: string;
          prize_amount?: number;
          prize_tier?: 'jackpot' | 'match_5' | 'match_4_bonus' | 'match_4' | 'match_3_bonus' | 'match_3' | 'match_2_bonus' | 'match_1_bonus' | 'match_bonus';
          numbers_matched?: number;
          bonus_matched?: boolean;
          per_member_share?: number | null;
          contributing_members?: number | null;
          claimed?: boolean;
          draw_date?: string;
          detected_at?: string;
        };
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          accepted_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'win' | 'invite' | 'payment' | 'reminder' | 'friend_request' | 'pool_update' | 'system';
          title: string;
          message: string;
          data: Json;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'win' | 'invite' | 'payment' | 'reminder' | 'friend_request' | 'pool_update' | 'system';
          title: string;
          message: string;
          data?: Json;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'win' | 'invite' | 'payment' | 'reminder' | 'friend_request' | 'pool_update' | 'system';
          title?: string;
          message?: string;
          data?: Json;
          read?: boolean;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          plan_tier: 'premium' | 'pro';
          billing_period: 'monthly' | 'annual';
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          plan_tier: 'premium' | 'pro';
          billing_period: 'monthly' | 'annual';
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string;
          stripe_price_id?: string;
          plan_tier?: 'premium' | 'pro';
          billing_period?: 'monthly' | 'annual';
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          referral_source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          referral_source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          referral_source?: string | null;
          created_at?: string;
        };
      };
      lottery_draws: {
        Row: {
          id: string;
          game_type: 'powerball' | 'mega_millions';
          draw_date: string;
          winning_numbers: number[];
          bonus_number: number;
          multiplier: number | null;
          jackpot_amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_type: 'powerball' | 'mega_millions';
          draw_date: string;
          winning_numbers: number[];
          bonus_number: number;
          multiplier?: number | null;
          jackpot_amount?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_type?: 'powerball' | 'mega_millions';
          draw_date?: string;
          winning_numbers?: number[];
          bonus_number?: number;
          multiplier?: number | null;
          jackpot_amount?: number | null;
          created_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string | null;
          pool_id: string | null;
          action: string;
          details: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          pool_id?: string | null;
          action: string;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          pool_id?: string | null;
          action?: string;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      api_logs: {
        Row: {
          id: string;
          api_connection_id: string | null;
          endpoint: string;
          method: string;
          request_body: Json;
          response_status: number | null;
          response_body: Json;
          response_time_ms: number | null;
          success: boolean;
          error_message: string | null;
          triggered_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          api_connection_id?: string | null;
          endpoint: string;
          method?: string;
          request_body?: Json;
          response_status?: number | null;
          response_body?: Json;
          response_time_ms?: number | null;
          success?: boolean;
          error_message?: string | null;
          triggered_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          api_connection_id?: string | null;
          endpoint?: string;
          method?: string;
          request_body?: Json;
          response_status?: number | null;
          response_body?: Json;
          response_time_ms?: number | null;
          success?: boolean;
          error_message?: string | null;
          triggered_by?: string | null;
          created_at?: string;
        };
      };
      api_connections: {
        Row: {
          id: string;
          name: string;
          provider: string;
          base_url: string;
          api_key: string;
          additional_config: Json;
          is_active: boolean;
          last_tested_at: string | null;
          last_test_success: boolean | null;
          last_test_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          provider: string;
          base_url: string;
          api_key: string;
          additional_config?: Json;
          is_active?: boolean;
          last_tested_at?: string | null;
          last_test_success?: boolean | null;
          last_test_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          provider?: string;
          base_url?: string;
          api_key?: string;
          additional_config?: Json;
          is_active?: boolean;
          last_tested_at?: string | null;
          last_test_success?: boolean | null;
          last_test_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          role: 'super_admin' | 'admin' | 'viewer';
          permissions: Json;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: 'super_admin' | 'admin' | 'viewer';
          permissions?: Json;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'super_admin' | 'admin' | 'viewer';
          permissions?: Json;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      email_templates: {
        Row: {
          id: string;
          name: string;
          subject: string;
          html_body: string;
          variables: string[];
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject: string;
          html_body: string;
          variables?: string[];
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject?: string;
          html_body?: string;
          variables?: string[];
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      email_logs: {
        Row: {
          id: string;
          template_id: string | null;
          template_name: string | null;
          to_email: string;
          from_email: string;
          subject: string;
          html_body: string;
          variables: Json;
          resend_message_id: string | null;
          status: 'pending' | 'sent' | 'failed';
          error_message: string | null;
          triggered_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id?: string | null;
          template_name?: string | null;
          to_email: string;
          from_email?: string;
          subject: string;
          html_body: string;
          variables?: Json;
          resend_message_id?: string | null;
          status?: 'pending' | 'sent' | 'failed';
          error_message?: string | null;
          triggered_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string | null;
          template_name?: string | null;
          to_email?: string;
          from_email?: string;
          subject?: string;
          html_body?: string;
          variables?: Json;
          resend_message_id?: string | null;
          status?: 'pending' | 'sent' | 'failed';
          error_message?: string | null;
          triggered_by?: string;
          created_at?: string;
        };
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          status: 'new' | 'read' | 'replied' | 'archived';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          status?: 'new' | 'read' | 'replied' | 'archived';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          subject?: string;
          message?: string;
          status?: 'new' | 'read' | 'replied' | 'archived';
          created_at?: string;
        };
      };
    };
  };
}
// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
// Convenience type aliases
export type User = Tables<'users'>;
export type Pool = Tables<'pools'>;
export type PoolMember = Tables<'pool_members'>;
export type Ticket = Tables<'tickets'>;
export type Contribution = Tables<'contributions'>;
export type Winning = Tables<'winnings'>;
export type Friend = Tables<'friends'>;
export type Notification = Tables<'notifications'>;
export type Subscription = Tables<'subscriptions'>;
export type WaitlistEntry = Tables<'waitlist'>;
export type LotteryDraw = Tables<'lottery_draws'>;
export type ActivityLog = Tables<'activity_log'>;
export type ApiLog = Tables<'api_logs'>;
export type ApiConnection = Tables<'api_connections'>;
export type AdminUser = Tables<'admin_users'>;
export type ContactMessage = Tables<'contact_messages'>;
export type EmailTemplate = Tables<'email_templates'>;
export type EmailLog = Tables<'email_logs'>;
