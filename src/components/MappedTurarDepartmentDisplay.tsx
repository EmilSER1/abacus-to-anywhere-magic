import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
    <div className="space-y-2">
      <Accordion type="multiple" className="w-full">
        {Object.entries(groupedRooms).map(([roomName, roomData]) => {
          const connectedRooms = getConnectedRooms(roomName);

          return (
            <AccordionItem key={roomName} value={roomName} className={`border rounded-lg ${
              connectedRooms.length > 0 ? 'border-green-300 bg-green-50/50 dark:bg-green-900/10' : 'border-orange-200'
            }`}>
              <AccordionTrigger className="hover:no-underline px-4">
                 <div className="flex items-center justify-between w-full pr-4">
                   <div className="flex items-center gap-3">
                     <div className={`p-1.5 rounded ${
                       connectedRooms.length > 0 
                         ? 'bg-green-100 dark:bg-green-900/20' 
                         : 'bg-orange-100 dark:bg-orange-900/20'
                     }`}>
                       <Users className={`h-4 w-4 ${
                         connectedRooms.length > 0 ? 'text-green-600' : 'text-orange-600'
                       }`} />
                     </div>
                     <div className="text-left">
                       <div className={`font-medium ${
                         connectedRooms.length > 0 ? 'text-green-800 dark:text-green-300' : ''
                       }`}>{roomName}</div>
                       <div className="text-sm text-muted-foreground">
                         {roomData.equipment.length} оборудования
                         {connectedRooms.length > 0 && (
                           <span className="text-green-600 font-medium"> • {connectedRooms.length} связей ✓</span>
                         )}
                       </div>
                     </div>
                   </div>
                   <Button
                     variant={connectedRooms.length > 0 ? "default" : "outline"}
                     size="sm"
                     onClick={(e) => {
                       e.stopPropagation();
                       onLinkRoom(roomName);
                     }}
                     className={`flex items-center gap-2 ${
                       connectedRooms.length > 0 
                         ? 'bg-green-600 hover:bg-green-700 text-white' 
                         : ''
                     }`}
                   >
                     <Link2 className="h-4 w-4" />
                     {connectedRooms.length > 0 ? 'Добавить связь' : 'Связать'}
                   </Button>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
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
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default MappedTurarDepartmentDisplay;