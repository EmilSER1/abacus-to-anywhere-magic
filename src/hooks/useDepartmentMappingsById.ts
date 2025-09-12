import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Department } from "./useDepartments";

export interface DepartmentMappingWithDetails {
  id: string;
  turar_department: string;
  projector_department: string;
  turar_department_id?: string;
  projector_department_id?: string;
  turar_dept?: Department;
  projector_dept?: Department;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentMappingByIdRequest {
  turar_department_id: string;
  projector_department_id: string;
}

export const useDepartmentMappingsWithDetails = () => {
  return useQuery({
    queryKey: ["department-mappings-with-details"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_mappings")
        .select("*")
        .order("turar_department, projector_department");

      if (error) {
        throw error;
      }

      return data as DepartmentMappingWithDetails[];
    },
  });
};

// Создание связи отделений через ID
export const useCreateDepartmentMappingById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapping: CreateDepartmentMappingByIdRequest) => {
      // Сначала получаем названия отделений по ID
      const [turarDept, projectorDept] = await Promise.all([
        supabase.from("departments").select("name").eq("id", mapping.turar_department_id).single(),
        supabase.from("departments").select("name").eq("id", mapping.projector_department_id).single()
      ]);

      if (turarDept.error || projectorDept.error) {
        throw turarDept.error || projectorDept.error;
      }

      // Создаем связь с ID и названиями для обратной совместимости
      const { data, error } = await supabase
        .from("department_mappings")
        .insert([{
          turar_department: turarDept.data.name,
          projector_department: projectorDept.data.name,
          turar_department_id: mapping.turar_department_id,
          projector_department_id: mapping.projector_department_id
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-mappings"] });
      queryClient.invalidateQueries({ queryKey: ["department-mappings-with-details"] });
    },
  });
};

// Обновление существующих связей для добавления ID
export const useUpdateDepartmentMappingWithIds = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log("🔄 Обновляем связи отделений с ID...");

      // Получаем все связи без ID
      const { data: mappings, error: mappingsError } = await supabase
        .from("department_mappings")
        .select("*")
        .or("turar_department_id.is.null,projector_department_id.is.null");

      if (mappingsError) throw mappingsError;

      console.log(`📋 Найдено ${mappings.length} связей для обновления`);

      // Обновляем каждую связь
      for (const mapping of mappings) {
        try {
          // Ищем ID для Turar отделения
          const { data: turarDept } = await supabase
            .from("departments")
            .select("id")
            .eq("name", mapping.turar_department.trim())
            .single();

          // Ищем ID для Projector отделения  
          const { data: projectorDept } = await supabase
            .from("departments")
            .select("id")
            .eq("name", mapping.projector_department.trim())
            .single();

          if (turarDept && projectorDept) {
            await supabase
              .from("department_mappings")
              .update({
                turar_department_id: turarDept.id,
                projector_department_id: projectorDept.id
              })
              .eq("id", mapping.id);

            console.log(`✅ Обновлена связь: ${mapping.turar_department} -> ${mapping.projector_department}`);
          } else {
            console.log(`⚠️ Не найдены отделения для связи: ${mapping.turar_department} -> ${mapping.projector_department}`);
          }
        } catch (error) {
          console.error(`❌ Ошибка обновления связи ${mapping.id}:`, error);
        }
      }

      return { updated: mappings.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-mappings"] });
      queryClient.invalidateQueries({ queryKey: ["department-mappings-with-details"] });
    },
  });
};

export const useDeleteDepartmentMappingById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mappingId: string) => {
      console.log('🗑️ УДАЛЕНИЕ СВЯЗИ ОТДЕЛЕНИЙ:', { mappingId });
      
      const { error } = await supabase
        .from('department_mappings')
        .delete()
        .eq('id', mappingId);

      if (error) {
        console.error('❌ ОШИБКА УДАЛЕНИЯ СВЯЗИ:', error);
        throw error;
      }

      console.log('✅ СВЯЗЬ УСПЕШНО УДАЛЕНА:', mappingId);
      return mappingId;
    },
    onSuccess: (mappingId) => {
      console.log('🔄 ОБНОВЛЯЕМ ЗАПРОСЫ после удаления:', mappingId);
      queryClient.invalidateQueries({ queryKey: ['department-mappings-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['department-mappings'] });
    },
    onError: (error) => {
      console.error('❌ ОШИБКА В МУТАЦИИ УДАЛЕНИЯ:', error);
    }
  });
};