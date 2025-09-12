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
      console.log('🗑️ ОЧИСТКА СВЯЗАННЫХ ДАННЫХ перед удалением:', { mappingId });
      
      try {
        // 1. Удаляем mapped_turar_rooms небольшими порциями (максимум 1000 за раз)
        console.log('🧹 Удаляем mapped_turar_rooms...');
        let deleted = 0;
        let batchSize = 1000;
        
        while (true) {
          const { data: toDelete, error: selectError } = await supabase
            .from('mapped_turar_rooms')
            .select('id')
            .eq('department_mapping_id', mappingId)
            .limit(batchSize);
          
          if (selectError) {
            console.error('❌ Ошибка получения записей для удаления:', selectError);
            break;
          }
          
          if (!toDelete || toDelete.length === 0) {
            console.log(`✅ Удалено всего mapped_turar_rooms: ${deleted}`);
            break;
          }
          
          const idsToDelete = toDelete.map(item => item.id);
          const { error: deleteError } = await supabase
            .from('mapped_turar_rooms')
            .delete()
            .in('id', idsToDelete);
          
          if (deleteError) {
            console.error('❌ Ошибка удаления batch mapped_turar_rooms:', deleteError);
            break;
          }
          
          deleted += toDelete.length;
          console.log(`📊 Удалено ${deleted} mapped_turar_rooms записей...`);
          
          // Если удалили меньше чем batch size, значит все удалили
          if (toDelete.length < batchSize) {
            break;
          }
        }
        
        // 2. Удаляем mapped_projector_rooms
        console.log('🧹 Удаляем mapped_projector_rooms...');
        const { error: projectorError } = await supabase
          .from('mapped_projector_rooms')
          .delete()
          .eq('department_mapping_id', mappingId);
        
        if (projectorError) {
          console.error('❌ Ошибка удаления mapped_projector_rooms:', projectorError);
        }
        
        // 3. Теперь удаляем саму связь отделений
        console.log('🗑️ Удаляем связь отделений...');
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
      } catch (error) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА при удалении:', error);
        throw error;
      }
    },
    onSuccess: (mappingId) => {
      console.log('🔄 ОБНОВЛЯЕМ ЗАПРОСЫ после удаления:', mappingId);
      queryClient.invalidateQueries({ queryKey: ['department-mappings-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['department-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['room-connections'] });
      queryClient.invalidateQueries({ queryKey: ['room-connections-by-id'] });
    },
    onError: (error) => {
      console.error('❌ ОШИБКА В МУТАЦИИ УДАЛЕНИЯ:', error);
    }
  });
};

export const useUpdateDepartmentMappingById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mappingId, turar_department_id, projector_department_id }: {
      mappingId: string;
      turar_department_id: string;
      projector_department_id: string;
    }) => {
      console.log('✏️ ОБНОВЛЕНИЕ СВЯЗИ ОТДЕЛЕНИЙ:', { mappingId, turar_department_id, projector_department_id });
      
      // Получаем названия отделений по ID
      const [turarDept, projectorDept] = await Promise.all([
        supabase.from("departments").select("name").eq("id", turar_department_id).single(),
        supabase.from("departments").select("name").eq("id", projector_department_id).single()
      ]);

      if (turarDept.error || projectorDept.error) {
        console.error('❌ ОШИБКА ПОЛУЧЕНИЯ НАЗВАНИЙ ОТДЕЛЕНИЙ:', turarDept.error || projectorDept.error);
        throw turarDept.error || projectorDept.error;
      }

      // Обновляем связь
      const { data, error } = await supabase
        .from('department_mappings')
        .update({
          turar_department: turarDept.data.name,
          projector_department: projectorDept.data.name,
          turar_department_id,
          projector_department_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', mappingId)
        .select()
        .single();

      if (error) {
        console.error('❌ ОШИБКА ОБНОВЛЕНИЯ СВЯЗИ:', error);
        throw error;
      }

      console.log('✅ СВЯЗЬ УСПЕШНО ОБНОВЛЕНА:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🔄 ОБНОВЛЯЕМ ЗАПРОСЫ после обновления:', data.id);
      queryClient.invalidateQueries({ queryKey: ['department-mappings-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['department-mappings'] });
    },
    onError: (error) => {
      console.error('❌ ОШИБКА В МУТАЦИИ ОБНОВЛЕНИЯ:', error);
    }
  });
};