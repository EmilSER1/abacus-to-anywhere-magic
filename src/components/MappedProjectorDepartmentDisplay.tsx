import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronDown, ChevronRight, Link2, Building2, Wrench, MapPin, Edit, Plus, X } from 'lucide-react';
import { useGroupedMappedProjectorRooms } from '@/hooks/useMappedDepartments';
import { useProjectorRoomEquipment, useUpdateProjectorEquipment, useAddProjectorEquipment } from '@/hooks/useProjectorEquipment';
import EditEquipmentDialog from './EditEquipmentDialog';
import TurarDepartmentSelector from './TurarDepartmentSelector';
import TurarRoomSelector from './TurarRoomSelector';

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

const statusConfig = {
  'Согласовано': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Согласовано' },
  'Не согласовано': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Не согласовано' },
  'Не найдено': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Не найдено' }
} as const;

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
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [addingToRoom, setAddingToRoom] = useState<{ department: string; room: string } | null>(null);
  const [selectedTurarDept, setSelectedTurarDept] = useState('');
  const [selectedTurarRooms, setSelectedTurarRooms] = useState<string[]>([]);
  
  const updateEquipmentMutation = useUpdateProjectorEquipment();
  const addEquipmentMutation = useAddProjectorEquipment();

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

  const handleEditEquipment = (equipment: any) => {
    setEditingEquipment(equipment);
    setIsEditDialogOpen(true);
  };

  const handleSaveEquipment = (updatedEquipment: any) => {
    if (isAddingEquipment && addingToRoom) {
      const { id, ...equipmentWithoutId } = updatedEquipment; // Убираем id для новых записей
      const newEquipment = {
        ...equipmentWithoutId,
        "ОТДЕЛЕНИЕ": addingToRoom.department,
        "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": addingToRoom.room,
        "КОД ПОМЕЩЕНИЯ": "",
        "ЭТАЖ": 1,
        "БЛОК": "",
      };
      addEquipmentMutation.mutate(newEquipment);
    } else {
      updateEquipmentMutation.mutate(updatedEquipment);
    }
    setIsEditDialogOpen(false);
    setEditingEquipment(null);
    setIsAddingEquipment(false);
    setAddingToRoom(null);
  };

  const handleAddEquipment = (department: string, room: string) => {
    setAddingToRoom({ department, room });
    setEditingEquipment({
      id: '',
      "Наименование оборудования": '',
      "Код оборудования": '',
      "Кол-во": '',
      "Ед. изм.": '',
      "Примечания": '',
      equipment_status: 'Не найдено',
      equipment_specification: '',
      equipment_documents: ''
    });
    setIsAddingEquipment(true);
    setIsEditDialogOpen(true);
  };

  const handleCreateMultipleConnections = () => {
    selectedTurarRooms.forEach(turarRoom => {
      // Создаем связи со всеми комнатами проектировщиков в отделении
      Object.keys(groupedRooms).forEach(projectorRoom => {
        onCreateConnection(selectedTurarDept, turarRoom, departmentName, projectorRoom);
      });
    });
    setSelectedTurarDept('');
    setSelectedTurarRooms([]);
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
    <div className="space-y-4">
      {/* Связки с отделениями Турар */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-800 text-base">Связать с отделениями Турар</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TurarDepartmentSelector
            value={selectedTurarDept}
            onValueChange={setSelectedTurarDept}
            label="Отделение Турар"
          />
          <TurarRoomSelector
            selectedDepartment={selectedTurarDept}
            selectedRooms={selectedTurarRooms}
            onRoomsChange={setSelectedTurarRooms}
            multiple={true}
            label="Кабинеты Турар (множественный выбор)"
          />
          {selectedTurarDept && selectedTurarRooms.length > 0 && (
            <Button 
              onClick={handleCreateMultipleConnections}
              className="w-full"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Создать связи ({selectedTurarRooms.length} кабинетов → {Object.keys(groupedRooms).length} проектировщик)
            </Button>
          )}
        </CardContent>
      </Card>

      {linkingRoom && linkingRoom.projectorDept === departmentName && (
        <Card className="bg-yellow-50 border-yellow-200 mb-3">
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

      <Accordion type="multiple" className="w-full">
        {Object.entries(groupedRooms).map(([roomName, roomData]) => {
          const connectedTurarRooms = getConnectedTurarRooms(roomName);
          const isLinkTarget = linkingRoom?.projectorDept === departmentName;

          return (
            <AccordionItem key={roomName} value={roomName} className={`border rounded-lg ${
              isLinkTarget 
                ? 'border-yellow-300' 
                : connectedTurarRooms.length > 0 
                  ? 'border-green-300 bg-green-50/50 dark:bg-green-900/10'
                  : 'border-blue-200'
            }`}>
              <AccordionTrigger className="hover:no-underline px-4">
                <div className="flex items-center justify-between w-full pr-4">
                   <div className="flex items-center gap-3">
                     <div className={`p-1.5 rounded ${
                       isLinkTarget 
                         ? 'bg-yellow-100' 
                         : connectedTurarRooms.length > 0
                           ? 'bg-green-100 dark:bg-green-900/20'
                           : 'bg-blue-100 dark:bg-blue-900/20'
                     }`}>
                       <Building2 className={`h-4 w-4 ${
                         isLinkTarget 
                           ? 'text-yellow-600' 
                           : connectedTurarRooms.length > 0
                             ? 'text-green-600'
                             : 'text-blue-600'
                       }`} />
                     </div>
                     <div className="text-left">
                       <div className={`font-medium ${
                         connectedTurarRooms.length > 0 ? 'text-green-800 dark:text-green-300' : ''
                       }`}>{roomName}</div>
                       <div className="text-sm text-muted-foreground">
                         Этаж {roomData.roomInfo.floor}, {roomData.roomInfo.block} • {roomData.equipment.length} оборудования
                         {connectedTurarRooms.length > 0 && (
                           <span className="text-green-600 font-medium"> • {connectedTurarRooms.length} связей ✓</span>
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
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
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

                {/* Оборудование с возможностью редактирования */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-800">Оборудование:</h4>
                    <Button
                      size="sm"
                      onClick={() => handleAddEquipment(departmentName, roomName)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Добавить
                    </Button>
                  </div>
                  <EquipmentDisplay 
                    department={departmentName} 
                    room={roomName}
                    onEditEquipment={handleEditEquipment}
                  />
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
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <EditEquipmentDialog
        equipment={editingEquipment}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingEquipment(null);
          setIsAddingEquipment(false);
          setAddingToRoom(null);
        }}
        onSave={handleSaveEquipment}
        isNew={isAddingEquipment}
      />
    </div>
  );
};

// Компонент для отображения оборудования с возможностью редактирования
const EquipmentDisplay: React.FC<{
  department: string;
  room: string;
  onEditEquipment: (equipment: any) => void;
}> = ({ department, room, onEditEquipment }) => {
  const { data: equipment, isLoading } = useProjectorRoomEquipment(department, room);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Загрузка...</div>;
  }

  if (!equipment || equipment.length === 0) {
    return <div className="text-sm text-muted-foreground">Оборудование не найдено</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {equipment.map((item, idx) => (
        <div key={idx} className="bg-white/70 p-3 rounded border border-blue-100 hover:border-blue-200 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-medium text-sm">{item["Наименование оборудования"] || 'Без названия'}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Код: {item["Код оборудования"] || 'Не указан'} | Количество: {item["Кол-во"] || 'Не указано'} {item["Ед. изм."] || ''}</div>
                {item.equipment_specification && (
                  <div>Спецификация: {item.equipment_specification}</div>
                )}
                {item.equipment_documents && (
                  <div>Документы: {item.equipment_documents}</div>
                )}
                {item["Примечания"] && (
                  <div>Примечания: {item["Примечания"]}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {item.equipment_status && (
                <Badge className={statusConfig[item.equipment_status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                  {statusConfig[item.equipment_status as keyof typeof statusConfig]?.label || item.equipment_status}
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEditEquipment(item)}
                className="p-1 h-auto"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MappedProjectorDepartmentDisplay;