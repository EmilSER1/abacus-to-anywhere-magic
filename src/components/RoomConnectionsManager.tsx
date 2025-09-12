import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Link2, Building2 } from 'lucide-react'
import { useDepartments } from '@/hooks/useDepartments'
import { useDepartmentMappingsWithDetails } from '@/hooks/useDepartmentMappingsById'
import { useRoomConnectionsById, useCreateRoomConnectionById, useDeleteRoomConnectionById } from '@/hooks/useRoomConnectionsById'
import DepartmentRoomsDisplay from '@/components/DepartmentRoomsDisplay'
import { useToast } from '@/hooks/use-toast'
import { useUserRole } from '@/hooks/useUserRole'

export default function RoomConnectionsManager() {
  const [linkingRoom, setLinkingRoom] = useState<{
    departmentId: string;
    roomId: string;
    roomName: string;
    departmentName: string;
    isProjectorDepartment: boolean;
  } | null>(null)
  
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [selectedTargetDeptId, setSelectedTargetDeptId] = useState('')
  const [selectedTargetRoomId, setSelectedTargetRoomId] = useState('')
  const [availableTargetDepts, setAvailableTargetDepts] = useState<Array<{id: string; name: string}>>([])
  const [step, setStep] = useState<'department' | 'room'>('department')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set())
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set())

  const { data: departments } = useDepartments()
  const { data: departmentMappings } = useDepartmentMappingsWithDetails()
  const { data: connections, refetch: refetchConnections } = useRoomConnectionsById()
  
  // Логируем данные соединений
  console.log('🔗 RoomConnectionsManager connections:', {
    total: connections?.length || 0,
    connections: connections?.map(c => ({
      id: c.id,
      turar_room_id: c.turar_room_id,
      projector_room_id: c.projector_room_id
    })) || []
  });
  const createConnectionMutation = useCreateRoomConnectionById()
  const deleteConnectionMutation = useDeleteRoomConnectionById()
  const { toast } = useToast()
  const { canEdit } = useUserRole()

  // Получаем связанные отделения (только те, у которых есть ID)
  const linkedDepartmentPairs = departmentMappings?.filter(mapping => 
    mapping.turar_department_id && mapping.projector_department_id
  ) || []

  // Автоматическое обновление данных каждые 10 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      refetchConnections();
      setLastUpdate(new Date());
    }, 10000); // 10 секунд

    return () => clearInterval(interval);
  }, [refetchConnections]);

  const handleLinkRoom = (roomId: string, roomName: string, departmentId: string, departmentName: string, isProjectorDepartment: boolean) => {
    // Если уже есть выбранный кабинет для связывания, добавляем/убираем из множественного выбора
    if (linkingRoom && linkingRoom.departmentId !== departmentId) {
      const newSelectedRooms = new Set(selectedRooms);
      if (newSelectedRooms.has(roomId)) {
        newSelectedRooms.delete(roomId);
      } else {
        newSelectedRooms.add(roomId);
      }
      setSelectedRooms(newSelectedRooms);
      
      toast({
        title: "Кабинет выбран",
        description: `${newSelectedRooms.has(roomId) ? 'Добавлен' : 'Убран'}: ${departmentName} - ${roomName}. Всего выбрано: ${newSelectedRooms.size}`
      });
      return;
    }

    // Устанавливаем выбранный кабинет как основной для связывания
    setLinkingRoom({
      departmentId,
      roomId,
      roomName,
      departmentName,
      isProjectorDepartment
    });

    // Определяем доступные отделения для связывания
    if (isProjectorDepartment) {
      const turarDepts = linkedDepartmentPairs
        .filter(pair => pair.projector_department_id === departmentId)
        .map(pair => ({
          id: pair.turar_department_id!,
          name: pair.turar_department
        }));
      setAvailableTargetDepts(turarDepts);
    } else {
      const projectorDepts = linkedDepartmentPairs
        .filter(pair => pair.turar_department_id === departmentId)
        .map(pair => ({
          id: pair.projector_department_id!,
          name: pair.projector_department
        }));
      setAvailableTargetDepts(projectorDepts);
    }

    setStep('department');
    setSelectedTargetDeptId('');
    setSelectedTargetRoomId('');
    setSelectedRooms(new Set());

    toast({
      title: "Множественное связывание",
      description: `Исходный кабинет: ${departmentName} - ${roomName}. Теперь выберите кабинеты для связывания.`
    });
  };

  const createMultipleConnections = async () => {
    if (!linkingRoom || selectedRooms.size === 0) {
      toast({
        title: "Ошибка",
        description: "Необходимо выбрать кабинеты для связывания",
        variant: "destructive"
      });
      return;
    }

    try {
      let successCount = 0;
      
      for (const roomId of selectedRooms) {
        const connectionData = linkingRoom.isProjectorDepartment ? {
          turar_department_id: linkingRoom.departmentId,
          turar_room_id: roomId,
          projector_department_id: linkingRoom.departmentId,
          projector_room_id: linkingRoom.roomId
        } : {
          turar_department_id: linkingRoom.departmentId,
          turar_room_id: linkingRoom.roomId,
          projector_department_id: linkingRoom.departmentId,
          projector_room_id: roomId
        };

        await createConnectionMutation.mutateAsync(connectionData);
        successCount++;
      }
      
      // Сбрасываем состояние
      setLinkingRoom(null);
      setSelectedRooms(new Set());
      
      // Обновляем данные
      await refetchConnections();
      setLastUpdate(new Date());
      
      toast({
        title: "Связи созданы",
        description: `Успешно создано ${successCount} связей`
      });
    } catch (error) {
      console.error('Ошибка создания связей:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать некоторые связи",
        variant: "destructive"
      });
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      await deleteConnectionMutation.mutateAsync(connectionId)
      // Принудительно обновляем данные после удаления
      await refetchConnections();
      setLastUpdate(new Date());
      toast({
        title: "Связь удалена",
        description: "Связь между кабинетами успешно удалена"
      });
    } catch (error) {
      console.error('Ошибка удаления связи:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить связь",
        variant: "destructive"
      });
    }
  }

  const cancelLinking = () => {
    setLinkingRoom(null)
    setSelectedRooms(new Set())
    setShowConnectionDialog(false)
    setSelectedTargetDeptId('')
    setSelectedTargetRoomId('')
    toast({
      title: "Связывание отменено",
      description: "Процесс связывания кабинетов отменен"
    })
  }

  const toggleDepartment = (deptKey: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(deptKey)) {
      newExpanded.delete(deptKey);
    } else {
      newExpanded.add(deptKey);
    }
    setExpandedDepartments(newExpanded);
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Связывание кабинетов</h2>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">
              Нажмите "Связать кабинеты" на любом кабинете для начала процесса связывания
            </p>
            <div className="text-xs text-muted-foreground">
              Обновлено: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {linkingRoom && selectedRooms.size > 0 && (
            <Button onClick={createMultipleConnections} disabled={createConnectionMutation.isPending}>
              {createConnectionMutation.isPending ? 'Создание...' : `Создать связи (${selectedRooms.size})`}
            </Button>
          )}
          {linkingRoom && (
            <Button variant="outline" onClick={cancelLinking}>
              Отменить связывание
            </Button>
          )}
        </div>
      </div>

      {/* Индикатор связывания */}
      {linkingRoom && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="font-medium">Режим множественного связывания активен</div>
                <div className="text-sm text-muted-foreground">
                  Исходный кабинет: {linkingRoom.departmentName} - {linkingRoom.roomName}
                </div>
                {selectedRooms.size > 0 ? (
                  <div className="text-sm text-green-600 font-medium">
                    ✅ Выбрано кабинетов для связывания: {selectedRooms.size}
                  </div>
                ) : (
                  <div className="text-sm text-orange-600">
                    👆 Выберите кабинеты для связывания в противоположном типе отделений
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Группировка по отделениям Турар */}
      <div className="space-y-8">
        {linkedDepartmentPairs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-muted-foreground">
                Нет связанных отделений. Сначала создайте связи на вкладке "Связывание отделений".
              </div>
            </CardContent>
          </Card>
        ) : (
          // Группируем по отделениям Турар
          Object.entries(
            linkedDepartmentPairs.reduce((acc, pair) => {
              const turarDept = pair.turar_department;
              if (!acc[turarDept]) {
                acc[turarDept] = {
                  turar_department_id: pair.turar_department_id!,
                  turar_department: pair.turar_department,
                  projector_departments: []
                };
              }
              acc[turarDept].projector_departments.push({
                projector_department_id: pair.projector_department_id!,
                projector_department: pair.projector_department
              });
              return acc;
            }, {} as Record<string, {
              turar_department_id: string;
              turar_department: string;
              projector_departments: Array<{
                projector_department_id: string;
                projector_department: string;
              }>;
            }>)
          ).map(([turarDeptName, group]) => {
            const deptKey = `turar-${turarDeptName}`;
            const isExpanded = expandedDepartments.has(deptKey);
            
            return (
              <Card key={turarDeptName} className="overflow-hidden">
                <CardHeader 
                  className="pb-2 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleDepartment(deptKey)}
                >
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-xs">Турар</Badge>
                      <span>{turarDeptName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {group.projector_departments.length} связей
                      </Badge>
                      <span className="text-sm">{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Кабинеты Турар */}
                      <DepartmentRoomsDisplay
                        departmentId={group.turar_department_id}
                        departmentName={group.turar_department}
                        connections={connections || []}
                        onRemoveConnection={handleRemoveConnection}
                        onLinkRoom={(roomId, roomName) => handleLinkRoom(roomId, roomName, group.turar_department_id, group.turar_department, false)}
                        linkingRoom={linkingRoom}
                        selectedRooms={selectedRooms}
                        multiSelectMode={linkingRoom !== null}
                      />

                      {/* Связанные отделения проектировщиков */}
                      <div className="space-y-3">
                        {group.projector_departments.map((projDept) => (
                          <DepartmentRoomsDisplay
                            key={projDept.projector_department_id}
                            departmentId={projDept.projector_department_id}
                            departmentName={projDept.projector_department}
                            connections={connections || []}
                            onRemoveConnection={handleRemoveConnection}
                            onLinkRoom={(roomId, roomName) => handleLinkRoom(roomId, roomName, projDept.projector_department_id, projDept.projector_department, true)}
                            linkingRoom={linkingRoom}
                            isProjectorDepartment={true}
                            selectedRooms={selectedRooms}
                            multiSelectMode={linkingRoom !== null}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  )
}