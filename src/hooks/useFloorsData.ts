import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FloorData {
  id: string;
  "ЭТАЖ": number;
  "БЛОК": string;
  "ОТДЕЛЕНИЕ": string;
  "КОД ПОМЕЩЕНИЯ": string;
  "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": string;
  "Код помещения": string;
  "Наименование помещения": string;
  "Площадь (м2)": number;
  "Код оборудования": string | null;
  "Наименование оборудования": string | null;
  "Ед. изм.": string | null;
  "Кол-во": number | string | null;
  "Примечания": string | null;
  created_at: string;
  updated_at: string;
}

export const useFloorsData = () => {
  return useQuery({
    queryKey: ["projector-floors"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("projector_floors")
        .select("*")
        .order('"ЭТАЖ", "ОТДЕЛЕНИЕ", "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", "Наименование оборудования"')
        .limit(100000); // Максимально возможный лимит

      console.log(`Loaded ${data?.length || 0} projector records`);

      if (error) {
        throw error;
      }

      return data as FloorData[];
    },
  });
};