import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectorEquipment {
  id: string;
  code: string;
  name: string;
  quantity: number;
  department: string;
  room: string;
  floor: string;
  created_at: string;
  updated_at: string;
}

export const useProjectorData = () => {
  return useQuery({
    queryKey: ["projector-equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projector_equipment")
        .select("*")
        .order("floor, department, room, name");

      if (error) {
        throw error;
      }

      return data as ProjectorEquipment[];
    },
  });
};

export const useProjectorDataByFloor = () => {
  const { data: projectorData, ...rest } = useProjectorData();

  const organizedData = projectorData?.reduce((acc, item) => {
    if (!acc[item.floor]) {
      acc[item.floor] = {};
    }
    if (!acc[item.floor][item.department]) {
      acc[item.floor][item.department] = [];
    }
    acc[item.floor][item.department].push(item);
    return acc;
  }, {} as Record<string, Record<string, ProjectorEquipment[]>>);

  return {
    data: organizedData,
    rawData: projectorData,
    ...rest,
  };
};