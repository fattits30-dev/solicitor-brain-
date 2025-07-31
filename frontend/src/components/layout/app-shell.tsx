'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Home, 
  Briefcase, 
  FileText, 
  Mail, 
  Calendar,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  Brain,
  BarChart3,
  Users,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import CommandPalette from '@/components/command-palette'
import AIStatus from '@/components/ai-status'

interface NavItem {
  id: string
  label: string
  icon: any
  href: string
  badge?: number
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
  { id: 'cases', label: 'Cases', icon: Briefcase, href: '/cases' },
  { id: 'documents', label: 'Documents', icon: FileText, href: '/documents' },
  { id: 'emails', label: 'Emails', icon: Mail, href: '/emails', badge: 3 },
  { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar' },
  { id: 'clients', label: 'Clients', icon: Users, href: '/clients' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Brain, href: '/ai-assistant' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' }
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className={cn(
        'flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-800">
          <Shield className="h-8 w-8 text-blue-500 flex-shrink-0" />
          {sidebarOpen && (
            <span className="ml-3 text-lg font-semibold">Solicitor Brain</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={cn(
                  'w-full flex items-center px-4 py-3 text-sm font-medium transition-colors',
                  'hover:bg-gray-800 hover:text-white',
                  'focus:outline-none focus:bg-gray-800'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="ml-3">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* AI Status */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-800">
            <AIStatus />
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="p-2"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="text-gray-400 hover:text-white flex items-center">
              <Search className="h-4 w-4 mr-2" />
              <span>Search...</span>
              <kbd className="ml-2 text-xs bg-gray-800 px-1.5 py-0.5 rounded">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full p-6">
            {children}
          </div>
        </main>

        {/* Compliance Banner */}
        <div className="bg-yellow-900/20 border-t border-yellow-800/30 px-6 py-2">
          <p className="text-xs text-yellow-200">
            AI outputs are organisational assistance only – verify before use.
          </p>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  )
}