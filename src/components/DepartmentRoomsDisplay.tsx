import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
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
  onAddToQueue?: (targetRoomId: string, targetRoomName: string, targetDepartmentId: string, targetDepartmentName: string) => void;
  isRoomInQueue?: (roomId: string) => boolean;
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
  compact?: boolean;
  canEdit?: boolean;
  showConnectButtons?: boolean;
  selectedRooms?: Set<string>;
  multiSelectMode?: boolean;
}

// Компонент для отображения названия связанного кабинета в виде бейджа
function ConnectedRoomBadge({ roomId, isProjectorRoom }: {
  roomId: string;
  isProjectorRoom: boolean;
}) {
  const [roomName, setRoomName] = useState<string>('...');

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
        setRoomName('Ошибка');
      }
    };

    fetchRoomName();
  }, [roomId, isProjectorRoom]);

  return (
    <Badge variant="outline" className="text-xs h-5 bg-green-50 text-green-700 border-green-200">
      <Link2 className="h-2 w-2 mr-1" />
      {roomName}
    </Badge>
  );
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
    <div className="flex items-center justify-between bg-muted/50 p-2 rounded text-xs">
      <div className="text-xs">
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
          className="hover:bg-red-100 hover:text-red-600 h-6 w-6 p-0"
          onClick={() => onRemove(connectionId)}
        >
          <X className="h-3 w-3" />
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
  onAddToQueue,
  isRoomInQueue,
  linkingRoom,
  connections = [],
  isProjectorDepartment = false,
  selectedRoomId,
  compact = false,
  canEdit: propCanEdit,
  showConnectButtons = true,
  selectedRooms = new Set(),
  multiSelectMode = false
}: DepartmentRoomsDisplayProps) {
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const { data: rooms, isLoading } = useRoomsByDepartmentId(departmentId)
  const { canEdit: hookCanEdit } = useUserRole()
  
  // Используем проп canEdit если он передан, иначе результат хука
  const canEdit = propCanEdit !== undefined ? propCanEdit : hookCanEdit()
  
  // ДИАГНОСТИКА СОСТОЯНИЯ
  console.log(`📋 СОСТОЯНИЕ ${departmentName}:`, {
    linkingRoom: linkingRoom ? {
      roomId: linkingRoom.roomId,
      roomName: linkingRoom.roomName,
      departmentId: linkingRoom.departmentId,
      departmentName: linkingRoom.departmentName,
      isProjectorDepartment: linkingRoom.isProjectorDepartment
    } : null,
    currentDepartmentId: departmentId,
    currentDepartmentName: departmentName,
    isProjectorDepartment,
    canEdit,
    hasOnAddToQueue: !!onAddToQueue,
    hasOnLinkRoom: !!onLinkRoom,
    shouldShowConnectionButtons: linkingRoom && linkingRoom.departmentId !== departmentId
  });
  
  // ПОДРОБНАЯ ДИАГНОСТИКА
  console.log('🚨 ПОДРОБНАЯ ДИАГНОСТИКА:', {
    departmentName,
    departmentId,
    isProjectorDepartment,
    connectionsTotal: connections?.length || 0,
    connectionsArray: connections,
    hasConnections: !!connections && connections.length > 0
  });
  
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

  const getConnectedRooms = (roomId: string, roomName: string) => {
    // Ручное связывание - показываем только те связи, которые пользователь создал сам
    const filtered = isProjectorDepartment 
      ? connections.filter(conn => conn.projector_room === roomName)
      : connections.filter(conn => conn.turar_room === roomName);
    
    return filtered;
    
    // Убираем дубли по названию кабинета - показываем только уникальные названия
    const uniqueConnections = filtered.reduce((acc, conn) => {
      const targetRoom = isProjectorDepartment ? conn.turar_room : conn.projector_room;
      const existing = acc.find(item => {
        const existingRoom = isProjectorDepartment ? item.turar_room : item.projector_room;
        return existingRoom === targetRoom;
      });
      
      if (!existing) {
        acc.push(conn);
      }
      
      return acc;
    }, [] as typeof filtered);
    
    console.log(`🔍 РЕЗУЛЬТАТ для ${roomName}:`, {
      всехСвязей: filtered.length,
      уникальныхСвязей: uniqueConnections.length,
      уникальныеКабинеты: uniqueConnections.map(c => 
        isProjectorDepartment ? c.turar_room : c.projector_room
      )
    });
    
    return uniqueConnections;
  }

  if (actualIsLoading) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{departmentName}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center text-muted-foreground text-sm py-2">Загрузка кабинетов...</div>
        </CardContent>
      </Card>
    )
  }

  if (!actualRooms || actualRooms.length === 0) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{departmentName}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center text-muted-foreground text-sm py-2">Нет кабинетов в этом отделении</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{departmentName}</span>
          <Badge variant="secondary" className="text-xs">{actualRooms.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="multiple" className="space-y-1">
          {(() => {
            // Сортируем кабинеты: несвязанные вверху, связанные внизу
            const connectedRoomIds = new Set();
            connections.forEach(conn => {
              if (isProjectorDepartment) {
                if (conn.projector_department === departmentName) {
                  const room = actualRooms.find(r => r.room_name === conn.projector_room);
                  if (room) connectedRoomIds.add(room.id);
                }
              } else {
                if (conn.turar_department === departmentName) {
                  const room = actualRooms.find(r => r.room_name === conn.turar_room);
                  if (room) connectedRoomIds.add(room.id);
                }
              }
            });

            const unconnectedRooms = actualRooms.filter(room => !connectedRoomIds.has(room.id));
            const connectedRooms = actualRooms.filter(room => connectedRoomIds.has(room.id));
            
            return [...unconnectedRooms, ...connectedRooms];
          })().map((room) => {
            const connectedRooms = getConnectedRooms(room.id, room.room_name)
            const isConnected = connectedRooms.length > 0;
            const isInQueue = isRoomInQueue ? isRoomInQueue(room.id) : false;
            
            return (
              <AccordionItem 
                key={room.id} 
                value={room.id} 
                className={`border rounded-lg ${
                  isInQueue 
                    ? 'bg-yellow-50/80 border-yellow-300' 
                    : isConnected 
                      ? 'bg-green-50/50 border-green-200' 
                      : ''
                }`}
              >
                  <AccordionTrigger className="px-3 py-2 hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`font-medium text-sm break-words hyphens-auto ${isInQueue ? 'text-yellow-700' : ''}`}>
                          {room.room_name}
                          {isInQueue && <span className="ml-1 text-xs">📋</span>}
                        </span>
                        {connectedRooms.length > 0 && (
                          <div className="flex flex-wrap gap-1 shrink-0">
                            {(() => {
                              const uniqueRooms = Array.from(
                                new Map(connectedRooms.map(conn => [
                                  isProjectorDepartment ? conn.turar_room : conn.projector_room,
                                  conn
                                ])).values()
                              );
                              
                              return uniqueRooms.map((connection) => {
                                const targetRoomName = isProjectorDepartment ? connection.turar_room : connection.projector_room;
                                
                                return (
                                  <Badge 
                                    key={`${targetRoomName}-${connection.id}`} 
                                    variant="outline" 
                                    className="text-xs h-5 bg-green-50 text-green-700 border-green-200 shrink-0 max-w-32 truncate"
                                    title={targetRoomName}
                                  >
                                    <Link2 className="h-2 w-2 mr-1 shrink-0" />
                                    <span className="truncate">{targetRoomName.replace('кабинет врача ', '')}</span>
                                  </Badge>
                                );
                              });
                            })()}
                          </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Галочка для добавления в очередь при активном режиме связывания */}
                      {(() => {
                        // ИСПРАВЛЯЕМ ЛОГИКУ: проверяем ID отделений, а не их названия
                        const shouldShowQueueButton = linkingRoom && 
                          linkingRoom.departmentId !== departmentId && 
                          onAddToQueue && 
                          canEdit;
                        
                        console.log(`🔍 КНОПКА "В ОЧЕРЕДЬ" для ${room.room_name} в ${departmentName}:`, {
                          linkingRoom: linkingRoom ? {
                            departmentId: linkingRoom.departmentId,
                            roomName: linkingRoom.roomName,
                            departmentName: linkingRoom.departmentName,
                            isProjectorDepartment: linkingRoom.isProjectorDepartment
                          } : null,
                          currentDepartmentId: departmentId,
                          currentDepartmentName: departmentName,
                          isProjectorDepartment,
                          hasOnAddToQueue: !!onAddToQueue,
                          canEdit,
                          isDifferentDepartmentById: linkingRoom ? linkingRoom.departmentId !== departmentId : false,
                          shouldShow: shouldShowQueueButton
                        });
                        
                        return shouldShowQueueButton ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 h-7 text-xs px-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              onAddToQueue(room.id, room.room_name, departmentId, departmentName)
                            }}
                          >
                            <Link2 className="h-3 w-3" />
                            В очередь
                          </Button>
                        ) : null;
                      })()}
                      
                      {/* Кнопка связывания для начала процесса - ВСЕГДА показываем если нет активного режима связывания */}
                      {!linkingRoom && onLinkRoom && canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 h-7 text-xs px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            onLinkRoom(room.id, room.room_name)
                          }}
                        >
                          <Link2 className="h-3 w-3" />
                          Связать
                        </Button>
                      )}
                      
                      {/* Показать статус при активном режиме связывания */}
                      {linkingRoom && linkingRoom.roomId === room.id && (
                        <Badge variant="default" className="text-xs h-5">
                          🎯 Выбран
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                
                {/* Существующие связи - всегда видны под названием */}
                {connectedRooms.length > 0 && (
                  <div className="px-3 py-1 bg-muted/10 border-y">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Связи:</div>
                    <div className="space-y-1">
                        {connectedRooms.map((connection) => (
                          <div key={connection.id} className="flex items-center justify-between text-xs bg-white/50 p-1 rounded">
                            <span className="break-words hyphens-auto flex-1 pr-2">
                              {isProjectorDepartment ? (
                                <span>📍 Турар: {connection.turar_room}</span>
                              ) : (
                                <span>📍 Проектировщики: {connection.projector_room}</span>
                              )}
                            </span>
                          {onRemoveConnection && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-red-100 hover:text-red-600 h-5 w-5 p-0"
                              onClick={() => onRemoveConnection(connection.id)}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <AccordionContent className="px-3 pb-3">
                  <div className="space-y-2 pt-2">
                    {/* Отображение оборудования */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium flex items-center gap-1">
                        🔧 Оборудование:
                      </div>
                      <RoomEquipmentDisplay 
                        roomId={room.id}
                        isProjectorDepartment={isProjectorDepartment}
                      />
                    </div>
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