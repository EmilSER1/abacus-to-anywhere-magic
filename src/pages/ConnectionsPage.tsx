import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, Building2, Link2, Edit, Trash2 } from 'lucide-react'
import { useDepartmentMappingsWithDetails, useCreateDepartmentMappingById, useDeleteDepartmentMappingById, useUpdateDepartmentMappingById } from '@/hooks/useDepartmentMappingsById'
import { useDepartments } from '@/hooks/useDepartments'
import RoomConnectionsManager from '@/components/RoomConnectionsManager'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export default function ConnectionsPage() {
  const [showMappingDialog, setShowMappingDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingMapping, setEditingMapping] = useState<{id: string; turar_department_id: string; projector_department_id: string} | null>(null)
  const [selectedTurarDeptId, setSelectedTurarDeptId] = useState('')
  const [selectedProjectorDeptId, setSelectedProjectorDeptId] = useState('')

  const { data: departmentMappings, refetch } = useDepartmentMappingsWithDetails()
  const { data: departments } = useDepartments()
  const createMappingMutation = useCreateDepartmentMappingById()
  const updateMappingMutation = useUpdateDepartmentMappingById()
  const deleteMappingMutation = useDeleteDepartmentMappingById()
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

  const deleteDepartmentMapping = async (mappingId: string) => {
    try {
      await deleteMappingMutation.mutateAsync(mappingId)
      toast({
        title: "Связь отделений удалена",
        description: "Связь успешно удалена"
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить связь",
        variant: "destructive"
      })
    }
  }

  const editDepartmentMapping = (mapping: {id: string; turar_department_id: string; projector_department_id: string}) => {
    setEditingMapping(mapping)
    setSelectedTurarDeptId(mapping.turar_department_id)
    setSelectedProjectorDeptId(mapping.projector_department_id)
    setShowEditDialog(true)
  }

  const updateDepartmentMapping = async () => {
    if (!editingMapping || !selectedTurarDeptId || !selectedProjectorDeptId) return

    try {
      await updateMappingMutation.mutateAsync({
        mappingId: editingMapping.id,
        turar_department_id: selectedTurarDeptId,
        projector_department_id: selectedProjectorDeptId
      })
      
      toast({
        title: "Связь отделений обновлена",
        description: "Связь успешно изменена"
      })
      
      setSelectedTurarDeptId('')
      setSelectedProjectorDeptId('')
      setEditingMapping(null)
      setShowEditDialog(false)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить связь отделений",
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
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Таблица соединения</h1>
        <p className="text-muted-foreground">Управление связями между кабинетами</p>
      </div>
      <div className="max-w-7xl">
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

            {/* Отображение связанных отделений по группам Турар */}
            <div className="space-y-6">
              {!departmentMappings || departmentMappings.length === 0 ? (
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
                // Группируем по отделениям Турар - добавляем проверку на существование данных
                Object.entries(
                  (departmentMappings || []).reduce((acc, mapping) => {
                    const turarDept = mapping.turar_department;
                    if (!acc[turarDept]) {
                      acc[turarDept] = {
                        turar_department: mapping.turar_department,
                        turar_department_id: mapping.turar_department_id!,
                        projector_departments: []
                      };
                    }
                    acc[turarDept].projector_departments.push({
                      id: mapping.id,
                      name: mapping.projector_department,
                      department_id: mapping.projector_department_id!
                    });
                    return acc;
                  }, {} as Record<string, {
                    turar_department: string;
                    turar_department_id: string;
                    projector_departments: Array<{id: string; name: string; department_id: string}>;
                  }>)
                ).map(([turarDeptName, group]) => (
                  <Card key={turarDeptName} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          <span className="text-blue-700">{group.turar_department}</span>
                        </div>
                        <Badge variant="secondary" className="text-blue-600">
                          {group.projector_departments.length} связей
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Отделение Турар связано с {group.projector_departments.length} отделением(ями) проектировщиков
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Блок Турар */}
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-700 mb-2">Отделение Турар</h4>
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            {group.turar_department}
                          </Badge>
                        </div>
                        
                        {/* Блок связанных отделений Проектировщиков */}
                        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-green-700">Связанные отделения Проектировщиков</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Удалить все связи этого отделения Турар?')) {
                                  group.projector_departments.forEach(projDept => {
                                    deleteDepartmentMapping(projDept.id);
                                  });
                                }
                              }}
                              className="text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {group.projector_departments.map((projDept) => (
                              <div key={projDept.id} className="flex items-center justify-between bg-white dark:bg-background p-2 rounded border">
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  {projDept.name}
                                </Badge>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => editDepartmentMapping({
                                      id: projDept.id,
                                      turar_department_id: group.turar_department_id,
                                      projector_department_id: projDept.department_id
                                    })}
                                    className="text-blue-600 hover:bg-blue-100"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      if (confirm(`Удалить связь с отделением "${projDept.name}"?`)) {
                                        deleteDepartmentMapping(projDept.id);
                                      }
                                    }}
                                    className="text-red-600 hover:bg-red-100"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
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

        {/* Диалог редактирования связи отделений */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать связь отделений</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Отделение Турар</label>
                <Select value={selectedTurarDeptId} onValueChange={setSelectedTurarDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите отделение Турар" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.filter(dept => dept.name.includes('Турар') || !dept.name.includes('Проектировщики')).map(dept => (
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
                    {departments?.filter(dept => dept.name.includes('Проектировщики') || (!dept.name.includes('Турар') && !linkedProjectorIds.includes(dept.id))).map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowEditDialog(false)
                  setEditingMapping(null)
                  setSelectedTurarDeptId('')
                  setSelectedProjectorDeptId('')
                }}>
                  Отмена
                </Button>
                <Button 
                  onClick={updateDepartmentMapping}
                  disabled={!selectedTurarDeptId || !selectedProjectorDeptId || updateMappingMutation.isPending}
                >
                  {updateMappingMutation.isPending ? 'Обновляем...' : 'Обновить связь'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}