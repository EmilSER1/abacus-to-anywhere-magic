import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { useProjectorData } from "@/hooks/useProjectorData";
import { useDepartmentMappings } from "@/hooks/useDepartmentMappings";
import {
  useRoomConnectionsByTurarRoom,
  useCreateRoomConnectionById,
  useDeleteRoomConnectionById,
  useFindRoomId,
  RoomConnectionWithDetails
} from "@/hooks/useRoomConnectionsById";
import { toast } from "sonner";

interface MultiSelectProjectorRoomsByIdProps {
  turarDepartment: string;
  turarRoom: string;
  turarRoomId?: string;
  onSuccess?: () => void;
}

export const MultiSelectProjectorRoomsById: React.FC<MultiSelectProjectorRoomsByIdProps> = ({
  turarDepartment,
  turarRoom,
  turarRoomId,
  onSuccess
}) => {
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  
  const { data: projectorData, isLoading: isProjectorLoading } = useProjectorData();
  const { data: departmentMappings, isLoading: isMappingsLoading } = useDepartmentMappings();
  const { data: connectedRooms = [], isLoading: isConnectionsLoading } = useRoomConnectionsByTurarRoom(turarDepartment, turarRoom);
  
  const createConnectionById = useCreateRoomConnectionById();
  const deleteConnectionById = useDeleteRoomConnectionById();
  const { findTurarRoomId, findProjectorRoomId } = useFindRoomId();

  // Получаем связанные отделения проектировщиков через department_mappings
  const linkedProjectorDepartments = useMemo(() => {
    if (!departmentMappings) return new Set<string>();
    
    const departments = new Set<string>();
    
    departmentMappings.forEach(mapping => {
      if (mapping.turar_department.trim() === turarDepartment.trim()) {
        departments.add(mapping.projector_department.trim());
      }
    });
    
    return departments;
  }, [departmentMappings, turarDepartment]);

  // Получаем доступные комнаты из связанных отделений
  const availableRooms = useMemo(() => {
    if (!projectorData || linkedProjectorDepartments.size === 0) return [];
    
    const roomsMap = new Map();
    
    projectorData.forEach(item => {
      const department = item["ОТДЕЛЕНИЕ"]?.trim();
      const roomName = item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]?.trim();
      
      if (department && roomName && linkedProjectorDepartments.has(department)) {
        const key = `${department}|${roomName}`;
        if (!roomsMap.has(key)) {
          roomsMap.set(key, {
            id: item.id,
            department,
            room: roomName,
            floor: item["ЭТАЖ"]
          });
        }
      }
    });
    
    return Array.from(roomsMap.values()).sort((a, b) => 
      a.department.localeCompare(b.department) || a.room.localeCompare(b.room)
    );
  }, [projectorData, linkedProjectorDepartments]);

  const handleRoomCheckboxChange = (roomId: string, checked: boolean) => {
    setSelectedRooms(prev => 
      checked ? [...prev, roomId] : prev.filter(id => id !== roomId)
    );
  };

  const handleAddSelectedRooms = async () => {
    if (selectedRooms.length === 0) return;

    try {
      // Найти ID комнаты Turar, если не передан
      let currentTurarRoomId = turarRoomId;
      if (!currentTurarRoomId) {
        currentTurarRoomId = await findTurarRoomId(turarDepartment, turarRoom);
        if (!currentTurarRoomId) {
          toast.error("Не удалось найти ID комнаты Turar");
          return;
        }
      }

      // Создать связи для всех выбранных комнат
      await Promise.all(
        selectedRooms.map(projectorRoomId =>
          createConnectionById.mutateAsync({
            turar_room_id: currentTurarRoomId!,
            projector_room_id: projectorRoomId
          })
        )
      );

      setSelectedRooms([]);
      onSuccess?.();
      toast.success(`Добавлено ${selectedRooms.length} связей`);
    } catch (error) {
      console.error("Ошибка при создании связей:", error);
      toast.error("Ошибка при создании связей");
    }
  };

  const handleRemoveConnection = async (connection: RoomConnectionWithDetails) => {
    try {
      await deleteConnectionById.mutateAsync(connection.connection_id);
      onSuccess?.();
      toast.success("Связь удалена");
    } catch (error) {
      console.error("Ошибка при удалении связи:", error);
      toast.error("Ошибка при удалении связи");
    }
  };

  const isRoomAlreadyConnected = (roomId: string) => {
    return connectedRooms.some(connection => connection.projector_room_id === roomId);
  };

  if (isProjectorLoading || isMappingsLoading || isConnectionsLoading) {
    return <div className="text-center py-4">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Текущие связи */}
      {connectedRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Связанные комнаты проектировщиков ({connectedRooms.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {connectedRooms.map((connection) => (
              <div
                key={connection.connection_id}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {connection.projector_room}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {connection.projector_department}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveConnection(connection)}
                  disabled={deleteConnectionById.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Доступные комнаты для связывания */}
      {linkedProjectorDepartments.size > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Доступные комнаты проектировщиков
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableRooms.length > 0 ? (
              <>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableRooms.map((room) => {
                    const isConnected = isRoomAlreadyConnected(room.id);
                    const isSelected = selectedRooms.includes(room.id);
                    
                    return (
                      <div
                        key={room.id}
                        className={`flex items-center space-x-3 p-2 rounded-md border ${
                          isConnected ? 'bg-muted opacity-50' : ''
                        }`}
                      >
                        <Checkbox
                          id={room.id}
                          checked={isSelected}
                          disabled={isConnected}
                          onCheckedChange={(checked) =>
                            handleRoomCheckboxChange(room.id, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{room.room}</div>
                          <div className="text-xs text-muted-foreground">
                            {room.department} • Этаж {room.floor}
                          </div>
                        </div>
                        {isConnected && (
                          <Badge variant="secondary" className="text-xs">
                            Связана
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedRooms.length > 0 && (
                  <div className="pt-3 border-t">
                    <Button
                      onClick={handleAddSelectedRooms}
                      disabled={createConnectionById.isPending}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить выбранные ({selectedRooms.length})
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Нет доступных комнат в связанных отделениях
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          Сначала свяжите отделение проектировщиков с отделением Turar
        </div>
      )}
    </div>
  );
};

export default MultiSelectProjectorRoomsById;