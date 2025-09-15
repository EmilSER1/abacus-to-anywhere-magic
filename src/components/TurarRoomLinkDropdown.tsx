import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useProjectorData } from '@/hooks/useProjectorData';
import { useDepartmentMappings } from '@/hooks/useDepartmentMappings';
import { useCreateRoomConnection, useDeleteRoomConnection } from '@/hooks/useRoomConnections';
import { Link, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TurarRoomLinkDropdownProps {
  turarDepartment: string;
  turarRoom: string;
  connectedRooms?: Array<{
    projector_department: string;
    projector_room: string;
    id: string;
  }>;
  onSuccess?: () => void;
}

export default function TurarRoomLinkDropdown({
  turarDepartment,
  turarRoom,
  connectedRooms = [],
  onSuccess
}: TurarRoomLinkDropdownProps) {
  const [selectedProjectorDept, setSelectedProjectorDept] = useState<string>('');
  const [selectedProjectorRoom, setSelectedProjectorRoom] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: projectorData } = useProjectorData();
  const { data: departmentMappings } = useDepartmentMappings();
  const createConnection = useCreateRoomConnection();
  const deleteConnection = useDeleteRoomConnection();

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
    
    console.log(`🔗 TurarRoomLinkDropdown для "${turarDepartment}":`, {
      mappingsFound: departmentMappings?.filter(m => m.turar_department.trim() === turarDepartment.trim()).length || 0,
      projectorLinksFound: projectorData?.filter(item => item.connected_turar_department === turarDepartment).length || 0,
      linkedDepartments: Array.from(departments)
    });
    
    return Array.from(departments).sort();
  }, [projectorData, departmentMappings, turarDepartment]);

  // Получаем комнаты выбранного отделения проектировщиков
  const projectorRooms = React.useMemo(() => {
    if (!projectorData || !selectedProjectorDept) return [];
    
    const rooms = new Set<string>();
    projectorData.forEach(item => {
      if (item["ОТДЕЛЕНИЕ"]?.trim() === selectedProjectorDept && item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]) {
        rooms.add(item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]);
      }
    });
    
    return Array.from(rooms).sort();
  }, [projectorData, selectedProjectorDept]);

  const handleCreateConnection = () => {
    if (!selectedProjectorDept || !selectedProjectorRoom) {
      toast({
        title: "Ошибка",
        description: "Выберите отделение и комнату проектировщиков",
        variant: "destructive"
      });
      return;
    }

    createConnection.mutate({
      turar_department: turarDepartment,
      turar_room: turarRoom,
      projector_department: selectedProjectorDept,
      projector_room: selectedProjectorRoom
    }, {
      onSuccess: () => {
        setSelectedProjectorDept('');
        setSelectedProjectorRoom('');
        setIsExpanded(false);
        onSuccess?.();
      }
    });
  };

  const handleDeleteConnection = (connectionId: string) => {
    deleteConnection.mutate(connectionId, {
      onSuccess: () => {
        onSuccess?.();
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* Показываем существующие связи */}
      {connectedRooms.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-green-700 dark:text-green-400">
            Связанные комнаты:
          </div>
          {connectedRooms.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Link className="h-3 w-3 text-green-600" />
                <span className="text-sm">
                  <span className="font-medium">{connection.projector_department}</span>
                  <span className="text-muted-foreground"> → </span>
                  <span className="font-medium">{connection.projector_room}</span>
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteConnection(connection.id)}
                disabled={deleteConnection.isPending}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Показываем интерфейс создания новой связи только если есть доступные отделения */}
      {linkedProjectorDepartments.length > 0 ? (
        <>
          {!isExpanded ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(true)}
              className="w-full"
            >
              <Link className="h-3 w-3 mr-2" />
              Связать с комнатой проектировщиков
            </Button>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-3 space-y-3">
                <div className="space-y-2">
                  <Select
                    value={selectedProjectorDept}
                    onValueChange={(value) => {
                      setSelectedProjectorDept(value);
                      setSelectedProjectorRoom('');
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Выберите отделение проектировщиков" />
                    </SelectTrigger>
                    <SelectContent>
                      {linkedProjectorDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedProjectorDept && (
                    <Select
                      value={selectedProjectorRoom}
                      onValueChange={setSelectedProjectorRoom}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Выберите комнату" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectorRooms.map((room) => (
                          <SelectItem key={room} value={room}>
                            {room}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateConnection}
                    disabled={!selectedProjectorRoom || createConnection.isPending}
                    className="h-7"
                  >
                    Связать
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsExpanded(false);
                      setSelectedProjectorDept('');
                      setSelectedProjectorRoom('');
                    }}
                    className="h-7"
                  >
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-xs text-muted-foreground italic">
          Сначала свяжите отделения
        </div>
      )}
    </div>
  );
}