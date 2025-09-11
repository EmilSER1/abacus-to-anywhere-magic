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
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      projector_floors: {
        Row: {
          connected_turar_department: string | null
          connected_turar_room: string | null
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
        Relationships: []
      }
      room_connections: {
        Row: {
          created_at: string
          id: string
          projector_department: string
          projector_room: string
          turar_department: string
          turar_room: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          projector_department: string
          projector_room: string
          turar_department: string
          turar_room: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          projector_department?: string
          projector_room?: string
          turar_department?: string
          turar_room?: string
          updated_at?: string
        }
        Relationships: []
      }
      turar_medical: {
        Row: {
          connected_projector_department: string | null
          connected_projector_room: string | null
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
          created_at?: string
          id?: string
          updated_at?: string
          "Код оборудования"?: string
          "Кол-во"?: number
          Наименование?: string
          "Отделение/Блок"?: string
          "Помещение/Кабинет"?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      sync_projector_room_connections: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
