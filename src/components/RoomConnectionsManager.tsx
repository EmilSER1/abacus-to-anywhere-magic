import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Plus, Link2, Building2 } from 'lucide-react'
import { useDepartments } from '@/hooks/useDepartments'
import { useDepartmentMappingsWithDetails } from '@/hooks/useDepartmentMappingsById'
import { useRoomConnectionsById, useCreateRoomConnectionById, useDeleteRoomConnectionById } from '@/hooks/useRoomConnectionsById'
import DepartmentRoomsDisplay from '@/components/DepartmentRoomsDisplay'
import { useToast } from '@/hooks/use-toast'

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

  const { data: departments } = useDepartments()
  const { data: departmentMappings } = useDepartmentMappingsWithDetails()
  const { data: connections } = useRoomConnectionsById()
  const createConnectionMutation = useCreateRoomConnectionById()
  const deleteConnectionMutation = useDeleteRoomConnectionById()
  const { toast } = useToast()

  // Получаем связанные отделения (только те, у которых есть ID)
  const linkedDepartmentPairs = departmentMappings?.filter(mapping => 
    mapping.turar_department_id && mapping.projector_department_id
  ) || []

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

  const createConnection = async () => {
    if (!linkingRoom || !selectedTargetRoomId) {
      console.log('Missing data for connection:', { linkingRoom, selectedTargetRoomId, selectedTargetDeptId });
      return;
    }

    console.log('Creating connection with data:', {
      linkingRoom,
      selectedTargetDeptId,
      selectedTargetRoomId,
      isProjectorDepartment: linkingRoom.isProjectorDepartment
    });

    const connectionData = linkingRoom.isProjectorDepartment ? {
      turar_department_id: selectedTargetDeptId,
      turar_room_id: selectedTargetRoomId,
      projector_department_id: linkingRoom.departmentId,
      projector_room_id: linkingRoom.roomId
    } : {
      turar_department_id: linkingRoom.departmentId,
      turar_room_id: linkingRoom.roomId,
      projector_department_id: selectedTargetDeptId,
      projector_room_id: selectedTargetRoomId
    };

    console.log('Connection data:', connectionData);

    try {
      await createConnectionMutation.mutateAsync(connectionData);
      
      setLinkingRoom(null);
      setShowConnectionDialog(false);
      setSelectedTargetDeptId('');
      setSelectedTargetRoomId('');
      
      toast({
        title: "Связь создана",
        description: "Кабинеты успешно связаны"
      });
    } catch (error) {
      console.error('Ошибка создания связи:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать связь кабинетов",
        variant: "destructive"
      });
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      await deleteConnectionMutation.mutateAsync(connectionId)
    } catch (error) {
      console.error('Ошибка удаления связи:', error)
    }
  }

  const cancelLinking = () => {
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
          <p className="text-muted-foreground">
            Нажмите "Связать" на любом кабинете для начала процесса связывания
          </p>
        </div>
        
        <div className="flex gap-2">
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
                    <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Отделение Турар
                    </h3>
                    <div className="mb-4">
                      <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                        {group.turar_department}
                      </Badge>
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
                    <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Связанные отделения Проектировщиков
                    </h3>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {group.projector_departments.map((projDept) => (
                        <Badge key={projDept.id} variant="outline" className="text-green-600 border-green-300 bg-green-50">
                          {projDept.name}
                        </Badge>
                      ))}
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      {group.projector_departments.map((projectorDept) => (
                        <AccordionItem key={projectorDept.id} value={projectorDept.id}>
                          <AccordionTrigger>
                            <span className="font-medium">{projectorDept.name}</span>
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
                      // Используем правильное значение selectedTargetDeptId в closure
                      const currentTargetDeptId = selectedTargetDeptId;
                      // Автоматически создаем связь при выборе кабинета
                      setTimeout(async () => {
                        if (!linkingRoom || !currentTargetDeptId) {
                          console.log('Missing required data for auto-connection');
                          return;
                        }

                        const connectionData = linkingRoom.isProjectorDepartment ? {
                          turar_department_id: currentTargetDeptId,
                          turar_room_id: roomId,
                          projector_department_id: linkingRoom.departmentId,
                          projector_room_id: linkingRoom.roomId
                        } : {
                          turar_department_id: linkingRoom.departmentId,
                          turar_room_id: linkingRoom.roomId,
                          projector_department_id: currentTargetDeptId,
                          projector_room_id: roomId
                        };

                        try {
                          await createConnectionMutation.mutateAsync(connectionData);
                          
                          setLinkingRoom(null);
                          setShowConnectionDialog(false);
                          setSelectedTargetDeptId('');
                          setSelectedTargetRoomId('');
                          
                          toast({
                            title: "Связь создана",
                            description: "Кабинеты успешно связаны"
                          });
                        } catch (error) {
                          console.error('Ошибка автоматического создания связи:', error);
                          toast({
                            title: "Ошибка",
                            description: "Не удалось создать связь кабинетов",
                            variant: "destructive"
                          });
                        }
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