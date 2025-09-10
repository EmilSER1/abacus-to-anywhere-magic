import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoomConnection {
  id: string;
  turar_department: string;
  turar_room: string;
  projector_department: string;
  projector_room: string;
  created_at: string;
  updated_at: string;
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
    mutationFn: async (connection: Omit<RoomConnection, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("room_connections")
        .insert([connection])
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
    },
  });
};