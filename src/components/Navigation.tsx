import { Link, useLocation } from 'react-router-dom'
import { Building2, Home, Users, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navigation() {
  const location = useLocation()
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
      name: 'Таблица соединения',
      href: '/connections',
      icon: Database,
    },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
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