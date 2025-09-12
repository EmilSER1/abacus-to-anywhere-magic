import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Обновление связи отделения с Турар
export const useLinkDepartmentToTurar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      departmentName, 
      turarDepartment 
    }: { 
      departmentName: string; 
      turarDepartment: string; 
    }) => {
      // Обновляем все записи projector_floors для данного отделения
      const { data, error } = await supabase
        .from("projector_floors")
        .update({
          connected_turar_department: turarDepartment,
          // Explicitly clear room connections when linking departments
          connected_turar_room: null,
          connected_turar_room_id: null,
          updated_at: new Date().toISOString()
        })
        .eq("ОТДЕЛЕНИЕ", departmentName)
        .select();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors-data"] });
      queryClient.invalidateQueries({ queryKey: ["projector-equipment"] });
      toast({
        title: "Успешно",
        description: "Отделение связано с Турар",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось связать отделение",
        variant: "destructive",
      });
    },
  });
};

// Удаление связи отделения с Турар
export const useUnlinkDepartmentFromTurar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (departmentName: string) => {
      // Удаляем связь для всех записей данного отделения
      const { data, error } = await supabase
        .from("projector_floors")
        .update({
          connected_turar_department: null,
          connected_turar_room: null,
          connected_turar_room_id: null,
          updated_at: new Date().toISOString()
        })
        .eq("ОТДЕЛЕНИЕ", departmentName)
        .select();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors-data"] });
      queryClient.invalidateQueries({ queryKey: ["projector-equipment"] });
      toast({
        title: "Успешно",
        description: "Связь с Турар удалена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить связь",
        variant: "destructive",
      });
    },
  });
};