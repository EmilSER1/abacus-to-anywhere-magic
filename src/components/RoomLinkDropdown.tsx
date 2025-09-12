import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Link2, Check, X, Search, LinkIcon } from 'lucide-react';
import { useTurarMedicalData } from '@/hooks/useTurarMedicalData';
import { useRoomConnectionsById } from '@/hooks/useRoomConnectionsById';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

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
  const [searchTerm, setSearchTerm] = useState('');
  const { data: turarData } = useTurarMedicalData();
  const { data: existingConnections } = useRoomConnectionsById();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Получаем кабинеты для выбранного отделения с фильтрацией по поиску
  const availableRooms = useMemo(() => {
    if (!turarData || !connectedTurarDepartment) return [];
    
    const rooms = new Set<string>();
    turarData.forEach(item => {
      if (item["Отделение/Блок"] === connectedTurarDepartment && item["Помещение/Кабинет"]) {
        rooms.add(item["Помещение/Кабинет"]);
      }
    });
    
    const filteredRooms = Array.from(rooms)
      .filter(room => searchTerm === '' || room.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort();
    
    return filteredRooms;
  }, [turarData, connectedTurarDepartment, searchTerm]);

  // Получаем связанные с этим кабинетом проектировщиков кабинеты Турар
  const connectedTurarRooms = useMemo(() => {
    if (!existingConnections) return new Set<string>();
    
    const connected = new Set<string>();
    existingConnections.forEach(conn => {
      if (conn.projector_room_id === roomId || 
          (conn.projector_room === roomName && conn.projector_department === departmentName)) {
        connected.add(conn.turar_room);
      }
    });
    
    return connected;
  }, [existingConnections, roomId, roomName, departmentName]);

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

    console.log('🔄 Starting connection creation:', {
      connectedTurarDepartment,
      selectedRoomsCount: selectedRooms.size,
      selectedRooms: Array.from(selectedRooms),
      roomId,
      roomName,
      departmentName
    });

    setIsCreatingConnections(true);
    
    try {
      for (const turarRoomName of selectedRooms) {
        const turarRoom = turarData?.find(item => 
          item["Отделение/Блок"] === connectedTurarDepartment && 
          item["Помещение/Кабинет"] === turarRoomName
        );

        console.log('🔄 Creating connection for room:', {
          turarRoomName,
          turarRoom: turarRoom ? { id: turarRoom.id, name: turarRoom["Помещение/Кабинет"] } : null
        });

        if (turarRoom?.id) {
          // Создаем связь напрямую в Supabase без промежуточного хука
          const connectionData = {
            turar_department: connectedTurarDepartment,
            turar_room: turarRoomName,
            projector_department: departmentName,
            projector_room: roomName,
            turar_room_id: turarRoom.id,
            projector_room_id: roomId
          };
          
          console.log('📤 Sending connection data:', connectionData);

          const { data, error } = await supabase
            .from("room_connections")
            .insert([connectionData])
            .select()
            .single();

          if (error) {
            console.error('❌ Error creating connection:', error);
            throw error;
          }
          
          console.log('✅ Connection created successfully:', data);
        } else {
          console.error('❌ Turar room not found:', turarRoomName);
        }
      }

      console.log('🎉 All connections created successfully');
      
      // Обновляем кэш
      queryClient.invalidateQueries({ queryKey: ["room-connections"] });
      queryClient.invalidateQueries({ queryKey: ["floors-data"] });
      queryClient.invalidateQueries({ queryKey: ["projector-equipment"] });
      
      // Показываем уведомление об успехе
      toast({
        title: "Связи созданы",
        description: `Создано ${selectedRooms.size} связей для кабинета ${roomName}`,
      });
      
      setSelectedRooms(new Set()); // Очищаем выбор
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('❌ Error creating room connections:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать связи. Попробуйте еще раз.",
        variant: "destructive",
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={`gap-1 h-7 text-xs px-2 ${
            connectedTurarRooms.size > 0 
              ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
              : ''
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Link2 className="h-3 w-3" />
          {connectedTurarRooms.size > 0 ? (
            <>
              <Badge variant="secondary" className="bg-green-500 text-white mr-1 h-4 px-1 text-xs">
                {connectedTurarRooms.size}
              </Badge>
              Связан
            </>
          ) : (
            'Связать'
          )}
          {selectedRooms.size > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              +{selectedRooms.size}
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
          {connectedTurarRooms.size > 0 && (
            <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
              <div className="text-xs font-medium text-green-800 mb-1">
                <LinkIcon className="h-3 w-3 inline mr-1" />
                Уже связанные кабинеты:
              </div>
              <div className="flex flex-wrap gap-1">
                {Array.from(connectedTurarRooms).map(room => (
                  <Badge key={room} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    {room}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск кабинетов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          
          <div className="max-h-64 overflow-y-auto border rounded-md p-2">
            {availableRooms.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                {searchTerm ? 'Кабинеты не найдены' : 'Нет доступных кабинетов'}
              </div>
            ) : (
              <div className="space-y-2">
                {availableRooms.map((room) => {
                  const isSelected = selectedRooms.has(room);
                  const isAlreadyConnected = connectedTurarRooms.has(room);
                  
                  return (
                    <div
                      key={room}
                      className={`flex items-center space-x-3 p-3 rounded cursor-pointer transition-all ${
                        isAlreadyConnected
                          ? 'bg-green-50 border-2 border-green-300 opacity-75'
                          : isSelected 
                            ? 'bg-primary/20 border-2 border-primary/50 shadow-sm' 
                            : 'hover:bg-muted/50 border border-transparent'
                      }`}
                      onClick={() => !isAlreadyConnected && handleRoomToggle(room)}
                    >
                      <Checkbox
                        checked={isSelected || isAlreadyConnected}
                        disabled={isAlreadyConnected}
                        onChange={() => {}} // Контролируется через onClick
                        className="pointer-events-none"
                      />
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1">{room}</span>
                      {isAlreadyConnected ? (
                        <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                          <LinkIcon className="h-3 w-3 mr-1" />
                          Связан
                        </Badge>
                      ) : isSelected ? (
                        <div className="flex items-center gap-1">
                          <Check className="h-4 w-4 text-primary" />
                          <Badge variant="secondary" className="text-xs">Выбран</Badge>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
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
                  setSearchTerm('');
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