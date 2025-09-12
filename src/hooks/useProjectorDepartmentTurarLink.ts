import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Получение связанного отделения Турар для отделения проектировщиков
export const useProjectorDepartmentTurarLink = (departmentName: string) => {
  return useQuery({
    queryKey: ["projector-department-turar-link", departmentName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projector_floors")
        .select("connected_turar_department")
        .eq("ОТДЕЛЕНИЕ", departmentName)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data?.connected_turar_department || null;
    },
    enabled: !!departmentName,
  });
};