import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Download, Plus, MapPin, Users, Link, Edit, Link2, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { useSearchParams } from 'react-router-dom';
import { useFloorsData, FloorData } from '@/hooks/useFloorsData';
import { useRoomConnections } from '@/hooks/useRoomConnections';
import { useProjectorRoomEquipment, useUpdateProjectorEquipment, useAddProjectorEquipment } from '@/hooks/useProjectorEquipment';
import EditEquipmentDialog from '@/components/EditEquipmentDialog';
import TurarDepartmentSelector from '@/components/TurarDepartmentSelector';
import TurarRoomSelector from '@/components/TurarRoomSelector';
import { useCreateRoomConnection, useDeleteRoomConnection } from '@/hooks/useRoomConnections';
import { useLinkDepartmentToTurar, useUnlinkDepartmentFromTurar } from '@/hooks/useDepartmentTurarLink';
// import { useDeleteRoomConnectionById } from "@/hooks/useRoomConnectionsById";
import { useTurarMedicalData } from '@/hooks/useTurarMedicalData';
import { useCleanupUnknownRooms } from '@/hooks/useCleanupUnknownRooms';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
// import RoomLinkDropdown from '@/components/RoomLinkDropdown';
import { useProjectorDepartmentTurarLink } from '@/hooks/useProjectorDepartmentTurarLink';
import { useUserRole } from '@/hooks/useUserRole';
import * as XLSX from 'xlsx';

// Interface definitions
interface Equipment {
  code: string | null;
  name: string | null;
  unit: string | null;
  quantity: number | string | null;
  notes: string | null;
  equipment_status?: 'Согласовано' | 'Не согласовано' | 'Не найдено';
  equipment_specification?: string;
  equipment_documents?: string;
  equipment_supplier?: string;
  equipment_price?: number;
  id?: string;
}

interface Room {
  code: string;
  name: string;
  area: number;
  equipment: Equipment[];
}

interface Department {
  name: string;
  block: string;
  rooms: Room[];
  equipmentCount: number;
  totalArea: number;
}

interface Floor {
  number: string;
  departments: Department[];
  stats: {
    totalDepartments: number;
    totalRooms: number;
    totalEquipment: number;
    totalArea: number;
  };
}

const statusConfig = {
  'Согласовано': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Согласовано' },
  'Не согласовано': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Не согласовано' },
  'Не найдено': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Не найдено' }
} as const;

// Process floor data to group by floors -> departments -> rooms (with block markers)
const processFloorData = (data: FloorData[]): Floor[] => {
  const floorsMap = new Map<string, Map<string, Department>>();

  data.forEach(item => {
    const floorNumber = String(item["ЭТАЖ"]);
    const blockName = item["БЛОК"];
    const departmentName = item["ОТДЕЛЕНИЕ"];
    const roomArea = parseFloat(String(item["Площадь (м2)"] || 0).replace(',', '.')) || 0;
    
    if (!floorsMap.has(floorNumber)) {
      floorsMap.set(floorNumber, new Map());
    }
    
    const floor = floorsMap.get(floorNumber)!;
    
    if (!floor.has(departmentName)) {
      floor.set(departmentName, {
        name: departmentName,
        block: blockName,
        rooms: [],
        equipmentCount: 0,
        totalArea: 0
      });
    }

    const department = floor.get(departmentName)!;
    let room = department.rooms.find(r => r.code === item["КОД ПОМЕЩЕНИЯ"]);
    
    if (!room) {
      room = {
        code: item["КОД ПОМЕЩЕНИЯ"],
        name: item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"],
        area: roomArea,
        equipment: []
      };
      department.rooms.push(room);
    } else {
      if (roomArea > 0 && (!room.area || room.area === 0)) {
        room.area = roomArea;
      }
    }

    // Проверяем наличие оборудования в любой из колонок
    if (item["Наименование оборудования"] || item["Наименование"]) {
      room.equipment.push({
        code: item["Код оборудования"],
        // Используем "Наименование оборудования" приоритетно, если нет - то "Наименование"
        name: item["Наименование оборудования"] || item["Наименование"],
        unit: item["Ед. изм."],
        quantity: item["Кол-во"],
        notes: item["Примечания"]
      });
      department.equipmentCount++;
    }
  });

  // Convert to Floor[] structure and recalculate areas
  const floors: Floor[] = [];
  
  floorsMap.forEach((departmentsMap, floorNumber) => {
    const departments = Array.from(departmentsMap.values());
    
    departments.forEach(dept => {
      dept.totalArea = dept.rooms.reduce((sum, room) => sum + (room.area || 0), 0);
    });
    
    const totalRooms = departments.reduce((sum, dept) => sum + dept.rooms.length, 0);
    const totalEquipment = departments.reduce((sum, dept) => sum + dept.equipmentCount, 0);
    const totalArea = departments.reduce((sum, dept) => sum + (dept.totalArea || 0), 0);
    
    floors.push({
      number: floorNumber,
      departments,
      stats: {
        totalDepartments: departments.length,
        totalRooms,
        totalEquipment,
        totalArea
      }
    });
  });

  return floors.sort((a, b) => Number(a.number) - Number(b.number));
};

