import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TurarEquipment {
  id: string;
  equipment_code: string;
  equipment_name: string;
  quantity: number;
  room_name: string;
  department_name: string;
}

export interface ProjectorEquipment {
  id: string;
  equipment_code: string | null;
  equipment_name: string | null;
  equipment_unit: string | null;
  equipment_quantity: string | null;
  equipment_notes: string | null;
  room_name: string;
  department_name: string;
}

export const useTurarRoomEquipment = (roomId: string) => {
  return useQuery({
    queryKey: ["turar-room-equipment", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turar_medical")
        .select(`
          id,
          "Код оборудования",
          "Наименование",
          "Кол-во",
          "Помещение/Кабинет",
          "Отделение/Блок"
        `)
        .eq("room_id", roomId);

      if (error) {
        throw error;
      }

      return data?.map(item => ({
        id: item.id,
        equipment_code: item["Код оборудования"],
        equipment_name: item["Наименование"],
        quantity: item["Кол-во"],
        room_name: item["Помещение/Кабинет"],
        department_name: item["Отделение/Блок"]
      })) as TurarEquipment[] || [];
    },
    enabled: !!roomId,
  });
};

export const useProjectorRoomEquipment = (roomId: string) => {
  return useQuery({
    queryKey: ["projector-room-equipment", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projector_floors")
        .select(`
          id,
          "Код оборудования",
          "Наименование оборудования",
          "Ед. изм.",
          "Кол-во",
          "Примечания",
          "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ",
          "ОТДЕЛЕНИЕ"
        `)
        .eq("room_id", roomId);

      if (error) {
        throw error;
      }

      return data?.map(item => ({
        id: item.id,
        equipment_code: item["Код оборудования"],
        equipment_name: item["Наименование оборудования"],
        equipment_unit: item["Ед. изм."],
        equipment_quantity: item["Кол-во"],
        equipment_notes: item["Примечания"],
        room_name: item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"],
        department_name: item["ОТДЕЛЕНИЕ"]
      })) as ProjectorEquipment[] || [];
    },
    enabled: !!roomId,
  });
};