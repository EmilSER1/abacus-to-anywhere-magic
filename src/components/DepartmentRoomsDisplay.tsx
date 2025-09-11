import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link2, X } from 'lucide-react'
import { useRoomsByDepartmentId } from '@/hooks/useRoomsById'
import { useRoomConnectionsById, RoomConnectionById } from '@/hooks/useRoomConnectionsById'

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
  } | null;
  connections?: RoomConnectionById[];
  isProjectorDepartment?: boolean;
}

export default function DepartmentRoomsDisplay({
  departmentId,
  departmentName,
  onLinkRoom,
  onRemoveConnection,
  linkingRoom,
  connections = [],
  isProjectorDepartment = false
}: DepartmentRoomsDisplayProps) {
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const { data: rooms, isLoading } = useRoomsByDepartmentId(departmentId)

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
    if (!linkingRoom) return false
    
    if (isProjectorDepartment) {
      // Проектор может связываться с Турар
      return linkingRoom && !isProjectorDepartment
    } else {
      // Турар может связываться с Проектор
      return linkingRoom && isProjectorDepartment
    }
  }

  if (isLoading) {
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

  if (!rooms || rooms.length === 0) {
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
          <Badge variant="secondary">{rooms.length} кабинетов</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" value={Array.from(expandedRooms)}>
          {rooms.map((room) => {
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
                      <span className="font-medium">{room.name}</span>
                      {connectedRooms.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {connectedRooms.length} связей
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Кнопка связывания */}
                      {isLinkingTarget && onLinkRoom && (
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            onLinkRoom(room.id, room.name)
                          }}
                        >
                          <Link2 className="h-4 w-4" />
                          Связать
                        </Button>
                      )}
                      
                      {/* Показать статус связи при режиме связывания */}
                      {linkingRoom && !isLinkingTarget && (
                        <Badge variant="secondary" className="text-xs">
                          Выберите из другого типа
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent>
                  <div className="pt-4 space-y-3">
                    {/* Информация о кабинете - скрыли ID */}
                    <div className="text-sm text-muted-foreground">
                      Кабинет: {room.name}
                    </div>
                    
                    {/* Существующие связи */}
                    {connectedRooms.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Связанные кабинеты:</div>
                        {connectedRooms.map((connection) => (
                          <div key={connection.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                            <div className="text-sm">
                              {isProjectorDepartment ? (
                                <span>Турар кабинет: {connection.turar_room_id}</span>
                              ) : (
                                <span>Проектор кабинет: {connection.projector_room_id}</span>
                              )}
                            </div>
                            {onRemoveConnection && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="hover:bg-red-100 hover:text-red-600 gap-1"
                                onClick={() => onRemoveConnection(connection.id)}
                              >
                                <X className="h-3 w-3" />
                                Удалить
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Сообщение если нет связей */}
                    {connectedRooms.length === 0 && (
                      <div className="text-sm text-muted-foreground italic">
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