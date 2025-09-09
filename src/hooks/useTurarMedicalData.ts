import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TurarMedicalData {
  id: string;
  "Отделение/Блок": string;
  "Помещение/Кабинет": string;
  "Код оборудования": string;
  "Наименование": string;
  "Кол-во": number;
  created_at: string;
  updated_at: string;
}

export const useTurarMedicalData = () => {
  return useQuery({
    queryKey: ["turar-medical"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("turar_medical")
        .select("*")
        .order('"Отделение/Блок", "Помещение/Кабинет", "Наименование"');

      if (error) {
        throw error;
      }

      return data as TurarMedicalData[];
    },
  });
};