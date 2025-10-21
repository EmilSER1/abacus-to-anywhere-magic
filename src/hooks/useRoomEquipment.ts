import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Equipment {
  id: string;
  room_id: string;
  equipment_code: string | null;
  equipment_name: string | null;
  model_name: string | null;
  equipment_code_required: string | null;
  equipment_type: 'МИ' | 'не МИ' | null;
  brand: string | null;
  country: string | null;
  specification: string | null;
  documents: any[];
  standard: string | null;
  quantity: string | null;
  unit: string | null;
  notes: string | null;
  // Technical specifications
  dimensions: string | null;
  humidity_temperature: string | null;
  voltage: string | null;
  frequency: string | null;
  power_watts: string | null;
  power_watts_peak: string | null;
  ups: string | null;
  floor_load: string | null;
  floor_load_heaviest: string | null;
  ceiling_load_heaviest: string | null;
  chiller: boolean | null;
  exhaust: string | null;
  drainage: string | null;
  hot_water: string | null;
  cold_water: string | null;
  distilled_water: string | null;
  neutralization_tank: string | null;
  data_requirements: string | null;
  emergency_buttons: string | null;
  xray_warning_lamps: string | null;
  raised_floor: string | null;
  ceiling_drops: string | null;
  precision_ac: boolean | null;
  medical_gas_o2: string | null;
  medical_gas_ma4: string | null;
  medical_gas_ma7: string | null;
  medical_gas_n2o: string | null;
  medical_gas_other: string | null;
  other_requirements: string | null;
  // Purchase information (admin/staff only)
  purchase_price: number | null;
  purchase_currency: string | null;
  price_updated_at: string | null;
  incoterms: string | null;
  supplier: string | null;
  supplier_status: string | null;
  supplier_contacts: any;
  created_at: string;
  updated_at: string;
}

// Получение оборудования для конкретной комнаты
export const useRoomEquipment = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ["room-equipment", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .eq("room_id", roomId)
        .order("equipment_name");

      if (error) throw error;
      return data as Equipment[];
    },
    enabled: !!roomId,
  });
};

// Добавление нового оборудования
export const useAddEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipment: Omit<Equipment, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("equipment")
        .insert([equipment])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["room-equipment", variables.room_id] });
      toast.success("Оборудование добавлено");
    },
    onError: (error) => {
      console.error("Error adding equipment:", error);
      toast.error("Ошибка при добавлении оборудования");
    },
  });
};

// Обновление оборудования
export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipment: Partial<Equipment> & { id: string; room_id: string }) => {
      const { data, error } = await supabase
        .from("equipment")
        .update(equipment)
        .eq("id", equipment.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["room-equipment", variables.room_id] });
      toast.success("Оборудование обновлено");
    },
    onError: (error) => {
      console.error("Error updating equipment:", error);
      toast.error("Ошибка при обновлении оборудования");
    },
  });
};

// Удаление оборудования
export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, room_id }: { id: string; room_id: string }) => {
      const { error } = await supabase
        .from("equipment")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["room-equipment", variables.room_id] });
      toast.success("Оборудование удалено");
    },
    onError: (error) => {
      console.error("Error deleting equipment:", error);
      toast.error("Ошибка при удалении оборудования");
    },
  });
};
