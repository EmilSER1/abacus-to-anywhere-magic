import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Database, BarChart3, Search, Settings } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const Index = () => {
  const dashboardCards = [
    {
      title: "Проектировщики",
      description: "Управление этажами и помещениями проектировщиков",
      icon: Building2,
      href: "/floors",
      color: "bg-blue-500",
      stats: "7,175 записей"
    },
    {
      title: "Турар", 
      description: "Медицинские кабинеты и оборудование Турар",
      icon: Users,
      href: "/turar",
      color: "bg-green-500", 
      stats: "Активные кабинеты"
    },
    {
      title: "Поиск",
      description: "Быстрый поиск по всем данным системы",
      icon: Search,
      href: "/search",
      color: "bg-purple-500",
      stats: "Мгновенный поиск"
    },
    {
      title: "Консолидация",
      description: "Сводные данные и аналитика",
      icon: BarChart3, 
      href: "/consolidation",
      color: "bg-orange-500",
      stats: "Отчеты и графики"
    },
    {
      title: "Соединения",
      description: "Управление связями между кабинетами",
      icon: Database,
      href: "/connections", 
      color: "bg-cyan-500",
      stats: "Активные связи"
    },
    {
      title: "Администрирование",
      description: "Управление системой и пользователями",
      icon: Settings,
      href: "/admin",
      color: "bg-gray-500",
      stats: "Системные настройки"
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Панель управления</h1>
        <p className="text-muted-foreground text-lg">
          Добро пожаловать в систему управления медицинского центра МГБ
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dashboardCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} to={card.href}>
              <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 border-border/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-md ${card.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground mb-2">
                    {card.description}
                  </div>
                  <p className="text-xs font-medium text-primary">
                    {card.stats}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/connections">
                <Database className="w-4 h-4 mr-2" />
                Создать связь
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/search">
                <Search className="w-4 h-4 mr-2" />
                Поиск оборудования
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/consolidation">
                <BarChart3 className="w-4 h-4 mr-2" />
                Отчеты
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Index
