import React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { 
  Building2, 
  Home, 
  Users, 
  Database, 
  Search, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronLeft,
  Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Главная",
    url: "/",
    icon: Home,
  },
  {
    title: "Проектировщики", 
    url: "/floors",
    icon: Building2,
  },
  {
    title: "Турар",
    url: "/turar", 
    icon: Users,
  },
  {
    title: "Поиск",
    url: "/search",
    icon: Search,
  },
  {
    title: "Консолидация",
    url: "/consolidation",
    icon: BarChart3,
  },
  {
    title: "Таблица соединения",
    url: "/connections",
    icon: Database,
  },
  {
    title: "Админ",
    url: "/admin",
    icon: Settings,
  },
]

interface AppSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const currentPath = location.pathname

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        variant: "destructive",
        title: "Ошибка выхода",
        description: error.message,
      })
    } else {
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы",
      })
      navigate('/auth')
    }
  }

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-background border-r border-border/40 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "w-64"
        )}
      >
        {/* Header */}
        <div className="border-b border-border/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">МГБ</h2>
              <p className="text-xs text-muted-foreground">Система управления</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="py-4 flex-1 overflow-y-auto">
          <div className="px-3">
            <p className="px-3 text-xs font-medium text-muted-foreground mb-2">
              Навигация
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive(item.url)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/40 p-4 space-y-2">
          {currentPath !== "/" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="w-full justify-start"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    </>
  )
}