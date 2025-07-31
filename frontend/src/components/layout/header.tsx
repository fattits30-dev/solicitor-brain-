'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const pageTitles: Record<string, string> = {
  '/': 'AI Assistant',
  '/dashboard': 'Dashboard',
  '/cases': 'Cases',
  '/deadlines': 'Deadlines',
  '/calendar': 'Calendar',
  '/emails': 'Emails',
  '/documents': 'Documents',
  '/search': 'Search',
  '/reports': 'Reports',
  '/ai-monitor': 'AI Monitor',
  '/backup': 'Backup',
  '/settings': 'Settings'
}

export default function Header() {
  const pathname = usePathname()
  const title = pageTitles[pathname] || 'Solicitor Brain'
  const [dateString, setDateString] = useState<string>('')

  useEffect(() => {
    // Only set date on client side to avoid hydration mismatch
    const currentDate = new Date()
    const formatted = currentDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    setDateString(formatted)
  }, [])

  return (
    <header className="h-16 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-6">
      <h2 className="text-2xl font-bold text-white">{title}</h2>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{dateString}</span>
      </div>
    </header>
  )
}
