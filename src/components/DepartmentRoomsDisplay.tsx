import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    // Получаем все связи для данного кабинета
    const filtered = isProjectorDepartment 
      ? connections.filter(conn => conn.projector_room === roomName)
      : connections.filter(conn => conn.turar_room === roomName);
    
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
    
    console.log(`🔍 УНИКАЛЬНЫЕ СВЯЗИ для ${roomName}:`, {
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
      <CardContent className="pt-0 max-h-96 overflow-y-auto">
        <div className="space-y-1">
          {actualRooms.map((room) => {
            const connectedRooms = getConnectedRooms(room.id, room.room_name)
            const isExpanded = expandedRooms.has(room.id)
            
            return (
              <div key={room.id} className="border rounded-lg">
                <div 
                  className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleRoom(room.id)}
                 >
                   <div className="flex items-center gap-2 flex-1 min-w-0">
                     <span className="font-medium text-sm truncate">{room.room_name}</span>
                     {connectedRooms.length > 0 && (
                       <div className="flex flex-wrap gap-1 shrink-0">
                         {(() => {
                           // Группируем по названию кабинета для избежания дублей
                           const uniqueRooms = Array.from(
                             new Map(connectedRooms.map(conn => [
                               isProjectorDepartment ? conn.turar_room : conn.projector_room,
                               conn
                             ])).values()
                           );
                           
                           return uniqueRooms.map((connection, index) => {
                             const targetRoomId = isProjectorDepartment ? connection.turar_room_id : connection.projector_room_id;
                             const targetRoomName = isProjectorDepartment ? connection.turar_room : connection.projector_room;
                             
                             return (
                               <Badge 
                                 key={`${targetRoomName}-${targetRoomId}`} 
                                 variant="outline" 
                                 className="text-xs h-5 bg-green-50 text-green-700 border-green-200 shrink-0"
                               >
                                 <Link2 className="h-2 w-2 mr-1" />
                                 {targetRoomName.replace('кабинет врача ', '')}
                               </Badge>
                             );
                           });
                         })()}
                       </div>
                     )}
                   </div>
                   
                   <div className="flex items-center gap-2">
                     {/* Множественный выбор при активном режиме связывания */}
                     {multiSelectMode && linkingRoom && linkingRoom.departmentId !== departmentId && canEdit && (
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input
                           type="checkbox"
                           checked={selectedRooms.has(room.id)}
                           onChange={() => onLinkRoom && onLinkRoom(room.id, room.room_name)}
                           className="w-3 h-3"
                         />
                         <span className="text-xs">{selectedRooms.has(room.id) ? 'Выбран' : 'Выбрать'}</span>
                       </label>
                     )}
                     
                     {/* Кнопка связывания для начала процесса */}
                     {onLinkRoom && canEdit && showConnectButtons && !multiSelectMode && (
                       <Button
                         size="sm"
                         variant={selectedRoomId === room.id ? "default" : "outline"}
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
                         🎯
                       </Badge>
                     )}
                   </div>
                 </div>
                 
                 {/* Компактное отображение связей под названием */}
                 {(() => {
                   console.log('🟢 ПРОВЕРКА СВЯЗЕЙ ДЛЯ КАБИНЕТА:', {
                     roomName: room.room_name,
                     connectedRoomsLength: connectedRooms.length,
                     connectedRooms: connectedRooms,
                     shouldShow: connectedRooms.length > 0
                   });
                   return connectedRooms.length > 0;
                 })() && (
                   <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800">
                     <div className="text-xs font-medium text-green-800 dark:text-green-200 mb-1 flex items-center gap-1">
                       <Link2 className="h-3 w-3" />
                       Связано с кабинетами {isProjectorDepartment ? 'Турар' : 'Проектировщиков'}:
                     </div>
                     <div className="space-y-1">
                       {(() => {
                         const uniqueRooms = Array.from(
                           new Map(connectedRooms.map(conn => [
                             isProjectorDepartment ? conn.turar_room : conn.projector_room,
                             conn
                           ])).values()
                         );
                         
                         return uniqueRooms.map((connection) => {
                           const targetDepartment = isProjectorDepartment ? connection.turar_department : connection.projector_department;
                           const targetRoom = isProjectorDepartment ? connection.turar_room : connection.projector_room;
                           
                           return (
                             <div key={connection.id} className="flex items-center justify-between bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 px-2 py-1 rounded border border-green-200 dark:border-green-700">
                               <div className="text-xs">
                                 <div className="font-medium">{targetDepartment}</div>
                                 <div className="text-green-600 dark:text-green-300">→ {targetRoom}</div>
                               </div>
                               <Badge variant="secondary" className="bg-green-500 text-white dark:bg-green-600 dark:text-white text-xs h-5">
                                 <Link2 className="h-2 w-2 mr-1" />
                                 Активная связь
                               </Badge>
                             </div>
                           );
                         });
                       })()}
                     </div>
                   </div>
                 )}
                
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t bg-muted/20">
                    <div className="space-y-2 mt-2">
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
                      
                      {/* Существующие связи */}
                      {connectedRooms.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            Связи:
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
                        <div className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded text-center">
                          Нет связей
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}