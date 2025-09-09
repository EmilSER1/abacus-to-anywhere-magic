import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Link as LinkIcon, Download, Filter, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/Navigation'

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

  const filteredMappings = departmentMappings.filter(mapping =>
    mapping.turarDepartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.projectorsDepartments.some(dept => 
      dept.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mapped': return 'bg-success text-white'
      case 'partial': return 'bg-warning text-white'
      case 'unmapped': return 'bg-destructive text-white'
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
                <LinkIcon className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{stats.totalProjectorsDepts}</div>
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

          {/* Two Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Турар Panel (Right) */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Отделения Турар</CardTitle>
                <CardDescription>Источник данных</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredMappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedMapping === mapping.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedMapping(selectedMapping === mapping.id ? null : mapping.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-2">
                          {mapping.turarDepartment}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(mapping.status)}>
                            {getStatusLabel(mapping.status)}
                          </Badge>
                          <Badge variant="outline">
                            {mapping.projectorsDepartments.length} соответствий
                          </Badge>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-primary mt-1" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Проектировщики Panel (Left) */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="text-xl text-success">Отделения Проектировщиков</CardTitle>
                <CardDescription>Целевые отделения</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredMappings.map((mapping) => (
                  <div
                    key={`proj-${mapping.id}`}
                    className={`p-4 rounded-lg border transition-all ${
                      selectedMapping === mapping.id 
                        ? 'border-success bg-success/5' 
                        : 'border-border'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="w-4 h-4" />
                        Соответствует: {mapping.turarDepartment}
                      </div>
                      
                      <div className="space-y-2">
                        {mapping.projectorsDepartments.map((dept, index) => (
                          <div
                            key={index}
                            className="p-3 bg-background rounded border border-border"
                          >
                            <div className="font-medium text-foreground">{dept}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
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