import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Download, Plus, MapPin, Users, Link, Edit, Link2, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { useSearchParams } from 'react-router-dom';
import { useFloorsData } from '@/hooks/useFloorsData';
import { useRoomConnections } from '@/hooks/useRoomConnections';
import { useProjectorRoomEquipment, useUpdateProjectorEquipment, useAddProjectorEquipment, ProjectorEquipmentItem } from '@/hooks/useProjectorEquipment';
import EditEquipmentDialog from '@/components/EditEquipmentDialog';
import TurarDepartmentSelector from '@/components/TurarDepartmentSelector';
import TurarRoomSelector from '@/components/TurarRoomSelector';
import { useCreateRoomConnection, useDeleteRoomConnection, RoomConnection } from '@/hooks/useRoomConnections';
import { useLinkDepartmentToTurar, useUnlinkDepartmentFromTurar } from '@/hooks/useDepartmentTurarLink';
import { useDepartmentMappings } from '@/hooks/useDepartmentMappings';
import { useDeleteRoomConnectionById } from "@/hooks/useRoomConnectionsById";
import { useTurarMedicalData } from '@/hooks/useTurarMedicalData';
import { useCleanupUnknownRooms } from '@/hooks/useCleanupUnknownRooms';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import RoomLinkDropdown from '@/components/RoomLinkDropdown';
import { useProjectorDepartmentTurarLink } from '@/hooks/useProjectorDepartmentTurarLink';
import { useUserRole } from '@/hooks/useUserRole';
import { BulkEquipmentTable } from '@/components/BulkEquipmentTable';
import * as XLSX from 'xlsx';

// Interface definitions
interface FloorData {
  "ЭТАЖ": number;
  "БЛОК": string;
  "ОТДЕЛЕНИЕ": string;
  "КОД ПОМЕЩЕНИЯ": string;
  "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": string;
  "Код помещения": string;
  "Наименование помещения": string;
  "Площадь (м2)": number;
  "Код оборудования": string | null;
  "Наименование оборудования": string | null;
  "Ед. изм.": string | null;
  "Кол-во": number | string | null;
  "Примечания": string | null;
}

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

