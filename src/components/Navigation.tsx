import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Building2, Home, Users, Database, ArrowLeft, Search, BarChart3, Settings, LogOut, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const { toast } = useToast()

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

  const navItems = [
    {
      name: 'Главная',
      href: '/',
      icon: Home,
    },
    {
      name: 'Проектировщики',
      href: '/floors',
      icon: Building2,
    },
    {
      name: 'Поиск',
      href: '/search',
      icon: Search,
    },
    {
      name: 'Админ',
      href: '/admin',
      icon: Settings,
    },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {pathname !== '/' && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Назад</span>
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
              <Building2 className="w-6 h-6" />
              МГБ
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname?.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'nav-link',
                      isActive ? 'nav-link-active' : 'nav-link-inactive'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </div>
    </nav>
  )
}