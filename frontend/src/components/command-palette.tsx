'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  FileText,
  Mail,
  Settings,
  Plus,
  Calendar,
  Brain,
  Mic,
  X
} from 'lucide-react'

interface Command {
  id: string
  title: string
  description?: string
  icon: React.ReactNode
  action: () => void
  keywords: string[]
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Commands list
  const commands: Command[] = [
    {
      id: 'new-case',
      title: 'Create New Case',
      description: 'Start a new legal case',
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        router.push('/cases?new=true')
        setIsOpen(false)
      },
      keywords: ['new', 'case', 'create', 'add']
    },
    {
      id: 'search-cases',
      title: 'Search Cases',
      description: 'Find existing cases',
      icon: <Search className="h-4 w-4" />,
      action: () => {
        router.push('/cases')
        setIsOpen(false)
      },
      keywords: ['search', 'find', 'cases', 'lookup']
    },
    {
      id: 'compose-email',
      title: 'Compose Email',
      description: 'Write a new email',
      icon: <Mail className="h-4 w-4" />,
      action: () => {
        router.push('/emails?compose=true')
        setIsOpen(false)
      },
      keywords: ['email', 'compose', 'write', 'send']
    },
    {
      id: 'voice-mode',
      title: 'Voice Mode',
      description: 'Activate voice dictation',
      icon: <Mic className="h-4 w-4" />,
      action: () => {
        router.push('/?voice=true')
        setIsOpen(false)
      },
      keywords: ['voice', 'dictation', 'speak', 'microphone']
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      description: 'Open AI chat',
      icon: <Brain className="h-4 w-4" />,
      action: () => {
        router.push('/')
        setIsOpen(false)
      },
      keywords: ['ai', 'assistant', 'chat', 'help']
    },
    {
      id: 'calendar',
      title: 'View Calendar',
      description: 'Check deadlines and appointments',
      icon: <Calendar className="h-4 w-4" />,
      action: () => {
        router.push('/calendar')
        setIsOpen(false)
      },
      keywords: ['calendar', 'deadlines', 'appointments', 'schedule']
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Browse document library',
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        router.push('/documents')
        setIsOpen(false)
      },
      keywords: ['documents', 'files', 'library', 'browse']
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure application',
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        router.push('/settings')
        setIsOpen(false)
      },
      keywords: ['settings', 'preferences', 'configure', 'options']
    }
  ]

  // Filter commands based on search
  const filteredCommands = commands.filter(command => {
    const searchLower = search.toLowerCase()
    return (
      command.title.toLowerCase().includes(searchLower) ||
      command.description?.toLowerCase().includes(searchLower) ||
      command.keywords.some(keyword => keyword.includes(searchLower))
    )
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
      
      // Navigate with arrow keys
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
        } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
          e.preventDefault()
          filteredCommands[selectedIndex].action()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setSearch('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 text-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl my-8 text-left align-middle transition-all transform bg-gray-900 shadow-xl rounded-2xl border border-gray-800">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search..."
              className="w-full px-14 py-6 bg-transparent text-lg focus:outline-none"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto border-t border-gray-800">
            {filteredCommands.length === 0 ? (
              <div className="px-6 py-14 text-center text-gray-500">
                No commands found
              </div>
            ) : (
              <div className="py-2">
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    onClick={command.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
                      index === selectedIndex
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      index === selectedIndex ? 'bg-gray-700' : 'bg-gray-800/50'
                    }`}>
                      {command.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{command.title}</p>
                      {command.description && (
                        <p className="text-sm opacity-75">{command.description}</p>
                      )}
                    </div>
                    {index === selectedIndex && (
                      <kbd className="text-xs bg-gray-700 px-2 py-1 rounded">
                        Enter
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Enter</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Esc</kbd>
                Close
              </span>
            </div>
            <span>Press Ctrl+K to open</span>
          </div>
        </div>
      </div>
    </div>
  )
}