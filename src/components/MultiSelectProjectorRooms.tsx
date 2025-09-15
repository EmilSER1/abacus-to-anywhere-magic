import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());

  const { data: projectorData } = useProjectorData();
  const { data: departmentMappings } = useDepartmentMappings();

  // Получаем отделения проектировщиков связанные с текущим отделением Турар
  const linkedProjectorDepartments = React.useMemo(() => {
    const departments = new Set<string>();
    
    // Сначала проверяем department_mappings (новый способ)
    departmentMappings?.forEach(mapping => {
      if (mapping.turar_department.trim() === turarDepartment.trim()) {
        departments.add(mapping.projector_department.trim());
      }
    });
    
    // Затем проверяем projector_floors (старый способ для обратной совместимости)
    if (projectorData) {
      projectorData.forEach(item => {
        if (item.connected_turar_department === turarDepartment && item["ОТДЕЛЕНИЕ"]) {
          departments.add(item["ОТДЕЛЕНИЕ"].trim());
        }
      });
    }
    
    return Array.from(departments).sort();
  }, [projectorData, departmentMappings, turarDepartment]);

  // Получаем комнаты выбранного отделения проектировщиков
  const availableRooms = React.useMemo(() => {
    if (!projectorData || !selectedDepartment) return [];
    
    const rooms = new Set<string>();
    projectorData.forEach(item => {
      if (item["ОТДЕЛЕНИЕ"]?.trim() === selectedDepartment && item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]) {
        rooms.add(item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]);
      }
    });
    
    return Array.from(rooms).sort();
  }, [projectorData, selectedDepartment]);

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
    if (!selectedDepartment || selectedRooms.size === 0) return;
    
    // Добавляем все выбранные комнаты
    selectedRooms.forEach(room => {
      onAdd(selectedDepartment, room);
    });
    
    // Очищаем выбор
    setSelectedRooms(new Set());
    setSelectedDepartment('');
  };

  const isRoomAlreadyConnected = (dept: string, room: string) => {
    return connectedRooms.some(conn => 
      conn.projector_department === dept && conn.projector_room === room
    );
  };

  console.log('🏠 MultiSelectProjectorRooms Debug:', {
    turarDepartment,
    turarRoom,
    linkedDepartments: linkedProjectorDepartments,
    selectedDepartment,
    availableRooms: availableRooms.length,
    connectedRooms: connectedRooms.length
  });

  return (
    <div className="space-y-3">
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

      {/* Интерфейс добавления новых связей */}
      {linkedProjectorDepartments.length > 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="text-sm font-medium mb-3">
              Добавить связи с кабинетами проектировщиков:
            </div>
            
            {/* Выбор отделения */}
            <div className="space-y-3">
              <Select
                value={selectedDepartment}
                onValueChange={(value) => {
                  setSelectedDepartment(value);
                  setSelectedRooms(new Set()); // Очищаем выбранные комнаты при смене отделения
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите отделение проектировщиков" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {linkedProjectorDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Выбор комнат */}
              {selectedDepartment && availableRooms.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Выберите кабинеты:</div>
                  <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2">
                    {availableRooms.map((room) => {
                      const isConnected = isRoomAlreadyConnected(selectedDepartment, room);
                      const isSelected = selectedRooms.has(room);
                      
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
                            {room}
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

              {selectedDepartment && availableRooms.length === 0 && (
                <div className="text-xs text-muted-foreground italic">
                  Нет доступных кабинетов в выбранном отделении
                </div>
              )}
            </div>
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