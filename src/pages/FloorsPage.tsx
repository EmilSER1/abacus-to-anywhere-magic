import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Download, Plus, Edit, MapPin, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { EditDepartmentDialog } from '@/components/EditDepartmentDialog';
import { EditRoomDialog } from '@/components/EditRoomDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Navigation } from '@/components/Navigation';
import floorsData from '@/data/floorsData.json';

// Interface definitions
interface FloorData {
  "Этаж": string;
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

interface Room {
  code: string;
  name: string;
  equipment: Array<{
    code: string | null;
    name: string | null;
    unit: string | null;
    quantity: number | string | null;
    notes: string | null;
  }>;
}

interface Department {
  name: string;
  floor: string;
  block: string;
  rooms: Room[];
}

// Process floor data to group by departments
const processFloorData = (data: FloorData[]): Department[] => {
  const departmentMap = new Map<string, Department>();

  data.forEach(item => {
    const deptKey = `${item["Этаж"]}-${item["БЛОК"]}-${item["ОТДЕЛЕНИЕ"]}`;
    
    if (!departmentMap.has(deptKey)) {
      departmentMap.set(deptKey, {
        name: item["ОТДЕЛЕНИЕ"],
        floor: item["Этаж"],
        block: item["БЛОК"],
        rooms: []
      });
    }

    const department = departmentMap.get(deptKey)!;
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
    }
  });

  return Array.from(departmentMap.values());
};

export default function FloorsPage() {
  const [departments] = useState<Department[]>(() => processFloorData(floorsData as FloorData[]));
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const toggleDepartment = (deptKey: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptKey)) {
      newExpanded.delete(deptKey);
    } else {
      newExpanded.add(deptKey);
    }
    setExpandedDepts(newExpanded);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(departments, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'departments_data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Calculate statistics
  const totalDepartments = departments.length;
  const totalRooms = departments.reduce((sum, dept) => sum + dept.rooms.length, 0);
  const totalEquipment = departments.reduce((sum, dept) => 
    sum + dept.rooms.reduce((roomSum, room) => roomSum + room.equipment.length, 0), 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              Проектировщики
            </h1>
            <p className="text-gray-600 mt-1">Управление этажами, отделениями и помещениями</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportData} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Экспорт
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить отделение
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
              <p className="text-xs text-muted-foreground">активных отделений</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего помещений</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRooms}</div>
              <p className="text-xs text-muted-foreground">различных помещений</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего оборудования</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEquipment}</div>
              <p className="text-xs text-muted-foreground">единиц оборудования</p>
            </CardContent>
          </Card>
        </div>

        {/* Departments List */}
        <div className="space-y-6">
          {departments.map((department, deptIndex) => {
            const deptKey = `${department.floor}-${department.block}-${department.name}`;
            const isExpanded = expandedDepts.has(deptKey);

            return (
              <Card key={deptIndex} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleDepartment(deptKey)}>
                  <CollapsibleTrigger asChild>
                    <div className="p-6 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-semibold">{department.name}</h2>
                            <Badge variant="secondary">Этаж {department.floor}</Badge>
                            <Badge variant="outline">Блок {department.block}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {department.rooms.length} помещений
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {department.rooms.reduce((sum, room) => sum + room.equipment.length, 0)} единиц оборудования
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExpanded ? 
                            <ChevronDown className="h-5 w-5 text-gray-500" /> : 
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          }
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-6 pb-6 border-t bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {department.rooms.map((room, roomIndex) => (
                          <Card key={roomIndex} className="p-4 bg-white shadow-sm">
                            <div className="mb-3">
                              <h3 className="font-medium text-lg">{room.name}</h3>
                              <p className="text-sm text-gray-600 font-mono">{room.code}</p>
                            </div>
                            
                            {room.equipment.length > 0 && (
                              <div className="mt-3">
                                <h4 className="font-medium text-sm mb-2">Оборудование:</h4>
                                <div className="space-y-1">
                                  {room.equipment.map((eq, eqIndex) => (
                                    <div key={eqIndex} className="text-xs bg-gray-100 p-2 rounded">
                                      <div className="font-medium">{eq.name}</div>
                                      {eq.code && <div className="text-gray-600">Код: {eq.code}</div>}
                                      {eq.quantity && eq.unit && (
                                        <div className="text-gray-600">
                                          Количество: {eq.quantity} {eq.unit}
                                        </div>
                                      )}
                                      {eq.notes && (
                                        <div className="text-gray-500 italic">{eq.notes}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}