import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoomConnection {
  id: string;
  turar_department: string;
  turar_room: string;
  projector_department: string;
  projector_room: string;
  projector_room_id: string | null;
  turar_room_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomConnectionRequest {
  turar_department: string;
  turar_room: string;
  projector_department: string;
  projector_room: string;
  projector_room_id?: string | null;
  turar_room_id?: string | null;
}

export const useRoomConnections = () => {
  return useQuery({
    queryKey: ["room-connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_connections")
        .select("*")
        .order("turar_department, turar_room");

      if (error) {
        throw error;
      }

      return data as RoomConnection[];
    },
  });
};

export const useCreateRoomConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connection: CreateRoomConnectionRequest) => {
      // Create connection record
      const { data, error } = await supabase
        .from("room_connections")
        .insert([connection])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update tables using ID-based relationships if IDs are provided
      if (connection.projector_room_id && connection.turar_room_id) {
        await Promise.all([
          supabase
            .from("projector_floors")
            .update({ connected_turar_room_id: connection.turar_room_id })
            .eq("id", connection.projector_room_id),
          supabase
            .from("turar_medical")
            .update({ connected_projector_room_id: connection.projector_room_id })
            .eq("id", connection.turar_room_id)
        ]);
      } else {
        // Fallback to string-based updates for backward compatibility
        await Promise.all([
          supabase
            .from("turar_medical")
            .update({
              connected_projector_department: connection.projector_department,
              connected_projector_room: connection.projector_room
            })
            .eq("Отделение/Блок", connection.turar_department)
            .eq("Помещение/Кабинет", connection.turar_room),
          supabase
            .from("projector_floors")
            .update({
              connected_turar_department: connection.turar_department,
              connected_turar_room: connection.turar_room
            })
            .eq("ОТДЕЛЕНИЕ", connection.projector_department)
            .eq("НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", connection.projector_room)
        ]);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-connections"] });
      queryClient.invalidateQueries({ queryKey: ["turar-medical"] });
      queryClient.invalidateQueries({ queryKey: ["projector-equipment"] });
    },
  });
};

export const useUpdateRoomConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RoomConnection> & { id: string }) => {
      const { data, error } = await supabase
        .from("room_connections")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-connections"] });
    },
  });
};

export const useDeleteRoomConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get connection details before deleting
      const { data: connection } = await supabase
        .from("room_connections")
        .select("*")
        .eq("id", id)
        .single();

      if (connection) {
        // Use ID-based cleanup if available
        if (connection.projector_room_id && connection.turar_room_id) {
          await Promise.all([
            supabase
              .from("projector_floors")
              .update({ connected_turar_room_id: null })
              .eq("id", connection.projector_room_id),
            supabase
              .from("turar_medical")
              .update({ connected_projector_room_id: null })
              .eq("id", connection.turar_room_id)
          ]);
        } else {
          // Fallback to string-based cleanup
          await Promise.all([
            supabase
              .from("turar_medical")
              .update({
                connected_projector_department: null,
                connected_projector_room: null
              })
              .eq("Отделение/Блок", connection.turar_department)
              .eq("Помещение/Кабинет", connection.turar_room),
            supabase
              .from("projector_floors")
              .update({
                connected_turar_department: null,
                connected_turar_room: null
              })
              .eq("ОТДЕЛЕНИЕ", connection.projector_department)
              .eq("НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", connection.projector_room)
          ]);
        }
      }

      // Delete the connection record
      const { error } = await supabase
        .from("room_connections")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-connections"] });
      queryClient.invalidateQueries({ queryKey: ["turar-medical"] });
      queryClient.invalidateQueries({ queryKey: ["projector-equipment"] });
    },
  });
};