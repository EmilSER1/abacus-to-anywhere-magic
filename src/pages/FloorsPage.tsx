import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Download, Plus, MapPin, Users, Link } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Navigation } from '@/components/Navigation';
import { useSearchParams } from 'react-router-dom';
import { useFloorsData } from '@/hooks/useFloorsData';
import { useRoomConnections } from '@/hooks/useRoomConnections';
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

    if (item["Наименование оборудования"]) {
      room.equipment.push({
        code: item["Код оборудования"],
        name: item["Наименование оборудования"],
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
  const [searchParams] = useSearchParams();
  const { data: allData, isLoading, error, refetch } = useFloorsData();
  const { data: roomConnections } = useRoomConnections();
  
  // Helper function to check if a room is connected using new ID-based structure
  const isRoomConnected = (room: Room, departmentName: string) => {
    if (!allData) return false;
    
    // Find ANY room record with this name and department that has a connection
    const connectedRecord = allData.find(item => 
      item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] === room.name && 
      item["ОТДЕЛЕНИЕ"]?.trim() === departmentName?.trim() &&
      (item.connected_turar_room_id || item.connected_turar_room || item.connected_turar_department)
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
    if (!allData) return [];
    
    // Find ALL room records with this name and department that have connections
    const connectedRecords = allData.filter(item => 
      item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] === room.name && 
      item["ОТДЕЛЕНИЕ"]?.trim() === departmentName?.trim() &&
      (item.connected_turar_room_id || item.connected_turar_room || item.connected_turar_department)
    );
    
    console.log('🔗 Getting room connections:', {
      roomName: room.name,
      departmentName,
      connectedRecordsCount: connectedRecords.length,
      connectedRecords: connectedRecords.map(r => ({
        id: r.id,
        connected_turar_room: r.connected_turar_room,
        connected_turar_department: r.connected_turar_department
      }))
    });
    
    if (connectedRecords.length === 0) {
      console.log('❌ No connections found');
      return [];
    }
    
    // Return unique connections (remove duplicates)
    const uniqueConnections = new Map();
    connectedRecords.forEach(roomRecord => {
      const key = `${roomRecord.connected_turar_department}-${roomRecord.connected_turar_room}`;
      if (!uniqueConnections.has(key)) {
        uniqueConnections.set(key, {
          id: `connection-${roomRecord.id}`,
          turar_department: roomRecord.connected_turar_department || 'Неизвестное отделение',
          turar_room: roomRecord.connected_turar_room || 'Неизвестный кабинет',
          projector_department: departmentName,
          projector_room: room.name,
          turar_room_id: roomRecord.connected_turar_room_id,
          projector_room_id: roomRecord.id,
          created_at: roomRecord.created_at || new Date().toISOString(),
          updated_at: roomRecord.updated_at || new Date().toISOString()
        });
      }
    });
    
    const connections = Array.from(uniqueConnections.values());
    console.log('✅ Found connections:', connections);
    return connections;
  };
  const [floors, setFloors] = useState<Floor[]>([]);
  const [expandedFloors, setExpandedFloors] = useState<string[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [highlightTimeout, setHighlightTimeout] = useState<boolean>(false);
  const [targetEquipmentId, setTargetEquipmentId] = useState<string | null>(null);

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
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Загрузка данных проектировщиков...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto p-6 flex items-center justify-center">
          <div className="text-center text-red-500">
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
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto p-6">
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
          <Button onClick={exportData} className="mt-4 gap-2">
            <Download className="h-4 w-4" />
            Экспорт Проектировщики в Excel
          </Button>
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
                                                       <Badge variant="secondary" className="bg-green-500 text-white dark:bg-green-600 dark:text-white text-xs font-semibold">
                                                         <Link className="h-3 w-3 mr-1" />
                                                         ✓ Связано ({connections.length})
                                                       </Badge>
                                                     ) : null;
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
                                            <AccordionContent className="px-3 pb-3">
                                              {room.equipment.length > 0 ? (
                                                <div className="bg-background/50 rounded border">
                                                  <table className="w-full text-xs">
                                                    <thead className="bg-muted/30">
                                                      <tr>
                                                        <th className="text-left p-2 font-medium">Код оборудования</th>
                                                        <th className="text-left p-2 font-medium">Наименование</th>
                                                        <th className="text-center p-2 font-medium">Количество</th>
                                                        <th className="text-center p-2 font-medium">Ед. изм.</th>
                                                        <th className="text-center p-2 font-medium">Примечания</th>
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
                                                            className={`border-t border-border/50 transition-all duration-500 ${
                                                              isHighlighted 
                                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-400 dark:ring-yellow-500 shadow-lg animate-pulse' 
                                                                : ''
                                                            }`}
                                                          >
                                                            <td className="p-2 font-mono text-xs">
                                                              {eq.code || '-'}
                                                            </td>
                                                             <td className={`p-2 break-words transition-all duration-300 ${
                                                               isHighlighted 
                                                                 ? 'text-yellow-800 dark:text-yellow-200 font-bold text-sm bg-yellow-200 dark:bg-yellow-800/50 rounded' 
                                                                 : ''
                                                             }`}>
                                                              {isHighlighted && <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-ping"></span>}
                                                              {eq.name || '-'}
                                                            </td>
                                                            <td className="p-2 text-center">
                                                              {eq.quantity || '-'}
                                                            </td>
                                                            <td className="p-2 text-center">
                                                              {eq.unit || '-'}
                                                            </td>
                                                            <td className="p-2 text-center">
                                                              {eq.notes && (
                                                                <Badge 
                                                                  variant={isHighlighted ? "default" : "secondary"} 
                                                                  className="text-xs h-5"
                                                                >
                                                                  {eq.notes}
                                                                </Badge>
                                                              )}
                                                            </td>
                                                          </tr>
                                                        );
                                                      })}
                                                     </tbody>
                                                   </table>
                                                   
                                                   {/* Связи с Турар */}
                                                    {(() => {
                                                       const connections = getRoomConnections(room, department.name);
                                                     return connections.length > 0 ? (
                                                       <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                                         <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                                                           <Link className="h-4 w-4" />
                                                           Связано с кабинетами Турар:
                                                         </div>
                                                         <div className="space-y-2">
                                                           {connections.map((conn, connIndex) => (
                                                             <div key={connIndex} className="flex items-center justify-between bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 p-3 rounded-md border border-green-200 dark:border-green-700">
                                                               <div className="font-medium">
                                                                 <div className="text-sm">{conn.turar_department}</div>
                                                                 <div className="text-xs text-green-600 dark:text-green-300">→ {conn.turar_room}</div>
                                                               </div>
                                                               <Badge variant="secondary" className="bg-green-500 text-white dark:bg-green-600 dark:text-white">
                                                                 <Link className="h-3 w-3 mr-1" />
                                                                 Активная связь
                                                               </Badge>
                                                             </div>
                                                           ))}
                                                         </div>
                                                       </div>
                                                     ) : null;
                                                   })()}
                                                 </div>
                                               ) : (
                                                 <div className="text-center py-4 text-muted-foreground text-xs">
                                                   Оборудование не указано
                                                   
                                                   {/* Связи с Турар для комнат без оборудования */}
                                                    {(() => {
                                                       const connections = getRoomConnections(room, department.name);
                                                     return connections.length > 0 ? (
                                                       <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                                         <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                                                           <Link className="h-4 w-4" />
                                                           Связано с кабинетами Турар:
                                                         </div>
                                                         <div className="space-y-2">
                                                           {connections.map((conn, connIndex) => (
                                                             <div key={connIndex} className="flex items-center justify-between bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 p-3 rounded-md border border-green-200 dark:border-green-700">
                                                               <div className="font-medium">
                                                                 <div className="text-sm">{conn.turar_department}</div>
                                                                 <div className="text-xs text-green-600 dark:text-green-300">→ {conn.turar_room}</div>
                                                               </div>
                                                               <Badge variant="secondary" className="bg-green-500 text-white dark:bg-green-600 dark:text-white">
                                                                 <Link className="h-3 w-3 mr-1" />
                                                                 Активная связь
                                                               </Badge>
                                                             </div>
                                                           ))}
                                                         </div>
                                                       </div>
                                                     ) : null;
                                                   })()}
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
    </div>
  );
}