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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      department_mappings: {
        Row: {
          created_at: string
          id: string
          projector_department: string
          turar_department: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          projector_department: string
          turar_department: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          projector_department?: string
          turar_department?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      projector_floors: {
        Row: {
          connected_turar_department: string | null
          connected_turar_room: string | null
          connected_turar_room_id: string | null
          created_at: string
          id: string
          updated_at: string
          БЛОК: string
          "Ед. изм.": string | null
          "Код оборудования": string | null
          "Код помещения": string | null
          "КОД ПОМЕЩЕНИЯ": string
          "Кол-во": string | null
          "Наименование оборудования": string | null
          "Наименование помещения": string | null
          "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": string
          ОТДЕЛЕНИЕ: string
          "Площадь (м2)": number | null
          Примечания: string | null
          ЭТАЖ: number
        }
        Insert: {
          connected_turar_department?: string | null
          connected_turar_room?: string | null
          connected_turar_room_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          БЛОК: string
          "Ед. изм."?: string | null
          "Код оборудования"?: string | null
          "Код помещения"?: string | null
          "КОД ПОМЕЩЕНИЯ": string
          "Кол-во"?: string | null
          "Наименование оборудования"?: string | null
          "Наименование помещения"?: string | null
          "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": string
          ОТДЕЛЕНИЕ: string
          "Площадь (м2)"?: number | null
          Примечания?: string | null
          ЭТАЖ: number
        }
        Update: {
          connected_turar_department?: string | null
          connected_turar_room?: string | null
          connected_turar_room_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          БЛОК?: string
          "Ед. изм."?: string | null
          "Код оборудования"?: string | null
          "Код помещения"?: string | null
          "КОД ПОМЕЩЕНИЯ"?: string
          "Кол-во"?: string | null
          "Наименование оборудования"?: string | null
          "Наименование помещения"?: string | null
          "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"?: string
          ОТДЕЛЕНИЕ?: string
          "Площадь (м2)"?: number | null
          Примечания?: string | null
          ЭТАЖ?: number
        }
        Relationships: [
          {
            foreignKeyName: "projector_floors_connected_turar_room_id_fkey"
            columns: ["connected_turar_room_id"]
            isOneToOne: false
            referencedRelation: "turar_medical"
            referencedColumns: ["id"]
          },
        ]
      }
      role_change_audit: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_role: Database["public"]["Enums"]["user_role"] | null
          old_role: Database["public"]["Enums"]["user_role"] | null
          target_user: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_role?: Database["public"]["Enums"]["user_role"] | null
          old_role?: Database["public"]["Enums"]["user_role"] | null
          target_user?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_role?: Database["public"]["Enums"]["user_role"] | null
          old_role?: Database["public"]["Enums"]["user_role"] | null
          target_user?: string | null
        }
        Relationships: []
      }
      room_connections: {
        Row: {
          created_at: string
          id: string
          projector_department: string
          projector_room: string
          projector_room_id: string | null
          turar_department: string
          turar_room: string
          turar_room_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          projector_department: string
          projector_room: string
          projector_room_id?: string | null
          turar_department: string
          turar_room: string
          turar_room_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          projector_department?: string
          projector_room?: string
          projector_room_id?: string | null
          turar_department?: string
          turar_room?: string
          turar_room_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      turar_medical: {
        Row: {
          connected_projector_department: string | null
          connected_projector_room: string | null
          connected_projector_room_id: string | null
          created_at: string
          id: string
          updated_at: string
          "Код оборудования": string
          "Кол-во": number
          Наименование: string
          "Отделение/Блок": string
          "Помещение/Кабинет": string
        }
        Insert: {
          connected_projector_department?: string | null
          connected_projector_room?: string | null
          connected_projector_room_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          "Код оборудования": string
          "Кол-во": number
          Наименование: string
          "Отделение/Блок": string
          "Помещение/Кабинет": string
        }
        Update: {
          connected_projector_department?: string | null
          connected_projector_room?: string | null
          connected_projector_room_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          "Код оборудования"?: string
          "Кол-во"?: number
          Наименование?: string
          "Отделение/Блок"?: string
          "Помещение/Кабинет"?: string
        }
        Relationships: [
          {
            foreignKeyName: "turar_medical_connected_projector_room_id_fkey"
            columns: ["connected_projector_room_id"]
            isOneToOne: false
            referencedRelation: "projector_floors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_room_connections_with_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          connection_id: string
          created_at: string
          projector_department: string
          projector_room: string
          projector_room_id: string
          turar_department: string
          turar_room: string
          turar_room_id: string
          updated_at: string
        }[]
      }
      get_unique_projector_departments: {
        Args: Record<PropertyKey, never>
        Returns: {
          department_name: string
        }[]
      }
      get_unique_turar_departments: {
        Args: Record<PropertyKey, never>
        Returns: {
          department_name: string
        }[]
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_verified_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      sync_projector_room_connections: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_role_secure: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          target_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "staff" | "user" | "none"
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
      user_role: ["admin", "staff", "user", "none"],
    },
  },
} as const
