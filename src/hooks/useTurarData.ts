import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TurarEquipment {
  id: string;
  "Код оборудования": string;
  "Наименование": string;
  "Кол-во": number;
  "Отделение/Блок": string;
  "Помещение/Кабинет": string;
  created_at: string;
  updated_at: string;
}

export const useTurarData = () => {
  return useQuery({
    queryKey: ["turar-equipment"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("turar_medical")
        .select("*")
        .order("\"Отделение/Блок\", \"Помещение/Кабинет\", \"Наименование\"");

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
    const department = item["Отделение/Блок"];
    if (!acc[department]) {
      acc[department] = [];
    }
    acc[department].push(item);
    return acc;
  }, {} as Record<string, TurarEquipment[]>);

  return {
    data: organizedData,
    rawData: turarData,
    ...rest,
  };
};