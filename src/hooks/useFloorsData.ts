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
  "Наименование": string | null;
  "Наименование оборудования": string | null;
  "Ед. изм.": string | null;
  "Кол-во": number | string | null;
  "Примечания": string | null;
  connected_turar_department?: string | null;
  connected_turar_room?: string | null;
  connected_turar_room_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const useFloorsData = () => {
  return useQuery({
    queryKey: ["projector-floors"],
    queryFn: async () => {
      let allData: FloorData[] = [];
      let from = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await (supabase as any)
          .from("projector_floors")
          .select("*")
          .order('"ЭТАЖ", "ОТДЕЛЕНИЕ", "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", "Наименование оборудования"')
          .range(from, from + limit - 1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += limit;
          hasMore = data.length === limit;
        } else {
          hasMore = false;
        }
      }

      console.log(`Loaded ${allData.length} total projector records`);
      return allData as FloorData[];
    },
  });
};