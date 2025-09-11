import React, { useState } from "react"
import { useLocation } from "react-router-dom"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/SimpleSidebar"

const getPageTitle = (pathname: string) => {
  const routes: Record<string, string> = {
    "/": "Главная",
    "/floors": "Проектировщики", 
    "/turar": "Турар",
    "/search": "Поиск",
    "/consolidation": "Консолидация",
    "/connections": "Таблица соединения",
    "/admin": "Админ"
  }
  
  return routes[pathname] || "МГБ"
}

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main content area with proper centering */}
      <div className="lg:ml-64">
        {/* Header with page title */}
        <header className="h-14 flex items-center border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4 px-6">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-border/40 lg:hidden" />
            <h1 className="text-lg font-semibold text-foreground">
              {pageTitle}
            </h1>
          </div>
        </header>

        {/* Main content with proper centering */}
        <main className="min-h-[calc(100vh-3.5rem)]">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}