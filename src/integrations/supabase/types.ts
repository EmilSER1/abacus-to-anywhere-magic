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
          projector_department_id: string | null
          turar_department: string
          turar_department_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          projector_department: string
          projector_department_id?: string | null
          turar_department: string
          turar_department_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          projector_department?: string
          projector_department_id?: string | null
          turar_department?: string
          turar_department_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_mappings_projector_department_id_fkey"
            columns: ["projector_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_mappings_turar_department_id_fkey"
            columns: ["turar_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      mapped_projector_rooms: {
        Row: {
          block_name: string
          created_at: string
          department_mapping_id: string
          department_name: string
          equipment_code: string | null
          equipment_name: string | null
          equipment_notes: string | null
          equipment_quantity: string | null
          equipment_unit: string | null
          floor_number: number
          id: string
          is_linked: boolean
          linked_turar_room_id: string | null
          original_record_id: string
          room_area: number | null
          room_code: string
          room_name: string
          updated_at: string
        }
        Insert: {
          block_name: string
          created_at?: string
          department_mapping_id: string
          department_name: string
          equipment_code?: string | null
          equipment_name?: string | null
          equipment_notes?: string | null
          equipment_quantity?: string | null
          equipment_unit?: string | null
          floor_number: number
          id?: string
          is_linked?: boolean
          linked_turar_room_id?: string | null
          original_record_id: string
          room_area?: number | null
          room_code: string
          room_name: string
          updated_at?: string
        }
        Update: {
          block_name?: string
          created_at?: string
          department_mapping_id?: string
          department_name?: string
          equipment_code?: string | null
          equipment_name?: string | null
          equipment_notes?: string | null
          equipment_quantity?: string | null
          equipment_unit?: string | null
          floor_number?: number
          id?: string
          is_linked?: boolean
          linked_turar_room_id?: string | null
          original_record_id?: string
          room_area?: number | null
          room_code?: string
          room_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_linked_turar_room"
            columns: ["linked_turar_room_id"]
            isOneToOne: false
            referencedRelation: "mapped_turar_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapped_projector_rooms_department_mapping_id_fkey"
            columns: ["department_mapping_id"]
            isOneToOne: false
            referencedRelation: "department_mappings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapped_projector_rooms_original_record_id_fkey"
            columns: ["original_record_id"]
            isOneToOne: false
            referencedRelation: "projector_floors"
            referencedColumns: ["id"]
          },
        ]
      }
      mapped_turar_rooms: {
        Row: {
          created_at: string
          department_mapping_id: string
          department_name: string
          equipment_code: string
          equipment_name: string
          equipment_quantity: number
          id: string
          is_linked: boolean
          linked_projector_room_id: string | null
          original_record_id: string
          room_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_mapping_id: string
          department_name: string
          equipment_code: string
          equipment_name: string
          equipment_quantity: number
          id?: string
          is_linked?: boolean
          linked_projector_room_id?: string | null
          original_record_id: string
          room_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_mapping_id?: string
          department_name?: string
          equipment_code?: string
          equipment_name?: string
          equipment_quantity?: number
          id?: string
          is_linked?: boolean
          linked_projector_room_id?: string | null
          original_record_id?: string
          room_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_linked_projector_room"
            columns: ["linked_projector_room_id"]
            isOneToOne: false
            referencedRelation: "mapped_projector_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapped_turar_rooms_department_mapping_id_fkey"
            columns: ["department_mapping_id"]
            isOneToOne: false
            referencedRelation: "department_mappings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapped_turar_rooms_original_record_id_fkey"
            columns: ["original_record_id"]
            isOneToOne: false
            referencedRelation: "turar_medical"
            referencedColumns: ["id"]
          },
        ]
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
          department_id: string | null
          id: string
          room_id: string | null
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
          department_id?: string | null
          id?: string
          room_id?: string | null
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
          department_id?: string | null
          id?: string
          room_id?: string | null
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
          {
            foreignKeyName: "projector_floors_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projector_floors_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
          projector_department_id: string | null
          projector_room: string
          projector_room_id: string | null
          projector_room_id_new: string | null
          turar_department: string
          turar_department_id: string | null
          turar_room: string
          turar_room_id: string | null
          turar_room_id_new: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          projector_department: string
          projector_department_id?: string | null
          projector_room: string
          projector_room_id?: string | null
          projector_room_id_new?: string | null
          turar_department: string
          turar_department_id?: string | null
          turar_room: string
          turar_room_id?: string | null
          turar_room_id_new?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          projector_department?: string
          projector_department_id?: string | null
          projector_room?: string
          projector_room_id?: string | null
          projector_room_id_new?: string | null
          turar_department?: string
          turar_department_id?: string | null
          turar_room?: string
          turar_room_id?: string | null
          turar_room_id_new?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_connections_projector_department_id_fkey"
            columns: ["projector_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_connections_projector_room_id_fkey"
            columns: ["projector_room_id"]
            isOneToOne: false
            referencedRelation: "projector_floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_connections_projector_room_id_new_fkey"
            columns: ["projector_room_id_new"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_connections_turar_department_id_fkey"
            columns: ["turar_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_connections_turar_room_id_fkey"
            columns: ["turar_room_id"]
            isOneToOne: false
            referencedRelation: "turar_medical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_connections_turar_room_id_new_fkey"
            columns: ["turar_room_id_new"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          department_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      turar_medical: {
        Row: {
          connected_projector_department: string | null
          connected_projector_room: string | null
          connected_projector_room_id: string | null
          created_at: string
          department_id: string | null
          id: string
          room_id: string | null
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
          department_id?: string | null
          id?: string
          room_id?: string | null
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
          department_id?: string | null
          id?: string
          room_id?: string | null
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
          {
            foreignKeyName: "turar_medical_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turar_medical_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
