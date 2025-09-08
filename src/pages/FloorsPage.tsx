import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Building, Users, Download } from 'lucide-react'
import { EditDepartmentDialog } from '@/components/EditDepartmentDialog'
import { EditRoomDialog } from '@/components/EditRoomDialog'

interface Department {
  id: string
  name: string
  code?: string | null
  description?: string | null
  rooms: Room[]
}

interface Room {
  id: string
  name: string
  code?: string | null
  area?: number | null
  description?: string | null
}

// Mock data for demonstration
const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Кардиология',
    code: 'CARD',
    description: 'Отделение кардиологии',
    rooms: [
      { id: '1', name: 'Кабинет врача 101', code: 'C101', area: 20, description: 'Консультационный кабинет' },
      { id: '2', name: 'Процедурная 102', code: 'P102', area: 15, description: 'Процедурная комната' },
    ]
  },
  {
    id: '2',
    name: 'Неврология',
    code: 'NEUR',
    description: 'Неврологическое отделение',
    rooms: [
      { id: '3', name: 'Кабинет невролога 201', code: 'N201', area: 18, description: 'Неврологический кабинет' },
      { id: '4', name: 'Диагностика 202', code: 'D202', area: 25, description: 'Кабинет диагностики' },
    ]
  },
  {
    id: '3',
    name: 'Хирургия',
    code: 'SURG',
    description: 'Хирургическое отделение',
    rooms: [
      { id: '5', name: 'Операционная 301', code: 'O301', area: 40, description: 'Основная операционная' },
      { id: '6', name: 'Перевязочная 302', code: 'P302', area: 12, description: 'Перевязочная комната' },
    ]
  }
]

export default function FloorsPage() {
  const [departments] = useState<Department[]>(mockDepartments)

  const exportData = () => {
    const data = departments.map(dept => ({
      department: dept.name,
      code: dept.code,
      description: dept.description,
      rooms: dept.rooms.map(room => ({
        name: room.name,
        code: room.code,
        area: room.area,
        description: room.description
      }))
    }))
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'departments-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Проектировщики</h1>
          <p className="text-muted-foreground">Управление этажами, отделениями и кабинетами больницы</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Экспорт
          </Button>
          <Button className="medical-button flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Добавить отделение
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего отделений</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              +1 новое отделение за неделю
            </p>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего кабинетов</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.reduce((sum, dept) => sum + dept.rooms.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +2 новых кабинета за неделю
            </p>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая площадь</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.reduce((sum, dept) => 
                sum + dept.rooms.reduce((roomSum, room) => roomSum + (room.area || 0), 0), 0
              )} м²
            </div>
            <p className="text-xs text-muted-foreground">
              Средняя площадь кабинета: {Math.round(
                departments.reduce((sum, dept) => 
                  sum + dept.rooms.reduce((roomSum, room) => roomSum + (room.area || 0), 0), 0
                ) / departments.reduce((sum, dept) => sum + dept.rooms.length, 0)
              )} м²
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Departments List */}
      <div className="space-y-6">
        {departments.map((department) => (
          <Card key={department.id} className="medical-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    {department.name}
                    {department.code && (
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        {department.code}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{department.description}</CardDescription>
                </div>
                <EditDepartmentDialog department={department} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">Кабинеты ({department.rooms.length})</h4>
                  <Button size="sm" variant="outline" className="flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Добавить кабинет
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {department.rooms.map((room) => (
                    <Card key={room.id} className="border border-border bg-background/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{room.name}</CardTitle>
                          <EditRoomDialog room={room} />
                        </div>
                        {room.code && (
                          <CardDescription className="text-xs">{room.code}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-sm space-y-1">
                          {room.area && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Площадь:</span>
                              <span>{room.area} м²</span>
                            </div>
                          )}
                          {room.description && (
                            <div className="text-xs text-muted-foreground mt-2">
                              {room.description}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}