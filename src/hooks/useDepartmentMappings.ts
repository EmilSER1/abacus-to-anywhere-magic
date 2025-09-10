import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DepartmentMapping {
  id: string;
  turar_department: string;
  projector_department: string;
  created_at: string;
  updated_at: string;
}

export const useDepartmentMappings = () => {
  return useQuery({
    queryKey: ["department-mappings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_mappings")
        .select("*")
        .order("turar_department, projector_department");

      if (error) {
        throw error;
      }

      return data as DepartmentMapping[];
    },
  });
};

export const useCreateDepartmentMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapping: Omit<DepartmentMapping, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("department_mappings")
        .insert([mapping])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-mappings"] });
    },
  });
};

export const useDeleteDepartmentMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("department_mappings")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-mappings"] });
    },
  });
};

// Хук для получения уникальных отделений из базы данных
export const useGetAllDepartments = () => {
  return useQuery({
    queryKey: ["all-departments", "v4"], // Новый сброс кеша
    queryFn: async () => {
      try {
        console.log('🔍 ЗАГРУЖАЕМ ВСЕ ОТДЕЛЕНИЯ');
        
        // Получаем ВСЕ записи Турар (увеличиваем лимит)
        console.log('📋 Запрашиваем ВСЕ данные Турар...');
        const { data: turarData, error: turarError } = await supabase
          .from("turar_medical")
          .select('"Отделение/Блок"')
          .limit(5000); // Увеличили лимит

        if (turarError) throw turarError;
        console.log('📋 Загружено записей Турар:', turarData?.length);

        // Получаем ВСЕ записи Проектировщиков
        console.log('🏗️ Запрашиваем ВСЕ данные Проектировщиков...');
        const { data: projectorData, error: projectorError } = await supabase
          .from("projector_floors")
          .select('"ОТДЕЛЕНИЕ"')
          .not('"ОТДЕЛЕНИЕ"', 'is', null)
          .limit(8000); // Увеличили лимит еще больше

        if (projectorError) throw projectorError;
        console.log('🏗️ Загружено записей Проектировщиков:', projectorData?.length);

        const uniqueTurarDepts = [...new Set(turarData?.map(item => item["Отделение/Блок"]) || [])].filter(Boolean).sort();
        const uniqueProjectorDepts = [...new Set(projectorData?.map(item => {
          const dept = item["ОТДЕЛЕНИЕ"];
          if (!dept) return null;
          return dept.replace(/\s+/g, ' ').trim();
        }) || [])].filter(Boolean).sort();

        console.log('✅ ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:');
        console.log('- Уникальные Турар:', uniqueTurarDepts.length, uniqueTurarDepts);
        console.log('- Уникальные Проектировщики:', uniqueProjectorDepts.length, uniqueProjectorDepts);

        return {
          turarDepartments: uniqueTurarDepts,
          projectorDepartments: uniqueProjectorDepts
        };
      } catch (error) {
        console.error('Ошибка загрузки отделений:', error);
        throw error;
      }
    },
  });
};