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
    queryKey: ["all-departments", "v3"], // Сброс кеша
    queryFn: async () => {
      try {
        console.log('🔍 НАЧИНАЕМ ЗАГРУЗКУ ОТДЕЛЕНИЙ В ХУКЕ');
        
        // Получаем уникальные отделения Турар
        console.log('📋 Запрашиваем данные Турар...');
        const { data: turarData, error: turarError, count: turarCount } = await supabase
          .from("turar_medical")
          .select('"Отделение/Блок"', { count: 'exact' })
          .limit(10000);

        console.log('📋 РЕЗУЛЬТАТ ЗАПРОСА ТУРАР:');
        console.log('- data length:', turarData?.length);
        console.log('- count:', turarCount);
        console.log('- error:', turarError);
        console.log('- первые 5 записей:', turarData?.slice(0, 5));

        if (turarError) throw turarError;

        // Получаем уникальные отделения Проектировщиков
        console.log('🏗️ Запрашиваем данные Проектировщиков...');
        const { data: projectorData, error: projectorError, count: projectorCount } = await supabase
          .from("projector_floors")
          .select('"ОТДЕЛЕНИЕ"', { count: 'exact' })
          .not('"ОТДЕЛЕНИЕ"', 'is', null)
          .limit(10000);

        console.log('🏗️ РЕЗУЛЬТАТ ЗАПРОСА ПРОЕКТИРОВЩИКОВ:');
        console.log('- data length:', projectorData?.length);
        console.log('- count:', projectorCount);
        console.log('- error:', projectorError);
        console.log('- первые 5 записей:', projectorData?.slice(0, 5));

        if (projectorError) throw projectorError;

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