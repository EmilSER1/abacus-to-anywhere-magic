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
      refetchConnections();
      setLastUpdate(new Date());
    }, 10000); // 10 секунд

    return () => clearInterval(interval);
  }, [refetchConnections]);

  const handleLinkRoom = (roomId: string, roomName: string, departmentId: string, departmentName: string, isProjectorDepartment: boolean) => {
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
      title: "Создание связи",
      description: `Выбран кабинет: ${departmentName} - ${roomName}`
    });
  };

  const createConnection = async () => {
    if (!linkingRoom || !selectedTargetDeptId || !selectedTargetRoomId) {
      toast({
        title: "Ошибка",
        description: "Необходимо выбрать отделение и кабинет для связывания",
        variant: "destructive"
      });
      return;
    }

    try {
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

      await createConnectionMutation.mutateAsync(connectionData);
      
      // Сбрасываем состояние
      setLinkingRoom(null);
      setShowConnectionDialog(false);
      setSelectedTargetDeptId('');
      setSelectedTargetRoomId('');
      
      // Обновляем данные
      await refetchConnections();
      setLastUpdate(new Date());
      
      toast({
        title: "Связь создана",
        description: "Кабинеты успешно связаны"
      });
    } catch (error) {
      console.error('Ошибка создания связи:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать связь",
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
                <div className="font-medium">Режим связывания активен</div>
                <div className="text-sm text-muted-foreground">
                  Выбранный кабинет: {linkingRoom.departmentName} - {linkingRoom.roomName}
                </div>
                <div className="text-sm text-blue-600">
                  Выберите целевой кабинет в диалоге связывания
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
          ).map(([turarDeptName, group]) => (
            <div key={turarDeptName} className="space-y-6">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-lg font-semibold">Отделение Турар: {turarDeptName}</h3>
                <p className="text-sm text-muted-foreground">
                  Связано с {group.projector_departments.length} отделением(ями) проектировщиков
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Кабинеты Турар */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50">Отделение Турар</Badge>
                    <span className="font-medium">{group.turar_department}</span>
                  </div>
                  <DepartmentRoomsDisplay
                    departmentId={group.turar_department_id}
                    departmentName={group.turar_department}
                    connections={connections || []}
                    onRemoveConnection={handleRemoveConnection}
                    onLinkRoom={(roomId, roomName) => handleLinkRoom(roomId, roomName, group.turar_department_id, group.turar_department, false)}
                    linkingRoom={linkingRoom}
                  />
                </div>

                {/* Связанные отделения проектировщиков */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50">Связанные отделения Проектировщиков</Badge>
                  </div>
                  {group.projector_departments.map((projDept) => (
                    <div key={projDept.projector_department_id} className="space-y-2">
                      <div className="text-sm font-medium text-green-700">
                        {projDept.projector_department}
                      </div>
                      <DepartmentRoomsDisplay
                        departmentId={projDept.projector_department_id}
                        departmentName={projDept.projector_department}
                        connections={connections || []}
                        onRemoveConnection={handleRemoveConnection}
                        onLinkRoom={(roomId, roomName) => handleLinkRoom(roomId, roomName, projDept.projector_department_id, projDept.projector_department, true)}
                        linkingRoom={linkingRoom}
                        isProjectorDepartment={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Диалог связывания кабинетов */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Связывание кабинетов</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Информация о выбранном кабинете */}
            {linkingRoom && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">
                      {linkingRoom.isProjectorDepartment ? 'Кабинет проектировщиков' : 'Кабинет Турар'}
                    </div>
                    <div className="text-sm text-blue-700">
                      {linkingRoom.departmentName} - {linkingRoom.roomName}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Выбор целевого отделения */}
            {step === 'department' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Выберите {linkingRoom?.isProjectorDepartment ? 'отделение Турар' : 'отделение проектировщиков'}:
                  </label>
                  <Select value={selectedTargetDeptId} onValueChange={(value) => {
                    setSelectedTargetDeptId(value);
                    setStep('room');
                    setSelectedTargetRoomId('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите отделение..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTargetDepts.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Выбор целевого кабинета */}
            {step === 'room' && selectedTargetDeptId && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Выберите кабинет для связывания:
                  </label>
                  <DepartmentRoomsDisplay
                    departmentId={selectedTargetDeptId}
                    departmentName={availableTargetDepts.find(d => d.id === selectedTargetDeptId)?.name || ''}
                    connections={connections || []}
                    onRemoveConnection={handleRemoveConnection}
                    onLinkRoom={(roomId, roomName) => setSelectedTargetRoomId(roomId)}
                    linkingRoom={linkingRoom}
                    selectedRoomId={selectedTargetRoomId}
                    isProjectorDepartment={!linkingRoom?.isProjectorDepartment}
                  />
                </div>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelLinking}>
                Отмена
              </Button>
              {step === 'room' && selectedTargetRoomId && (
                <Button onClick={createConnection} disabled={createConnectionMutation.isPending}>
                  {createConnectionMutation.isPending ? 'Создание...' : 'Создать связь'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}