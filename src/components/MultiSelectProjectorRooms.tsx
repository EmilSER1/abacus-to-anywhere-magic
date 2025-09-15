import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, Link, Check, Building2 } from 'lucide-react';
import { useProjectorData } from '@/hooks/useProjectorData';
import { useDepartmentMappings } from '@/hooks/useDepartmentMappings';

interface MultiSelectProjectorRoomsProps {
  turarDepartment: string;
  turarRoom: string;
  connectedRooms: Array<{
    projector_department: string;
    projector_room: string;
    id: string;
  }>;
  onAdd: (projectorDept: string, projectorRoom: string) => void;
  onRemove: (connectionId: string) => void;
  isLoading?: boolean;
}

export default function MultiSelectProjectorRooms({
  turarDepartment,
  turarRoom,
  connectedRooms,
  onAdd,
  onRemove,
  isLoading = false
}: MultiSelectProjectorRoomsProps) {
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());

  console.log('🚀 MultiSelectProjectorRooms RENDER:', {
    turarDepartment,
    turarRoom,
    connectedRoomsCount: connectedRooms.length,
    isLoading
  });

  const { data: projectorData } = useProjectorData();
  const { data: departmentMappings } = useDepartmentMappings();

  // Получаем отделения проектировщиков связанные с текущим отделением Турар
  const linkedProjectorDepartments = React.useMemo(() => {
    const departments = new Set<string>();
    
    console.log(`🔗 MultiSelectProjectorRooms: Ищем связанные отделения для "${turarDepartment}"`);
    
    // Сначала проверяем department_mappings (новый способ)
    const mappingsForDepartment = departmentMappings?.filter(mapping => 
      mapping.turar_department.trim() === turarDepartment.trim()
    ) || [];
    
    console.log('📋 Mappings found:', mappingsForDepartment);
    
    mappingsForDepartment.forEach(mapping => {
      departments.add(mapping.projector_department.trim());
    });
    
    // Затем проверяем projector_floors (старый способ для обратной совместимости)
    if (projectorData) {
      const oldStyleConnections = projectorData.filter(item => 
        item.connected_turar_department === turarDepartment && item["ОТДЕЛЕНИЕ"]
      );
      
      console.log('🏗️ Old style connections found:', oldStyleConnections.length);
      
      oldStyleConnections.forEach(item => {
        departments.add(item["ОТДЕЛЕНИЕ"].trim());
      });
    }
    
    const finalDepartments = Array.from(departments).sort();
    console.log('✅ Final linked departments:', finalDepartments);
    
    return finalDepartments;
  }, [projectorData, departmentMappings, turarDepartment]);

  // Получаем все кабинеты из связанных отделений проектировщиков
  const availableRooms = React.useMemo(() => {
    if (!projectorData || linkedProjectorDepartments.length === 0) {
      console.log('⚠️ No projectorData or linkedDepartments:', { 
        hasProjectorData: !!projectorData, 
        linkedDepartments: linkedProjectorDepartments
      });
      return [];
    }
    
    console.log('🏠 Getting rooms from all linked departments:', linkedProjectorDepartments);
    
    const allRooms = new Map<string, string>(); // room -> department
    
    // Проходим по всем связанным отделениям и собираем их кабинеты
    linkedProjectorDepartments.forEach(department => {
      const departmentRecords = projectorData.filter(item => 
        item["ОТДЕЛЕНИЕ"]?.trim() === department.trim()
      );
      
      console.log(`📋 Found ${departmentRecords.length} records for department "${department}"`);
      
      departmentRecords.forEach(item => {
        const roomName = item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"];
        if (roomName && roomName.trim()) {
          allRooms.set(roomName.trim(), department);
        }
      });
    });
    
    const roomsArray = Array.from(allRooms.keys()).sort();
    console.log('🏠 All available rooms from linked departments:', roomsArray.length, roomsArray.slice(0, 10));
    
    return roomsArray;
  }, [projectorData, linkedProjectorDepartments]);

  // Получаем отделение для конкретной комнаты
  const getRoomDepartment = (roomName: string): string => {
    if (!projectorData) return '';
    
    for (const department of linkedProjectorDepartments) {
      const hasRoom = projectorData.some(item => 
        item["ОТДЕЛЕНИЕ"]?.trim() === department.trim() && 
        item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]?.trim() === roomName.trim()
      );
      if (hasRoom) return department;
    }
    return linkedProjectorDepartments[0] || '';
  };

  const handleRoomCheckboxChange = (room: string, checked: boolean) => {
    const newSelectedRooms = new Set(selectedRooms);
    if (checked) {
      newSelectedRooms.add(room);
    } else {
      newSelectedRooms.delete(room);
    }
    setSelectedRooms(newSelectedRooms);
  };

  const handleAddSelectedRooms = () => {
    if (selectedRooms.size === 0) return;
    
    // Добавляем все выбранные комнаты
    selectedRooms.forEach(room => {
      const department = getRoomDepartment(room);
      onAdd(department, room);
    });
    
    // Очищаем выбор
    setSelectedRooms(new Set());
  };

  const isRoomAlreadyConnected = (roomName: string) => {
    return connectedRooms.some(conn => conn.projector_room === roomName);
  };

  console.log('🏠 MultiSelectProjectorRooms Final State:', {
    turarDepartment,
    turarRoom,
    linkedDepartments: linkedProjectorDepartments,
    availableRooms: availableRooms.length,
    connectedRooms: connectedRooms.length,
    hasProjectorData: !!projectorData,
    projectorDataLength: projectorData?.length || 0,
    hasDepartmentMappings: !!departmentMappings,
    departmentMappingsLength: departmentMappings?.length || 0
  });

  // Простая проверка - если данных совсем нет, покажем сообщение
  if (!projectorData && !departmentMappings) {
    return (
      <div className="p-4 border border-dashed rounded">
        <div className="text-sm text-muted-foreground">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Отладочная информация */}
      <div className="p-3 border rounded bg-blue-50 dark:bg-blue-900/20">
        <div className="text-sm font-medium mb-2">Отладка MultiSelectProjectorRooms:</div>
        <div className="text-xs space-y-1">
          <div>Турар отделение: "{turarDepartment}"</div>
          <div>Турар кабинет: "{turarRoom}"</div>
          <div>Связанные отделения: {linkedProjectorDepartments.length} - {JSON.stringify(linkedProjectorDepartments)}</div>
          <div>Доступные кабинеты: {availableRooms.length}</div>
          <div>Текущие связи: {connectedRooms.length}</div>
          <div>Данные проектировщиков: {projectorData?.length || 0}</div>
          <div>Связи отделений: {departmentMappings?.length || 0}</div>
        </div>
      </div>
      
      {/* Показываем текущие связи */}
      {connectedRooms.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-green-700 dark:text-green-400">
            Связанные кабинеты проектировщиков ({connectedRooms.length}):
          </div>
          <div className="space-y-2">
            {connectedRooms.map((conn) => (
              <div 
                key={conn.id} 
                className="flex items-center justify-between gap-2 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="font-medium">{conn.projector_department}</div>
                    <div className="text-xs text-muted-foreground">{conn.projector_room}</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(conn.id)}
                  disabled={isLoading}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Простой интерфейс выбора кабинетов */}
      {linkedProjectorDepartments.length > 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="text-sm font-medium mb-3">
              Добавить связи с кабинетами проектировщиков:
            </div>
            
            {/* Прямой выбор кабинетов */}
            {availableRooms.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Выберите кабинеты:</div>
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2">
                  {availableRooms.map((room) => {
                    const isConnected = isRoomAlreadyConnected(room);
                    const isSelected = selectedRooms.has(room);
                    const roomDepartment = getRoomDepartment(room);
                    
                    return (
                      <div key={room} className="flex items-center space-x-2">
                        <Checkbox
                          id={`room-${room}`}
                          checked={isSelected}
                          disabled={isConnected || isLoading}
                          onCheckedChange={(checked) => handleRoomCheckboxChange(room, checked as boolean)}
                        />
                        <label 
                          htmlFor={`room-${room}`} 
                          className={`text-sm flex-1 cursor-pointer ${
                            isSelected ? 'font-medium text-green-700 dark:text-green-400' : ''
                          } ${
                            isConnected ? 'opacity-50 line-through' : ''
                          }`}
                        >
                          <div>{room}</div>
                          <div className="text-xs text-muted-foreground">{roomDepartment}</div>
                          {isConnected && (
                            <span className="text-xs text-muted-foreground ml-2">(уже связан)</span>
                          )}
                        </label>
                        {isSelected && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {selectedRooms.size > 0 && (
                  <Button
                    size="sm"
                    onClick={handleAddSelectedRooms}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Добавить выбранные кабинеты ({selectedRooms.size})
                  </Button>
                )}
              </div>
            )}

            {availableRooms.length === 0 && (
              <div className="text-xs text-muted-foreground italic">
                Нет доступных кабинетов в связанных отделениях
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="text-xs text-muted-foreground italic">
          Сначала свяжите отделения
        </div>
      )}
    </div>
  );
}