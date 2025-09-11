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
  } | null>(null)
  
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [selectedTurarDeptId, setSelectedTurarDeptId] = useState('')
  const [selectedProjectorDeptId, setSelectedProjectorDeptId] = useState('')

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

  // Получаем отделения Турар и Проектор из связанных пар
  const turarDepartmentIds = linkedDepartmentPairs.map(pair => pair.turar_department_id).filter(Boolean)
  const projectorDepartmentIds = linkedDepartmentPairs.map(pair => pair.projector_department_id).filter(Boolean)
  
  const turarDepartments = departments?.filter(dept => turarDepartmentIds.includes(dept.id)) || []
  const projectorDepartments = departments?.filter(dept => projectorDepartmentIds.includes(dept.id)) || []

  const handleLinkRoom = (roomId: string, roomName: string) => {
    if (!linkingRoom) {
      // Начинаем процесс связывания - определяем тип отделения
      const isTurarRoom = turarDepartments.some(dept => dept.id === selectedTurarDeptId)
      const isProjectorRoom = projectorDepartments.some(dept => dept.id === selectedProjectorDeptId)
      
      // Для упрощения пока используем выбранные отделения
      const departmentId = selectedTurarDeptId || selectedProjectorDeptId
      const departmentName = departments?.find(d => d.id === departmentId)?.name || ''
      
      setLinkingRoom({
        departmentId,
        roomId,
        roomName,
        departmentName
      })
      
      toast({
        title: "Выберите кабинет для связывания",
        description: `Выбран: ${departmentName} - ${roomName}. Теперь выберите кабинет для связывания.`
      })
    } else {
      // Завершаем связывание
      createConnection(linkingRoom.roomId, roomId)
    }
  }

  const createConnection = async (turarRoomId: string, projectorRoomId: string) => {
    if (!linkingRoom) return

    // Определяем какой кабинет Турар, а какой Проектор
    const isTurarFirst = turarDepartments.some(dept => dept.id === linkingRoom.departmentId)
    
    const connectionData = {
      turar_department_id: isTurarFirst ? linkingRoom.departmentId : selectedProjectorDeptId,
      turar_room_id: isTurarFirst ? linkingRoom.roomId : projectorRoomId,
      projector_department_id: isTurarFirst ? selectedProjectorDeptId : linkingRoom.departmentId,
      projector_room_id: isTurarFirst ? projectorRoomId : linkingRoom.roomId
    }

    try {
      await createConnectionMutation.mutateAsync(connectionData)
      setLinkingRoom(null)
    } catch (error) {
      console.error('Ошибка создания связи:', error)
    }
  }

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      await deleteConnectionMutation.mutateAsync(connectionId)
    } catch (error) {
      console.error('Ошибка удаления связи:', error)
    }
  }

  const cancelLinking = () => {
    setLinkingRoom(null)
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
            Выберите отделения, затем кабинеты для создания связей
          </p>
        </div>
        
        <div className="flex gap-2">
          {linkingRoom && (
            <Button variant="outline" onClick={cancelLinking}>
              Отменить связывание
            </Button>
          )}
          <Button onClick={() => setShowConnectionDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Настроить отделения
          </Button>
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

      {/* Выбор отделений для просмотра */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Отделения Турар</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTurarDeptId} onValueChange={setSelectedTurarDeptId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите отделение Турар" />
              </SelectTrigger>
              <SelectContent>
                {turarDepartments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Отделения Проектировщиков</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedProjectorDeptId} onValueChange={setSelectedProjectorDeptId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите отделение Проектировщиков" />
              </SelectTrigger>
              <SelectContent>
                {projectorDepartments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Двухколоночный дизайн с аккордионами */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Левая колонка - Отделения Турар */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Building2 className="h-5 w-5" />
              Отделения Турар
            </CardTitle>
            <CardDescription>
              Выберите отделение и кабинет для связывания
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(
                linkedDepartmentPairs.reduce((acc, pair) => {
                  const turarDept = pair.turar_department;
                  if (!acc[turarDept]) {
                    acc[turarDept] = {
                      turar_department_id: pair.turar_department_id!,
                      turar_department: pair.turar_department,
                    };
                  }
                  return acc;
                }, {} as Record<string, {
                  turar_department_id: string;
                  turar_department: string;
                }>)
              ).map(([turarDeptName, group]) => (
                <AccordionItem key={turarDeptName} value={turarDeptName}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="font-medium">{group.turar_department}</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        Турар
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <DepartmentRoomsDisplay
                      departmentId={group.turar_department_id}
                      departmentName={group.turar_department}
                      onLinkRoom={handleLinkRoom}
                      onRemoveConnection={handleRemoveConnection}
                      linkingRoom={linkingRoom}
                      connections={connections}
                      isProjectorDepartment={false}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {linkedDepartmentPairs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Нет связанных отделений Турар
              </div>
            )}
          </CardContent>
        </Card>

        {/* Правая колонка - Отделения Проектировщиков */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Building2 className="h-5 w-5" />
              Отделения Проектировщиков
            </CardTitle>
            <CardDescription>
              Связанные отделения проектировщиков
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {linkedDepartmentPairs.map((pair) => (
                <AccordionItem key={pair.id} value={pair.projector_department}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div>
                        <div className="font-medium">{pair.projector_department}</div>
                        <div className="text-xs text-muted-foreground">
                          Связан с: {pair.turar_department}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Проектировщики
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <DepartmentRoomsDisplay
                      departmentId={pair.projector_department_id!}
                      departmentName={pair.projector_department}
                      onLinkRoom={handleLinkRoom}
                      onRemoveConnection={handleRemoveConnection}
                      linkingRoom={linkingRoom}
                      connections={connections}
                      isProjectorDepartment={true}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {linkedDepartmentPairs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Нет связанных отделений проектировщиков
              </div>
            )}
          </CardContent>
        </Card>
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

      {/* Диалог настройки отделений */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Связанные отделения</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {linkedDepartmentPairs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Нет связанных отделений. Создайте связи на вкладке "Связывание отделений".
              </div>
            ) : (
              <div className="space-y-2">
                {linkedDepartmentPairs.map(mapping => (
                  <div key={mapping.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">{mapping.turar_department}</div>
                      <div className="text-muted-foreground">↔ {mapping.projector_department}</div>
                    </div>
                    <Badge variant="secondary">Связаны</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}