import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Link as LinkIcon, Download, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/Navigation'

interface Connection {
  id: string
  sourceDepartment: string
  sourceRoom: string
  targetDepartment: string
  targetRoom: string
  connectionType: 'physical' | 'functional' | 'data'
  description: string
  status: 'active' | 'inactive' | 'maintenance'
}

// Mock connections data
const mockConnections: Connection[] = [
  {
    id: '1',
    sourceDepartment: 'Кардиология',
    sourceRoom: 'Кабинет врача 101',
    targetDepartment: 'Кардиология',
    targetRoom: 'Процедурная 102',
    connectionType: 'physical',
    description: 'Прямой доступ из кабинета в процедурную',
    status: 'active'
  },
  {
    id: '2',
    sourceDepartment: 'Хирургия',
    sourceRoom: 'Операционная 301',
    targetDepartment: 'Хирургия',
    targetRoom: 'Перевязочная 302',
    connectionType: 'functional',
    description: 'Послеоперационное обслуживание',
    status: 'active'
  },
  {
    id: '3',
    sourceDepartment: 'Неврология',
    sourceRoom: 'Кабинет невролога 201',
    targetDepartment: 'Неврология',
    targetRoom: 'Диагностика 202',
    connectionType: 'data',
    description: 'Передача результатов диагностики',
    status: 'active'
  },
  {
    id: '4',
    sourceDepartment: 'Отделение Турар А',
    sourceRoom: 'Палата 101',
    targetDepartment: 'Отделение Турар А',
    targetRoom: 'Процедурная 103',
    connectionType: 'functional',
    description: 'Доставка пациентов на процедуры',
    status: 'maintenance'
  },
  {
    id: '5',
    sourceDepartment: 'Кардиология',
    sourceRoom: 'Процедурная 102',
    targetDepartment: 'Отделение Турар Б',
    targetRoom: 'Палата 201',
    connectionType: 'data',
    description: 'Передача данных о процедурах',
    status: 'inactive'
  }
]

export default function ConnectionsPage() {
  const [connections] = useState<Connection[]>(mockConnections)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const filteredConnections = connections.filter(connection => {
    const typeMatch = selectedType === 'all' || connection.connectionType === selectedType
    const statusMatch = selectedStatus === 'all' || connection.status === selectedStatus
    return typeMatch && statusMatch
  })

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'physical': return 'bg-primary text-primary-foreground'
      case 'functional': return 'bg-success text-white'
      case 'data': return 'bg-warning text-white'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-white'
      case 'inactive': return 'bg-destructive text-white'
      case 'maintenance': return 'bg-warning text-white'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const getConnectionTypeLabel = (type: string) => {
    switch (type) {
      case 'physical': return 'Физическая'
      case 'functional': return 'Функциональная'
      case 'data': return 'Данные'
      default: return type
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Активна'
      case 'inactive': return 'Неактивна'
      case 'maintenance': return 'Обслуживание'
      default: return status
    }
  }

  const exportData = () => {
    const data = connections.map(conn => ({
      id: conn.id,
      source: `${conn.sourceDepartment} - ${conn.sourceRoom}`,
      target: `${conn.targetDepartment} - ${conn.targetRoom}`,
      type: getConnectionTypeLabel(conn.connectionType),
      status: getStatusLabel(conn.status),
      description: conn.description
    }))
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'connections-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const connectionStats = {
    total: connections.length,
    active: connections.filter(c => c.status === 'active').length,
    physical: connections.filter(c => c.connectionType === 'physical').length,
    functional: connections.filter(c => c.connectionType === 'functional').length,
    data: connections.filter(c => c.connectionType === 'data').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Таблица соединения</h1>
          <p className="text-muted-foreground">Связи между отделениями и кабинетами больницы</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего связей</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectionStats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные</CardTitle>
            <LinkIcon className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{connectionStats.active}</div>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Физические</CardTitle>
            <LinkIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectionStats.physical}</div>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Функциональные</CardTitle>
            <LinkIcon className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectionStats.functional}</div>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Данные</CardTitle>
            <LinkIcon className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectionStats.data}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Тип связи:</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedType === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('all')}
                >
                  Все
                </Button>
                <Button
                  size="sm"
                  variant={selectedType === 'physical' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('physical')}
                >
                  Физические
                </Button>
                <Button
                  size="sm"
                  variant={selectedType === 'functional' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('functional')}
                >
                  Функциональные
                </Button>
                <Button
                  size="sm"
                  variant={selectedType === 'data' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('data')}
                >
                  Данные
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Статус:</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('all')}
                >
                  Все
                </Button>
                <Button
                  size="sm"
                  variant={selectedStatus === 'active' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('active')}
                >
                  Активные
                </Button>
                <Button
                  size="sm"
                  variant={selectedStatus === 'inactive' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('inactive')}
                >
                  Неактивные
                </Button>
                <Button
                  size="sm"
                  variant={selectedStatus === 'maintenance' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('maintenance')}
                >
                  Обслуживание
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connections List */}
      <div className="space-y-4">
        {filteredConnections.map((connection) => (
          <Card key={connection.id} className="medical-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={getConnectionTypeColor(connection.connectionType)}>
                      {getConnectionTypeLabel(connection.connectionType)}
                    </Badge>
                    <Badge className={getStatusColor(connection.status)}>
                      {getStatusLabel(connection.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-foreground">Источник:</div>
                      <div className="text-muted-foreground">
                        {connection.sourceDepartment} → {connection.sourceRoom}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <LinkIcon className="w-4 h-4 text-primary" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-foreground">Назначение:</div>
                      <div className="text-muted-foreground">
                        {connection.targetDepartment} → {connection.targetRoom}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>Описание:</strong> {connection.description}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredConnections.length === 0 && (
        <Card className="medical-card">
          <CardContent className="py-8 text-center">
            <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Нет соединений</h3>
            <p className="text-muted-foreground">
              Попробуйте изменить фильтры или очистить их
            </p>
          </CardContent>
        </Card>
      )}
        </div>
      </main>
    </div>
  )
}