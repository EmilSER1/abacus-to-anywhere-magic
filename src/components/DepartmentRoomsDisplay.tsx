import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link2, X } from 'lucide-react'
import { useRoomsByDepartmentId } from '@/hooks/useRoomsById'
import { useRoomConnectionsById, RoomConnectionById } from '@/hooks/useRoomConnectionsById'
import { useTurarRoomsByDepartmentId, useProjectorRoomsByDepartmentId } from '@/hooks/useActualRoomsById'
import { useTurarRoomEquipment, useProjectorRoomEquipment } from '@/hooks/useRoomEquipment'
import RoomEquipmentDisplay from '@/components/RoomEquipmentDisplay'
import { supabase } from '@/integrations/supabase/client'
import { useUserRole } from '@/hooks/useUserRole'

interface DepartmentRoomsDisplayProps {
  departmentId: string;
  departmentName: string;
  onLinkRoom?: (roomId: string, roomName: string) => void;
  onRemoveConnection?: (connectionId: string) => void;
  linkingRoom?: {
    departmentId: string;
    roomId: string;
    roomName: string;
    departmentName: string;
    isProjectorDepartment: boolean;
  } | null;
  connections?: RoomConnectionById[];
  isProjectorDepartment?: boolean;
  selectedRoomId?: string;
}

