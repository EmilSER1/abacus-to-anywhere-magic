import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Home, Link2, Wrench, X } from 'lucide-react'
import { useProjectorDepartmentRooms } from '@/hooks/useRoomsAndEquipment'

interface ProjectorDepartmentDisplayProps {
  departmentName: string
  turarDept: string
  linkingRoom: { turarDept: string, turarRoom: string, projectorDept: string } | null
  onCreateConnection: (turarDept: string, turarRoom: string, projectorDept: string, projectorRoom: string) => void
  onRemoveConnection: (turarDept: string, turarRoom: string, projectorDept: string, projectorRoom: string) => void
  roomConnections: any[]
  expandedRooms: Set<string>
  onToggleRoom: (roomKey: string) => void
}

export default function ProjectorDepartmentDisplay({ 
  departmentName, 
  turarDept,
  linkingRoom, 
  onCreateConnection,
  onRemoveConnection,
  roomConnections,
  expandedRooms,
  onToggleRoom
}: ProjectorDepartmentDisplayProps) {
  const roomsData = useProjectorDepartmentRooms(departmentName)
  
  console.log(`🏗️ ProjectorDepartmentDisplay для ${departmentName}:`, {
    roomsData,
    roomsCount: Object.keys(roomsData || {}).length
  })

  const getConnectedToProjectorRoom = (projectorDepartment: string, projectorRoom: string) => {
    return roomConnections?.filter(conn => 
      conn.projector_department === projectorDepartment && conn.projector_room === projectorRoom
    ) || [];
  };

  return (
    <div className="space-y-3">
      <div className="p-3 border rounded-lg bg-muted/20">
        <h4 className="font-medium text-secondary flex items-center gap-2 mb-3">
          <Home className="h-4 w-4" />
          {departmentName} ({Object.keys(roomsData).length} кабинетов)
        </h4>
        
        <div className="space-y-2">
          {Object.keys(roomsData).length === 0 ? (
            <div className="text-sm text-muted-foreground italic p-2">
              Нет данных о кабинетах для этого отделения
            </div>
          ) : (
            Object.entries(roomsData).map(([roomName, roomData]) => {
            const roomKey = `projector-${departmentName}-${roomName}`
            const isRoomExpanded = expandedRooms.has(roomKey)
            const connections = getConnectedToProjectorRoom(departmentName, roomName)
            const canLinkToThis = linkingRoom && linkingRoom.turarDept === turarDept

            return (
              <div key={roomName} className="border rounded-md overflow-hidden bg-card">
                <div 
                  className="flex items-center justify-between p-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onToggleRoom(roomKey)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {isRoomExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <Home className="h-3 w-3 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{roomName}</div>
                      <div className="text-xs text-muted-foreground">
                        Этаж {roomData.roomInfo.floor} • Блок {roomData.roomInfo.block}
                        {roomData.roomInfo.area && ` • ${roomData.roomInfo.area} м²`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {roomData.equipment.length} единиц оборудования
                      </div>
                    </div>
                    {connections.length > 0 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Link2 className="h-3 w-3 mr-1" />
                        {connections.length}
                      </Badge>
                    )}
                  </div>
                  
                  {canLinkToThis && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCreateConnection(
                          linkingRoom.turarDept,
                          linkingRoom.turarRoom,
                          departmentName,
                          roomName
                        )
                      }}
                      className="ml-2"
                    >
                      <Link2 className="h-3 w-3 mr-1" />
                      Связать
                    </Button>
                  )}
                </div>
                
                {/* Оборудование */}
                <div className="p-2 border-t bg-card/50">
                  {!isRoomExpanded && roomData.equipment.length > 0 && (
                    <div className="text-xs text-muted-foreground mb-1">
                      Оборудование: {roomData.equipment.slice(0, 1).map(eq => eq.name).join(', ')}
                      {roomData.equipment.length > 1 && ` и еще ${roomData.equipment.length - 1}...`}
                    </div>
                  )}
                  
                  {isRoomExpanded && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                        <Wrench className="h-3 w-3" />
                        Оборудование ({roomData.equipment.length})
                      </div>
                      {roomData.equipment.length > 0 ? (
                        <div className="grid gap-1">
                          {roomData.equipment.map((equipment, eqIndex) => (
                            <div key={eqIndex} className="flex items-center justify-between p-2 bg-muted/20 rounded border text-xs">
                              <div className="flex-1">
                                <div className="font-medium">{equipment.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {equipment.code && `Код: ${equipment.code} • `}
                                  Количество: {equipment.quantity}
                                  {equipment.unit && ` ${equipment.unit}`}
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

                  {/* Связи с Турар */}
                  {connections.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Связан с кабинетами Турар:
                      </div>
                      <div className="space-y-1">
                        {connections.map((conn, connIndex) => (
                          <div key={connIndex} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-1 rounded text-xs">
                            <span>{conn.turar_department} → {conn.turar_room}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-auto p-1"
                              onClick={() => onRemoveConnection(
                                conn.turar_department,
                                conn.turar_room,
                                departmentName,
                                roomName
                              )}
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
            })
          )}
        </div>
      </div>
    </div>
  )
}