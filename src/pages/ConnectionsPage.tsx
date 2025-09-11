import { Navigation } from '@/components/Navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, Building2, Link2 } from 'lucide-react'
import { useDepartmentMappingsWithDetails, useCreateDepartmentMappingById } from '@/hooks/useDepartmentMappingsById'
import { useDepartments } from '@/hooks/useDepartments'
import RoomConnectionsManager from '@/components/RoomConnectionsManager'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export default function ConnectionsPage() {
  const [showMappingDialog, setShowMappingDialog] = useState(false)
  const [selectedTurarDeptId, setSelectedTurarDeptId] = useState('')
  const [selectedProjectorDeptId, setSelectedProjectorDeptId] = useState('')

  const { data: departmentMappings, refetch } = useDepartmentMappingsWithDetails()
  const { data: departments } = useDepartments()
  const createMappingMutation = useCreateDepartmentMappingById()
  const { toast } = useToast()

  const createDepartmentMapping = async () => {
    if (!selectedTurarDeptId || !selectedProjectorDeptId) return

    try {
      await createMappingMutation.mutateAsync({
        turar_department_id: selectedTurarDeptId,
        projector_department_id: selectedProjectorDeptId
      })
      
      toast({
        title: "Связь отделений создана",
        description: "Отделения успешно связаны"
      })
      
      setSelectedTurarDeptId('')
      setSelectedProjectorDeptId('')
      setShowMappingDialog(false)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать связь отделений",
        variant: "destructive"
      })
    }
  }

  // Фильтруем уже связанные отделения
  const linkedTurarIds = departmentMappings?.map(m => m.turar_department_id).filter(Boolean) || []
  const linkedProjectorIds = departmentMappings?.map(m => m.projector_department_id).filter(Boolean) || []
  
  const availableTurarDepts = departments?.filter(dept => !linkedTurarIds.includes(dept.id)) || []
  const availableProjectorDepts = departments?.filter(dept => !linkedProjectorIds.includes(dept.id)) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Управление связями
            </h1>
            <div className="flex gap-2">
              <Button 
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Обновить
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Управление связями между отделениями и кабинетами
          </p>
        </div>

        <Tabs defaultValue="departments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="departments">Этап 1: Связывание отделений</TabsTrigger>
            <TabsTrigger value="rooms">Этап 2: Связывание кабинетов</TabsTrigger>
          </TabsList>

          {/* Этап 1: Связывание отделений */}
          <TabsContent value="departments" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="text-lg font-medium">
                Связанных отделений: {departmentMappings?.length || 0}
              </div>
              <Button onClick={() => setShowMappingDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить связь отделений
              </Button>
            </div>

            {/* Отображение связанных отделений */}
            <div className="space-y-4">
              {departmentMappings?.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Нет связанных отделений</h3>
                    <p className="text-muted-foreground mb-4">
                      Создайте первую связь между отделениями Турар и Проектировщиков
                    </p>
                    <Button onClick={() => setShowMappingDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Создать связь
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                departmentMappings?.map(mapping => (
                  <Card key={mapping.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-5 w-5" />
                          Связь отделений
                        </div>
                        <Badge variant="secondary">Активна</Badge>
                      </CardTitle>
                      <CardDescription>
                        {mapping.turar_department} ↔ {mapping.projector_department}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-blue-600">Отделение Турар</div>
                          <div>{mapping.turar_department}</div>
                          <div className="text-xs text-muted-foreground">ID: {mapping.turar_department_id}</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-600">Отделение Проектировщиков</div>
                          <div>{mapping.projector_department}</div>
                          <div className="text-xs text-muted-foreground">ID: {mapping.projector_department_id}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Этап 2: Связывание кабинетов */}
          <TabsContent value="rooms" className="space-y-6">
            <RoomConnectionsManager />
          </TabsContent>
        </Tabs>

        {/* Диалог создания связи отделений */}
        <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать связь отделений</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Отделение Турар</label>
                <Select value={selectedTurarDeptId} onValueChange={setSelectedTurarDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите отделение Турар" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTurarDepts.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Отделение Проектировщиков</label>
                <Select value={selectedProjectorDeptId} onValueChange={setSelectedProjectorDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите отделение Проектировщиков" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjectorDepts.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowMappingDialog(false)}>
                  Отмена
                </Button>
                <Button 
                  onClick={createDepartmentMapping}
                  disabled={!selectedTurarDeptId || !selectedProjectorDeptId || createMappingMutation.isPending}
                >
                  {createMappingMutation.isPending ? 'Создаем...' : 'Создать связь'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}