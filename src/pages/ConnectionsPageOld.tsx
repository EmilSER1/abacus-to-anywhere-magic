import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, ChevronDown, ChevronRight, Link2, X, Plus, Trash2, Building2, Home, Wrench, RefreshCw, Users, ArrowLeft, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/Navigation'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useRoomConnections, useCreateRoomConnection, useDeleteRoomConnection } from '@/hooks/useRoomConnections'
import { useDepartmentMappings, useCreateDepartmentMapping, useDeleteDepartmentMapping, useGetAllDepartments } from '@/hooks/useDepartmentMappings'
import { useDepartmentMappingsWithDetails } from '@/hooks/useDepartmentMappingsById'
import RoomConnectionsManager from '@/components/RoomConnectionsManager'
import { usePopulateMappedDepartments } from '@/hooks/useMappedDepartments'
import { useBulkPopulateMappedDepartments } from '@/hooks/useBulkPopulateMappedDepartments'
import TurarDepartmentDisplay from '@/components/TurarDepartmentDisplay'
import ProjectorDepartmentDisplay from '@/components/ProjectorDepartmentDisplay'
import MappedTurarDepartmentDisplay from '@/components/MappedTurarDepartmentDisplay'
import MappedProjectorDepartmentDisplay from '@/components/MappedProjectorDepartmentDisplay'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

