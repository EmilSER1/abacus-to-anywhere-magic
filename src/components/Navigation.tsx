import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Building2, Home, Users, Database, ArrowLeft, Search, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

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
      name: 'Турар',
      href: '/turar',
      icon: Users,
    },
    {
      name: 'Поиск',
      href: '/search',
      icon: Search,
    },
    {
      name: 'Консолидация',
      href: '/consolidation',
      icon: BarChart3,
    },
    {
      name: 'Таблица соединения',
      href: '/connections',
      icon: Database,
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

          {/* Mobile menu button can be added here */}
        </div>
      </div>
    </nav>
  )
}