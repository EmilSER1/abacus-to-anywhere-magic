import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Link2 } from 'lucide-react'
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

  // Фильтруем отделения по типу (предполагаем что есть какая-то логика определения типа)
  // Пока используем простую логику - первые отделения как Турар, остальные как Проектор
  const turarDepartments = departments?.slice(0, Math.floor((departments.length || 0) / 2)) || []
  const projectorDepartments = departments?.slice(Math.floor((departments.length || 0) / 2)) || []

  // Получаем связанные отделения
  const linkedDepartmentPairs = departmentMappings?.filter(mapping => 
    mapping.turar_department_id && mapping.projector_department_id
  ) || []

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

      {/* Отображение кабинетов выбранных отделений */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedTurarDeptId && (
          <DepartmentRoomsDisplay
            departmentId={selectedTurarDeptId}
            departmentName={departments?.find(d => d.id === selectedTurarDeptId)?.name || ''}
            onLinkRoom={handleLinkRoom}
            onRemoveConnection={handleRemoveConnection}
            linkingRoom={linkingRoom}
            connections={connections}
            isProjectorDepartment={false}
          />
        )}

        {selectedProjectorDeptId && (
          <DepartmentRoomsDisplay
            departmentId={selectedProjectorDeptId}
            departmentName={departments?.find(d => d.id === selectedProjectorDeptId)?.name || ''}
            onLinkRoom={handleLinkRoom}
            onRemoveConnection={handleRemoveConnection}
            linkingRoom={linkingRoom}
            connections={connections}
            isProjectorDepartment={true}
          />
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