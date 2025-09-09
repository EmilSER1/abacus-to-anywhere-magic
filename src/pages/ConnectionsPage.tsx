import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Link as LinkIcon, Download, Filter, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/Navigation'

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

// Интерфейс для соответствий отделений
interface DepartmentMapping {
  id: string
  turarDepartment: string
  projectorsDepartments: string[]
  status: 'mapped' | 'partial' | 'unmapped'
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
  const [projectorData, setProjectorData] = useState<ProjectorRoom[]>([])
  const [turarData, setTurarData] = useState<TurarEquipment[]>([])

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

  // Получение уникальных отделений из загруженных данных
  const getProjectorDepartments = (turarDept: string) => {
    const mapping = departmentMappings.find(m => m.turarDepartment === turarDept)
    if (!mapping) return []
    
    return mapping.projectorsDepartments.map(deptName => {
      const deptData = projectorData.filter(item => item.department === deptName)
      const rooms = [...new Set(deptData.map(item => item.roomName))].filter(Boolean)
      const equipment = deptData.filter(item => item.equipmentName).map(item => ({
        roomName: item.roomName,
        equipmentName: item.equipmentName,
        quantity: item.quantity,
        unit: item.unit
      }))
      
      return {
        name: deptName,
        rooms,
        equipment
      }
    })
  }

  const getTurarEquipment = (deptName: string) => {
    return turarData.filter(item => item.department === deptName)
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
                <div className="text-2xl font-bold text-blue-600">{stats.totalProjectorsDepts}</div>
              </CardContent>
            </Card>
            
            <Card className="medical-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Без сопоставления</CardTitle>
                <LinkIcon className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{stats.totalUnmapped}</div>
              </CardContent>
            </Card>
            
            <Card className="medical-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Среднее соответствие</CardTitle>
                <ArrowRight className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageMapping}:1</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="medical-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск по отделениям..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md bg-background text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* Mappings Display */}
          <div className="space-y-6">
            {filteredMappings.map((mapping) => (
              <Card key={mapping.id} className="medical-card">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Турар Отделение */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Database className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-primary">Отделение Турар</h3>
                      </div>
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-4 text-center">
                          <div className="space-y-3">
                            <h4 className="font-medium text-foreground">
                              {mapping.turarDepartment}
                            </h4>
                            <Badge className={getStatusColor(mapping.status)}>
                              {getStatusLabel(mapping.status)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Отделения Проектировщиков */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <LinkIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-blue-600">Отделения Проектировщиков</h3>
                      </div>
                      <div className="space-y-3">
                        {getProjectorDepartments(mapping.turarDepartment).map((dept, index) => {
                          const deptId = `${mapping.id}-${index}`
                          const isExpanded = expandedDepartments.has(deptId)
                          
                          return (
                            <div key={index} className="space-y-2">
                              <Card 
                                className="border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                                onClick={() => toggleDepartment(deptId)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium text-foreground">{dept.name}</div>
                                    <div className="text-blue-600 transition-transform">
                                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              
                              {isExpanded && (
                                <div className="ml-4 space-y-2">
                                  {dept.rooms.length > 0 && (
                                    <div className="p-3 bg-muted/50 rounded border border-border">
                                      <h5 className="font-medium text-sm mb-2">Помещения:</h5>
                                      <ul className="text-sm text-muted-foreground space-y-1">
                                        {dept.rooms.map((room, roomIndex) => (
                                          <li key={roomIndex}>• {room}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {dept.equipment.length > 0 && (
                                    <div className="p-3 bg-blue-50/50 rounded border border-blue-200">
                                      <h5 className="font-medium text-sm mb-2">Оборудование:</h5>
                                      <ul className="text-sm space-y-1">
                                        {dept.equipment.map((equip, equipIndex) => (
                                          <li key={equipIndex} className="flex justify-between">
                                            <span>{equip.equipmentName}</span>
                                            <span className="text-muted-foreground">
                                              {equip.quantity} {equip.unit}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
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