import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Database, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          <Building2 className="w-4 h-4" />
          Проектировщики
        </div>
        <h1 className="text-4xl font-bold text-foreground tracking-tight">
          МГБ
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Система управления больницей с раскладкой по этажам и кабинетам
        </p>
      </div>

      {/* Main Sections */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/floors" className="group">
          <Card className="medical-card h-full transition-all duration-300 hover:shadow-lg hover:scale-105">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">Проектировщики</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Управление этажами, отделениями и кабинетами больницы
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Структура этажей
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Отделения и кабинеты
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Экспорт данных
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/turar" className="group">
          <Card className="medical-card h-full transition-all duration-300 hover:shadow-lg hover:scale-105">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center group-hover:bg-accent transition-colors">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">Турар</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Управление персоналом и структурой отделений
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Отделения Турар
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Кабинеты и персонал
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Управление данными
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/connections" className="group">
          <Card className="medical-card h-full transition-all duration-300 hover:shadow-lg hover:scale-105">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                <Database className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">Таблица соединения</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Связи между отделениями и кабинетами
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  Связи данных
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  Анализ структуры
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  Отчеты
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Info Section */}
      <Card className="medical-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg">Информация о системе</CardTitle>
              <CardDescription>
                Основные возможности системы управления больницей
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Функциональность:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Управление структурой больницы</li>
                <li>• Создание и редактирование отделений</li>
                <li>• Управление кабинетами и помещениями</li>
                <li>• Экспорт данных в различных форматах</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Возможности:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Интуитивный интерфейс управления</li>
                <li>• Быстрый поиск и фильтрация</li>
                <li>• Резервное копирование данных</li>
                <li>• Детальная аналитика использования</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}