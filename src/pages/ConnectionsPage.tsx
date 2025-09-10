import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Link as LinkIcon, Download, Filter, ArrowRight, ChevronDown, ChevronRight, Edit, Link2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/Navigation'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRoomConnections, useCreateRoomConnection, useDeleteRoomConnection } from '@/hooks/useRoomConnections'
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

// Интерфейс для соответствий отделений
interface DepartmentMapping {
  id: string
  turarDepartment: string
  projectorsDepartments: string[]
  status: 'mapped' | 'partial' | 'unmapped'
}

// Интерфейс для редактируемых названий
interface EditableNames {
  departments: { [key: string]: string }
  rooms: { [key: string]: string }
}

// Данные соответствий отделений
const departmentMappings: DepartmentMapping[] = [
  {
    id: '1',
    turarDepartment: 'Диагностические подразделения/лабораторный блок',
    projectorsDepartments: ['Экспресс-лаборатория'],
    status: 'mapped'
  },
  {
    id: '2',
    turarDepartment: 'Дневной стационар (30 коек)',
    projectorsDepartments: [
      'Дневной стационар терапевтический профиль (12 коек)',
      'Дневной стационар хирургический профиль (18 коек)'
    ],
    status: 'mapped'
  },
  {
    id: '3',
    turarDepartment: 'КДЦ. Кабинеты врачебного приема',
    projectorsDepartments: ['Консультативно-диагностическое отделение на 150 посещений'],
    status: 'mapped'
  },
  {
    id: '4',
    turarDepartment: 'Отделение гинекологии (25 коек)',
    projectorsDepartments: ['Отделение гинекологии (25 коек)'],
    status: 'mapped'
  },
  {
    id: '5',
    turarDepartment: 'Отделение диагностики',
    projectorsDepartments: ['Отделение лучевой диагностики'],
    status: 'mapped'
  },
  {
    id: '6',
    turarDepartment: 'Отделение диализа',
    projectorsDepartments: ['Отделение гемодиализа на 4 койки'],
    status: 'mapped'
  },
  {
    id: '7',
    turarDepartment: 'Отделение лучевой диагностики',
    projectorsDepartments: ['Отделение ударно-волновой литотрипсии'],
    status: 'mapped'
  },
  {
    id: '8',
    turarDepartment: 'Отделение нейрохирургии (20 коек)',
    projectorsDepartments: ['Отделение нейрохирургии на 20 коек'],
    status: 'mapped'
  },
  {
    id: '9',
    turarDepartment: 'Отделение травматологии (20 коек)',
    projectorsDepartments: ['Отделение травматологии на 20 коек'],
    status: 'mapped'
  },
  {
    id: '10',
    turarDepartment: 'Приемное отделение',
    projectorsDepartments: [
      'Экстренное приемное отделение',
      'Приемное отделение (Экстренное)',
      'Плановое приемное отделение',
      'Отделение эндоскопии',
      'Операционная Ангиограф (Лаборатория катетеризации)',
      'Экстренные операционные (Приемное отделение)',
      'Операционное отделение (5 операционных)',
      'Отделение реанимации, хирургический профиль на 12 коек',
      'Отделение реанимации терапевтический профиль на 6 коек'
    ],
    status: 'mapped'
  },
  {
    id: '11',
    turarDepartment: 'Травмпункт',
    projectorsDepartments: ['Травматологический пункт'],
    status: 'mapped'
  },
  {
    id: '12',
    turarDepartment: 'Хирургический блок',
    projectorsDepartments: ['Операционное отделение (1 операционная гнойная)'],
    status: 'mapped'
  }
]

// Отделения без сопоставления
const unmappedDepartments = [
  'Слив',
  'Общециркуляционная зона',
  'Конференц-зал на 200 мест',
  'Помещения общеклинического персонала',
  'Зона складских помещений',
  'Отделение трансфузиологии (хранение крови)'
]

