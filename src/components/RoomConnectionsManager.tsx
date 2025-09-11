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
                      onLinkRoom={handleLinkRoom}
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