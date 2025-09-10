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
      
      // Проверим уникальные отделения сразу при загрузке
      const allDepartments = data?.map(item => item["ОТДЕЛЕНИЕ"]).filter(Boolean);
      const uniqueDepartments = [...new Set(allDepartments)];
      console.log(`🏢 Уникальные отделения в загруженных данных (${uniqueDepartments.length}):`, uniqueDepartments);
      
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
      
      // Проверим уникальные отделения сразу при загрузке
      const allDepartments = data?.map(item => item["Отделение/Блок"]).filter(Boolean);
      const uniqueDepartments = [...new Set(allDepartments)];
      console.log(`🏥 Уникальные отделения Турар в загруженных данных (${uniqueDepartments.length}):`, uniqueDepartments);
      
      return (data || []) as TurarRoomData[];
    },
  });
};

// Хук для получения структурированных данных по кабинетам и оборудованию для конкретного отделения проектировщиков
export const useProjectorDepartmentRooms = (projectorDepartmentName: string) => {
  const { data: projectorData } = useProjectorRoomsAndEquipment();

  console.log(`🔍 useProjectorDepartmentRooms вызван для: "${projectorDepartmentName}"`);
  console.log(`📊 Всего данных проектировщиков:`, projectorData?.length);
  
  if (!projectorData || projectorData.length === 0) {
    console.log(`❌ Нет данных проектировщиков для поиска`);
    return {};
  }
  
  // Получаем все уникальные отделения для отладки
  const allDepartments = projectorData?.map(item => item["ОТДЕЛЕНИЕ"]).filter(Boolean);
  const uniqueDepartments = [...new Set(allDepartments)];
  console.log(`🏢 Все уникальные отделения проектировщиков (всего ${uniqueDepartments.length}):`, uniqueDepartments);
  console.log(`🎯 Ищем отделение проектировщиков: "${projectorDepartmentName}"`);
  
  // Проверяем частичные совпадения
  const partialMatches = uniqueDepartments.filter(dept => 
    dept.toLowerCase().includes(projectorDepartmentName.toLowerCase()) || 
    projectorDepartmentName.toLowerCase().includes(dept.toLowerCase())
  );
  console.log(`🔍 Частичные совпадения для "${projectorDepartmentName}":`, partialMatches);

  
  const organizedData = projectorData?.filter(item => {
    const itemDept = item["ОТДЕЛЕНИЕ"];
    const match = itemDept && itemDept.trim() === projectorDepartmentName.trim();
    console.log(`🔍 Проверяем: "${itemDept}" === "${projectorDepartmentName}" = ${match}`);
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

  console.log(`📈 Результат для "${projectorDepartmentName}":`, {
    organizedData,
    roomsCount: Object.keys(organizedData || {}).length,
    foundRooms: Object.keys(organizedData || {}),
    isEmpty: Object.keys(organizedData || {}).length === 0
  });

  return organizedData || {};
};

export const useTurarDepartmentRooms = (departmentName: string) => {
  const { data: turarData } = useTurarRoomsAndEquipment();

  const organizedData = turarData?.filter(item => 
    item["Отделение/Блок"] && item["Отделение/Блок"].trim() === departmentName.trim()
  ).reduce((acc, item) => {
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

  return organizedData || {};
};