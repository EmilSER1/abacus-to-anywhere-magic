import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TurarEquipment {
  id: string;
  code: string;
  name: string;
  quantity: number;
  department: string;
  room: string;
  created_at: string;
  updated_at: string;
}

export const useTurarData = () => {
  return useQuery({
    queryKey: ["turar-equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turar_equipment")
        .select("*")
        .order("department, room, name");

      if (error) {
        throw error;
      }

      return data as TurarEquipment[];
    },
  });
};

export const useTurarDataByDepartment = () => {
  const { data: turarData, ...rest } = useTurarData();

  const organizedData = turarData?.reduce((acc, item) => {
    if (!acc[item.department]) {
      acc[item.department] = [];
    }
    acc[item.department].push(item);
    return acc;
  }, {} as Record<string, TurarEquipment[]>);

  return {
    data: organizedData,
    rawData: turarData,
    ...rest,
  };
};