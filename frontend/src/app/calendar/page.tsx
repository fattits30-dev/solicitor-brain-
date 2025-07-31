'use client'

import { useState } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Users,
  Briefcase,
  Gavel,
  FileText,
  AlertCircle,
  CalendarDays,
  Settings,
  X,
  Calendar as CalendarIconSmall,
  User
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  type: 'hearing' | 'meeting' | 'deadline' | 'appointment' | 'task'
  date: string
  startTime: string
  endTime: string
  location?: string
  caseId?: string
  caseTitle?: string
  attendees?: string[]
  isAllDay?: boolean
  isRecurring?: boolean
  recurringPattern?: 'daily' | 'weekly' | 'monthly'
  reminder?: number // minutes before
  status?: 'confirmed' | 'tentative' | 'cancelled'
  color?: string
  notes?: string
}


const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Court Hearing - Smith vs Johnson',
    description: 'Preliminary hearing for contract dispute',
    type: 'hearing',
    date: new Date().toISOString().split('T')[0] || new Date().toISOString().substring(0, 10),
    startTime: '10:00',
    endTime: '12:00',
    location: 'Court Room 3A',
    caseId: 'CASE-2024-001',
    caseTitle: 'Smith vs Johnson',
    status: 'confirmed',
    reminder: 60
  },
  {
    id: '2',
    title: 'Client Meeting - Williams',
    description: 'Estate planning consultation',
    type: 'meeting',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
    startTime: '14:30',
    endTime: '15:30',
    location: 'Conference Room B',
    caseId: 'CASE-2024-003',
    caseTitle: 'Williams Estate',
    attendees: ['John Williams', 'Jane Williams'],
    status: 'confirmed',
    reminder: 30
  },
  {
    id: '3',
    title: 'Filing Deadline - Discovery Documents',
    type: 'deadline',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
    startTime: '17:00',
    endTime: '17:00',
    caseId: 'CASE-2024-002',
    caseTitle: 'Brown vs State',
    status: 'tentative',
    description: 'Submit discovery documents to opposing counsel'
  },
  {
    id: '4',
    title: 'Team Meeting',
    description: 'Weekly case review',
    type: 'meeting',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Main Office',
    isRecurring: true,
    recurringPattern: 'weekly',
    status: 'confirmed'
  }
]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [events] = useState<CalendarEvent[]>(mockEvents)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [filterType, setFilterType] = useState<'all' | CalendarEvent['type']>('all')
  const [showMiniCalendar, setShowMiniCalendar] = useState(true)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek }
  }

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateStr && (filterType === 'all' || event.type === filterType))
  }

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'hearing': return 'bg-purple-500'
      case 'meeting': return 'bg-blue-500'
      case 'deadline': return 'bg-red-500'
      case 'appointment': return 'bg-emerald-500'
      case 'task': return 'bg-amber-500'
      default: return 'bg-gray-500'
    }
  }

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'hearing': return <Gavel className="h-3 w-3" />
      case 'meeting': return <Users className="h-3 w-3" />
      case 'deadline': return <AlertCircle className="h-3 w-3" />
      case 'appointment': return <CalendarIconSmall className="h-3 w-3" />
      case 'task': return <FileText className="h-3 w-3" />
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-white/[0.02]" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const isToday = date.toDateString() === today.toDateString()
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
      const dayEvents = getEventsForDate(date)

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-32 p-2 border border-white/5 cursor-pointer transition-all ${
            isToday ? 'bg-blue-500/10' : 'bg-white/[0.02] hover:bg-white/5'
          } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-[10px] text-gray-500">{dayEvents.length}</span>
            )}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedEvent(event)
                }}
                className={`text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${getEventColor(event.type)} text-white`}
              >
                {event.startTime} {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-[10px] text-gray-500 text-center">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      )
    }

    // Empty cells for remaining days
    const totalCells = days.length
    const remainingCells = 35 - totalCells // 5 weeks × 7 days
    for (let i = 0; i < remainingCells; i++) {
      days.push(<div key={`empty-end-${i}`} className="h-32 bg-white/[0.02]" />)
    }

    return (
      <div className="grid grid-cols-7 gap-px bg-white/5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center py-2 text-xs font-medium text-gray-400 bg-black/30">
            {day}
          </div>
        ))}
        {days}
      </div>
    )
  }

  const renderDayView = () => {
    const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="flex h-full">
        {/* Time column */}
        <div className="w-20 flex-shrink-0 border-r border-white/5">
          {hours.map(hour => (
            <div key={hour} className="h-16 border-b border-white/5 pr-2 text-right">
              <span className="text-xs text-gray-500">
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* Events column */}
        <div className="flex-1 relative">
          {hours.map(hour => (
            <div key={hour} className="h-16 border-b border-white/5" />
          ))}
          
          {/* Render events */}
          {selectedDateEvents.map(event => {
            const startHour = parseInt(event.startTime.split(':')[0] || '0')
            const startMinute = parseInt(event.startTime.split(':')[1] || '0')
            const endHour = parseInt(event.endTime.split(':')[0] || '0')
            const endMinute = parseInt(event.endTime.split(':')[1] || '0')
            
            const top = (startHour * 64) + (startMinute * 64 / 60)
            const duration = ((endHour - startHour) * 60) + (endMinute - startMinute)
            const height = (duration * 64) / 60

            return (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`absolute left-2 right-2 p-2 rounded-lg cursor-pointer hover:opacity-90 ${getEventColor(event.type)}`}
                style={{ top: `${top}px`, height: `${height}px` }}
              >
                <div className="text-white">
                  <div className="text-xs font-medium truncate">{event.title}</div>
                  <div className="text-[10px] opacity-80">
                    {event.startTime} - {event.endTime}
                  </div>
                  {event.location && (
                    <div className="text-[10px] opacity-70 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-400" />
              Calendar
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 hover:bg-white/5 rounded transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </button>
              <h2 className="text-sm font-medium text-white min-w-[140px] text-center">
                {currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1.5 hover:bg-white/5 rounded transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-300"
              >
                Today
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Selector */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  viewMode === 'day' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Month
              </button>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Settings className="h-4 w-4 text-gray-400" />
            </button>
            <button
              onClick={() => {}}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Event
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 bg-black/30 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Show:</span>
          {[
            { id: 'all', label: 'All Events' },
            { id: 'hearing', label: 'Hearings', icon: Gavel },
            { id: 'meeting', label: 'Meetings', icon: Users },
            { id: 'deadline', label: 'Deadlines', icon: AlertCircle },
            { id: 'appointment', label: 'Appointments', icon: CalendarIconSmall },
            { id: 'task', label: 'Tasks', icon: FileText }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setFilterType(filter.id as any)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
                filterType === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {filter.icon && <filter.icon className="h-3 w-3" />}
              {filter.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowMiniCalendar(!showMiniCalendar)}
          className="p-1.5 hover:bg-white/5 rounded transition-colors"
        >
          <CalendarDays className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Mini Calendar & Day Events */}
        {showMiniCalendar && (
          <div className="w-80 border-r border-white/5 flex flex-col">
            {/* Mini Calendar */}
            <div className="p-4 border-b border-white/5">
              <div className="text-xs text-gray-400 mb-3">Quick View</div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="text-[10px] text-gray-500">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
                    const days = []
                    const today = new Date()
                    
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(<div key={`empty-${i}`} />)
                    }
                    
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                      const isToday = date.toDateString() === today.toDateString()
                      const hasEvents = getEventsForDate(date).length > 0
                      
                      days.push(
                        <button
                          key={day}
                          onClick={() => setSelectedDate(date)}
                          className={`text-[10px] h-6 rounded transition-all ${
                            isToday ? 'bg-blue-600 text-white' : 
                            hasEvents ? 'bg-white/10 text-white hover:bg-white/20' :
                            'text-gray-400 hover:bg-white/5'
                          }`}
                        >
                          {day}
                        </button>
                      )
                    }
                    
                    return days
                  })()}
                </div>
              </div>
            </div>

            {/* Selected Day Events */}
            {selectedDate && (
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="text-sm font-medium text-white mb-3">
                  {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No events scheduled</p>
                  ) : (
                    getEventsForDate(selectedDate).map(event => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full text-left p-3 bg-white/5 hover:bg-white/[0.07] rounded-lg transition-all"
                      >
                        <div className="flex items-start gap-2">
                          <div className={`p-1.5 rounded ${getEventColor(event.type)}`}>
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white truncate">{event.title}</div>
                            <div className="text-[10px] text-gray-400 mt-1">
                              {event.startTime} - {event.endTime}
                            </div>
                            {event.location && (
                              <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        <div className="flex-1 p-6 overflow-auto">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'day' && selectedDate && renderDayView()}
          {viewMode === 'week' && (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Week view coming soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Event Details</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getEventColor(selectedEvent.type)}`}>
                  {getEventIcon(selectedEvent.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white">{selectedEvent.title}</h3>
                  {selectedEvent.description && (
                    <p className="text-sm text-gray-400 mt-1">{selectedEvent.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Date & Time</div>
                  <div className="text-sm text-gray-300">
                    {new Date(selectedEvent.date).toLocaleDateString('en-GB', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </div>
                  <div className="text-sm text-gray-300">
                    {selectedEvent.startTime} - {selectedEvent.endTime}
                  </div>
                </div>
                {selectedEvent.location && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Location</div>
                    <div className="text-sm text-gray-300 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedEvent.location}
                    </div>
                  </div>
                )}
              </div>

              {selectedEvent.caseTitle && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Related Case</div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{selectedEvent.caseTitle}</span>
                  </div>
                </div>
              )}

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Attendees</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.attendees.map((attendee, idx) => (
                      <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-xs">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-300">{attendee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm">
                  Edit Event
                </button>
                <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm">
                  Delete
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
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