// Компонент для отображения связанного кабинета с названием
function ConnectedRoomDisplay({ connectionId, roomId, isProjectorRoom, onRemove }: {
  connectionId: string;
  roomId: string;
  isProjectorRoom: boolean;
  onRemove?: (connectionId: string) => void;
}) {
  const [roomName, setRoomName] = useState<string>('Загрузка...');

  useEffect(() => {
    const fetchRoomName = async () => {
      try {
        if (isProjectorRoom) {
          const { data } = await supabase
            .from("projector_floors")
            .select('"НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"')
            .eq("id", roomId)
            .limit(1)
            .single();
          setRoomName(data?.["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] || `ID: ${roomId}`);
        } else {
          const { data } = await supabase
            .from("turar_medical")
            .select('"Помещение/Кабинет"')
            .eq("id", roomId)
            .limit(1)
            .single();
          setRoomName(data?.["Помещение/Кабинет"] || `ID: ${roomId}`);
        }
      } catch (error) {
        console.error('Ошибка получения названия кабинета:', error);
        setRoomName(`ID: ${roomId}`);
      }
    };

    fetchRoomName();
  }, [roomId, isProjectorRoom]);

  return (
    <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
      <div className="text-sm">
        {isProjectorRoom ? (
          <span>📍 Проектировщики: {roomName}</span>
        ) : (
          <span>📍 Турар: {roomName}</span>
        )}
      </div>
      {onRemove && (
        <Button
          size="sm"
          variant="ghost"
          className="hover:bg-red-100 hover:text-red-600 gap-1"
          onClick={() => onRemove(connectionId)}
        >
          <X className="h-3 w-3" />
          Удалить
        </Button>
      )}
    </div>
  );
}

export default function DepartmentRoomsDisplay({
  departmentId,
  departmentName,
  onLinkRoom,
  onRemoveConnection,
  linkingRoom,
  connections = [],
  isProjectorDepartment = false,
  selectedRoomId
}: DepartmentRoomsDisplayProps) {
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const { data: rooms, isLoading } = useRoomsByDepartmentId(departmentId)
  const { canEdit } = useUserRole()
  // Используем правильные хуки для получения данных из основных таблиц
  const { data: turarRooms, isLoading: isTurarLoading } = useTurarRoomsByDepartmentId(departmentId)
  const { data: projectorRooms, isLoading: isProjectorLoading } = useProjectorRoomsByDepartmentId(departmentId)
  
  // Выбираем правильные данные в зависимости от типа отделения
  const actualRooms = isProjectorDepartment ? projectorRooms : turarRooms
  const actualIsLoading = isProjectorDepartment ? isProjectorLoading : isTurarLoading

  const toggleRoom = (roomId: string) => {
    const newExpanded = new Set(expandedRooms)
    if (newExpanded.has(roomId)) {
      newExpanded.delete(roomId)
    } else {
      newExpanded.add(roomId)
    }
    setExpandedRooms(newExpanded)
  }

  const getConnectedRooms = (roomId: string) => {
    if (isProjectorDepartment) {
      return connections.filter(conn => conn.projector_room_id === roomId)
    } else {
      return connections.filter(conn => conn.turar_room_id === roomId)
    }
  }

  const canLinkRoom = (roomId: string) => {
    if (!linkingRoom) return true; // Всегда можно начать связывание
    
    // Если уже выбран кабинет, то можно связывать только с кабинетами из другого типа отделения
    if (isProjectorDepartment) {
      // Проектор может связываться с Турар (если выбранный кабинет из Турар)
      return linkingRoom && linkingRoom.departmentId !== departmentId;
    } else {
      // Турар может связываться с Проектор (если выбранный кабинет из Проектор)
      return linkingRoom && linkingRoom.departmentId !== departmentId;
    }
  };

  if (actualIsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{departmentName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Загрузка кабинетов...</div>
        </CardContent>
      </Card>
    )
  }

  if (!actualRooms || actualRooms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{departmentName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Нет кабинетов в этом отделении</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{departmentName}</span>
          <Badge variant="secondary">{actualRooms.length} кабинетов</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" value={Array.from(expandedRooms)}>
          {actualRooms.map((room) => {
            const connectedRooms = getConnectedRooms(room.id)
            const isLinkingTarget = canLinkRoom(room.id)
            
            return (
              <AccordionItem key={room.id} value={room.id}>
                <AccordionTrigger 
                  onClick={() => toggleRoom(room.id)}
                  className="hover:no-underline"
                >
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{room.room_name}</span>
                      {connectedRooms.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Link2 className="h-3 w-3 mr-1" />
                          {connectedRooms.length}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Кнопка связывания */}
                      {onLinkRoom && canEdit() && (
                        <Button
                          size="sm"
                          variant={selectedRoomId === room.id ? "default" : "outline"}
                          className="gap-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            onLinkRoom(room.id, room.room_name)
                          }}
                        >
                          <Link2 className="h-4 w-4" />
                          {selectedRoomId === room.id ? 'Выбран' : 'Выбрать'}
                        </Button>
                      )}
                      
                      {/* Показать статус при активном режиме связывания */}
                      {linkingRoom && linkingRoom.roomId === room.id && (
                        <Badge variant="default" className="text-xs">
                          Исходный
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent>
                  <div className="pt-4 space-y-3">
                    {/* Информация о кабинете */}
                    <div className="text-sm font-medium text-primary">
                      📍 {room.room_name}
                    </div>
                    
                    {/* Отображение оборудования */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium flex items-center gap-2">
                        🔧 Оборудование в кабинете:
                      </div>
                      <RoomEquipmentDisplay 
                        roomId={room.id}
                        isProjectorDepartment={isProjectorDepartment}
                      />
                    </div>
                    
                    {/* Существующие связи */}
                    {connectedRooms.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium flex items-center gap-2">
                          <Link2 className="h-4 w-4" />
                          Связанные кабинеты:
                        </div>
                        {connectedRooms.map((connection) => (
                          <ConnectedRoomDisplay
                            key={connection.id}
                            connectionId={connection.id}
                            roomId={isProjectorDepartment ? connection.turar_room_id : connection.projector_room_id}
                            isProjectorRoom={!isProjectorDepartment}
                            onRemove={onRemoveConnection}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Сообщение если нет связей */}
                    {connectedRooms.length === 0 && (
                      <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-lg text-center">
                        Кабинет не связан с другими кабинетами
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>
    </Card>
  )
}