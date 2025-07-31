'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  FolderOpen,
  CalendarDays,
  Mail,
  FileText,
  Search,
  FileBarChart,
  Monitor,
  Database,
  Settings,
  Clock,
  Brain,
  Sparkles
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Assistant', href: '/', icon: MessageSquare },
  { name: 'Cases', href: '/cases', icon: FolderOpen },
  { name: 'Deadlines', href: '/deadlines', icon: Clock },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Emails', href: '/emails', icon: Mail },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
  { name: 'AI Monitor', href: '/ai-monitor', icon: Monitor },
  { name: 'Backup', href: '/backup', icon: Database },
  { name: 'Settings', href: '/settings', icon: Settings }
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full glass w-64 border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg blur-lg opacity-50"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Solicitor Brain
            </span>
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="px-3 space-y-1">
          {navigation.map(item => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-white/10 shadow-lg'
                        : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent'
                    }
                  `}
                >
                  <div className={`relative ${isActive ? 'text-blue-400' : ''}`}>
                    {isActive && (
                      <div className="absolute inset-0 bg-blue-400 blur-md opacity-50"></div>
                    )}
                    <item.icon className="relative h-5 w-5 flex-shrink-0" />
                  </div>
                  <span className="text-sm font-medium">{item.name}</span>
                  {isActive && (
                    <Sparkles className="ml-auto h-3 w-3 text-blue-400 animate-pulse" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* AI Status */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="glass rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-50"></div>
              <div className="relative w-2 h-2 bg-emerald-500 rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-200">AI Engine Active</p>
              <p className="text-xs text-gray-500 mt-0.5">Compliance Mode: ON</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xs text-gray-500">75%</span>
          </div>
        </div>
      </div>
    </div>
  )
}