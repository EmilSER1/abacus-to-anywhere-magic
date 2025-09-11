import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DepartmentMapping {
  id: string;
  turar_department: string;
  projector_department: string;
  turar_department_id?: string;
  projector_department_id?: string;
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
    queryKey: ["all-departments", "db-functions-v2"], // Сброс кеша для функций БД
    queryFn: async () => {
      try {
        console.log('🔍 ИСПОЛЬЗУЕМ ФУНКЦИИ БАЗЫ ДАННЫХ');
        
        // Вызываем функцию для получения уникальных отделений Турар
        console.log('📋 Вызываем get_unique_turar_departments...');
        const { data: turarData, error: turarError } = await supabase
          .rpc('get_unique_turar_departments');

        if (turarError) {
          console.error('❌ Ошибка загрузки Турар:', turarError);
          throw turarError;
        }

        console.log('📋 РЕЗУЛЬТАТ ТУРАР:', turarData?.length, turarData);

        // Вызываем функцию для получения уникальных отделений Проектировщиков
        console.log('🏗️ Вызываем get_unique_projector_departments...');
        const { data: projectorData, error: projectorError } = await supabase
          .rpc('get_unique_projector_departments');

        if (projectorError) {
          console.error('❌ Ошибка загрузки Проектировщиков:', projectorError);
          throw projectorError;
        }

        console.log('🏗️ РЕЗУЛЬТАТ ПРОЕКТИРОВЩИКИ:', projectorData?.length, projectorData);

        // Преобразуем данные в нужный формат
        const turarDepartments = turarData?.map(item => item.department_name) || [];
        const projectorDepartments = projectorData?.map(item => item.department_name) || [];

        console.log('✅ ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:');
        console.log('- Уникальные Турар:', turarDepartments.length, turarDepartments);
        console.log('- Уникальные Проектировщики:', projectorDepartments.length, projectorDepartments);

        return {
          turarDepartments,
          projectorDepartments
        };
      } catch (error) {
        console.error('Ошибка загрузки отделений:', error);
        throw error;
      }
    },
  });
};