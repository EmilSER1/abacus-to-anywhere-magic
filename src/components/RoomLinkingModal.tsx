import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Link2, Check, X } from 'lucide-react';
import { useProjectorData } from '@/hooks/useProjectorData';
import { useTurarMedicalData } from '@/hooks/useTurarMedicalData';
import { useDepartmentMappings } from '@/hooks/useDepartmentMappings';
import { 
  useRoomConnectionsByTurarRoom, 
  useCreateRoomConnectionById, 
  useDeleteRoomConnectionById,
  useFindRoomId 
} from '@/hooks/useRoomConnectionsById';
import { toast } from '@/hooks/use-toast';

interface RoomLinkingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'turar-to-projector' | 'projector-to-turar';
  turarDepartment?: string;
  turarRoom?: string;
  projectorDepartment?: string;
  projectorRoom?: string;
}

export default function RoomLinkingModal({
  open,
  onOpenChange,
  mode,
  turarDepartment,
  turarRoom,
  projectorDepartment,
  projectorRoom
}: RoomLinkingModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);

  const { data: projectorData = [] } = useProjectorData();
  const { data: turarData = [] } = useTurarMedicalData();
  const { data: departmentMappings = [] } = useDepartmentMappings();
  
  // Get current connections
  const { data: currentConnections = [] } = useRoomConnectionsByTurarRoom(
    turarDepartment || '', 
    turarRoom || ''
  );
  
  const createConnection = useCreateRoomConnectionById();
  const deleteConnection = useDeleteRoomConnectionById();
  const { findTurarRoomId, findProjectorRoomId } = useFindRoomId();

  // Get linked departments based on mode
  const linkedDepartments = useMemo(() => {
    console.log('🔗 Computing linkedDepartments:', {
      mode,
      turarDepartment,
      projectorDepartment,
      totalMappings: departmentMappings.length,
      mappings: departmentMappings.slice(0, 3)
    });

    let result;
    if (mode === 'turar-to-projector') {
      result = departmentMappings
        .filter(mapping => mapping.turar_department === turarDepartment)
        .map(mapping => mapping.projector_department);
    } else {
      result = departmentMappings
        .filter(mapping => mapping.projector_department === projectorDepartment)
        .map(mapping => mapping.turar_department);
    }

    console.log('✅ linkedDepartments result:', result);
    return result;
  }, [departmentMappings, mode, turarDepartment, projectorDepartment]);

  // Get available rooms based on mode and linked departments
  const availableRooms = useMemo(() => {
    console.log('🏠 Computing availableRooms:', {
      mode,
      linkedDepartmentsCount: linkedDepartments.length,
      linkedDepartments,
      projectorDataCount: projectorData?.length || 0,
      turarDataCount: turarData?.length || 0,
      sampleProjectorDepts: projectorData?.slice(0, 3).map(r => r["ОТДЕЛЕНИЕ"]) || [],
      sampleTurarDepts: turarData?.slice(0, 3).map(r => r["Отделение/Блок"]) || []
    });

    if (!linkedDepartments.length) {
      console.log('❌ No linked departments');
      return [];
    }

    let result;
    if (mode === 'turar-to-projector') {
      const filtered = projectorData.filter(room => {
        const roomDept = room["ОТДЕЛЕНИЕ"];
        const hasMatch = linkedDepartments.includes(roomDept);
        if (hasMatch) {
          console.log('✅ Found matching projector room:', { roomDept, room: room["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] });
        }
        return hasMatch;
      });

      result = filtered
        .map(room => ({
          id: room.id,
          department: room["ОТДЕЛЕНИЕ"],
          name: room["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"],
          code: room["КОД ПОМЕЩЕНИЯ"] || room["Код помещения"] || '',
        }))
        .sort((a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name));
    } else {
      const filtered = turarData.filter(room => {
        const roomDept = room["Отделение/Блок"];
        const hasMatch = linkedDepartments.includes(roomDept);
        if (hasMatch) {
          console.log('✅ Found matching turar room:', { roomDept, room: room["Помещение/Кабинет"] });
        }
        return hasMatch;
      });

      result = filtered
        .map(room => ({
          id: room.id,
          department: room["Отделение/Блок"],
          name: room["Помещение/Кабинет"],
          code: room["Код оборудования"] || '',
        }))
        .sort((a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name));
    }

    console.log('🎯 Final availableRooms:', {
      count: result.length,
      byDepartment: result.reduce((acc, room) => {
        acc[room.department] = (acc[room.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

    return result;
  }, [projectorData, turarData, linkedDepartments, mode]);

  // Filter rooms based on search
  const filteredRooms = useMemo(() => {
    if (!searchQuery) return availableRooms;
    const query = searchQuery.toLowerCase();
    return availableRooms.filter(room => 
      room.name.toLowerCase().includes(query) ||
      room.department.toLowerCase().includes(query) ||
      room.code.toLowerCase().includes(query)
    );
  }, [availableRooms, searchQuery]);

  // Group rooms by department
  const roomsByDepartment = useMemo(() => {
    const grouped: Record<string, typeof filteredRooms> = {};
    filteredRooms.forEach(room => {
      if (!grouped[room.department]) {
        grouped[room.department] = [];
      }
      grouped[room.department].push(room);
    });
    return grouped;
  }, [filteredRooms]);

  // Check if room is already connected
  const isRoomConnected = (roomId: string) => {
    if (mode === 'turar-to-projector') {
      return currentConnections.some(conn => conn.projector_room_id === roomId);
    } else {
      return currentConnections.some(conn => conn.turar_room_id === roomId);
    }
  };

  // Handle room selection
  const handleRoomToggle = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  // Handle creating connections
  const handleCreateConnections = async () => {
    try {
      if (mode === 'turar-to-projector') {
        const turarRoomId = await findTurarRoomId(turarDepartment!, turarRoom!);
        if (!turarRoomId) {
          toast({
            title: "Ошибка",
            description: "Не удалось найти ID комнаты Turar",
            variant: "destructive"
          });
          return;
        }

        for (const projectorRoomId of selectedRooms) {
          await createConnection.mutateAsync({
            turar_room_id: turarRoomId,
            projector_room_id: projectorRoomId
          });
        }
      } else {
        // TODO: Implement projector-to-turar logic
        const projectorRoomId = await findProjectorRoomId(projectorDepartment!, projectorRoom!);
        if (!projectorRoomId) {
          toast({
            title: "Ошибка",
            description: "Не удалось найти ID комнаты проектировщиков",
            variant: "destructive"
          });
          return;
        }

        for (const turarRoomId of selectedRooms) {
          await createConnection.mutateAsync({
            turar_room_id: turarRoomId,
            projector_room_id: projectorRoomId
          });
        }
      }

      toast({
        title: "Успешно",
        description: `Создано ${selectedRooms.length} связей`,
      });

      setSelectedRooms([]);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать связи",
        variant: "destructive"
      });
    }
  };

  // Handle removing connection
  const handleRemoveConnection = async (connectionId: string) => {
    try {
      await deleteConnection.mutateAsync(connectionId);
      toast({
        title: "Успешно",
        description: "Связь удалена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить связь",
        variant: "destructive"
      });
    }
  };

  const title = mode === 'turar-to-projector' 
    ? `Связать кабинеты: ${turarRoom} (${turarDepartment})`
    : `Связать кабинеты: ${projectorRoom} (${projectorDepartment})`;

  const targetType = mode === 'turar-to-projector' ? 'проектировщиков' : 'Turar';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Current connections */}
          {currentConnections.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Текущие связи:</h4>
              <div className="flex flex-wrap gap-2">
                {currentConnections.map(conn => (
                  <Badge key={conn.connection_id} variant="secondary" className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {mode === 'turar-to-projector' 
                      ? `${conn.projector_room} (${conn.projector_department})`
                      : `${conn.turar_room} (${conn.turar_department})`
                    }
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleRemoveConnection(conn.connection_id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <Separator />
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Поиск кабинетов ${targetType}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Available rooms */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Debug info */}
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Связанных отделений: {linkedDepartments.length} | 
              Доступных кабинетов: {availableRooms.length} | 
              После фильтра: {filteredRooms.length}
            </div>

            {linkedDepartments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-lg font-medium mb-2">Нет связанных отделений</div>
                <div className="text-sm">
                  Сначала необходимо создать связи между отделениями в разделе администрирования
                </div>
              </div>
            ) : Object.keys(roomsByDepartment).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-lg font-medium mb-2">Нет доступных кабинетов</div>
                <div className="text-sm">
                  В связанных отделениях ({linkedDepartments.join(', ')}) не найдено кабинетов
                </div>
              </div>
            ) : (
              Object.entries(roomsByDepartment).map(([department, rooms]) => (
                <div key={department} className="space-y-2">
                  <h4 className="font-medium text-sm sticky top-0 bg-background p-2 border-b">
                    {department} ({rooms.length} кабинетов)
                  </h4>
                  <div className="space-y-1 px-2">
                    {rooms.map(room => {
                      const isConnected = isRoomConnected(room.id);
                      const isSelected = selectedRooms.includes(room.id);
                      
                      return (
                        <div 
                          key={room.id}
                          className={`flex items-center space-x-2 p-2 rounded-md border transition-colors ${
                            isConnected 
                              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleRoomToggle(room.id)}
                            disabled={isConnected}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {room.name}
                            </div>
                            {room.code && (
                              <div className="text-xs text-muted-foreground">
                                Код: {room.code}
                              </div>
                            )}
                          </div>
                          {isConnected && (
                            <Badge variant="secondary" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Связан
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleCreateConnections}
            disabled={selectedRooms.length === 0 || createConnection.isPending}
          >
            {createConnection.isPending ? 'Создание...' : `Связать выбранные (${selectedRooms.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}