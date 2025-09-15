import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectorEquipment {
  id: string;
  "Код оборудования"?: string;
  "Наименование оборудования"?: string;
  "Кол-во"?: string;
  "ОТДЕЛЕНИЕ": string;
  "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": string;
  "ЭТАЖ": number;
  "БЛОК": string;
  "КОД ПОМЕЩЕНИЯ": string;
  "Код помещения"?: string;
  "Наименование помещения"?: string;
  "Площадь (м2)"?: number;
  "Ед. изм."?: string;
  "Примечания"?: string;
  connected_turar_department?: string;
  connected_turar_room?: string;
  connected_turar_room_id?: string;
  created_at: string;
  updated_at: string;
}

export const useProjectorData = () => {
  return useQuery({
    queryKey: ["projector-equipment"],
    queryFn: async () => {
      console.log('🔄 Fetching projector data from database...');
      const { data, error } = await (supabase as any)
        .from("projector_floors")
        .select("*")
        .order("\"ЭТАЖ\", \"ОТДЕЛЕНИЕ\", \"НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ\", \"Наименование оборудования\"");

      if (error) {
        console.error('❌ Error fetching projector data:', error);
        throw error;
      }

      console.log('✅ Successfully fetched projector data:', {
        totalRecords: data?.length || 0,
        sampleRecord: data?.[0]
      });

      return data as ProjectorEquipment[];
    },
    staleTime: 0, // Don't cache
    gcTime: 0, // Don't keep in memory
  });
};

export const useProjectorDataByFloor = () => {
  const { data: projectorData, ...rest } = useProjectorData();

  const organizedData = projectorData?.reduce((acc, item) => {
    const floor = item["ЭТАЖ"].toString();
    const department = item["ОТДЕЛЕНИЕ"];
    if (!acc[floor]) {
      acc[floor] = {};
    }
    if (!acc[floor][department]) {
      acc[floor][department] = [];
    }
    acc[floor][department].push(item);
    return acc;
  }, {} as Record<string, Record<string, ProjectorEquipment[]>>);

  return {
    data: organizedData,
    rawData: projectorData,
    ...rest,
  };
};