'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Filter,
  ChevronRight,
  Bell,
  Briefcase,
  Gavel,
  FileText,
  Users,
  Timer,
  TrendingUp,
  AlertCircle,
  CalendarDays,
  Target,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  SortAsc,
  SortDesc,
  Flag,
  BellRing,
  CalendarClock,
  Shield,
  Eye,
  Repeat,
  ChevronDown
} from 'lucide-react'
import { api } from '@/services/api'

interface Deadline {
  id: string
  title: string
  description: string
  dueDate: string
  dueTime?: string
  caseId: string
  caseTitle: string
  type: 'court' | 'filing' | 'client' | 'internal' | 'statutory'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'completed' | 'overdue' | 'extended'
  assignedTo?: string
  reminder?: {
    enabled: boolean
    before: number // minutes
    sent?: boolean
  }
  recurring?: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    until?: string
  }
  notes?: string
  createdAt: string
  completedAt?: string
}

interface DeadlineStats {
  total: number
  pending: number
  overdue: number
  dueToday: number
  dueThisWeek: number
  completed: number
  completionRate: number
}

const mockDeadlines: Deadline[] = [
  {
    id: '1',
    title: 'File Defence Statement',
    description: 'Submit defence statement for Smith vs Johnson case',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    dueTime: '17:00',
    caseId: 'CASE-2024-001',
    caseTitle: 'Smith vs Johnson',
    type: 'court',
    priority: 'urgent',
    status: 'pending',
    assignedTo: 'John Smith',
    reminder: { enabled: true, before: 120 },
    notes: 'Ensure all evidence is attached',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    title: 'Client Meeting - Williams',
    description: 'Quarterly review meeting with client',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    dueTime: '14:30',
    caseId: 'CASE-2024-003',
    caseTitle: 'Williams Estate Planning',
    type: 'client',
    priority: 'medium',
    status: 'pending',
    assignedTo: 'John Smith',
    reminder: { enabled: true, before: 60 },
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    title: 'Submit Tax Returns',
    description: 'Annual tax filing deadline',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    caseId: 'INTERNAL-001',
    caseTitle: 'Firm Administration',
    type: 'statutory',
    priority: 'high',
    status: 'pending',
    recurring: { enabled: true, frequency: 'yearly' },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    title: 'Discovery Documents Due',
    description: 'Submit all discovery documents to opposing counsel',
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    caseId: 'CASE-2024-002',
    caseTitle: 'Brown vs State',
    type: 'court',
    priority: 'urgent',
    status: 'overdue',
    assignedTo: 'Jane Doe',
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>(mockDeadlines)
  const [filteredDeadlines, setFilteredDeadlines] = useState<Deadline[]>(mockDeadlines)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week' | 'overdue' | 'completed'>('all')
  const [selectedType, setSelectedType] = useState<'all' | Deadline['type']>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showAddDeadline, setShowAddDeadline] = useState(false)
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null)
  const [stats, setStats] = useState<DeadlineStats>({
    total: 0,
    pending: 0,
    overdue: 0,
    dueToday: 0,
    dueThisWeek: 0,
    completed: 0,
    completionRate: 0
  })

  useEffect(() => {
    filterAndSortDeadlines()
    calculateStats()
  }, [deadlines, selectedFilter, selectedType, searchQuery, sortBy, sortOrder, filterAndSortDeadlines, calculateStats])

  const calculateStats = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const pending = deadlines.filter(d => d.status === 'pending').length
    const overdue = deadlines.filter(d => d.status === 'overdue').length
    const completed = deadlines.filter(d => d.status === 'completed').length
    const dueToday = deadlines.filter(d => {
      const dueDate = new Date(d.dueDate)
      return d.status === 'pending' && 
        dueDate >= today && 
        dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }).length
    const dueThisWeek = deadlines.filter(d => {
      const dueDate = new Date(d.dueDate)
      return d.status === 'pending' && dueDate >= today && dueDate <= weekEnd
    }).length

    setStats({
      total: deadlines.length,
      pending,
      overdue,
      dueToday,
      dueThisWeek,
      completed,
      completionRate: deadlines.length > 0 ? Math.round((completed / deadlines.length) * 100) : 0
    })
  }

  const filterAndSortDeadlines = () => {
    let filtered = [...deadlines]

    // Apply status filter
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    switch (selectedFilter) {
      case 'today':
        filtered = filtered.filter(d => {
          const dueDate = new Date(d.dueDate)
          return d.status === 'pending' && 
            dueDate >= today && 
            dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
        })
        break
      case 'week':
        filtered = filtered.filter(d => {
          const dueDate = new Date(d.dueDate)
          return d.status === 'pending' && dueDate >= today && dueDate <= weekEnd
        })
        break
      case 'overdue':
        filtered = filtered.filter(d => d.status === 'overdue')
        break
      case 'completed':
        filtered = filtered.filter(d => d.status === 'completed')
        break
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(d => d.type === selectedType)
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.caseTitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.dueDate).getTime()
        const dateB = new Date(b.dueDate).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      } else {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
        const priorityA = priorityOrder[a.priority]
        const priorityB = priorityOrder[b.priority]
        return sortOrder === 'asc' ? priorityA - priorityB : priorityB - priorityA
      }
    })

    setFilteredDeadlines(filtered)
  }

  const getTypeIcon = (type: Deadline['type']) => {
    switch (type) {
      case 'court': return <Gavel className="h-4 w-4" />
      case 'filing': return <FileText className="h-4 w-4" />
      case 'client': return <Users className="h-4 w-4" />
      case 'internal': return <Briefcase className="h-4 w-4" />
      case 'statutory': return <Shield className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: Deadline['type']) => {
    switch (type) {
      case 'court': return 'text-purple-400 bg-purple-500/10'
      case 'filing': return 'text-blue-400 bg-blue-500/10'
      case 'client': return 'text-emerald-400 bg-emerald-500/10'
      case 'internal': return 'text-amber-400 bg-amber-500/10'
      case 'statutory': return 'text-rose-400 bg-rose-500/10'
    }
  }

  const getPriorityColor = (priority: Deadline['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-gray-400'
    }
  }

  const getStatusColor = (status: Deadline['status']) => {
    switch (status) {
      case 'pending': return 'text-blue-400 bg-blue-500/10'
      case 'completed': return 'text-emerald-400 bg-emerald-500/10'
      case 'overdue': return 'text-red-400 bg-red-500/10'
      case 'extended': return 'text-amber-400 bg-amber-500/10'
    }
  }

  const formatDeadlineDate = (dateString: string, timeString?: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    
    let dateText = ''
    
    if (date < today) {
      const daysAgo = Math.floor((today.getTime() - date.getTime()) / (24 * 60 * 60 * 1000))
      dateText = daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`
    } else if (date.toDateString() === today.toDateString()) {
      dateText = 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateText = 'Tomorrow'
    } else {
      const daysUntil = Math.floor((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
      if (daysUntil <= 7) {
        dateText = date.toLocaleDateString('en-GB', { weekday: 'long' })
      } else {
        dateText = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      }
    }

    if (timeString) {
      dateText += ` at ${timeString}`
    }

    return dateText
  }

  const handleCompleteDeadline = (id: string) => {
    setDeadlines(prev => prev.map(d => 
      d.id === id 
        ? { ...d, status: 'completed' as const, completedAt: new Date().toISOString() }
        : d
    ))
  }

  const handleDeleteDeadline = (id: string) => {
    setDeadlines(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-red-400" />
                Deadlines Management
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Track and manage all your legal deadlines</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Bell className="h-4 w-4 text-gray-400" />
            </button>
            <button 
              onClick={() => setShowAddDeadline(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Deadline
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-4 bg-black/30 border-b border-white/5">
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <CalendarDays className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-semibold text-white">{stats.total}</div>
            <div className="text-[10px] text-gray-500">All deadlines</div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-gray-500">Pending</span>
            </div>
            <div className="text-2xl font-semibold text-blue-400">{stats.pending}</div>
            <div className="text-[10px] text-gray-500">To complete</div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-gray-500">Overdue</span>
            </div>
            <div className="text-2xl font-semibold text-red-400">{stats.overdue}</div>
            <div className="text-[10px] text-gray-500">Need attention</div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Timer className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-gray-500">Today</span>
            </div>
            <div className="text-2xl font-semibold text-amber-400">{stats.dueToday}</div>
            <div className="text-[10px] text-gray-500">Due today</div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-gray-500">This Week</span>
            </div>
            <div className="text-2xl font-semibold text-purple-400">{stats.dueThisWeek}</div>
            <div className="text-[10px] text-gray-500">Next 7 days</div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-gray-500">Completed</span>
            </div>
            <div className="text-2xl font-semibold text-emerald-400">{stats.completionRate}%</div>
            <div className="text-[10px] text-gray-500">Completion rate</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'completed', label: 'Completed' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id as any)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  selectedFilter === filter.id
                    ? 'bg-red-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="relative">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors text-xs">
              <Filter className="h-3 w-3" />
              Type: {selectedType === 'all' ? 'All' : selectedType}
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortBy(sortBy === 'date' ? 'priority' : 'date')}
              className="px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors text-xs flex items-center gap-1"
            >
              Sort: {sortBy === 'date' ? 'Date' : 'Priority'}
            </button>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search deadlines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-sm w-64"
          />
        </div>
      </div>

      {/* Deadlines List */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        {filteredDeadlines.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <CalendarClock className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-400 mb-1">No deadlines found</h3>
              <p className="text-xs text-gray-500">Create a new deadline to get started</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDeadlines.map((deadline) => (
              <div
                key={deadline.id}
                className={`bg-white/5 border rounded-lg p-4 hover:bg-white/[0.07] transition-all ${
                  deadline.status === 'overdue' ? 'border-red-500/30' : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Type Icon */}
                    <div className={`p-2 rounded-lg ${getTypeColor(deadline.type)}`}>
                      {getTypeIcon(deadline.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-medium text-white mb-1">{deadline.title}</h3>
                          <p className="text-xs text-gray-400 mb-2">{deadline.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${getStatusColor(deadline.status)}`}>
                            {deadline.status === 'pending' && <Clock className="h-3 w-3" />}
                            {deadline.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                            {deadline.status === 'overdue' && <AlertTriangle className="h-3 w-3" />}
                            {deadline.status === 'extended' && <Timer className="h-3 w-3" />}
                            <span className="capitalize">{deadline.status}</span>
                          </span>
                          <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Briefcase className="h-3 w-3" />
                          <span>{deadline.caseTitle}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          <span className={deadline.status === 'overdue' ? 'text-red-400' : 'text-gray-300'}>
                            {formatDeadlineDate(deadline.dueDate, deadline.dueTime)}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 ${getPriorityColor(deadline.priority)}`}>
                          <Flag className="h-3 w-3" />
                          <span className="capitalize">{deadline.priority}</span>
                        </div>
                        {deadline.assignedTo && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Users className="h-3 w-3" />
                            <span>{deadline.assignedTo}</span>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <div className="flex items-center gap-3 mt-3">
                        {deadline.reminder?.enabled && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-300 rounded text-[10px]">
                            <BellRing className="h-3 w-3" />
                            <span>Reminder {deadline.reminder.before}m before</span>
                          </div>
                        )}
                        {deadline.recurring?.enabled && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-300 rounded text-[10px]">
                            <Repeat className="h-3 w-3" />
                            <span>Recurring {deadline.recurring.frequency}</span>
                          </div>
                        )}
                        {deadline.notes && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/10 text-gray-300 rounded text-[10px]">
                            <FileText className="h-3 w-3" />
                            <span>Has notes</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {deadline.status === 'pending' && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleCompleteDeadline(deadline.id)}
                        className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors"
                        title="Mark as complete"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSelectedDeadline(deadline)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deadline Details Modal */}
      {selectedDeadline && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Deadline Details</h2>
              <button
                onClick={() => setSelectedDeadline(null)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Title and Description */}
              <div>
                <h3 className="text-lg font-medium text-white mb-2">{selectedDeadline.title}</h3>
                <p className="text-sm text-gray-400">{selectedDeadline.description}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Due Date</div>
                  <div className="text-sm text-white">
                    {formatDeadlineDate(selectedDeadline.dueDate, selectedDeadline.dueTime)}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Case</div>
                  <div className="text-sm text-white">{selectedDeadline.caseTitle}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Type</div>
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${getTypeColor(selectedDeadline.type)}`}>
                      {getTypeIcon(selectedDeadline.type)}
                    </div>
                    <span className="text-sm text-white capitalize">{selectedDeadline.type}</span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Priority</div>
                  <div className={`text-sm font-medium capitalize ${getPriorityColor(selectedDeadline.priority)}`}>
                    {selectedDeadline.priority}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedDeadline.notes && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Notes</h4>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-300">{selectedDeadline.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm">
                  Edit Deadline
                </button>
                <button 
                  onClick={() => {
                    handleDeleteDeadline(selectedDeadline.id)
                    setSelectedDeadline(null)
                  }}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setSelectedDeadline(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors text-sm ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}