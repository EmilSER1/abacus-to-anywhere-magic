import React, { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/SimpleSidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header with sidebar trigger */}
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
            <div className="h-6 w-px bg-border/40" />
            <h1 className="text-sm font-medium text-muted-foreground">
              Система управления медицинского центра
            </h1>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}