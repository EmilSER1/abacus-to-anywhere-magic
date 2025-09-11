import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoomWithDepartmentById {
  id: string;
  name: string;
  department_id: string;
  department: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface GroupedRoomsByDepartment {
  [departmentId: string]: {
    departmentName: string;
    rooms: RoomWithDepartmentById[];
  };
}

export const useRoomsByDepartmentId = (departmentId: string) => {
  return useQuery({
    queryKey: ["rooms-by-department-id", departmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id,
          name,
          department_id,
          created_at,
          updated_at,
          department:departments(
            id,
            name
          )
        `)
        .eq("department_id", departmentId)
        .order("name");

      if (error) {
        throw error;
      }

      return data as RoomWithDepartmentById[];
    },
    enabled: !!departmentId,
  });
};

export const useGroupedRoomsByDepartment = () => {
  return useQuery({
    queryKey: ["grouped-rooms-by-department"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id,
          name,
          department_id,
          created_at,
          updated_at,
          department:departments(
            id,
            name
          )
        `)
        .order("department.name, name");

      if (error) {
        throw error;
      }

      const rooms = data as RoomWithDepartmentById[];
      const grouped: GroupedRoomsByDepartment = {};

      rooms.forEach(room => {
        if (!grouped[room.department_id]) {
          grouped[room.department_id] = {
            departmentName: room.department.name,
            rooms: []
          };
        }
        grouped[room.department_id].rooms.push(room);
      });

      return grouped;
    },
  });
};