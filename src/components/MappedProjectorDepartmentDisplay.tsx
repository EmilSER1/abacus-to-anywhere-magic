import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Link2, Building2, Wrench, MapPin } from 'lucide-react';
import { useGroupedMappedProjectorRooms } from '@/hooks/useMappedDepartments';

interface MappedProjectorDepartmentDisplayProps {
  departmentMappingId: string;
  departmentName: string;
  linkingRoom?: {
    turarDept: string;
    turarRoom: string;
    projectorDept: string;
  };
  onCreateConnection: (turarDept: string, turarRoom: string, projectorDept: string, projectorRoom: string) => void;
  onRemoveConnection: (turarDept: string, turarRoom: string, projectorDept: string, projectorRoom: string) => void;
  roomConnections: Array<{
    turar_department: string;
    turar_room: string;
    projector_department: string;
    projector_room: string;
  }>;
  expandedRooms: Set<string>;
  setExpandedRooms: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const MappedProjectorDepartmentDisplay: React.FC<MappedProjectorDepartmentDisplayProps> = ({
  departmentMappingId,
  departmentName,
  linkingRoom,
  onCreateConnection,
  onRemoveConnection,
  roomConnections,
  expandedRooms,
  setExpandedRooms
}) => {
  const groupedRooms = useGroupedMappedProjectorRooms(departmentMappingId);

  console.log(`🏗️ MappedProjectorDepartmentDisplay для mapping ${departmentMappingId}, отделение: ${departmentName}`);
  console.log(`📊 Загружено комнат:`, Object.keys(groupedRooms).length);

  const getConnectedTurarRooms = (projectorRoom: string) => {
    return roomConnections?.filter(conn => 
      conn.projector_department === departmentName && conn.projector_room === projectorRoom
    ) || [];
  };

  const toggleRoom = (roomName: string) => {
    const newExpanded = new Set(expandedRooms);
    if (newExpanded.has(roomName)) {
      newExpanded.delete(roomName);
    } else {
      newExpanded.add(roomName);
    }
    setExpandedRooms(newExpanded);
  };

  if (Object.keys(groupedRooms).length === 0) {
    return (
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center text-blue-700">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium">Нет данных для отделения проектировщиков</p>
            <p className="text-sm text-blue-600">"{departmentName}"</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-800">
          Проектировщики: {departmentName}
        </h3>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          {Object.keys(groupedRooms).length} кабинетов
        </Badge>
      </div>

      {linkingRoom && linkingRoom.projectorDept === departmentName && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <Link2 className="h-4 w-4" />
              <span className="font-medium">
                Выберите кабинет для связи с: {linkingRoom.turarDept} → {linkingRoom.turarRoom}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.entries(groupedRooms).map(([roomName, roomData]) => {
        const isExpanded = expandedRooms.has(roomName);
        const connectedTurarRooms = getConnectedTurarRooms(roomName);
        const isLinkTarget = linkingRoom?.projectorDept === departmentName;

        return (
          <Card key={roomName} className={`border-blue-200/50 transition-colors ${
            isLinkTarget ? 'bg-yellow-50/50 hover:bg-yellow-50' : 'bg-blue-50/30 hover:bg-blue-50/50'
          }`}>
            <CardHeader 
              className="cursor-pointer py-3"
              onClick={() => toggleRoom(roomName)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <div>
                    <CardTitle className="text-base">{roomName}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Этаж {roomData.roomInfo.floor}, {roomData.roomInfo.block}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        {roomData.equipment.length} оборудования
                      </span>
                      {connectedTurarRooms.length > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Link2 className="h-3 w-3" />
                          {connectedTurarRooms.length} связей
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {isLinkTarget && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateConnection(
                        linkingRoom.turarDept,
                        linkingRoom.turarRoom,
                        linkingRoom.projectorDept,
                        roomName
                      );
                    }}
                    className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Link2 className="h-4 w-4" />
                    Связать
                  </Button>
                )}
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                {/* Информация о кабинете */}
                <div className="mb-4 bg-white/70 p-3 rounded border border-blue-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Код:</span> {roomData.roomInfo.code}
                    </div>
                    <div>
                      <span className="font-medium">Площадь:</span> {roomData.roomInfo.area || 'Не указана'} м²
                    </div>
                  </div>
                </div>

                {/* Оборудование */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2 text-blue-800">Оборудование:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {roomData.equipment.map((equipment, idx) => (
                      <div key={idx} className="bg-white/70 p-3 rounded border border-blue-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">{equipment.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Код: {equipment.code} | Количество: {equipment.quantity} {equipment.unit}
                              {equipment.notes && ` | ${equipment.notes}`}
                            </div>
                          </div>
                          {equipment.is_linked && (
                            <Badge variant="default" className="bg-green-100 text-green-700 text-xs">
                              Связан
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Существующие связи */}
                {connectedTurarRooms.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-green-800">Связан с Турар:</h4>
                    <div className="space-y-2">
                      {connectedTurarRooms.map((connection, idx) => (
                        <div key={idx} className="bg-green-50 p-3 rounded border border-green-200 flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm">{connection.turar_department}</div>
                            <div className="text-xs text-green-600">{connection.turar_room}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveConnection(
                              connection.turar_department,
                              connection.turar_room,
                              connection.projector_department,
                              connection.projector_room
                            )}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Удалить
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default MappedProjectorDepartmentDisplay;