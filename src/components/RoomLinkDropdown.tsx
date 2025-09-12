import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link2, ChevronDown } from 'lucide-react';
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

  const handleRoomLink = async (turarRoomName: string) => {
    if (!connectedTurarDepartment) return;

    // Получаем ID комнат Турар
    const turarRoom = turarData?.find(item => 
      item["Отделение/Блок"] === connectedTurarDepartment && 
      item["Помещение/Кабинет"] === turarRoomName
    );

    try {
      await createConnection.mutateAsync({
        projector_room_id: roomId,
        turar_room_id: turarRoom?.id,
        projector_department_id: departmentId,
        turar_department_id: undefined // Пока не используем ID отделений
      });

      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating room connection:', error);
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
        {availableRooms.map((room) => (
          <DropdownMenuItem
            key={room}
            className="text-xs cursor-pointer hover:bg-muted/50"
            onClick={(e) => {
              e.stopPropagation();
              handleRoomLink(room);
            }}
          >
            <Link2 className="h-3 w-3 mr-2" />
            {room}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}