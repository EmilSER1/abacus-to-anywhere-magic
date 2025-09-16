import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoomConnectionWithDetails {
  connection_id: string;
  turar_room_id: string | null;
  turar_department: string | null;
  turar_room: string | null;
  projector_room_id: string | null;
  projector_department: string | null;
  projector_room: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomConnectionByIdRequest {
  turar_room_id: string;
  projector_room_id: string;
}

// Получение всех связей с полной информацией через ID
export const useRoomConnectionsById = () => {
  return useQuery({
    queryKey: ["room-connections-by-id"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_room_connections_with_details");

      if (error) {
        throw error;
      }

      return data as RoomConnectionWithDetails[];
    },
  });
};

// Получение связей для конкретного отделения Turar
export const useRoomConnectionsByTurarDepartment = (turarDepartment: string) => {
  return useQuery({
    queryKey: ["room-connections-by-turar-dept", turarDepartment],
    queryFn: async () => {
      if (!turarDepartment) return [];

      const { data, error } = await supabase
        .rpc("get_room_connections_with_details");

      if (error) {
        throw error;
      }

      return (data as RoomConnectionWithDetails[]).filter(
        connection => connection.turar_department === turarDepartment
      );
    },
    enabled: !!turarDepartment,
  });
};

// Получение связей для конкретной комнаты Turar
export const useRoomConnectionsByTurarRoom = (turarDepartment: string, turarRoom: string) => {
  return useQuery({
    queryKey: ["room-connections-by-turar-room", turarDepartment, turarRoom],
    queryFn: async () => {
      if (!turarDepartment || !turarRoom) return [];

      const { data, error } = await supabase
        .rpc("get_room_connections_with_details");

      if (error) {
        throw error;
      }

      return (data as RoomConnectionWithDetails[]).filter(
        connection => 
          connection.turar_department === turarDepartment && 
          connection.turar_room === turarRoom
      );
    },
    enabled: !!turarDepartment && !!turarRoom,
  });
};

// Создание новой связи по ID
export const useCreateRoomConnectionById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connection: CreateRoomConnectionByIdRequest) => {
      // Получаем информацию о комнатах для создания текстовых полей (для обратной совместимости)
      const [turarRoom, projectorRoom] = await Promise.all([
        supabase
          .from("turar_medical")
          .select("Отделение/Блок, Помещение/Кабинет")
          .eq("id", connection.turar_room_id)
          .single(),
        supabase
          .from("projector_floors")
          .select("ОТДЕЛЕНИЕ, НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ")
          .eq("id", connection.projector_room_id)
          .single()
      ]);

      if (turarRoom.error || projectorRoom.error) {
        throw new Error("Не удалось найти информацию о комнатах");
      }

      // Создаем запись связи
      const { data, error } = await supabase
        .from("room_connections")
        .insert([{
          turar_room_id: connection.turar_room_id,
          projector_room_id: connection.projector_room_id,
          // Текстовые поля для обратной совместимости
          turar_department: turarRoom.data["Отделение/Блок"],
          turar_room: turarRoom.data["Помещение/Кабинет"],
          projector_department: projectorRoom.data["ОТДЕЛЕНИЕ"],
          projector_room: projectorRoom.data["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-connections-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["room-connections-by-turar-dept"] });
      queryClient.invalidateQueries({ queryKey: ["room-connections-by-turar-room"] });
      queryClient.invalidateQueries({ queryKey: ["room-connections"] });
      queryClient.invalidateQueries({ queryKey: ["turar-medical"] });
      queryClient.invalidateQueries({ queryKey: ["projector-equipment"] });
    },
  });
};

// Удаление связи по ID
export const useDeleteRoomConnectionById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("room_connections")
        .delete()
        .eq("id", connectionId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-connections-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["room-connections-by-turar-dept"] });
      queryClient.invalidateQueries({ queryKey: ["room-connections-by-turar-room"] });
      queryClient.invalidateQueries({ queryKey: ["room-connections"] });
      queryClient.invalidateQueries({ queryKey: ["turar-medical"] });
      queryClient.invalidateQueries({ queryKey: ["projector-equipment"] });
    },
  });
};

// Поиск ID комнаты по названию отделения и комнаты
export const useFindRoomId = () => {
  return {
    findTurarRoomId: async (department: string, room: string): Promise<string | null> => {
      const { data, error } = await supabase
        .from("turar_medical")
        .select("id")
        .eq("Отделение/Блок", department)
        .eq("Помещение/Кабинет", room)
        .maybeSingle();

      if (error || !data) return null;
      return data.id;
    },

    findProjectorRoomId: async (department: string, room: string): Promise<string | null> => {
      const { data, error } = await supabase
        .from("projector_floors")
        .select("id")
        .eq("ОТДЕЛЕНИЕ", department)
        .eq("НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", room)
        .maybeSingle();

      if (error || !data) return null;
      return data.id;
    }
  };
};