// Статусы и их цвета
const statusConfig = {
  'Согласовано': { label: 'Согласовано', color: 'bg-green-100 text-green-800 border-green-200' },
  'Не согласовано': { label: 'Не согласовано', color: 'bg-red-100 text-red-800 border-red-200' },
  'Не найдено': { label: 'Не найдено', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
};

const processFloorsData = (data: FloorData[]): any[] => {
  const floorMap = new Map();

  data.forEach(item => {
    const floorNumber = item["ЭТАЖ"];
    const block = item["БЛОК"];
    const department = item["ОТДЕЛЕНИЕ"];
    const roomCode = item["КОД ПОМЕЩЕНИЯ"];
    const roomName = item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"];
    const roomArea = item["Площадь (м2)"] || 0;

    if (!floorMap.has(floorNumber)) {
      floorMap.set(floorNumber, {
        number: floorNumber,
        blocks: new Map()
      });
    }

    const floor = floorMap.get(floorNumber);

    if (!floor.blocks.has(block)) {
      floor.blocks.set(block, {
        name: block,
        departments: new Map()
      });
    }

    const blockData = floor.blocks.get(block);

    if (!blockData.departments.has(department)) {
      blockData.departments.set(department, {
        name: department,
        rooms: new Map(),
        totalEquipment: 0,
        totalArea: 0
      });
    }

    const departmentData = blockData.departments.get(department);

    if (!departmentData.rooms.has(roomCode)) {
      departmentData.rooms.set(roomCode, {
        code: roomCode,
        name: roomName,
        area: roomArea,
        equipment: []
      });
    }

    const room = departmentData.rooms.get(roomCode);

    if (item["Наименование оборудования"]) {
      const equipment: Equipment = {
        code: item["Код оборудования"],
        name: item["Наименование оборудования"],
        unit: item["Ед. изм."],
        quantity: item["Кол-во"],
        notes: item["Примечания"]
      };
      
      room.equipment.push(equipment);
      departmentData.totalEquipment += 1;
    }

    departmentData.totalArea += roomArea;
  });

  const floors: any[] = [];
  floorMap.forEach((floorData, floorNumber) => {
    const blocks: any[] = [];
    
    floorData.blocks.forEach((blockData: any, blockName: string) => {
      const departments: any[] = [];
      
      blockData.departments.forEach((deptData: any, deptName: string) => {
        const rooms = Array.from(deptData.rooms.values());
        
        departments.push({
          name: deptName,
          rooms: rooms,
          totalEquipment: deptData.totalEquipment,
          totalArea: deptData.totalArea
        });
      });

      blocks.push({
        name: blockName,
        departments: departments
      });
    });

    floors.push({
      number: floorNumber,
      blocks: blocks,
      stats: {
        totalRooms: Array.from(floorData.blocks.values()).reduce((sum: number, block: any) => {
          const deptCount: number = Array.from(block.departments.values()).reduce((deptSum: number, dept: any): number => {
            return deptSum + (dept.rooms ? dept.rooms.size : 0);
          }, 0);
          return sum + deptCount;
        }, 0),
        totalEquipment: Array.from(floorData.blocks.values()).reduce((sum: number, block: any) => {
          const equipCount: number = Array.from(block.departments.values()).reduce((deptSum: number, dept: any): number => {
            return deptSum + (dept.totalEquipment || 0);
          }, 0);
          return sum + equipCount;
        }, 0),
        totalArea: Array.from(floorData.blocks.values()).reduce((sum: number, block: any) => {
          const areaSum: number = Array.from(block.departments.values()).reduce((deptSum: number, dept: any): number => {
            return deptSum + (dept.totalArea || 0);
          }, 0);
          return sum + areaSum;
        }, 0)
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
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedTurarDepartment, setSelectedTurarDepartment] = useState<string>('');
  const [selectedTurarRoom, setSelectedTurarRoom] = useState<string>('');
  const [isBulkTableOpen, setIsBulkTableOpen] = useState(false);
  const [bulkEditingRoom, setBulkEditingRoom] = useState<{ department: string; room: string } | null>(null);

  const { toast } = useToast();

  const updateProjectorEquipment = useUpdateProjectorEquipment();
  const addProjectorEquipment = useAddProjectorEquipment();
  const createRoomConnection = useCreateRoomConnection();
  const deleteRoomConnection = useDeleteRoomConnection();
  const linkDepartmentToTurar = useLinkDepartmentToTurar();
  const unlinkDepartmentFromTurar = useUnlinkDepartmentFromTurar();
  const deleteRoomConnectionById = useDeleteRoomConnectionById();
  const { data: turarData } = useTurarMedicalData();
  const cleanupUnknownRooms = useCleanupUnknownRooms();
  const { data: projectorDepartmentLinks } = useDepartmentMappings();

  const [openDepartments, setOpenDepartments] = useState<Set<string>>(new Set());

  useEffect(() => {
    const floor = searchParams.get('floor');
    const block = searchParams.get('block');
    const department = searchParams.get('department');
    
    if (floor) setSelectedFloor(floor);
    if (block) setSelectedBlock(block);
    if (department) {
      setSelectedDepartment(department);
      setOpenDepartments(prev => new Set([...prev, department]));
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Загрузка данных...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Ошибка загрузки данных: {error.message}</div>
        </div>
      </div>
    );
  }

  const processedData = allData ? processFloorsData(allData) : [];

  const getRoomConnections = (department: string, room: string): RoomConnection[] => {
    if (!roomConnections) return [];
    return roomConnections.filter(conn => 
      conn.projector_department === department && conn.projector_room === room
    );
  };

  const handleEditEquipment = (equipment: any, department: string, room: string) => {
    console.log('Editing equipment:', equipment);
    setEditingEquipment({
      ...equipment,
      department,
      room
    });
    setIsEditDialogOpen(true);
    setIsAddingEquipment(false);
  };

  const handleAddEquipment = (department: string, room: string) => {
    console.log('Adding equipment to:', department, room);
    setAddingToRoom({ department, room });
    setEditingEquipment({
      "Код оборудования": '',
      "Наименование оборудования": '',
      "Кол-во": '',
      "Ед. изм.": '',
      "Примечания": '',
      department,
      room
    });
    setIsEditDialogOpen(true);
    setIsAddingEquipment(true);
  };

  const handleSaveEquipment = async (equipmentData: any) => {
    console.log('Saving equipment:', equipmentData);
    try {
      if (isAddingEquipment) {
        const newEquipment: Omit<ProjectorEquipmentItem, 'id' | 'created_at' | 'updated_at'> = {
          "ОТДЕЛЕНИЕ": equipmentData.department,
          "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": equipmentData.room,
          "КОД ПОМЕЩЕНИЯ": equipmentData.room,
          "ЭТАЖ": 1, // Default floor
          "БЛОК": "A", // Default block
          "Код оборудования": equipmentData["Код оборудования"],
          "Наименование оборудования": equipmentData["Наименование оборудования"],
          "Кол-во": equipmentData["Кол-во"],
          "Ед. изм.": equipmentData["Ед. изм."],
          "Примечания": equipmentData["Примечания"],
          equipment_status: equipmentData.equipment_status || 'Не согласовано',
          equipment_specification: equipmentData.equipment_specification || '',
          equipment_documents: equipmentData.equipment_documents || '',
          equipment_supplier: equipmentData.equipment_supplier || '',
          equipment_price: parseFloat(equipmentData.equipment_price) || 0
        };
        
        await addProjectorEquipment.mutateAsync(newEquipment);
        toast({
          title: "Успех",
          description: "Оборудование добавлено успешно"
        });
      } else {
        const updatedEquipment: ProjectorEquipmentItem = {
          ...equipmentData,
          "ОТДЕЛЕНИЕ": equipmentData.department,
          "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": equipmentData.room,
          "КОД ПОМЕЩЕНИЯ": equipmentData.room,
          "ЭТАЖ": 1,
          "БЛОК": "A",
          equipment_status: equipmentData.equipment_status || 'Не согласовано',
          equipment_specification: equipmentData.equipment_specification || '',
          equipment_documents: equipmentData.equipment_documents || '',
          equipment_supplier: equipmentData.equipment_supplier || '',
          equipment_price: parseFloat(equipmentData.equipment_price) || 0
        };
        
        await updateProjectorEquipment.mutateAsync(updatedEquipment);
        toast({
          title: "Успех",
          description: "Оборудование обновлено успешно"
        });
      }
      
      setIsEditDialogOpen(false);
      setEditingEquipment(null);
      setIsAddingEquipment(false);
      setAddingToRoom(null);
      refetch();
    } catch (error) {
      console.error('Error saving equipment:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить оборудование",
        variant: "destructive"
      });
    }
  };

  const handleLinkRoom = async (department: string, room: string, turarDepartment: string, turarRoom: string) => {
    try {
      await createRoomConnection.mutateAsync({
        projector_department: department,
        projector_room: room,
        turar_department: turarDepartment,
        turar_room: turarRoom
      });
      
      toast({
        title: "Успех",
        description: "Помещение успешно связано"
      });
      
      setSelectedTurarDepartment('');
      setSelectedTurarRoom('');
    } catch (error) {
      console.error('Error linking room:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось связать помещение",
        variant: "destructive"
      });
    }
  };

  const handleUnlinkRoom = async (connectionId: string) => {
    try {
      await deleteRoomConnectionById.mutateAsync(connectionId);
      toast({
        title: "Успех",
        description: "Связь помещения удалена"
      });
    } catch (error) {
      console.error('Error unlinking room:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить связь помещения",
        variant: "destructive"
      });
    }
  };

  const handleLinkDepartment = async (department: string, turarDepartment: string) => {
    try {
      await linkDepartmentToTurar.mutateAsync({
        departmentName: department,
        turarDepartment
      });
      
      toast({
        title: "Успех",
        description: "Отделение успешно связано"
      });
    } catch (error) {
      console.error('Error linking department:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось связать отделение",
        variant: "destructive"
      });
    }
  };

  const handleUnlinkDepartment = async (department: string) => {
    try {
      await unlinkDepartmentFromTurar.mutateAsync(department);
      toast({
        title: "Успех",
        description: "Связь отделения удалена"
      });
    } catch (error) {
      console.error('Error unlinking department:', error);
      toast({
        title: "Ошибка", 
        description: "Не удалось удалить связь отделения",
        variant: "destructive"
      });
    }
  };

  const handleExportFloorData = () => {
    if (!allData || allData.length === 0) {
      toast({
        title: "Предупреждение",
        description: "Нет данных для экспорта",
        variant: "destructive"
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(allData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Этажи");
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
    
    XLSX.writeFile(workbook, `floors_data_${timestamp}.xlsx`);
    
    toast({
      title: "Успех",
      description: "Данные экспортированы в Excel файл"
    });
  };

  const handleCleanupUnknownRooms = async () => {
    try {
      await cleanupUnknownRooms.mutateAsync();
      toast({
        title: "Успех",
        description: "Неизвестные помещения очищены"
      });
    } catch (error) {
      console.error('Error cleaning up unknown rooms:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось очистить неизвестные помещения",
        variant: "destructive"
      });
    }
  };

  const handleBulkAdd = (department: string, room: string) => {
    setBulkEditingRoom({ department, room });
    setIsBulkTableOpen(true);
  };

  const handleBulkSave = async (equipmentList: any[]) => {
    if (!bulkEditingRoom) return;
    
    try {
      const promises = equipmentList.map(equipment => {
        const newEquipment: Omit<ProjectorEquipmentItem, 'id' | 'created_at' | 'updated_at'> = {
          "ОТДЕЛЕНИЕ": bulkEditingRoom.department,
          "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": bulkEditingRoom.room,
          "КОД ПОМЕЩЕНИЯ": bulkEditingRoom.room,
          "ЭТАЖ": 1,
          "БЛОК": "A",
          "Код оборудования": equipment["Код оборудования"] || '',
          "Наименование оборудования": equipment["Наименование оборудования"] || '',
          "Кол-во": equipment["Кол-во"] || '',
          "Ед. изм.": equipment["Ед. изм."] || '',
          "Примечания": equipment["Примечания"] || '',
          equipment_status: equipment.equipment_status || 'Не согласовано',
          equipment_specification: equipment.equipment_specification || '',
          equipment_documents: equipment.equipment_documents || '',
          equipment_supplier: isAdmin ? equipment.equipment_supplier || '' : '',
          equipment_price: isAdmin ? parseFloat(equipment.equipment_price) || 0 : 0
        };
        
        return addProjectorEquipment.mutateAsync(newEquipment);
      });
      
      await Promise.all(promises);
      
      toast({
        title: "Успех",
        description: `Добавлено ${equipmentList.length} единиц оборудования`
      });
      
      setIsBulkTableOpen(false);
      setBulkEditingRoom(null);
      refetch();
    } catch (error) {
      console.error('Error bulk saving equipment:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить оборудование",
        variant: "destructive"
      });
    }
  };

  const toggleDepartment = (department: string) => {
    setOpenDepartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(department)) {
        newSet.delete(department);
      } else {
        newSet.add(department);
      }
      return newSet;
    });
  };

  const getDepartmentTurarLink = (department: string) => {
    if (!projectorDepartmentLinks) return null;
    return projectorDepartmentLinks?.find(link => link.projector_department === department);
  };

  // Фильтрация данных
  const filteredData = processedData.filter(floor => {
    if (selectedFloor && floor.number.toString() !== selectedFloor) return false;
    
    floor.blocks = floor.blocks.filter((block: any) => {
      if (selectedBlock && block.name !== selectedBlock) return false;
      
      block.departments = block.departments.filter((department: any) => {
        if (selectedDepartment && department.name !== selectedDepartment) return false;
        return true;
      });
      
      return block.departments.length > 0;
    });
    
    return floor.blocks.length > 0;
  });

  // Получение уникальных значений для фильтров
  const uniqueFloors = [...new Set(processedData.map(floor => floor.number.toString()))].sort();
  const uniqueBlocks = [...new Set(processedData.flatMap(floor => 
    floor.blocks.map((block: any) => block.name)
  ))].sort();
  const uniqueDepartments = [...new Set(processedData.flatMap(floor => 
    floor.blocks.flatMap((block: any) => 
      block.departments.map((dept: any) => dept.name)
    )
  ))].sort();

  return (
    <>
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Управление этажами
          </h1>
          <p className="text-muted-foreground mt-2">
            Просмотр и управление помещениями и оборудованием по этажам
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportFloorData}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт данных
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={handleCleanupUnknownRooms}>
              <X className="h-4 w-4 mr-2" />
              Очистить неизвестные
            </Button>
          )}
        </div>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Этаж</label>
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger>
                  <SelectValue placeholder="Все этажи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все этажи</SelectItem>
                  {uniqueFloors.map(floor => (
                    <SelectItem key={floor} value={floor}>{floor} этаж</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Блок</label>
              <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                <SelectTrigger>
                  <SelectValue placeholder="Все блоки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все блоки</SelectItem>
                  {uniqueBlocks.map(block => (
                    <SelectItem key={block} value={block}>{block}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Отделение</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Все отделения" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все отделения</SelectItem>
                  {uniqueDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {(selectedFloor || selectedBlock || selectedDepartment) && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedFloor('');
                  setSelectedBlock('');
                  setSelectedDepartment('');
                }}
              >
                Очистить фильтры
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Данные этажей */}
      <div className="space-y-6">
        {filteredData.map((floor) => (
          <Card key={floor.number} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {floor.number} этаж
              </CardTitle>
              <CardDescription>
                Общая площадь: {floor.stats?.totalArea?.toLocaleString() || 0} м²
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="multiple" className="w-full">
                {floor.blocks.map((block: any) => (
                  <AccordionItem key={block.name} value={block.name} className="border-0">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">Блок {block.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {block.departments.length} отделений
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                      <div className="space-y-0">
                        {block.departments.map((department: any) => {
                          const departmentTurarLink = getDepartmentTurarLink(department.name);
                          const isOpen = openDepartments.has(department.name);
                          
                          return (
                            <Accordion key={department.name} type="multiple" className="w-full border-0">
                              <AccordionItem value={department.name} className="border-0">
                                <AccordionTrigger 
                                  className="px-6 py-3 hover:no-underline hover:bg-muted/20 border-t"
                                  onClick={() => toggleDepartment(department.name)}
                                >
                                  <div className="flex items-center justify-between w-full mr-4">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      <span className="font-medium">{department.name}</span>
                                      <Badge variant="outline" className="ml-2">
                                        {department.rooms.length} помещений
                                      </Badge>
                                      <Badge variant="outline">
                                        {department.totalEquipment} ед. оборудования
                                      </Badge>
                                      <Badge variant="outline">
                                        {department.totalArea.toLocaleString()} м²
                                      </Badge>
                                      {departmentTurarLink && (
                                        <Badge className="bg-green-100 text-green-800 border-green-200">
                                          <Link2 className="h-3 w-3 mr-1" />
                                          Связано с ТУРАР
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {!departmentTurarLink && (
                                        <TurarDepartmentSelector
                                          value={selectedTurarDepartment}
                                          onValueChange={(turarDept) => handleLinkDepartment(department.name, turarDept)}
                                        />
                                      )}
                                      {departmentTurarLink && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUnlinkDepartment(department.name);
                                          }}
                                        >
                                          <X className="h-4 w-4 mr-1" />
                                          Отвязать
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-0 pb-0">
                                  <div className="bg-muted/10 border-t">
                                    <div className="space-y-0">
                                      {department.rooms.map((room: any) => {
                                        const connections = getRoomConnections(department.name, room.code);
                                        
                                        return (
                                          <Accordion key={room.code} type="multiple" className="border-0">
                                            <AccordionItem value={room.code} className="border-0">
                                              <AccordionTrigger className="px-8 py-3 hover:no-underline hover:bg-muted/30 border-t border-border/50">
                                                <div className="flex items-center justify-between w-full mr-4">
                                                  <div className="flex items-center gap-2">
                                                    <span className="font-medium">{room.code}</span>
                                                    <span className="text-muted-foreground">—</span>
                                                    <span className="text-sm">{room.name}</span>
                                                    <Badge variant="outline" className="ml-2">
                                                      {room.area.toLocaleString()} м²
                                                    </Badge>
                                                    <Badge variant="outline">
                                                      {room.equipment.length} ед. оборудования
                                                    </Badge>
                                                    {connections.length > 0 && (
                                                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                                        <Link2 className="h-3 w-3 mr-1" />
                                                        Связано
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleBulkAdd(department.name, room.code);
                                                      }}
                                                      className="text-blue-600 hover:text-blue-700"
                                                    >
                                                      <Plus className="h-4 w-4 mr-1" />
                                                      Массовое добавление
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddEquipment(department.name, room.code);
                                                      }}
                                                      className="text-blue-600 hover:text-blue-700"
                                                    >
                                                      <Plus className="h-4 w-4 mr-1" />
                                                      Добавить оборудование
                                                    </Button>
                                                  </div>
                                                </div>
                                              </AccordionTrigger>
                                              <AccordionContent className="px-8 pb-4">
                                                <EquipmentSection
                                                  department={department.name}
                                                  room={room.code}
                                                  equipment={room.equipment}
                                                  onEditEquipment={handleEditEquipment}
                                                  isAdmin={isAdmin}
                                                />
                                              </AccordionContent>
                                            </AccordionItem>
                                          </Accordion>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
            </Card>
          ))}
        </div>
      </div>

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
      
      {bulkEditingRoom && (
        <BulkEquipmentTable
          department={bulkEditingRoom.department}
          room={bulkEditingRoom.room}
          isOpen={isBulkTableOpen}
          onClose={() => {
            setIsBulkTableOpen(false);
            setBulkEditingRoom(null);
          }}
          onSave={handleBulkSave}
        />
      )}
    </>
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
          equipment_documents: dbItem.equipment_documents,
          equipment_supplier: dbItem.equipment_supplier,
          equipment_price: dbItem.equipment_price,
          id: dbItem.id
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
          equipment_supplier: dbItem.equipment_supplier,
          equipment_price: dbItem.equipment_price,
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
              {item.equipment_specification && (
                <div>Спецификация: {item.equipment_specification}</div>
              )}
              {item.equipment_documents && (
                <div>Документы: {item.equipment_documents}</div>
              )}
              {isAdmin && item.equipment_supplier && (
                <div className="text-blue-600">Поставщик: {item.equipment_supplier}</div>
              )}
              {isAdmin && item.equipment_price && (
                <div className="text-blue-600">Цена: {item.equipment_price.toLocaleString()} руб.</div>
              )}
              {item.notes && (
                <div>Примечания: {item.notes}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {item.equipment_status && (
              <Badge className={statusConfig[item.equipment_status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                {statusConfig[item.equipment_status as keyof typeof statusConfig]?.label || item.equipment_status}
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEditEquipment({
                ...item,
                id: item.id || '',
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