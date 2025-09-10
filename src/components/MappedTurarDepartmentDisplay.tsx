import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Link2, Users, Wrench } from 'lucide-react';
import { useGroupedMappedTurarRooms } from '@/hooks/useMappedDepartments';

interface MappedTurarDepartmentDisplayProps {
  departmentMappingId: string;
  departmentName: string;
  onLinkRoom: (room: string) => void;
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

const MappedTurarDepartmentDisplay: React.FC<MappedTurarDepartmentDisplayProps> = ({
  departmentMappingId,
  departmentName,
  onLinkRoom,
  onRemoveConnection,
  roomConnections,
  expandedRooms,
  setExpandedRooms
}) => {
  const groupedRooms = useGroupedMappedTurarRooms(departmentMappingId);

  console.log(`🏥 MappedTurarDepartmentDisplay для mapping ${departmentMappingId}, отделение: ${departmentName}`);
  console.log(`📊 Загружено комнат:`, Object.keys(groupedRooms).length);

  const getConnectedRooms = (turarRoom: string) => {
    return roomConnections?.filter(conn => 
      conn.turar_department === departmentName && conn.turar_room === turarRoom
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
      <Card className="bg-orange-50/50 border-orange-200">
        <CardContent className="pt-6">
          <div className="text-center text-orange-700">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium">Нет данных для отделения Турар</p>
            <p className="text-sm text-orange-600">"{departmentName}"</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-orange-800">
          Турар: {departmentName}
        </h3>
        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
          {Object.keys(groupedRooms).length} кабинетов
        </Badge>
      </div>

      {Object.entries(groupedRooms).map(([roomName, roomData]) => {
        const isExpanded = expandedRooms.has(roomName);
        const connectedRooms = getConnectedRooms(roomName);

        return (
          <Card key={roomName} className="bg-orange-50/30 border-orange-200/50 hover:bg-orange-50/50 transition-colors">
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
                        <Wrench className="h-3 w-3" />
                        {roomData.equipment.length} оборудования
                      </span>
                      {connectedRooms.length > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Link2 className="h-3 w-3" />
                          {connectedRooms.length} связей
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLinkRoom(roomName);
                  }}
                  className="flex items-center gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  Связать
                </Button>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                {/* Оборудование */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2 text-orange-800">Оборудование:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {roomData.equipment.map((equipment, idx) => (
                      <div key={idx} className="bg-white/70 p-3 rounded border border-orange-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">{equipment.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Код: {equipment.code} | Количество: {equipment.quantity}
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
                {connectedRooms.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-green-800">Связан с проектировщиками:</h4>
                    <div className="space-y-2">
                      {connectedRooms.map((connection, idx) => (
                        <div key={idx} className="bg-green-50 p-3 rounded border border-green-200 flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm">{connection.projector_department}</div>
                            <div className="text-xs text-green-600">{connection.projector_room}</div>
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

export default MappedTurarDepartmentDisplay;