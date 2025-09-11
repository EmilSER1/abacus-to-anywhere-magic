import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TurarRoomById {
  id: string;
  room_name: string;
  department_name: string;
  equipment_code: string;
  equipment_name: string;
  quantity: number;
}

export interface ProjectorRoomById {
  id: string;
  room_name: string;
  department_name: string;
  equipment_code: string | null;
  equipment_name: string | null;
  equipment_quantity: string | null;
}

export const useTurarRoomsByDepartmentId = (departmentId: string) => {
  return useQuery({
    queryKey: ["turar-rooms-by-department-id", departmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turar_medical")
        .select(`
          id,
          "Помещение/Кабинет",
          "Отделение/Блок",
          "Код оборудования",
          "Наименование",
          "Кол-во"
        `)
        .eq("department_id", departmentId)
        .order('"Помещение/Кабинет"');

      if (error) {
        throw error;
      }

      // Группируем по кабинетам
      const roomsMap = new Map<string, TurarRoomById>();
      
      data?.forEach(item => {
        const roomKey = item["Помещение/Кабинет"];
        if (!roomsMap.has(roomKey)) {
          roomsMap.set(roomKey, {
            id: item.id, // Используем ID записи из turar_medical
            room_name: item["Помещение/Кабинет"],
            department_name: item["Отделение/Блок"],
            equipment_code: item["Код оборудования"],
            equipment_name: item["Наименование"],
            quantity: item["Кол-во"]
          });
        }
      });

      return Array.from(roomsMap.values());
    },
    enabled: !!departmentId,
  });
};

export const useProjectorRoomsByDepartmentId = (departmentId: string) => {
  return useQuery({
    queryKey: ["projector-rooms-by-department-id", departmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projector_floors")
        .select(`
          id,
          "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ",
          "ОТДЕЛЕНИЕ",
          "Код оборудования",
          "Наименование оборудования",
          "Кол-во"
        `)
        .eq("department_id", departmentId)
        .order('"НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"');

      if (error) {
        throw error;
      }

      // Группируем по кабинетам
      const roomsMap = new Map<string, ProjectorRoomById>();
      
      data?.forEach(item => {
        const roomKey = item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"];
        if (!roomsMap.has(roomKey)) {
          roomsMap.set(roomKey, {
            id: item.id, // Используем ID записи из projector_floors
            room_name: item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"],
            department_name: item["ОТДЕЛЕНИЕ"],
            equipment_code: item["Код оборудования"],
            equipment_name: item["Наименование оборудования"],
            equipment_quantity: item["Кол-во"]
          });
        }
      });

      return Array.from(roomsMap.values());
    },
    enabled: !!departmentId,
  });
};