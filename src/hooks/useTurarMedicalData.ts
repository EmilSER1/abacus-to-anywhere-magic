import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TurarMedicalData {
  id: string;
  "Отделение/Блок": string;
  "Помещение/Кабинет": string;
  "Код оборудования": string;
  "Наименование": string;
  "Кол-во": number;
  connected_projector_department?: string | null;
  connected_projector_room?: string | null;
  connected_projector_room_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const useTurarMedicalData = () => {
  return useQuery({
    queryKey: ["turar-medical"],
    queryFn: async () => {
      let allData: TurarMedicalData[] = [];
      let from = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await (supabase as any)
          .from("turar_medical")
          .select("*")
          .order('"Отделение/Блок", "Помещение/Кабинет", "Наименование"')
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

      console.log(`Loaded ${allData.length} total turar records`);
      return allData as TurarMedicalData[];
    },
  });
};