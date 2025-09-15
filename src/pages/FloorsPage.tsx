import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Building2, Users, MapPin, Download, Search, Package, Link, Edit2, Plus, X, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useFloorsData, FloorData } from '@/hooks/useFloorsData';
import { useRoomConnections } from '@/hooks/useRoomConnections';
import { useProjectorRoomEquipment } from '@/hooks/useProjectorEquipment';
// import EditEquipmentDialog from '@/components/EditEquipmentDialog'; // Disabled
import TurarDepartmentSelector from '@/components/TurarDepartmentSelector';
import TurarRoomSelector from '@/components/TurarRoomSelector';
import { useCreateRoomConnection, useDeleteRoomConnection } from '@/hooks/useRoomConnections';
import { useLinkDepartmentToTurar, useUnlinkDepartmentFromTurar } from '@/hooks/useDepartmentTurarLink';
import { useTurarMedicalData } from '@/hooks/useTurarMedicalData';
import { useCleanupUnknownRooms } from '@/hooks/useCleanupUnknownRooms';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useProjectorDepartmentTurarLink } from '@/hooks/useProjectorDepartmentTurarLink';
import { useUserRole } from '@/hooks/useUserRole';
import * as XLSX from 'xlsx';

// Interface definitions
interface Equipment {
  id?: string;
  code: string | null;
  name: string | null;
  unit: string | null;
  quantity: string | null;
  notes: string | null;
}

interface Room {
  name: string;
  code: string;
  floor: string;
  area: string | null;
  equipment: Equipment[];
}

interface Department {
  name: string;
  block: string;
  rooms: Room[];
}

const FloorsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { data: floorsData, isLoading, error } = useFloorsData();
  const { data: roomConnections } = useRoomConnections();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [targetEquipmentId, setTargetEquipmentId] = useState<string | null>(null);
  const [selectedTurarDept, setSelectedTurarDept] = useState('');
  const [selectedTurarRooms, setSelectedTurarRooms] = useState<string[]>([]);
  
  // const updateEquipmentMutation = useUpdateProjectorEquipment(); // Disabled
  // const addEquipmentMutation = useAddProjectorEquipment(); // Disabled
  const createConnectionMutation = useCreateRoomConnection();
  const deleteConnectionMutation = useDeleteRoomConnection();
  const linkDepartmentMutation = useLinkDepartmentToTurar();
  const unlinkDepartmentMutation = useUnlinkDepartmentFromTurar();
  const cleanupUnknownRoomsMutation = useCleanupUnknownRooms();
  const { data: turarData } = useTurarMedicalData();
  const { toast } = useToast();
  const { canEdit } = useUserRole();

  // Состояния для связывания отделений
  const [departmentTurarSelections, setDepartmentTurarSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    if (floorsData) {
      const processedDepartments = processDepartments(floorsData);
      setDepartments(processedDepartments);
      
      // Handle search params from URL
      const urlSearchTerm = searchParams.get('search');
      const urlDepartment = searchParams.get('department');
      const urlRoom = searchParams.get('room');
      
      if (urlSearchTerm && urlDepartment) {
        setSearchTerm(urlSearchTerm);
        
        // Auto-expand relevant sections
        const deptIndex = processedDepartments.findIndex(dept => dept.name === urlDepartment);
        if (deptIndex !== -1) {
          setExpandedDepartments([`dept-${deptIndex}`]);
          
          if (urlRoom) {
            const roomIndex = processedDepartments[deptIndex]?.rooms.findIndex(room => room.name === urlRoom);
            if (roomIndex !== -1) {
              setExpandedRooms([`room-${deptIndex}-${roomIndex}`]);
              
              const targetId = `${urlDepartment}-${urlRoom}-${urlSearchTerm}`.replace(/\s+/g, '-').toLowerCase();
              setTargetEquipmentId(targetId);
              
              setTimeout(() => {
                const element = document.getElementById(targetId);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 800);
            }
          }
        }
      }
    }
  }, [floorsData, searchParams]);

  const processDepartments = (data: FloorData[]): Department[] => {
    const departmentMap = new Map<string, Map<string, Room>>();

    data.forEach(item => {
      const deptName = item["ОТДЕЛЕНИЕ"];
      const roomName = item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"];
      const roomCode = item["КОД ПОМЕЩЕНИЯ"];
      const floor = item["ЭТАЖ"];
      const area = item["Площадь (м2)"];
      const block = item["БЛОК"];

      if (!departmentMap.has(deptName)) {
        departmentMap.set(deptName, new Map());
      }

      const deptRooms = departmentMap.get(deptName)!;
      if (!deptRooms.has(roomName)) {
        deptRooms.set(roomName, {
          name: roomName,
          code: roomCode,
          floor: floor.toString(),
          area: area ? area.toString() : null,
          equipment: []
        });
      }

      if (item["Наименование оборудования"]) {
        deptRooms.get(roomName)!.equipment.push({
          code: item["Код оборудования"],
          name: item["Наименование оборудования"],
          unit: item["Ед. изм."],
          quantity: item["Кол-во"] ? item["Кол-во"].toString() : null,
          notes: item["Примечания"]
        });
      }
    });

    return Array.from(departmentMap.entries()).map(([deptName, rooms]) => {
      const firstRoom = Array.from(rooms.values())[0];
      const blockName = data.find(item => item["ОТДЕЛЕНИЕ"] === deptName)?.["БЛОК"] || 'Не указан';
      
      return {
        name: deptName,
        block: blockName,
        rooms: Array.from(rooms.values())
      };
    });
  };

  // Check if room is connected
  const isRoomConnected = (room: Room, departmentName: string): boolean => {
    return roomConnections?.some(
      conn => conn.projector_room === room.name && 
               conn.projector_department === departmentName
    ) || false;
  };

  // Get department Turar link
  const getDepartmentTurarLink = (departmentName: string): string | null => {
    const projectorData = floorsData?.filter(item => item["ОТДЕЛЕНИЕ"] === departmentName);
    if (!projectorData || projectorData.length === 0) return null;
    
    const connectedDept = projectorData.find(item => item.connected_turar_department);
    return connectedDept?.connected_turar_department || null;
  };

  // Calculate statistics
  const totalDepartments = departments.length;
  const totalRooms = departments.reduce((acc, dept) => acc + dept.rooms.length, 0);
  const totalEquipment = departments.reduce((acc, dept) => 
    acc + dept.rooms.reduce((roomAcc, room) => 
      roomAcc + room.equipment.reduce((eqAcc, eq) => {
        const count = eq.quantity ? parseInt(eq.quantity) || 0 : 0;
        return eqAcc + count;
      }, 0), 0), 0);

  // Filter departments based on search term
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.rooms.some(room => 
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.equipment.some(eq => 
        (eq.name && eq.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (eq.code && eq.code.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    )
  );

  // Equipment functionality disabled for now
  const handleEditEquipment = (equipment: Equipment) => {
    toast({
      title: "Информация",
      description: "Редактирование оборудования временно отключено"
    });
  };

  const handleAddEquipment = (department: string, room: string) => {
    toast({
      title: "Информация",
      description: "Добавление оборудования временно отключено"
    });
  };

  const exportData = () => {
    if (!floorsData) return;
    
    const exportData = floorsData.map(item => ({
      'Блок': item["БЛОК"],
      'Отделение': item["ОТДЕЛЕНИЕ"],
      'Этаж': item["ЭТАЖ"],
      'Код помещения': item["КОД ПОМЕЩЕНИЯ"],
      'Наименование помещения': item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"],
      'Площадь': item["Площадь (м2)"],
      'Код оборудования': item["Код оборудования"],
      'Наименование оборудования': item["Наименование оборудования"],
      'Единица измерения': item["Ед. изм."],
      'Количество': item["Кол-во"],
      'Примечания': item["Примечания"]
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Проектировщики');
    XLSX.writeFile(workbook, 'projector_floors.xlsx');
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

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Данные проектировщиков</h1>
        <p className="text-muted-foreground">Управление помещениями и оборудованием по этажам</p>
      </div>

      {/* Search and Export Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по отделениям, помещениям или оборудованию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Экспорт в Excel
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего отделений</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего помещений</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRooms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего оборудования</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipment}</div>
          </CardContent>
        </Card>
      </div>

      {/* Departments Display */}
      <div className="space-y-4">
        <Accordion 
          type="multiple" 
          value={expandedDepartments}
          onValueChange={setExpandedDepartments}
        >
          {filteredDepartments.map((department, deptIndex) => (
            <AccordionItem key={deptIndex} value={`dept-${deptIndex}`} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <div className="font-semibold">{department.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Блок: {department.block} • {department.rooms.length} помещений
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <Accordion
                    type="multiple"
                    value={expandedRooms}
                    onValueChange={setExpandedRooms}
                  >
                    {department.rooms.map((room, roomIndex) => (
                      <AccordionItem 
                        key={roomIndex} 
                        value={`room-${deptIndex}-${roomIndex}`} 
                        className="border border-border/50 rounded-lg"
                      >
                        <AccordionTrigger className={`px-3 py-2 text-xs hover:no-underline hover:bg-muted/30 ${
                          isRoomConnected(room, department.name) 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''
                        }`}>
                          <div className="flex justify-between items-center w-full mr-4">
                            <div className="flex items-center gap-2 flex-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{room.name}</span>
                              <Badge variant="outline" className="text-xs font-mono">{room.code}</Badge>
                              
                              {/* Connection indicators */}
                              {(() => {
                                const connections = roomConnections?.filter(
                                  conn => conn.projector_room === room.name && 
                                          conn.projector_department === department.name
                                ) || [];

                                return connections.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {connections.map((conn, idx) => (
                                      <Badge key={idx} variant="secondary" className="bg-green-500 text-white text-xs">
                                        <Link className="h-3 w-3 mr-1" />
                                        {conn.turar_room}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {room.equipment.length} оборудования
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="px-3 pb-3">
                          <div className="space-y-3">
                            {/* Equipment table */}
                            {room.equipment.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border border-border/50 rounded-lg">
                                  <thead>
                                    <tr className="border-b bg-muted/30">
                                      <th className="text-left p-2 font-semibold">Код</th>
                                      <th className="text-left p-2 font-semibold min-w-[200px]">Наименование</th>
                                      <th className="text-left p-2 font-semibold">Ед. изм.</th>
                                      <th className="text-left p-2 font-semibold">Кол-во</th>
                                      {canEdit() && (
                                        <th className="text-center p-2 font-semibold w-16">Действия</th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {room.equipment.map((eq, eqIndex) => (
                                      <tr key={eqIndex} className="border-b hover:bg-muted/20">
                                        <td className="p-2">
                                          <code className="text-xs bg-muted/50 px-1 py-0.5 rounded">
                                            {eq.code || 'Нет кода'}
                                          </code>
                                        </td>
                                        <td className="p-2">
                                          <div className="break-words max-w-xs">{eq.name || 'Нет названия'}</div>
                                        </td>
                                        <td className="p-2 text-center">{eq.unit || 'шт'}</td>
                                        <td className="p-2 text-center">{eq.quantity || '0'}</td>
                                        {canEdit() && (
                                          <td className="p-2 text-center">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleEditEquipment(eq)}
                                              className="h-6 w-6 p-0"
                                            >
                                              <Edit2 className="h-3 w-3" />
                                            </Button>
                                          </td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-muted-foreground">
                                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">В этом помещении пока нет оборудования</p>
                              </div>
                            )}

                            {/* Room connections display */}
                            {(() => {
                              const connections = roomConnections?.filter(
                                conn => conn.projector_room === room.name && 
                                        conn.projector_department === department.name
                              ) || [];

                              if (connections.length > 0) {
                                return (
                                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                                      🔗 Связанные кабинеты Турар:
                                    </div>
                                    <div className="space-y-2">
                                      {connections.map((conn, connIndex) => (
                                        <div key={connIndex} className="flex items-center justify-between bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 p-2 rounded-md">
                                          <div className="font-medium">
                                            <div className="text-xs">→ {conn.turar_room}</div>
                                          </div>
                                          {canEdit() && (
                                            <button 
                                              onClick={() => deleteConnectionMutation.mutate(conn.id)}
                                              className="ml-2 hover:bg-red-500 text-red-600 hover:text-white rounded-full p-1 transition-colors"
                                              title="Удалить связь"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Equipment editing temporarily disabled */}
    </div>
  );
};

export default FloorsPage;