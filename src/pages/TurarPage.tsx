import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EditDepartmentDialog } from '@/components/EditDepartmentDialog';
import { EditRoomDialog } from '@/components/EditRoomDialog';

import { Building2, Users, MapPin, Download, Search, Package, Link, Link2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTurarMedicalData } from '@/hooks/useTurarMedicalData';
import { useRoomConnections } from '@/hooks/useRoomConnections';
import { useProjectorData } from '@/hooks/useProjectorData';
import { useLinkDepartmentToTurar, useUnlinkDepartmentFromTurar } from '@/hooks/useDepartmentTurarLink';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TurarRoomLinkDropdown from '@/components/TurarRoomLinkDropdown';
import MultiSelectProjectorDepartments from '@/components/MultiSelectProjectorDepartments';
import * as XLSX from 'xlsx';

// Define the interface for Turar equipment data
interface TurarEquipment {
  "Отделение/Блок": string;
  "Помещение/Кабинет": string;
  "Код оборудования": string;
  "Наименование": string;
  "Кол-во": number;
}

// Define the interface for a processed department
interface TurarDepartment {
  name: string;
  rooms: {
    name: string;
    equipment: any[];
  }[];
}

const TurarPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: turarData, isLoading, error } = useTurarMedicalData();
  const { data: roomConnections } = useRoomConnections();
  const { data: projectorData, isLoading: projectorLoading, error: projectorError } = useProjectorData();
  const [departments, setDepartments] = useState<TurarDepartment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [highlightTimeout, setHighlightTimeout] = useState<boolean>(false);
  const [targetEquipmentId, setTargetEquipmentId] = useState<string | null>(null);
  const [departmentProjectorSelections, setDepartmentProjectorSelections] = useState<Record<string, string>>({});
  
  const linkDepartmentMutation = useLinkDepartmentToTurar();
  const unlinkDepartmentMutation = useUnlinkDepartmentFromTurar();
  const [isBulkCreating, setIsBulkCreating] = useState(false);

  useEffect(() => {
    if (turarData) {
      // Process data to group by departments and rooms
      const processedData = processTurarData(turarData);
      setDepartments(processedData);
      
      console.log('🔍 Sample turar data with connections:', turarData.slice(0, 2));
      console.log('🔗 Room connections data:', roomConnections);
      console.log('🔗 Projector data loaded:', !!projectorData, 'Records count:', projectorData?.length);
      console.log('🔗 Projector data with turar connections:', projectorData?.filter(item => item.connected_turar_department).length);
      console.log('📊 Unique turar departments in projector data:', [...new Set(projectorData?.filter(item => item.connected_turar_department).map(item => item.connected_turar_department))]);
      
      // Тестируем функцию getDepartmentProjectorLinks
      processedData.forEach(dept => {
        const links = getDepartmentProjectorLinks(dept.name);
        if (links.length > 0) {
          console.log(`🔗 Department "${dept.name}" has ${links.length} projector links:`, links);
        }
      });
      
      console.log('📊 All room connections:', roomConnections?.map(conn => ({ 
        turar_dept: conn.turar_department, 
        projector_dept: conn.projector_department,
        turar_room: conn.turar_room,
        projector_room: conn.projector_room
      })));
      console.log('📊 Turar departments:', processedData.map(d => ({ name: d.name, roomCount: d.rooms.length })));
      
      // Handle search params from URL
      const urlSearchTerm = searchParams.get('search');
      const urlDepartment = searchParams.get('department');
      const urlRoom = searchParams.get('room');
      
      console.log('TurarPage URL params:', { urlSearchTerm, urlDepartment, urlRoom });
      
      if (urlSearchTerm && urlDepartment) {
        setSearchTerm(urlSearchTerm);
        setHighlightTimeout(false); // Reset highlight
        
        // Auto-expand relevant sections based on original data, not filtered
        const deptIndex = processedData.findIndex(dept => dept.name === urlDepartment);
        console.log('Found department index:', deptIndex, 'for department:', urlDepartment);
        console.log('Available departments:', processedData.map(d => d.name));
        
        if (deptIndex !== -1) {
          setExpandedDepartments([`dept-${deptIndex}`]);
          console.log('Expanded departments:', [`dept-${deptIndex}`]);
          
          if (urlRoom) {
            const roomIndex = processedData[deptIndex]?.rooms.findIndex(room => room.name === urlRoom);
            console.log('Found room index:', roomIndex, 'for room:', urlRoom);
            console.log('Available rooms:', processedData[deptIndex]?.rooms.map(r => r.name));
            if (roomIndex !== -1) {
              setExpandedRooms([`room-${deptIndex}-${roomIndex}`]);
              console.log('Expanded rooms:', [`room-${deptIndex}-${roomIndex}`]);
              
              // Set target equipment for scrolling
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
              }, 800);
            }
          }
        }
        
        // Auto-remove highlight after 3 seconds
        setTimeout(() => setHighlightTimeout(true), 3000);
      }
    }
  }, [turarData, searchParams]);

  // Функция для получения связанных отделений проектировщиков для отделения Турар
  const getDepartmentProjectorLinks = (turarDepartmentName: string): string[] => {
    if (!projectorData && !roomConnections) return [];
    
    // Получаем связи из таблицы room_connections (новый способ)
    const connectionsFromTable = roomConnections
      ?.filter(conn => conn.turar_department === turarDepartmentName)
      ?.map(conn => conn.projector_department) || [];
    
    // Получаем связи из projector_floors (старый способ)
    const connectionsFromProjector = projectorData
      ?.filter(item => item.connected_turar_department === turarDepartmentName)
      ?.map(item => item["ОТДЕЛЕНИЕ"]) || [];
    
    // Объединяем и убираем дубликаты
    const allConnections = [...connectionsFromTable, ...connectionsFromProjector];
    const uniqueConnections = [...new Set(allConnections)];
    
    // Логирование для отладки
    if (uniqueConnections.length > 0) {
      console.log(`🔗 Department "${turarDepartmentName}" connections:`, {
        fromTable: connectionsFromTable,
        fromProjector: connectionsFromProjector,
        final: uniqueConnections
      });
    }
    
    return uniqueConnections;
  };

  // Функция для проверки, есть ли связь между отделениями (в любом направлении)
  const hasDepartmentConnection = (turarDept: string, projectorDept: string): boolean => {
    // Проверяем room_connections
    const roomConnection = roomConnections?.some(conn => 
      conn.turar_department === turarDept && conn.projector_department === projectorDept
    );
    
    // Проверяем прямые связи отделений в projector_floors
    const directConnection = projectorData?.some(item => 
      item["ОТДЕЛЕНИЕ"] === projectorDept && item.connected_turar_department === turarDept
    );
    
    return roomConnection || directConnection;
  };

  // Получение ВСЕХ уникальных отделений проектировщиков
  const projectorDepartments = React.useMemo(() => {
    console.log('🏗️ ProjectorData state:', {
      loading: projectorLoading,
      error: projectorError,
      hasData: !!projectorData,
      dataLength: projectorData?.length || 0
    });
    
    if (projectorLoading) {
      console.log('🏗️ Projector data is still loading...');
      return [];
    }
    
    if (projectorError) {
      console.error('🏗️ Projector data error:', projectorError);
      return [];
    }
    
    if (!projectorData || projectorData.length === 0) {
      console.log('🏗️ No projector data available');
      return [];
    }
    
    console.log('🏗️ Processing projector data, total records:', projectorData.length);
    console.log('🏗️ Sample projector records:', projectorData.slice(0, 3));
    
    const departments = new Set<string>();
    let processedCount = 0;
    let emptyCount = 0;
    
    projectorData.forEach((item, index) => {
      const dept = item["ОТДЕЛЕНИЕ"];
      if (dept && typeof dept === 'string' && dept.trim().length > 0) {
        const cleanDept = dept.trim();
        departments.add(cleanDept);
        processedCount++;
        if (index < 10) {
          console.log(`🏗️ Record ${index}: ОТДЕЛЕНИЕ = "${cleanDept}"`);
        }
      } else {
        emptyCount++;
        if (index < 10) {
          console.log(`🏗️ Record ${index}: Missing or empty ОТДЕЛЕНИЕ`, { dept, item });
        }
      }
    });
    
    const sorted = Array.from(departments).sort();
    console.log('🏗️ Projector departments processing:', {
      totalRecords: projectorData.length,
      recordsWithDepartments: processedCount,
      emptyDepartments: emptyCount,
      uniqueDepartments: sorted.length,
      departments: sorted
    });
    
    return sorted;
  }, [projectorData, projectorLoading, projectorError]);

  // Обработчики связывания отделений
  const handleAddDepartmentLink = (turarDepartmentName: string, projectorDepartment: string) => {
    linkDepartmentMutation.mutate({
      departmentName: projectorDepartment,
      turarDepartment: turarDepartmentName
    });
  };

  const handleRemoveSingleDepartmentLink = (projectorDepartment: string) => {
    unlinkDepartmentMutation.mutate(projectorDepartment);
  };

  const handleRemoveAllDepartmentLinks = (turarDepartmentName: string) => {
    const connectedProjectorDepartments = getDepartmentProjectorLinks(turarDepartmentName);
    connectedProjectorDepartments.forEach(projectorDept => {
      unlinkDepartmentMutation.mutate(projectorDept);
    });
  };

  // Функция для получения связанных комнат проектировщиков для конкретной комнаты Турар
  const getRoomProjectorLinks = (turarDepartment: string, turarRoom: string) => {
    if (!roomConnections) return [];
    
    return roomConnections.filter(conn => 
      conn.turar_department === turarDepartment && 
      conn.turar_room === turarRoom
    ).map(conn => ({
      id: conn.id,
      projector_department: conn.projector_department,
      projector_room: conn.projector_room
    }));
  };

  // Функция для автоматического создания связей комнат
  const handleBulkCreateConnections = async () => {
    setIsBulkCreating(true);
    try {
      console.log('Starting bulk room connections creation...');
      
      const { data, error } = await supabase.functions.invoke('sync-room-connections', {
        body: {}
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Bulk creation result:', data);

      toast({
        title: "Связи созданы",
        description: `Создано ${data.details?.newConnectionsCreated || 0} новых связей комнат`,
      });

      // Обновляем данные
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error creating bulk connections:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать автоматические связи",
        variant: "destructive",
      });
    } finally {
      setIsBulkCreating(false);
    }
  };

  const processTurarData = (data: any[]): TurarDepartment[] => {
    const departmentMap = new Map<string, Map<string, any[]>>();

    // Group equipment by department and room
    data.forEach(item => {
      const deptName = item["Отделение/Блок"];
      const roomName = item["Помещение/Кабинет"];

      if (!departmentMap.has(deptName)) {
        departmentMap.set(deptName, new Map());
      }

      const deptRooms = departmentMap.get(deptName)!;
      if (!deptRooms.has(roomName)) {
        deptRooms.set(roomName, []);
      }

      deptRooms.get(roomName)!.push(item);
    });

    // Convert to array format
    return Array.from(departmentMap.entries()).map(([deptName, rooms]) => ({
      name: deptName,
      rooms: Array.from(rooms.entries()).map(([roomName, equipment]) => ({
        name: roomName,
        equipment: equipment
      }))
    }));
  };

  // Calculate statistics
  const totalDepartments = departments.length;
  const totalRooms = departments.reduce((acc, dept) => acc + dept.rooms.length, 0);
  const totalEquipment = departments.reduce((acc, dept) => 
    acc + dept.rooms.reduce((roomAcc, room) => 
      roomAcc + room.equipment.reduce((eqAcc, eq) => {
        const count = typeof eq["Кол-во"] === 'number' ? eq["Кол-во"] : parseInt(eq["Кол-во"]) || 0;
        return eqAcc + count;
      }, 0), 0), 0);
  const totalEquipmentTypes = departments.reduce((acc, dept) => 
    acc + dept.rooms.reduce((roomAcc, room) => roomAcc + room.equipment.length, 0), 0);

  // Filter departments based on search term
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.rooms.some(room => 
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.equipment.some(eq => 
        eq["Наименование"].toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq["Код оборудования"].toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  );

  const exportData = () => {
    if (!turarData) return;
    
    const exportData = turarData.map(item => ({
      'Отделение/Блок': item["Отделение/Блок"],
      'Помещение/Кабинет': item["Помещение/Кабинет"],
      'Код оборудования': item["Код оборудования"],
      'Наименование': item["Наименование"],
      'Количество': item["Кол-во"]
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Турар');
    XLSX.writeFile(workbook, 'turar_equipment.xlsx');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка данных турар...</p>
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

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Турар</h1>
        <p className="text-muted-foreground">Медицинские кабинеты и оборудование</p>
      </div>
      <main className="max-w-6xl">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Турар - Медицинское оборудование
          </h1>
          <p className="text-muted-foreground text-lg">
            Управление медицинским оборудованием по отделениям
          </p>
        </div>

        {/* Search and Export Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по отделениям, кабинетам или оборудованию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleBulkCreateConnections} 
              variant="default" 
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={isBulkCreating}
            >
              <Link2 className="h-4 w-4" />
              {isBulkCreating ? 'Синхронизация...' : 'Синхронизировать с проектировщиками'}
            </Button>
            <Button onClick={exportData} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Экспорт в Excel
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего отделений</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalDepartments}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего помещений</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalRooms}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Единиц оборудования</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalEquipment}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Типов оборудования</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalEquipmentTypes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Departments List */}
        <div className="space-y-6">
          {filteredDepartments.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Результаты не найдены</h3>
                <p className="text-muted-foreground text-center">
                  Попробуйте изменить критерии поиска или очистить фильтр
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion 
              type="multiple" 
              className="space-y-4"
              value={expandedDepartments}
              onValueChange={setExpandedDepartments}
            >
              {filteredDepartments.map((department, deptIndex) => (
                <AccordionItem key={deptIndex} value={`dept-${deptIndex}`}>
                   <Card className="bg-card/50 backdrop-blur border-border/50">
                     <AccordionTrigger className="px-6 py-4 hover:no-underline">
                       <div className="flex items-center gap-3 flex-1">
                         <Building2 className="h-6 w-6 text-primary" />
                         <div className="text-left flex-1">
                           <div className="text-xl font-semibold">{department.name}</div>
                           <div className="text-sm text-muted-foreground">
                             {department.rooms.length} помещений
                           </div>
                         </div>
                         {/* Показываем связанные отделения проектировщиков */}
                         {(() => {
                           const connectedDepartments = getDepartmentProjectorLinks(department.name);
                           
                           return connectedDepartments.length > 0 ? (
                             <div className="flex flex-wrap gap-1">
                               {connectedDepartments.map((projectorDept, idx) => (
                                 <Badge 
                                   key={idx} 
                                   variant="secondary" 
                                   className="bg-blue-100 text-blue-800 border-blue-200 text-xs"
                                 >
                                   <Link className="h-3 w-3 mr-1" />
                                   {projectorDept}
                                 </Badge>
                               ))}
                             </div>
                           ) : null;
                          })()}
                        </div>
                      </AccordionTrigger>
                     <AccordionContent className="px-6 pb-6">
                        {/* Интерфейс связывания с проектировщиками */}
                        <div className="mb-6 p-4 bg-background/50 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 mb-3">
                            <Link className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">Связать с отделениями проектировщиков</span>
                          </div>
                          <MultiSelectProjectorDepartments
                            projectorDepartments={projectorDepartments}
                            selectedDepartments={getDepartmentProjectorLinks(department.name)}
                            onAdd={(projectorDept) => handleAddDepartmentLink(department.name, projectorDept)}
                            onRemove={handleRemoveSingleDepartmentLink}
                            onRemoveAll={() => handleRemoveAllDepartmentLinks(department.name)}
                            isLoading={linkDepartmentMutation.isPending || unlinkDepartmentMutation.isPending}
                          />
                        </div>
                      <Accordion 
                        type="multiple" 
                        className="space-y-2"
                        value={expandedRooms}
                        onValueChange={setExpandedRooms}
                      >
                        {department.rooms.map((room, roomIndex) => (
                          <AccordionItem key={roomIndex} value={`room-${deptIndex}-${roomIndex}`}>
                            <Card className="bg-muted/30 border-border/50">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                  <div className="flex items-center gap-3 flex-1">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <div className="text-left flex-1">
                                      <div className="font-medium">{room.name}</div>
                                       <div className="text-sm text-muted-foreground">
                                         {room.equipment.length} типов оборудования
                                         {(() => {
                                           // Проверяем есть ли связь в данных этого кабинета
                                           const hasConnection = room.equipment.some((eq: any) => 
                                             eq.connected_projector_room || eq.connected_projector_department
                                           );
                                           
                                           // Также проверяем связи из room_connections
                                           const roomConnection = roomConnections?.find(conn => 
                                             conn.turar_department === department.name && 
                                             conn.turar_room === room.name
                                           );
                                           
                                           return (hasConnection || roomConnection) ? ' • Связан' : '';
                                         })()}
                                       </div>
                                    </div>
                                     {(() => {
                                       // Находим связь в данных кабинета
                                       const connectedEquipment = room.equipment.find((eq: any) => 
                                         eq.connected_projector_room || eq.connected_projector_department
                                       );
                                       
                                       // Также проверяем связи из room_connections
                                       const roomConnection = roomConnections?.find(conn => 
                                         conn.turar_department === department.name && 
                                         conn.turar_room === room.name
                                       );
                                       
                                       if (connectedEquipment) {
                                         return (
                                           <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                             <Link className="h-3 w-3 mr-1" />
                                             {connectedEquipment.connected_projector_room 
                                               ? `${connectedEquipment.connected_projector_room}` 
                                               : `${connectedEquipment.connected_projector_department}`
                                             }
                                           </Badge>
                                         );
                                       }
                                       
                                       if (roomConnection) {
                                         return (
                                           <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                             <Link className="h-3 w-3 mr-1" />
                                             {roomConnection.projector_department} - {roomConnection.projector_room}
                                           </Badge>
                                         );
                                       }
                                       
                                       return null;
                                     })()}
                                  </div>
                              </AccordionTrigger>
                               <AccordionContent className="px-4 pb-4">
                                 {/* Компонент связывания комнат */}
                                 <div className="mb-4 p-3 bg-background/30 rounded-lg border border-border/50">
                                   <TurarRoomLinkDropdown
                                     turarDepartment={department.name}
                                     turarRoom={room.name}
                                     connectedRooms={getRoomProjectorLinks(department.name, room.name)}
                                     onSuccess={() => {
                                       // Обновляем данные после успешного создания/удаления связи
                                       console.log('✅ Room connection updated');
                                     }}
                                   />
                                 </div>
                                 
                                 <div className="space-y-2">
                                   {room.equipment.map((equipment, eqIndex) => {
                                     const urlSearchTerm = searchParams.get('search');
                                     const urlDepartment = searchParams.get('department');
                                     const urlRoom = searchParams.get('room');
                                     
                                       const isHighlighted = urlSearchTerm && 
                                         urlDepartment === department.name && 
                                         urlRoom === room.name && 
                                         (equipment["Наименование"].toLowerCase().includes(urlSearchTerm.toLowerCase()) ||
                                          equipment["Код оборудования"].toLowerCase().includes(urlSearchTerm.toLowerCase())) &&
                                         !highlightTimeout;

                                      const equipmentId = isHighlighted ? 
                                        `${urlDepartment}-${urlRoom}-${urlSearchTerm}`.replace(/\s+/g, '-').toLowerCase() : 
                                        undefined;

                                    return (
                                       <div
                                         key={eqIndex}
                                         id={equipmentId}
                                         className={`flex items-center justify-between p-3 rounded-md border transition-all duration-500 ${
                                           isHighlighted 
                                             ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-500 shadow-lg ring-2 ring-yellow-400 dark:ring-yellow-500 animate-pulse' 
                                             : 'bg-background/50 border-border/30'
                                         }`}
                                       >
                                         <div className="flex items-center gap-3">
                                           <Package className="h-4 w-4 text-muted-foreground" />
                                           <div>
                                             <div className={`font-medium transition-all duration-300 ${
                                               isHighlighted 
                                                 ? 'text-yellow-800 dark:text-yellow-200 font-bold' 
                                                 : ''
                                              }`}>
                                                {isHighlighted && <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-ping"></span>}
                                                {equipment["Наименование"]}
                                              </div>
                                              <div className="text-sm text-muted-foreground">
                                                Код: {equipment["Код оборудования"]}
                                              </div>
                                            </div>
                                          </div>
                                          <Badge 
                                            variant={isHighlighted ? "default" : "secondary"} 
                                            className={`font-medium ${isHighlighted ? 'bg-yellow-500 text-yellow-900' : ''}`}
                                          >
                                            {equipment["Кол-во"]} шт.
                                         </Badge>
                                       </div>
                                    );
                                  })}
                                </div>
                              </AccordionContent>
                            </Card>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </main>
    </div>
  );
};

export default TurarPage;