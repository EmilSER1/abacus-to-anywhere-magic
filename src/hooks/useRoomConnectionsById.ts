import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RoomConnectionById {
  id: string;
  turar_department_id: string;
  turar_room_id: string;
  projector_department_id: string;
  projector_room_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomConnectionByIdRequest {
  turar_department_id: string;
  turar_room_id: string;
  projector_department_id: string;
  projector_room_id: string;
}

export const useRoomConnectionsById = () => {
  return useQuery({
    queryKey: ["room-connections-by-id"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_connections")
        .select(`
          id,
          turar_department_id,
          turar_room_id,
          projector_department_id,
          projector_room_id,
          created_at,
          updated_at
        `)
        .not("turar_department_id", "is", null)
        .not("turar_room_id", "is", null)
        .not("projector_department_id", "is", null)
        .not("projector_room_id", "is", null);

      if (error) {
        throw error;
      }

      return data as RoomConnectionById[];
    },
  });
};

export const useCreateRoomConnectionById = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (connection: CreateRoomConnectionByIdRequest) => {
      console.log('🔄 Creating room connection with data:', connection);
      
      // Получаем названия для обратной совместимости
      const [turarDept, projectorDept] = await Promise.all([
        supabase.from("departments").select("name").eq("id", connection.turar_department_id).single(),
        supabase.from("departments").select("name").eq("id", connection.projector_department_id).single()
      ]);

      if (turarDept.error) {
        console.error('❌ Turar department not found:', turarDept.error);
        throw new Error(`Отделение Турар не найдено: ${connection.turar_department_id}`);
      }
      
      if (projectorDept.error) {
        console.error('❌ Projector department not found:', projectorDept.error);
        throw new Error(`Отделение проектировщиков не найдено: ${connection.projector_department_id}`);
      }

      // Получаем названия кабинетов из основных таблиц, а не из rooms
      const [turarRoom, projectorRoom] = await Promise.all([
        supabase.from("turar_medical").select("\"Помещение/Кабинет\"").eq("id", connection.turar_room_id).limit(1).single(),
        supabase.from("projector_floors").select("\"НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ\"").eq("id", connection.projector_room_id).limit(1).single()
      ]);

      if (turarRoom.error) {
        console.error('❌ Turar room not found:', turarRoom.error);
        throw new Error(`Кабинет Турар не найден: ${connection.turar_room_id}`);
      }
      
      if (projectorRoom.error) {
        console.error('❌ Projector room not found:', projectorRoom.error);
        throw new Error(`Кабинет проектировщиков не найден: ${connection.projector_room_id}`);
      }

      console.log('✅ Found departments and rooms:', {
        turarDept: turarDept.data.name,
        turarRoom: turarRoom.data["Помещение/Кабинет"],
        projectorDept: projectorDept.data.name,
        projectorRoom: projectorRoom.data["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]
      });

      // Создаем связь с ID и названиями
      const { data, error } = await supabase
        .from("room_connections")
        .insert([{
          turar_department: turarDept.data.name,
          turar_room: turarRoom.data["Помещение/Кабинет"],
          projector_department: projectorDept.data.name,
          projector_room: projectorRoom.data["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"],
          turar_department_id: connection.turar_department_id,
          turar_room_id: connection.turar_room_id,
          projector_department_id: connection.projector_department_id,
          projector_room_id: connection.projector_room_id
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating room connection:', error);
        throw error;
      }

      console.log('✅ Room connection created successfully:', data);

      // Обновляем основные таблицы с ID связей И названиями
      await Promise.all([
        // Обновляем ВСЕ записи projector_floors с одинаковым названием помещения и отделения
        supabase
          .from("projector_floors")
          .update({ 
            connected_turar_room_id: connection.turar_room_id,
            connected_turar_department: turarDept.data.name,
            connected_turar_room: turarRoom.data["Помещение/Кабинет"]
          })
          .eq("НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", projectorRoom.data["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"])
          .eq("ОТДЕЛЕНИЕ", projectorDept.data.name),
        
        // Обновляем ВСЕ записи turar_medical с одинаковым названием помещения и отделения
        supabase
          .from("turar_medical")
          .update({ 
            connected_projector_room_id: connection.projector_room_id,
            connected_projector_department: projectorDept.data.name,
            connected_projector_room: projectorRoom.data["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]
          })
          .eq("Помещение/Кабинет", turarRoom.data["Помещение/Кабинет"])
          .eq("Отделение/Блок", turarDept.data.name)
      ]);

      console.log('✅ Updated main tables with connection data');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-connections-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["room-connections"] });
      queryClient.invalidateQueries({ queryKey: ["turar-medical"] });
      queryClient.invalidateQueries({ queryKey: ["projector-equipment"] });
      toast({
        title: "Связь кабинетов создана",
        description: "Кабинеты успешно связаны",
      });
    },
  });
};

export const useDeleteRoomConnectionById = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Получаем детали связи перед удалением
      const { data: connection } = await supabase
        .from("room_connections")
        .select("*")
        .eq("id", id)
        .single();

      if (connection) {
        // Получаем названия для очистки всех связанных записей
        const [projectorDept, turarDept] = await Promise.all([
          supabase.from("departments").select("name").eq("id", connection.projector_department_id).single(),
          supabase.from("departments").select("name").eq("id", connection.turar_department_id).single()
        ]);

        if (!projectorDept.error && !turarDept.error) {
          // Очищаем связи во всех записях с такими же названиями
          await Promise.all([
            // Очищаем все записи projector_floors с таким же названием помещения и отделения
            supabase
              .from("projector_floors")
              .update({ 
                connected_turar_room_id: null,
                connected_turar_department: null,
                connected_turar_room: null
              })
              .eq("НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", connection.projector_room)
              .eq("ОТДЕЛЕНИЕ", projectorDept.data.name),
            
            // Очищаем все записи turar_medical с таким же названием помещения и отделения
            supabase
              .from("turar_medical")
              .update({ 
                connected_projector_room_id: null,
                connected_projector_department: null,
                connected_projector_room: null
              })
              .eq("Помещение/Кабинет", connection.turar_room)
              .eq("Отделение/Блок", turarDept.data.name)
          ]);
        }
      }

      // Удаляем запись связи
      const { error } = await supabase
        .from("room_connections")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-connections-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["room-connections"] });
      queryClient.invalidateQueries({ queryKey: ["turar-medical"] });
      queryClient.invalidateQueries({ queryKey: ["projector-equipment"] });
      toast({
        title: "Связь кабинетов удалена",
        description: "Связь между кабинетами удалена",
      });
    },
  });
};