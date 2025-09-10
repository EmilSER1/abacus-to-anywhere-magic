import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MappedProjectorRoom {
  id: string;
  department_mapping_id: string;
  original_record_id: string;
  floor_number: number;
  block_name: string;
  department_name: string;
  room_code: string;
  room_name: string;
  room_area: number | null;
  equipment_code: string | null;
  equipment_name: string | null;
  equipment_unit: string | null;
  equipment_quantity: string | null;
  equipment_notes: string | null;
  linked_turar_room_id: string | null;
  is_linked: boolean;
  created_at: string;
  updated_at: string;
}

export interface MappedTurarRoom {
  id: string;
  department_mapping_id: string;
  original_record_id: string;
  department_name: string;
  room_name: string;
  equipment_code: string;
  equipment_name: string;
  equipment_quantity: number;
  linked_projector_room_id: string | null;
  is_linked: boolean;
  created_at: string;
  updated_at: string;
}

// Хук для получения данных проектировщиков из промежуточной таблицы
export const useMappedProjectorRooms = (departmentMappingId: string) => {
  return useQuery<MappedProjectorRoom[]>({
    queryKey: ["mapped-projector-rooms", departmentMappingId],
    queryFn: async () => {
      console.log(`🔄 Загружаем промежуточные данные проектировщиков для mapping: ${departmentMappingId}`);
      
      const { data, error } = await supabase
        .from("mapped_projector_rooms")
        .select("*")
        .eq("department_mapping_id", departmentMappingId)
        .order("room_name, equipment_name");

      if (error) {
        console.error(`❌ Ошибка загрузки промежуточных данных проектировщиков:`, error);
        throw error;
      }

      console.log(`📊 Загружено ${data?.length || 0} промежуточных записей проектировщиков`);
      return data || [];
    },
    enabled: !!departmentMappingId,
  });
};

// Хук для получения данных Турар из промежуточной таблицы
export const useMappedTurarRooms = (departmentMappingId: string) => {
  return useQuery<MappedTurarRoom[]>({
    queryKey: ["mapped-turar-rooms", departmentMappingId],
    queryFn: async () => {
      console.log(`🔄 Загружаем промежуточные данные Турар для mapping: ${departmentMappingId}`);
      
      const { data, error } = await supabase
        .from("mapped_turar_rooms")
        .select("*")
        .eq("department_mapping_id", departmentMappingId)
        .order("room_name, equipment_name");

      if (error) {
        console.error(`❌ Ошибка загрузки промежуточных данных Турар:`, error);
        throw error;
      }

      console.log(`🏥 Загружено ${data?.length || 0} промежуточных записей Турар`);
      return data || [];
    },
    enabled: !!departmentMappingId,
  });
};

// Хук для заполнения промежуточных таблиц
export const usePopulateMappedDepartments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      departmentMappingId, 
      projectorDepartment, 
      turarDepartment 
    }: { 
      departmentMappingId: string;
      projectorDepartment: string;
      turarDepartment: string;
    }) => {
      console.log(`🔄 Вызываем функцию заполнения промежуточных таблиц...`);
      
      const { data, error } = await supabase.functions.invoke('populate-mapped-departments', {
        body: {
          department_mapping_id: departmentMappingId,
          projector_department: projectorDepartment,
          turar_department: turarDepartment
        }
      });

      if (error) {
        console.error(`❌ Ошибка вызова функции:`, error);
        throw error;
      }

      console.log(`✅ Функция выполнена успешно:`, data);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Данные скопированы",
        description: `Скопировано ${data.projector_records} записей проектировщиков и ${data.turar_records} записей Турар`,
      });
      
      // Обновляем кэш
      queryClient.invalidateQueries({
        queryKey: ["mapped-projector-rooms", data.department_mapping_id]
      });
      queryClient.invalidateQueries({
        queryKey: ["mapped-turar-rooms", data.department_mapping_id]
      });
    },
    onError: (error) => {
      console.error("❌ Ошибка заполнения промежуточных таблиц:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать данные в промежуточные таблицы",
        variant: "destructive",
      });
    },
  });
};

// Группировка промежуточных данных проектировщиков по кабинетам
export const useGroupedMappedProjectorRooms = (departmentMappingId: string) => {
  const { data: mappedData } = useMappedProjectorRooms(departmentMappingId);

  const groupedData = mappedData?.reduce((acc, item) => {
    const roomName = item.room_name;
    if (!roomName) return acc;

    if (!acc[roomName]) {
      acc[roomName] = {
        roomInfo: {
          id: item.id,
          code: item.room_code,
          name: roomName,
          area: item.room_area,
          floor: item.floor_number,
          block: item.block_name
        },
        equipment: []
      };
    }

    if (item.equipment_name?.trim()) {
      acc[roomName].equipment.push({
        id: item.id,
        code: item.equipment_code,
        name: item.equipment_name,
        quantity: item.equipment_quantity ? parseInt(item.equipment_quantity) : 0,
        unit: item.equipment_unit,
        notes: item.equipment_notes,
        linked_turar_room_id: item.linked_turar_room_id,
        is_linked: item.is_linked
      });
    }

    return acc;
  }, {} as Record<string, {
    roomInfo: {
      id: string;
      code: string;
      name: string;
      area: number | null;
      floor: number;
      block: string;
    };
    equipment: Array<{
      id: string;
      code: string | null;
      name: string;
      quantity: number;
      unit: string | null;
      notes: string | null;
      linked_turar_room_id: string | null;
      is_linked: boolean;
    }>;
  }>);

  return groupedData || {};
};

// Группировка промежуточных данных Турар по кабинетам
export const useGroupedMappedTurarRooms = (departmentMappingId: string) => {
  const { data: mappedData } = useMappedTurarRooms(departmentMappingId);

  const groupedData = mappedData?.reduce((acc, item) => {
    const roomName = item.room_name;
    if (!roomName) return acc;

    if (!acc[roomName]) {
      acc[roomName] = {
        roomInfo: {
          id: item.id,
          name: roomName
        },
        equipment: []
      };
    }

    if (item.equipment_name?.trim()) {
      acc[roomName].equipment.push({
        id: item.id,
        code: item.equipment_code,
        name: item.equipment_name,
        quantity: item.equipment_quantity,
        linked_projector_room_id: item.linked_projector_room_id,
        is_linked: item.is_linked
      });
    }

    return acc;
  }, {} as Record<string, {
    roomInfo: {
      id: string;
      name: string;
    };
    equipment: Array<{
      id: string;
      code: string;
      name: string;
      quantity: number;
      linked_projector_room_id: string | null;
      is_linked: boolean;
    }>;
  }>);

  return groupedData || {};
};