import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, Building, Download, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EditDepartmentDialog } from '@/components/EditDepartmentDialog'
import { EditRoomDialog } from '@/components/EditRoomDialog'

interface TurarDepartment {
  id: string
  name: string
  code?: string | null
  description?: string | null
  staff: number
  rooms: TurarRoom[]
}

interface TurarRoom {
  id: string
  name: string
  code?: string | null
  area?: number | null
  description?: string | null
  capacity: number
  occupied: number
}

// Mock data for Turar departments
const mockTurarDepartments: TurarDepartment[] = [
  {
    id: '1',
    name: 'Отделение Турар А',
    code: 'TUR-A',
    description: 'Основное отделение Турар',
    staff: 15,
    rooms: [
      { id: '1', name: 'Палата 101', code: 'T101', area: 25, description: 'Палата на 4 места', capacity: 4, occupied: 3 },
      { id: '2', name: 'Палата 102', code: 'T102', area: 20, description: 'Палата на 2 места', capacity: 2, occupied: 2 },
      { id: '3', name: 'Процедурная 103', code: 'T103', area: 15, description: 'Процедурная комната', capacity: 1, occupied: 0 },
    ]
  },
  {
    id: '2',
    name: 'Отделение Турар Б',
    code: 'TUR-B',
    description: 'Дополнительное отделение Турар',
    staff: 12,
    rooms: [
      { id: '4', name: 'Палата 201', code: 'T201', area: 30, description: 'Палата на 6 мест', capacity: 6, occupied: 4 },
      { id: '5', name: 'Палата 202', code: 'T202', area: 25, description: 'Палата на 4 места', capacity: 4, occupied: 1 },
      { id: '6', name: 'Кабинет врача 203', code: 'T203', area: 18, description: 'Кабинет лечащего врача', capacity: 1, occupied: 1 },
    ]
  }
]

export default function TurarPage() {
  const [departments] = useState<TurarDepartment[]>(mockTurarDepartments)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalRooms = departments.reduce((sum, dept) => sum + dept.rooms.length, 0)
  const totalCapacity = departments.reduce((sum, dept) => 
    sum + dept.rooms.reduce((roomSum, room) => roomSum + room.capacity, 0), 0
  )
  const totalOccupied = departments.reduce((sum, dept) => 
    sum + dept.rooms.reduce((roomSum, room) => roomSum + room.occupied, 0), 0
  )
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0

  const exportData = () => {
    const data = departments.map(dept => ({
      department: dept.name,
      code: dept.code,
      description: dept.description,
      staff: dept.staff,
      rooms: dept.rooms.map(room => ({
        name: room.name,
        code: room.code,
        area: room.area,
        description: room.description,
        capacity: room.capacity,
        occupied: room.occupied
      }))
    }))
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'turar-departments-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Турар</h1>
          <p className="text-muted-foreground">Управление отделениями Турар, персоналом и размещением</p>
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Поиск по отделениям..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Отделения</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              Отделений Турар
            </p>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Палаты</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRooms}</div>
            <p className="text-xs text-muted-foreground">
              Палат и кабинетов
            </p>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Загрузка</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalOccupied} из {totalCapacity} мест
            </p>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Персонал</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.reduce((sum, dept) => sum + dept.staff, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Сотрудников всего
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Departments List */}
      <div className="space-y-6">
        {filteredDepartments.map((department) => (
          <Card key={department.id} className="medical-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    {department.name}
                    {department.code && (
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        {department.code}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {department.description} • Персонал: {department.staff} сотрудников
                  </CardDescription>
                </div>
                <EditDepartmentDialog department={department} type="turar" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">
                    Палаты и кабинеты ({department.rooms.length})
                  </h4>
                  <Button size="sm" variant="outline" className="flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Добавить палату
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {department.rooms.map((room) => (
                    <Card key={room.id} className="border border-border bg-background/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{room.name}</CardTitle>
                          <EditRoomDialog room={room} type="turar" />
                        </div>
                        {room.code && (
                          <CardDescription className="text-xs">{room.code}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-sm space-y-2">
                          {room.area && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Площадь:</span>
                              <span>{room.area} м²</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Загрузка:</span>
                            <span className={`font-medium ${
                              room.occupied === room.capacity ? 'text-destructive' :
                              room.occupied > room.capacity * 0.8 ? 'text-warning' :
                              'text-success'
                            }`}>
                              {room.occupied}/{room.capacity}
                            </span>
                          </div>
                          
                          {/* Occupancy bar */}
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                room.occupied === room.capacity ? 'bg-destructive' :
                                room.occupied > room.capacity * 0.8 ? 'bg-warning' :
                                'bg-success'
                              }`}
                              style={{ 
                                width: `${room.capacity > 0 ? (room.occupied / room.capacity) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          
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

      {filteredDepartments.length === 0 && searchTerm && (
        <Card className="medical-card">
          <CardContent className="py-8 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Ничего не найдено</h3>
            <p className="text-muted-foreground">
              Попробуйте изменить поисковый запрос или очистить фильтры
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}