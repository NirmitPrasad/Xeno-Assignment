export type Channel = "whatsapp" | "sms" | "email" | "rcs";

export interface CallbackEvent {
  message_id: string;
  provider_message_id: string;
  channel: Channel;
  event: "sent" | "delivered" | "failed" | "opened" | "clicked" | "ordered" | "retry";
  at: string; // ISO timestamp
  metadata?: Record<string, any> | null;
}

export interface CampaignMessage {
  id: string;
  campaign_id: string | null;
  customer_id: string | null;
  channel: string | null;
  status: string;
  personalised_text: string | null;
  retry_count: number | null;
  created_at: string;
  sent_at: string | null;
  customers: { name: string; email: string } | null;
}

export interface EventDataRow {
  id: string;
  event_type: string;
  created_at: string;
  messages: {
    channel: string | null;
    customers: { name: string } | null;
    campaigns: { name: string } | null;
  } | null;
}
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      campaigns: {
        Row: {
          ai_insight: string | null;
          channel: string;
          created_at: string;
          created_by_ai: boolean;
          id: string;
          message_template: string | null;
          name: string;
          segment_description: string | null;
          segment_query: string | null;
          status: string;
          total_recipients: number;
        };
        Insert: {
          ai_insight?: string | null;
          channel: string;
          created_at?: string;
          created_by_ai?: boolean;
          id?: string;
          message_template?: string | null;
          name: string;
          segment_description?: string | null;
          segment_query?: string | null;
          status?: string;
          total_recipients?: number;
        };
        Update: {
          ai_insight?: string | null;
          channel?: string;
          created_at?: string;
          created_by_ai?: boolean;
          id?: string;
          message_template?: string | null;
          name?: string;
          segment_description?: string | null;
          segment_query?: string | null;
          status?: string;
          total_recipients?: number;
        };
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          city: string | null;
          created_at: string;
          email: string;
          id: string;
          last_order_date: string | null;
          name: string;
          phone: string | null;
          tags: string[] | null;
          total_orders: number;
          total_spent: number;
        };
        Insert: {
          city?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          last_order_date?: string | null;
          name: string;
          phone?: string | null;
          tags?: string[] | null;
          total_orders?: number;
          total_spent?: number;
        };
        Update: {
          city?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          last_order_date?: string | null;
          name?: string;
          phone?: string | null;
          tags?: string[] | null;
          total_orders?: number;
          total_spent?: number;
        };
        Relationships: [];
      };
      events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          message_id: string;
          metadata: Json | null;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          message_id: string;
          metadata?: Json | null;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          message_id?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      message_templates: {
        Row: {
          body: string;
          channel: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          body: string;
          channel: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          body?: string;
          channel?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          campaign_id: string;
          channel: string;
          clicked_at: string | null;
          created_at: string;
          customer_id: string;
          delivered_at: string | null;
          id: string;
          opened_at: string | null;
          personalised_text: string;
          retry_count: number;
          sent_at: string | null;
          status: string;
        };
        Insert: {
          campaign_id: string;
          channel: string;
          clicked_at?: string | null;
          created_at?: string;
          customer_id: string;
          delivered_at?: string | null;
          id?: string;
          opened_at?: string | null;
          personalised_text: string;
          retry_count?: number;
          sent_at?: string | null;
          status?: string;
        };
        Update: {
          campaign_id?: string;
          channel?: string;
          clicked_at?: string | null;
          created_at?: string;
          customer_id?: string;
          delivered_at?: string | null;
          id?: string;
          opened_at?: string | null;
          personalised_text?: string;
          retry_count?: number;
          sent_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter_subscribers: {
        Row: {
          created_at: string;
          email: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          created_at: string;
          customer_id: string;
          id: string;
          items: Json;
          status: string;
          total: number;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          id?: string;
          items: Json;
          status?: string;
          total: number;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          id?: string;
          items?: Json;
          status?: string;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          name: string;
          price: number;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          name: string;
          price: number;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          name?: string;
          price?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      exec_sql_select: { Args: { q: string }; Returns: Json[] };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
