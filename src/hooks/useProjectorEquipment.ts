import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ProjectorEquipmentItem {
  id: string;
  "ОТДЕЛЕНИЕ": string;
  "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": string;
  "КОД ПОМЕЩЕНИЯ": string;
  "ЭТАЖ": number;
  "БЛОК": string;
  "Площадь (м2)"?: number;
  "Код оборудования"?: string;
  "Наименование оборудования"?: string;
  "Кол-во"?: string;
  "Ед. изм."?: string;
  "Примечания"?: string;
  equipment_status?: 'Согласовано' | 'Не согласовано' | 'Не найдено';
  equipment_specification?: string;
  equipment_documents?: string;
  created_at: string;
  updated_at: string;
}

// Получение оборудования для комнаты проектировщиков
export const useProjectorRoomEquipment = (department: string, roomName: string) => {
  return useQuery({
    queryKey: ["projector-room-equipment", department, roomName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projector_floors")
        .select("*")
        .eq("ОТДЕЛЕНИЕ", department)
        .eq("НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", roomName)
        .order("Наименование оборудования");

      if (error) {
        throw error;
      }

      return data as ProjectorEquipmentItem[];
    },
    enabled: !!department && !!roomName,
  });
};

// Обновление оборудования
export const useUpdateProjectorEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipment: ProjectorEquipmentItem) => {
      const { data, error } = await supabase
        .from("projector_floors")
        .update({
          "Код оборудования": equipment["Код оборудования"],
          "Наименование оборудования": equipment["Наименование оборудования"],
          "Кол-во": equipment["Кол-во"],
          "Ед. изм.": equipment["Ед. изм."],
          "Примечания": equipment["Примечания"],
          equipment_status: equipment.equipment_status,
          equipment_specification: equipment.equipment_specification,
          equipment_documents: equipment.equipment_documents,
        })
        .eq("id", equipment.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projector-room-equipment"] });
      queryClient.invalidateQueries({ queryKey: ["projector-equipment"] });
      toast({
        title: "Успешно",
        description: "Оборудование обновлено",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить оборудование",
        variant: "destructive",
      });
    },
  });
};

// Добавление нового оборудования
export const useAddProjectorEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipment: Omit<ProjectorEquipmentItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("projector_floors")
        .insert([equipment])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projector-room-equipment"] });
      queryClient.invalidateQueries({ queryKey: ["projector-equipment"] });
      toast({
        title: "Успешно",
        description: "Оборудование добавлено",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить оборудование",
        variant: "destructive",
      });
    },
  });
};