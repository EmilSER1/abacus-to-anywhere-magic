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
      equipment: {
        Row: {
          brand: string | null
          ceiling_drops: string | null
          ceiling_load_heaviest: string | null
          chiller: boolean | null
          cold_water: string | null
          country: string | null
          created_at: string
          data_requirements: string | null
          dimensions: string | null
          distilled_water: string | null
          documents: Json | null
          drainage: string | null
          emergency_buttons: string | null
          equipment_code: string | null
          equipment_code_required: string | null
          equipment_name: string | null
          equipment_type: string | null
          exhaust: string | null
          floor_load: string | null
          floor_load_heaviest: string | null
          frequency: string | null
          hot_water: string | null
          humidity_temperature: string | null
          id: string
          incoterms: string | null
          medical_gas_ma4: string | null
          medical_gas_ma7: string | null
          medical_gas_n2o: string | null
          medical_gas_o2: string | null
          medical_gas_other: string | null
          model_name: string | null
          neutralization_tank: string | null
          notes: string | null
          other_requirements: string | null
          power_watts: string | null
          power_watts_peak: string | null
          precision_ac: boolean | null
          price_updated_at: string | null
          purchase_currency: string | null
          purchase_price: number | null
          quantity: string | null
          raised_floor: string | null
          room_id: string | null
          specification: string | null
          standard: string | null
          supplier: string | null
          supplier_contacts: Json | null
          supplier_status: string | null
          unit: string | null
          updated_at: string
          ups: string | null
          voltage: string | null
          xray_warning_lamps: string | null
        }
        Insert: {
          brand?: string | null
          ceiling_drops?: string | null
          ceiling_load_heaviest?: string | null
          chiller?: boolean | null
          cold_water?: string | null
          country?: string | null
          created_at?: string
          data_requirements?: string | null
          dimensions?: string | null
          distilled_water?: string | null
          documents?: Json | null
          drainage?: string | null
          emergency_buttons?: string | null
          equipment_code?: string | null
          equipment_code_required?: string | null
          equipment_name?: string | null
          equipment_type?: string | null
          exhaust?: string | null
          floor_load?: string | null
          floor_load_heaviest?: string | null
          frequency?: string | null
          hot_water?: string | null
          humidity_temperature?: string | null
          id?: string
          incoterms?: string | null
          medical_gas_ma4?: string | null
          medical_gas_ma7?: string | null
          medical_gas_n2o?: string | null
          medical_gas_o2?: string | null
          medical_gas_other?: string | null
          model_name?: string | null
          neutralization_tank?: string | null
          notes?: string | null
          other_requirements?: string | null
          power_watts?: string | null
          power_watts_peak?: string | null
          precision_ac?: boolean | null
          price_updated_at?: string | null
          purchase_currency?: string | null
          purchase_price?: number | null
          quantity?: string | null
          raised_floor?: string | null
          room_id?: string | null
          specification?: string | null
          standard?: string | null
          supplier?: string | null
          supplier_contacts?: Json | null
          supplier_status?: string | null
          unit?: string | null
          updated_at?: string
          ups?: string | null
          voltage?: string | null
          xray_warning_lamps?: string | null
        }
        Update: {
          brand?: string | null
          ceiling_drops?: string | null
          ceiling_load_heaviest?: string | null
          chiller?: boolean | null
          cold_water?: string | null
          country?: string | null
          created_at?: string
          data_requirements?: string | null
          dimensions?: string | null
          distilled_water?: string | null
          documents?: Json | null
          drainage?: string | null
          emergency_buttons?: string | null
          equipment_code?: string | null
          equipment_code_required?: string | null
          equipment_name?: string | null
          equipment_type?: string | null
          exhaust?: string | null
          floor_load?: string | null
          floor_load_heaviest?: string | null
          frequency?: string | null
          hot_water?: string | null
          humidity_temperature?: string | null
          id?: string
          incoterms?: string | null
          medical_gas_ma4?: string | null
          medical_gas_ma7?: string | null
          medical_gas_n2o?: string | null
          medical_gas_o2?: string | null
          medical_gas_other?: string | null
          model_name?: string | null
          neutralization_tank?: string | null
          notes?: string | null
          other_requirements?: string | null
          power_watts?: string | null
          power_watts_peak?: string | null
          precision_ac?: boolean | null
          price_updated_at?: string | null
          purchase_currency?: string | null
          purchase_price?: number | null
          quantity?: string | null
          raised_floor?: string | null
          room_id?: string | null
          specification?: string | null
          standard?: string | null
          supplier?: string | null
          supplier_contacts?: Json | null
          supplier_status?: string | null
          unit?: string | null
          updated_at?: string
          ups?: string | null
          voltage?: string | null
          xray_warning_lamps?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "projector_floors"
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
          ЭТАЖ: string
        }
        Insert: {
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
          ЭТАЖ: string
        }
        Update: {
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
          ЭТАЖ?: string
        }
        Relationships: []
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
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_verified_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
