import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, ChevronDown, ChevronRight, Link2, X, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/Navigation'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRoomConnections, useCreateRoomConnection, useDeleteRoomConnection } from '@/hooks/useRoomConnections'
import { useDepartmentMappings, useCreateDepartmentMapping, useDeleteDepartmentMapping, useGetAllDepartments } from '@/hooks/useDepartmentMappings'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Типы данных
interface ProjectorRoom {
  floor: number
  block: string
  department: string
  roomCode: string
  roomName: string
  area: number
  equipmentCode: string | null
  equipmentName: string | null
  unit: string | null
  quantity: number | null
  notes: string | null
}

interface TurarEquipment {
  department: string
  room: string
  equipmentCode: string
  equipmentName: string
  quantity: number
}

interface Room {
  name: string
  equipment: Equipment[]
}

interface Equipment {
  code?: string
  name: string
  quantity: number
  unit?: string
}

interface Department {
  name: string
  rooms: Room[]
}

export default function ConnectionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set())
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [projectorData, setProjectorData] = useState<ProjectorRoom[]>([])
  const [turarData, setTurarData] = useState<TurarEquipment[]>([])
  const [linkingRoom, setLinkingRoom] = useState<{
    turarDept: string
    turarRoom: string
    projectorDept: string
  } | null>(null)
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
  const { toast } = useToast()

  // Загрузка данных из Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Загружаем данные Турар
        const { data: turarRaw, error: turarError } = await supabase
          .from('turar_medical')
          .select('*')
        
        // Загружаем данные Проектировщиков  
        const { data: projectorRaw, error: projectorError } = await supabase
          .from('projector_floors')
          .select('*')
        
        if (turarError) {
          console.error('Error loading turar data:', turarError)
        } else if (turarRaw) {
          const turarProcessed = turarRaw.map((item: any) => ({
            department: item["Отделение/Блок"],
            room: item["Помещение/Кабинет"],
            equipmentCode: item["Код оборудования"],
            equipmentName: item["Наименование"],
            quantity: item["Кол-во"]
          }))
          setTurarData(turarProcessed)
          console.log('Турар данные загружены:', turarProcessed.length)
        }
        
        if (projectorError) {
          console.error('Error loading projector data:', projectorError)
        } else if (projectorRaw) {
          const projectorProcessed = projectorRaw.map((item: any) => ({
            floor: item["ЭТАЖ"],
            block: item["БЛОК"],
            department: item["ОТДЕЛЕНИЕ"]?.trim(),
            roomCode: item["КОД ПОМЕЩЕНИЯ"],
            roomName: item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"],
            area: item["Площадь (м2)"],
            equipmentCode: item["Код оборудования"],
            equipmentName: item["Наименование оборудования"],
            unit: item["Ед. изм."],
            quantity: item["Кол-во"] ? parseInt(item["Кол-во"]) : 0,
            notes: item["Примечания"]
          }))
          setProjectorData(projectorProcessed)
          console.log('Проектировщики данные загружены:', projectorProcessed.length)
        }
        
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Получение структурированных данных для отделений проектировщиков
  const getProjectorDepartments = (turarDept: string): Department[] => {
    // Получаем связанные отделения проектировщиков из базы данных
    const linkedDepartments = departmentMappings?.filter(m => m.turar_department === turarDept)
      .map(m => m.projector_department) || []
    
    return linkedDepartments.map(deptName => {
      const deptItems = projectorData.filter(item => 
        item.department && item.department.trim() === deptName.trim()
      )
      
      const roomsMap = new Map<string, Room>()
      
      deptItems.forEach(item => {
        const roomName = item.roomName
        if (!roomName) return
        
        if (!roomsMap.has(roomName)) {
          roomsMap.set(roomName, {
            name: roomName,
            equipment: []
          })
        }
        
        if (item.equipmentName?.trim()) {
          roomsMap.get(roomName)!.equipment.push({
            code: item.equipmentCode || undefined,
            name: item.equipmentName,
            quantity: item.quantity || 0,
            unit: item.unit || undefined
          })
        }
      })
      
      return {
        name: deptName,
        rooms: Array.from(roomsMap.values())
      }
    })
  }

  // Получение структурированных данных для отделения Турар
  const getTurarDepartment = (deptName: string): Department | null => {
    const deptItems = turarData.filter(item => 
      item.department && item.department.trim() === deptName.trim()
    )
    
    if (deptItems.length === 0) return null
    
    const roomsMap = new Map<string, Room>()
    
    deptItems.forEach(item => {
      const roomName = item.room
      if (!roomName) return
      
      if (!roomsMap.has(roomName)) {
        roomsMap.set(roomName, {
          name: roomName,
          equipment: []
        })
      }
      
      if (item.equipmentName?.trim()) {
        roomsMap.get(roomName)!.equipment.push({
          code: item.equipmentCode || undefined,
          name: item.equipmentName,
          quantity: item.quantity || 0
        })
      }
    })
    
    return {
      name: deptName,
      rooms: Array.from(roomsMap.values())
    }
  }

  // Функции для управления связями отделений
  const createDepartmentMapping = async () => {
    if (!selectedTurarDept || selectedProjectorDepts.length === 0) return

    try {
      for (const projectorDept of selectedProjectorDepts) {
        await createDepartmentMappingMutation.mutateAsync({
          turar_department: selectedTurarDept,
          projector_department: projectorDept
        })
      }
      
      toast({
        title: "Связи отделений созданы",
        description: `${selectedTurarDept} связан с ${selectedProjectorDepts.length} отделением(ями)`,
      })
      
      setSelectedTurarDept('')
      setSelectedProjectorDepts([])
      setShowMappingDialog(false)
    } catch (error) {
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

  // Функции для управления связями кабинетов (существующий функционал)
  const getConnectedRooms = (turarDepartment: string, turarRoom: string) => {
    return roomConnections?.filter(conn => 
      conn.turar_department === turarDepartment && conn.turar_room === turarRoom
    ) || [];
  };

  const getConnectedToProjectorRoom = (projectorDepartment: string, projectorRoom: string) => {
    return roomConnections?.filter(conn => 
      conn.projector_department === projectorDepartment && conn.projector_room === projectorRoom
    ) || [];
  };

  const createConnection = async (turarDepartment: string, turarRoom: string, projectorDepartment: string, projectorRoom: string) => {
    const connectionData = {
      turar_department: turarDepartment,
      turar_room: turarRoom,
      projector_department: projectorDepartment,
      projector_room: projectorRoom
    };

    try {
      await createRoomConnectionMutation.mutateAsync(connectionData);
      
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
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Связи между отделениями
          </h1>
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
                                      onClick={() => removeDepartmentMapping(mapping.id)}
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
                    const isConnected = departmentMappings?.some(m => m.projector_department === dept)
                    return (
                      <div key={dept} className={`p-3 border rounded-lg mb-2 ${isConnected ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                        <div className="font-medium">{dept}</div>
                        {isConnected && (
                          <Badge className="mt-1 bg-green-100 text-green-800">Связано</Badge>
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
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <Input
                placeholder="Поиск по отделениям..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Всего связей кабинетов: {roomConnections?.length || 0}</span>
              </div>
            </div>

            {/* Список связанных отделений для работы с кабинетами */}
            <div className="space-y-4">
              {Array.from(mappedDepartments.entries())
                .filter(([turarDept]) => 
                  turarDept.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(([turarDept, projectorDepts]) => {
                  const projectorDepartments = getProjectorDepartments(turarDept)
                  const turarDepartment = getTurarDepartment(turarDept)
                  const isExpanded = expandedDepartments.has(turarDept)

                  return (
                    <Card key={turarDept} className="bg-card/50 backdrop-blur border-border/50">
                      <CardHeader 
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => {
                          if (isExpanded) {
                            expandedDepartments.delete(turarDept)
                          } else {
                            expandedDepartments.add(turarDept)
                          }
                          setExpandedDepartments(new Set(expandedDepartments))
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            <div>
                              <CardTitle className="text-lg">{turarDept}</CardTitle>
                              <CardDescription>
                                {projectorDepts.length} связанных отделения проектировщиков
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {turarDepartment?.rooms.length || 0} кабинетов Турар • {projectorDepartments.reduce((sum, dept) => sum + dept.rooms.length, 0)} кабинетов Проектировщиков
                          </Badge>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Turar Department */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-primary">Турар</h3>
                              {turarDepartment ? (
                                <div className="space-y-2">
                                  {turarDepartment.rooms.map((room, roomIndex) => {
                                    const roomKey = `turar-${turarDept}-${room.name}`
                                    const isRoomExpanded = expandedRooms.has(roomKey)
                                    const connections = getConnectedRooms(turarDept, room.name)

                                    return (
                                      <div key={roomIndex} className="border rounded-lg p-3">
                                        <div 
                                          className="flex items-center justify-between cursor-pointer"
                                          onClick={() => {
                                            if (isRoomExpanded) {
                                              expandedRooms.delete(roomKey)
                                            } else {
                                              expandedRooms.add(roomKey)
                                            }
                                            setExpandedRooms(new Set(expandedRooms))
                                          }}
                                        >
                                          <div className="flex items-center gap-2">
                                            {isRoomExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            <span className="font-medium">{room.name}</span>
                                            {connections.length > 0 && (
                                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                <Link2 className="h-3 w-3 mr-1" />
                                                {connections.length}
                                              </Badge>
                                            )}
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setLinkingRoom({
                                                turarDept: turarDept,
                                                turarRoom: room.name,
                                                projectorDept: ''
                                              })
                                            }}
                                          >
                                            <Link2 className="h-3 w-3 mr-1" />
                                            Связать
                                          </Button>
                                        </div>
                                        
                                        {isRoomExpanded && (
                                          <div className="mt-3 space-y-2">
                                            <div className="text-sm text-muted-foreground">
                                              Оборудование: {room.equipment.length} ед.
                                            </div>
                                            {room.equipment.map((equipment, eqIndex) => (
                                              <div key={eqIndex} className="bg-muted/50 p-2 rounded text-sm">
                                                <div className="font-medium">{equipment.name}</div>
                                                <div className="text-muted-foreground">
                                                  {equipment.code && `Код: ${equipment.code} • `}
                                                  Количество: {equipment.quantity}
                                                </div>
                                              </div>
                                            ))}
                                            {connections.map((conn, connIndex) => (
                                              <div key={connIndex} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                                <span className="text-sm">→ {conn.projector_department} ({conn.projector_room})</span>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => removeConnection(
                                                    conn.turar_department,
                                                    conn.turar_room,
                                                    conn.projector_department,
                                                    conn.projector_room
                                                  )}
                                                >
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div className="text-muted-foreground">Данные не найдены</div>
                              )}
                            </div>

                            {/* Projector Departments */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-primary">Проектировщики</h3>
                              {projectorDepartments.map((dept, deptIndex) => (
                                <div key={deptIndex} className="space-y-2">
                                  <h4 className="font-medium text-sm">{dept.name}</h4>
                                  {dept.rooms.map((room, roomIndex) => {
                                    const roomKey = `projector-${dept.name}-${room.name}`
                                    const isRoomExpanded = expandedRooms.has(roomKey)
                                    const connections = getConnectedToProjectorRoom(dept.name, room.name)

                                    return (
                                      <div key={roomIndex} className="border rounded-lg p-3">
                                        <div 
                                          className="flex items-center justify-between cursor-pointer"
                                          onClick={() => {
                                            if (isRoomExpanded) {
                                              expandedRooms.delete(roomKey)
                                            } else {
                                              expandedRooms.add(roomKey)
                                            }
                                            setExpandedRooms(new Set(expandedRooms))
                                          }}
                                        >
                                          <div className="flex items-center gap-2">
                                            {isRoomExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            <span className="font-medium">{room.name}</span>
                                            {connections.length > 0 && (
                                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                <Link2 className="h-3 w-3 mr-1" />
                                                {connections.length}
                                              </Badge>
                                            )}
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setLinkingRoom({
                                                turarDept: turarDept,
                                                turarRoom: room.name,
                                                projectorDept: dept.name
                                              })
                                            }}
                                          >
                                            <Link2 className="h-3 w-3 mr-1" />
                                            Связать
                                          </Button>
                                        </div>
                                        
                                        {isRoomExpanded && (
                                          <div className="mt-3 space-y-2">
                                            <div className="text-sm text-muted-foreground">
                                              Оборудование: {room.equipment.length} ед.
                                            </div>
                                            {room.equipment.map((equipment, eqIndex) => (
                                              <div key={eqIndex} className="bg-muted/50 p-2 rounded text-sm">
                                                <div className="font-medium">{equipment.name}</div>
                                                <div className="text-muted-foreground">
                                                  {equipment.code && `Код: ${equipment.code} • `}
                                                  Количество: {equipment.quantity}
                                                  {equipment.unit && ` ${equipment.unit}`}
                                                </div>
                                              </div>
                                            ))}
                                            {connections.map((conn, connIndex) => (
                                              <div key={connIndex} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                                <span className="text-sm">← {conn.turar_department} ({conn.turar_room})</span>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => removeConnection(
                                                    conn.turar_department,
                                                    conn.turar_room,
                                                    conn.projector_department,
                                                    conn.projector_room
                                                  )}
                                                >
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog для создания связи отделений */}
        <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать связь отделений</DialogTitle>
              <DialogDescription>
                Выберите отделение Турар и соответствующие отделения Проектировщиков
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Отделение Турар:</label>
                <Select value={selectedTurarDept} onValueChange={setSelectedTurarDept}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите отделение Турар" />
                  </SelectTrigger>
                  <SelectContent>
                    {allDepartments?.turarDepartments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Отделения Проектировщиков:</label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {allDepartments?.projectorDepartments.map(dept => (
                    <label key={dept} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedProjectorDepts.includes(dept)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjectorDepts([...selectedProjectorDepts, dept])
                          } else {
                            setSelectedProjectorDepts(selectedProjectorDepts.filter(d => d !== dept))
                          }
                        }}
                      />
                      <span className="text-sm">{dept}</span>
                    </label>
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

        {/* Dialog для связывания кабинетов */}
        {linkingRoom && (
          <Dialog open={!!linkingRoom} onOpenChange={() => setLinkingRoom(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать связь кабинетов</DialogTitle>
                <DialogDescription>
                  Связать кабинет {linkingRoom.turarRoom} из отделения {linkingRoom.turarDept}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Выберите отделение проектировщиков:</label>
                  <Select 
                    value={linkingRoom.projectorDept} 
                    onValueChange={(value) => setLinkingRoom(prev => prev ? {...prev, projectorDept: value} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите отделение" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentMappings
                        ?.filter(m => m.turar_department === linkingRoom.turarDept)
                        .map(m => m.projector_department)
                        .map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {linkingRoom.projectorDept && (
                  <div>
                    <label className="text-sm font-medium">Выберите помещение:</label>
                    <div className="space-y-2 mt-2">
                      {getProjectorDepartments(linkingRoom.turarDept)
                        .find(d => d.name === linkingRoom.projectorDept)
                        ?.rooms.map(room => (
                          <Button
                            key={room.name}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              createConnection(
                                linkingRoom.turarDept,
                                linkingRoom.turarRoom,
                                linkingRoom.projectorDept,
                                room.name
                              )
                            }}
                          >
                            {room.name}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}