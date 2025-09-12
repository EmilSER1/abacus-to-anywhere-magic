import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Link2, Building2, Trash2 } from 'lucide-react'
import { useDepartments } from '@/hooks/useDepartments'
import { useDepartmentMappingsWithDetails } from '@/hooks/useDepartmentMappingsById'
import { useRoomConnectionsById, useCreateRoomConnectionById, useDeleteRoomConnectionById } from '@/hooks/useRoomConnectionsById'
import DepartmentRoomsDisplay from '@/components/DepartmentRoomsDisplay'
import { useToast } from '@/hooks/use-toast'
import { useUserRole } from '@/hooks/useUserRole'
import { supabase } from '@/integrations/supabase/client'

export default function RoomConnectionsManager() {
  const [linkingRoom, setLinkingRoom] = useState<{
    departmentId: string;
    roomId: string;
    roomName: string;
    departmentName: string;
    isProjectorDepartment: boolean;
  } | null>(null)
  
  // Очередь связей для создания
  const [connectionQueue, setConnectionQueue] = useState<Array<{
    sourceRoomId: string;
    sourceRoomName: string;
    sourceDepartmentId: string;
    sourceDepartmentName: string;
    targetRoomId: string;
    targetRoomName: string;
    targetDepartmentId: string;
    targetDepartmentName: string;
    isProjectorToTurar: boolean;
  }>>([])
  
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set())

  const { data: departments } = useDepartments()
  const { data: departmentMappings } = useDepartmentMappingsWithDetails()
  const { data: connections, refetch: refetchConnections } = useRoomConnectionsById()
  const createConnectionMutation = useCreateRoomConnectionById()
  const deleteConnectionMutation = useDeleteRoomConnectionById()
  const { toast } = useToast()
  const { canEdit } = useUserRole()

  // Получаем связанные отделения (только те, у которых есть ID)
  const linkedDepartmentPairs = departmentMappings?.filter(mapping => 
    mapping.turar_department_id && mapping.projector_department_id
  ) || []

  console.log('🔗 СВЯЗАННЫЕ ОТДЕЛЕНИЯ:', {
    departmentMappings: departmentMappings?.length || 0,
    linkedDepartmentPairs: linkedDepartmentPairs.length,
    отделенияСИды: linkedDepartmentPairs.map(p => ({
      turar: p.turar_department,
      projector: p.projector_department,
      turarId: p.turar_department_id,
      projectorId: p.projector_department_id
    }))
  });

  // Автоматическое обновление данных каждые 10 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      refetchConnections();
      setLastUpdate(new Date());
    }, 10000); // 10 секунд

    return () => clearInterval(interval);
  }, [refetchConnections]);

  const handleLinkRoom = (roomId: string, roomName: string, departmentId: string, departmentName: string, isProjectorDepartment: boolean) => {
    if (linkingRoom) {
      // Если уже есть выбранный кабинет, предлагаем либо сбросить, либо продолжить с новым
      if (linkingRoom.roomId === roomId) {
        // Если кликнули на тот же кабинет - сбрасываем
        setLinkingRoom(null);
        toast({
          title: "Связывание отменено",
          description: "Выберите кабинет для связывания"
        });
        return;
      } else {
        // Если кликнули на другой кабинет - меняем исходный кабинет
        setLinkingRoom({
          roomId,
          roomName,
          departmentId,
          departmentName,
          isProjectorDepartment
        });
        
        toast({
          title: "Сменен исходный кабинет",
          description: `Теперь выбран ${departmentName} - ${roomName}. Отметьте кабинеты для связывания.`
        });
        return;
      }
    }
    
    setLinkingRoom({
      roomId,
      roomName,
      departmentId,
      departmentName,
      isProjectorDepartment
    });
    
    toast({
      title: "Кабинет выбран",
      description: `Выбран ${departmentName} - ${roomName}. Теперь отметьте кабинеты для связывания.`
    });
  };

  const addToConnectionQueue = (targetRoomId: string, targetRoomName: string, targetDepartmentId: string, targetDepartmentName: string) => {
    if (!linkingRoom) return;
    
    // Проверяем, нет ли уже такой связи в очереди
    const connectionExists = connectionQueue.some(conn => 
      (conn.sourceRoomId === linkingRoom.roomId && conn.targetRoomId === targetRoomId) ||
      (conn.sourceRoomId === targetRoomId && conn.targetRoomId === linkingRoom.roomId)
    );
    
    if (connectionExists) {
      toast({
        title: "Связь уже в очереди",
        description: "Эта связь уже добавлена в очередь",
        variant: "destructive"
      });
      return;
    }
    
    const newConnection = {
      sourceRoomId: linkingRoom.roomId,
      sourceRoomName: linkingRoom.roomName,
      sourceDepartmentId: linkingRoom.departmentId,
      sourceDepartmentName: linkingRoom.departmentName,
      targetRoomId,
      targetRoomName,
      targetDepartmentId,
      targetDepartmentName,
      isProjectorToTurar: linkingRoom.isProjectorDepartment
    };
    
    setConnectionQueue(prev => [...prev, newConnection]);
    
    // НЕ сбрасываем linkingRoom, чтобы можно было продолжить добавление связей с тем же исходным кабинетом
    
    toast({
      title: "Связь добавлена в очередь",
      description: `${linkingRoom.roomName} ↔ ${targetRoomName}. Продолжайте выбирать кабинеты для связывания или создайте связи.`
    });
  };

  const removeFromConnectionQueue = (index: number) => {
    setConnectionQueue(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Связь удалена из очереди",
      description: "Связь удалена из очереди создания"
    });
  };

  const createAllConnections = async () => {
    if (connectionQueue.length === 0) {
      toast({
        title: "Очередь пуста",
        description: "Добавьте связи в очередь перед созданием",
        variant: "destructive"
      });
      return;
    }

    try {
      let successCount = 0;
      
      for (const connection of connectionQueue) {
        const connectionData = connection.isProjectorToTurar ? {
          projector_department_id: connection.sourceDepartmentId,
          projector_room_id: connection.sourceRoomId,
          turar_department_id: connection.targetDepartmentId,
          turar_room_id: connection.targetRoomId
        } : {
          turar_department_id: connection.sourceDepartmentId,
          turar_room_id: connection.sourceRoomId,
          projector_department_id: connection.targetDepartmentId,
          projector_room_id: connection.targetRoomId
        };

        await createConnectionMutation.mutateAsync(connectionData);
        successCount++;
      }
      
      // Сбрасываем только очередь, оставляем linkingRoom для продолжения работы
      setConnectionQueue([]);
      // НЕ сбрасываем linkingRoom, чтобы пользователь мог продолжать связывать кабинеты
      
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
    setLinkingRoom(null);
    toast({
      title: "Связывание отменено",
      description: "Процесс связывания кабинетов отменен"
    });
  };

  const clearConnectionQueue = () => {
    setConnectionQueue([]);
    toast({
      title: "Очередь очищена",
      description: "Все связи удалены из очереди"
    });
  };

  const isRoomInQueue = (roomId: string) => {
    return connectionQueue.some(conn => 
      conn.sourceRoomId === roomId || conn.targetRoomId === roomId
    );
  };

  console.log('🔍 Очередь связей:', connectionQueue.map(c => ({
    source: c.sourceRoomName,
    target: c.targetRoomName,
    sourceId: c.sourceRoomId,
    targetId: c.targetRoomId
  })));

  const toggleDepartment = (deptKey: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(deptKey)) {
      newExpanded.delete(deptKey);
    } else {
      newExpanded.add(deptKey);
    }
    setExpandedDepartments(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Связывание кабинетов</h2>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">
              {linkingRoom 
                ? `Выбран: ${linkingRoom.departmentName} - ${linkingRoom.roomName}. Теперь добавьте целевые кабинеты в очередь.`
                : "Выберите исходный кабинет для связывания, затем добавляйте целевые кабинеты в очередь"
              }
            </p>
            <div className="text-xs text-muted-foreground">
              Обновлено: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {linkingRoom && (
            <Button variant="outline" onClick={cancelLinking}>
              Отменить связывание
            </Button>
          )}
        </div>
      </div>

      {/* Очередь связей */}
      {connectionQueue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Очередь связей ({connectionQueue.length})</span>
              <div className="flex gap-2">
                <Button onClick={createAllConnections} disabled={createConnectionMutation.isPending}>
                  {createConnectionMutation.isPending ? 'Создание...' : `Создать все связи (${connectionQueue.length})`}
                </Button>
                <Button variant="outline" onClick={clearConnectionQueue}>
                  Очистить очередь
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {connectionQueue.map((connection, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50/50">
                  <div className="text-sm">
                    <div className="font-medium">
                      <span className="text-blue-600">{connection.sourceRoomName}</span> 
                      <span className="text-muted-foreground mx-2">({connection.sourceDepartmentName})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">связать с</span>
                      <span className="font-medium text-green-600">{connection.targetRoomName}</span>
                      <span className="text-muted-foreground text-xs">({connection.targetDepartmentName})</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeFromConnectionQueue(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
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
                        onAddToQueue={addToConnectionQueue}
                        isRoomInQueue={isRoomInQueue}
                        selectedRooms={new Set()}
                        multiSelectMode={false}
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
                            onAddToQueue={addToConnectionQueue}
                            isRoomInQueue={isRoomInQueue}
                            isProjectorDepartment={true}
                            selectedRooms={new Set()}
                            multiSelectMode={false}
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