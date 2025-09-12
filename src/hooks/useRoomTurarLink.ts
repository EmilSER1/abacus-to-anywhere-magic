import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Связывание кабинета с кабинетом Турар
export const useLinkRoomToTurar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      departmentName, 
      roomName,
      turarRoom 
    }: { 
      departmentName: string; 
      roomName: string;
      turarRoom: string; 
    }) => {
      // Обновляем все записи projector_floors для данного кабинета
      const { data, error } = await supabase
        .from("projector_floors")
        .update({
          connected_turar_room: turarRoom,
          updated_at: new Date().toISOString()
        })
        .eq("ОТДЕЛЕНИЕ", departmentName)
        .eq("НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", roomName)
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
        description: "Кабинет связан с Турар",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось связать кабинет",
        variant: "destructive",
      });
    },
  });
};

// Удаление связи кабинета с Турар
export const useUnlinkRoomFromTurar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      departmentName, 
      roomName 
    }: { 
      departmentName: string; 
      roomName: string; 
    }) => {
      // Удаляем связь для всех записей данного кабинета
      const { data, error } = await supabase
        .from("projector_floors")
        .update({
          connected_turar_room: null,
          updated_at: new Date().toISOString()
        })
        .eq("ОТДЕЛЕНИЕ", departmentName)
        .eq("НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", roomName)
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
        description: "Связь кабинета с Турар удалена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить связь кабинета",
        variant: "destructive",
      });
    },
  });
};