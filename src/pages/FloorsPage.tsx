import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Download } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { useSearchParams } from 'react-router-dom';
import { useFloorsData, FloorData } from '@/hooks/useFloorsData';
import * as XLSX from 'xlsx';

// Interface definitions
interface Equipment {
  code: string | null;
  name: string | null;
  unit: string | null;
  quantity: number | string | null;
  notes: string | null;
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

// Process floor data to group by floors -> departments -> rooms
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
      department.totalArea += roomArea;
    }

    if (item["Код оборудования"]) {
      const equipment: Equipment = {
        code: item["Код оборудования"],
        name: item["Наименование оборудования"],
        unit: item["Ед. изм."],
        quantity: item["Кол-во"],
        notes: item["Примечания"],
        id: item.id
      };
      
      room.equipment.push(equipment);
      department.equipmentCount++;
    }
  });

  return Array.from(floorsMap.entries())
    .map(([number, departments]) => {
      const deptArray = Array.from(departments.values());
      return {
        number,
        departments: deptArray,
        stats: {
          totalDepartments: deptArray.length,
          totalRooms: deptArray.reduce((sum, dept) => sum + dept.rooms.length, 0),
          totalEquipment: deptArray.reduce((sum, dept) => sum + dept.equipmentCount, 0),
          totalArea: deptArray.reduce((sum, dept) => sum + dept.totalArea, 0)
        }
      };
    })
    .sort((a, b) => {
      const aNum = a.number.replace(/[^0-9]/g, '');
      const bNum = b.number.replace(/[^0-9]/g, '');
      return aNum.localeCompare(bNum, undefined, { numeric: true });
    });
};

const FloorsPage: React.FC = () => {
  const { data: rawFloorsData, isLoading, error } = useFloorsData();

  const [searchParams] = useSearchParams();
  const [expandedFloors, setExpandedFloors] = useState<string[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);

  useEffect(() => {
    const floor = searchParams.get('floor');
    const department = searchParams.get('department');
    
    if (floor && expandedFloors.length === 0) {
      setExpandedFloors([floor]);
    }
    
    if (department && floor && expandedDepartments.length === 0) {
      const deptKey = `${floor}-${department}`;
      setExpandedDepartments([deptKey]);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Загрузка данных...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center text-red-600">
              <p>Ошибка загрузки данных</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const floors = processFloorData(rawFloorsData || []);

  const exportToExcel = () => {
    const exportData = (rawFloorsData || []).map(item => ({
      'Этаж': item["ЭТАЖ"],
      'Блок': item["БЛОК"],
      'Отделение': item["ОТДЕЛЕНИЕ"],
      'Код помещения': item["КОД ПОМЕЩЕНИЯ"],
      'Наименование помещения': item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"],
      'Площадь (м2)': item["Площадь (м2)"],
      'Код оборудования': item["Код оборудования"],
      'Наименование оборудования': item["Наименование оборудования"],
      'Ед. изм.': item["Ед. изм."],
      'Количество': item["Кол-во"],
      'Примечания': item["Примечания"]
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Проектировщики');
    
    XLSX.writeFile(workbook, `floors_data_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalStats = {
    floors: floors.length,
    departments: floors.reduce((sum, floor) => sum + floor.stats.totalDepartments, 0),
    rooms: floors.reduce((sum, floor) => sum + floor.stats.totalRooms, 0),
    equipment: floors.reduce((sum, floor) => sum + floor.stats.totalEquipment, 0),
    area: floors.reduce((sum, floor) => sum + floor.stats.totalArea, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Данные проектировщиков</CardTitle>
                  <CardDescription>Полная информация по этажам, отделениям и оборудованию</CardDescription>
                </div>
              </div>
              <Button onClick={exportToExcel} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalStats.floors}</div>
                <div className="text-sm text-muted-foreground">Этажей</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{totalStats.departments}</div>
                <div className="text-sm text-muted-foreground">Отделений</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{totalStats.rooms}</div>
                <div className="text-sm text-muted-foreground">Помещений</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{totalStats.equipment}</div>
                <div className="text-sm text-muted-foreground">Оборудования</div>
              </div>
              <div className="text-center p-4 bg-teal-50 rounded-lg">
                <div className="text-2xl font-bold text-teal-600">{totalStats.area.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">м² площади</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Accordion type="multiple" value={expandedFloors} onValueChange={setExpandedFloors}>
          {floors.map((floor) => (
            <AccordionItem key={floor.number} value={floor.number}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-base px-3">
                      Этаж {floor.number}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {floor.stats.totalDepartments} отд. • {floor.stats.totalRooms} пом. • {floor.stats.totalEquipment} об.
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" value={expandedDepartments} onValueChange={setExpandedDepartments}>
                  {floor.departments.map((department) => {
                    const deptKey = `${floor.number}-${department.name}`;
                    
                    return (
                      <AccordionItem key={deptKey} value={deptKey} className="border-l-2 border-primary/20 ml-4">
                        <AccordionTrigger className="hover:no-underline pl-4">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{department.name}</span>
                                <Badge variant="secondary">{department.block}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {department.rooms.length} помещений • {department.equipmentCount} оборудования • {department.totalArea.toFixed(1)} м²
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pl-4">
                          <Accordion type="multiple" value={expandedRooms} onValueChange={setExpandedRooms}>
                            {department.rooms.map((room) => {
                              const roomKey = `${deptKey}-${room.code}`;
                              
                              return (
                                <AccordionItem key={roomKey} value={roomKey} className="border-l-2 border-secondary/30 ml-4">
                                  <AccordionTrigger className="hover:no-underline pl-4">
                                    <div className="flex items-center justify-between w-full pr-4">
                                      <div className="flex flex-col items-start gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">{room.name}</span>
                                          <Badge variant="outline" className="text-xs">{room.code}</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {room.equipment.length} оборудования • {room.area} м²
                                        </div>
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pl-4">
                                    <div className="space-y-2">
                                      {room.equipment.map((equipment, idx) => (
                                        <Card key={idx} className="bg-muted/50">
                                          <CardContent className="p-3">
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-medium text-sm">{equipment.name}</span>
                                                  {equipment.code && (
                                                    <Badge variant="outline" className="text-xs">{equipment.code}</Badge>
                                                  )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                  Количество: {equipment.quantity} {equipment.unit || ''}
                                                </div>
                                                {equipment.notes && (
                                                  <div className="text-xs text-muted-foreground italic">
                                                    {equipment.notes}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FloorsPage;
