import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { Plus, Link2, Building2, Save, X, Trash2 } from 'lucide-react'
import { useDepartments } from '@/hooks/useDepartments'
import { useDepartmentMappingsWithDetails } from '@/hooks/useDepartmentMappingsById'
import { useRoomConnectionsById, useCreateRoomConnectionById, useDeleteRoomConnectionById } from '@/hooks/useRoomConnectionsById'
import DepartmentRoomsDisplay from '@/components/DepartmentRoomsDisplay'
import { useToast } from '@/hooks/use-toast'
import { useUserRole } from '@/hooks/useUserRole'

interface PendingConnection {
  id: string;
  turar_department_id: string;
  turar_room_id: string;
  projector_department_id: string;
  projector_room_id: string;
  turar_department: string;
  turar_room: string;
  projector_department: string;
  projector_room: string;
}

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
  const [pendingConnections, setPendingConnections] = useState<PendingConnection[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

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

  // Автоматическое обновление данных каждые 10 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSaving) {
        refetchConnections();
        setLastUpdate(new Date());
      }
    }, 10000); // 10 секунд

    return () => clearInterval(interval);
  }, [isSaving, refetchConnections]);

  const handleLinkRoom = (roomId: string, roomName: string, departmentId: string, departmentName: string, isProjectorDepartment: boolean) => {
    // Устанавливаем выбранный кабинет
    setLinkingRoom({
      departmentId,
      roomId,
      roomName,
      departmentName,
      isProjectorDepartment
    });

    // Определяем доступные отделения для связывания
    if (isProjectorDepartment) {
      // Если выбран кабинет проектировщиков, ищем связанные отделения Турар
      const turarDepts = linkedDepartmentPairs
        .filter(pair => pair.projector_department_id === departmentId)
        .map(pair => ({
          id: pair.turar_department_id!,
          name: pair.turar_department
        }));
      setAvailableTargetDepts(turarDepts);
    } else {
      // Если выбран кабинет Турар, ищем связанные отделения проектировщиков
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
    setShowConnectionDialog(true);

    toast({
      title: "Выбор отделения для связывания",
      description: `Выбран кабинет: ${departmentName} - ${roomName}`
    });
  };

  const addPendingConnection = () => {
    if (!linkingRoom || !selectedTargetRoomId || !selectedTargetDeptId) {
      return;
    }

    const targetDeptName = availableTargetDepts.find(d => d.id === selectedTargetDeptId)?.name || '';
    const targetRoomName = connections?.find(c => 
      linkingRoom.isProjectorDepartment 
        ? c.turar_room_id === selectedTargetRoomId 
        : c.projector_room_id === selectedTargetRoomId
    ) || {};

    const newConnection: PendingConnection = linkingRoom.isProjectorDepartment ? {
      id: crypto.randomUUID(),
      turar_department_id: selectedTargetDeptId,
      turar_room_id: selectedTargetRoomId,
      projector_department_id: linkingRoom.departmentId,
      projector_room_id: linkingRoom.roomId,
      turar_department: targetDeptName,
      turar_room: selectedTargetRoomId, // Временно используем ID
      projector_department: linkingRoom.departmentName,
      projector_room: linkingRoom.roomName
    } : {
      id: crypto.randomUUID(),
      turar_department_id: linkingRoom.departmentId,
      turar_room_id: linkingRoom.roomId,
      projector_department_id: selectedTargetDeptId,
      projector_room_id: selectedTargetRoomId,
      turar_department: linkingRoom.departmentName,
      turar_room: linkingRoom.roomName,
      projector_department: targetDeptName,
      projector_room: selectedTargetRoomId // Временно используем ID
    };

    setPendingConnections(prev => [...prev, newConnection]);
    
    // Сбрасываем только выбор кабинета, но оставляем режим связывания
    setSelectedTargetRoomId('');
    setStep('room');
    
    toast({
      title: "Связь добавлена",
      description: "Связь добавлена в очередь на сохранение"
    });
  };

  const removePendingConnection = (connectionId: string) => {
    setPendingConnections(prev => prev.filter(c => c.id !== connectionId));
  };

  const saveAllConnections = async () => {
    if (pendingConnections.length === 0) return;
    
    setIsSaving(true);
    setSaveProgress(0);
    
    const total = pendingConnections.length;
    let saved = 0;
    
    try {
      for (const connection of pendingConnections) {
        const { id, ...connectionData } = connection;
        await createConnectionMutation.mutateAsync(connectionData);
        
        saved++;
        setSaveProgress((saved / total) * 100);
      }
      
      setPendingConnections([]);
      setLinkingRoom(null);
      setShowConnectionDialog(false);
      setSelectedTargetDeptId('');
      setSelectedTargetRoomId('');
      
      // Принудительно обновляем данные о связях
      await refetchConnections();
      setLastUpdate(new Date());
      
      toast({
        title: "Связи сохранены",
        description: `Успешно сохранено ${total} связей. Данные обновлены.`
      });
    } catch (error) {
      console.error('Ошибка сохранения связей:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить некоторые связи",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
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
    if (pendingConnections.length > 0) {
      const confirmCancel = confirm('У вас есть несохраненные связи. Вы уверены, что хотите отменить?');
      if (!confirmCancel) return;
      setPendingConnections([]);
    }
    
    setLinkingRoom(null)
    setShowConnectionDialog(false)
    setSelectedTargetDeptId('')
    setSelectedTargetRoomId('')
    toast({
      title: "Связывание отменено",
      description: "Процесс связывания кабинетов отменен"
    })
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
          {pendingConnections.length > 0 && (
            <>
              <Button 
                onClick={saveAllConnections} 
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Сохранить все ({pendingConnections.length})
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setPendingConnections([])}
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4" />
                Очистить
              </Button>
            </>
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
              <div>
                <div className="font-medium">Режим связывания активен</div>
                <div className="text-sm text-muted-foreground">
                  Выбран: {linkingRoom.departmentName} - {linkingRoom.roomName}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Прогресс сохранения */}
      {isSaving && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Save className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Сохранение связей...</div>
                  <div className="text-sm text-muted-foreground">
                    Обрабатывается {Math.round(saveProgress)}%
                  </div>
                </div>
              </div>
              <Progress value={saveProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Очередь несохраненных связей */}
      {pendingConnections.length > 0 && !isSaving && (
        <Card className="border-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Plus className="h-5 w-5" />
              Очередь на сохранение ({pendingConnections.length})
            </CardTitle>
            <CardDescription>
              Связи будут сохранены после нажатия кнопки "Сохранить все"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingConnections.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="text-sm">
                    <span className="font-medium">{connection.turar_department}</span> - {connection.turar_room}
                    {" ↔ "}
                    <span className="font-medium">{connection.projector_department}</span> - {connection.projector_room}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePendingConnection(connection.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
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
                id: pair.projector_department_id!,
                name: pair.projector_department
              });
              return acc;
            }, {} as Record<string, {
              turar_department_id: string;
              turar_department: string;
              projector_departments: Array<{id: string; name: string}>;
            }>)
          ).map(([turarDeptName, group]) => (
            <Card key={turarDeptName} className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {group.turar_department}
                </CardTitle>
                <CardDescription>
                  Связан с {group.projector_departments.length} отделением(ями) проектировщиков
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Левая сторона - Отделение Турар */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Отделение Турар
                      </div>
                      {/* Добавляем кнопку быстрого связывания для Турар */}
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 bg-blue-50 hover:bg-blue-100 border-blue-300"
                          onClick={() => {
                            handleLinkRoom('', 'Выберите кабинет', group.turar_department_id, group.turar_department, false)
                          }}
                        >
                          <Link2 className="h-4 w-4" />
                          Связать кабинеты
                        </Button>
                      )}
                    </h3>
                    <div className="mb-4">
                      <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                        {group.turar_department}
                      </Badge>
                      {/* Индикатор активного связывания для Турар */}
                      {linkingRoom && !linkingRoom.isProjectorDepartment && linkingRoom.departmentId === group.turar_department_id && (
                        <Badge variant="default" className="ml-2 text-xs">
                          🎯 Выберите отделение Проектировщиков справа
                        </Badge>
                      )}
                    </div>
                    <DepartmentRoomsDisplay
                      departmentId={group.turar_department_id}
                      departmentName={group.turar_department}
                      onLinkRoom={(roomId, roomName) => 
                        handleLinkRoom(roomId, roomName, group.turar_department_id, group.turar_department, false)
                      }
                      onRemoveConnection={handleRemoveConnection}
                      linkingRoom={linkingRoom}
                      connections={connections}
                      isProjectorDepartment={false}
                    />
                  </div>
                  
                  {/* Правая сторона - Связанные отделения Проектировщиков */}
                  <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Связанные отделения Проектировщиков
                      </div>
                      {/* Общий индикатор для связывания */}
                      {linkingRoom && linkingRoom.isProjectorDepartment && (
                        <Badge variant="default" className="text-xs">
                          🎯 Выберите отделение Турар
                        </Badge>
                      )}
                    </h3>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {group.projector_departments.map((projDept) => (
                        <div key={projDept.id} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                            {projDept.name}
                          </Badge>
                          {/* Индикатор активного связывания для конкретного отделения */}
                          {linkingRoom && linkingRoom.isProjectorDepartment && linkingRoom.departmentId === projDept.id && (
                            <Badge variant="default" className="text-xs">
                              🎯 Выберите кабинет Турар слева
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      {group.projector_departments.map((projectorDept) => (
                        <AccordionItem key={projectorDept.id} value={projectorDept.id}>
                          <AccordionTrigger>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{projectorDept.name}</span>
                              {/* Добавляем кнопку быстрого связывания прямо в заголовок */}
                              <div className="flex items-center gap-2 pr-4">
                                {canEdit && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 bg-green-50 hover:bg-green-100 border-green-300"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // Начинаем связывание с этого отделения
                                      handleLinkRoom('', 'Выберите кабинет', projectorDept.id, projectorDept.name, true)
                                    }}
                                  >
                                    <Link2 className="h-4 w-4" />
                                    Связать кабинеты
                                  </Button>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <DepartmentRoomsDisplay
                              departmentId={projectorDept.id}
                              departmentName={projectorDept.name}
                              onLinkRoom={(roomId, roomName) => 
                                handleLinkRoom(roomId, roomName, projectorDept.id, projectorDept.name, true)
                              }
                              onRemoveConnection={handleRemoveConnection}
                              linkingRoom={linkingRoom}
                              connections={connections}
                              isProjectorDepartment={true}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Статистика */}
      {connections && connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Статистика связей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{connections.length}</div>
                <div className="text-sm text-muted-foreground">Всего связей</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {new Set(connections.map(c => c.turar_room_id)).size}
                </div>
                <div className="text-sm text-muted-foreground">Связанных кабинетов Турар</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(connections.map(c => c.projector_room_id)).size}
                </div>
                <div className="text-sm text-muted-foreground">Связанных кабинетов Проектировщиков</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Диалог выбора отделения и кабинета для связывания */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Связывание кабинетов</DialogTitle>
          </DialogHeader>
          
          {linkingRoom && (
            <div className="space-y-6">
              {/* Информация о выбранном кабинете */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Выбранный кабинет:</h4>
                <div className="text-sm">
                  <div><strong>Отделение:</strong> {linkingRoom.departmentName}</div>
                  <div><strong>Кабинет:</strong> {linkingRoom.roomName}</div>
                  <div><strong>Тип:</strong> {linkingRoom.isProjectorDepartment ? 'Проектировщики' : 'Турар'}</div>
                </div>
              </div>

              {/* Шаг 1: Выбор отделения */}
              {step === 'department' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Шаг 1: Выберите отделение для связывания</h4>
                  <Select value={selectedTargetDeptId} onValueChange={setSelectedTargetDeptId}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Выберите отделение ${linkingRoom.isProjectorDepartment ? 'Турар' : 'Проектировщиков'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTargetDepts.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={cancelLinking}>
                      Отмена
                    </Button>
                    <Button 
                      onClick={() => setStep('room')}
                      disabled={!selectedTargetDeptId}
                    >
                      Далее
                    </Button>
                  </div>
                </div>
              )}

              {/* Шаг 2: Выбор кабинета */}
              {step === 'room' && selectedTargetDeptId && (
                <div className="space-y-4">
                  <h4 className="font-medium">Шаг 2: Выберите кабинет</h4>
                  <div className="text-sm text-muted-foreground mb-4">
                    Отделение: {availableTargetDepts.find(d => d.id === selectedTargetDeptId)?.name}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <DepartmentRoomsDisplay
                      departmentId={selectedTargetDeptId}
                    departmentName={availableTargetDepts.find(d => d.id === selectedTargetDeptId)?.name || ''}
                    onLinkRoom={(roomId) => {
                      setSelectedTargetRoomId(roomId);
                      // Автоматически добавляем в очередь при выборе кабинета
                      setTimeout(() => {
                        addPendingConnection();
                      }, 100);
                    }}
                    linkingRoom={linkingRoom}
                    connections={connections}
                    isProjectorDepartment={!linkingRoom.isProjectorDepartment}
                    selectedRoomId={selectedTargetRoomId}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setStep('department')}>
                      Назад
                    </Button>
                    <Button variant="outline" onClick={cancelLinking}>
                      Отмена
                    </Button>
                    <Button 
                      onClick={addPendingConnection}
                      disabled={!selectedTargetRoomId}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Добавить связь
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}