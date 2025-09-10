import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectorRoomData {
  id: string;
  "ЭТАЖ": number;
  "БЛОК": string;
  "ОТДЕЛЕНИЕ": string;
  "КОД ПОМЕЩЕНИЯ": string;
  "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": string;
  "Код помещения": string | null;
  "Наименование помещения": string | null;
  "Площадь (м2)": number | null;
  "Код оборудования": string | null;
  "Наименование оборудования": string | null;
  "Ед. изм.": string | null;
  "Кол-во": string | null;
  "Примечания": string | null;
  created_at: string;
  updated_at: string;
}

export interface TurarRoomData {
  id: string;
  "Отделение/Блок": string;
  "Помещение/Кабинет": string;
  "Код оборудования": string;
  "Наименование": string;
  "Кол-во": number;
  created_at: string;
  updated_at: string;
}

export const useProjectorRoomsAndEquipment = () => {
  return useQuery<ProjectorRoomData[]>({
    queryKey: ["projector-rooms-equipment"],
    queryFn: async () => {
      console.log(`🔄 Загружаем данные проектировщиков из базы...`);
      const { data, error } = await (supabase as any)
        .from("projector_floors")
        .select("*")
        .order('"ЭТАЖ", "ОТДЕЛЕНИЕ", "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", "Наименование оборудования"');

      if (error) {
        console.error(`❌ Ошибка загрузки данных проектировщиков:`, error);
        throw error;
      }

      console.log(`📊 Загружено ${data?.length || 0} записей проектировщиков с кабинетами и оборудованием`);
      
      return (data || []) as ProjectorRoomData[];
    },
  });
};

export const useTurarRoomsAndEquipment = () => {
  return useQuery<TurarRoomData[]>({
    queryKey: ["turar-rooms-equipment"],
    queryFn: async () => {
      console.log(`🔄 Загружаем данные Турар из базы...`);
      const { data, error } = await (supabase as any)
        .from("turar_medical")
        .select("*")
        .order('"Отделение/Блок", "Помещение/Кабинет", "Наименование"');

      if (error) {
        console.error(`❌ Ошибка загрузки данных Турар:`, error);
        throw error;
      }

      console.log(`🏥 Загружено ${data?.length || 0} записей турар с кабинетами и оборудованием`);
      
      return (data || []) as TurarRoomData[];
    },
  });
};

// Хук для получения структурированных данных по кабинетам и оборудованию для конкретного отделения проектировщиков
export const useProjectorDepartmentRooms = (projectorDepartmentName: string) => {
  const { data: projectorData } = useProjectorRoomsAndEquipment();

  console.log(`🔍 useProjectorDepartmentRooms вызван для: "${projectorDepartmentName}"`);
  
  if (!projectorData || projectorData.length === 0) {
    console.log(`❌ Нет данных проектировщиков для поиска`);
    return {};
  }
  
  // Простая фильтрация - ищем отделения, которые содержат искомое название
  const organizedData = projectorData?.filter(item => {
    const itemDept = item["ОТДЕЛЕНИЕ"];
    if (!itemDept) return false;
    
    // Простое включение - если название отделения содержит искомую строку
    const match = itemDept.toLowerCase().includes(projectorDepartmentName.toLowerCase());
    return match;
  }).reduce((acc, item) => {
    const roomName = item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"];
    if (!roomName) return acc;

    if (!acc[roomName]) {
      acc[roomName] = {
        roomInfo: {
          code: item["КОД ПОМЕЩЕНИЯ"],
          name: roomName,
          area: item["Площадь (м2)"],
          floor: item["ЭТАЖ"],
          block: item["БЛОК"]
        },
        equipment: []
      };
    }

    if (item["Наименование оборудования"]?.trim()) {
      acc[roomName].equipment.push({
        code: item["Код оборудования"],
        name: item["Наименование оборудования"],
        quantity: item["Кол-во"] ? parseInt(item["Кол-во"]) : 0,
        unit: item["Ед. изм."],
        notes: item["Примечания"]
      });
    }

    return acc;
  }, {} as Record<string, {
    roomInfo: {
      code: string;
      name: string;
      area: number | null;
      floor: number;
      block: string;
    };
    equipment: Array<{
      code: string | null;
      name: string;
      quantity: number;
      unit: string | null;
      notes: string | null;
    }>;
  }>);

  console.log(`📈 Найдено кабинетов: ${Object.keys(organizedData || {}).length}`);

  return organizedData || {};
};

export const useTurarDepartmentRooms = (departmentName: string) => {
  const { data: turarData } = useTurarRoomsAndEquipment();

  console.log(`🔍 useTurarDepartmentRooms вызван для: "${departmentName}"`);
  
  if (!turarData || turarData.length === 0) {
    console.log(`❌ Нет данных Турар для поиска`);
    return {};
  }

  // Простая фильтрация - ищем отделения, которые содержат искомое название  
  const organizedData = turarData?.filter(item => {
    const itemDept = item["Отделение/Блок"];
    if (!itemDept) return false;
    
    // Простое включение - если название отделения содержит искомую строку
    const match = itemDept.toLowerCase().includes(departmentName.toLowerCase());
    return match;
  }).reduce((acc, item) => {
    const roomName = item["Помещение/Кабинет"];
    if (!roomName) return acc;

    if (!acc[roomName]) {
      acc[roomName] = {
        roomInfo: {
          name: roomName
        },
        equipment: []
      };
    }

    if (item["Наименование"]?.trim()) {
      acc[roomName].equipment.push({
        code: item["Код оборудования"],
        name: item["Наименование"],
        quantity: item["Кол-во"]
      });
    }

    return acc;
  }, {} as Record<string, {
    roomInfo: {
      name: string;
    };
    equipment: Array<{
      code: string;
      name: string;
      quantity: number;
    }>;
  }>);

  console.log(`📈 Найдено кабинетов Турар: ${Object.keys(organizedData || {}).length}`);

  return organizedData || {};
};