export default function ConnectionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [linkingRoom, setLinkingRoom] = useState<{
    turarDept: string
    turarRoom: string
    projectorDept: string
  } | null>(null)
  
  // Состояния для многоуровневой навигации связывания
  const [linkingStep, setLinkingStep] = useState<'none' | 'departments' | 'rooms'>('none')
  const [selectedLinkingDept, setSelectedLinkingDept] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  
  // Состояние для первого этапа
  const [selectedTurarDept, setSelectedTurarDept] = useState('')
  const [selectedProjectorDepts, setSelectedProjectorDepts] = useState<string[]>([])
  const [showMappingDialog, setShowMappingDialog] = useState(false)
  
  const { data: roomConnections } = useRoomConnections()
  const { data: departmentMappings } = useDepartmentMappings()
  const { data: allDepartments } = useGetAllDepartments()
  const createRoomConnectionMutation = useCreateRoomConnection()
  const deleteRoomConnectionMutation = useDeleteRoomConnection()
  const createDepartmentMappingMutation = useCreateDepartmentMapping()
  const deleteDepartmentMappingMutation = useDeleteDepartmentMapping()
  const populateMappedDepartmentsMutation = usePopulateMappedDepartments()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Добавляем хук для bulk populate
  const bulkPopulateMutation = useBulkPopulateMappedDepartments()

  // Функция для принудительного обновления данных
  const refreshAllData = () => {
    queryClient.invalidateQueries({ queryKey: ["projector-rooms-equipment"] })
    queryClient.invalidateQueries({ queryKey: ["turar-rooms-equipment"] })
    queryClient.invalidateQueries({ queryKey: ["room-connections"] })
    queryClient.invalidateQueries({ queryKey: ["department-mappings"] })
    queryClient.invalidateQueries({ queryKey: ["all-departments"] })
    toast({
      title: "Данные обновляются",
      description: "Пожалуйста, подождите..."
    })
  }

  // Загрузка данных из Supabase
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // Заполняем промежуточные таблицы при загрузке страницы
        if (departmentMappings && departmentMappings.length > 0) {
          await bulkPopulateMutation.mutateAsync();
        }
      } catch (error) {
        console.error('Ошибка инициализации данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (allDepartments) {
      initializeData();
    }
  }, [allDepartments, departmentMappings])

  // Функции для управления связями отделений
  const createDepartmentMapping = async () => {
    if (!selectedTurarDept || selectedProjectorDepts.length === 0) return

    try {
      for (const projectorDept of selectedProjectorDepts) {
        // Создаем сопоставление отделений
        const newMapping = await createDepartmentMappingMutation.mutateAsync({
          turar_department: selectedTurarDept,
          projector_department: projectorDept
        })
        
        // Заполняем промежуточные таблицы данными
        await populateMappedDepartmentsMutation.mutateAsync({
          departmentMappingId: newMapping.id,
          projectorDepartment: projectorDept,
          turarDepartment: selectedTurarDept
        })
      }
      
      toast({
        title: "Связи отделений созданы",
        description: `${selectedTurarDept} связан с ${selectedProjectorDepts.length} отделением(ями) и данные скопированы`,
      })
      
      setSelectedTurarDept('')
      setSelectedProjectorDepts([])
      setShowMappingDialog(false)
    } catch (error) {
      console.error('Ошибка создания связи отделений:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать связи отделений",
        variant: "destructive"
      })
    }
  }

  const removeDepartmentMapping = async (mappingId: string) => {
    try {
      await deleteDepartmentMappingMutation.mutateAsync(mappingId)
      toast({
        title: "Связь отделений удалена",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить связь",
        variant: "destructive"
      })
    }
  }

  // Функции для управления связями кабинетов
  const createConnection = async (turarDepartment: string, turarRoom: string, projectorDepartment: string, projectorRoom: string) => {
    // Используем промежуточные таблицы для быстрого поиска по материнским ID
    const getTurarRoomId = async () => {
      // Сначала ищем в промежуточной таблице по названию
      const { data: mappedData } = await supabase
        .from('mapped_turar_rooms')
        .select('original_record_id')
        .eq('department_name', turarDepartment)
        .eq('room_name', turarRoom)
        .limit(1)
        .single();
      
      if (mappedData?.original_record_id) {
        return mappedData.original_record_id;
      }
      
      // Если не найдено в промежуточной, ищем в основной
      const { data } = await supabase
        .from('turar_medical')
        .select('id')
        .eq('Отделение/Блок', turarDepartment)
        .eq('Помещение/Кабинет', turarRoom)
        .limit(1)
        .single();
      return data?.id || null;
    };

    const getProjectorRoomId = async () => {
      // Сначала ищем в промежуточной таблице по названию
      const { data: mappedData } = await supabase
        .from('mapped_projector_rooms')
        .select('original_record_id')
        .eq('department_name', projectorDepartment)
        .eq('room_name', projectorRoom)
        .limit(1)
        .single();
      
      if (mappedData?.original_record_id) {
        return mappedData.original_record_id;
      }
      
      // Если не найдено в промежуточной, ищем в основной
      const { data } = await supabase
        .from('projector_floors')
        .select('id')
        .eq('ОТДЕЛЕНИЕ', projectorDepartment)
        .eq('НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ', projectorRoom)
        .limit(1)
        .single();
      return data?.id || null;
    };

    try {
      const [turarRoomId, projectorRoomId] = await Promise.all([
        getTurarRoomId(),
        getProjectorRoomId()
      ]);

      const connectionData = {
        turar_department: turarDepartment,
        turar_room: turarRoom,
        projector_department: projectorDepartment,
        projector_room: projectorRoom,
        turar_room_id: turarRoomId,
        projector_room_id: projectorRoomId
      };

      await createRoomConnectionMutation.mutateAsync(connectionData);
      
      // Обновляем статус связи в промежуточных таблицах
      if (turarRoomId) {
        await supabase
          .from('mapped_turar_rooms')
          .update({ 
            is_linked: true, 
            linked_projector_room_id: projectorRoomId 
          })
          .eq('original_record_id', turarRoomId);
      }
      
      if (projectorRoomId) {
        await supabase
          .from('mapped_projector_rooms')
          .update({ 
            is_linked: true, 
            linked_turar_room_id: turarRoomId 
          })
          .eq('original_record_id', projectorRoomId);
      }
      
      toast({
        title: "Связь создана",
        description: `${turarDepartment} (${turarRoom}) ↔ ${projectorDepartment} (${projectorRoom})`,
      });
      
      setLinkingRoom(null);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать связь",
        variant: "destructive"
      });
    }
  };

  const removeConnection = async (turarDepartment: string, turarRoom: string, projectorDepartment: string, projectorRoom: string) => {
    const connection = roomConnections?.find(conn => 
      conn.turar_department === turarDepartment && 
      conn.turar_room === turarRoom && 
      conn.projector_department === projectorDepartment && 
      conn.projector_room === projectorRoom
    );
    
    if (connection) {
      try {
        await deleteRoomConnectionMutation.mutateAsync(connection.id);
        
        toast({
          title: "Связь удалена",
          description: `${turarDepartment} (${turarRoom}) ↔ ${projectorDepartment} (${projectorRoom})`,
        });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить связь",
          variant: "destructive"
        });
      }
    }
  };

  // Получаем связанные отделения для отображения
  const getMappedDepartments = () => {
    const mapped = new Map<string, string[]>()
    
    departmentMappings?.forEach(mapping => {
      if (!mapped.has(mapping.turar_department)) {
        mapped.set(mapping.turar_department, [])
      }
      mapped.get(mapping.turar_department)!.push(mapping.projector_department)
    })
    
    return mapped
  }

  if (isLoading || !allDepartments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center">
            <div>Загрузка данных...</div>
            {allDepartments && (
              <div className="mt-2 text-sm text-muted-foreground">
                Турар: {allDepartments.turarDepartments?.length || 0} отделений, 
                Проектировщики: {allDepartments.projectorDepartments?.length || 0} отделений
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const mappedDepartments = getMappedDepartments()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Связи между отделениями
            </h1>
            <div className="flex gap-2">
              <Button 
                onClick={refreshAllData}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Обновить данные
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkPopulateMutation.mutate()}
                disabled={bulkPopulateMutation.isPending}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${bulkPopulateMutation.isPending ? 'animate-spin' : ''}`} />
                {bulkPopulateMutation.isPending ? 'Заполняем...' : 'Заполнить промежуточные'}
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Двухэтапный процесс создания связей: сначала отделения, затем кабинеты
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

            {/* Отладочная информация */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm">
              <div>Отделений Турар: {allDepartments?.turarDepartments?.length || 0} (ожидается 22)</div>
              <div>Отделений Проектировщиков: {allDepartments?.projectorDepartments?.length || 0} (ожидается 29)</div>
              <div>Состояние загрузки: {isLoading ? 'загружается' : 'готово'}</div>
              <div className="text-xs text-red-600">
                Если видите не все отделения - нажмите "Обновить данные"
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
                className="mt-2"
              >
                Обновить данные
              </Button>
            </div>

            {/* Отображение связанных отделений */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Отделения Турар */}
              <Card>
                <CardHeader>
                  <CardTitle>Отделения Турар</CardTitle>
                </CardHeader>
                <CardContent>
                  {allDepartments?.turarDepartments.map(dept => {
                    const connectedProjs = mappedDepartments.get(dept) || []
                    return (
                      <div key={dept} className="p-3 border rounded-lg mb-2">
                        <div className="font-medium">{dept}</div>
                        {connectedProjs.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-sm text-muted-foreground">Связан с:</div>
                            {connectedProjs.map(projDept => {
                              const mapping = departmentMappings?.find(m => 
                                m.turar_department === dept && m.projector_department === projDept
                              )
                              return (
                                <div key={projDept} className="flex items-center justify-between bg-muted/50 p-2 rounded text-sm">
                                  <span>{projDept}</span>
                                  {mapping && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="hover:bg-red-100 hover:text-red-600"
                                      onClick={() => {
                                        if (confirm('Удалить связь отделений?')) {
                                          removeDepartmentMapping(mapping.id)
                                        }
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Отделения Проектировщиков */}
              <Card>
                <CardHeader>
                  <CardTitle>Отделения Проектировщиков</CardTitle>
                </CardHeader>
                <CardContent>
                  {allDepartments?.projectorDepartments.map(dept => {
                    // Находим, к каким турар отделениям привязано это отделение проектировщиков
                    const connectedTurar = departmentMappings?.filter(m => m.projector_department === dept)
                      .map(m => m.turar_department) || []
                    
                    return (
                      <div key={dept} className="p-3 border rounded-lg mb-2">
                        <div className="font-medium">{dept}</div>
                        {connectedTurar.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-sm text-muted-foreground">Связан с Турар:</div>
                            {connectedTurar.map(turarDept => (
                              <div key={turarDept} className="bg-muted/50 p-2 rounded text-sm">
                                {turarDept}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
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
              <DialogDescription>
                Выберите отделение Турар и связанные с ним отделения Проектировщиков
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Отделение Турар</label>
                <Select value={selectedTurarDept} onValueChange={setSelectedTurarDept}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите отделение Турар" />
                  </SelectTrigger>
                  <SelectContent>
                    {allDepartments?.turarDepartments
                      .filter(dept => !mappedDepartments.has(dept))
                      .map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Отделения Проектировщиков</label>
                <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                  {allDepartments?.projectorDepartments.map(dept => (
                    <div key={dept} className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id={dept}
                        checked={selectedProjectorDepts.includes(dept)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjectorDepts([...selectedProjectorDepts, dept])
                          } else {
                            setSelectedProjectorDepts(selectedProjectorDepts.filter(d => d !== dept))
                          }
                        }}
                      />
                      <label htmlFor={dept} className="text-sm cursor-pointer flex-1">{dept}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowMappingDialog(false)}>
                  Отмена
                </Button>
                <Button 
                  onClick={createDepartmentMapping}
                  disabled={!selectedTurarDept || selectedProjectorDepts.length === 0}
                >
                  Создать связи
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Индикатор режима связывания */}
        {linkingStep !== 'none' && linkingRoom && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              <span className="text-sm">
                {linkingStep === 'departments' ? 'Выберите отделение' : 'Выберите кабинет'}: {linkingRoom.turarDept} → {linkingRoom.turarRoom}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setLinkingStep('none')
                  setLinkingRoom(null)
                  setSelectedLinkingDept('')
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}