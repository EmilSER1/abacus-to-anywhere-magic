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
  return useQuery({
    queryKey: ["projector-rooms-equipment"],
    queryFn: async () => {
      let allData: ProjectorRoomData[] = [];
      let from = 0;
      const limit = 10000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await (supabase as any)
          .from("projector_floors")
          .select("*")
          .order('"ЭТАЖ", "ОТДЕЛЕНИЕ", "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", "Наименование оборудования"')
          .range(from, from + limit - 1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += limit;
          hasMore = data.length === limit;
        } else {
          hasMore = false;
        }
      }

      console.log(`📊 Загружено ${allData.length} записей проектировщиков с кабинетами и оборудованием`);
      return allData as ProjectorRoomData[];
    },
  });
};

export const useTurarRoomsAndEquipment = () => {
  return useQuery({
    queryKey: ["turar-rooms-equipment"],
    queryFn: async () => {
      let allData: TurarRoomData[] = [];
      let from = 0;
      const limit = 10000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await (supabase as any)
          .from("turar_medical")
          .select("*")
          .order('"Отделение/Блок", "Помещение/Кабинет", "Наименование"')
          .range(from, from + limit - 1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += limit;
          hasMore = data.length === limit;
        } else {
          hasMore = false;
        }
      }

      console.log(`🏥 Загружено ${allData.length} записей турар с кабинетами и оборудованием`);
      return allData as TurarRoomData[];
    },
  });
};

// Хук для получения структурированных данных по кабинетам и оборудованию для конкретного отделения
export const useProjectorDepartmentRooms = (departmentName: string) => {
  const { data: projectorData } = useProjectorRoomsAndEquipment();

  console.log(`🔍 useProjectorDepartmentRooms поиск для "${departmentName}"`);
  console.log(`📊 Всего данных проектировщиков:`, projectorData?.length);
  
  // Получаем все уникальные отделения для отладки
  const allDepartments = projectorData?.map(item => item["ОТДЕЛЕНИЕ"]).filter(Boolean);
  const uniqueDepartments = [...new Set(allDepartments)];
  console.log(`🏢 Все уникальные отделения:`, uniqueDepartments);
  console.log(`🎯 Ищем точное совпадение для:`, {
    search: departmentName,
    searchTrimmed: departmentName.trim(),
    searchLower: departmentName.trim().toLowerCase()
  });
  
  // Показываем несколько примеров для сравнения
  console.log(`🔍 Первые 3 отделения проектировщиков:`, uniqueDepartments.slice(0, 3));

  const organizedData = projectorData?.filter(item => {
    const itemDept = item["ОТДЕЛЕНИЕ"];
    const match = itemDept && itemDept.trim().toLowerCase() === departmentName.trim().toLowerCase();
    if (match) {
      console.log(`✅ Найдено точное совпадение: "${itemDept}" === "${departmentName}"`);
    } else if (itemDept) {
      // Показываем близкие совпадения для отладки
      if (itemDept.toLowerCase().includes(departmentName.toLowerCase().split(' ')[0])) {
        console.log(`🔍 Похожее отделение найдено: "${itemDept}" (искали: "${departmentName}")`);
      }
    }
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

  console.log(`📈 Результат для "${departmentName}":`, {
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