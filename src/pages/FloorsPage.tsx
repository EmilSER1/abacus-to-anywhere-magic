import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Download, Edit, Plus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EquipmentTable } from '@/components/EquipmentTable';
import { EditDepartmentDialog } from '@/components/EditDepartmentDialog';
import { EditRoomDialog } from '@/components/EditRoomDialog';

import { useSearchParams } from 'react-router-dom';
import { useFloorsData, FloorData } from '@/hooks/useFloorsData';
import { useUserRole } from '@/hooks/useUserRole';
import { useFullEquipmentExport } from '@/hooks/useFullEquipmentExport';
import { useToast } from '@/hooks/use-toast';
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
  id: string;
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
        id: item.id,
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
  const { canEdit } = useUserRole();
  const { refetch: fetchFullExportData } = useFullEquipmentExport();
  const { toast } = useToast();

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

  const exportToExcel = async () => {
    try {
      toast({
        title: "Подготовка экспорта",
        description: "Загружаем данные...",
      });

      const { data: fullData } = await fetchFullExportData();
      
      if (!fullData || fullData.length === 0) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Нет данных для экспорта",
        });
        return;
      }

      // Format data for Excel with all 60+ columns
      const exportData = fullData.map(item => ({
        // Room information
        'Этаж': item.floor,
        'Блок': item.block,
        'Отделение': item.department,
        'Код помещения': item.room_code,
        'Наименование помещения': item.room_name,
        'Площадь (м2)': item.area,
        
        // Basic equipment info
        'Код оборудования': item.equipment_code || '',
        'Наименование оборудования': item.equipment_name || '',
        'Наименование (модель)': item.model_name || '',
        'Код оборудования*': item.equipment_code_required || '',
        'Вид': item.equipment_type || '',
        'Бренд': item.brand || '',
        'Страна': item.country || '',
        'Спецификация': item.specification || '',
        'Стандарт': item.standard || '',
        'Количество': item.quantity || '',
        'Ед. изм.': item.unit || '',
        'Примечания': item.notes || '',
        
        // Technical specifications
        'Габариты': item.dimensions || '',
        'Влажность/Температура': item.humidity_temperature || '',
        'Напряжение': item.voltage || '',
        'Частота': item.frequency || '',
        'Мощность (Вт)': item.power_watts || '',
        'Пиковая мощность (Вт)': item.power_watts_peak || '',
        'ИБП': item.ups || '',
        'Нагрузка на пол': item.floor_load || '',
        'Самая тяжелая нагрузка на пол': item.floor_load_heaviest || '',
        'Самая тяжелая нагрузка на потолок': item.ceiling_load_heaviest || '',
        'Чиллер': item.chiller ? 'Да' : 'Нет',
        'Прецизионный кондиционер': item.precision_ac ? 'Да' : 'Нет',
        'Вытяжка': item.exhaust || '',
        'Дренаж': item.drainage || '',
        'Горячая вода': item.hot_water || '',
        'Холодная вода': item.cold_water || '',
        'Дистиллированная вода': item.distilled_water || '',
        'Бак нейтрализации': item.neutralization_tank || '',
        'Требования к данным': item.data_requirements || '',
        'Кнопки экстренного вызова': item.emergency_buttons || '',
        'Лампы предупреждения о рентгене': item.xray_warning_lamps || '',
        'Фальшпол': item.raised_floor || '',
        'Потолочные подвесы': item.ceiling_drops || '',
        
        // Medical gases
        'Медицинский газ O2': item.medical_gas_o2 || '',
        'Медицинский газ MA4': item.medical_gas_ma4 || '',
        'Медицинский газ MA7': item.medical_gas_ma7 || '',
        'Медицинский газ N2O': item.medical_gas_n2o || '',
        'Медицинский газ (другое)': item.medical_gas_other || '',
        'Прочие требования': item.other_requirements || '',
        
        // Purchase information
        'Цена закупа': item.purchase_price || '',
        'Валюта': item.purchase_currency || '',
        'Дата обновления цены': item.price_updated_at ? new Date(item.price_updated_at).toLocaleDateString('ru-RU') : '',
        'Условия инкотермс': item.incoterms || '',
        'Поставщик': item.supplier || '',
        'Статус поставщика': item.supplier_status || '',
        'Контакты поставщика': item.supplier_contacts ? 
          (Array.isArray(item.supplier_contacts) ? 
            item.supplier_contacts.map((c: any) => 
              `${c.name || ''}: ${c.contact || ''}`
            ).join('; ') : 
            JSON.stringify(item.supplier_contacts)) : '',
        
        // Documents
        'Документы': item.documents ? 
          (Array.isArray(item.documents) ? 
            item.documents.map((d: any) => d.url || d.path || d).join(', ') : 
            JSON.stringify(item.documents)) : '',
        
        // Timestamps
        'Дата создания': new Date(item.created_at).toLocaleDateString('ru-RU'),
        'Дата обновления': new Date(item.updated_at).toLocaleDateString('ru-RU'),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Проект');
      
      XLSX.writeFile(workbook, `project_full_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Экспорт завершен",
        description: `Экспортировано ${exportData.length} записей`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
      });
    }
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
      <div className="container mx-auto px-0 py-8 max-w-full">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Данные проекта</CardTitle>
                  <CardDescription>Полная информация по этажам, отделениям и оборудованию</CardDescription>
                </div>
              </div>
              {canEdit() && (
                <Button onClick={exportToExcel} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Excel
                </Button>
              )}
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
                                <EditDepartmentDialog department={{ id: deptKey, name: department.name }} />
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
                                          <EditRoomDialog room={{ id: room.id, name: room.name, code: room.code, area: room.area }} />
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {room.area} м²
                                        </div>
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pl-4">
                                    <EquipmentTable roomId={room.id} />
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