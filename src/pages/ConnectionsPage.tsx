import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Link as LinkIcon, Download, Filter, ArrowRight, ChevronDown, ChevronRight, Edit, Link2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/Navigation'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

// Интерфейс для связей кабинетов
interface RoomConnection {
  id: string
  turarDepartment: string
  turarRoom: string
  projectorDepartment: string
  projectorRoom: string
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
  const [roomConnections, setRoomConnections] = useState<RoomConnection[]>([])
  const [editableNames, setEditableNames] = useState<EditableNames>({ departments: {}, rooms: {} })
  const [editingField, setEditingField] = useState<string | null>(null)
  const [linkingRoom, setLinkingRoom] = useState<{
    turarDept: string
    turarRoom: string
    projectorDept: string
  } | null>(null)

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectorResponse, turarResponse] = await Promise.all([
          fetch('/combined_floors.json'),
          fetch('/turar_full.json')
        ])
        
        const projectorRaw = await projectorResponse.json()
        const turarRaw = await turarResponse.json()
        
        // Преобразование данных проектировщиков
        const projectorProcessed = projectorRaw.map((item: any) => ({
          floor: item['ЭТАЖ'],
          block: item['БЛОК'],
          department: item['ОТДЕЛЕНИЕ']?.trim(),
          roomCode: item['КОД ПОМЕЩЕНИЯ'],
          roomName: item['НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ'],
          area: item['Площадь (м2)'],
          equipmentCode: item['Код оборудования'],
          equipmentName: item['Наименование оборудования'],
          unit: item['Ед. изм.'],
          quantity: item['Кол-во'],
          notes: item['Примечания']
        }))
        
        // Преобразование данных Турар
        const turarProcessed = turarRaw.map((item: any) => ({
          department: item['Отделение/Блок'],
          room: item['Помещение/Кабинет'],
          equipmentCode: item['Код оборудования'],
          equipmentName: item['Наименование'],
          quantity: item['Кол-во']
        }))
        
        setProjectorData(projectorProcessed)
        setTurarData(turarProcessed)
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      }
    }
    
    loadData()
  }, [])

  // Получение структурированных данных для отделений
  const getProjectorDepartments = (turarDept: string): Department[] => {
    const mapping = departmentMappings.find(m => m.turarDepartment === turarDept)
    if (!mapping) return []
    
    return mapping.projectorsDepartments.map(deptName => {
      const deptData = projectorData.filter(item => item.department === deptName)
      
      // Группировка по помещениям
      const roomsMap = new Map<string, Equipment[]>()
      deptData.forEach(item => {
        if (item.roomName) {
          if (!roomsMap.has(item.roomName)) {
            roomsMap.set(item.roomName, [])
          }
          if (item.equipmentName) {
            roomsMap.get(item.roomName)!.push({
              code: item.equipmentCode || undefined,
              name: item.equipmentName,
              quantity: item.quantity || 0,
              unit: item.unit || undefined
            })
          }
        }
      })
      
      const rooms: Room[] = Array.from(roomsMap.entries()).map(([roomName, equipment]) => ({
        name: roomName,
        equipment
      }))
      
      return {
        name: deptName,
        rooms
      }
    })
  }

  const getTurarDepartment = (deptName: string): Department => {
    const deptData = turarData.filter(item => item.department === deptName)
    
    // Группировка по помещениям
    const roomsMap = new Map<string, Equipment[]>()
    deptData.forEach(item => {
      if (item.room) {
        if (!roomsMap.has(item.room)) {
          roomsMap.set(item.room, [])
        }
        if (item.equipmentName) {
          roomsMap.get(item.room)!.push({
            code: item.equipmentCode,
            name: item.equipmentName,
            quantity: item.quantity
          })
        }
      }
    })
    
    const rooms: Room[] = Array.from(roomsMap.entries()).map(([roomName, equipment]) => ({
      name: roomName,
      equipment
    }))
    
    return {
      name: deptName,
      rooms
    }
  }

  const toggleDepartment = (deptId: string) => {
    const newExpanded = new Set(expandedDepartments)
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId)
    } else {
      newExpanded.add(deptId)
    }
    setExpandedDepartments(newExpanded)
  }

  const toggleRoom = (roomId: string) => {
    const newExpanded = new Set(expandedRooms)
    if (newExpanded.has(roomId)) {
      newExpanded.delete(roomId)
    } else {
      newExpanded.add(roomId)
    }
    setExpandedRooms(newExpanded)
  }

  // Функции для редактирования названий
  const startEditing = (fieldId: string) => {
    setEditingField(fieldId)
  }

  const saveEdit = (fieldId: string, newValue: string, type: 'department' | 'room') => {
    setEditableNames(prev => ({
      ...prev,
      [type === 'department' ? 'departments' : 'rooms']: {
        ...prev[type === 'department' ? 'departments' : 'rooms'],
        [fieldId]: newValue
      }
    }))
    setEditingField(null)
  }

  const getDisplayName = (originalName: string, type: 'department' | 'room') => {
    const names = type === 'department' ? editableNames.departments : editableNames.rooms
    return names[originalName] || originalName
  }

  // Функции для связывания кабинетов
  const startLinking = (turarDept: string, turarRoom: string, projectorDept: string) => {
    setLinkingRoom({ turarDept, turarRoom, projectorDept })
  }

  const createConnection = (projectorRoom: string) => {
    if (!linkingRoom) return

    const newConnection: RoomConnection = {
      id: `${Date.now()}`,
      turarDepartment: linkingRoom.turarDept,
      turarRoom: linkingRoom.turarRoom,
      projectorDepartment: linkingRoom.projectorDept,
      projectorRoom: projectorRoom
    }

    setRoomConnections(prev => [...prev, newConnection])
    setLinkingRoom(null)
  }

  const removeConnection = (connectionId: string) => {
    setRoomConnections(prev => prev.filter(conn => conn.id !== connectionId))
  }

  // Проверка есть ли связь для кабинета
  const getRoomConnection = (turarDept: string, turarRoom: string, projectorDept: string, projectorRoom: string) => {
    return roomConnections.find(conn => 
      conn.turarDepartment === turarDept && 
      conn.turarRoom === turarRoom && 
      conn.projectorDepartment === projectorDept && 
      conn.projectorRoom === projectorRoom
    )
  }

  const isRoomConnected = (turarDept: string, turarRoom: string) => {
    return roomConnections.some(conn => 
      conn.turarDepartment === turarDept && conn.turarRoom === turarRoom
    )
  }

  const getConnectedRooms = (turarDept: string, turarRoom: string) => {
    return roomConnections.filter(conn => 
      conn.turarDepartment === turarDept && conn.turarRoom === turarRoom
    )
  }

  const getConnectedToProjectorRoom = (projectorDept: string, projectorRoom: string) => {
    return roomConnections.filter(conn => 
      conn.projectorDepartment === projectorDept && conn.projectorRoom === projectorRoom
    )
  }

  const filteredMappings = departmentMappings.filter(mapping =>
    mapping.turarDepartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.projectorsDepartments.some(dept => 
      dept.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mapped': return 'bg-blue-600 text-white'
      case 'partial': return 'bg-amber-600 text-white'
      case 'unmapped': return 'bg-red-600 text-white'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'mapped': return 'Сопоставлено'
      case 'partial': return 'Частично'
      case 'unmapped': return 'Не сопоставлено'
      default: return status
    }
  }

  const exportData = () => {
    const data = {
      mappings: departmentMappings,
      unmapped: unmappedDepartments,
      summary: {
        totalMappings: departmentMappings.length,
        totalUnmapped: unmappedDepartments.length,
        averageProjectorsPerTurar: (
          departmentMappings.reduce((sum, mapping) => sum + mapping.projectorsDepartments.length, 0) / 
          departmentMappings.length
        ).toFixed(2)
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'department-mappings.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = {
    totalMappings: departmentMappings.length,
    totalProjectorsDepts: departmentMappings.reduce((sum, mapping) => sum + mapping.projectorsDepartments.length, 0),
    totalUnmapped: unmappedDepartments.length,
    averageMapping: (departmentMappings.reduce((sum, mapping) => sum + mapping.projectorsDepartments.length, 0) / departmentMappings.length).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Сопоставление отделений</h1>
              <p className="text-muted-foreground">Соответствие между отделениями Турар и Проектировщиков</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Экспорт
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="medical-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего сопоставлений</CardTitle>
                <Database className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMappings}</div>
              </CardContent>
            </Card>
            
            <Card className="medical-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Отделений проектировщиков</CardTitle>
                <LinkIcon className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjectorsDepts}</div>
              </CardContent>
            </Card>
            
            <Card className="medical-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Без сопоставления</CardTitle>
                <Filter className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUnmapped}</div>
              </CardContent>
            </Card>
            
            <Card className="medical-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Среднее соответствие</CardTitle>
                <ArrowRight className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageMapping}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Поиск по отделениям..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="medical-input"
              />
            </div>
          </div>

          {/* Mappings */}
          <div className="space-y-4">
            {filteredMappings.map((mapping) => (
              <Card key={mapping.id} className="medical-card">
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getStatusColor(mapping.status)}>
                          {getStatusLabel(mapping.status)}
                        </Badge>
                        <h3 className="text-lg font-semibold text-primary">
                          {getDisplayName(mapping.turarDepartment, 'department')}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(`turar-mapping-${mapping.id}`)}
                          className="opacity-60 hover:opacity-100"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Турар отделение → {mapping.projectorsDepartments.length} отделений проектировщиков
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant={selectedMapping === mapping.id ? "default" : "outline"}
                        onClick={() => setSelectedMapping(selectedMapping === mapping.id ? null : mapping.id)}
                        className="flex items-center gap-2"
                      >
                        {selectedMapping === mapping.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Детали
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {selectedMapping === mapping.id && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Турар отделение */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                          <h4 className="font-medium text-emerald-700 dark:text-emerald-400">
                            Турар: {getDisplayName(mapping.turarDepartment, 'department')}
                          </h4>
                        </div>
                        
                        {(() => {
                          const turarDept = getTurarDepartment(mapping.turarDepartment)
                          return (
                            <div className="space-y-3">
                              {turarDept.rooms.map((room, roomIndex) => {
                                const roomId = `turar-${mapping.id}-room-${roomIndex}`
                                const isRoomExpanded = expandedRooms.has(roomId)
                                const connectedRooms = getConnectedRooms(mapping.turarDepartment, room.name)

                                return (
                                  <div key={roomIndex} className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 bg-emerald-50/50 dark:bg-emerald-900/20">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleRoom(roomId)}
                                          className="h-6 w-6 p-0"
                                        >
                                          {isRoomExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        </Button>
                                        <div className="flex items-center gap-2">
                                          {editingField === `turar-room-${mapping.id}-${room.name}` ? (
                                            <Input
                                              defaultValue={getDisplayName(room.name, 'room')}
                                              autoFocus
                                              onBlur={(e) => saveEdit(`turar-room-${mapping.id}-${room.name}`, e.target.value, 'room')}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  saveEdit(`turar-room-${mapping.id}-${room.name}`, e.currentTarget.value, 'room')
                                                }
                                              }}
                                              className="text-sm"
                                            />
                                          ) : (
                                            <span 
                                              className="text-sm font-medium cursor-pointer hover:text-primary"
                                              onClick={() => startEditing(`turar-room-${mapping.id}-${room.name}`)}
                                            >
                                              {getDisplayName(room.name, 'room')}
                                            </span>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => startEditing(`turar-room-${mapping.id}-${room.name}`)}
                                            className="p-1 opacity-60 hover:opacity-100"
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {/* Показываем связи */}
                                        {connectedRooms.map((conn, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {conn.projectorRoom}
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeConnection(conn.id)}
                                              className="p-0 ml-1 h-3 w-3"
                                            >
                                              <X className="w-2 h-2" />
                                            </Button>
                                          </Badge>
                                        ))}
                                        
                                        {!isRoomConnected(mapping.turarDepartment, room.name) && (
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <Button variant="outline" size="sm" className="text-xs h-7">
                                                <Link2 className="w-3 h-3 mr-1" />
                                                Связать
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                              <DialogHeader>
                                                <DialogTitle>Связать кабинет</DialogTitle>
                                                <DialogDescription>
                                                  Выберите кабинет из отделений проектировщиков для связи с "{room.name}"
                                                </DialogDescription>
                                              </DialogHeader>
                                              <div className="space-y-4 max-h-96 overflow-y-auto">
                                                {getProjectorDepartments(mapping.turarDepartment).map((projDept, deptIdx) => (
                                                  <div key={deptIdx} className="space-y-2">
                                                    <h5 className="font-medium text-blue-600">{projDept.name}</h5>
                                                    <div className="ml-4 space-y-1">
                                                      {projDept.rooms.map((projRoom, projRoomIdx) => (
                                                        <Button
                                                          key={projRoomIdx}
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() => {
                                                            const newConnection: RoomConnection = {
                                                              id: `${Date.now()}-${projRoomIdx}`,
                                                              turarDepartment: mapping.turarDepartment,
                                                              turarRoom: room.name,
                                                              projectorDepartment: projDept.name,
                                                              projectorRoom: projRoom.name
                                                            }
                                                            setRoomConnections(prev => [...prev, newConnection])
                                                          }}
                                                          className="text-xs h-8 w-full justify-start"
                                                        >
                                                          {projRoom.name}
                                                        </Button>
                                                      ))}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                        )}
                                        
                                        <Badge variant="outline" className="text-xs">
                                          {room.equipment.length} оборудования
                                        </Badge>
                                      </div>
                                    </div>

                                    {isRoomExpanded && room.equipment.length > 0 && (
                                      <div className="mt-3 space-y-1">
                                        {room.equipment.map((eq, eqIndex) => (
                                          <div key={eqIndex} className="flex justify-between items-center text-xs p-2 bg-emerald-100/50 dark:bg-emerald-800/50 rounded">
                                            <span>{eq.name} {eq.code && `(${eq.code})`}</span>
                                            <Badge variant="outline" className="text-xs">{eq.quantity} шт</Badge>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </div>

                      {/* Проектировщики отделения */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <h4 className="font-medium text-blue-700 dark:text-blue-400">
                            Проектировщики ({mapping.projectorsDepartments.length} отделений)
                          </h4>
                        </div>
                        
                        {getProjectorDepartments(mapping.turarDepartment).map((dept, index) => {
                          const deptId = `projector-${mapping.id}-${index}`
                          const isDeptExpanded = expandedDepartments.has(deptId)

                          return (
                            <Card key={index} className="border-blue-200 dark:border-blue-800">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleDepartment(deptId)}
                                      className="h-6 w-6 p-0"
                                    >
                                      {isDeptExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </Button>
                                    <div className="flex items-center gap-2">
                                      {editingField === `projector-dept-${mapping.id}-${dept.name}` ? (
                                        <Input
                                          defaultValue={getDisplayName(dept.name, 'department')}
                                          autoFocus
                                          onBlur={(e) => saveEdit(`projector-dept-${mapping.id}-${dept.name}`, e.target.value, 'department')}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              saveEdit(`projector-dept-${mapping.id}-${dept.name}`, e.currentTarget.value, 'department')
                                            }
                                          }}
                                          className="text-sm font-medium"
                                        />
                                      ) : (
                                        <h5 
                                          className="text-sm font-medium cursor-pointer hover:text-primary"
                                          onClick={() => startEditing(`projector-dept-${mapping.id}-${dept.name}`)}
                                        >
                                          {getDisplayName(dept.name, 'department')}
                                        </h5>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => startEditing(`projector-dept-${mapping.id}-${dept.name}`)}
                                        className="p-1 opacity-60 hover:opacity-100"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {dept.rooms.length} кабинетов
                                  </Badge>
                                </div>
                              </CardHeader>
                              
                              {isDeptExpanded && (
                                <CardContent className="pt-0">
                                  <div className="space-y-2">
                                    {dept.rooms.map((room, roomIndex) => {
                                      const roomId = `projector-${mapping.id}-${index}-room-${roomIndex}`
                                      const isRoomExpanded = expandedRooms.has(roomId)
                                      const connectedToRooms = getConnectedToProjectorRoom(dept.name, room.name)
                                      
                                      return (
                                        <div key={roomIndex} className="border border-blue-200 dark:border-blue-800 rounded-lg p-3 bg-blue-50/50 dark:bg-blue-900/20">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleRoom(roomId)}
                                                className="h-6 w-6 p-0"
                                              >
                                                {isRoomExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                              </Button>
                                              <div className="flex items-center gap-2">
                                                {editingField === `projector-room-${mapping.id}-${index}-${room.name}` ? (
                                                  <Input
                                                    defaultValue={getDisplayName(room.name, 'room')}
                                                    autoFocus
                                                    onBlur={(e) => saveEdit(`projector-room-${mapping.id}-${index}-${room.name}`, e.target.value, 'room')}
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter') {
                                                        saveEdit(`projector-room-${mapping.id}-${index}-${room.name}`, e.currentTarget.value, 'room')
                                                      }
                                                    }}
                                                    className="text-sm"
                                                  />
                                                ) : (
                                                  <span 
                                                    className="text-sm font-medium cursor-pointer hover:text-primary"
                                                    onClick={() => startEditing(`projector-room-${mapping.id}-${index}-${room.name}`)}
                                                  >
                                                    {getDisplayName(room.name, 'room')}
                                                  </span>
                                                )}
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => startEditing(`projector-room-${mapping.id}-${index}-${room.name}`)}
                                                  className="p-1 opacity-60 hover:opacity-100"
                                                >
                                                  <Edit className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {/* Показываем связи с Турар */}
                                              {connectedToRooms.map((conn, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                  {conn.turarRoom}
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeConnection(conn.id)}
                                                    className="p-0 ml-1 h-3 w-3"
                                                  >
                                                    <X className="w-2 h-2" />
                                                  </Button>
                                                </Badge>
                                              ))}
                                              <Badge variant="outline" className="text-xs">
                                                {room.equipment.length} оборудования
                                              </Badge>
                                            </div>
                                          </div>

                                          {isRoomExpanded && room.equipment.length > 0 && (
                                            <div className="mt-3 space-y-1">
                                              {room.equipment.map((eq, eqIndex) => (
                                                <div key={eqIndex} className="flex justify-between items-center text-xs p-2 bg-blue-100/50 dark:bg-blue-800/50 rounded">
                                                  <span>{eq.name} {eq.code && `(${eq.code})`}</span>
                                                  <Badge variant="outline" className="text-xs">{eq.quantity} {eq.unit}</Badge>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Unmapped Departments */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="text-xl text-warning flex items-center gap-2">
                <Database className="w-5 h-5" />
                Отделения без сопоставления
              </CardTitle>
              <CardDescription>Отделения, которые остаются без изменений</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {unmappedDepartments.map((dept, index) => (
                  <div
                    key={index}
                    className="p-3 bg-warning/10 border border-warning/20 rounded-lg"
                  >
                    <div className="text-sm font-medium text-foreground">{dept}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dialog для связывания кабинетов */}
          {linkingRoom && (
            <Dialog open={!!linkingRoom} onOpenChange={() => setLinkingRoom(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Связать кабинеты</DialogTitle>
                  <DialogDescription>
                    Выберите кабинет из отделения "{linkingRoom.projectorDept}" для связи с "{linkingRoom.turarRoom}"
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {(() => {
                    const projDept = getProjectorDepartments(linkingRoom.turarDept)
                      .find(dept => dept.name === linkingRoom.projectorDept)
                    
                    return projDept?.rooms.map((room, roomIdx) => (
                      <Button
                        key={roomIdx}
                        variant="outline"
                        onClick={() => createConnection(room.name)}
                        className="w-full justify-start"
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        {room.name}
                      </Button>
                    )) || <p>Нет доступных кабинетов</p>
                  })()}
          </div>

          {/* Two-column layout matching the image */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Левый блок - Турар */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-blue-600">Отделение Турар</h2>
              </div>
              
              {filteredMappings.map((mapping) => (
                <Card key={`turar-${mapping.id}`} className="medical-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{mapping.turarDepartment}</h3>
                        <Badge className="mt-1 bg-blue-600 text-white text-xs">Сопоставлено</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-2 h-auto"
                        onClick={() => {
                          const deptKey = `turar-show-rooms-${mapping.id}`
                          toggleDepartment(deptKey)
                        }}
                      >
                        <span className="text-sm">
                          Показать кабинеты ({getTurarDepartment(mapping.turarDepartment).rooms.length})
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      
                      {expandedDepartments.has(`turar-show-rooms-${mapping.id}`) && (
                        <div className="space-y-2 mt-3">
                          {getTurarDepartment(mapping.turarDepartment).rooms.map((room, roomIndex) => {
                            const connectedRooms = getConnectedRooms(mapping.turarDepartment, room.name)
                            return (
                              <div key={roomIndex} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Edit className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{room.name}</span>
                                  <span className="text-xs text-muted-foreground">{room.equipment.length} оборудования</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {connectedRooms.length > 0 && (
                                    <div className="flex gap-1">
                                      {connectedRooms.map(conn => (
                                        <Badge key={conn.id} variant="secondary" className="text-xs">
                                          {conn.projectorRoom}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeConnection(conn.id)}
                                            className="p-0 ml-1 h-3 w-3"
                                          >
                                            <X className="w-2 h-2" />
                                          </Button>
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  {connectedRooms.length === 0 && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="text-xs">
                                          <Link2 className="w-3 h-3 mr-1" />
                                          Связать
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Связать кабинет</DialogTitle>
                                          <DialogDescription>
                                            Выберите кабинет из отделений проектировщиков для связи с "{room.name}"
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                          {getProjectorDepartments(mapping.turarDepartment).map((projDept, deptIdx) => (
                                            <div key={deptIdx} className="space-y-2">
                                              <h5 className="font-medium text-blue-600">{projDept.name}</h5>
                                              <div className="ml-4 space-y-1">
                                                {projDept.rooms.map((projRoom, projRoomIdx) => (
                                                  <Button
                                                    key={projRoomIdx}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                      const newConnection: RoomConnection = {
                                                        id: `${Date.now()}-${projRoomIdx}`,
                                                        turarDepartment: mapping.turarDepartment,
                                                        turarRoom: room.name,
                                                        projectorDepartment: projDept.name,
                                                        projectorRoom: projRoom.name
                                                      }
                                                      setRoomConnections(prev => [...prev, newConnection])
                                                    }}
                                                    className="text-xs h-8 w-full justify-start"
                                                  >
                                                    {projRoom.name}
                                                  </Button>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Правый блок - Проектировщики */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-blue-600">Отделения Проектировщиков</h2>
              </div>
              
              {filteredMappings.map((mapping) => (
                <div key={`projector-${mapping.id}`} className="space-y-3">
                  {getProjectorDepartments(mapping.turarDepartment).map((dept, deptIndex) => (
                    <Card key={deptIndex} className="medical-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{dept.name}</h3>
                            <span className="text-sm text-muted-foreground">{dept.rooms.length} кабинетов</span>
                          </div>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {dept.rooms.map((room, roomIndex) => {
                            const connectedToRooms = getConnectedToProjectorRoom(dept.name, room.name)
                            return (
                              <div key={roomIndex} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Edit className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{room.name}</span>
                                  <span className="text-xs text-muted-foreground">{room.equipment.length} оборудования</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {connectedToRooms.length > 0 && (
                                    <div className="flex gap-1">
                                      {connectedToRooms.map(conn => (
                                        <Badge key={conn.id} variant="secondary" className="text-xs">
                                          {conn.turarRoom}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeConnection(conn.id)}
                                            className="p-0 ml-1 h-3 w-3"
                                          >
                                            <X className="w-2 h-2" />
                                          </Button>
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  {connectedToRooms.length === 0 && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="text-xs">
                                          <Link2 className="w-3 h-3 mr-1" />
                                          Связать
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Связать кабинет</DialogTitle>
                                          <DialogDescription>
                                            Выберите кабинет из Турар для связи с "{room.name}"
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                          {(() => {
                                            // Получаем все отделения из данных Турар
                                            const allTurarDepartments = [...new Set(turarData.map(item => item.department))].filter(Boolean)
                                            
                                            return allTurarDepartments.map((turarDeptName, turarDeptIdx) => {
                                              const turarDept = getTurarDepartment(turarDeptName)
                                              
                                              return (
                                                <div key={turarDeptIdx} className="space-y-2">
                                                  <h5 className="font-medium text-emerald-600">{turarDeptName}</h5>
                                                  <div className="ml-4 space-y-1">
                                                    {turarDept.rooms.map((turarRoom, turarRoomIdx) => (
                                                      <Button
                                                        key={turarRoomIdx}
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                          const newConnection: RoomConnection = {
                                                            id: `${Date.now()}-${turarRoomIdx}`,
                                                            turarDepartment: turarDeptName,
                                                            turarRoom: turarRoom.name,
                                                            projectorDepartment: dept.name,
                                                            projectorRoom: room.name
                                                          }
                                                          setRoomConnections(prev => [...prev, newConnection])
                                                        }}
                                                        className="text-xs h-8 w-full justify-start"
                                                      >
                                                        {turarRoom.name}
                                                      </Button>
                                                    ))}
                                                  </div>
                                                </div>
                                              )
                                            })
                                          })()}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          </div>
              </DialogContent>
            </Dialog>
          )}

          {filteredMappings.length === 0 && searchTerm && (
            <Card className="medical-card">
              <CardContent className="py-8 text-center">
                <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Не найдено соответствий</h3>
                <p className="text-muted-foreground">
                  Попробуйте изменить поисковый запрос
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}