import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Home, Link2, Wrench, X } from 'lucide-react'
import { useTurarDepartmentRooms } from '@/hooks/useRoomsAndEquipment'

interface TurarDepartmentDisplayProps {
  departmentName: string
  onLinkRoom: (roomName: string) => void
  onRemoveConnection: (turarDept: string, turarRoom: string, projectorDept: string, projectorRoom: string) => void
  roomConnections: any[]
  expandedRooms: Set<string>
  onToggleRoom: (roomKey: string) => void
}

export default function TurarDepartmentDisplay({ 
  departmentName, 
  onLinkRoom, 
  onRemoveConnection,
  roomConnections,
  expandedRooms,
  onToggleRoom
}: TurarDepartmentDisplayProps) {
  const roomsData = useTurarDepartmentRooms(departmentName)
  
  console.log(`🏥 TurarDepartmentDisplay для ${departmentName}:`, {
    roomsData,
    roomsCount: Object.keys(roomsData || {}).length
  })

  const getConnectedRooms = (turarDepartment: string, turarRoom: string) => {
    return roomConnections?.filter(conn => 
      conn.turar_department === turarDepartment && conn.turar_room === turarRoom
    ) || [];
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-primary flex items-center gap-2">
        <Home className="h-4 w-4" />
        Турар ({Object.keys(roomsData).length} кабинетов)
      </h3>
      <div className="space-y-3">
        {Object.entries(roomsData).map(([roomName, roomData]) => {
          const roomKey = `turar-${departmentName}-${roomName}`
          const isRoomExpanded = expandedRooms.has(roomKey)
          const connections = getConnectedRooms(departmentName, roomName)

          return (
            <div key={roomName} className="border rounded-lg overflow-hidden">
              <div 
                className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onToggleRoom(roomKey)}
              >
                <div className="flex items-center gap-2">
                  {isRoomExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{roomName}</div>
                    <div className="text-xs text-muted-foreground">
                      {roomData.equipment.length} единиц оборудования
                    </div>
                  </div>
                  {connections.length > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 ml-2">
                      <Link2 className="h-3 w-3 mr-1" />
                      {connections.length} связей
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onLinkRoom(roomName)
                  }}
                >
                  <Link2 className="h-3 w-3 mr-1" />
                  Связать
                </Button>
              </div>
              
              {/* Оборудование */}
              <div className="p-3 border-t bg-card">
                {!isRoomExpanded && roomData.equipment.length > 0 && (
                  <div className="text-xs text-muted-foreground mb-2">
                    Оборудование: {roomData.equipment.slice(0, 2).map(eq => eq.name).join(', ')}
                    {roomData.equipment.length > 2 && ` и еще ${roomData.equipment.length - 2}...`}
                  </div>
                )}
                
                {isRoomExpanded && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                      <Wrench className="h-4 w-4" />
                      Оборудование ({roomData.equipment.length})
                    </div>
                    {roomData.equipment.length > 0 ? (
                      <div className="grid gap-2">
                        {roomData.equipment.map((equipment, eqIndex) => (
                          <div key={eqIndex} className="flex items-center justify-between p-2 bg-muted/20 rounded border">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{equipment.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Код: {equipment.code} • Количество: {equipment.quantity}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">
                        Оборудование не указано
                      </div>
                    )}
                  </div>
                )}

                {/* Связи с проектировщиками */}
                {connections.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Связан с кабинетами проектировщиков:
                    </div>
                    <div className="space-y-1">
                      {connections.map((conn, connIndex) => (
                        <div key={connIndex} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-2 rounded">
                          <span className="text-xs">{conn.projector_department} → {conn.projector_room}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-auto p-1 hover:bg-red-100 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Удалить эту связь?')) {
                                onRemoveConnection(conn.turar_department, conn.turar_room, conn.projector_department, conn.projector_room)
                              }
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}