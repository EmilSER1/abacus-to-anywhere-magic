import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Link2, Check, X } from 'lucide-react';
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

        if (turarRoom?.id) {
          await createConnection.mutateAsync({
            projector_room_id: roomId,
            turar_room_id: turarRoom.id,
            projector_department_id: departmentId,
            turar_department_id: '' // Передаем пустую строку для совместимости
          });
        }
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
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
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-sm">
            Связывание кабинета: <span className="font-bold text-primary">{roomName}</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Выберите кабинеты из отделения: <span className="font-medium">{connectedTurarDepartment}</span>
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="max-h-64 overflow-y-auto border rounded-md p-2">
            <div className="space-y-2">
              {availableRooms.map((room) => {
                const isSelected = selectedRooms.has(room);
                return (
                  <div
                    key={room}
                    className={`flex items-center space-x-3 p-3 rounded cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-primary/20 border-2 border-primary/50 shadow-sm' 
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                    onClick={() => handleRoomToggle(room)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => {}} // Контролируется через onClick
                      className="pointer-events-none"
                    />
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1">{room}</span>
                    {isSelected && (
                      <div className="flex items-center gap-1">
                        <Check className="h-4 w-4 text-primary" />
                        <Badge variant="secondary" className="text-xs">Выбран</Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              Выбрано: <span className="font-medium">{selectedRooms.size} кабинет(ов)</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedRooms(new Set());
                  setIsOpen(false);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Отмена
              </Button>
              <Button
                size="sm"
                onClick={handleCreateConnections}
                disabled={isCreatingConnections || selectedRooms.size === 0}
              >
                {isCreatingConnections ? 'Создание...' : `Создать связи (${selectedRooms.size})`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}