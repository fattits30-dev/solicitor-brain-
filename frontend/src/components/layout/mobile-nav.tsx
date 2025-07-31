'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  FolderOpen,
  FileText,
  FileBarChart,
  Monitor,
  Settings,
  Info,
  X
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Assistant', href: '/', icon: MessageSquare },
  { name: 'Cases', href: '/cases', icon: FolderOpen },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Case Analysis', href: '/case-analysis', icon: FileBarChart },
  { name: 'AI Monitor', href: '/ai-monitor', icon: Monitor },
  { name: 'Settings', href: '/settings', icon: Settings }
]

interface MobileNavProps {
  onClose: () => void
}

export default function MobileNav({ onClose }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100 w-full">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Solicitor Brain</h1>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="p-4 space-y-2">
          {navigation.map(item => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-200'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-base font-medium">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* AI Assistant Mode */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-300">AI Assistant Mode</p>
              <p className="text-xs text-blue-400/70 mt-0.5">Human approval required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}