import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RoomConnectionById {
  id: string;
  turar_department_id: string;
  turar_room_id: string;
  projector_department_id: string;
  projector_room_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomConnectionByIdRequest {
  turar_department_id: string;
  turar_room_id: string;
  projector_department_id: string;
  projector_room_id: string;
}

export const useRoomConnectionsById = () => {
  return useQuery({
    queryKey: ["room-connections-by-id"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_connections")
        .select(`
          id,
          turar_department_id,
          turar_room_id,
          projector_department_id,
          projector_room_id,
          created_at,
          updated_at
        `)
        .not("turar_department_id", "is", null)
        .not("turar_room_id", "is", null)
        .not("projector_department_id", "is", null)
        .not("projector_room_id", "is", null);

      if (error) {
        throw error;
      }

      return data as RoomConnectionById[];
    },
  });
};

export const useCreateRoomConnectionById = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (connection: CreateRoomConnectionByIdRequest) => {
      // Получаем названия для обратной совместимости
      const [turarDept, turarRoom, projectorDept, projectorRoom] = await Promise.all([
        supabase.from("departments").select("name").eq("id", connection.turar_department_id).single(),
        supabase.from("rooms").select("name").eq("id", connection.turar_room_id).single(),
        supabase.from("departments").select("name").eq("id", connection.projector_department_id).single(),
        supabase.from("rooms").select("name").eq("id", connection.projector_room_id).single()
      ]);

      if (turarDept.error || turarRoom.error || projectorDept.error || projectorRoom.error) {
        throw turarDept.error || turarRoom.error || projectorDept.error || projectorRoom.error;
      }

      // Создаем связь с ID и названиями
      const { data, error } = await supabase
        .from("room_connections")
        .insert([{
          turar_department: turarDept.data.name,
          turar_room: turarRoom.data.name,
          projector_department: projectorDept.data.name,
          projector_room: projectorRoom.data.name,
          turar_department_id: connection.turar_department_id,
          turar_room_id: connection.turar_room_id,
          projector_department_id: connection.projector_department_id,
          projector_room_id: connection.projector_room_id
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Обновляем основные таблицы с ID связей
      await Promise.all([
        supabase
          .from("projector_floors")
          .update({ connected_turar_room_id: connection.turar_room_id })
          .eq("room_id", connection.projector_room_id),
        supabase
          .from("turar_medical")
          .update({ connected_projector_room_id: connection.projector_room_id })
          .eq("room_id", connection.turar_room_id)
      ]);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-connections-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["room-connections"] });
      queryClient.invalidateQueries({ queryKey: ["turar-medical"] });
      queryClient.invalidateQueries({ queryKey: ["projector-equipment"] });
      toast({
        title: "Связь кабинетов создана",
        description: "Кабинеты успешно связаны",
      });
    },
  });
};

export const useDeleteRoomConnectionById = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Получаем детали связи перед удалением
      const { data: connection } = await supabase
        .from("room_connections")
        .select("*")
        .eq("id", id)
        .single();

      if (connection) {
        // Очищаем связи в основных таблицах по ID
        if (connection.projector_room_id && connection.turar_room_id) {
          await Promise.all([
            supabase
              .from("projector_floors")
              .update({ connected_turar_room_id: null })
              .eq("room_id", connection.projector_room_id),
            supabase
              .from("turar_medical")
              .update({ connected_projector_room_id: null })
              .eq("room_id", connection.turar_room_id)
          ]);
        }
      }

      // Удаляем запись связи
      const { error } = await supabase
        .from("room_connections")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-connections-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["room-connections"] });
      queryClient.invalidateQueries({ queryKey: ["turar-medical"] });
      queryClient.invalidateQueries({ queryKey: ["projector-equipment"] });
      toast({
        title: "Связь кабинетов удалена",
        description: "Связь между кабинетами удалена",
      });
    },
  });
};