export default function FloorsPage() {
  const { currentUserRole } = useUserRole();
  const isAdmin = currentUserRole === 'admin';
  const [searchParams] = useSearchParams();
  const { data: allData, isLoading, error, refetch } = useFloorsData();
  const { data: roomConnections } = useRoomConnections();
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [addingToRoom, setAddingToRoom] = useState<{ department: string; room: string } | null>(null);
  const [selectedTurarDept, setSelectedTurarDept] = useState('');
  const [selectedTurarRooms, setSelectedTurarRooms] = useState<string[]>([]);
  
  const updateEquipmentMutation = useUpdateProjectorEquipment();
  const addEquipmentMutation = useAddProjectorEquipment();
  const createConnectionMutation = useCreateRoomConnection();
  const deleteConnectionMutation = useDeleteRoomConnection();
  // const deleteRoomConnectionMutation = useDeleteRoomConnection(); // useDeleteRoomConnectionById();
  const linkDepartmentMutation = useLinkDepartmentToTurar();
  const unlinkDepartmentMutation = useUnlinkDepartmentFromTurar();
  const cleanupUnknownRoomsMutation = useCleanupUnknownRooms();
  const { data: turarData } = useTurarMedicalData();
  const { toast } = useToast();

  // Состояния для связывания отделений
  const [departmentTurarSelections, setDepartmentTurarSelections] = useState<Record<string, string>>({});
  
  // Функция для получения связанного отделения Турар
  const getDepartmentTurarLink = (departmentName: string): string | null => {
    if (!allData) return null;
    
    const linkedRecord = allData.find(item => 
      item["ОТДЕЛЕНИЕ"]?.trim() === departmentName?.trim() && 
      item.connected_turar_department
    );
    
    return linkedRecord?.connected_turar_department || null;
  };
  
  // Helper function to check if a room is connected using new ID-based structure
  const isRoomConnected = (room: Room, departmentName: string) => {
    if (!allData) return false;
    
    // Find ANY room record with this name and department that has a SPECIFIC room connection (not just department)
    const connectedRecord = allData.find(item => 
      item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] === room.name && 
      item["ОТДЕЛЕНИЕ"]?.trim() === departmentName?.trim() &&
      (item.connected_turar_room_id || item.connected_turar_room) // Must have specific room connection
    );
    
    console.log('🔍 Checking room connection:', {
      roomName: room.name,
      departmentName,
      connectedRecord: connectedRecord ? {
        id: connectedRecord.id,
        connected_turar_room_id: connectedRecord.connected_turar_room_id,
        connected_turar_room: connectedRecord.connected_turar_room,
        connected_turar_department: connectedRecord.connected_turar_department
      } : null
    });
    
    const isConnected = !!connectedRecord;
    console.log('✅ Room connected result:', isConnected);
    return isConnected;
  };

  // Helper function to get connections for a room
  const getRoomConnections = (room: Room, departmentName: string) => {
    if (!roomConnections) return [];
    
    // Фильтруем связи из таблицы room_connections для данной комнаты и отделения
    const filteredConnections = roomConnections.filter(connection => {
      const projectorDept = connection.projector_department?.trim();
      const projectorRoom = connection.projector_room?.trim();
      const roomName = room.name?.trim();
      const deptName = departmentName?.trim();
      
      return projectorDept === deptName && projectorRoom === roomName;
    });

    console.log('🔗 Getting room connections from room_connections table:', {
      roomName: room.name,
      departmentName,
      connectionsFound: filteredConnections.length,
      connections: filteredConnections.map(c => ({
        id: c.id,
        turar_department: c.turar_department,
        turar_room: c.turar_room
      }))
    });
    
    if (filteredConnections.length === 0) {
      console.log('❌ No connections found');
      return [];
    }
    
    console.log('✅ Found connections:', filteredConnections);
    return filteredConnections;
  };
  const [floors, setFloors] = useState<Floor[]>([]);
  const [expandedFloors, setExpandedFloors] = useState<string[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [highlightTimeout, setHighlightTimeout] = useState<boolean>(false);
  const [targetEquipmentId, setTargetEquipmentId] = useState<string | null>(null);

  // Новые функции для редактирования оборудования
  const handleEditEquipment = (equipment: any, department: string, room: string) => {
    // Загружаем данные из БД для редактирования, если есть id
    if (equipment.id) {
      setEditingEquipment({
        ...equipment,
        "ОТДЕЛЕНИЕ": department,
        "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": room
      });
    } else {
      // Если нет id, создаем новую запись на основе данных из файла
      setEditingEquipment({
        id: '',
        "Код оборудования": equipment.code,
        "Наименование оборудования": equipment.name,
        "Кол-во": equipment.quantity,
        "Ед. изм.": equipment.unit,
        "Примечания": equipment.notes,
        equipment_status: equipment.equipment_status || 'Не найдено',
        equipment_specification: equipment.equipment_specification || '',
        equipment_documents: equipment.equipment_documents || '',
        equipment_supplier: equipment.equipment_supplier || '',
        equipment_price: equipment.equipment_price || 0,
        "ОТДЕЛЕНИЕ": department,
        "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": room
      });
      setIsAddingEquipment(true); // Это будет создание, а не редактирование
    }
    setIsEditDialogOpen(true);
  };

  const handleSaveEquipment = (updatedEquipment: any) => {
    if (isAddingEquipment && addingToRoom) {
      // Создание нового оборудования
      const { id, ...equipmentWithoutId } = updatedEquipment; // Убираем id для новых записей
      
      // Находим существующую запись кабинета для получения всех полей
      const existingRoomRecord = allData?.find(item => 
        item["ОТДЕЛЕНИЕ"] === addingToRoom.department && 
        item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] === addingToRoom.room
      );
      
      const newEquipment = {
        ...equipmentWithoutId,
        "ОТДЕЛЕНИЕ": addingToRoom.department,
        "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": addingToRoom.room,
        "КОД ПОМЕЩЕНИЯ": existingRoomRecord?.["КОД ПОМЕЩЕНИЯ"] || "",
        "ЭТАЖ": existingRoomRecord?.["ЭТАЖ"] || 1,
        "БЛОК": existingRoomRecord?.["БЛОК"] || "",
        "Код помещения": existingRoomRecord?.["Код помещения"] || "",
        "Наименование помещения": existingRoomRecord?.["Наименование помещения"] || "",
        "Площадь (м2)": existingRoomRecord?.["Площадь (м2)"] || null,
      };
      addEquipmentMutation.mutate(newEquipment);
    } else if (editingEquipment?.id) {
      // Обновление существующего оборудования в БД
      updateEquipmentMutation.mutate({
        ...updatedEquipment,
        id: editingEquipment.id
      });
    } else {
      // Создание нового оборудования на основе данных из файла
      const newEquipment = {
        ...updatedEquipment,
        "ОТДЕЛЕНИЕ": editingEquipment?.["ОТДЕЛЕНИЕ"] || '',
        "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": editingEquipment?.["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] || '',
        "КОД ПОМЕЩЕНИЯ": "",
        "ЭТАЖ": 1,
        "БЛОК": "",
      };
      addEquipmentMutation.mutate(newEquipment);
    }
    setIsEditDialogOpen(false);
    setEditingEquipment(null);
    setIsAddingEquipment(false);
    setAddingToRoom(null);
  };

  const handleAddEquipment = (department: string, room: string) => {
    setAddingToRoom({ department, room });
    setEditingEquipment({
      id: '',
      "Наименование оборудования": '',
      "Код оборудования": '',
      "Кол-во": '',
      "Ед. изм.": '',
      "Примечания": '',
      equipment_status: 'Не найдено',
      equipment_specification: '',
      equipment_documents: '',
      equipment_supplier: '',
      equipment_price: 0
    });
    setIsAddingEquipment(true);
    setIsEditDialogOpen(true);
  };

  const handleCreateMultipleConnections = () => {
    selectedTurarRooms.forEach(turarRoom => {
      // Создаем связи со всеми комнатами проектировщиков в отделении
      floors.forEach(floor => {
        floor.departments.forEach(dept => {
          dept.rooms.forEach(room => {
            createConnectionMutation.mutate({
              turar_department: selectedTurarDept,
              turar_room: turarRoom,
              projector_department: dept.name,
              projector_room: room.name
            });
          });
        });
      });
    });
    setSelectedTurarDept('');
    setSelectedTurarRooms([]);
    toast({
      title: "Связи созданы",
      description: `Создано связей: ${selectedTurarRooms.length} кабинетов Турар`,
    });
  };

  // Получение уникальных отделений Турар
  const turarDepartments = React.useMemo(() => {
    if (!turarData) return [];
    
    const departments = new Set<string>();
    turarData.forEach(item => {
      if (item["Отделение/Блок"]) {
        departments.add(item["Отделение/Блок"]);
      }
    });
    
    return Array.from(departments).sort();
  }, [turarData]);


  // Сохранение связи отделения с Турар
  const handleSaveDepartmentLink = (departmentName: string) => {
    const selectedTurar = departmentTurarSelections[departmentName];
    if (selectedTurar) {
      linkDepartmentMutation.mutate({
        departmentName,
        turarDepartment: selectedTurar
      });
    }
  };

  // Удаление связи отделения с Турар
  const handleRemoveDepartmentLink = (departmentName: string) => {
    unlinkDepartmentMutation.mutate(departmentName);
    setDepartmentTurarSelections(prev => ({
      ...prev,
      [departmentName]: ''
    }));
  };

  const handleDeleteConnection = (turarDept: string, turarRoom: string, projectorDept: string, projectorRoom: string) => {
    const connection = roomConnections?.find(conn => 
      conn.turar_department === turarDept && 
      conn.turar_room === turarRoom &&
      conn.projector_department === projectorDept &&
      conn.projector_room === projectorRoom
    );
    
    if (connection) {
      deleteConnectionMutation.mutate(connection.id);
    }
  };

  useEffect(() => {
    if (allData) {
      const processedFloors = processFloorData(allData);
      setFloors(processedFloors);
    }
  }, [allData]);

  useEffect(() => {
    // Handle search params from URL
    const urlSearchTerm = searchParams.get('search');
    const urlDepartment = searchParams.get('department');
    const urlRoom = searchParams.get('room');
    
    if (urlSearchTerm && urlDepartment) {
      console.log('FloorsPage URL params:', { urlSearchTerm, urlDepartment, urlRoom });
      setHighlightTimeout(false); // Reset highlight
      
      // Find and expand relevant sections
      floors.forEach((floor, floorIndex) => {
        const deptIndex = floor.departments.findIndex(dept => dept.name === urlDepartment);
        console.log(`Floor ${floor.number}: found department index ${deptIndex} for ${urlDepartment}`);
        if (deptIndex !== -1) {
          setExpandedFloors([`floor-${floor.number}`]);
          setExpandedDepartments([`dept-${deptIndex}`]);
          console.log('Expanded floors:', [`floor-${floor.number}`]);
          console.log('Expanded departments:', [`dept-${deptIndex}`]);
          
          // Find and expand rooms that contain the search term
          if (urlRoom) {
            const department = floor.departments[deptIndex];
            const roomIndex = department.rooms.findIndex(room => room.name === urlRoom);
            if (roomIndex !== -1) {
              setExpandedRooms([`room-${roomIndex}`]);
              console.log('Expanded rooms:', [`room-${roomIndex}`]);
            }
          } else {
            // If no specific room, look for equipment matching search term
            const department = floor.departments[deptIndex];
            const matchingRooms: string[] = [];
            department.rooms.forEach((room, roomIndex) => {
              const hasMatchingEquipment = room.equipment.some(eq => 
                eq.name?.toLowerCase().includes(urlSearchTerm.toLowerCase())
              );
              if (hasMatchingEquipment) {
                matchingRooms.push(`room-${roomIndex}`);
              }
            });
            if (matchingRooms.length > 0) {
              setExpandedRooms(matchingRooms);
              console.log('Expanded rooms with matching equipment:', matchingRooms);
            }
          }
          
          // Set target equipment for scrolling
          if (urlRoom) {
            const targetId = `${urlDepartment}-${urlRoom}-${urlSearchTerm}`.replace(/\s+/g, '-').toLowerCase();
            setTargetEquipmentId(targetId);
            
            // Scroll to element after animations complete
            setTimeout(() => {
              const element = document.getElementById(targetId);
              if (element) {
                element.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center',
                  inline: 'nearest'
                });
              }
            }, 1200);
          }
        }
      });
      
      // Auto-remove highlight after 3 seconds
      setTimeout(() => setHighlightTimeout(true), 3000);
    }
  }, [searchParams, floors]);

  const exportData = () => {
    // Prepare data for Excel export from Supabase data
    const excelData: any[] = [];
    
    floors.forEach(floor => {
      floor.departments.forEach(department => {
        department.rooms.forEach(room => {
          if (room.equipment.length > 0) {
            room.equipment.forEach(equipment => {
              excelData.push({
                'Этаж': floor.number,
                'Блок': department.block,
                'Отделение': department.name,
                'Код помещения': room.code,
                'Наименование помещения': room.name,
                'Площадь (м2)': room.area,
                'Код оборудования': equipment.code || '',
                'Наименование оборудования': equipment.name || '',
                'Единица измерения': equipment.unit || '',
                'Количество': equipment.quantity || '',
                'Примечания': equipment.notes || ''
              });
            });
          } else {
            // Add room without equipment
            excelData.push({
              'Этаж': floor.number,
              'Блок': department.block,
              'Отделение': department.name,
              'Код помещения': room.code,
              'Наименование помещения': room.name,
              'Площадь (м2)': room.area,
              'Код оборудования': '',
              'Наименование оборудования': '',
              'Единица измерения': '',
              'Количество': '',
              'Примечания': ''
            });
          }
        });
      });
    });

    // Create and download Excel file
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Проектировщики');
    XLSX.writeFile(workbook, 'floors_data.xlsx');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка данных проектировщиков...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-16">
          <div className="text-red-500">
            <p>Ошибка загрузки данных: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total statistics
  const totalStats = floors.reduce((acc, floor) => ({
    totalDepartments: acc.totalDepartments + (floor.stats.totalDepartments || 0),
    totalRooms: acc.totalRooms + (floor.stats.totalRooms || 0),
    totalEquipment: acc.totalEquipment + (floor.stats.totalEquipment || 0),
    totalArea: acc.totalArea + (floor.stats.totalArea || 0)
  }), { totalDepartments: 0, totalRooms: 0, totalEquipment: 0, totalArea: 0 });

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Проектировщики</h1>
        <p className="text-muted-foreground">Иерархическая навигация по этажам, блокам и кабинетам с возможностью редактирования оборудования</p>
      </div>

      <div className="max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Управление этажами и блоками</h1>
          <p className="text-muted-foreground">
            Иерархическая навигация по этажам → блокам → кабинетам с полным функционалом редактирования
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span><strong>{totalStats.totalDepartments}</strong> отделений</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span><strong>{totalStats.totalRooms}</strong> помещений</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span><strong>{totalStats.totalEquipment}</strong> ед. оборудования</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span><strong>{(totalStats.totalArea || 0).toFixed(1)}</strong> м² общая площадь</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={exportData} className="gap-2">
              <Download className="h-4 w-4" />
              Экспорт Проектировщики в Excel
            </Button>
          </div>
        </div>

        {/* Floors with Accordion */}
        <div className="space-y-6">
          {floors.map((floor) => (
            <Card key={floor.number} className="overflow-hidden">
              <Accordion 
                type="single" 
                collapsible 
                className="w-full"
                value={expandedFloors.includes(`floor-${floor.number}`) ? `floor-${floor.number}` : undefined}
                onValueChange={(value) => {
                  if (value) {
                    setExpandedFloors([value]);
                  } else {
                    setExpandedFloors([]);
                  }
                }}
              >
                <AccordionItem value={`floor-${floor.number}`} className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <h2 className="text-xl font-semibold">{floor.number} этаж</h2>
                        </div>
                      </div>
                       <div className="flex items-center gap-4 text-sm text-muted-foreground">
                         <span>{floor.stats.totalDepartments} отделений</span>
                         <span>{floor.stats.totalRooms} помещений</span>
                         <span>{floor.stats.totalEquipment} ед. оборуд.</span>
                         <span>{(floor.stats.totalArea || 0).toFixed(1)} м²</span>
                       </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-4">
                      {floor.departments.map((department, deptIndex) => (
                        <div key={deptIndex} className="border rounded-lg overflow-hidden">
                           <Accordion 
                            type="single" 
                            collapsible
                            value={expandedDepartments.includes(`dept-${deptIndex}`) ? `dept-${deptIndex}` : undefined}
                            onValueChange={(value) => {
                              if (value) {
                                setExpandedDepartments([value]);
                              } else {
                                setExpandedDepartments([]);
                              }
                            }}
                          >
                            <AccordionItem value={`dept-${deptIndex}`} className="border-none">
                               <AccordionTrigger className="px-4 py-3 bg-muted/30 hover:no-underline hover:bg-muted/50">
                                  <div className="flex items-center justify-between w-full mr-4">
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline" className="font-mono">
                                        Блок {department.block}
                                      </Badge>
                                       <span className="font-medium">{department.name}</span>
                                       <span className="text-sm text-muted-foreground">
                                         {department.rooms.length} помещений • {(department.totalArea || 0).toFixed(1)} м²
                                       </span>
                                       {/* Индикатор связи с Турар */}
                                       {(() => {
                                         const turarLink = getDepartmentTurarLink(department.name);
                                         return turarLink ? (
                                           <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                             <Link2 className="h-3 w-3 mr-1" />
                                             Турар: {turarLink}
                                           </Badge>
                                         ) : null;
                                       })()}
                                       {/* Индикатор связей на уровне отделения */}
                                       {roomConnections && (() => {
                                          const connectedRooms = department.rooms.filter(room => 
                                            roomConnections.some(conn => 
                                              conn.projector_department === department.name && 
                                              (conn.projector_room === room.name || conn.projector_room === room.code)
                                            )
                                          );
                                         return connectedRooms.length > 0 ? (
                                           <Badge variant="secondary" className="bg-green-500 text-white dark:bg-green-600 dark:text-white ml-2">
                                             <Link className="h-3 w-3 mr-1" />
                                             {connectedRooms.length} связанных комнат
                                           </Badge>
                                         ) : null;
                                       })()}
                                     </div>
                                     <div className="flex items-center gap-2">
                                       <Badge variant="secondary" className="text-xs">
                                         {department.equipmentCount} ед. оборуд.
                                       </Badge>
                                     </div>
                                  </div>
                                </AccordionTrigger>
                               <AccordionContent className="px-4 pb-4">
                                  {/* Блок связывания с отделениями Турар */}
                                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Link2 className="h-4 w-4 text-blue-600" />
                                      <span className="font-medium text-blue-800">Связать с отделением Турар</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Select
                                        value={departmentTurarSelections[department.name] || getDepartmentTurarLink(department.name) || ''}
                                        onValueChange={(value) => setDepartmentTurarSelections(prev => ({
                                          ...prev,
                                          [department.name]: value
                                        }))}
                                      >
                                        <SelectTrigger className="flex-1">
                                          <SelectValue placeholder="Выберите отделение Турар" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {turarDepartments.map((dept) => (
                                            <SelectItem key={dept} value={dept}>
                                              {dept}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveDepartmentLink(department.name)}
                                        disabled={
                                          !departmentTurarSelections[department.name] || 
                                          linkDepartmentMutation.isPending
                                        }
                                      >
                                        Сохранить
                                      </Button>
                                      {getDepartmentTurarLink(department.name) && (
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleRemoveDepartmentLink(department.name)}
                                          disabled={unlinkDepartmentMutation.isPending}
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          Удалить связь
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                   <div className="text-xs font-medium text-muted-foreground mb-2">
                                     КАБИНЕТЫ В ОТДЕЛЕНИИ:
                                   </div>
                                   <div className="grid grid-cols-1 gap-2">
                                      {department.rooms.map((room, roomIndex) => (
                                        <Accordion 
                                          key={roomIndex} 
                                          type="single" 
                                          collapsible
                                          value={expandedRooms.includes(`room-${roomIndex}`) ? `room-${roomIndex}` : undefined}
                                          onValueChange={(value) => {
                                            if (value) {
                                              setExpandedRooms([value]);
                                            } else {
                                              setExpandedRooms([]);
                                            }
                                          }}
                                        >
                                          <AccordionItem value={`room-${roomIndex}`} className="border border-border/50 rounded-lg">
                                             <AccordionTrigger className={`px-3 py-2 text-xs hover:no-underline hover:bg-muted/30 ${
                                               isRoomConnected(room, department.name) 
                                                 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''
                                             }`}>
                                               <div className="flex justify-between items-center w-full mr-4">
                                                 <div className="flex items-center gap-2 flex-1">
                                                   <MapPin className="h-3 w-3 text-muted-foreground" />
                                                   <span className="font-medium">{room.name}</span>
                                                   <Badge variant="outline" className="text-xs font-mono">{room.code}</Badge>
                                                      {(() => {
                                                         const connections = getRoomConnections(room, department.name);
                                                       return connections.length > 0 ? (
                                                         <div className="flex flex-wrap gap-1">
                                                       {connections.map((conn, idx) => (
                                                              <Badge key={idx} variant="secondary" className="bg-green-500 text-white dark:bg-green-600 dark:text-white text-xs font-semibold relative group">
                                                                <Link className="h-3 w-3 mr-1" />
                                                                {conn.turar_room}
                                                                <button 
                                                                  onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteConnectionMutation.mutate(conn.id); // deleteRoomConnectionMutation.mutate(conn.id);
                                                                  }}
                                                                  className="ml-1 hover:bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                  title="Удалить связь"
                                                                >
                                                                  <X className="h-2 w-2" />
                                                                </button>
                                                              </Badge>
                                                            ))}
                                                         </div>
                                                       ) : (
                                                         // Показываем индикатор "не связан" если есть доступное отделение Турар
                                                         getDepartmentTurarLink(department.name) ? (
                                                           <Badge variant="outline" className="text-xs text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600">
                                                             🔗 Не связан
                                                           </Badge>
                                                         ) : null
                                                       );
                                                     })()}
                                                 </div>
                                                 <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                   <span>{(room.area || 0).toFixed(1)} м²</span>
                                                   <Badge variant="secondary" className="text-xs">
                                                     {room.equipment.length} ед.
                                                   </Badge>
                                                 </div>
                                                </div>
                                             </AccordionTrigger>
                                             
                                              {(() => {
                                                 const connections = getRoomConnections(room, department.name);
                                               return connections.length > 0 ? (
                                                 <div className="px-3 py-2 border-t border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                                                   <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                                                     <Link className="h-4 w-4" />
                                                     Связано с кабинетами Турар:
                                                   </div>
                                                   <div className="space-y-2">
                                                      {connections.map((conn, connIndex) => (
                                                        <div key={connIndex} className="flex items-center justify-between bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 p-2 rounded-md border border-green-200 dark:border-green-700">
                                                          <div className="font-medium">
                                                            <div className="text-xs text-green-600 dark:text-green-300">→ {conn.turar_room}</div>
                                                          </div>
                                                          <button 
                                                            onClick={() => deleteConnectionMutation.mutate(conn.id)} // deleteRoomConnectionMutation.mutate(conn.id)
                                                            className="ml-2 hover:bg-red-500 text-red-600 hover:text-white rounded-full p-1 transition-colors"
                                                            title="Удалить связь"
                                                          >
                                                            <X className="h-3 w-3" />
                                                          </button>
                                                        </div>
                                                      ))}
                                                   </div>
                                                 </div>
                                               ) : (
                                                 // Показываем кнопку связывания если нет связей и есть связанное отделение Турар
                                                 (() => {
                                                   const connectedTurarDept = getDepartmentTurarLink(department.name);
                                                    // Проверяем есть ли уже связи для этого кабинета
                                                    const hasExistingConnections = roomConnections?.some(
                                                      conn => conn.projector_room === room.name && 
                                                              conn.projector_department === department.name
                                                    );

                                                    return connectedTurarDept ? (
                                                      <div className={`px-3 py-2 border-t ${
                                                        hasExistingConnections 
                                                          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
                                                          : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                                                      }`}>
                                                        <div className="flex items-center justify-between">
                                                          <div className={`text-sm ${
                                                            hasExistingConnections 
                                                              ? 'text-green-800 dark:text-green-200' 
                                                              : 'text-blue-800 dark:text-blue-200'
                                                          }`}>
                                                            {hasExistingConnections 
                                                              ? `✅ Добавить еще связи с: ${connectedTurarDept}` 
                                                              : `🔗 Связать с кабинетом из: ${connectedTurarDept}`
                                                            }
                                                          </div>
                                                            {/* <RoomLinkDropdown
                                                              roomId={room.code}
                                                              roomName={room.name}
                                                              departmentId={department.name}
                                                              departmentName={department.name}
                                                              connectedTurarDepartment={connectedTurarDept}
                                                              isProjectorDepartment={true}
                                                              onSuccess={() => {
                                                                console.log('✅ Связи созданы успешно');
                                                              }}
                                                            /> */}
                                                        </div>
                                                      </div>
                                                    ) : null;
                                                 })()
                                               );
                                             })()}
                                             
                                               <AccordionContent className="px-3 pb-3">
                                               <div className="mb-3 flex justify-between items-center">
                                                 <div className="text-xs text-muted-foreground">
                                                   💡 Используйте горизонтальную прокрутку для просмотра всех колонок таблицы
                                                 </div>
                                                 <Button
                                                   size="sm"
                                                   onClick={() => handleAddEquipment(department.name, room.name)}
                                                   className="gap-2"
                                                 >
                                                   <Plus className="h-3 w-3" />
                                                   Добавить оборудование
                                                 </Button>
                                                </div>
                                               {room.equipment.length > 0 ? (
                                                  <div className="rounded-lg border border-border/40 overflow-hidden">
                                                    {/* Контейнер с горизонтальной прокруткой */}
                                                    <div className="overflow-x-auto">
                                                      <table className="w-full text-xs border-collapse min-w-[800px]">
                                                        <thead className="bg-muted/30">
                                                          <tr>
                                                            <th className="text-left p-3 font-semibold border-r border-border/40 last:border-r-0 min-w-[120px]">Код оборудования</th>
                                                            <th className="text-left p-3 font-semibold border-r border-border/40 last:border-r-0 min-w-[200px]">Наименование оборудования</th>
                                                            <th className="text-center p-3 font-semibold border-r border-border/40 last:border-r-0 min-w-[80px]">Количество</th>
                                                            <th className="text-center p-3 font-semibold border-r border-border/40 last:border-r-0 min-w-[80px]">Ед. изм.</th>
                                                            <th className="text-center p-3 font-semibold border-r border-border/40 last:border-r-0 min-w-[120px]">Статус</th>
                                                            {isAdmin && <th className="text-center p-3 font-semibold border-r border-border/40 last:border-r-0 min-w-[150px]">Поставщик</th>}
                                                            {isAdmin && <th className="text-center p-3 font-semibold border-r border-border/40 last:border-r-0 min-w-[100px]">Цена (тенге)</th>}
                                                            <th className="text-center p-3 font-semibold border-r border-border/40 last:border-r-0 min-w-[150px]">Примечания</th>
                                                            <th className="text-center p-3 font-semibold min-w-[80px]">Действия</th>
                                                          </tr>
                                                        </thead>
                                                       <tbody>
                                                         {room.equipment.map((eq, eqIndex) => {
                                                           const urlSearchTerm = searchParams.get('search');
                                                           const urlDepartment = searchParams.get('department');
                                                           const urlRoom = searchParams.get('room');
                                                           
                                                           const isHighlighted = urlSearchTerm && 
                                                             urlDepartment === department.name && 
                                                             urlRoom === room.name && 
                                                             eq.name?.toLowerCase().includes(urlSearchTerm.toLowerCase()) &&
                                                             !highlightTimeout;

                                                           const equipmentId = isHighlighted ? 
                                                             `${urlDepartment}-${urlRoom}-${urlSearchTerm}`.replace(/\s+/g, '-').toLowerCase() : 
                                                             undefined;

                                                           return (
                                                             <tr 
                                                               key={eqIndex}
                                                               id={equipmentId}
                                                               className={`border-t border-border/40 transition-all duration-500 hover:bg-muted/50 ${
                                                                 isHighlighted 
                                                                   ? 'bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-400 dark:ring-yellow-500 shadow-lg animate-pulse' 
                                                                   : ''
                                                               }`}
                                                             >
                                                               <td className="p-3 font-mono text-xs border-r border-border/40 last:border-r-0">
                                                                 {eq.code || '-'}
                                                               </td>
                                                                <td className={`p-3 break-words transition-all duration-300 border-r border-border/40 last:border-r-0 ${
                                                                  isHighlighted 
                                                                    ? 'text-yellow-800 dark:text-yellow-200 font-bold text-sm bg-yellow-200 dark:bg-yellow-800/50 rounded' 
                                                                    : ''
                                                                }`}>
                                                                 {isHighlighted && <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-ping"></span>}
                                                                 {eq.name || '-'}
                                                               </td>
                                                               <td className="p-3 text-center border-r border-border/40 last:border-r-0">
                                                                 {eq.quantity || '-'}
                                                               </td>
                                                                <td className="p-3 text-center border-r border-border/40 last:border-r-0">
                                                                  {eq.unit || '-'}
                                                                </td>
                                                                <td className="p-3 text-center border-r border-border/40 last:border-r-0">
                                                                  {eq.equipment_status && (
                                                                    <Badge className={statusConfig[eq.equipment_status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                                                                      {statusConfig[eq.equipment_status as keyof typeof statusConfig]?.label || eq.equipment_status}
                                                                    </Badge>
                                                                  )}
                                                                </td>
                                                                {isAdmin && (
                                                                  <td className="p-3 text-center border-r border-border/40 last:border-r-0">
                                                                    {eq.equipment_supplier || '-'}
                                                                  </td>
                                                                )}
                                                                {isAdmin && (
                                                                  <td className="p-3 text-center border-r border-border/40 last:border-r-0">
                                                                    {eq.equipment_price ? `${eq.equipment_price.toLocaleString()} тенге` : '-'}
                                                                  </td>
                                                                )}
                                                                <td className="p-3 text-center border-r border-border/40 last:border-r-0">
                                                                  {eq.notes && (
                                                                    <Badge 
                                                                      variant={isHighlighted ? "default" : "secondary"} 
                                                                      className="text-xs h-5"
                                                                    >
                                                                      {eq.notes}
                                                                    </Badge>
                                                                  )}
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                  <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleEditEquipment(eq, department.name, room.name)}
                                                                    className="p-1 h-auto"
                                                                  >
                                                                    <Edit className="h-3 w-3" />
                                                                  </Button>
                                                                </td>
                                                             </tr>
                                                           );
                                                         })}
                                                       </tbody>
                                                      </table>
                                                    </div>
                                                  </div>
                                                 ) : (
                                                   <div className="text-center py-6 text-muted-foreground text-xs space-y-3">
                                                     <div>📦 Оборудование не указано</div>
                                                     <Button
                                                       size="sm"
                                                       onClick={() => handleAddEquipment(department.name, room.name)}
                                                       className="gap-2"
                                                     >
                                                       <Plus className="h-3 w-3" />
                                                       Добавить первое оборудование
                                                     </Button>
                                                   </div>
                                                 )}
                                             </AccordionContent>
                                          </AccordionItem>
                                        </Accordion>
                                      ))}
                                    </div>
                                  </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          ))}
        </div>
      </div>

      {/* Диалог редактирования оборудования */}
      <EditEquipmentDialog
        equipment={editingEquipment}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingEquipment(null);
          setIsAddingEquipment(false);
          setAddingToRoom(null);
        }}
        onSave={handleSaveEquipment}
        isNew={isAddingEquipment}
      />
    </div>
  );
}

// Компонент для отображения оборудования с возможностью редактирования
const EquipmentSection: React.FC<{
  department: string;
  room: string;
  equipment: Equipment[];
  onEditEquipment: (equipment: any, department: string, room: string) => void;
  isAdmin: boolean;
}> = ({ department, room, equipment, onEditEquipment, isAdmin }) => {
  const { data: dbEquipment, isLoading } = useProjectorRoomEquipment(department, room);

  if (isLoading) {
    return <div className="text-xs text-muted-foreground">Загрузка оборудования...</div>;
  }

  // Комбинируем данные из файла и базы данных
  const allEquipment = [...equipment];
  
  if (dbEquipment) {
    dbEquipment.forEach(dbItem => {
      // Проверяем, есть ли уже такое оборудование в списке из файла
      const existingIndex = allEquipment.findIndex(eq => 
        eq.code === dbItem["Код оборудования"] && eq.name === dbItem["Наименование оборудования"]
      );
      
      if (existingIndex >= 0) {
        // Обновляем существующее с данными из БД
        allEquipment[existingIndex] = {
          ...allEquipment[existingIndex],
          equipment_status: dbItem.equipment_status,
          equipment_specification: dbItem.equipment_specification,
          equipment_documents: dbItem.equipment_documents
        };
      } else if (dbItem["Наименование оборудования"]) {
        // Добавляем новое оборудование из БД
        allEquipment.push({
          code: dbItem["Код оборудования"],
          name: dbItem["Наименование оборудования"],
          unit: dbItem["Ед. изм."],
          quantity: dbItem["Кол-во"],
          notes: dbItem["Примечания"],
          equipment_status: dbItem.equipment_status,
          equipment_specification: dbItem.equipment_specification,
          equipment_documents: dbItem.equipment_documents,
          id: dbItem.id
        });
      }
    });
  }

  if (allEquipment.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
        📦 В кабинете нет зарегистрированного оборудования
      </div>
    );
  }

  return (
    <div className="grid gap-1">
      {allEquipment.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between p-2 rounded border text-xs bg-muted/20 border-border/50 hover:border-blue-200 transition-colors">
          <div className="flex-1">
            <div className="font-medium text-foreground">{item.name}</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Код: {item.code || 'Не указан'} | Количество: {item.quantity || 'Не указано'} {item.unit || ''}</div>
              {(item as any).equipment_specification && (
                <div>Спецификация: {(item as any).equipment_specification}</div>
              )}
              {(item as any).equipment_documents && (
                <div>Документы: {(item as any).equipment_documents}</div>
              )}
              {isAdmin && (item as any).equipment_supplier && (
                <div className="text-blue-600">Поставщик: {(item as any).equipment_supplier}</div>
              )}
              {isAdmin && (item as any).equipment_price && (
                <div className="text-blue-600">Цена: {(item as any).equipment_price.toLocaleString()} руб.</div>
              )}
              {item.notes && (
                <div>Примечания: {item.notes}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {(item as any).equipment_status && (
              <Badge className={statusConfig[(item as any).equipment_status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                {statusConfig[(item as any).equipment_status as keyof typeof statusConfig]?.label || (item as any).equipment_status}
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEditEquipment({
                ...(item as any),
                id: (item as any).id || '',
                "Код оборудования": item.code,
                "Наименование оборудования": item.name,
                "Кол-во": item.quantity,
                "Ед. изм.": item.unit,
                "Примечания": item.notes,
              }, department, room)}
              className="p-1 h-auto"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};