import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Link2, ChevronDown, Check } from 'lucide-react';
import { useTurarMedicalData } from '@/hooks/useTurarMedicalData';
import { useCreateRoomConnectionById } from '@/hooks/useRoomConnectionsById';

interface RoomLinkDropdownProps {
  roomId: string;
  roomName: string;
  departmentId: string;
  departmentName: string;
  connectedTurarDepartment?: string | null;
  isProjectorDepartment?: boolean;
  onSuccess?: () => void;
}

export default function RoomLinkDropdown({
  roomId,
  roomName,
  departmentId,
  departmentName,
  connectedTurarDepartment,
  isProjectorDepartment = true,
  onSuccess
}: RoomLinkDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [isCreatingConnections, setIsCreatingConnections] = useState(false);
  const { data: turarData } = useTurarMedicalData();
  const createConnection = useCreateRoomConnectionById();

  // Получаем кабинеты из связанного отделения Турар
  const availableRooms = React.useMemo(() => {
    if (!turarData || !connectedTurarDepartment) return [];
    
    const rooms = new Set<string>();
    turarData.forEach(item => {
      if (item["Отделение/Блок"] === connectedTurarDepartment && item["Помещение/Кабинет"]) {
        rooms.add(item["Помещение/Кабинет"]);
      }
    });
    
    return Array.from(rooms).sort();
  }, [turarData, connectedTurarDepartment]);

  // Обработчик выбора/отмены выбора кабинета
  const handleRoomToggle = (turarRoomName: string) => {
    const newSelectedRooms = new Set(selectedRooms);
    if (newSelectedRooms.has(turarRoomName)) {
      newSelectedRooms.delete(turarRoomName);
    } else {
      newSelectedRooms.add(turarRoomName);
    }
    setSelectedRooms(newSelectedRooms);
  };

  // Создание связей для всех выбранных кабинетов
  const handleCreateConnections = async () => {
    if (!connectedTurarDepartment || selectedRooms.size === 0) return;

    setIsCreatingConnections(true);
    
    try {
      for (const turarRoomName of selectedRooms) {
        const turarRoom = turarData?.find(item => 
          item["Отделение/Блок"] === connectedTurarDepartment && 
          item["Помещение/Кабинет"] === turarRoomName
        );

        await createConnection.mutateAsync({
          projector_room_id: roomId,
          turar_room_id: turarRoom?.id,
          projector_department_id: departmentId,
          turar_department_id: undefined
        });
      }

      setSelectedRooms(new Set()); // Очищаем выбор
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating room connections:', error);
    } finally {
      setIsCreatingConnections(false);
    }
  };

  // Если нет связанного отделения Турар, показываем обычную кнопку
  if (!connectedTurarDepartment) {
    return (
      <Button
        size="sm"
        variant="outline" 
        className="gap-1 h-7 text-xs px-2"
        disabled
      >
        <Link2 className="h-3 w-3" />
        Нет связи с Турар
      </Button>
    );
  }

  // Если нет доступных кабинетов
  if (availableRooms.length === 0) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="gap-1 h-7 text-xs px-2"
        disabled
      >
        <Link2 className="h-3 w-3" />
        Нет кабинетов
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-1 h-7 text-xs px-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Link2 className="h-3 w-3" />
          Связать
          {selectedRooms.size > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {selectedRooms.size}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-64 max-h-64 overflow-y-auto bg-white dark:bg-gray-900 border shadow-md z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">
          Кабинеты из: {connectedTurarDepartment}
        </div>
        
        <div className="p-2 space-y-1">
          {availableRooms.map((room) => {
            const isSelected = selectedRooms.has(room);
            return (
              <div
                key={room}
                className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-primary/20 border border-primary/50' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoomToggle(room);
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => {}} // Контролируется через onClick
                  className="pointer-events-none"
                />
                <Link2 className="h-3 w-3" />
                <span className="text-xs flex-1">{room}</span>
                {isSelected && <Check className="h-3 w-3 text-primary" />}
              </div>
            );
          })}
        </div>
        
        {selectedRooms.size > 0 && (
          <div className="border-t p-2">
            <Button
              size="sm"
              className="w-full text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateConnections();
              }}
              disabled={isCreatingConnections}
            >
              {isCreatingConnections ? 'Создание связей...' : `Создать связи (${selectedRooms.size})`}
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}