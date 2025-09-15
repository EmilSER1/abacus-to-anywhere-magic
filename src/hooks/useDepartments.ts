import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Department {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  department_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface RoomWithDepartment extends Room {
  department: Department;
}

// Получение всех отделений
export const useDepartments = () => {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      return data as Department[];
    },
  });
};

// Получение всех кабинетов с информацией об отделениях
export const useRoomsWithDepartments = () => {
  return useQuery({
    queryKey: ["rooms-with-departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          department:departments(*)
        `)
        .order("name");

      if (error) {
        throw error;
      }

      return data as RoomWithDepartment[];
    },
  });
};

// Получение кабинетов для конкретного отделения
export const useRoomsByDepartment = (departmentId: string) => {
  return useQuery({
    queryKey: ["rooms-by-department", departmentId],
    queryFn: async () => {
      if (!departmentId) return [];
      
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("department_id", departmentId)
        .order("name");

      if (error) {
        throw error;
      }

      return data as Room[];
    },
    enabled: !!departmentId,
  });
};

// Создание нового отделения
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("departments")
        .insert([{ name }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};

// Создание нового кабинета
export const useCreateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ department_id, name }: { department_id: string; name: string }) => {
      const { data, error } = await supabase
        .from("rooms")
        .insert([{ department_id, name }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms-with-departments"] });
      queryClient.invalidateQueries({ queryKey: ["rooms-by-department"] });
    },
  });
};