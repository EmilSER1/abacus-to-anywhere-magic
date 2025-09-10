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
    queryKey: ["all-departments", "v2"], // Изменил ключ для сброса кеша
    queryFn: async () => {
      try {
        console.log('🔍 Начинаем загрузку отделений...');
        
        // Получаем уникальные отделения Турар
        const { data: turarData, error: turarError } = await supabase
          .from("turar_medical")
          .select('"Отделение/Блок"')
          .limit(10000); // Явно устанавливаем большой лимит

        if (turarError) {
          console.error('❌ Ошибка загрузки Турар:', turarError);
          throw turarError;
        }

        console.log('📋 Сырые данные Турар:', turarData?.length, 'записей');
        console.log('📋 Образец данных Турар:', turarData?.slice(0, 3));

        // Получаем уникальные отделения Проектировщиков
        const { data: projectorData, error: projectorError } = await supabase
          .from("projector_floors")
          .select('"ОТДЕЛЕНИЕ"')
          .not('"ОТДЕЛЕНИЕ"', 'is', null)
          .limit(10000); // Явно устанавливаем большой лимит

        if (projectorError) {
          console.error('❌ Ошибка загрузки Проектировщиков:', projectorError);
          throw projectorError;
        }

        console.log('🏗️ Сырые данные Проектировщиков:', projectorData?.length, 'записей');
        console.log('🏗️ Образец данных Проектировщиков:', projectorData?.slice(0, 3));

        const uniqueTurarDepts = [...new Set(turarData?.map(item => item["Отделение/Блок"]) || [])].filter(Boolean).sort();
        const uniqueProjectorDepts = [...new Set(projectorData?.map(item => {
          const dept = item["ОТДЕЛЕНИЕ"];
          if (!dept) return null;
          // Убираем лишние пробелы и переносы строк
          return dept.replace(/\s+/g, ' ').trim();
        }) || [])].filter(Boolean).sort();

        console.log('✅ Обработанные отделения Турар:', uniqueTurarDepts.length, uniqueTurarDepts);
        console.log('✅ Обработанные отделения Проектировщиков:', uniqueProjectorDepts.length, uniqueProjectorDepts);

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