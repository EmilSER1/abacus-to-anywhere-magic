import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Download, Plus, MapPin, Users } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Navigation } from '@/components/Navigation';
import { useSearchParams } from 'react-router-dom';
import combinedFloorsData from '@/data/combined_floors.json';

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
    const roomArea = typeof item["Площадь (м2)"] === 'number' ? item["Площадь (м2)"] : 0;
    
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
      department.totalArea = (department.totalArea || 0) + roomArea;
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

  // Convert to Floor[] structure
  const floors: Floor[] = [];
  
  floorsMap.forEach((departmentsMap, floorNumber) => {
    const departments = Array.from(departmentsMap.values());
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
  const allData = combinedFloorsData as FloorData[];
  const [floors] = useState<Floor[]>(() => processFloorData(allData));
  const [expandedFloors, setExpandedFloors] = useState<string[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [highlightTimeout, setHighlightTimeout] = useState<boolean>(false);

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
        }
      });
      
      // Auto-remove highlight after 3 seconds
      setTimeout(() => setHighlightTimeout(true), 3000);
    }
  }, [searchParams, floors]);

  const exportData = () => {
    const dataStr = JSON.stringify(floors, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'floors_data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

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
                                      <div key={roomIndex} className="text-xs bg-muted/20 p-2 rounded border-l-2 border-primary/30">
                                         <div className="flex justify-between items-start mb-1">
                                           <span className="font-medium">{room.name}</span>
                                           <div className="text-right">
                                             <div className="text-muted-foreground font-mono text-xs">{room.code}</div>
                                             <div className="text-muted-foreground text-xs">{(room.area || 0).toFixed(1)} м²</div>
                                           </div>
                                         </div>
                                         {room.equipment.length > 0 && (
                                           <div className="mt-3">
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

                                                       if (urlSearchTerm && urlDepartment === department.name && urlRoom === room.name) {
                                                         console.log('FloorsPage highlighting check:', {
                                                           equipmentName: eq.name,
                                                           searchTerm: urlSearchTerm,
                                                           matches: eq.name?.toLowerCase().includes(urlSearchTerm.toLowerCase()),
                                                           isHighlighted
                                                         });
                                                       }

                                                      return (
                                                        <tr 
                                                          key={eqIndex} 
                                                          className={`border-t border-border/50 transition-all duration-500 ${
                                                            isHighlighted 
                                                              ? 'bg-primary/10 animate-pulse' 
                                                              : ''
                                                          }`}
                                                        >
                                                          <td className="p-2 font-mono text-xs">
                                                            {eq.code || '-'}
                                                          </td>
                                                          <td className={`p-2 max-w-[200px] truncate ${
                                                            isHighlighted ? 'text-primary font-semibold' : ''
                                                          }`} title={eq.name || ''}>
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
                                             </div>
                                           </div>
                                         )}
                                      </div>
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