import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Download, Plus, MapPin, Users } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Navigation } from '@/components/Navigation';
import firstFloorData from '@/data/1F_filled.json';
import secondFloorData from '@/data/2F_filled.json';

// Interface definitions
interface FloorData {
  "Этаж": string | number;
  "БЛОК": string;
  "ОТДЕЛЕНИЕ": string;
  "Код помещения": string;
  "Наименование помещения": string;
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
  equipment: Equipment[];
}

interface Department {
  name: string;
  block: string;
  rooms: Room[];
  equipmentCount: number;
}

interface Floor {
  number: string;
  blocks: Block[];
  stats: {
    totalBlocks: number;
    totalDepartments: number;
    totalRooms: number;
    totalEquipment: number;
  };
}

interface Block {
  name: string;
  departments: Department[];
  stats: {
    totalDepartments: number;
    totalRooms: number;
    totalEquipment: number;
  };
}

// Process floor data to group by floors -> blocks -> departments -> rooms
const processFloorData = (data: FloorData[]): Floor[] => {
  const floorsMap = new Map<string, Map<string, Map<string, Department>>>();

  data.forEach(item => {
    const floorNumber = String(item["Этаж"]);
    const blockName = item["БЛОК"];
    const departmentName = item["ОТДЕЛЕНИЕ"];
    
    if (!floorsMap.has(floorNumber)) {
      floorsMap.set(floorNumber, new Map());
    }
    
    const floor = floorsMap.get(floorNumber)!;
    
    if (!floor.has(blockName)) {
      floor.set(blockName, new Map());
    }
    
    const block = floor.get(blockName)!;
    
    if (!block.has(departmentName)) {
      block.set(departmentName, {
        name: departmentName,
        block: blockName,
        rooms: [],
        equipmentCount: 0
      });
    }

    const department = block.get(departmentName)!;
    let room = department.rooms.find(r => r.code === item["Код помещения"]);
    
    if (!room) {
      room = {
        code: item["Код помещения"],
        name: item["Наименование помещения"],
        equipment: []
      };
      department.rooms.push(room);
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
  
  floorsMap.forEach((blocksMap, floorNumber) => {
    const blocks: Block[] = [];
    
    blocksMap.forEach((departmentsMap, blockName) => {
      const departments = Array.from(departmentsMap.values());
      const totalRooms = departments.reduce((sum, dept) => sum + dept.rooms.length, 0);
      const totalEquipment = departments.reduce((sum, dept) => sum + dept.equipmentCount, 0);
      
      blocks.push({
        name: blockName,
        departments,
        stats: {
          totalDepartments: departments.length,
          totalRooms,
          totalEquipment
        }
      });
    });
    
    const totalDepartments = blocks.reduce((sum, block) => sum + block.stats.totalDepartments, 0);
    const totalRooms = blocks.reduce((sum, block) => sum + block.stats.totalRooms, 0);
    const totalEquipment = blocks.reduce((sum, block) => sum + block.stats.totalEquipment, 0);
    
    floors.push({
      number: floorNumber,
      blocks,
      stats: {
        totalBlocks: blocks.length,
        totalDepartments,
        totalRooms,
        totalEquipment
      }
    });
  });

  return floors.sort((a, b) => Number(a.number) - Number(b.number));
};

export default function FloorsPage() {
  const allData = [...firstFloorData, ...secondFloorData] as FloorData[];
  const [floors] = useState<Floor[]>(() => processFloorData(allData));

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
    totalBlocks: acc.totalBlocks + floor.stats.totalBlocks,
    totalDepartments: acc.totalDepartments + floor.stats.totalDepartments,
    totalRooms: acc.totalRooms + floor.stats.totalRooms,
    totalEquipment: acc.totalEquipment + floor.stats.totalEquipment
  }), { totalBlocks: 0, totalDepartments: 0, totalRooms: 0, totalEquipment: 0 });

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
          <Button onClick={exportData} className="mt-4 gap-2">
            <Download className="h-4 w-4" />
            Экспорт Проектировщики в Excel
          </Button>
        </div>

        {/* Floors with Accordion */}
        <div className="space-y-6">
          {floors.map((floor) => (
            <Card key={floor.number} className="overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
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
                        <span>{floor.stats.totalBlocks} блоков</span>
                        <span>{floor.stats.totalDepartments} отделений</span>
                        <span>{floor.stats.totalRooms} помещений</span>
                        <span>{floor.stats.totalEquipment} ед. оборуд.</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-4">
                      {floor.blocks.map((block) => (
                        <div key={block.name} className="border rounded-lg overflow-hidden">
                          <Accordion type="single" collapsible>
                            <AccordionItem value={`block-${block.name}`} className="border-none">
                              <AccordionTrigger className="px-4 py-3 bg-muted/30 hover:no-underline hover:bg-muted/50">
                                <div className="flex items-center justify-between w-full mr-4">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="font-mono">
                                      Блок {block.name}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      {block.stats.totalDepartments} отделений • {block.stats.totalRooms} помещений
                                    </span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {block.stats.totalEquipment} ед. оборуд.
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                <div className="space-y-3">
                                  <div className="text-xs font-medium text-muted-foreground mb-2">
                                    ВСЕ ОТДЕЛЕНИЯ В БЛОКЕ:
                                  </div>
                                  {block.departments.map((department, deptIndex) => (
                                    <div key={deptIndex} className="border rounded-md overflow-hidden">
                                      <Accordion type="single" collapsible>
                                        <AccordionItem value={`dept-${deptIndex}`} className="border-none">
                                          <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/30">
                                            <div className="flex items-center justify-between w-full mr-4">
                                              <div className="text-left">
                                                <div className="font-medium text-sm">{department.name}</div>
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {department.rooms.length} каб.
                                              </div>
                                            </div>
                                          </AccordionTrigger>
                                          <AccordionContent className="px-3 pb-3">
                                            <div className="space-y-2">
                                              <div className="text-xs font-medium text-muted-foreground">Кабинеты:</div>
                                              <div className="grid grid-cols-1 gap-2">
                                                {department.rooms.map((room, roomIndex) => (
                                                  <div key={roomIndex} className="text-xs bg-muted/20 p-2 rounded border-l-2 border-primary/30">
                                                    <div className="flex justify-between items-start mb-1">
                                                      <span className="font-medium">{room.name}</span>
                                                      <span className="text-muted-foreground font-mono text-xs">{room.code}</span>
                                                    </div>
                                                    {room.equipment.length > 0 && (
                                                      <div className="mt-2 space-y-1">
                                                        {room.equipment.map((eq, eqIndex) => (
                                                          <div key={eqIndex} className="flex flex-wrap items-center gap-2 text-xs">
                                                            <span className="text-muted-foreground">{eq.name}</span>
                                                            {eq.code && (
                                                              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                                                {eq.code}
                                                              </Badge>
                                                            )}
                                                            {eq.quantity && eq.unit && (
                                                              <span className="text-muted-foreground">
                                                                {eq.quantity} {eq.unit}
                                                              </span>
                                                            )}
                                                            {eq.notes && (
                                                              <span className="text-muted-foreground italic">({eq.notes})</span>
                                                            )}
                                                          </div>
                                                        ))}
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