export default function ConnectionsPage() {
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set())
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [projectorData, setProjectorData] = useState<ProjectorRoom[]>([])
  const [turarData, setTurarData] = useState<TurarEquipment[]>([])
  const [editableNames, setEditableNames] = useState<EditableNames>({ departments: {}, rooms: {} })
  const [editingField, setEditingField] = useState<string | null>(null)
  const [linkingRoom, setLinkingRoom] = useState<{
    turarDept: string
    turarRoom: string
    projectorDept: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { data: roomConnections } = useRoomConnections()
  const createRoomConnectionMutation = useCreateRoomConnection()
  const deleteRoomConnectionMutation = useDeleteRoomConnection()
  const { toast } = useToast()

  // Загрузка данных напрямую из Supabase
  useEffect(() => {
    const loadTurarData = async () => {
      try {
        const { data, error } = await supabase
          .from('turar_medical')
          .select('*')
          .order('"Отделение/Блок", "Помещение/Кабинет", "Наименование"')
        
        if (error) {
          console.error('Error loading turar data:', error)
          return
        }
        
        if (data) {
          const processed = data.map((item: any) => ({
            department: item["Отделение/Блок"],
            room: item["Помещение/Кабинет"],
            equipmentCode: item["Код оборудования"],
            equipmentName: item["Наименование"],
            quantity: item["Кол-во"]
          }))
          setTurarData(processed)
          console.log('Loaded turar data:', processed.length, 'records')
          console.log('Sample turar data:', processed.slice(0, 3))
        }
      } catch (error) {
        console.error('Failed to load turar data:', error)
      }
    }

    const loadProjectorData = async () => {
      try {
        const { data, error } = await supabase
          .from('projector_floors')
          .select('*')
          .order('"ЭТАЖ", "ОТДЕЛЕНИЕ", "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"')
        
        if (error) {
          console.error('Error loading projector data:', error)
          return
        }
        
        if (data) {
          const processed = data.map((item: any) => ({
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
          setProjectorData(processed)
          console.log('Loaded projector data:', processed.length, 'records')
          console.log('Sample projector data:', processed.slice(0, 3))
        }
      } catch (error) {
        console.error('Failed to load projector data:', error)
      }
    }

    loadTurarData()
    loadProjectorData()
  }, [])
  // Получение структурированных данных для отделений
  const getProjectorDepartments = (turarDept: string): Department[] => {
    const mapping = departmentMappings.find(m => m.turarDepartment === turarDept)
    if (!mapping) return []
    return mapping.projectorsDepartments.map(deptName => {
      // Фильтруем все записи для этого отделения
      const deptItems = projectorData.filter(item => item.department === deptName)
      const roomsMap = new Map<string, Room>()
      
      // Группируем по комнатам
      deptItems.forEach(item => {
        if (!roomsMap.has(item.roomName)) {
          roomsMap.set(item.roomName, {
            name: item.roomName,
            equipment: []
          })
        }
        
        // Добавляем оборудование только если оно есть
        if (item.equipmentName && item.equipmentName.trim()) {
          roomsMap.get(item.roomName)!.equipment.push({
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

  const getTurarDepartment = (deptName: string): Department | null => {
    const deptEquipment = turarData.filter(item => item.department === deptName)
    if (deptEquipment.length === 0) return null
    
    const roomsMap = new Map<string, Room>()
    
    deptEquipment.forEach(item => {
      if (!roomsMap.has(item.room)) {
        roomsMap.set(item.room, {
          name: item.room,
          equipment: []
        })
      }
      
      roomsMap.get(item.room)!.equipment.push({
        code: item.equipmentCode,
        name: item.equipmentName,
        quantity: item.quantity
      })
    })
    
    return {
      name: deptName,
      rooms: Array.from(roomsMap.values())
    }
  }

  // Функции для управления связями
  const getRoomConnection = (turarDepartment: string, turarRoom: string) => {
    return roomConnections?.find(conn => 
      conn.turar_department === turarDepartment && conn.turar_room === turarRoom
    );
  };

  const isRoomConnected = (turarDepartment: string, turarRoom: string, projectorDepartment: string, projectorRoom: string) => {
    return roomConnections?.some(conn => 
      conn.turar_department === turarDepartment && 
      conn.turar_room === turarRoom && 
      conn.projector_department === projectorDepartment && 
      conn.projector_room === projectorRoom
    ) || false;
  };

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

  // Создание связи
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

  // Удаление связи
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

  // Filter mappings based on search term
  const filteredMappings = departmentMappings.filter(mapping =>
    mapping.turarDepartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.projectorsDepartments.some(dept => dept.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Status functions
  const getStatusColor = (mapping: DepartmentMapping) => {
    const projectorDepts = getProjectorDepartments(mapping.turarDepartment);
    const turarDept = getTurarDepartment(mapping.turarDepartment);
    
    if (projectorDepts.length === 0 || !turarDept) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
    
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  };

  const getStatusLabel = (mapping: DepartmentMapping) => {
    const projectorDepts = getProjectorDepartments(mapping.turarDepartment);
    const turarDept = getTurarDepartment(mapping.turarDepartment);
    
    if (projectorDepts.length === 0 || !turarDept) {
      return "Нет данных";
    }
    
    const connections = roomConnections?.filter(conn => 
      conn.turar_department === mapping.turarDepartment
    )?.length || 0;
    
    return `Данные найдены • ${connections} связей`;
  };

  const getDisplayName = (type: 'department' | 'room', name: string) => {
    const key = `${type}-${name}`
    return editableNames[type === 'department' ? 'departments' : 'rooms'][key] || name
  }

  const startEditing = (type: 'department' | 'room', name: string) => {
    const key = `${type}-${name}`
    setEditingField(key)
  }

  const saveEdit = (type: 'department' | 'room', name: string, newName: string) => {
    const key = `${type}-${name}`
    setEditableNames(prev => ({
      ...prev,
      [type === 'department' ? 'departments' : 'rooms']: {
        ...prev[type === 'department' ? 'departments' : 'rooms'],
        [key]: newName
      }
    }))
    setEditingField(null)
  }

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
            Создание и управление связями между отделениями Турар и Проектировщиков
          </p>
        </div>

        {/* Search and Statistics */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Input
            placeholder="Поиск по отделениям..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Всего связей: {roomConnections?.length || 0}</span>
            <span>Сопоставлений: {departmentMappings.length}</span>
          </div>
        </div>

        {/* Mappings List */}
        <div className="space-y-4">
          {filteredMappings.map((mapping) => {
            const projectorDepartments = getProjectorDepartments(mapping.turarDepartment)
            const turarDepartment = getTurarDepartment(mapping.turarDepartment)
            const isExpanded = expandedDepartments.has(mapping.id)

            return (
              <Card key={mapping.id} className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => {
                    if (isExpanded) {
                      expandedDepartments.delete(mapping.id)
                    } else {
                      expandedDepartments.add(mapping.id)
                    }
                    setExpandedDepartments(new Set(expandedDepartments))
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <div>
                        <CardTitle className="text-lg">{mapping.turarDepartment}</CardTitle>
                        <CardDescription>
                          {mapping.projectorsDepartments.length} проектировщик(ов)
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(mapping)}>
                      {getStatusLabel(mapping)}
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
                              const roomKey = `turar-${mapping.turarDepartment}-${room.name}`
                              const isRoomExpanded = expandedRooms.has(roomKey)
                              const connections = getConnectedRooms(mapping.turarDepartment, room.name)

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
                                          <LinkIcon className="h-3 w-3 mr-1" />
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
                                          turarDept: mapping.turarDepartment,
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
                                           <LinkIcon className="h-3 w-3 mr-1" />
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
                                           turarDept: mapping.turarDepartment,
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

        {/* Linking Dialog */}
        {linkingRoom && (
          <Dialog open={!!linkingRoom} onOpenChange={() => setLinkingRoom(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать связь</DialogTitle>
                <DialogDescription>
                  Связать помещение {linkingRoom.turarRoom} из отделения {linkingRoom.turarDept}
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
                        .find(m => m.turarDepartment === linkingRoom.turarDept)
                        ?.projectorsDepartments.map(dept => (
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